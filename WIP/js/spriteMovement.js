const playerSprite = document.querySelector('.player-sprite');
const spriteSpeed = 2; // Adjust the speed of the sprite movement (lower value for slower movement)
const spriteWidth = 192; // Width of your sprite frames
const spriteHeight = 192; // Height of your sprite frames
const numDirections = 3; // Number of directions (down, right, up)
const numFramesPerDirection = 6; // Number of frames in each direction (including walking animations)
let spriteColumn = 0; // Animation frame in sprite sheet
let spriteColumnTimer = 0; // Counter to slow down moving through animation frames
let spriteX = window.innerWidth / 2; // Initial X position
let spriteY = window.innerHeight / 2; // Initial Y position
let targetX = spriteX;
let targetY = spriteY;
let isWalking = false; // Indicates if the sprite is walking

const Directions = {
	Up: 2,
	Down: 0,
	Left: -1,
	Right: 1,
    WalkingUp: 5,
	WalkingDown: 3,
	WalkingLeft: -4,
	WalkingRight: 4
}

// Moveable Areas
const islandArea = document.querySelector('#island');

// Non moveable areas
const fountainArea = document.querySelector('#fountain');

// Initial sprite setup
playerSprite.style.left = `${spriteX - playerSprite.offsetWidth / 2}px`;
playerSprite.style.top = `${spriteY - playerSprite.offsetHeight / 4}px`;
updateSprite(); // Set the initial facing animation frame

document.addEventListener('click', (e) => {
    // Start updating the sprite position
    if (islandArea.contains(e.target) && !fountainArea.contains(e.target)) {
        targetX = e.clientX;
        targetY = e.clientY;
        spriteColumnTimer = 0;
        spriteColumn = 0;

        if (!isWalking) {
            isWalking = true;
            updateSprite(); // Set the initial walking animation frame
        }
        updateSpritePosition(); // Start updating the sprite position
    }
});

// Update the sprite position with a delay
function updateSpritePosition() {
    const deltaX = targetX - spriteX;
    const deltaY = targetY - spriteY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    if (distance > spriteSpeed) {
        // Calculate the new position with a delay
        const newX = spriteX + spriteSpeed * Math.cos(angle);
        const newY = spriteY + spriteSpeed * Math.sin(angle);

        // Update the sprite position
        spriteX = newX;
        spriteY = newY;
        playerSprite.style.left = `${spriteX - playerSprite.offsetWidth / 2}px`;
        playerSprite.style.top = `${spriteY - playerSprite.offsetHeight + 30}px`;

        // Determine the dominant direction based on the angle
        const verticalPriority = Math.abs(Math.sin(angle)) > Math.abs(Math.cos(angle));
        // Calculate the absolute values of the horizontal and vertical components
        let dominantDirection = "";
        // Update the sprite animation based on the dominant direction
        if (verticalPriority) {
            updateSprite("vertical", deltaY);
        } else {
            updateSprite("horizontal", deltaX);
        }

        // Continue updating until the sprite reaches the target
        requestAnimationFrame(updateSpritePosition);
    } else {
        // Stop walking animation and switch to facing animation
        isWalking = false;
        spriteColumnTimer = 0;
        spriteColumn = 0;
        updateSprite(); // Set the initial facing animation frame
    }
}

function updateSprite(animationPriority, deltaXorY) {
    // Calculate the background position based on row and column
    let backgroundPositionX, backgroundPositionY;

    let row = 0;
    if (spriteColumnTimer % 50 === 0) {
        spriteColumn++;
    }
    if (spriteColumn > 5) {
        spriteColumnTimer = 0;
        spriteColumn = 0;
    }

    if (animationPriority === "vertical") {
        // Prioritize vertical sprites
        row = isWalking ? deltaXorY > 0 ? Directions.WalkingDown : Directions.WalkingUp : deltaXorY > 0 ? Directions.Down : Directions.Up;
        backgroundPositionX = -spriteColumn * spriteWidth;
        backgroundPositionY = -row * spriteHeight;
    } else if (animationPriority === "horizontal") {
        // Prioritize horizontal sprites
        row = isWalking ? deltaXorY > 0 ? Directions.WalkingRight : Directions.WalkingLeft : deltaXorY > 0 ? Directions.Right : Directions.Left;
        backgroundPositionX = -spriteColumn * spriteWidth;
        backgroundPositionY = -Math.abs(row) * spriteHeight;
    } else {
        backgroundPositionX = -spriteColumn * spriteWidth;
        backgroundPositionY = -row * spriteHeight;
    }

    playerSprite.style.transform = (row === Directions.Left || row === Directions.WalkingLeft) ? "scaleX(-1)" : "scaleX(1)";

    spriteColumnTimer++;
    playerSprite.style.backgroundPosition = `${backgroundPositionX}px ${backgroundPositionY}px`;
}
