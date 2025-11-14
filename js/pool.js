// Simplified Pool game implementation
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Game settings
const TABLE_WIDTH = 700;
const TABLE_HEIGHT = 400;
const POCKET_RADIUS = 25;
const BALL_RADIUS = 12;
const FRICTION = 0.98;
const MIN_SPEED = 0.1;
let balls = [];
let cueBall = null;
let pockets = [];
let score = 0;
let shotsTaken = 0;
let gameActive = true;
let aiming = true;
let power = 0;
let maxPower = 15;

// Load high score
let highScore = localStorage.getItem('poolHighScore') || 0;
highScoreElement.textContent = highScore;

// Create pockets
function createPockets() {
    pockets = [
        { x: 25, y: 25 }, // top-left
        { x: TABLE_WIDTH / 2, y: 25 }, // top-middle
        { x: TABLE_WIDTH - 25, y: 25 }, // top-right
        { x: 25, y: TABLE_HEIGHT - 25 }, // bottom-left
        { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 25 }, // bottom-middle
        { x: TABLE_WIDTH - 25, y: TABLE_HEIGHT - 25 } // bottom-right
    ];
}

// Create balls
function createBalls() {
    balls = [];
    
    // Cue ball (white)
    cueBall = {
        x: TABLE_WIDTH / 4,
        y: TABLE_HEIGHT / 2,
        radius: BALL_RADIUS,
        color: '#FFFFFF',
        vx: 0,
        vy: 0,
        isCueBall: true
    };
    balls.push(cueBall);
    
    // 15 numbered balls in triangle formation
    const startX = (3 * TABLE_WIDTH) / 4;
    const startY = TABLE_HEIGHT / 2;
    const rows = 5;
    let ballIndex = 1;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + row * (BALL_RADIUS * 2 + 2);
            const y = startY - ((row * BALL_RADIUS) - (col * BALL_RADIUS * 2));
            
            balls.push({
                x: x + (Math.random() - 0.5) * 2, // Slight random offset
                y: y + (Math.random() - 0.5) * 2,
                radius: BALL_RADIUS,
                color: ballIndex === 8 ? '#000000' : 
                       ballIndex <= 7 ? '#FFD700' : '#00008B',
                number: ballIndex,
                vx: 0,
                vy: 0
            });
            
            ballIndex++;
        }
    }
}

// Draw table
function drawTable() {
    // Table background
    ctx.fillStyle = '#006400';
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
    // Table border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, TABLE_WIDTH - 20, TABLE_HEIGHT - 20);
    
    // Pockets
    pockets.forEach(pocket => {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Table markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TABLE_WIDTH / 2, 0);
    ctx.lineTo(TABLE_WIDTH / 2, TABLE_HEIGHT);
    ctx.stroke();
}

// Draw balls
function drawBalls() {
    balls.forEach(ball => {
        // Ball shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Ball number
        if (ball.number) {
            ctx.fillStyle = ball.number === 8 ? '#FFFFFF' : '#000';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ball.number, ball.x, ball.y);
        }
        
        // Cue ball marker
        if (ball.isCueBall) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Draw cue
function drawCue() {
    if (!aiming || !cueBall) return;
    
    const mouseX = lastMouseX || TABLE_WIDTH / 4 - 50;
    const mouseY = lastMouseY || TABLE_HEIGHT / 2;
    
    // Calculate angle and distance
    const dx = cueBall.x - mouseX;
    const dy = cueBall.y - mouseY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const powerLevel = Math.min(distance / 50, 1);
    
    // Cue stick
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(
        cueBall.x + Math.cos(angle) * (BALL_RADIUS + 5),
        cueBall.y + Math.sin(angle) * (BALL_RADIUS + 5)
    );
    ctx.lineTo(
        cueBall.x + Math.cos(angle) * (BALL_RADIUS + 5 + 150 + powerLevel * 150),
        cueBall.y + Math.sin(angle) * (BALL_RADIUS + 5 + 150 + powerLevel * 150)
    );
    ctx.stroke();
    
    // Power indicator
    ctx.fillStyle = `hsl(${120 * (1 - powerLevel)}, 100%, 50%)`;
    ctx.fillRect(
        cueBall.x + Math.cos(angle) * (BALL_RADIUS + 5 + 150),
        cueBall.y + Math.sin(angle) * (BALL_RADIUS + 5 + 150),
        powerLevel * 150,
        8
    );
}

// Check ball collisions
function checkCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ball1 = balls[i];
            const ball2 = balls[j];
            
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ball1.radius + ball2.radius) {
                // Collision detected - calculate new velocities
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);
                
                // Rotate velocities
                const vx1 = ball1.vx * cos + ball1.vy * sin;
                const vy1 = ball1.vy * cos - ball1.vx * sin;
                const vx2 = ball2.vx * cos + ball2.vy * sin;
                const vy2 = ball2.vy * cos - ball2.vx * sin;
                
                // Final velocities
                const finalVx1 = vx2;
                const finalVx2 = vx1;
                
                // Rotate back
                ball1.vx = finalVx1 * cos - vy1 * sin;
                ball1.vy = vy1 * cos + finalVx1 * sin;
                ball2.vx = finalVx2 * cos - vy2 * sin;
                ball2.vy = vy2 * cos + finalVx2 * sin;
                
                // Move balls apart to prevent sticking
                const overlap = ball1.radius + ball2.radius - distance;
                const moveX = (overlap / 2) * (dx / distance);
                const moveY = (overlap / 2) * (dy / distance);
                
                ball1.x -= moveX;
                ball1.y -= moveY;
                ball2.x += moveX;
                ball2.y += moveY;
            }
        }
    }
}

// Check pocket collisions
function checkPockets() {
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        
        pockets.forEach(pocket => {
            const dx = ball.x - pocket.x;
            const dy = ball.y - pocket.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < POCKET_RADIUS - ball.radius) {
                // Ball pocketed
                if (ball.isCueBall) {
                    // Cue ball pocketed - foul
                    ball.x = TABLE_WIDTH / 4;
                    ball.y = TABLE_HEIGHT / 2;
                    ball.vx = 0;
                    ball.vy = 0;
                } else {
                    // Regular ball pocketed
                    balls.splice(i, 1);
                    score += 10;
                    scoreElement.textContent = score;
                }
            }
        });
    }
}

// Move balls
function moveBalls() {
    balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // Wall collisions
        if (ball.x - ball.radius < 10 + BALL_RADIUS) {
            ball.x = 10 + BALL_RADIUS + ball.radius;
            ball.vx = -ball.vx * FRICTION;
        } else if (ball.x + ball.radius > TABLE_WIDTH - 10 - BALL_RADIUS) {
            ball.x = TABLE_WIDTH - 10 - BALL_RADIUS - ball.radius;
            ball.vx = -ball.vx * FRICTION;
        }
        
        if (ball.y - ball.radius < 10 + BALL_RADIUS) {
            ball.y = 10 + BALL_RADIUS + ball.radius;
            ball.vy = -ball.vy * FRICTION;
        } else if (ball.y + ball.radius > TABLE_HEIGHT - 10 - BALL_RADIUS) {
            ball.y = TABLE_HEIGHT - 10 - BALL_RADIUS - ball.radius;
            ball.vy = -ball.vy * FRICTION;
        }
        
        // Apply friction
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        
        // Stop very slow balls
        if (Math.abs(ball.vx) < MIN_SPEED && Math.abs(ball.vy) < MIN_SPEED) {
            ball.vx = 0;
            ball.vy = 0;
        }
    });
}

// Check if game over
function checkGameOver() {
    if (balls.length <= 1) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameActive = false;
    
    // Update high score (based on score per shot)
    const efficiency = score / Math.max(1, shotsTaken);
    if (efficiency > highScore) {
        highScore = efficiency;
        localStorage.setItem('poolHighScore', highScore);
        highScoreElement.textContent = highScore.toFixed(1);
    }
    
    // Show game over screen
    finalScoreElement.textContent = `${score} очков за ${shotsTaken} ударов`;
    gameOverScreen.style.display = 'block';
}

// Restart game
function restartGame() {
    score = 0;
    shotsTaken = 0;
    gameActive = true;
    aiming = true;
    scoreElement.textContent = '0';
    gameOverScreen.style.display = 'none';
    
    createPockets();
    createBalls();
    
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameActive) return;
    
    // Clear canvas
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
    
    drawTable();
    drawBalls();
    drawCue();
    
    if (!aiming) {
        moveBalls();
        checkCollisions();
        checkPockets();
        
        // Check if all balls have stopped
        if (balls.every(ball => ball.vx === 0 && ball.vy === 0)) {
            aiming = true;
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Mouse controls for aiming
let lastMouseX = 0;
let lastMouseY = 0;
let isMouseDown = false;

canvas.addEventListener('mousemove', (e) => {
    if (!gameActive || !cueBall) return;
    
    const rect = canvas.getBoundingClientRect();
    lastMouseX = e.clientX - rect.left;
    lastMouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (!gameActive || !aiming || !cueBall) return;
    
    isMouseDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (!gameActive || !aiming || !cueBall || !isMouseDown) return;
    
    isMouseDown = false;
    aiming = false;
    shotsTaken++;
    
    // Calculate shot power and direction
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = cueBall.x - mouseX;
    const dy = cueBall.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // Apply power
    const powerLevel = Math.min(distance / 50, 1);
    cueBall.vx = Math.cos(angle) * powerLevel * maxPower;
    cueBall.vy = Math