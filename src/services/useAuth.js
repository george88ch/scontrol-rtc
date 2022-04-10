/*---------------------------------------------------------*/
// useAuth()
/*---------------------------------------------------------*/
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import useFirebase from "src/boot/firebase";

const { auth } = useFirebase();

/*---------------------------------------------------------*/
// Auth Functions
/*---------------------------------------------------------*/
const useAuth = () => {
  // login
  const fbLogin = async (email, password) => {
    return new Promise(async (resolve, reject) => {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          resolve(user.uid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // logout
  const fbLogout = async () => {
    return new Promise((resolve, reject) => {
      auth
        .signOut()
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  // Create new user
  const fbRegister = async (email, password) => {
    return new Promise((resolve, reject) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          resolve(userCredential.user.uid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  return {
    fbLogin,
    fbLogout,
    fbRegister,
  };
};

export default useAuth;
