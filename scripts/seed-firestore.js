import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyARUB5rHEw_pMrzH4kHFkcRIoCA7dTtmys",
    authDomain: "shine-on-cosmetics.firebaseapp.com",
    projectId: "shine-on-cosmetics",
    storageBucket: "shine-on-cosmetics.firebasestorage.app",
    messagingSenderId: "454736529998",
    appId: "1:454736529998:web:65792f211c5750d7b1911f",
    measurementId: "G-FZZDR5745L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    console.log("Seeding Firestore...");
    try {
        await setDoc(doc(db, "app_settings", "global"), {
            acceptingOrders: true,
            useHardcodedData: true,
            maintenanceMode: false
        });

        const categories = ["Face", "Skin", "Hair", "Miscellaneous"];
        for (const name of categories) {
            await setDoc(doc(db, "categories", name.toLowerCase()), {
                name: name,
                slug: name.toLowerCase()
            });
        }
        console.log("Successfully seeded app_settings and initial categories!");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding Firestore:", e);
        process.exit(1);
    }
}

seed();
