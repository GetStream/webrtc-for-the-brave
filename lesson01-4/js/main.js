'use strict';

const shareButton = document.getElementById('startButton');

shareButton.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({audio: true, video: true})
        .then(shareScreen, onCatch);
});

function shareScreen(stream) {
    shareButton.disabled = true;

    const video = document.querySelector('video');
    video.srcObject = stream;

    stream.getVideoTracks()[0].addEventListener('ended', () => {
        shareButton.disabled = false;
    });
}

// Function to handle errors during media stream acquisition
function onCatch(error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>Something went wrong: ${error.name}</p>`;
}

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
    shareButton.disabled = false;
}
