import { ref, onMounted, onUnmounted } from "vue";
import useFirebase from "src/boot/firebase.js";

const { firestore } = useFirebase();

const useRtc = () => {
  // snapshot handlers (used to unsubscribe on hang up)
  let unsubOfferCandidates = null;
  let unsubAnswerCandidates = null;
  let unsubCallDoc = null;

  let sendChannel = null;

  const callId = ref("");

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
  // Start data channel
  //
  const startDataChannel = async () => {
    console.log("localConnection", pc);
    sendChannel = pc.createDataChannel("sendChannel");
    console.log("sendChannel", sendChannel);

    sendChannel.onopen = handleSendChannelStatusChange;
    sendChannel.onclose = handleSendChannelStatusChange;
  };

  const handleSendChannelStatusChange = () => {
    if (sendChannel) {
      console.log("ready state: ", sendChannel.readyState);
      var state = sendChannel.readyState;

      if (state === "open") {
        messageInputBox.disabled = false;
        messageInputBox.focus();
        sendButton.disabled = false;
        disconnectButton.disabled = false;
        connectButton.disabled = true;
      } else {
        messageInputBox.disabled = true;
        sendButton.disabled = true;
        connectButton.disabled = false;
        disconnectButton.disabled = true;
      }
    }
  };

  const sendMessage = async (msg) => {
    if (!sendChannel) {
      await startDataChannel();
    }
    sendChannel.send(msg);
  };

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
      console.log("createCall: onicecandidate");
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
        console.log("new answer");
      }
    });

    // Listen for remote ICE candidates
    unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
          console.log("new candidate");
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
      console.log("answerCall: onicecandidate");
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
  const hangUp = async () => {
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

    return true;
  };

  return {
    callId,
    startDataChannel,
    startWebCam,
    createCall,
    answerCall,
    hangUp,
    sendMessage,
  };
};

export default useRtc;
