// js/game.js
// Trò chơi rắn săn táo (Snake) 15x15. Mỗi quả táo: +1 khối thân, +10 điểm.
// Điểm số quy đổi 1:1 thành số xu, chỉ tài khoản "user" mới được cộng xu.

const SnakeGame = {
  GRID: 15,
  CELL: 26, // px mỗi ô, canvas = 15*26 = 390px
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  snake: [],
  apple: null,
  score: 0,
  running: false,
  loopId: null,
  speedMs: 160,
  canvas: null,
  ctx: null,
  currentAccount: null,

  init(canvas, account) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.currentAccount = account;
    canvas.width = this.GRID * this.CELL;
    canvas.height = this.GRID * this.CELL;
    this.reset();
    this.draw();
    this._bindKeys();
  },

  reset() {
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    const mid = Math.floor(this.GRID / 2);
    this.snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    this.score = 0;
    this.spawnApple();
    this.running = false;
    if (this.loopId) clearInterval(this.loopId);
  },

  spawnApple() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.GRID),
        y: Math.floor(Math.random() * this.GRID),
      };
    } while (this.snake.some((s) => s.x === pos.x && s.y === pos.y));
    this.apple = pos;
  },

  start() {
    this.reset();
    this.running = true;
    if (this.loopId) clearInterval(this.loopId);
    this.loopId = setInterval(() => this.tick(), this.speedMs);
    this.draw();
  },

  _bindKeys() {
    if (this._keyHandler) document.removeEventListener("keydown", this._keyHandler);
    this._keyHandler = (e) => {
      if (!this.running) return;
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      // Không cho quay đầu 180 độ
      if (nd.x === -this.dir.x && nd.y === -this.dir.y) return;
      this.nextDir = nd;
    };
    document.addEventListener("keydown", this._keyHandler);
  },

  // Cho phép điều khiển bằng nút bấm trên mobile
  setDirection(nd) {
    if (!this.running) return;
    if (nd.x === -this.dir.x && nd.y === -this.dir.y) return;
    this.nextDir = nd;
  },

  async tick() {
    this.dir = this.nextDir;
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    // Đâm tường
    if (newHead.x < 0 || newHead.x >= this.GRID || newHead.y < 0 || newHead.y >= this.GRID) {
      return this.gameOver();
    }
    // Đâm thân
    if (this.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      return this.gameOver();
    }

    this.snake.unshift(newHead);

    if (newHead.x === this.apple.x && newHead.y === this.apple.y) {
      this.score += 10;
      this.spawnApple();
      // Không bỏ đuôi -> thân dài ra 1 khối
    } else {
      this.snake.pop();
    }

    this.draw();

    if (typeof this.onScoreChange === "function") this.onScoreChange(this.score);
  },

  async gameOver() {
    this.running = false;
    clearInterval(this.loopId);

    let coinsAwarded = 0;
    if (this.currentAccount && this.currentAccount.role === "user") {
      coinsAwarded = this.score;
      if (coinsAwarded > 0) {
        await DB.addCoins(this.currentAccount.username, coinsAwarded);
        await DB.addLog(
          this.currentAccount.username,
          "Chơi game Snake",
          `${this.currentAccount.username} đạt ${this.score} điểm và nhận ${coinsAwarded} xu`
        );
      }
    }

    if (typeof this.onGameOver === "function") this.onGameOver(this.score, coinsAwarded);
  },

  draw() {
    const ctx = this.ctx;
    const cell = this.CELL;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // nền lưới
    ctx.fillStyle = "#12141c";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i <= this.GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, this.GRID * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(this.GRID * cell, i * cell);
      ctx.stroke();
    }

    // táo
    ctx.fillStyle = "#e5484d";
    ctx.beginPath();
    ctx.arc(
      this.apple.x * cell + cell / 2,
      this.apple.y * cell + cell / 2,
      cell / 2.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // thân rắn
    this.snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#4ade80" : "#22c55e";
      ctx.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
    });
  },
};
