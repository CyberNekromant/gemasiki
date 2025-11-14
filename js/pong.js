// Pong game implementation
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Game settings
const paddleHeight = 100;
const paddleWidth = 15;
const ballSize = 15;
let playerScore = 0;
let computerScore = 0;
let highScore = localStorage.getItem('pongHighScore') || 0;
highScoreElement.textContent = highScore;
let gameActive = true;
let ballSpeed = { x: 5, y: 5 };
let acceleration = 1.02;
let maxSpeed = 15;

// Game objects
const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 8
};

const computer = {
    x: canvas.width - paddleWidth - 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 4
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    dx: ballSpeed.x * (Math.random() > 0.5 ? 1 : -1),
    dy: (Math.random() * 8) - 4
};

// Draw game objects
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#FF5252';
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
    
    // Draw ball
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw scores
    ctx.font = '32px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(playerScore, canvas.width / 4, 50);
    ctx.fillText(computerScore, 3 * canvas.width / 4, 50);
}

// Move paddles
function movePaddles() {
    // Player paddle
    player.y += player.dy;
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Computer paddle (AI)
    const paddleCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    const diff = ballCenter - paddleCenter;
    
    if (Math.abs(diff) > computer.height / 6) {
        computer.y += diff * 0.1;
    }
    
    // Keep computer paddle on screen
    computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
}

// Move ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collisions (top/bottom)
    if (ball.y - ball.size / 2 <= 0 || ball.y + ball.size / 2 >= canvas.height) {
        ball.dy = -ball.dy;
    }
    
    // Paddle collisions
    if (
        ball.x - ball.size / 2 < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height &&
        ball.dx < 0
    ) {
        ball.dx = -ball.dx * acceleration;
        // Add some angle based on where it hits the paddle
        const hitPosition = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPosition * 6;
        increaseSpeed();
    }
    
    if (
        ball.x + ball.size / 2 > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height &&
        ball.dx > 0
    ) {
        ball.dx = -ball.dx * acceleration;
        // Add some angle based on where it hits the paddle
        const hitPosition = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy = hitPosition * 6;
        increaseSpeed();
    }
    
    // Score points
    if (ball.x - ball.size / 2 <= 0) {
        computerScore++;
        resetBall();
    } else if (ball.x + ball.size / 2 >= canvas.width) {
        playerScore++;
        scoreElement.textContent = playerScore;
        
        if (playerScore > highScore) {
            highScore = playerScore;
            localStorage.setItem('pongHighScore', highScore);
            highScoreElement.textContent = highScore;
        }
        
        resetBall();
    }
}

// Increase ball speed
function increaseSpeed() {
    ball.dx = Math.min(maxSpeed, Math.max(-maxSpeed, ball.dx * acceleration));
    ball.dy = Math.min(maxSpeed, Math.max(-maxSpeed, ball.dy * acceleration));
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ballSpeed.x * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = (Math.random() * 8) - 4;
    
    // Check for game over
    if (computerScore >= 5 || playerScore >= 5) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameActive = false;
    
    // Show game over screen
    finalScoreElement.textContent = playerScore;
    gameOverScreen.style.display = 'block';
}

// Restart game
function restartGame() {
    playerScore = 0;
    computerScore = 0;
    gameActive = true;
    scoreElement.textContent = '0';
    gameOverScreen.style.display = 'none';
    
    resetBall();
    player.y = canvas.height / 2 - paddleHeight / 2;
    computer.y = canvas.height / 2 - paddleHeight / 2;
    
    gameLoop();
}

// Game loop
function gameLoop() {
    if (gameActive) {
        movePaddles();
        moveBall();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameActive && e.key === ' ') {
        restartGame();
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp':
            player.dy = -player.speed;
            break;
        case 'ArrowDown':
            player.dy = player.speed;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.dy = 0;
    }
});

// Touch controls for mobile
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
});

canvas.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;
    player.y += diff;
    touchStartY = touchY;
    e.preventDefault();
});

canvas.addEventListener('touchend', () => {
    player.dy = 0;
});

// Start game
gameLoop();