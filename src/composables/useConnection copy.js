import { ref, onMounted, onUnmounted } from "vue";
import { date } from "quasar";
import useFirebase from "src/boot/firebase.js";
import { useSessionStore } from "src/stores/session";

const useConnection = () => {
  const { firestore } = useFirebase();
  const store = useSessionStore();

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

  const setUpConnectionListener = async () => {
    //
    // set up connection listeners
    //
    // store.peerConnection.onicecandidate = handleICECandidateEvent;
    store.peerConnection.ondatachannel = handleDataChannel;
    store.peerConnection.ontrack = handleTrackEvent;
    store.peerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    store.peerConnection.onremovetrack = handleRemoveTrackEvent;
    store.peerConnection.oniceconnectionstatechange =
      handleICEConnectionStateChangeEvent;
    store.peerConnection.onicegatheringstatechange =
      handleICEGatheringStateChangeEvent;
    store.peerConnection.onsignalingstatechange =
      handleSignalingStateChangeEvent;

    store.peerConnection.ondatachannel = (ev) => {
      store.log("ondatachannel fired.");
      store.dataChannel = ev.channel;
    };
    store.log("listeners invoked.");
  };

  //
  // set up data channel listeners
  //
  const setUpDataChannelListeners = () => {
    store.log("set data channel listeners.");
    store.dataChannel.onmessage = (ev) => {
      store.log("onmessage" + ev.data);
    };
    store.dataChannel.onopen = () => {
      store.log("onopen");
    };
    store.dataChannel.onclose = () => {
      store.log("onclose");
    };
  };

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

  //
  // Create call
  //
  const createCall = async () => {
    store.log("create call.");
    //
    // create peer connection if no one exists
    //
    if (!store.peerConnection) {
      store.peerConnection = new RTCPeerConnection(servers);
      store.log("createCall: peer connection created.");
      // set up connection listeners
      setUpConnectionListener();
    }
    // firestore references
    const callDoc = firestore.collection("calls").doc(); // creates an empty document, returns its id
    //
    // create connection document
    //
    store.connectionId = callDoc.id;
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    // Get candidates for caller, save to db
    store.peerConnection.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
      store.log("onicecandidate fired.");
    };

    //
    // open data channel (invokes onicecandidate)
    //
    store.dataChannel = await store.peerConnection.createDataChannel(
      "my channel"
    );
    setUpDataChannelListeners();

    //
    // Create offer
    //
    const offerDescription = await store.peerConnection.createOffer();
    await store.peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    //
    // Listen for remote answer
    //
    unsubCallDoc = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!store.peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        store.peerConnection.setRemoteDescription(answerDescription);
      }
    });

    //
    // Listen for remote ICE candidates
    //
    unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          store.peerConnection.addIceCandidate(candidate);
        }
      });
    });
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

  //
  // Data channel
  //
  const handleDataChannel = async (ev) => {
    store.log("handle data channel");
    store.dataChannel = ev.channel;
    setUpDataChannelListeners();
  };

  const sendMessage = async (msg) => {
    let obj = {
      message: msg,
      timestamp: new Date(),
    };
    store.dataChannel.send(JSON.stringify(obj));
  };

  //
  // reset connection
  //
  const cleanUp = async () => {
    store.log("resetConnection fired");
    //
    // reset db listener
    //
    if (unsubAnswerCandidates) {
      unsubAnswerCandidates();
    }
    if (unsubOfferCandidates) {
      unsubOfferCandidates();
    }
    if (unsubCallDoc) {
      unsubCallDoc();
    }
    //
    // reset and close connection
    //
    store.resetConnection();
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
