// Tetris implementation
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Game settings
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;
let board = createBoard();
let score = 0;
let gameActive = true;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let currentPiece = null;

// Load high score
let highScore = localStorage.getItem('tetrisHighScore') || 0;
highScoreElement.textContent = highScore;

// Tetromino shapes and colors
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
];

const COLORS = [
    '#00FFFF', // I
    '#FFFF00', // O
    '#800080', // T
    '#00FF00', // S
    '#FF0000', // Z
    '#0000FF', // J
    '#FF7F00', // L
];

// Create game board
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Create a random piece
function createPiece() {
    const type = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[type];
    const color = COLORS[type];
    
    return {
        shape,
        color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        type
    };
}

// Draw board and pieces
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = value.color;
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#111';
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
    
    // Draw current piece
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = currentPiece.color;
                    ctx.fillRect(
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                    ctx.strokeStyle = '#111';
                    ctx.strokeRect(
                        (currentPiece.x + x) * BLOCK_SIZE,
                        (currentPiece.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE, BLOCK_SIZE
                    );
                }
            });
        });
    }
}

// Check if piece can move to position
function isValidMove(piece, offsetX, offsetY, newShape = null) {
    const shape = newShape || piece.shape;
    
    return shape.every((row, y) => {
        return row.every((value, x) => {
            if (!value) return true;
            
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;
            
            return (
                newX >= 0 &&
                newX < COLS &&
                newY < ROWS &&
                (newY < 0 || !board[newY][newX])
            );
        });
    });
}

// Rotate piece
function rotatePiece() {
    if (!currentPiece || currentPiece.type === 1) return; // Can't rotate O piece
    
    const originalShape = currentPiece.shape;
    const rotated = Array.from({ length: originalShape[0].length }, () => 
        Array(originalShape.length).fill(0)
    );
    
    for (let y = 0; y < originalShape.length; y++) {
        for (let x = 0; x < originalShape[y].length; x++) {
            rotated[x][originalShape.length - 1 - y] = originalShape[y][x];
        }
    }
    
    if (isValidMove(currentPiece, 0, 0, rotated)) {
        currentPiece.shape = rotated;
    }
}

// Move piece
function movePiece(dirX, dirY) {
    if (!currentPiece) return;
    
    if (isValidMove(currentPiece, dirX, dirY)) {
        currentPiece.x += dirX;
        currentPiece.y += dirY;
        return true;
    } else if (dirY) { // Hit bottom
        lockPiece();
        return false;
    }
    
    return false;
}

// Lock piece in place
function lockPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                
                if (boardY >= 0) {
                    board[boardY][boardX] = {
                        value: 1,
                        color: currentPiece.color
                    };
                }
            }
        });
    });
    
    // Check for completed rows
    let rowsCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            rowsCleared++;
            y++; // Check the same row again
        }
    }
    
    // Update score
    if (rowsCleared) {
        const points = [40, 100, 300, 1200][rowsCleared - 1] || 0;
        score += points;
        scoreElement.textContent = score;
        
        // Increase speed
        if (score > 0 && score % 500 === 0) {
            dropInterval = Math.max(100, dropInterval - 100);
        }
    }
    
    // Create new piece
    currentPiece = createPiece();
    
    // Check for game over
    if (!isValidMove(currentPiece, 0, 0)) {
        gameOver();
    }
}

// Clear completed rows
function clearRows() {
    let rowsCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            rowsCleared++;
            y++; // Check the same row again
        }
    }
    
    return rowsCleared;
}

// Game over
function gameOver() {
    gameActive = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

// Game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (gameActive) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            movePiece(0, 1);
            dropCounter = 0;
        }
        
        draw();
    }
    
    requestAnimationFrame(update);
}

// Restart game
function restartGame() {
    board = createBoard();
    score = 0;
    dropInterval = 1000;
    gameActive = true;
    scoreElement.textContent = '0';
    gameOverScreen.style.display = 'none';
    
    currentPiece = createPiece();
    draw();
    requestAnimationFrame(update);
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameActive && e.key === ' ') {
        restartGame();
        return;
    }
    
    if (!currentPiece || !gameActive) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            // Hard drop
            while (movePiece(0, 1)) {}
            break;
    }
});

// Start game
currentPiece = createPiece();
restartGame();