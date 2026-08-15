// ===== Trang chủ =====

console.log("=== home.js đang được load ===");

async function renderHomeTab(container) {
  console.log("renderHomeTab được gọi");
  
  const me = getCurrentUser();
  container.innerHTML = `
    <div class="home-hud">
      <span>Số xu: <b id="hudCoins">${me.coins || 0}</b></span>
      <span>Số Onyx: <b id="hudOnyx">${me.onyx || 0}</b> <span id="onyxPlus" class="onyx-plus">+</span></span>
      <button class="neon-btn small" id="giftcodeBtn">Nhập Giftcode</button>
    </div>
    <h3 class="neon-title-sm">Game kiếm xu</h3>
    <div id="gameList" class="game-list"></div>
    <h3 class="neon-title-sm" style="margin-top: 30px;">Game Online</h3>
    <div id="onlineGameList" class="game-list"></div>
  `;

  // Game rắn
  if (typeof renderSnakeCard === 'function') {
    renderSnakeCard(container.querySelector("#gameList"));
    console.log("Đã render game Rắn");
  } else {
    console.error("renderSnakeCard không tồn tại!");
  }
  
  // Game nối từ
  if (typeof renderWordChainCard === 'function') {
    renderWordChainCard(container.querySelector("#onlineGameList"));
    console.log("Đã render game Nối từ");
  } else {
    console.error("renderWordChainCard không tồn tại!");
    // Thử tạo card tạm
    const onlineList = container.querySelector("#onlineGameList");
    if (onlineList) {
      onlineList.innerHTML = "";
      const card = document.createElement("div");
      card.className = "snake-launch-box";
      card.innerHTML = `<div class="snake-icon">📝</div><div class="snake-label">NỐI TỪ</div>`;
      card.style.cursor = "pointer";
      card.onclick = () => {
        alert("Đang tải game... Vui lòng refresh trang!");
        openWordChainGame();
      };
      onlineList.appendChild(card);
      console.log("Đã tạo card Nối từ tạm thời");
    }
  }

  const plusBtn = container.querySelector("#onyxPlus");
  if (plusBtn) plusBtn.onclick = () => openOnyxTopup();
  
  const giftBtn = container.querySelector("#giftcodeBtn");
  if (giftBtn) giftBtn.onclick = () => openGiftcodeModal();
  
  console.log("renderHomeTab hoàn thành");
}

async function refreshHomeStats() {
  const me = getCurrentUser();
  if (!me) return;
  
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
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
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
    if (!code) {
      toast("Vui lòng nhập mã thẻ!");
      return;
    }
    const res = await redeemCard(code);
    modal.querySelector("#onyxResult").innerHTML = res.ok
      ? `<p style="color: #5dff8f;">✅ Nạp thành công! +${res.onyx} Onyx</p>`
      : `<p style="color: #ff4444;">❌ ${res.msg}</p>`;
    if (res.ok) refreshHomeStats();
  };
}

function openGiftcodeModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
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
    if (!code) {
      toast("Vui lòng nhập giftcode!");
      return;
    }
    const res = await redeemGiftcode(code);
    modal.querySelector("#gcResult").innerHTML = res.ok
      ? `<p style="color: #5dff8f;">✅ ${res.msg}</p>`
      : `<p style="color: #ff4444;">❌ ${res.msg}</p>`;
    if (res.ok) refreshHomeStats();
  };
}

console.log("home.js đã được load!");
