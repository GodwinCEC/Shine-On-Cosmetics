import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyARUB5rHEw_pMrzH4kHFkcRIoCA7dTtmys",
    authDomain: "shine-on-cosmetics.firebaseapp.com",
    projectId: "shine-on-cosmetics",
    storageBucket: "shine-on-cosmetics.firebasestorage.app",
    messagingSenderId: "454736529998",
    appId: "1:454736529998:web:65792f211c5750d7b1911f",
    measurementId: "G-FZZDR5745L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
