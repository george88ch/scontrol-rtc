import { ref, onMounted, onUnmounted } from "vue";
import useFirebase from "src/boot/firebase.js";

const useRTCDataChannel = () => {
  //
  // init firestore database
  //
  const { firestore } = useFirebase();

  //
  // globals
  //
  const message = ref("");
  const callId = ref("");

  //
  // init RTCPeerConnections
  //
  let localConnection = null;
  let remoteConnection = null;

  //
  // init RTCDataChannel handlers for sender (local) and receiver (remote)
  //
  let sendChannel = null; // RTCDataChannel for the local (sender)
  let receiveChannel = null; // RTCDataChannel for the remote (receiver)

  //--------------------------------------------------------------------
  // Functions invoked from frontend (e.g. button clicks)
  //--------------------------------------------------------------------

  //
  // connect peers
  //
  const connectPeers = () => {
    // Connect the two peers. Normally you look for and connect to a remote
    // machine here, but we're just connecting two local objects, so we can
    // bypass that step.
    // @TODO: implement signaling
    console.log("connecting peers");

    // Create the local connection and its event listeners

    localConnection = new RTCPeerConnection();

    // Create the data channel and establish its event listeners
    sendChannel = localConnection.createDataChannel("sendChannel");
    sendChannel.onopen = handleSendChannelStatusChange;
    sendChannel.onclose = handleSendChannelStatusChange;

    // Create the remote connection and its event listeners

    remoteConnection = new RTCPeerConnection();
    remoteConnection.ondatachannel = receiveChannelCallback;

    // Set up the ICE candidates for the two peers

    localConnection.onicecandidate = (e) =>
      !e.candidate ||
      remoteConnection
        .addIceCandidate(e.candidate)
        .catch(handleAddCandidateError);

    remoteConnection.onicecandidate = (e) =>
      !e.candidate ||
      localConnection
        .addIceCandidate(e.candidate)
        .catch(handleAddCandidateError);

    // Now create an offer to connect; this starts the process

    localConnection
      .createOffer()
      .then((offer) => localConnection.setLocalDescription(offer))
      .then(() =>
        remoteConnection.setRemoteDescription(localConnection.localDescription)
      )
      .then(() => remoteConnection.createAnswer())
      .then((answer) => remoteConnection.setLocalDescription(answer))
      .then(() =>
        localConnection.setRemoteDescription(remoteConnection.localDescription)
      )
      .catch(handleCreateDescriptionError);
  };

  //
  // Clean up. Disconnect peers
  //
  const disconnectPeers = () => {
    console.log("disconnection peers");
    // Close the connection, including data channels if they're open.
    // Also update the UI to reflect the disconnected status.
    // Close the RTCDataChannels if they're open.
    sendChannel.close();
    receiveChannel.close();

    // Close the RTCPeerConnections

    localConnection.close();
    remoteConnection.close();

    sendChannel = null;
    receiveChannel = null;
    localConnection = null;
    remoteConnection = null;

    // Update user interface elements
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

  //------------------------------------------------------------
  // Event listeners
  //------------------------------------------------------------

  //
  // handleSendChannelStatusChange
  // (fired by datachannel when onopen and onclose events are triggered )
  //
  const handleSendChannelStatusChange = (event) => {
    // Handle status changes on the local end of the data
    // channel; this is the end doing the sending of data
    // in this example.
    if (sendChannel) {
      let state = sendChannel.readyState;

      if (state === "open") {
        // channel is ready
        // @TODO enable/disable disconnect and send buttons
        console.log("datachannel open");
      } else {
        // channel is ready
        // @TODO enable/disable disconnect and send buttons
        console.log("datachannel NOT open");
      }
    }
  };

  //
  // handle errors
  // (fired by connectPeers() when an error occurs)
  //
  const handleCreateDescriptionError = (error) => {
    console.log("Unable to create an offer: " + error.toString());
  };

  //
  // Handle addition of the ICE candidate
  // on the "local" and the "remote" end of the connection.
  //
  const handleLocalAddCandidateSuccess = () => {
    // @TODO disable connect button
    console.log("ICE candidate successfully added on local.");
  };
  const handleRemoteAddCandidateSuccess = () => {
    // @TODO enable connect button
    console.log("ICE candidate successfully added on remote.");
  };
  const handleAddCandidateError = () => {
    console.log("addICECandidate failed!");
  };

  //
  // data channel ready
  // (fired by connectPeers())
  //
  const receiveChannelCallback = (event) => {
    // Called when the connection opens and the data
    // channel is ready to be connected to the remote.
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleReceiveMessage;
    receiveChannel.onopen = handleReceiveChannelStatusChange;
    receiveChannel.onclose = handleReceiveChannelStatusChange;
  };

  //
  // handle received message
  //
  const handleReceiveMessage = (event) => {
    // Handle onmessage events for the receiving channel.
    // These are the data messages sent by the sending channel.
    // @TODO handle messages (list)
    console.log("message received. ", event.data);
  };

  //
  // Handle status changes on the receiver's channel.
  //
  const handleReceiveChannelStatusChange = (event) => {
    if (receiveChannel) {
      console.log(
        "Receive channel's status has changed to " + receiveChannel.readyState
      );
    }

    // @TODO Here you would do stuff that needs to be done
    // when the channel's status changes.
  };

  //--------------------------------------------------------------------
  // Expose function
  //--------------------------------------------------------------------
  return {
    // functions
    connectPeers,
    disconnectPeers,
    sendMessage,
    // refs
    message,
    callId,
  };
};

export default useRTCDataChannel;
