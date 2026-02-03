import admin from "firebase-admin";
import fs from "fs";
import axios from "axios";
import "dotenv/config";

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"))
  ),
});

const API_URL = process.env.API_URL || "http://127.0.0.1:8000";
const POSTGRES_SYNC_ENDPOINT = `${API_URL}/api/firebase/users/sync-from-firebase`;
const API_KEY = process.env.FIREBASE_IMPORT_KEY;

async function run() {
  let nextPageToken = undefined;
  let total = 0;

  do {
    const res = await admin.auth().listUsers(1000, nextPageToken);
    const users = res.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      emailVerified: u.emailVerified,
      // custom claims
      role: u.customClaims?.role || null,
    }));

    // send to Laravel to upsert into postgres
    await axios.post(
      POSTGRES_SYNC_ENDPOINT,
      { users },
      { headers: { "X-IMPORT-KEY": API_KEY, Accept: "application/json" } }
    );

    total += users.length;
    console.log(`✅ pulled+synced ${users.length}, total=${total}`);

    nextPageToken = res.pageToken;
  } while (nextPageToken);

  console.log("🎉 DONE");
}

run().catch(err => {
  console.error(err.message);
  console.error(err.response?.data);
});




app.post("/sync/users/from-firebase", requireTriggerKey, async (req, res) => {
  try {
    let nextPageToken = undefined;
    let total = 0;
    let batches = 0;

    do {
      const r = await admin.auth().listUsers(1000, nextPageToken);

      const users = r.users.map(u => ({
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
            "X-IMPORT-KEY": API_KEY,
            "Accept": "application/json",
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
