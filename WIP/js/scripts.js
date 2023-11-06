var audio = document.getElementById("background-music");
audio.muted = true;

// Get the mute button
var muteButton = document.getElementById("mute-button");

// Add click event listener to toggle mute/unmute
muteButton.addEventListener("click", function () {
    if (audio.muted) {
        audio.play();
        audio.volume = 0.05;
        audio.muted = false;
        muteButton.innerHTML = '<i class="bi bi-volume-mute"></i> Mute';
    } else {
        audio.muted = true;
        muteButton.innerHTML = '<i class="bi bi-volume-up"></i> Unmute';
    }
});