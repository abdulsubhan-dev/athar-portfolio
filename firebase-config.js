// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCy3Y2-1vp5KnOUC8zJw3yBFTU7C1OAQXA",
  authDomain: "athar-portfolio.firebaseapp.com",
  projectId: "athar-portfolio",
  storageBucket: "athar-portfolio.firebasestorage.app",
  messagingSenderId: "224673566659",
  appId: "1:224673566659:web:8f44aa3ca80ba23de0b776",
  measurementId: "G-FRJ8J9NWGC"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };