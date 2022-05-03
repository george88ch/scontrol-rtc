import { ref, onMounted, onUnmounted } from "vue";
import useFirebase from "src/boot/firebase.js";

const useRtcConnection = () => {
  const { firestore } = useFirebase();
  // snapshot handlers (used to unsubscribe on hang up)
  let unsubOfferCandidates = null;
  let unsubAnswerCandidates = null;
  let unsubCallDoc = null;

  // connection id (will be needed for joining the connection)
  const connectionId = ref("");
  const message = ref("");

  // server config
  const servers = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302"], // free stun server
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // initiate peer connection
  const peerConnection = new RTCPeerConnection(servers);

  // RTCPeerConnections
  let localConnection = null;
  let remoteConnection = null;

  //  RTCDataChannel handlers for sender (local) and receiver (remote)
  let sendChannel = null; // RTCDataChannel for the local (sender)
  let receiveChannel = null; // RTCDataChannel for the remote (receiver)

  // video handler
  let localStream = null;
  let remoteStream = null;
  let webcamVideo = null;
  let remoteVideo = null;

  //
  // Create an offer
  //
  const createCall = async () => {
    // Create new call document and save its id
    const callDoc = firestore.collection("calls").doc();
    // set call id
    connectionId.value = callDoc.id;

    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    // Get candidates for caller, save to db
    // ice candidate provides the information about the ipaddress and port from where the data is going to be exchanged.
    peerConnection.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    // write offer to call document (db)
    await callDoc.set({ offer });

    // Listen for remote answer
    unsubCallDoc = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };

  //
  // answer call
  //
  const answerCall = async (callId) => {
    // read call doc from db
    const callDoc = firestore.collection("calls").doc(callId);

    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    peerConnection.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // Fetch data, then set the offer & answer
    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    // Listen to offer candidates

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log("offerCandidate added", change);
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  //
  // send message
  //
  const sendMessage = () => {
    console.log("sending message");
    sendChannel.send(message.value);

    // @TODO Clear the input box and re-focus it, so that we're
    // ready for the next message.
    // messageInputBox.value = "";
    // messageInputBox.focus();
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

    // Close the connection, including data channels if they're open.
    // Also update the UI to reflect the disconnected status.
    // Close the RTCDataChannels if they're open.
    sendChannel.close();
    receiveChannel.close();

    // Close the RTCPeerConnections

    localConnection.close();
    remoteConnection.close();

    // reset vars
    sendChannel = null;
    receiveChannel = null;
    localConnection = null;
    remoteConnection = null;
    localStream = null;
    remoteStream = null;
    webcamVideo = null;
    remoteVideo = null;
    localStream = null;
    peerConnection = null;

    return true;
  };

  return {
    createCall,
    answerCall,
    hangUp,
    sendMessage,
    message,
    connectionId,
  };
};

export default useRtcConnection;
