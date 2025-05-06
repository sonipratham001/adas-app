import { initializeApp, getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// Define the Firebase configuration type
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Your Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyA_SWkINKIJVHxxf11qx3IDRxDQFZizmdk",
  authDomain: "adas-system.firebaseapp.com",
  projectId: "adas-system",
  storageBucket: "adas-system.firebasestorage.app",
  messagingSenderId: "482309728891",
  appId: "1:482309728891:web:c9f315a7ddfc62ce1ad0de",
  measurementId: "G-3GXN5MW33K",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export modular Firebase services
export const auth = getAuth(getApp());
export const db = getFirestore(getApp());
export const storage = getStorage(getApp());

export default app;