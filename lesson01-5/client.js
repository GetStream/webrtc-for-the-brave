'use strict';

const io = require('socket.io-client'); // const io = require('socket.io-client');

const socket = io('http://localhost:3000'); // Replace with your server's URL
const pc_config = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};

const peerConnection = new RTCPeerConnection(pc_config);

socket.on('connect', () => {
    console.log('Hello, successfully connected to the signaling server!');
});

socket.on("room_users", (data) => {
    console.log("join:" + data);
});

socket.on("getOffer", (sdp) => {
    console.log("get offer");
    createAnswer(sdp);
    console.log(sdp);
});

socket.on("getAnswer", (sdp) => {
    console.log("get answer");
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    console.log(sdp);
});

socket.on("getCandidate", (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
        console.log("candidate add success");
    });
});

const createOffer = () => {
    console.log("create offer");
    peerConnection
        .createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
        .then(sdp => {
            peerConnection.setLocalDescription(new RTCSessionDescription(sdp));
            socket.emit("offer", sdp);
        })
        .catch(error => {
            console.log(error);
        });
};

const createAnswer = (sdp) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
        console.log("answer set remote description success");
        peerConnection
            .createAnswer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true,
            })
            .then(sdp1 => {
                console.log("create answer");
                peerConnection.setLocalDescription(new RTCSessionDescription(sdp1));
                socket.emit("answer", sdp1);
            })
            .catch(error => {
                console.log(error);
            });
    });
};

async function init(e) {
    try {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
            })
            .then(stream => {
                if (localVideo.current) localVideo.current.srcObject = stream;

                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
                peerConnection.onicecandidate = e => {
                    if (e.candidate) {
                        console.log("onicecandidate");
                        socket.emit("candidate", e.candidate);
                    }
                };
                peerConnection.oniceconnectionstatechange = e => {
                    console.log(e);
                };

                peerConnection.ontrack = ev => {
                    console.log("add remotetrack success");
                    if (remoteVideo.current)
                        remoteVideo.current.srcObject = ev.streams[0];
                };

                socket.emit("join", {
                    room: "1234",
                    email: "skydoves@getstream.io",
                });
            })
            .catch(error => {
                console.log(`getUserMedia error: ${error}`);
            });
    } catch (e) {

    }
}

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
document.getElementById('startButton').addEventListener('click', e => init(e));