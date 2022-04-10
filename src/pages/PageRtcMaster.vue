<template>
  <q-page>
    <q-card>
      <q-card-section>
        <h1>Master</h1>
      </q-card-section>
      <q-card-section>
        <p>Initiert eine Verbindng.</p>
      </q-card-section>
      <q-card-section>
        <h2>Result</h2>
      </q-card-section>
      <q-card-actions>
        <q-btn @click="onMakeCall">Make Call</q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>
<script setup>
// Set up an asynchronous communication channel that will be
// used during the peer connection setup
const signalingChannel = new SignalingChannel(remoteClientId);
signalingChannel.addEventListener("message", (message) => {
  // New message from remote client received
});

// Send an asynchronous message to the remote client
signalingChannel.send("Hello!");
//
// initiate call
//
const onMakeCall = async () => {
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const peerConnection = new RTCPeerConnection(configuration);
  signalingChannel.addEventListener("message", async (message) => {
    if (message.answer) {
      const remoteDesc = new RTCSessionDescription(message.answer);
      await peerConnection.setRemoteDescription(remoteDesc);
    }
  });
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  signalingChannel.send({ offer: offer });
};
</script>
