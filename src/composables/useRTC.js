import { ref, onMounted, onUnmounted } from "vue";
import useFirebase from "src/boot/firebase.js";

const { firestore } = useFirebase();

const useRtc = () => {
  // snapshot handlers (used to unsubscribe on hang up)
  let unsubOfferCandidates = null;
  let unsubAnswerCandidates = null;
  let unsubCallDoc = null;

  const callId = ref("");
  const sessionName = ref("");

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
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    remoteVideo.srcObject = remoteStream;
    webcamVideo.srcObject = localStream;
  };

  //
  // Create an offer
  //
  const createCall = async () => {
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    // set call id
    callId.value = callDoc.id;

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

    // Listen for remote answer
    unsubCallDoc = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  //
  // answer call
  //
  const answerCall = async (callId) => {
    const callDoc = firestore.collection("calls").doc(callId);
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // Fetch data, then set the offer & answer

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    // Listen to offer candidates

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
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
    if (localStream) {
      const localtracks = localStream.getTracks();
      localtracks.forEach(function (track) {
        track.stop();
      });
    }

    // stop remote stream
    if (remoteStream) {
      const remotetracks = localStream.getTracks();
      remotetracks.forEach(function (track) {
        track.stop();
      });
    }

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

  return { callId, startWebCam, createCall, answerCall, hangUp };
};

export default useRtc;
