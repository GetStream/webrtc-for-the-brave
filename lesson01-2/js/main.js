'use strict';

const callPc1Button = document.getElementById('call_pc1');
const callPc2Button = document.getElementById('call_pc2');
const disconnectButton = document.getElementById('disconnect');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

callPc1Button.addEventListener('click', attachLocalMedia);
callPc2Button.addEventListener('click', peerConnection);
disconnectButton.addEventListener('click', disconnect);
callPc2Button.disabled = true;
disconnectButton.disabled = true;

const rtcConfig = {
    iceServers: [
        {
            urls: 'stun:stun.1.google.com:19302'
        },
    ],
};

let localStream, pc1, pc2;

// Define video constraints
const videoConstraints = {
    audio: false,
    video: {width: 1280, height: 720}
};

async function attachLocalMedia() {
    callPc1Button.disabled = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        localVideo.srcObject = stream;
        localStream = stream;
        callPc2Button.disabled = false;
    } catch (e) {
        onCatch(e)
    }
}

async function peerConnection() {
    callPc2Button.disabled = true;
    disconnectButton.disabled = false;

    pc1 = new RTCPeerConnection(rtcConfig);
    pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
    pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));

    pc2 = new RTCPeerConnection(rtcConfig);
    pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
    pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
    pc2.addEventListener('track', gotRemoteStream);

    localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));

    try {
        console.log('pc1 createOffer start');
        const offer = await pc1.createOffer({
            iceRestart: true,
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        await onCreateOfferSuccess(offer);
    } catch (e) {
        onCatch(e);
    }
}

async function onCreateOfferSuccess(desc) {
    console.log(`Offer from pc1\nsdp: ${desc.sdp}`);
    try {
        await pc1.setLocalDescription(desc);
    } catch (e) {
        onCatch(e)
    }

    try {
        await pc2.setRemoteDescription(desc);
    } catch (e) {
        onCatch(e)
    }


    try {
        const answer = await pc2.createAnswer();
        await onCreateAnswerSuccess(answer);
    } catch (e) {
        onCatch(e);
    }
}

function gotRemoteStream(e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
    }
}

async function onCreateAnswerSuccess(desc) {
    try {
        await pc2.setLocalDescription(desc);
    } catch (e) {
        onCatch(e)
    }

    try {
        await pc1.setRemoteDescription(desc);
    } catch (e) {
        onCatch(e)
    }
}

async function onIceCandidate(pc, event) {
    try {
        await (getOtherPc(pc).addIceCandidate(event.candidate));
        console.log(`${getName(pc)} addIceCandidate success`);
    } catch (e) {
        onCatch(pc, e);
    }
    console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onIceStateChange(pc, event) {
    if (pc) {
        console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
        console.log('ICE state change event: ', event);
    }
}

function getName(pc) {
    return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
    return (pc === pc1) ? pc2 : pc1;
}

// Function to handle errors during media stream acquisition
function onCatch(error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>Something went wrong: ${error.name}</p>`;
}

function disconnect() {
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
    localVideo.srcObject = null;
    callPc1Button.disabled = false;
    disconnectButton.disabled = true;
}
