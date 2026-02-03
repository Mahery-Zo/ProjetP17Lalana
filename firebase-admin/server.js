import express from "express";
import axios from "axios";
import admin from "firebase-admin";
import fs from "fs";
import "dotenv/config";

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

// In Docker, use service name (web). Local fallback is optional.
const API_URL = process.env.API_URL || "http://web";

// Endpoint that returns paginated users to import into Firebase
const API_BASE = `${API_URL}/api/firebase/users`;

// Endpoint that receives users pulled from Firebase to upsert into Postgres
const POSTGRES_SYNC_ENDPOINT = `${API_URL}/api/firebase/users/sync-from-firebase`;

// Secret key to protect YOUR Node API endpoints (caller -> Node API)
const NODE_TRIGGER_KEY = process.env.NODE_TRIGGER_KEY;

// Key used when Node calls your existing API (Node -> existing API)
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
// Express app
// ----------------------------
const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * POST /api/import/users/from-postgres
 * Pull from API_BASE paginated and import into Firebase Auth.
 */
app.post("/api/import/users/from-postgres", requireTriggerKey, async (req, res) => {
  try {
    let page = 1;
    let totalImported = 0;
    let totalFailures = 0;
    let batches = 0;

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

        const okCount = importList.length - result.failureCount;
        totalImported += okCount;
        totalFailures += result.failureCount;
        batches++;

        // Optional: log failures server-side
        if (result.failureCount) {
          result.errors.forEach((e) => {
            const u = importList[e.index];
            console.error(
              `IMPORT FAIL index=${e.index} uid=${u?.uid} msg=${e.error.message}`
            );
          });
        }
      }

      if (meta?.last_page && page >= meta.last_page) break;
      page++;
    }

    return res.json({
      message: "Postgres/API ➜ Firebase import done",
      totalImported,
      totalFailures,
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

/**
 * POST /api/sync/users/from-firebase
 * Pull users from Firebase Auth and POST to POSTGRES_SYNC_ENDPOINT.
 */
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

    return res.json({
      message: "Firebase ➜ Postgres sync done",
      total,
      batches,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Sync failed",
      error: err.message,
      status: err.response?.status,
      body: err.response?.data,
    });
  }
});

// IMPORTANT for Docker: listen on 0.0.0.0 (not 127.0.0.1)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Node API running on 0.0.0.0:${PORT}`);
  console.log("API_URL =", API_URL);
  console.log("API_BASE =", API_BASE);
  console.log("POSTGRES_SYNC_ENDPOINT =", POSTGRES_SYNC_ENDPOINT);
  console.log("PER_PAGE =", PER_PAGE);
  console.log("FIREBASE_IMPORT_KEY =", FIREBASE_IMPORT_KEY ? "[SET]" : "undefined");
  console.log("NODE_TRIGGER_KEY =", NODE_TRIGGER_KEY ? "[SET]" : "undefined");
});
