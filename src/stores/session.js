import { defineStore } from "pinia";
import { date } from "quasar";
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
  }),

  getters: {
    doubleCount(state) {
      return state.counter * 2;
    },
  },

  actions: {
    resetConnection() {
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
