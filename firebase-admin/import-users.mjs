import admin from "firebase-admin";
import fs from "fs";

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"))
  ),
});

const users = JSON.parse(fs.readFileSync("./users.json", "utf8"));

function toBcryptBytes(laravelBcryptHash) {
  const normalized = laravelBcryptHash.replace("$2y$", "$2a$");
  return Buffer.from(normalized, "utf8");
}

async function run() {
  const batchSize = 1000;

  for (let i = 0; i < users.length; i += batchSize) {
    const chunk = users.slice(i, i + batchSize);

    const importList = chunk
      .filter((u) => u.email && u.passwordHashBcrypt)
      .map((u) => ({
        uid: u.uid ? String(u.uid) : undefined,
        email: u.email,
        displayName: u.displayName || undefined,
        emailVerified: !!u.emailVerified,
        passwordHash: toBcryptBytes(u.passwordHashBcrypt),
      }));

    if (importList.length === 0) continue;

    const result = await admin.auth().importUsers(importList, {
      hash: { algorithm: "BCRYPT" },
    });

    console.log(`Imported ${importList.length} users`);
    if (result.failureCount) {
      console.log("Failures:", result.failureCount);
      result.errors.forEach((e) => {
        console.log(`- index=${e.index}, reason=${e.error.message}`);
      });
    }
  }
}

run().catch(console.error);
