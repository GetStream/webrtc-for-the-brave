/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

let localConnection, remoteConnection;
let sendChannel, receiveChannel;
const dataChannelSend = document.querySelector('textarea#dataChannelSend');
const dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
const connectButton = document.querySelector('button#connectButton');
const sendButton = document.querySelector('button#sendButton');
const disconnectButton = document.querySelector('button#disconnectButton');

connectButton.onclick = createConnection;
sendButton.onclick = sendData;
disconnectButton.onclick = closeDataChannels;

function createConnection() {
    dataChannelSend.placeholder = '';
    connectButton.disabled = true;
    disconnectButton.disabled = false;

    localConnection = new RTCPeerConnection();
    localConnection.onicecandidate = e => {
        onIceCandidate(localConnection, e);
    };

    sendChannel = localConnection.createDataChannel('sendDataChannel');
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;

    remoteConnection = new RTCPeerConnection();
    remoteConnection.onicecandidate = e => {
        onIceCandidate(remoteConnection, e);
    };

    remoteConnection.ondatachannel = receiveChannelCallback;

    localConnection.createOffer().then(
        handleLocalSdp,
        onCatch
    );
}

function handleLocalSdp(desc) {
    localConnection.setLocalDescription(desc).then(onCatch);
    remoteConnection.setRemoteDescription(desc).then(onCatch);
    remoteConnection.createAnswer().then(
        handleRemoteSdp,
        onCatch
    );
}

function handleRemoteSdp(desc) {
    remoteConnection.setLocalDescription(desc).then(onCatch);
    localConnection.setRemoteDescription(desc).then(onCatch);
}

function onIceCandidate(pc, event) {
    getOtherPc(pc)
        .addIceCandidate(event.candidate)
        .then(onCatch);

    console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : 'undefined'}`);
}

function sendData() {
    const data = dataChannelSend.value;
    sendChannel.send(data);

    console.log('Sent data: ' + data);
}

function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
    dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
    const readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        dataChannelSend.disabled = false;
        dataChannelSend.focus();
        sendButton.disabled = false;
        disconnectButton.disabled = false;
    } else {
        dataChannelSend.disabled = true;
        sendButton.disabled = true;
        disconnectButton.disabled = true;
    }
}

function onReceiveChannelStateChange() {
    const readyState = receiveChannel.readyState;
    console.log(`Receive channel state is: ${readyState}`);
}

function getName(pc) {
    return (pc === localConnection) ? 'localPeerConnection' : 'remotePeerConnection';
}

function getOtherPc(pc) {
    return (pc === localConnection) ? remoteConnection : localConnection;
}

// Function to handle errors during media stream acquisition
function onCatch(error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>Something went wrong: ${error.name}</p>`;
}

function closeDataChannels() {
    connectButton.disabled = false;
    sendButton.disabled = true;
    disconnectButton.disabled = true;
    dataChannelSend.disabled = true;
    dataChannelSend.value = '';
    dataChannelReceive.value = '';

    sendChannel.close();
    receiveChannel.close();
    localConnection.close();
    remoteConnection.close();
    localConnection = null;
    remoteConnection = null;
}