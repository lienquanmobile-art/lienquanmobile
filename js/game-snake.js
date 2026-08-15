// ===== Game rắn săn táo (Snake) =====

const SNAKE_GRID = 15;
let snakeState = null;
let snakeTimer = null;

function renderSnakeCard(container) {
  console.log("renderSnakeCard được gọi");
  
  if (!container) {
    console.error("container is null");
    return;
  }
  
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "snake-launch-box";
  card.innerHTML = `<div class="snake-icon">🐍</div><div class="snake-label">SNAKE</div>`;
  card.onclick = () => openSnakeGame();
  container.appendChild(card);
  console.log("Đã render game Rắn");
}

function openSnakeGame() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-box neon-box snake-modal">
      <div class="modal-close" id="snakeClose">✕</div>
      <h2 class="neon-title">🐍 RẮN SĂN TÁO</h2>
      <div class="snake-hud">
        <span>Điểm: <b id="snakeScore">0</b></span>
      </div>
      <canvas id="snakeCanvas" width="450" height="450"></canvas>
      <div class="snake-hint">Dùng phím mũi tên / WASD để điều khiển</div>
      <div id="snakeOverBox" class="snake-over" style="display:none;">
        <p style="color: #ff4444; font-size: 20px;">💀 GAME OVER</p>
        <p>Điểm số: <b id="snakeFinalScore">0</b></p>
        <p id="snakeCoinMsg"></p>
        <button class="neon-btn" id="snakeRestart">🔄 Chơi lại</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById("snakeClose").onclick = () => { closeSnake(); modal.remove(); };
  document.getElementById("snakeRestart").onclick = () => startSnake();
  startSnake();
}

function closeSnake() {
  clearInterval(snakeTimer);
  document.removeEventListener("keydown", handleSnakeKey);
}

function startSnake() {
  clearInterval(snakeTimer);
  document.getElementById("snakeOverBox").style.display = "none";
  const cell = 450 / SNAKE_GRID;
  snakeState = {
    body: [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    apple: spawnApple([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]),
    score: 0,
    cell,
    over: false
  };
  document.getElementById("snakeScore").textContent = "0";
  document.removeEventListener("keydown", handleSnakeKey);
  document.addEventListener("keydown", handleSnakeKey);
  drawSnake();
  snakeTimer = setInterval(tickSnake, 120);
}

function spawnApple(body) {
  while (true) {
    const p = { x: Math.floor(Math.random() * SNAKE_GRID), y: Math.floor(Math.random() * SNAKE_GRID) };
    if (!body.some(b => b.x === p.x && b.y === p.y)) return p;
  }
}

function handleSnakeKey(e) {
  if (!snakeState || snakeState.over) return;
  const d = snakeState.dir;
  const map = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
  };
  const nd = map[e.key];
  if (!nd) return;
  if (nd.x === -d.x && nd.y === -d.y) return;
  snakeState.nextDir = nd;
}

function tickSnake() {
  const st = snakeState;
  if (!st || st.over) return;
  st.dir = st.nextDir;
  const head = st.body[0];
  const newHead = { x: head.x + st.dir.x, y: head.y + st.dir.y };

  if (newHead.x < 0 || newHead.y < 0 || newHead.x >= SNAKE_GRID || newHead.y >= SNAKE_GRID) {
    return endSnake();
  }
  if (st.body.some(b => b.x === newHead.x && b.y === newHead.y)) {
    return endSnake();
  }

  st.body.unshift(newHead);
  if (newHead.x === st.apple.x && newHead.y === st.apple.y) {
    st.score += 10;
    document.getElementById("snakeScore").textContent = st.score;
    st.apple = spawnApple(st.body);
  } else {
    st.body.pop();
  }
  drawSnake();
}

function drawSnake() {
  const st = snakeState;
  const canvas = document.getElementById("snakeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const c = st.cell;
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0,255,255,0.08)";
  for (let i = 0; i <= SNAKE_GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * c, 0); ctx.lineTo(i * c, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * c); ctx.lineTo(canvas.width, i * c); ctx.stroke();
  }

  ctx.fillStyle = "#ff2d55";
  ctx.shadowColor = "#ff2d55";
  ctx.shadowBlur = 12;
  ctx.fillRect(st.apple.x * c + 2, st.apple.y * c + 2, c - 4, c - 4);

  ctx.fillStyle = "#00ffe0";
  ctx.shadowColor = "#00ffe0";
  st.body.forEach((b, i) => {
    ctx.shadowBlur = i === 0 ? 18 : 8;
    ctx.fillRect(b.x * c + 1, b.y * c + 1, c - 2, c - 2);
  });
  ctx.shadowBlur = 0;
}

async function endSnake() {
  snakeState.over = true;
  clearInterval(snakeTimer);
  document.getElementById("snakeFinalScore").textContent = snakeState.score;
  document.getElementById("snakeOverBox").style.display = "block";

  const coinMsg = document.getElementById("snakeCoinMsg");
  const user = getCurrentUser();
  if (user && user.role === "user" && snakeState.score > 0) {
    const uSnap = await db.ref("users/" + keyify(user.username) + "/coins").get();
    const cur = uSnap.exists() ? uSnap.val() : 0;
    await db.ref("users/" + keyify(user.username) + "/coins").set(cur + snakeState.score);
    coinMsg.textContent = `🎉 Bạn nhận được ${snakeState.score} xu!`;
    refreshHomeStats();
  } else if (user && user.role !== "user") {
    coinMsg.textContent = "Tài khoản quản lý không nhận xu từ game.";
  }
}

console.log("game-snake.js đã được load!");
