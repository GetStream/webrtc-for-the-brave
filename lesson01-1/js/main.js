'use strict';

// Define video constraints
const videoConstraints = {
    audio: false,
    video: {width: 1280, height: 720}
};

// Add event listener to the button for triggering media stream initialization
document.querySelector('#showVideo').addEventListener('click', e => initialize(e));

// Initialization function to request and handle media stream
async function initialize(e) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        attachVideoStream(stream);
        e.target.disabled = true; // Disable the button after successful initialization
    } catch (error) {
        onCatch(error);
    }
}

// Function to handle successful acquisition of media stream
function attachVideoStream(stream) {
    const videoElement = document.querySelector('video');
    window.stream = stream; // Make variable available to the browser console
    videoElement.srcObject = stream;
}

// Function to handle errors during media stream acquisition
function onCatch(error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>Something went wrong: ${error.name}</p>`;
}