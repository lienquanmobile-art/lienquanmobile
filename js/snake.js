let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameRunning = false;
let gameLoop = null;
let gameSpeed = 150;

// Initialize snake game
function initSnakeGame() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowUp': changeDirection('up'); e.preventDefault(); break;
            case 'ArrowDown': changeDirection('down'); e.preventDefault(); break;
            case 'ArrowLeft': changeDirection('left'); e.preventDefault(); break;
            case 'ArrowRight': changeDirection('right'); e.preventDefault(); break;
            case ' ': startGame(); e.preventDefault(); break;
        }
    });
    
    resetGame();
}

// Change direction
function changeDirection(direction) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (direction !== opposites[nextDirection] && direction !== nextDirection) {
        nextDirection = direction;
    }
}

// Start game
function startGame() {
    if (gameRunning) return;
    if (snake.length < 2) {
        resetGame();
    }
    gameRunning = true;
    document.getElementById('start-btn').textContent = 'Đang chơi...';
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, gameSpeed);
}

// Reset game
function resetGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    gameRunning = false;
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.textContent = 'Bắt đầu';
    
    // Reset snake
    snake = [
        { x: 7, y: 7 },
        { x: 6, y: 7 },
        { x: 5, y: 7 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    const scoreEl = document.getElementById('snake-score');
    const xuEl = document.getElementById('snake-xu');
    if (scoreEl) scoreEl.textContent = '0';
    if (xuEl) xuEl.textContent = '0';
    generateFood();
    draw();
}

// Generate food
function generateFood() {
    let newFood;
    let valid = false;
    while (!valid) {
        newFood = {
            x: Math.floor(Math.random() * 15),
            y: Math.floor(Math.random() * 15)
        };
        valid = !snake.some(function(segment) {
            return segment.x === newFood.x && segment.y === newFood.y;
        });
    }
    food = newFood;
}

// Game tick
function gameTick() {
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(function(segment) {
        return segment.x === head.x && segment.y === head.y;
    })) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('snake-score').textContent = score;
        document.getElementById('snake-xu').textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
    
    draw();
}

// Game over
function gameOver() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    gameRunning = false;
    document.getElementById('start-btn').textContent = 'Bắt đầu';
    alert('Game Over! Điểm của bạn: ' + score);
    
    // Save xu for user
    if (currentUser && currentUser.role === 'user') {
        saveXu(score);
    }
}

// Save xu
function saveXu(xu) {
    db.ref('users/' + currentUser.id).once('value', function(snapshot) {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const currentXu = userData.xu || 0;
            db.ref('users/' + currentUser.id).update({
                xu: currentXu + xu
            });
        }
    });
}

// Draw game
function draw() {
    ctx.clearRect(0, 0, 450, 450);
    
    // Draw grid
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 15; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 30, 0);
        ctx.lineTo(i * 30, 450);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 30);
        ctx.lineTo(450, i * 30);
        ctx.stroke();
    }
    
    // Draw snake
    snake.forEach(function(segment, index) {
        ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 10;
        ctx.fillRect(segment.x * 30 + 1, segment.y * 30 + 1, 28, 28);
        ctx.shadowBlur = 0;
    });
    
    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(food.x * 30 + 15, food.y * 30 + 15, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}
