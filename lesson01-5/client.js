import { io } from "socket.io-client" // const io = require('socket.io-client');

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

const createAnswer = (sdp) => {
    newPC.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
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

function renderVideo() {
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: true,
        })
        .then(stream => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // 자신의 video, audio track을 모두 자신의 RTCPeerConnection에 등록한다.
            stream.getTracks().forEach(track => {
                newPC.addTrack(track, stream);
            });
            newPC.onicecandidate = e => {
                if (e.candidate) {
                    console.log("onicecandidate");
                    newSocket.emit("candidate", e.candidate);
                }
            };
            newPC.oniceconnectionstatechange = e => {
                console.log(e);
            };

            newPC.ontrack = ev => {
                console.log("add remotetrack success");
                if (remoteVideoRef.current)
                    remoteVideoRef.current.srcObject = ev.streams[0];
            };

            // 자신의 video, audio track을 모두 자신의 RTCPeerConnection에 등록한 후에 room에 접속했다고 Signaling Server에 알린다.
            // 왜냐하면 offer or answer을 주고받을 때의 RTCSessionDescription에 해당 video, audio track에 대한 정보가 담겨 있기 때문에
            // 순서를 어기면 상대방의 MediaStream을 받을 수 없음
            newSocket.emit("join_room", {
                room: "1234",
                email: "sample@naver.com",
            });
        })
        .catch(error => {
            console.log(`getUserMedia error: ${error}`);
        });
}