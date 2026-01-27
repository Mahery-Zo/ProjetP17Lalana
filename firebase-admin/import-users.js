import admin from "firebase-admin";
import fs from "fs";
import axios from "axios";
import "dotenv/config"; 

// Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"))
  ),
});

// ✅ CONFIG (depuis .env)
const API_URL = process.env.API_URL || "http://127.0.0.1:8000";
const API_BASE = `${API_URL}/api/firebase/users`;
const API_KEY = process.env.FIREBASE_IMPORT_KEY; 
const PER_PAGE = 1000;

console.log("API_URL =", API_URL);
console.log("FIREBASE_IMPORT_KEY =", API_KEY ? "[SET]" : "undefined");

if (!API_KEY) {
  console.error("❌ FIREBASE_IMPORT_KEY manquant. Ajoute-le dans firebase-admin/.env");
  process.exit(1);
}

// Laravel bcrypt ($2y$ → $2a$)
function toBcryptBytes(hash) {
  const normalized = hash.replace("$2y$", "$2a$");
  return Buffer.from(normalized, "utf8");
}

async function fetchPage(page) {
  const res = await axios.get(API_BASE, {
    params: { page, per_page: PER_PAGE },
    headers: {
      "X-IMPORT-KEY": API_KEY,
      "Accept": "application/json",
    },
    timeout: 30000,
  });

  return res.data;
}

async function run() {
  let page = 1;
  let totalImported = 0;

  while (true) {
    console.log(`Fetching page ${page}...`);

    const response = await fetchPage(page);
    const users = response.data;
    const meta = response.meta;

    if (!users || users.length === 0) {
      console.log("✅ No more users");
      break;
    }

    const importList = users
      .filter((u) => u.email && u.passwordHashBcrypt)
      .map((u) => ({
        uid: String(u.uid), // Firebase uid est string
        email: u.email,
        displayName: u.displayName || undefined,
        emailVerified: !!u.emailVerified,
        disabled: !!u.disabled,
        passwordHash: toBcryptBytes(u.passwordHashBcrypt),
      }));

    if (importList.length === 0) {
      page++;
      continue;
    }

    const result = await admin.auth().importUsers(importList, {
      hash: { algorithm: "BCRYPT" },
    });

    totalImported += importList.length - result.failureCount;

    console.log(`✅ Imported: ${importList.length - result.failureCount}`);
    console.log(`⚠️ Failures: ${result.failureCount}`);

    if (result.failureCount) {
      result.errors.forEach((e) => {
        console.error(
          `index=${e.index} | uid=${importList[e.index]?.uid} | ${e.error.message}`
        );
      });
    }

    if (page >= meta.last_page) break;
    page++;
  }

  console.log(`🎉 DONE — Total imported: ${totalImported}`);
}

run().catch((err) => {
  console.error("❌ Import failed:", err.message);
  console.error("Status:", err.response?.status);
  console.error("Body:", err.response?.data);
  process.exit(1);
});
