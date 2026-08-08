// js/admin.js
// Toàn bộ giao diện + logic của tab "Quản Lí" (dành cho Owner và Admin)

const Admin = {
  // Bảng quy đổi thẻ Onyx: mệnh giá (đ) -> Onyx
  CARD_RATES: {
    10000: 20,
    20000: 40,
    50000: 102,
    100000: 204,
    200000: 408,
    500000: 1020,
  },

  // Phần thưởng giftcode "bất kỳ", được roll từ hiếm -> phổ biến
  // (roll từ hiếm nhất trước để giá trị lớn không bị nuốt bởi tỉ lệ cao của giá trị nhỏ)
  GIFT_ANY_REWARDS: [
    { label: "50000 Onyx", type: "onyx", amount: 50000, chance: 0.00004 },
    { label: "10000 Onyx", type: "onyx", amount: 10000, chance: 0.02 },
    { label: "200 Onyx", type: "onyx", amount: 200, chance: 0.08 },
    { label: "100 Onyx", type: "onyx", amount: 100, chance: 0.1 },
    { label: "50000 xu", type: "coins", amount: 50000, chance: 0.15 },
    { label: "10000 xu", type: "coins", amount: 10000, chance: 0.42 },
    { label: "500 xu", type: "coins", amount: 500, chance: 0.5 },
    { label: "200 xu", type: "coins", amount: 200, chance: 0.75 },
    { label: "100 xu", type: "coins", amount: 100, chance: 0.75 },
  ],

  BAN_PRESETS_3Y: [
    "Dùng APK, phần mềm thứ 3, code độc hại",
    "Hack mã thẻ, Hack Giftcode, Hack tỉ lệ",
  ],
  BAN_PRESETS_1W: ["Hack những game có trong web để kiếm xu", "Hack xu, hack Onyx"],

  // ---------------- render khung tab quản lí ----------------
  renderShell(container, account) {
    const isOwner = account.role === "owner";
    container.innerHTML = `
      <div class="admin-subtabs">
        <button class="subtab-btn active" data-tab="accounts">Tài Khoản</button>
        <button class="subtab-btn" data-tab="create">Tạo tài khoản</button>
        ${isOwner ? `<button class="subtab-btn" data-tab="log">Log</button>` : ""}
        <button class="subtab-btn" data-tab="card">Tạo thẻ</button>
        <button class="subtab-btn" data-tab="gift">Tạo giftcode</button>
        <button class="subtab-btn" data-tab="ban">Cấm tài khoản</button>
      </div>
      <div class="admin-panel" id="admin-panel"></div>
    `;
    const panel = container.querySelector("#admin-panel");
    const buttons = container.querySelectorAll(".subtab-btn");
    const switchTo = (tab) => {
      buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      this.renderPanel(panel, tab, account);
    };
    buttons.forEach((b) => b.addEventListener("click", () => switchTo(b.dataset.tab)));
    switchTo("accounts");
  },

  renderPanel(panel, tab, account) {
    switch (tab) {
      case "accounts":
        return this.renderAccountsTab(panel, account);
      case "create":
        return this.renderCreateAccountTab(panel, account);
      case "log":
        return this.renderLogTab(panel, account);
      case "card":
        return this.renderCardTab(panel, account);
      case "gift":
        return this.renderGiftTab(panel, account);
      case "ban":
        return this.renderBanTab(panel, account);
    }
  },

  // ---------------- Tab: Tài Khoản ----------------
  async renderAccountsTab(panel, account) {
    panel.innerHTML = `<p class="muted">Đang tải danh sách tài khoản...</p>`;
    const allUsers = await DB.getAllUsers();
    const users = Object.values(allUsers).filter((a) => a.role === "user");
    const admins = Object.values(allUsers).filter((a) => a.role === "admin");

    const row = (a) => `
      <tr>
        <td>${Utils.escapeHtml(a.username)}</td>
        <td><span class="status-dot ${a.status === "online" ? "on" : "off"}"></span>${a.status}</td>
        <td>${a.onyx ?? 0}</td>
        <td>${a.coins ?? 0}</td>
      </tr>`;

    panel.innerHTML = `
      <h3>Quản lí tài khoản user</h3>
      <table class="data-table">
        <thead><tr><th>Tên tài khoản</th><th>Trạng thái</th><th>Onyx</th><th>Xu</th></tr></thead>
        <tbody>${users.length ? users.map(row).join("") : `<tr><td colspan="4" class="muted">Chưa có tài khoản user</td></tr>`}</tbody>
      </table>
      <h3>Quản lí tài khoản admin</h3>
      <table class="data-table">
        <thead><tr><th>Tên tài khoản</th><th>Trạng thái</th><th>Onyx</th><th>Xu</th></tr></thead>
        <tbody>${admins.length ? admins.map(row).join("") : `<tr><td colspan="4" class="muted">Chưa có tài khoản admin</td></tr>`}</tbody>
      </table>
    `;
  },

  // ---------------- Tab: Tạo tài khoản ----------------
  renderCreateAccountTab(panel, account) {
    const isOwner = account.role === "owner";
    panel.innerHTML = `
      <h3>Tạo tài khoản</h3>
      <div class="field-group">
        <label>Loại tài khoản</label>
        <select id="new-acc-role">
          ${isOwner ? `<option value="admin">Admin</option>` : ""}
          <option value="user">User</option>
        </select>
      </div>
      <div class="field-group">
        <label>Tên đăng nhập</label>
        <input id="new-acc-username" type="text" placeholder="Nhập tên đăng nhập" />
      </div>
      <div class="field-group">
        <label>Mật khẩu</label>
        <input id="new-acc-password" type="password" placeholder="Nhập mật khẩu" />
      </div>
      <button class="btn primary" id="btn-create-acc">Tạo</button>
      <div id="create-acc-result" class="result-box"></div>
    `;

    panel.querySelector("#btn-create-acc").addEventListener("click", async () => {
      const role = panel.querySelector("#new-acc-role").value;
      const username = panel.querySelector("#new-acc-username").value.trim();
      const password = panel.querySelector("#new-acc-password").value;
      const resultBox = panel.querySelector("#create-acc-result");

      if (!username || !password) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu</p>`;
        return;
      }
      const existing = await DB.getUserByUsername(username);
      if (existing) {
        resultBox.innerHTML = `<p class="error">Tên đăng nhập đã tồn tại</p>`;
        return;
      }
      const tokens = await DB.getAllTokens();
      const token = Utils.generateUniqueToken(tokens);
      const hash = await Utils.hashPassword(password);
      await DB.createUser(username, hash, role, token);
      await DB.addLog(
        account.username,
        "Tạo tài khoản",
        `${account.username} đã tạo tài khoản ${role} "${username}"`
      );
      resultBox.innerHTML = `
        <p class="success">Tạo tài khoản thành công!</p>
        <p>Token tài khoản (vừa được tạo): <code>${token}</code></p>
      `;
    });
  },

  // ---------------- Tab: Log ----------------
  async renderLogTab(panel, account) {
    panel.innerHTML = `<p class="muted">Đang tải log...</p>`;
    const logs = await DB.getLogs();
    const filtered = logs.filter((l) => l.actor !== "owner");
    const allUsers = await DB.getAllUsers();

    panel.innerHTML = `
      <h3>Lịch sử hoạt động</h3>
      <div class="log-list">
        ${
          filtered.length
            ? filtered
                .map(
                  (l) => `<div class="log-item"><span class="log-time">[${Utils.formatDateTime(l.time)}]</span> ${Utils.escapeHtml(l.detail || `${l.actor} - ${l.action}`)}</div>`
                )
                .join("")
            : `<p class="muted">Chưa có hoạt động nào</p>`
        }
      </div>
      <h3>Token</h3>
      <table class="data-table">
        <thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Token</th></tr></thead>
        <tbody>
          ${Object.values(allUsers)
            .map((a) => `<tr><td>${Utils.escapeHtml(a.username)}</td><td>${a.role}</td><td><code>${a.token}</code></td></tr>`)
            .join("")}
        </tbody>
      </table>
    `;
  },

  // ---------------- Tab: Tạo thẻ (Onyx) ----------------
  renderCardTab(panel, account) {
    panel.innerHTML = `
      <h3>Tạo thẻ</h3>
      <div class="field-group">
        <label>Mệnh giá</label>
        <select id="card-value">
          ${Object.keys(this.CARD_RATES)
            .map((v) => `<option value="${v}">${Number(v).toLocaleString("vi-VN")}đ</option>`)
            .join("")}
        </select>
      </div>
      <button class="btn primary" id="btn-create-card">Tạo thẻ</button>
      <div id="card-result" class="result-box"></div>
      <h3>Log thẻ</h3>
      <div id="card-log" class="log-list"><p class="muted">Đang tải...</p></div>
    `;

    panel.querySelector("#btn-create-card").addEventListener("click", async () => {
      const value = Number(panel.querySelector("#card-value").value);
      const onyx = this.CARD_RATES[value];
      const existing = await DB.getAllCardCodes();
      const code = Utils.generateUniqueCardCode(existing);
      const card = await DB.createCard(code, value, onyx, account.username);
      await DB.addLog(
        account.username,
        "Tạo thẻ",
        `${account.username} đã tạo thẻ Onyx ${value.toLocaleString("vi-VN")}đ, mã thẻ ${code}`
      );
      const resultBox = panel.querySelector("#card-result");
      resultBox.innerHTML = `
        <p class="success">Tạo thẻ thành công</p>
        <p>Thẻ Onyx mệnh giá: <b>${value.toLocaleString("vi-VN")}đ</b> (${onyx} Onyx)</p>
        <p>Mã thẻ: <code>${card.code}</code></p>
        <p>Thời gian còn lại: <span id="card-countdown">24:00:00</span></p>
      `;
      this._runCardCountdown(resultBox.querySelector("#card-countdown"), card.expiresAt);
      this._loadCardLog(panel.querySelector("#card-log"));
    });

    this._loadCardLog(panel.querySelector("#card-log"));
  },

  _runCardCountdown(el, expiresAt) {
    if (!el) return;
    const update = () => {
      const remain = expiresAt - Utils.nowTs();
      if (remain <= 0) {
        el.textContent = "Đã hết hạn";
        clearInterval(timer);
        return;
      }
      el.textContent = Utils.formatCountdown(remain).slice(3); // bỏ phần ngày (luôn 0 vì hạn 24h)
    };
    update();
    const timer = setInterval(update, 1000);
  },

  async _loadCardLog(container) {
    const cards = await DB.getAllCards();
    const now = Utils.nowTs();
    const list = Object.values(cards).sort((a, b) => {
      // ưu tiên thẻ chưa dùng lên trên
      const rank = (c) => (!c.used && c.expiresAt > now ? 0 : 1);
      return rank(a) - rank(b) || b.createdAt - a.createdAt;
    });
    container.innerHTML = list.length
      ? list
          .map((c) => {
            let state = "Còn hạn";
            if (c.used) state = `Đã sử dụng bởi ${c.usedBy}`;
            else if (c.expiresAt < now) state = "Hết hạn";
            return `<div class="log-item">Mã <code>${c.code}</code> - ${c.value.toLocaleString("vi-VN")}đ (${c.onyx} Onyx) - <b>${state}</b></div>`;
          })
          .join("")
      : `<p class="muted">Chưa có thẻ nào</p>`;
  },

  // ---------------- Tab: Tạo giftcode ----------------
  renderGiftTab(panel, account) {
    panel.innerHTML = `
      <h3>Giftcode bất kỳ</h3>
      <p class="muted">Hạn dùng 48h, chỉ dùng được 1 lần. Phần thưởng ngẫu nhiên theo tỉ lệ khi người chơi nhập code.</p>
      <button class="btn primary" id="btn-create-gift-any">Tạo giftcode</button>
      <div id="gift-any-result" class="result-box"></div>

      <h3>Giftcode vĩnh viễn</h3>
      <div class="field-group">
        <label>Phần thưởng</label>
        <select id="gift-perm-type">
          <option value="coins">Xu</option>
          <option value="onyx">Onyx</option>
        </select>
      </div>
      <div class="field-group">
        <label>Số lượng</label>
        <input id="gift-perm-amount" type="number" min="1" placeholder="Ví dụ: 10, 100, 1000..." />
      </div>
      <div class="field-group">
        <label>Tên giftcode (BLACK=&lt;7 ký tự&gt;)</label>
        <div class="inline-prefix">
          <span>BLACK=</span>
          <input id="gift-perm-suffix" type="text" maxlength="7" placeholder="7 chữ và số" />
        </div>
      </div>
      <button class="btn primary" id="btn-create-gift-perm">Tạo giftcode</button>
      <div id="gift-perm-result" class="result-box"></div>
    `;

    panel.querySelector("#btn-create-gift-any").addEventListener("click", async () => {
      const existing = await DB.getAllGiftAnyCodes();
      const code = Utils.generateUniqueGiftcode(existing);
      await DB.createGiftAny(code, account.username);
      await DB.addLog(account.username, "Tạo giftcode", `${account.username} đã tạo giftcode bất kỳ ${code}`);
      panel.querySelector("#gift-any-result").innerHTML = `
        <p class="success">Tạo giftcode thành công</p>
        <p>Mã giftcode: <code>${code}</code></p>
        <p class="muted">Hết hạn sau 48 giờ kể từ bây giờ</p>
      `;
    });

    panel.querySelector("#btn-create-gift-perm").addEventListener("click", async () => {
      const type = panel.querySelector("#gift-perm-type").value;
      const amount = Number(panel.querySelector("#gift-perm-amount").value);
      const suffix = panel.querySelector("#gift-perm-suffix").value.trim();
      const resultBox = panel.querySelector("#gift-perm-result");

      if (!amount || amount <= 0) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập số lượng hợp lệ</p>`;
        return;
      }
      if (!/^[A-Za-z0-9]{7}$/.test(suffix)) {
        resultBox.innerHTML = `<p class="error">Tên giftcode phải gồm đúng 7 chữ và số</p>`;
        return;
      }
      const code = "BLACK=" + suffix;
      const existing = await DB.getGiftPermanent(code);
      if (existing) {
        resultBox.innerHTML = `<p class="error">Giftcode này đã tồn tại, hãy chọn tên khác</p>`;
        return;
      }
      await DB.createGiftPermanent(code, type, amount, account.username);
      await DB.addLog(
        account.username,
        "Tạo giftcode vĩnh viễn",
        `${account.username} đã tạo giftcode vĩnh viễn ${code} (${amount} ${type === "coins" ? "xu" : "Onyx"})`
      );
      resultBox.innerHTML = `<p class="success">Tạo giftcode vĩnh viễn thành công: <code>${code}</code></p>`;
    });
  },

  // ---------------- Tab: Cấm tài khoản ----------------
  renderBanTab(panel, account) {
    const isOwner = account.role === "owner";
    panel.innerHTML = `
      <h3>Mục cấm</h3>
      <div class="field-group">
        <label>Tài khoản bị cấm</label>
        <input id="ban-username" type="text" placeholder="Nhập tên tài khoản" />
      </div>
      <div class="field-group">
        <label>Token</label>
        <input id="ban-token" type="text" placeholder="Token của tài khoản bị cấm" />
      </div>
      <div class="field-group">
        <label>Thời gian cấm</label>
        <div class="time-inputs">
          <input id="ban-sec" type="number" min="0" placeholder="Giây" />
          <input id="ban-min" type="number" min="0" placeholder="Phút" />
          <input id="ban-hour" type="number" min="0" placeholder="Giờ" />
          <input id="ban-day" type="number" min="0" placeholder="Ngày" />
          <input id="ban-year" type="number" min="0" placeholder="Năm" />
        </div>
        <label class="checkbox-label"><input type="checkbox" id="ban-permanent" /> Vĩnh Viễn</label>
      </div>
      <div class="field-group">
        <label>Lý do có sẵn (tự động điền thời gian cấm)</label>
        <select id="ban-preset">
          <option value="">-- Không chọn --</option>
          <optgroup label="Cấm 3 năm">
            ${this.BAN_PRESETS_3Y.map((r) => `<option value="3y|${r}">${r}</option>`).join("")}
          </optgroup>
          <optgroup label="Cấm 1 tuần">
            ${this.BAN_PRESETS_1W.map((r) => `<option value="1w|${r}">${r}</option>`).join("")}
          </optgroup>
        </select>
      </div>
      <div class="field-group">
        <label>Lý do khác</label>
        <input id="ban-reason-other" type="text" placeholder="Nhập lý do khác (tùy chọn)" />
      </div>
      <button class="btn danger" id="btn-ban">Cấm</button>
      <div id="ban-result" class="result-box"></div>

      <h3>Danh sách cấm</h3>
      <table class="data-table">
        <thead><tr><th>Tên</th><th>Thời gian cấm</th><th></th></tr></thead>
        <tbody id="ban-list-body"><tr><td colspan="3" class="muted">Đang tải...</td></tr></tbody>
      </table>
    `;

    const presetSelect = panel.querySelector("#ban-preset");
    presetSelect.addEventListener("change", () => {
      if (!presetSelect.value) return;
      const [dur, reason] = presetSelect.value.split("|");
      panel.querySelector("#ban-reason-other").value = "";
      panel.querySelector("#ban-sec").value = 0;
      panel.querySelector("#ban-min").value = 0;
      panel.querySelector("#ban-hour").value = 0;
      panel.querySelector("#ban-year").value = dur === "3y" ? 3 : 0;
      panel.querySelector("#ban-day").value = dur === "1w" ? 7 : 0;
      panel.querySelector("#ban-permanent").checked = false;
      presetSelect.dataset.reason = reason;
    });

    panel.querySelector("#btn-ban").addEventListener("click", async () => {
      const resultBox = panel.querySelector("#ban-result");
      const username = panel.querySelector("#ban-username").value.trim();
      const token = panel.querySelector("#ban-token").value.trim();
      const permanent = panel.querySelector("#ban-permanent").checked;

      if (!username) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập tên tài khoản cần cấm</p>`;
        return;
      }
      const target = await DB.getUserByUsername(username);
      if (!target) {
        resultBox.innerHTML = `<p class="error">Tài khoản không tồn tại</p>`;
        return;
      }
      if (token && target.token !== token) {
        resultBox.innerHTML = `<p class="error">Token không khớp với tài khoản này</p>`;
        return;
      }
      if (target.role === "owner") {
        resultBox.innerHTML = `<p class="error">Không thể cấm tài khoản Owner</p>`;
        return;
      }
      if (!isOwner && target.role === "admin") {
        resultBox.innerHTML = `<p class="error">Tài khoản Admin không thể cấm tài khoản Admin khác</p>`;
        return;
      }

      const reasonPreset = presetSelect.dataset.reason || "";
      const reasonOther = panel.querySelector("#ban-reason-other").value.trim();
      const reason = reasonOther || reasonPreset || "Không có lý do cụ thể";

      let untilTs = null;
      if (!permanent) {
        const sec = Number(panel.querySelector("#ban-sec").value) || 0;
        const min = Number(panel.querySelector("#ban-min").value) || 0;
        const hour = Number(panel.querySelector("#ban-hour").value) || 0;
        const day = Number(panel.querySelector("#ban-day").value) || 0;
        const year = Number(panel.querySelector("#ban-year").value) || 0;
        const totalMs =
          (sec + min * 60 + hour * 3600 + day * 86400 + year * 365 * 86400) * 1000;
        if (totalMs <= 0) {
          resultBox.innerHTML = `<p class="error">Vui lòng nhập thời gian cấm hoặc tick Vĩnh Viễn</p>`;
          return;
        }
        untilTs = Utils.nowTs() + totalMs;
      }

      await DB.setBan(username, { untilTs, permanent, reason, bannedBy: account.username });
      await DB.addLog(
        account.username,
        "Cấm tài khoản",
        `${account.username} đã cấm tài khoản ${username} - Lý do: ${reason}`
      );
      resultBox.innerHTML = `<p class="success">Đã cấm tài khoản ${Utils.escapeHtml(username)}</p>`;
      this._loadBanList(panel.querySelector("#ban-list-body"), account);
    });

    this._loadBanList(panel.querySelector("#ban-list-body"), account);
  },

  async _loadBanList(tbody, account) {
    const bans = await DB.getAllBans();
    const entries = Object.entries(bans);
    if (!entries.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">Chưa có tài khoản nào bị cấm</td></tr>`;
      return;
    }
    tbody.innerHTML = entries
      .map(
        ([name, b]) => `
        <tr data-username="${Utils.escapeHtml(name)}">
          <td>${Utils.escapeHtml(name)}</td>
          <td class="ban-countdown">${b.permanent ? "Vĩnh viễn" : Utils.formatCountdown(b.untilTs - Utils.nowTs())}</td>
          <td><button class="btn small unlock-btn">Mở khóa</button></td>
        </tr>`
      )
      .join("");

    tbody.querySelectorAll(".unlock-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const username = e.target.closest("tr").dataset.username;
        await DB.removeBan(username);
        await DB.addLog(account.username, "Mở khóa tài khoản", `${account.username} đã mở khóa tài khoản ${username}`);
        this._loadBanList(tbody, account);
      });
    });

    if (this._banInterval) clearInterval(this._banInterval);
    this._banInterval = setInterval(() => {
      tbody.querySelectorAll("tr").forEach(async (tr) => {
        const username = tr.dataset.username;
        if (!username) return;
        const cell = tr.querySelector(".ban-countdown");
        if (!cell || cell.textContent === "Vĩnh viễn") return;
        const b = bans[username];
        if (!b) return;
        const remain = b.untilTs - Utils.nowTs();
        if (remain <= 0) {
          await DB.removeBan(username);
          this._loadBanList(tbody, account);
          return;
        }
        cell.textContent = Utils.formatCountdown(remain);
      });
    }, 1000);
  },

  // Dùng khi user nhập giftcode "bất kỳ": roll phần thưởng theo tỉ lệ (hiếm -> phổ biến)
  rollGiftAnyReward() {
    for (const r of this.GIFT_ANY_REWARDS) {
      if (Math.random() < r.chance) return r;
    }
    // fallback (không nên xảy ra vì mục 100 xu có tỉ lệ 75%)
    return this.GIFT_ANY_REWARDS[this.GIFT_ANY_REWARDS.length - 1];
  },
};
