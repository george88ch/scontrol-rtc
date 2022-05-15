import { ref, onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import useFirebase from "src/boot/firebase.js";
import { useSessionStore } from "src/stores/session";

const useRtcConnection = () => {
  const { firestore } = useFirebase();
  const store = useSessionStore();

  // firestore snapshot handlers (used to unsubscribe on hang up)
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

  //
  // onMounted: initiate RPC connection and webcam
  //
  onMounted(() => {
    // create connection (if no connection exists yet)
    if (!store.peerConnection) {
      store.peerConnection = new RTCPeerConnection(servers);
      log("RTC Connection initiated.");
    }

    // get DOM elements (if not yet done)
    if (!store.webcamVideo) {
      store.webcamVideo = document.getElementById("webcamVideo");
      store.remoteVideo = document.getElementById("remoteVideo");
      log("local and remote video element set.");
    }
  });

  //
  // Cleanup
  //
  onUnmounted(() => {
    store.resetConnection();
  });

  //
  // Media (invoked by button in frontend)
  //
  const startWebcam = async () => {
    // setting local stream to the video from our camera
    store.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    // Pushing tracks from local stream to peerConnection
    store.localStream.getTracks().forEach((track) => {
      store.peerConnection.addTrack(track, store.localStream);
    });

    // prepare remote video mediastream
    store.remoteStream = new MediaStream();

    // pull tracks from remote stream, add to video stream
    store.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks((track) => {
        store.remoteStream.addTrack(track);
      });
    };
    store.remoteVideo.srcObject = store.remoteStream;

    // displaying the video data from the stream to the webpage
    store.webcamVideo.srcObject = store.localStream;
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
    store.connectionId = callDoc.id;
    log("Connection created " + store.connectionId);

    // initiate data channel (will trigger signaling)
    store.dataChannel = store.peerConnection.createDataChannel("datachannel");

    // Get candidates for caller, save to db
    store.peerConnection.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await store.peerConnection.createOffer();
    await store.peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    unsubCallDoc = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!store.peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        store.peerConnection.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          store.peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };

  //
  // answer call
  //
  const answerCall = async () => {
    // read call doc from db
    const callDoc = firestore.collection("calls").doc(store.connectionId);
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    store.peerConnection.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // Fetch data, then set the offer & answer
    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await store.peerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    log("Answer created.");

    const answerDescription = await store.peerConnection.createAnswer();
    await store.peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    log("Call answered");

    // Listen to offer candidates

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          store.peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  //
  // send message
  //
  const sendMessage = async (msg) => {
    log("sending message");
    await store.dataChannel.send(msg);

    // @TODO Clear the input box and re-focus it, so that we're
    // ready for the next message.
    // messageInputBox.value = "";
    // messageInputBox.focus();
  };

  const createDataChannel = async () => {
    store.dataChannel = await store.peerConnection.createDataChannel(
      "datachannel"
    );
    log("Datachannel created.");

    store.dataChannel.onmessage = function (event) {
      log("received: " + event.data);
      store.messageList.push(event.data);
    };

    store.dataChannel.onopen = function () {
      log("datachannel open");
    };

    store.dataChannel.onclose = function () {
      log("datachannel close");
    };
  };

  //
  // hang up
  //
  const hangUp = async () => {
    log("hangup");
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
    if (store.localStream) {
      const localtracks = store.localStream.getTracks();
      localtracks.forEach(function (track) {
        track.stop();
      });
    }

    // stop remote stream
    if (store.remoteStream) {
      const remotetracks = store.remoteStream.getTracks();
      remotetracks.forEach(function (track) {
        track.stop();
      });
    }

    // Close the connection, including data channels if they're open.
    // Also update the UI to reflect the disconnected status.
    // Close the RTCDataChannels if they're open.
    store.dataChannel.close();

    // reset vars
    dataChannel = null;
    receiveChannel = null;
    localStream = null;
    remoteStream = null;
    webcamVideo = null;
    remoteVideo = null;
    localStream = null;
    peerConnection = null;

    return true;
  };

  //
  // Montior entries for debugging and logging
  //
  const log = (msg) => {
    console.log("log: ", msg);
    const formattedString = date.formatDate(Date.now(), "DD.MM.YYYY HH:mm:ss");
    const logentry = {
      timestamp: formattedString,
      content: msg,
    };
    store.monitor.push(logentry);
  };

  return {
    startWebcam,
    createCall,
    answerCall,
    hangUp,
    sendMessage,
  };
};

export default useRtcConnection;
