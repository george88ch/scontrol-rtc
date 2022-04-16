// import firebase from "firebase/app";
// import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOYbHXcULh9lFLYvyj8_oxv84AAkJlHVw",
  authDomain: "scontrol-quasar.firebaseapp.com",
  projectId: "scontrol-quasar",
  storageBucket: "scontrol-quasar.appspot.com",
  messagingSenderId: "987144406400",
  appId: "1:987144406400:web:784301c020c45b228d2d65",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const useRtc = () => {
  // snapshot handlers (used to unsubscribe on hang up)
  let unsubOfferCandidates = null;
  let unsubAnswerCandidates = null;
  let unsubCallDoc = null;

  // server config
  const servers = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302"], // free stun server
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // global states
  const pc = new RTCPeerConnection(servers);

  let localStream = null;
  let remoteStream = null;

  let webcamVideo = null;
  let remoteVideo = null;
  let callInput = null;

  //
  // Media setup
  //
  const startWebCam = async () => {
    webcamVideo = document.getElementById("webcamVideo");
    remoteVideo = document.getElementById("remoteVideo");

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      console.log("ontrack local", track);
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        console.log("ontrack remote", track);
        remoteStream.addTrack(track);
      });
    };

    remoteVideo.srcObject = remoteStream;
    webcamVideo.srcObject = localStream;

    // callButton.disabled = false;
    // answerButton.disabled = false;
    // webcamButton.disabled = true;
  };

  //
  // Create an offer
  //
  const createCall = (sessionName) => {
    return new Promise(async (resolve, reject) => {
      // Reference Firestore collections for signaling
      const callDoc = firestore.collection("calls").doc();
      const offerCandidates = callDoc.collection("offerCandidates");
      const answerCandidates = callDoc.collection("answerCandidates");

      // callInput = document.getElementById("callInput");
      // callInput.value = callDoc.id;

      // Get candidates for caller, save to db
      pc.onicecandidate = (event) => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
      };

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await callDoc.set({ offer });

      // create a doc with sessioname as id containing the callId
      // (will be used to get ad call id upon a sessionname)
      firestore
        .collection("callnames")
        .doc(sessionName)
        .set({
          callId: callDoc.id,
        })
        .then(() => {
          console.log("Document successfully written!");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });

      // Listen for remote answer
      unsubCallDoc = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });

      // When answered, add candidate to peer connection
      unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });

      //  return callId
      resolve({ id: callDoc.id, sessionname: sessionName });

      // hangupButton.disabled = false;
    });
  };

  //
  // answer call
  //
  const answerCall = (sessionName) => {
    return new Promise(async (resolve, reject) => {
      // get call id (with session name)
      const callId = await getCallId(sessionName);
      if (!callId) {
        console.log("error");
        reject("error");
      }

      // read offer
      // const callDoc = await getCallData(callId);
      // console.log("callDoc: ", callDoc);

      const callDoc = firestore.collection("calls").doc(callId);
      const answerCandidates = callDoc.collection("answerCandidates");
      const offerCandidates = callDoc.collection("offerCandidates");

      pc.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
      };
      const res = await callDoc.get();
      const callData = res.data();
      console.log(" 1 calData: ", callData);

      const offerDescription = callData.offer;
      await pc.setRemoteDescription(
        new RTCSessionDescription(offerDescription)
      );

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDoc.update({ answer });

      unsubOfferCandidates = offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            let data = change.doc.data();
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      resolve();
    });
  };
  //
  // hang up
  //
  const hangUp = () => {
    console.log("hangup");
    // unsub
    if (unsubOfferCandidates) {
      unsubOfferCandidates();
    }
    if (unsubAnswerCandidates) {
      unsubAnswerCandidates();
    }
    if (unsubCallDoc) {
      unsubCallDoc();
    }

    // stop local stream
    const localtracks = localStream.getTracks();
    localtracks.forEach(function (track) {
      track.stop();
    });

    // stop remote stream
    const remotetracks = localStream.getTracks();
    remotetracks.forEach(function (track) {
      track.stop();
    });

    // reset vars
    localStream = null;
    remoteStream = null;
    webcamVideo = null;
    remoteVideo = null;
    localStream = null;
  };

  const getCallId = (sessionName) => {
    return new Promise(async (resolve, reject) => {
      var docRef = firestore.collection("callnames").doc(sessionName);

      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            console.log("get callId:", doc.data());
            resolve(doc.data().callId);
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            reject("No call doc foun!");
          }
        })
        .catch((error) => {
          console.log("Error getting call document:", error);
        });
    });
  };

  const getCallData = (id) => {
    return new Promise(async (resolve, reject) => {
      console.log("callDocId: ", id);
      const docRef = firestore.collection("calls").doc(id);

      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            console.log("Document data:", doc.data());
            resolve(doc.data());
          } else {
            // doc.data() will be undefined in this case
            console.log("no call data found");
            reject("no call data found");
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    });
  };

  return { startWebCam, createCall, answerCall, hangUp };
};

export default useRtc;
