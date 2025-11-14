// Flappy Bird implementation
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Game settings
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const GRAVITY = 0.5;
const FLAP_POWER = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const PIPE_INTERVAL = 1500;
let bird = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT,
    vy: 0
};
let pipes = [];
let score = 0;
let gameActive = true;
let lastPipeTime = 0;
let animationFrame;

// Load high score
let highScore = localStorage.getItem('flappyHighScore') || 0;
highScoreElement.textContent = highScore;

// Draw bird
function drawBird() {
    // Bird body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(bird.x, bird.y + bird.height / 2);
    ctx.lineTo(bird.x + bird.width, bird.y + bird.height / 2);
    ctx.lineTo(bird.x + bird.width * 0.8, bird.y);
    ctx.lineTo(bird.x + bird.width * 0.7, bird.y - bird.height * 0.3);
    ctx.lineTo(bird.x + bird.width * 0.5, bird.y - bird.height * 0.4);
    ctx.lineTo(bird.x + bird.width * 0.3, bird.y - bird.height * 0.3);
    ctx.lineTo(bird.x + bird.width * 0.2, bird.y);
    ctx.closePath();
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width * 0.7, bird.y - bird.height * 0.1, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width * 0.85, bird.y - bird.height * 0.1);
    ctx.lineTo(bird.x + bird.width, bird.y - bird.height * 0.2);
    ctx.lineTo(bird.x + bird.width, bird.y);
    ctx.closePath();
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width * 0.3, bird.y + bird.height * 0.2);
    ctx.lineTo(bird.x + bird.width * 0.5, bird.y + bird.height * 0.6);
    ctx.lineTo(bird.x + bird.width * 0.7, bird.y + bird.height * 0.3);
    ctx.closePath();
    ctx.fill();
}

// Draw pipes
function drawPipes() {
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height);
        
        // Pipe caps
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });
}

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
        const x = (Date.now() / 1000) % canvas.width + i * canvas.width;
        ctx.beginPath();
        ctx.arc(x % canvas.width, 80 + i * 20, 20, 0, Math.PI * 2);
        ctx.arc((x + 30) % canvas.width, 70 + i * 20, 25, 0, Math.PI * 2);
        ctx.arc((x + 60) % canvas.width, 80 + i * 20, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 10);
}

// Create new pipe
function createPipe() {
    const topHeight = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false
    });
}

// Move pipes
function movePipes() {
    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
    });
    
    // Remove pipes that are off screen
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
}

// Check collisions
function checkCollisions() {
    // Ground collision
    if (bird.y + bird.height / 2 > canvas.height - 40) {
        gameOver();
        return;
    }
    
    // Ceiling collision
    if (bird.y - bird.height * 0.4 < 0) {
        bird.y = bird.height * 0.4;
        bird.vy = 0;
    }
    
    // Pipe collisions
    pipes.forEach(pipe => {
        if (
            bird.x + bird.width > pipe.x &&
            bird.x < pipe.x + PIPE_WIDTH &&
            (
                bird.y - bird.height * 0.4 < pipe.topHeight ||
                bird.y + bird.height / 2 > pipe.topHeight + PIPE_GAP
            )
        ) {
            gameOver();
        }
        
        // Score when passing pipe
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = score;
            
            // Increase speed every 5 points
            if (score % 5 === 0) {
                PIPE_SPEED += 0.5;
            }
        }
    });
}

// Game over
function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationFrame);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

// Restart game
function restartGame() {
    bird = {
        x: canvas.width / 3,
        y: canvas.height / 2,
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        vy: 0
    };
    pipes = [];
    score = 0;
    PIPE_SPEED = 3;
    gameActive = true;
    scoreElement.textContent = '0';
    gameOverScreen.style.display = 'none';
    
    lastPipeTime = Date.now();
    gameLoop();
}

// Game loop
function gameLoop(timestamp) {
    if (!gameActive) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Create pipes
    if (timestamp - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = timestamp;
    }
    
    // Move bird
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    
    // Move pipes
    movePipes();
    
    // Draw game objects
    drawPipes();
    drawBird();
    
    // Check collisions
    checkCollisions();
    
    // Continue game loop
    animationFrame = requestAnimationFrame(gameLoop);
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameActive && e.key === ' ') {
        restartGame();
        return;
    }
    
    if (e.key === ' ' && gameActive) {
        bird.vy = FLAP_POWER;
    }
});

canvas.addEventListener('click', () => {
    if (!gameActive) {
        restartGame();
    } else {
        bird.vy = FLAP_POWER;
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameActive) {
        restartGame();
    } else {
        bird.vy = FLAP_POWER;
    }
});

// Start game
restartGame();