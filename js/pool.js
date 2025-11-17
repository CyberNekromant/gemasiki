// Исправленная версия игры Бильярд с шкалой силы влево и поддержкой игры вдвоем
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const score1Element = document.getElementById('score1');
    const score2Element = document.getElementById('score2');
    const currentPlayerElement = document.getElementById('current-player');
    const gameOverScreen = document.getElementById('game-over');
    const finalScore1Element = document.getElementById('final-score1');
    const finalScore2Element = document.getElementById('final-score2');
    const winnerElement = document.getElementById('winner');
    const restartBtn = document.getElementById('restart-btn');
    const backBtn = document.getElementById('back-btn');

    // Проверка, что все элементы доступны
    if (!canvas || !ctx || !score1Element || !score2Element || !currentPlayerElement || 
        !gameOverScreen || !finalScore1Element || !finalScore2Element || !winnerElement || 
        !restartBtn || !backBtn) {
        console.error('Ошибка: Один или несколько элементов не найдены');
        alert('Не удалось запустить игру. Проверьте HTML-разметку.');
        return;
    }

    // Инициализация переменных
    const TABLE_WIDTH = 700;
    const TABLE_HEIGHT = 400;
    const POCKET_RADIUS = 25;
    const BALL_RADIUS = 12;
    const FRICTION = 0.98;
    const MIN_SPEED = 0.1;
    let balls = [];
    let cueBalls = {
        player1: null,  // Белый шар для игрока 1
        player2: null   // Красный шар для игрока 2
    };
    let pockets = [];
    let scores = {
        player1: 0,
        player2: 0
    };
    let shotsTaken = {
        player1: 0,
        player2: 0
    };
    let gameActive = true;
    let aiming = true;
    let isMouseDown = false;
    let power = 0;
    let maxPower = 15;
    let powerStartTime = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let currentPlayer = 'player1'; // 'player1' или 'player2'
    let animationFrame;
    let lastShotSuccess = false; // Был ли успешный удар (шар в кармане)

    // Установка размеров canvas
    canvas.width = TABLE_WIDTH;
    canvas.height = TABLE_HEIGHT;

    // Создание карманов
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

    // Создание шаров
    function createBalls() {
        balls = [];
        
        // Белый шар (кай) для игрока 1
        cueBalls.player1 = {
            x: TABLE_WIDTH / 4,
            y: TABLE_HEIGHT / 2 - 30,
            radius: BALL_RADIUS,
            color: '#FFFFFF',
            vx: 0,
            vy: 0,
            isCueBall: true,
            player: 'player1'
        };
        balls.push(cueBalls.player1);
        
        // Красный шар для игрока 2
        cueBalls.player2 = {
            x: TABLE_WIDTH / 4,
            y: TABLE_HEIGHT / 2 + 30,
            radius: BALL_RADIUS,
            color: '#FF0000',
            vx: 0,
            vy: 0,
            isCueBall: true,
            player: 'player2'
        };
        balls.push(cueBalls.player2);
        
        // 15 нумерованных шаров в треугольной форме
        const startX = (3 * TABLE_WIDTH) / 4;
        const startY = TABLE_HEIGHT / 2;
        const rows = 5;
        let ballIndex = 1;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col <= row; col++) {
                const x = startX + row * (BALL_RADIUS * 2 + 2);
                const y = startY - ((row * BALL_RADIUS) - (col * BALL_RADIUS * 2));
                
                balls.push({
                    x: x + (Math.random() - 0.5) * 2,
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

    // Рисование стола
    function drawTable() {
        // Фон стола
        ctx.fillStyle = '#006400';
        ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
        
        // Края стола
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, TABLE_WIDTH - 20, TABLE_HEIGHT - 20);
        
        // Карманы
        pockets.forEach(pocket => {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Разметка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(TABLE_WIDTH / 2, 0);
        ctx.lineTo(TABLE_WIDTH / 2, TABLE_HEIGHT);
        ctx.stroke();
    }

    // Рисование шаров
    function drawBalls() {
        balls.forEach(ball => {
            // Тень
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Шар
            ctx.fillStyle = ball.color;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Граница шара
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Номер шара
            if (ball.number) {
                ctx.fillStyle = ball.number === 8 ? '#FFFFFF' : '#000';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ball.number, ball.x, ball.y);
            }
            
            // Маркер для белого шара
            if (ball.isCueBall) {
                ctx.fillStyle = ball.player === 'player1' ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0, 255, 0, 0.7)';
                ctx.beginPath();
                ctx.arc(ball.x, ball.y - 3, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // Рисование кия
    function drawCue() {
        if (!aiming || !gameActive) return;
        
        const cueBall = cueBalls[currentPlayer];
        if (!cueBall) return;
        
        // Вычисляем направление от шара к мыши
        const angle = Math.atan2(lastMouseY - cueBall.y, lastMouseX - cueBall.x);
        
        // Рисуем кий
        ctx.strokeStyle = currentPlayer === 'player1' ? '#8B4513' : '#FF5252';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(
            cueBall.x - Math.cos(angle) * (BALL_RADIUS + 5),
            cueBall.y - Math.sin(angle) * (BALL_RADIUS + 5)
        );
        ctx.lineTo(
            cueBall.x - Math.cos(angle) * (BALL_RADIUS + 5 + 150),
            cueBall.y - Math.sin(angle) * (BALL_RADIUS + 5 + 150)
        );
        ctx.stroke();
    }

    // Рисование шкал силы
    function drawPowerBars() {
        // Шкала для игрока 1
        drawSinglePowerBar(20, 30, scores.player1, 'Игрок 1', '#FFFFFF', currentPlayer === 'player1' ? power / maxPower : 0);
        
        // Шкала для игрока 2
        drawSinglePowerBar(20, 80, scores.player2, 'Игрок 2', '#FF0000', currentPlayer === 'player2' ? power / maxPower : 0);
    }

    // Рисование одной шкалы силы
    function drawSinglePowerBar(x, y, score, label, color, powerLevel) {
        // Фон шкалы
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, 150, 20);
        
        // Заполнение шкалы
        ctx.fillStyle = `hsl(${120 * powerLevel}, 100%, 50%)`;
        ctx.fillRect(x, y, 150 * powerLevel, 20);
        
        // Рамка шкалы
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 150, 20);
        
        // Текст
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${label}: ${score} очков`, x + 160, y + 15);
        
        // Цветной квадрат для обозначения игрока
        ctx.fillStyle = color;
        ctx.fillRect(x - 15, y + 5, 10, 10);
    }

    // Проверка столкновений шаров
    function checkCollisions() {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];
                
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball1.radius + ball2.radius) {
                    // Столкновение обнаружено
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // Поворот скоростей
                    const vx1 = ball1.vx * cos + ball1.vy * sin;
                    const vy1 = ball1.vy * cos - ball1.vx * sin;
                    const vx2 = ball2.vx * cos + ball2.vy * sin;
                    const vy2 = ball2.vy * cos - ball2.vx * sin;
                    
                    // Конечные скорости
                    const finalVx1 = vx2;
                    const finalVx2 = vx1;
                    
                    // Поворот обратно
                    ball1.vx = finalVx1 * cos - vy1 * sin;
                    ball1.vy = vy1 * cos + finalVx1 * sin;
                    ball2.vx = finalVx2 * cos - vy2 * sin;
                    ball2.vy = vy2 * cos + finalVx2 * sin;
                    
                    // Раздвижение шаров, чтобы избежать застревания
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

    // Проверка попадания в карманы
    function checkPockets() {
        let ballPocketed = false;
        
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            
            pockets.forEach(pocket => {
                const dx = ball.x - pocket.x;
                const dy = ball.y - pocket.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < POCKET_RADIUS - ball.radius) {
                    // Шар забит
                    if (ball.isCueBall) {
                        // Белый/красный шар забит - фол
                        if (ball.player === 'player1') {
                            ball.x = TABLE_WIDTH / 4;
                            ball.y = TABLE_HEIGHT / 2 - 30;
                        } else {
                            ball.x = TABLE_WIDTH / 4;
                            ball.y = TABLE_HEIGHT / 2 + 30;
                        }
                        ball.vx = 0;
                        ball.vy = 0;
                    } else {
                        // Обычный шар забит
                        balls.splice(i, 1);
                        scores[currentPlayer] += 10;
                        updateScoreDisplay();
                        ballPocketed = true;
                    }
                }
            });
        }
        
        return ballPocketed;
    }

    // Движение шаров
    function moveBalls() {
        balls.forEach(ball => {
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Столкновения со стенами
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
            
            // Трение
            ball.vx *= FRICTION;
            ball.vy *= FRICTION;
            
            // Остановка очень медленных шаров
            if (Math.abs(ball.vx) < MIN_SPEED && Math.abs(ball.vy) < MIN_SPEED) {
                ball.vx = 0;
                ball.vy = 0;
            }
        });
    }

    // Проверка окончания игры
    function checkGameOver() {
        // Игра оканчивается, когда все шары кроме киев забиты
        const regularBalls = balls.filter(ball => !ball.isCueBall);
        if (regularBalls.length === 0) {
            gameOver();
        }
    }

    // Игра окончена
    function gameOver() {
        gameActive = false;
        cancelAnimationFrame(animationFrame);
        
        // Определение победителя
        let winner = 'Ничья';
        if (scores.player1 > scores.player2) {
            winner = 'Игрок 1';
        } else if (scores.player2 > scores.player1) {
            winner = 'Игрок 2';
        }
        
        // Показ экрана окончания игры
        finalScore1Element.textContent = scores.player1;
        finalScore2Element.textContent = scores.player2;
        winnerElement.textContent = winner;
        gameOverScreen.style.display = 'block';
    }

    // Обновление отображения счета
    function updateScoreDisplay() {
        score1Element.textContent = scores.player1;
        score2Element.textContent = scores.player2;
        currentPlayerElement.textContent = currentPlayer === 'player1' ? '1' : '2';
    }

    // Переключение игрока
    function switchPlayer() {
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        aiming = true;
        updateScoreDisplay();
    }

    // Перезапуск игры
    function restartGame() {
        scores.player1 = 0;
        scores.player2 = 0;
        shotsTaken.player1 = 0;
        shotsTaken.player2 = 0;
        gameActive = true;
        aiming = true;
        isMouseDown = false;
        power = 0;
        currentPlayer = 'player1';
        lastShotSuccess = false;
        
        score1Element.textContent = '0';
        score2Element.textContent = '0';
        currentPlayerElement.textContent = '1';
        gameOverScreen.style.display = 'none';
        
        createPockets();
        createBalls();
        
        gameLoop();
    }

    // Основной игровой цикл
    function gameLoop() {
        if (!gameActive) return;
        
        // Очистка canvas
        ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
        
        drawTable();
        drawBalls();
        drawPowerBars();
        
        // Рисуем кий только если идет прицеливание
        if (aiming) {
            drawCue();
        }
        
        if (!aiming) {
            moveBalls();
            checkCollisions();
            
            // Проверяем, попал ли шар в карман
            const ballPocketed = checkPockets();
            
            // Проверяем, остановились ли все шары
            const allStopped = balls.every(ball => ball.vx === 0 && ball.vy === 0);
            
            if (allStopped) {
                // Если шар был забит, игрок продолжает ход
                // Если нет - ход переходит другому игроку
                if (!ballPocketed) {
                    switchPlayer();
                }
                checkGameOver();
            }
        }
        
        // Если кнопка мыши нажата, обновляем силу
        if (isMouseDown && aiming) {
            const currentTime = Date.now();
            const holdTime = currentTime - powerStartTime;
            power = Math.min(holdTime / 1000, 1) * maxPower;
        }
        
        requestAnimationFrame(gameLoop);
    }

    // Обработчики мыши
    canvas.addEventListener('mousemove', (e) => {
        if (!gameActive || !aiming) return;
        
        const rect = canvas.getBoundingClientRect();
        lastMouseX = e.clientX - rect.left;
        lastMouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (!gameActive || !aiming) return;
        
        const cueBall = cueBalls[currentPlayer];
        if (!cueBall) return;
        
        isMouseDown = true;
        powerStartTime = Date.now();
        
        // Начинаем прицеливание
        aiming = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!gameActive || !isMouseDown || !aiming) return;
        
        isMouseDown = false;
        aiming = false;
        shotsTaken[currentPlayer]++;
        
        const cueBall = cueBalls[currentPlayer];
        if (!cueBall) return;
        
        // Вычисляем направление
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const dx = mouseX - cueBall.x;
        const dy = mouseY - cueBall.y;
        const angle = Math.atan2(dy, dx);
        
        // Применение силы
        cueBall.vx = Math.cos(angle) * power;
        cueBall.vy = Math.sin(angle) * power;
        
        // Сбрасываем силу
        power = 0;
    });

    // Кнопка перезапуска
    restartBtn.addEventListener('click', function() {
        restartGame();
    });

    // Кнопка возврата на главную
    backBtn.addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    // Установка фокуса на canvas
    canvas.tabIndex = 0;
    canvas.focus();

    // Начальная инициализация игры
    try {
        createPockets();
        createBalls();
        updateScoreDisplay();
        gameLoop();
    } catch (error) {
        console.error('Ошибка при инициализации игры:', error);
        alert('Произошла ошибка при запуске игры. Проверьте консоль браузера для деталей.');
    }
});