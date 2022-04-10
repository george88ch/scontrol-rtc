import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { storage } from "firebase/storage";

const useFirebase = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyDOYbHXcULh9lFLYvyj8_oxv84AAkJlHVw",
    authDomain: "scontrol-quasar.firebaseapp.com",
    projectId: "scontrol-quasar",
    storageBucket: "scontrol-quasar.appspot.com",
    messagingSenderId: "987144406400",
    appId: "1:987144406400:web:784301c020c45b228d2d65",
  };
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore();
  const auth = getAuth();

  return {
    app,
    db,
    auth,
  };
};

export default useFirebase;
