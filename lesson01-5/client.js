const io = require('socket.io-client');

const socket = io('http://localhost:3000'); // Replace with your server's URL
const pc_config = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const peerConnection = new RTCPeerConnection(pc_config);

socket.on('connect', () => {
    console.log('Connected to the server');

    const userNum = Math.floor(Math.random() * 1000)
    socket.emit("join", {room: "1234", name: "user" + userNum});
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
        .createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(sdp => {
            peerConnection.setLocalDescription(new RTCSessionDescription(sdp));
            socket.emit("offer", sdp);
        })
        .catch(error => {
            console.log(error);
        });
};