// Offscreen script - handles audio playback for the background service worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playSound') {
        playNotificationSound();
        sendResponse({ success: true });
    }
});

function playNotificationSound() {
    try {
        // Try to play audio file first
        const audioUrl = chrome.runtime.getURL('sounds/notification.mp3');
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        audio.play().catch(() => {
            // If audio file doesn't exist, fall back to beeps
            playBeeps();
        });
    } catch (e) {
        console.log("Audio error: " + e);
        // Fall back to beeps
        playBeeps();
    }
}

function playBeeps() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();

        // Play 3 beeps
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(context.destination);

                oscillator.frequency.value = 800;
                oscillator.type = "sine";

                gainNode.gain.setValueAtTime(0.3, context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.3);
            }, i * 400);
        }
    } catch (e) {
        console.log("Beep sound error: " + e);
    }
}
