import { ref, onMounted, onUnmounted } from "vue";
import useFirebase from "src/boot/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

//---------------------------------------------------------
// Sample
//
//---------------------------------------------------------

export const useFirestore = () => {
  const { db } = useFirebase();

  const result = ref([]);

  const getAllDocs = async (collName) => {
    // let res = [];
    const querySnapshot = await getDocs(collection(db, collName));
    querySnapshot.forEach((doc) => {
      result.value.push(doc.data());
      // doc.data() is never undefined for query doc snapshots
    });
  };

  const newDoc = async (collName, payload) => {
    // Add a new document with a generated id.
    const docRef = await addDoc(collection(db, collName), payload);
    console.log("Document written with ID: ", docRef.id);
    return docRef;
  };

  const updateDoc = async (docRef, payload) => {
    await updateDoc(docRef, payload);
  };

  const deleteDoc = async (docRef) => {
    console.log("deleteDoc");
  };

  onMounted(() => {});

  return { result, getAllDocs, newDoc, updateDoc, deleteDoc };
};
