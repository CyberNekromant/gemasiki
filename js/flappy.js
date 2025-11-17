// Исправленная версия игры Флаппи Берд
document.addEventListener('DOMContentLoaded', function() {
    // Объявляем canvas как let
    let canvas = document.getElementById('game-canvas');
    let ctx = canvas ? canvas.getContext('2d') : null;
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    const restartBtn = document.getElementById('restart-btn');
    const backBtn = document.getElementById('back-btn');

    // Проверка, что все элементы доступны
    if (!canvas || !ctx || !scoreElement || !highScoreElement || !gameOverScreen || !finalScoreElement || !restartBtn || !backBtn) {
        console.error('Ошибка: Один или несколько элементов не найдены');
        alert('Не удалось запустить игру. Проверьте HTML-разметку.');
        return;
    }

    // Настройки игры
    const BIRD_WIDTH = 40;
    const BIRD_HEIGHT = 30;
    const GRAVITY = 0.5;
    const FLAP_POWER = -8;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 150;
    let PIPE_SPEED = 3;
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
    let rotation = 0;

    // Установка размеров canvas
    canvas.width = 400;
    canvas.height = 600;

    // Загрузка рекорда
    let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
    highScoreElement.textContent = highScore;

    // Рисование птицы
    function drawBird() {
        ctx.save();
        
        // Центр вращения в центре птицы
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        
        // Вращение на основе скорости
        rotation = Math.min(0.5, Math.max(-0.5, bird.vy / 15));
        ctx.rotate(rotation * Math.PI);
        
        // Тело птицы
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-bird.width / 2, 0);
        ctx.lineTo(bird.width / 2, 0);
        ctx.lineTo(bird.width * 0.3, -bird.height * 0.5);
        ctx.lineTo(bird.width * 0.1, -bird.height * 0.7);
        ctx.lineTo(-bird.width * 0.1, -bird.height * 0.8);
        ctx.lineTo(-bird.width * 0.3, -bird.height * 0.7);
        ctx.lineTo(-bird.width * 0.4, -bird.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Глаз птицы
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(bird.width * 0.1, -bird.height * 0.2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Клюв
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(bird.width * 0.3, -bird.height * 0.3);
        ctx.lineTo(bird.width * 0.5, -bird.height * 0.4);
        ctx.lineTo(bird.width * 0.4, -bird.height * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Крыло
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(-bird.width * 0.2, bird.height * 0.1);
        ctx.lineTo(0, bird.height * 0.4);
        ctx.lineTo(bird.width * 0.2, bird.height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    // Рисование труб
    function drawPipes() {
        pipes.forEach(pipe => {
            // Верхняя труба
            ctx.fillStyle = '#006400';
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
            
            // Нижняя труба
            ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height);
            
            // Шапки труб
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
            ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
        });
    }

    // Рисование фона
    function drawBackground(timestamp) {
        // Небо
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#1E90FF');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Облака
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const x = ((timestamp / 3000) + i * 100) % (canvas.width + 100) - 50;
            const y = 50 + i * 20;
            
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.arc(x + 20, y - 5, 20, 0, Math.PI * 2);
            ctx.arc(x + 40, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Земля
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 10);
        
        // Трава
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < canvas.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, canvas.height - 40);
            ctx.lineTo(i + 5, canvas.height - 45);
            ctx.lineTo(i + 10, canvas.height - 40);
            ctx.fill();
        }
    }

    // Создание новой трубы
    function createPipe() {
        const topHeight = Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
        
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            passed: false
        });
    }

    // Движение труб
    function movePipes() {
        pipes.forEach(pipe => {
            pipe.x -= PIPE_SPEED;
        });
        
        // Удаление труб, ушедших за экран
        pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    }

    // Проверка столкновений
    function checkCollisions() {
        // Столкновение с землей
        if (bird.y + bird.height / 2 > canvas.height - 40) {
            gameOver();
            return;
        }
        
        // Столкновение с потолком
        if (bird.y - bird.height * 0.4 < 0) {
            bird.y = bird.height * 0.4;
            bird.vy = 0;
        }
        
        // Столкновение с трубами
        pipes.forEach(pipe => {
            const birdTop = bird.y - bird.height * 0.4;
            const birdBottom = bird.y + bird.height / 2;
            const birdLeft = bird.x - bird.width / 2;
            const birdRight = bird.x + bird.width / 2;
            
            if (
                birdRight > pipe.x &&
                birdLeft < pipe.x + PIPE_WIDTH &&
                (
                    birdTop < pipe.topHeight ||
                    birdBottom > pipe.topHeight + PIPE_GAP
                )
            ) {
                gameOver();
            }
            
            // Начисление очков при прохождении трубы
            if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
                pipe.passed = true;
                score++;
                scoreElement.textContent = score;
                
                // Увеличение скорости каждые 5 очков
                if (score % 5 === 0) {
                    PIPE_SPEED += 0.5;
                }
            }
        });
    }

    // Игра окончена
    function gameOver() {
        gameActive = false;
        cancelAnimationFrame(animationFrame);
        
        // Обновление рекорда
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
            highScoreElement.textContent = highScore;
        }
        
        // Показ экрана окончания игры
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'block';
    }

    // Перезапуск игры
    function restartGame() {
        canvas.width = 400;
        canvas.height = 600;
        
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
        
        lastPipeTime = performance.now();
        
        gameLoop(0);
    }

    // Основной игровой цикл
    function gameLoop(timestamp) {
        if (!gameActive) return;
        
        // Очистка canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисование фона
        drawBackground(timestamp);
        
        // Создание труб
        if (timestamp - lastPipeTime > PIPE_INTERVAL) {
            createPipe();
            lastPipeTime = timestamp;
        }
        
        // Движение птицы
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        
        // Движение труб
        movePipes();
        
        // Рисование игровых объектов
        drawPipes();
        drawBird();
        
        // Проверка столкновений
        checkCollisions();
        
        // Продолжение игрового цикла
        animationFrame = requestAnimationFrame(gameLoop);
    }

    // Обработчики событий
    document.addEventListener('keydown', (e) => {
        if (!gameActive && e.key === ' ') {
            restartGame();
            return;
        }
        
        if (e.key === ' ' && gameActive) {
            bird.vy = FLAP_POWER;
        }
    });

    canvas.addEventListener('click', (e) => {
        if (!gameActive) {
            restartGame();
        } else {
            bird.vy = FLAP_POWER;
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameActive) {
            restartGame();
        } else {
            bird.vy = FLAP_POWER;
        }
    });

    // Кнопка перезапуска
    restartBtn.addEventListener('click', function() {
        restartGame();
    });

    // Кнопка возврата на главную
    backBtn.addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    // Начальная инициализация игры
    try {
        restartGame();
    } catch (error) {
        console.error('Ошибка при инициализации игры:', error);
        alert('Произошла ошибка при запуске игры. Проверьте консоль браузера для деталей.');
    }
});