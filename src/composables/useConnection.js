import { ref, onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import useFirebase from "src/boot/firebase.js";
import { useSessionStore } from "src/stores/session";

const useConnection = () => {
  const { firestore } = useFirebase();
  const store = useSessionStore();

  //
  // handlers
  //

  const handleICEGatheringStateChangeEvent = () => {
    store.log("handleICEGatheringStateChangeEvent");
  };

  // const handleICECandidateEvent = async () => {
  //   store.log("onicecandidate");
  // };

  const handleTrackEvent = () => {
    store.log("handleTrackEvent");
  };

  const handleNegotiationNeededEvent = async () => {
    store.log("handleNegotiationNeededEvent");
  };

  const handleRemoveTrackEvent = () => {
    store.log("handleRemoveTrackEvent");
  };
  const oniceconnectionstatechange = () => {
    store.log("oniceconnectionstatechange ");
  };
  const handleICEConnectionStateChangeEvent = () => {
    store.log("handleICEConnectionStateChangeEvent");
  };
  const onicegatheringstatechange = () => {
    store.log("onicegatheringstatechange");
  };

  const handleSignalingStateChangeEvent = () => {
    store.log("handleSignalingStateChangeEvent");
  };

  const answerCall = async () => {
    store.log("answer call.");
    //
    // create peer connection
    //

    store.peerConnection = new RTCPeerConnection(servers);
    store.log("answerCall: peer connection created.");
    // set up listeners
    setUpConnectionListener();

    // read connection document
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

    const answerDescription = await store.peerConnection.createAnswer();
    await store.peerConnection.setLocalDescription(answerDescription);

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
          store.peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  onUnmounted(async () => {
    await cleanUp();
  });

  return {
    // createPeerConnection,
    createCall,
    answerCall,
    cleanUp,
    // handleDataChannel,
    sendMessage,
  };
};

export default useConnection;
