import {
  addDoc,
  getDoc,
  doc,
  onSnapshot,
  setDoc,
  collection,
  query,
} from "firebase/firestore";
import useFirebase from "src/boot/firebase";

const useRtc = () => {
  // db reference
  const { db } = useFirebase();

  // snapshot handlers (used to unsubscribe on hang up)
  let unsubAnswers = null;
  let unsubCandidates = null;
  let unsubCandidatesAnswer = null;

  // server config
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ], // free stun server
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
  // let callIdInput = null;

  //
  // Media setup
  //
  const startWebCam = async () => {
    console.log("start webcam");

    webcamVideo = document.getElementById("webcamVideo");
    remoteVideo = document.getElementById("remoteVideo");

    // setting local stream to the video from our camera
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    // initalizing the remote server to the mediastream
    remoteStream = new MediaStream();

    // Pushing tracks from local stream to peerConnection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    // displaying the video data from the stream to the webpage
    webcamVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;
  };

  //
  // Create an offer
  //
  const startCall = () => {
    return new Promise(async (resolve, reject) => {
      //
      // get ref to calls
      //
      const callDoc = collection(db, "calls");

      //
      // add new call document (it's id will be the call id)
      //
      const docRef = await addDoc(callDoc, {
        name: "dummy",
      });
      const callDocId = docRef.id;
      console.log("Document written with ID: ", callDocId);

      //
      // Get candidates for caller, save to db (will be fired by setLocalDescription)
      //
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          const offerDoc = collection(
            db,
            "calls",
            callDocId,
            "offerCandidates"
          );
          await addDoc(offerDoc, event.candidate.toJSON());
        }
      };

      //
      // config for offer and save to db
      //
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(doc(db, "calls", callDocId), offer);

      //
      // listen for remote answer
      //
      unsubAnswers = onSnapshot(doc(db, "calls", callDocId), (doc) => {
        console.log("answer: ", doc.data());
        const data = doc.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });

      // When answered, add candidate to peer connection
      const answerDoc = collection(db, "calls", docRef.id, "offerAnswers");
      const q = query(answerDoc);
      unsubCandidates = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate);
          }
        });
      });

      resolve(docRef.id);
    });
  };

  //
  // answer call
  //
  const answerCall = async (callId) => {
    console.log("answer call", callId);

    //
    // get call doc
    const docRef = doc(db, "calls", callId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }

    //
    // Get answers for caller, save to db (will be fired by setLocalDescription)
    //
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        const answerCandidates = collection(
          db,
          "calls",
          callId,
          "offerAnswers"
        );
        await addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = docSnap.data();
    await pc.setRemoteDescription(new RTCSessionDescription(callData));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    // await callDoc.update({ answer });
    await setDoc(doc(db, "calls", callId), answer);

    // When answered, add candidate to peer connection
    const candidatesDoc = collection(db, "calls", callId, "offerCandidates");
    const q = query(candidatesDoc);
    unsubCandidatesAnswer = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("snapshot candidatesAnswer", change.doc.data());
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };
  //
  // hang up
  //
  const hangUp = () => {
    // unsub
    if (unsubCandidates) {
      unsubCandidates();
    }
    if (unsubAnswers) {
      unsubAnswers();
    }
    if (unsubCandidatesAnswer) {
      unsubCandidatesAnswer();
    }
    // reset vars
    localStream = null;
    remoteStream = null;
    webcamVideo = null;
    remoteVideo = null;
    // callIdInput = null;
  };

  return { startWebCam, startCall, answerCall, hangUp };
};

export default useRtc;
