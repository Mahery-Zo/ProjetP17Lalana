import express from "express";
import axios from "axios";
import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "5mb" }));

const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-TRIGGER-KEY", "Accept"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ----------------------------
// Firebase Admin init
// ----------------------------
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"))
  ),
});

// ----------------------------
// Config (.env)
// ----------------------------
const PORT = Number(process.env.PORT || 5050);
const API_URL = process.env.API_URL || "http://web";

const API_BASE = `${API_URL}/api/firebase/users`;
const POSTGRES_SYNC_ENDPOINT = `${API_URL}/api/firebase/users/sync-from-firebase`;

const NODE_TRIGGER_KEY = process.env.NODE_TRIGGER_KEY;
const FIREBASE_IMPORT_KEY = process.env.FIREBASE_IMPORT_KEY;

const PER_PAGE = Number(process.env.PER_PAGE || 1000);

// ----------------------------
// Basic checks
// ----------------------------
if (!NODE_TRIGGER_KEY) {
  console.error("❌ NODE_TRIGGER_KEY missing. Add it in .env");
  process.exit(1);
}
if (!FIREBASE_IMPORT_KEY) {
  console.error("❌ FIREBASE_IMPORT_KEY missing. Add it in .env");
  process.exit(1);
}

// ----------------------------
// Security middleware
// ----------------------------
function requireTriggerKey(req, res, next) {
  const key = req.header("X-TRIGGER-KEY");
  if (!key || key !== NODE_TRIGGER_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Laravel bcrypt ($2y$ → $2a$)
function toBcryptBytes(hash) {
  const normalized = hash.replace("$2y$", "$2a$");
  return Buffer.from(normalized, "utf8");
}

// ----------------------------
// Helpers
// ----------------------------
async function fetchPage(page) {
  const res = await axios.get(API_BASE, {
    params: { page, per_page: PER_PAGE },
    headers: {
      "X-IMPORT-KEY": FIREBASE_IMPORT_KEY,
      Accept: "application/json",
    },
    timeout: 30000,
  });
  return res.data;
}

// ----------------------------
// Routes
// ----------------------------
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/import/users/from-postgres", requireTriggerKey, async (req, res) => {
  try {
    let page = 1;

    let totalImported = 0;
    let skippedAlreadyExists = 0;
    let hardFailures = 0;
    let batches = 0;

    const ALREADY_EXISTS_CODES = new Set([
      "auth/uid-already-exists",
      "auth/email-already-exists",
      "auth/phone-number-already-exists",
    ]);

    const isAlreadyExists = (err) => {
      const code = err?.code || "";
      const msg = (err?.message || "").toLowerCase();
      return (
        ALREADY_EXISTS_CODES.has(code) ||
        msg.includes("already exists") ||
        msg.includes("already-exists")
      );
    };

    while (true) {
      const response = await fetchPage(page);
      const users = response.data;
      const meta = response.meta;

      if (!users || users.length === 0) break;

      const importList = users
        .filter((u) => u.email && u.passwordHashBcrypt)
        .map((u) => ({
          uid: String(u.uid),
          email: u.email,
          displayName: u.displayName || undefined,
          emailVerified: !!u.emailVerified,
          disabled: !!u.disabled,
          passwordHash: toBcryptBytes(u.passwordHashBcrypt),
        }));

      if (importList.length > 0) {
        const result = await admin.auth().importUsers(importList, {
          hash: { algorithm: "BCRYPT" },
        });

        let batchSkipped = 0;
        let batchHardFailures = 0;

        if (result.failureCount && result.errors?.length) {
          for (const e of result.errors) {
            const u = importList[e.index];
            const err = e.error;

            if (isAlreadyExists(err)) {
              batchSkipped++;
              console.log(
                `SKIP (exists) index=${e.index} uid=${u?.uid} email=${u?.email} code=${err?.code}`
              );
            } else {
              batchHardFailures++;
              console.error(
                `FAIL index=${e.index} uid=${u?.uid} email=${u?.email} code=${err?.code} msg=${err?.message}`
              );
            }
          }
        }

        const batchImported = importList.length - (batchSkipped + batchHardFailures);

        totalImported += batchImported;
        skippedAlreadyExists += batchSkipped;
        hardFailures += batchHardFailures;
        batches++;

        console.log(
          `✅ batch imported=${batchImported} | skipped(exists)=${batchSkipped} | hardFailures=${batchHardFailures}`
        );
      }

      if (meta?.last_page && page >= meta.last_page) break;
      page++;
    }

    return res.json({
      message: "Postgres/API ➜ Firebase import done (re-runs skip existing users)",
      totalImported,
      skippedAlreadyExists,
      hardFailures,
      batches,
      pagesProcessed: page,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Import failed",
      error: err.message,
      status: err.response?.status,
      body: err.response?.data,
    });
  }
});

app.post("/api/sync/users/from-firebase", requireTriggerKey, async (req, res) => {
  try {
    let nextPageToken = undefined;
    let total = 0;
    let batches = 0;

    do {
      const r = await admin.auth().listUsers(1000, nextPageToken);

      const users = r.users.map((u) => ({
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        disabled: !!u.disabled,
        emailVerified: !!u.emailVerified,
        role: u.customClaims?.role || null,
      }));

      await axios.post(
        POSTGRES_SYNC_ENDPOINT,
        { users },
        {
          headers: {
            "X-IMPORT-KEY": FIREBASE_IMPORT_KEY,
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      total += users.length;
      batches++;
      nextPageToken = r.pageToken;
    } while (nextPageToken);

    return res.json({ message: "Firebase ➜ Postgres sync done", total, batches });
  } catch (err) {
    return res.status(500).json({
      message: "Sync failed",
      error: err.message,
      status: err.response?.status,
      body: err.response?.data,
    });
  }
});

// ----------------------------
// Listen
// ----------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Node API running on 0.0.0.0:${PORT}`);
  console.log("API_URL =", API_URL);
  console.log("API_BASE =", API_BASE);
  console.log("POSTGRES_SYNC_ENDPOINT =", POSTGRES_SYNC_ENDPOINT);
  console.log("PER_PAGE =", PER_PAGE);
  console.log("FIREBASE_IMPORT_KEY =", FIREBASE_IMPORT_KEY ? "[SET]" : "undefined");
  console.log("NODE_TRIGGER_KEY =", NODE_TRIGGER_KEY ? "[SET]" : "undefined");
});
