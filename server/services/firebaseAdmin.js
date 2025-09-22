import admin from "firebase-admin";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Helpers to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your Firebase service account JSON file
const serviceAccountPath = path.resolve(__dirname, "./serviceAccountKey.json");

const serviceAccountJson = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson),
});

export default admin;
