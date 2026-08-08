// js/app.js
// Điểm khởi chạy chính của web: màn hình đăng nhập, điều hướng theo vai trò, trang chủ + game, nạp thẻ/giftcode

const App = {
  root: null,
  currentAccount: null,

  async init() {
    this.root = document.getElementById("app-root");
    await Auth.ensureOwnerExists();

    const userId = Auth.getCurrentUserId();
    if (userId) {
      const account = await DB.getUserById(userId);
      const ban = account ? await Auth.checkBan(account.username) : null;
      if (account && !ban) {
        this.currentAccount = account;
        return this.renderMain();
      }
      Auth.clearSession();
    }
    this.renderLogin();
  },

  // ---------------- LOGIN ----------------
  renderLogin() {
    this.root.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <h1 class="brand">Quản Lí Tài Khoản</h1>
          <div id="login-normal">
            <div class="field-group">
              <label>Tên đăng nhập :</label>
              <input id="login-username" type="text" />
            </div>
            <div class="field-group">
              <label>Mật khẩu :</label>
              <input id="login-password" type="password" />
            </div>
            <div id="login-error" class="error"></div>
            <div class="btn-row">
              <button class="btn primary" id="btn-login-ok">OK</button>
              <button class="btn ghost" id="btn-show-token">Đăng nhập bằng token</button>
            </div>
          </div>

          <div id="login-token" class="hidden">
            <h3>Chi tiết đăng nhập bằng token</h3>
            <div class="field-group">
              <label>Token của bạn :</label>
              <input id="login-token-input" type="text" placeholder="Nhập token ở đây" />
            </div>
            <div id="login-token-error" class="error"></div>
            <div class="btn-row">
              <button class="btn primary" id="btn-token-ok">OK</button>
              <button class="btn ghost" id="btn-back-normal">Quay lại</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const normalBox = document.getElementById("login-normal");
    const tokenBox = document.getElementById("login-token");

    document.getElementById("btn-show-token").addEventListener("click", () => {
      normalBox.classList.add("hidden");
      tokenBox.classList.remove("hidden");
    });
    document.getElementById("btn-back-normal").addEventListener("click", () => {
      tokenBox.classList.add("hidden");
      normalBox.classList.remove("hidden");
    });

    document.getElementById("btn-login-ok").addEventListener("click", () => this._doPasswordLogin());
    document.getElementById("login-password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._doPasswordLogin();
    });

    document.getElementById("btn-token-ok").addEventListener("click", () => this._doTokenLogin());
    document.getElementById("login-token-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._doTokenLogin();
    });
  },

  async _doPasswordLogin() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errBox = document.getElementById("login-error");
    errBox.textContent = "";
    if (!username || !password) {
      errBox.textContent = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu";
      return;
    }
    const res = await Auth.loginWithPassword(username, password);
    if (!res.ok) {
      errBox.textContent = res.error;
      return;
    }
    this.currentAccount = res.account;
    this.renderMain();
  },

  async _doTokenLogin() {
    const token = document.getElementById("login-token-input").value.trim();
    const errBox = document.getElementById("login-token-error");
    errBox.textContent = "";
    if (!token) {
      errBox.textContent = "Vui lòng nhập token";
      return;
    }
    const res = await Auth.loginWithToken(token);
    if (!res.ok) {
      errBox.textContent = res.error;
      return;
    }
    this.currentAccount = res.account;
    this.renderMain();
  },

  // ---------------- MAIN APP SHELL ----------------
  renderMain() {
    const account = this.currentAccount;
    const isUser = account.role === "user";
    const canManage = account.role === "owner" || account.role === "admin";

    this.root.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand-small">Quản Lí Tài Khoản</div>
          <div class="who">
            <span class="role-badge role-${account.role}">${account.role}</span>
            <span>${Utils.escapeHtml(account.username)}</span>
          </div>
        </header>
        <nav class="maintabs">
          <button class="maintab-btn active" data-tab="home">Trang Chủ</button>
          ${canManage ? `<button class="maintab-btn" data-tab="manage">Quản Lí</button>` : ""}
          <button class="maintab-btn" data-tab="settings">Cài Đặt</button>
        </nav>
        <main id="main-content" class="main-content"></main>
      </div>
    `;

    const buttons = this.root.querySelectorAll(".maintab-btn");
    const content = document.getElementById("main-content");
    const switchTo = (tab) => {
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      if (tab === "home") this.renderHome(content);
      else if (tab === "manage") Admin.renderShell(content, this.currentAccount);
      else if (tab === "settings") Settings.render(content, this.currentAccount, () => this.renderLogin());
    };
    buttons.forEach((b) => b.addEventListener("click", () => switchTo(b.dataset.tab)));
    switchTo("home");
  },

  // ---------------- TRANG CHỦ ----------------
  renderHome(content) {
    const account = this.currentAccount;
    const isUser = account.role === "user";

    content.innerHTML = `
      ${
        isUser
          ? `
      <div class="wallet-bar">
        <span>Số xu : <b id="wallet-coins">${account.coins ?? 0}</b></span>
        <span>Số Onyx : <b id="wallet-onyx">${account.onyx ?? 0}</b> <button class="plus-btn" id="btn-topup">+</button></span>
        <button class="btn small ghost" id="btn-giftcode">Nhập Giftcode</button>
      </div>`
          : ""
      }
      <div class="home-tabs">
        <button class="home-tab-btn active" data-hometab="game">Game kiếm xu</button>
      </div>
      <div id="home-panel" class="home-panel"></div>
    `;

    if (isUser) {
      content.querySelector("#btn-topup").addEventListener("click", () => this._openTopupModal());
      content.querySelector("#btn-giftcode").addEventListener("click", () => this._openGiftcodeModal());
    }

    this._renderGameTab(content.querySelector("#home-panel"));
  },

  _renderGameTab(panel) {
    panel.innerHTML = `
      <div class="game-launcher">
        <div class="game-tile" id="tile-snake">snake</div>
      </div>
      <div id="game-area" class="game-area hidden"></div>
    `;
    panel.querySelector("#tile-snake").addEventListener("click", () => this._openSnake(panel));
  },

  _openSnake(panel) {
    const area = panel.querySelector("#game-area");
    area.classList.remove("hidden");
    area.innerHTML = `
      <div class="game-header">
        <span>Score: <b id="snake-score">0</b></span>
        <button class="btn small primary" id="btn-snake-start">Chơi</button>
      </div>
      <canvas id="snake-canvas"></canvas>
      <p class="muted small">Điều khiển bằng phím mũi tên (hoặc W A S D). Ăn táo +10 điểm.</p>
      <div id="snake-gameover" class="result-box hidden"></div>
    `;
    const canvas = area.querySelector("#snake-canvas");
    SnakeGame.init(canvas, this.currentAccount);
    SnakeGame.onScoreChange = (score) => {
      area.querySelector("#snake-score").textContent = score;
    };
    SnakeGame.onGameOver = async (score, coinsAwarded) => {
      const box = area.querySelector("#snake-gameover");
      box.classList.remove("hidden");
      box.innerHTML = `
        <p class="error">Game Over! Điểm của bạn: ${score}</p>
        ${
          this.currentAccount.role === "user"
            ? `<p class="success">Bạn nhận được ${coinsAwarded} xu</p>`
            : `<p class="muted">Chỉ tài khoản User mới nhận xu</p>`
        }
      `;
      if (coinsAwarded > 0) {
        this.currentAccount.coins = (this.currentAccount.coins || 0) + coinsAwarded;
        const el = document.getElementById("wallet-coins");
        if (el) el.textContent = this.currentAccount.coins;
      }
    };
    area.querySelector("#btn-snake-start").addEventListener("click", () => {
      area.querySelector("#snake-gameover").classList.add("hidden");
      SnakeGame.start();
    });
  },

  // ---------------- NẠP THẺ ONYX ----------------
  _openTopupModal() {
    this._openModal(`
      <h3>Nạp Onyx bằng thẻ</h3>
      <div class="field-group">
        <label>Mã thẻ :</label>
        <input id="topup-code" type="text" placeholder="Nhập mã thẻ 16 số" />
      </div>
      <button class="btn primary" id="btn-topup-submit">Nạp</button>
      <div id="topup-result" class="result-box"></div>
      <h4>Bảng quy đổi</h4>
      <ul class="rate-list">
        <li>10.000đ = 20 Onyx</li>
        <li>20.000đ = 40 Onyx</li>
        <li>50.000đ = 102 Onyx</li>
        <li>100.000đ = 204 Onyx</li>
        <li>200.000đ = 408 Onyx</li>
        <li>500.000đ = 1020 Onyx</li>
      </ul>
    `);

    document.getElementById("btn-topup-submit").addEventListener("click", async () => {
      const code = document.getElementById("topup-code").value.trim();
      const resultBox = document.getElementById("topup-result");
      if (!code) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập mã thẻ</p>`;
        return;
      }
      const card = await DB.getCard(code);
      if (!card) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập thông tin thẻ chính xác</p>`;
        return;
      }
      if (card.used) {
        resultBox.innerHTML = `<p class="error">Thẻ đã được sử dụng</p>`;
        return;
      }
      if (card.expiresAt < Utils.nowTs()) {
        resultBox.innerHTML = `<p class="error">Thẻ đã hết hạn sử dụng</p>`;
        return;
      }
      await DB.markCardUsed(code, this.currentAccount.username);
      await DB.addOnyx(this.currentAccount.id, card.onyx);
      await DB.addLog(
        this.currentAccount.username,
        "Nạp thẻ",
        `${this.currentAccount.username} đã nạp thẻ Onyx ${card.value.toLocaleString("vi-VN")}đ, mã thẻ ${code}`
      );
      this.currentAccount.onyx = (this.currentAccount.onyx || 0) + card.onyx;
      const el = document.getElementById("wallet-onyx");
      if (el) el.textContent = this.currentAccount.onyx;
      resultBox.innerHTML = `<p class="success">Nạp thành công, +${card.onyx} Onyx</p>`;
    });
  },

  // ---------------- NHẬP GIFTCODE ----------------
  _openGiftcodeModal() {
    this._openModal(`
      <h3>Nhập Giftcode</h3>
      <div class="field-group">
        <label>Mã giftcode :</label>
        <input id="gift-code-input" type="text" placeholder="BLACK=xxxxxxx" />
      </div>
      <button class="btn primary" id="btn-gift-submit">Nhập</button>
      <div id="gift-result" class="result-box"></div>
    `);

    document.getElementById("btn-gift-submit").addEventListener("click", async () => {
      const code = document.getElementById("gift-code-input").value.trim();
      const resultBox = document.getElementById("gift-result");
      if (!code) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập mã giftcode</p>`;
        return;
      }

      // Thử giftcode vĩnh viễn trước
      const perm = await DB.getGiftPermanent(code);
      if (perm) {
        if (perm.usedBy && perm.usedBy[this.currentAccount.username]) {
          resultBox.innerHTML = `<p class="error">Giftcode đã được sử dụng rồi</p>`;
          return;
        }
        await DB.markGiftPermanentUsed(code, this.currentAccount.username);
        if (perm.rewardType === "coins") await DB.addCoins(this.currentAccount.id, perm.amount);
        else await DB.addOnyx(this.currentAccount.id, perm.amount);
        await DB.addLog(
          this.currentAccount.username,
          "Nhập giftcode",
          `${this.currentAccount.username} đã nhập giftcode vĩnh viễn ${code}`
        );
        this._refreshWalletAfterGift(perm.rewardType, perm.amount);
        resultBox.innerHTML = `<p class="success">Nhận thành công ${perm.amount} ${perm.rewardType === "coins" ? "xu" : "Onyx"}</p>`;
        return;
      }

      // Giftcode bất kỳ
      const any = await DB.getGiftAny(code);
      if (!any) {
        resultBox.innerHTML = `<p class="error">Giftcode không hợp lệ</p>`;
        return;
      }
      if (any.used) {
        resultBox.innerHTML = `<p class="error">Giftcode đã được sử dụng</p>`;
        return;
      }
      if (any.expiresAt < Utils.nowTs()) {
        resultBox.innerHTML = `<p class="error">Giftcode đã hết hạn</p>`;
        return;
      }
      const reward = Admin.rollGiftAnyReward();
      await DB.markGiftAnyUsed(code, this.currentAccount.username);
      if (reward.type === "coins") await DB.addCoins(this.currentAccount.id, reward.amount);
      else await DB.addOnyx(this.currentAccount.id, reward.amount);
      await DB.addLog(
        this.currentAccount.username,
        "Nhập giftcode",
        `${this.currentAccount.username} đã nhập giftcode ${code} và nhận ${reward.label}`
      );
      this._refreshWalletAfterGift(reward.type, reward.amount);
      resultBox.innerHTML = `<p class="success">Chúc mừng! Bạn nhận được ${reward.label}</p>`;
    });
  },

  _refreshWalletAfterGift(type, amount) {
    if (type === "coins") {
      this.currentAccount.coins = (this.currentAccount.coins || 0) + amount;
      const el = document.getElementById("wallet-coins");
      if (el) el.textContent = this.currentAccount.coins;
    } else {
      this.currentAccount.onyx = (this.currentAccount.onyx || 0) + amount;
      const el = document.getElementById("wallet-onyx");
      if (el) el.textContent = this.currentAccount.onyx;
    }
  },

  // ---------------- MODAL DÙNG CHUNG ----------------
  _openModal(innerHtml) {
    let overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-box">${innerHtml}<button class="modal-close" id="modal-close-btn">✕</button></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById("modal-close-btn").addEventListener("click", () => overlay.remove());
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
