import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCbG9XyyMlxTtTXI7J__zxuu29MXJSiQp4",
  authDomain: "lateral-grail-fcf5x.firebaseapp.com",
  projectId: "lateral-grail-fcf5x",
  storageBucket: "lateral-grail-fcf5x.firebasestorage.app",
  messagingSenderId: "701473044495",
  appId: "1:701473044495:web:572476554432e01bfe0b7a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-mastervarejo-87eb8bfb-6706-4938-8428-c84015bfecaf");
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
