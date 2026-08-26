// ===== Trang chủ =====

async function renderHomeTab(container) {
  const me = getCurrentUser();
  container.innerHTML = `
    <div class="home-hud">
      <span>Số xu: <b id="hudCoins">${me.coins || 0}</b></span>
      <span>Số Onyx: <b id="hudOnyx">${me.onyx || 0}</b> <span id="onyxPlus" class="onyx-plus">+</span></span>
      <button class="neon-btn small" id="giftcodeBtn">Nhập Giftcode</button>
    </div>
    
    <!-- Tab Game -->
    <div class="sub-tabs" id="gameTabs">
      <button class="sub-tab-btn active" data-tab="games">🎮 Game</button>
      <button class="sub-tab-btn" data-tab="getkey">🔑 Lấy Key</button>
    </div>
    <div id="gameContent" class="sub-content" style="margin-top: 10px;"></div>
  `;

  // Xử lý chuyển tab
  const tabs = container.querySelectorAll('#gameTabs .sub-tab-btn');
  const content = container.querySelector('#gameContent');
  
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      if (tabName === 'games') {
        renderGamesTab(content);
      } else if (tabName === 'getkey') {
        renderGetKeyTab(content);
      }
    };
  });

  // Mặc định hiển thị tab Game (trống)
  renderGamesTab(content);

  container.querySelector("#onyxPlus").onclick = () => openOnyxTopup();
  container.querySelector("#giftcodeBtn").onclick = () => openGiftcodeModal();
}

// Tab Game - TRỐNG, không có game
function renderGamesTab(container) {
  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; color: #888;">
      <p style="font-size: 48px; margin-bottom: 16px;">🎮</p>
      <p style="font-size: 16px; color: var(--neon-cyan);">Chưa có game nào</p>
      <p style="font-size: 13px; color: #666;">Tính năng đang được phát triển</p>
    </div>
  `;
}

// Tab Lấy Key
function renderGetKeyTab(container) {
  container.innerHTML = `
    <h3 class="neon-title-sm">🔑 Lấy Key</h3>
    <div style="background: rgba(0,255,224,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="color: #888; font-size: 13px; margin-bottom: 12px;">
        Developer: <span style="color: var(--neon-yellow);">@Black (black_0x000000)</span>
      </p>
      
      <!-- Key Bản Kín -->
      <div style="background: rgba(255,45,157,0.08); border: 1px solid var(--neon-pink); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
        <p style="color: var(--neon-cyan); font-weight: bold;">🔐 Key Bản Kín - by HN</p>
        <button class="neon-btn" id="getKeyBanKin" style="width: 100%; margin-top: 8px;">
          📥 Lấy Key
        </button>
      </div>
      
      <!-- Key Bản Esp -->
      <div style="background: rgba(185,55,242,0.08); border: 1px solid var(--neon-purple); border-radius: 8px; padding: 14px;">
        <p style="color: var(--neon-yellow); font-weight: bold;">👁️ Key Bản Esp chấp tố - by CakMod&Black</p>
        <button class="neon-btn" id="getKeyEsp" style="width: 100%; margin-top: 8px;">
          📥 Lấy Key
        </button>
      </div>
    </div>
  `;

  // Xử lý lấy Key Bản Kín
  container.querySelector("#getKeyBanKin").onclick = () => {
    window.open('https://mokhoasub.com/pS9U1E', '_blank');
    toast("Đang mở link lấy Key Bản Kín...");
    addLog(`Tài khoản ${getCurrentUser().role}: "${getCurrentUser().username}" đã lấy Key Bản Kín lúc ${nowVN()}`);
  };

  // Xử lý lấy Key Esp
  container.querySelector("#getKeyEsp").onclick = () => {
    window.open('https://admin.ngocthinhmodder.site/gettounlock/getkey/lienquanchapto.php', '_blank');
    toast("Đang mở link lấy Key Esp...");
    addLog(`Tài khoản ${getCurrentUser().role}: "${getCurrentUser().username}" đã lấy Key Esp lúc ${nowVN()}`);
  };
}

async function refreshHomeStats() {
  const me = getCurrentUser();
  const snap = await db.ref("users/" + keyify(me.username)).get();
  if (!snap.exists()) return;
  const u = snap.val();
  setCurrentUser(u);
  const c = document.getElementById("hudCoins");
  const o = document.getElementById("hudOnyx");
  if (c) c.textContent = u.coins || 0;
  if (o) o.textContent = u.onyx || 0;
}

function openOnyxTopup() {
  const modal = el("div", "modal-overlay");
  modal.innerHTML = `
    <div class="modal-box neon-box">
      <div class="modal-close" id="onyxClose">✕</div>
      <h3 class="neon-title-sm">Nạp Onyx</h3>
      <div class="form-row">
        <label>Mã thẻ</label>
        <input id="onyxCardCode" class="neon-input" placeholder="Nhập mã thẻ 16 số">
      </div>
      <button class="neon-btn" id="onyxSubmitBtn">Nạp</button>
      <div id="onyxResult" class="result-box"></div>
      <h4 class="neon-title-sm">Bảng quy đổi</h4>
      <ul class="rate-list">
        <li>10.000đ = 20 Onyx</li>
        <li>20.000đ = 40 Onyx</li>
        <li>50.000đ = 102 Onyx</li>
        <li>100.000đ = 204 Onyx</li>
        <li>200.000đ = 408 Onyx</li>
        <li>500.000đ = 1020 Onyx</li>
      </ul>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector("#onyxClose").onclick = () => modal.remove();
  modal.querySelector("#onyxSubmitBtn").onclick = async () => {
    const code = modal.querySelector("#onyxCardCode").value.trim();
    if (!code) return;
    const res = await redeemCard(code);
    modal.querySelector("#onyxResult").innerHTML = res.ok
      ? `<p>Nạp thành công! +${res.onyx} Onyx</p>`
      : `<p>${res.msg}</p>`;
    if (res.ok) refreshHomeStats();
  };
}

function openGiftcodeModal() {
  const modal = el("div", "modal-overlay");
  modal.innerHTML = `
    <div class="modal-box neon-box">
      <div class="modal-close" id="gcClose">✕</div>
      <h3 class="neon-title-sm">Nhập Giftcode</h3>
      <div class="form-row">
        <label>Giftcode</label>
        <input id="gcInput" class="neon-input" placeholder="BLACK=xxxxxxx">
      </div>
      <button class="neon-btn" id="gcSubmitBtn">Xác nhận</button>
      <div id="gcResult" class="result-box"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector("#gcClose").onclick = () => modal.remove();
  modal.querySelector("#gcSubmitBtn").onclick = async () => {
    const code = modal.querySelector("#gcInput").value.trim();
    if (!code) return;
    const res = await redeemGiftcode(code);
    modal.querySelector("#gcResult").innerHTML = `<p>${res.msg}</p>`;
    if (res.ok) refreshHomeStats();
  };
}
