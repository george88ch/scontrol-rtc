import { defineStore } from "pinia";
import { date } from "quasar";
import { store } from "quasar/wrappers";
import useFirebase from "src/boot/firebase.js";

const { firestore } = useFirebase();

export const useSessionStore = defineStore("session", {
  state: () => ({
    // Monitor (for logging)
    monitor: [
      // {
      //   timestamp: new Date.now(),
      //   content: "fgfdgs",
      // },
    ],

    // RTC Connection
    connectionId: "",
    peerConnection: null,
    dataChannel: null,
    localStream: null,
    remoteStream: null,

    // DOM elements
    webcamVideo: null,
    remoteVideo: null,

    // chat
    message: "",
    messageList: [],

    // snapshot handlers (used to unsubscribe on hang up)
    unsubOfferCandidates: null,
    unsubAnswerCandidates: null,
    unsubCallDoc: null,

    // server config
    servers: {
      iceServers: [
        {
          urls: ["stun:stun1.l.google.com:19302"], // free stun server
        },
      ],
      iceCandidatePoolSize: 10,
    },
  }),

  getters: {
    doubleCount(state) {
      return state.counter * 2;
    },
  },

  actions: {
    //
    // set up connection listeners
    //
    async setUpConnectionListener() {
      // store.peerConnection.onicecandidate = handleICECandidateEvent;
      this.peerConnection.ondatachannel = (ev) => {
        this.log("ondatachannel fired.");
        this.dataChannel = ev.channel;
      };

      // this.peerConnection.addtrack = () => {
      //   this.log("addtrack");
      // };

      this.peerConnection.onnegotiationneeded = () => {
        this.log("onnegotiationneeded");
      };
      this.peerConnection.onremovetrack = () => {
        this.log("onremovetrack");
      };
      this.peerConnection.oniceconnectionstatechange = () => {
        this.log("oniceconnectionstatechange");
      };
      this.peerConnection.onicegatheringstatechange = () => {
        this.log("onicegatheringstatechange");
      };
      this.peerConnection.onsignalingstatechange = () => {
        this.log("onsignalingstatechange");
      };

      this.log("listeners invoked.");
    },
    //
    // set up data channel listeners
    //
    setUpDataChannelListeners() {
      this.log("set data channel listeners.");
      this.dataChannel.onmessage = (ev) => {
        this.log("onmessage" + ev.data);
      };
      this.dataChannel.onopen = () => {
        this.log("onopen");
      };
      this.dataChannel.onclose = () => {
        this.log("onclose");
      };
    },

    //
    // Create call
    //
    async createCall() {
      this.log("create call.");
      //
      // create peer connection if no one exists
      //
      if (!this.peerConnection) {
        this.peerConnection = new RTCPeerConnection(this.servers);
        this.log("createCall: peer connection created.");
        // set up connection listeners
        this.setUpConnectionListener();
      }
      // firestore references
      const callDoc = firestore.collection("calls").doc(); // creates an empty document, returns its id
      //
      // create connection document
      //
      this.connectionId = callDoc.id;
      const offerCandidates = callDoc.collection("offerCandidates");
      const answerCandidates = callDoc.collection("answerCandidates");

      // Get candidates for caller, save to db
      this.peerConnection.onicecandidate = (event) => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
        this.log("onicecandidate fired.");
      };

      //
      // open data channel (invokes onicecandidate)
      //
      this.dataChannel = await this.peerConnection.createDataChannel(
        "my channel"
      );
      this.setUpDataChannelListeners();

      //
      // Create offer
      //
      const offerDescription = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await callDoc.set({ offer });

      //
      // Listen for remote answer
      //
      this.unsubCallDoc = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!this.peerConnection.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          this.peerConnection.setRemoteDescription(answerDescription);
        }
      });

      //
      // Listen for remote ICE candidates
      //
      this.unsubAnswerCandidates = answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.peerConnection.addIceCandidate(candidate);
          }
        });
      });
    },

    //
    // answer call
    //
    async answerCall() {
      this.log("answer call.");
      //
      // create peer connection
      //

      this.peerConnection = new RTCPeerConnection(this.servers);
      this.log("answerCall: peer connection created.");
      // set up listeners
      this.setUpConnectionListener();
      //
      // open data channel (invokes onicecandidate)
      //
      this.dataChannel = await this.peerConnection.createDataChannel(
        "datachannel"
      );
      this.setUpDataChannelListeners();

      // read connection document
      const callDoc = firestore.collection("calls").doc(this.connectionId);
      const offerCandidates = callDoc.collection("offerCandidates");
      const answerCandidates = callDoc.collection("answerCandidates");

      this.peerConnection.onicecandidate = (event) => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
      };

      // Fetch data, then set the offer & answer

      const callData = (await callDoc.get()).data();

      const offerDescription = callData.offer;
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offerDescription)
      );

      const answerDescription = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDoc.update({ answer });

      // Listen to offer candidates

      this.unsubOfferCandidates = offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          this.log("snapshot candidate fired. " + change.type);
          if (change.type === "added") {
            let data = change.doc.data();
            this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    },
    //
    // Data channel
    //
    // async handleDataChannel() {
    //   this.log("handle data channel");
    //   this.dataChannel = ev.channel;
    //   this.setUpDataChannelListeners();
    // },
    //
    // send message
    //
    async sendMessage(msg) {
      let obj = {
        message: msg,
        timestamp: new Date(),
      };
      this.dataChannel.send(JSON.stringify(obj));
    },

    //
    // reset connection
    //
    async cleanUp() {
      this.log("cleanUp fired");
      //
      // reset db listener
      //
      if (this.unsubAnswerCandidates) {
        this.unsubAnswerCandidates();
      }
      if (this.unsubOfferCandidates) {
        this.unsubOfferCandidates();
      }
      if (this.unsubCallDoc) {
        this.unsubCallDoc();
      }
      //
      // reset and close connection
      //
      if (this.peerConnection) {
        this.peerConnection.close();
        this.connectionId = "";
        this.peerConnection = null;
        this.dataChannel = null;
        this.localStream = null;
        this.remoteStream = null;

        // DOM elements
        this.webcamVideo = null;
        this.remoteVideo = null;

        // chat
        this.message = "";
        this.messageList = [];
      }
    },

    //
    // Montior entries for debugging and logging
    //
    log(msg) {
      const formattedString = date.formatDate(
        Date.now(),
        "DD.MM.YYYY HH:mm:ss"
      );
      const logentry = {
        timestamp: formattedString,
        content: msg,
      };
      console.log(logentry.content);
      // store.monitor.push(logentry);
    },
  },
});
