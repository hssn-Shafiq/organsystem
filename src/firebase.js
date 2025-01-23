import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    // Add your Firebase configuration here
    apiKey: "AIzaSyABcrKZpDvuAXG70cEH18GkDFjmP8EcJvg",
    authDomain: "organdonor-82109.firebaseapp.com",
    projectId: "organdonor-82109",
    storageBucket: "organdonor-82109.firebasestorage.app",
    messagingSenderId: "165856902258",
    appId: "1:165856902258:web:b6ffc2759baccd4f03d6eb",
    measurementId: "G-MP513N5BP3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);