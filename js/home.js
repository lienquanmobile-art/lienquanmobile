// ===== Trang chủ =====

function shouldLog(role) {
  return role !== "owner" && role !== "vip";
}

async function renderHomeTab(container) {
  const me = getCurrentUser();
  const isVip = me.role === "vip";
  const isOwner = me.role === "owner";
  const displayCoins = (me.role === "vip" || me.role === "owner") ? "∞" : (me.coins || 0);
  const displayOnyx = (me.role === "vip" || me.role === "owner") ? "∞" : (me.onyx || 0);
  
  container.innerHTML = `
    <div class="home-hud">
      <span>Số xu: <b id="hudCoins">${displayCoins}</b></span>
      <span>Số Onyx: <b id="hudOnyx">${displayOnyx}</b> <span id="onyxPlus" class="onyx-plus">+</span></span>
      <button class="neon-btn small" id="giftcodeBtn">Nhập Giftcode</button>
    </div>
    
    <div class="sub-tabs" id="gameTabs">
      <button class="sub-tab-btn active" data-tab="getkey">🔑 Lấy Key</button>
      <button class="sub-tab-btn" data-tab="pygame">🎮 PyGame</button>
    </div>
    <div id="gameContent" class="sub-content" style="margin-top: 10px;"></div>
  `;

  const tabs = container.querySelectorAll('#gameTabs .sub-tab-btn');
  const content = container.querySelector('#gameContent');
  
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      if (tabName === 'getkey') {
        renderGetKeyTab(content);
      } else if (tabName === 'pygame') {
        renderPyGameTab(content, me);
      }
    };
  });

  renderGetKeyTab(content);

  container.querySelector("#onyxPlus").onclick = () => openOnyxTopup();
  container.querySelector("#giftcodeBtn").onclick = () => openGiftcodeModal();
}

// ===== Tab PyGame =====
function renderPyGameTab(container, me) {
  container.innerHTML = `
    <h3 class="neon-title-sm">🎮 PyGame - Game Online</h3>
    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; justify-content: center;">
      <a href="pygame/snake.html?user=${me.username}&role=${me.role}" target="_blank" class="snake-launch-box" style="width: 140px; height: 140px;">
        <div style="font-size: 36px;">🐍</div>
        <div class="snake-label" style="font-size: 12px;">RẮN SĂN TÁO</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">10 xu/táo</div>
      </a>
      <a href="pygame/wordchain.html?user=${me.username}&role=${me.role}" target="_blank" class="snake-launch-box" style="width: 140px; height: 140px;">
        <div style="font-size: 36px;">🔤</div>
        <div class="snake-label" style="font-size: 12px;">NỐI TỪ</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">Chơi cùng bạn bè</div>
      </a>
    </div>
    <p style="color: #888; font-size: 12px; margin-top: 12px; text-align: center;">
      ${me.role === 'admin' || me.role === 'owner' || me.role === 'vip' ? 
        '⭐ Admin/Owner/VIP: Không nhận xu nhưng có thể tặng xu cho User' : 
        '👤 User: Nhận xu khi chơi game'}
    </p>
  `;
}

function renderGetKeyTab(container) {
  const me = getCurrentUser();
  
  container.innerHTML = `
    <h3 class="neon-title-sm">🔑 Lấy Key</h3>
    <div style="background: rgba(0,255,224,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="color: #888; font-size: 13px; margin-bottom: 12px;">
        Developer: <span style="color: var(--neon-yellow);">@Black (black_0x000000)</span>
      </p>
      
      <div style="background: rgba(255,45,157,0.08); border: 1px solid var(--neon-pink); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
        <p style="color: var(--neon-cyan); font-weight: bold;">🔐 Key Bản Kín - by HN</p>
        <button class="neon-btn" id="getKeyBanKin" style="width: 100%; margin-top: 8px;">
          📥 Lấy Key
        </button>
      </div>
      
      <div style="background: rgba(185,55,242,0.08); border: 1px solid var(--neon-purple); border-radius: 8px; padding: 14px;">
        <p style="color: var(--neon-yellow); font-weight: bold;">👁️ Key Bản Esp chấp tố - by CakMod&Black</p>
        <button class="neon-btn" id="getKeyEsp" style="width: 100%; margin-top: 8px;">
          📥 Lấy Key
        </button>
      </div>
    </div>
  `;

  container.querySelector("#getKeyBanKin").onclick = () => {
    window.open('https://mokhoasub.com/pS9U1E', '_blank');
    toast("Đang mở link lấy Key Bản Kín...");
    if (shouldLog(me.role)) {
      addLog(`Tài khoản ${me.role}: "${me.username}" đã lấy Key Bản Kín lúc ${nowVN()}`);
    }
  };

  container.querySelector("#getKeyEsp").onclick = () => {
    window.open('https://admin.ngocthinhmodder.site/gettounlock/getkey/lienquanchapto.php', '_blank');
    toast("Đang mở link lấy Key Esp...");
    if (shouldLog(me.role)) {
      addLog(`Tài khoản ${me.role}: "${me.username}" đã lấy Key Esp lúc ${nowVN()}`);
    }
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
  if (c) {
    c.textContent = (u.role === "vip" || u.role === "owner") ? "∞" : (u.coins || 0);
  }
  if (o) {
    o.textContent = (u.role === "vip" || u.role === "owner") ? "∞" : (u.onyx || 0);
  }
}

function openOnyxTopup() {
  const modal = el("div", "modal-overlay");
  modal.innerHTML = `
    <div class="modal-box neon-box">
      <div class="modal-close" id="onyxClose">✕
