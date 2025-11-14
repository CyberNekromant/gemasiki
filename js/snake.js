// Инициализация игры
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Настройки игры
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let food = generateFood();
let dx = 0;
let dy = 0;
let score = 0;
let gameSpeed = 100;
let gameInterval;
let gameActive = true;

// Загрузка рекорда
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

// Генерация еды
function generateFood() {
    return {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

// Проверка столкновений
function checkCollision() {
    const head = snake[0];
    
    // Столкновение со стенами
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Столкновение с телом
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Отрисовка игры
function drawGame() {
    // Очистка холста
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка змейки
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4CAF50' : '#8BC34A';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
        
        // Глаза для головы
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + 4, 4, 4);
            ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 4, 4, 4);
        }
    });
    
    // Отрисовка еды
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Обновление игры
function updateGame() {
    if (!gameActive) return;
    
    // Движение змеи
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    // Проверка поедания еды
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        food = generateFood();
        
        // Ускорение игры каждые 50 очков
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 5;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        snake.pop();
    }
    
    // Проверка столкновений
    if (checkCollision()) {
        gameOver();
    }
}

// Игровой цикл
function gameLoop() {
    updateGame();
    drawGame();
}

// Завершение игры
function gameOver() {
    gameActive = false;
    clearInterval(gameInterval);
    
    // Обновление рекорда
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Показ экрана конца игры
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

// Перезапуск игры
function restartGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 100;
    gameActive = true;
    scoreElement.textContent = '0';
    gameOverScreen.style.display = 'none';
    
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Обработка управления
document.addEventListener('keydown', (e) => {
    if (!gameActive && e.key === ' ') {
        restartGame();
        return;
    }
    
    switch(e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

// Запуск игры
gameInterval = setInterval(gameLoop, gameSpeed);

// Клик по холсту для фокуса
canvas.addEventListener('click', () => {
    canvas.focus();
});