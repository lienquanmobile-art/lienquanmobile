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
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    gameContainer.innerHTML = `
        <div class="game-container">
            <div class="score-display">
                <span>Điểm: <span id="snake-score">0</span></span>
                <span style="margin-left: 20px;">Xu: <span id="snake-xu">0</span></span>
            </div>
            <canvas id="snake-canvas" width="450" height="450"></canvas>
            <div class="game-controls">
                <button onclick="startGame()" class="btn btn-primary" id="start-btn">Bắt đầu</button>
                <button onclick="resetGame()" class="btn btn-danger">Reset</button>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                <button onclick="changeDirection('up')" class="btn btn-secondary">↑</button>
                <button onclick="changeDirection('down')" class="btn btn-secondary">↓</button>
                <button onclick="changeDirection('left')" class="btn btn-secondary">←</button>
                <button onclick="changeDirection('right')" class="btn btn-secondary">→</button>
            </div>
        </div>
    `;
    
    canvas = document.getElementById('snake-canvas');
    ctx = canvas.getContext('2d');
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
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
    document.getElementById('start-btn').textContent = 'Bắt đầu';
    
    // Reset snake
    snake = [
        { x: 7, y: 7 },
        { x: 6, y: 7 },
        { x: 5, y: 7 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    document.getElementById('snake-score').textContent = '0';
    document.getElementById('snake-xu').textContent = '0';
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
        valid = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
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
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
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
    alert(`Game Over! Điểm của bạn: ${score}`);
    
    // Save xu for user
    if (currentUser && currentUser.role === 'user') {
        saveXu(score);
    }
}

// Save xu
async function saveXu(xu) {
    try {
        const userRef = ref(db, `users/${currentUser.id}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const currentXu = userData.xu || 0;
            await update(userRef, {
                xu: currentXu + xu
            });
            document.getElementById('snake-xu').textContent = xu;
        }
    } catch (error) {
        console.error('Save xu error:', error);
    }
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
    snake.forEach((segment, index) => {
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

// Export for dashboard
export { initSnakeGame };
