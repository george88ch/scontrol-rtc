/*---------------------------------------------------------*/
// useDb()
/*---------------------------------------------------------*/
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  collection,
  collectionGroup,
  where,
  getDocs,
} from "firebase/firestore";
import { uid } from "quasar";
import useFirebase from "src/boot/firebase";
import useUtils from "src/services/useUtils";

const { showNotify } = useUtils();

const useDb = () => {
  const { db } = useFirebase();

  /*---------------------------------------------------------*/
  // read document by id
  /*---------------------------------------------------------*/
  const fbReadById = (fbCollection, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const docRef = doc(db, fbCollection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          resolve(docSnap.data());
        } else {
          // doc.data() will be undefined in this case
          reject("No such document!");
        }
      } catch (error) {
        reject("Error: ", error);
      }
    });
  };

  /*---------------------------------------------------------*/
  // read all document
  /*---------------------------------------------------------*/
  const fbReadAll = async (fbCollection) => {
    return new Promise(async (resolve, reject) => {
      try {
        let list = [];
        const q = query(collection(db, fbCollection));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          list.push({ ...doc.data() });
        });
        resolve(list);
      } catch (error) {
        reject(error);
      }
    });
  };

  /*---------------------------------------------------------*/
  // save document
  /*---------------------------------------------------------*/
  // if no id exists or id is empty: create uid
  // add always updated as timestamp
  // add always user
  /*---------------------------------------------------------*/
  const fbSave = async (fbCollection, payload) => {
    return new Promise(async (resolve, reject) => {
      try {
        // id exists and not empty?
        if (payload["id"] === undefined || payload["id"].length == 0) {
          payload.id = uid();
        }
        // Add a new document in collection "slides"
        await setDoc(doc(db, fbCollection, payload.id), {
          ...payload,
          created: Date.now(),
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  /*---------------------------------------------------------*/
  // delete document by id
  /*---------------------------------------------------------*/
  const fbDeleteById = async (fbCollection, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        await deleteDoc(doc(db, fbCollection, id));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    fbReadById,
    fbReadAll,
    fbSave,
    fbDeleteById,

    /* fbReadWhere, fbDeleteAll, fbDeleteWhere */
  };
};

export default useDb;
