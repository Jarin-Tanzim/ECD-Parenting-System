import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAadDplf8WL1fmCwPEP76tfQ0T1V4BDYTA",
  authDomain: "ecd-parenting-system.firebaseapp.com",
  projectId: "ecd-parenting-system",
  storageBucket: "ecd-parenting-system.firebasestorage.app",
  messagingSenderId: "468532164783",
  appId: "1:468532164783:web:985087ca01ff2088793c5a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;