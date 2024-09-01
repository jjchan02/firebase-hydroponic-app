const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

const serviceAccount = require("./creds.json");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "gs://your-custom-storage-bucket-url.appspot.com",
});

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

module.exports = { db, storage, auth, admin };
