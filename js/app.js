// ===== App chính =====

let __currentUser = null;
function getCurrentUser() { return __currentUser; }
function setCurrentUser(u) { __currentUser = u; }

const appRoot = () => document.getElementById("app");

async function initApp() {
  await seedOwnerAccount();
  
  // Kiểm tra ban khi load
  await checkBanOnLoad();
  
  const savedUsername = localStorage.getItem("currentUser");
  if (savedUsername) {
    const user = await getUser(savedUsername);
    const ban = user ? await checkBanStatus(savedUsername) : null;
    if (user && !ban) {
      setCurrentUser(user);
      renderDashboard();
      // Bắt đầu kiểm tra ban realtime sau khi đăng nhập
      setTimeout(startBanChecker, 1000);
      return;
    }
    localStorage.removeItem("currentUser");
  }
  goToLogin();
}

function goToLogin() {
  // Xóa khỏi hàng đợi game nếu có
  const me = getCurrentUser();
  if (me) {
    if (typeof WORDCHAIN_QUEUE !== 'undefined') {
      db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).remove();
    }
  }
  
  setCurrentUser(null);
  if (banCheckInterval) {
    clearInterval(banCheckInterval);
    banCheckInterval = null;
  }
  banPopupShown = false;
  
  appRoot().innerHTML = `
    <div class="login-wrap">
      <div class="neon-box login-box">
        <h1 class="neon-title">HỆ THỐNG QUẢN LÍ TÀI KHOẢN</h1>
        <div class="form-row"><label>Tên đăng nhập</label><input id="loginUser" class="neon-input" autocomplete="off"></div>
        <div class="form-row"><label>Mật khẩu</label><input id="loginPass" type="password" class="neon-input"></div>
        <div class="btn-row">
          <button class="neon-btn" id="loginOkBtn">OK</button>
          <button class="neon-btn ghost" id="loginTokenBtn">Đăng nhập bằng token</button>
        </div>
        <div id="loginMsg" class="result-box"></div>
      </div>
    </div>`;

  document.getElementById("loginOkBtn").onclick = async () => {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;
    if (!u || !p) { toast("Vui lòng nhập đầy đủ thông tin!"); return; }
    const res = await loginWithPassword(u, p);
    if (!res.ok) {
      // Kiểm tra nếu bị ban thì hiển thị popup
      if (res.banned === true && res.banData) {
        showBanPopupLogin(res.banData, res.username);
        document.getElementById("loginMsg").innerHTML = '';
        return;
      }
      document.getElementById("loginMsg").innerHTML = `<p>${res.msg}</p>`;
      return;
    }
    localStorage.setItem("currentUser", res.user.username);
    setCurrentUser(res.user);
    renderDashboard();
    setTimeout(startBanChecker, 1000);
  };

  document.getElementById("loginTokenBtn").onclick = () => goToTokenLogin();
}

function goToTokenLogin() {
  appRoot().innerHTML = `
    <div class="login-wrap">
      <div class="neon-box login-box">
        <h1 class="neon-title">ĐĂNG NHẬP BẰNG TOKEN</h1>
        <div class="form-row"><label>Token của bạn</label><input id="loginTokenInput" class="neon-input" placeholder="Nhập token ở đây"></div>
        <div class="btn-row">
          <button class="neon-btn" id="tokenOkBtn">OK</button>
          <button class="neon-btn ghost" id="tokenBackBtn">Quay lại</button>
        </div>
        <div id="tokenMsg" class="result-box"></div>
      </div>
    </div>`;

  document.getElementById("tokenOkBtn").onclick = async () => {
    const t = document.getElementById("loginTokenInput").value.trim();
    if (!t) { toast("Vui lòng nhập token!"); return; }
    const res = await loginWithToken(t);
    if (!res.ok) {
      // Kiểm tra nếu bị ban thì hiển thị popup
      if (res.banned === true && res.banData) {
        showBanPopupLogin(res.banData, res.username);
        document.getElementById("tokenMsg").innerHTML = '';
        return;
      }
      document.getElementById("tokenMsg").innerHTML = `<p>${res.msg}</p>`;
      return;
    }
    localStorage.setItem("currentUser", res.user.username);
    setCurrentUser(res.user);
    renderDashboard();
    setTimeout(startBanChecker, 1000);
  };
  document.getElementById("tokenBackBtn").onclick = () => goToLogin();
}

// Hàm hiển thị popup ban khi login
function showBanPopupLogin(ban, username) {
  // Kiểm tra nếu đã có popup rồi thì không tạo mới
  if (document.querySelector('.modal-overlay')) {
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.zIndex = '9999';
  
  const timeText = ban.permanent ? 'VĨNH VIỄN' : fmtCountdown(ban.until - Date.now());
  
  modal.innerHTML = `
    <div class="modal-box neon-box" style="max-width: 450px; text-align: center; border-color: #ff4444; box-shadow: 0 0 30px rgba(255,68,68,0.5);">
      <h2 style="color: #ff4444; text-shadow: 0 0 20px #ff4444; font-family: 'Press Start 2P', cursive; font-size: 18px;">
        ⛔ TÀI KHOẢN ĐÃ BỊ CẤM
      </h2>
      <hr style="border-color: #ff4444; margin: 15px 0;">
      <p style="color: #ff8888; font-size: 15px;">
        Tài khoản <b style="color: #ff4444;">${username}</b> của bạn đã bị cấm
      </p>
      <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; border-radius: 6px; padding: 12px; margin: 12px 0;">
        <p style="color: #ffaa00; font-size: 14px;"><b>Lý do:</b> ${ban.reason}</p>
        <p style="color: #ffaa00; font-size: 14px;"><b>Thời gian cấm:</b> ${timeText}</p>
        <p style="color: #ffaa00; font-size: 12px;"><b>Người cấm:</b> ${ban.by}</p>
      </div>
      <p style="color: #888; font-size: 12px;">
        ${ban.permanent ? 'Tài khoản đã bị cấm vĩnh viễn' : 'Vui lòng đợi hết thời gian cấm để đăng nhập lại'}
      </p>
      <button class="neon-btn danger" id="banPopupLoginClose" style="margin-top: 15px; width: 100%;">
        QUAY LẠI
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#banPopupLoginClose').onclick = function() {
    modal.remove();
    // Xóa input để người dùng nhập lại
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    const loginToken = document.getElementById('loginTokenInput');
    if (loginUser) loginUser.value = '';
    if (loginPass) loginPass.value = '';
    if (loginToken) loginToken.value = '';
  };
  
  // Không cho phép tắt bằng click ra ngoài
  modal.onclick = function(e) {
    if (e.target === modal) return;
  };
}

function renderDashboard() {
  const me = getCurrentUser();
  const isOwner = me.role === "owner";
  const isAdmin = me.role === "admin";
  const isUser = me.role === "user";

  const bigTabs = isUser
    ? [{ id: "home", label: "Trang Chủ" }, { id: "settings", label: "Cài Đặt" }]
    : [{ id: "home", label: "Trang Chủ" }, { id: "manage", label: "Quản Lí" }, { id: "settings", label: "Cài Đặt" }];

  appRoot().innerHTML = `
    <div class="dash-wrap">
      <div class="dash-header">
        <span class="dash-role">${me.username} <em>(${me.role})</em></span>
        <div class="big-tabs" id="bigTabs"></div>
      </div>
      <div id="dashContent" class="dash-content"></div>
    </div>
    <div id="toast" class="toast"></div>`;

  const bigTabsEl = document.getElementById("bigTabs");
  bigTabs.forEach((t, i) => {
    const b = el("button", "big-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = () => {
      bigTabsEl.querySelectorAll(".big-tab-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      renderBigTab(t.id);
    };
    bigTabsEl.appendChild(b);
  });

  renderBigTab("home");
}

function renderBigTab(tabId) {
  const content = document.getElementById("dashContent");
  if (!content) return;
  
  if (tabId === "home") return renderHomeTab(content);
  if (tabId === "settings") return renderSettingsTab(content);
  if (tabId === "manage") return renderManageTab(content);
}

function renderManageTab(container) {
  if (!container) return;
  
  const me = getCurrentUser();
  const subTabs = [
    { id: "accounts", label: "Tài Khoản" },
    { id: "create", label: "Tạo tài khoản" }
  ];
  if (me.role === "owner") subTabs.push({ id: "log", label: "Log" });
  subTabs.push({ id: "cards", label: "Tạo thẻ" });
  subTabs.push({ id: "giftcode", label: "Tạo giftcode" });
  subTabs.push({ id: "ban", label: "Cấm tài khoản" });
  subTabs.push({ id: "lienquan", label: "Tài khoản Liên Quân" });

  container.innerHTML = `
    <div class="sub-tabs" id="subTabs"></div>
    <div id="subContent" class="sub-content"></div>
  `;
  
  const subTabsEl = container.querySelector("#subTabs");
  const subContent = container.querySelector("#subContent");

  if (!subTabsEl || !subContent) return;

  // Hàm render tab con
  const renderSub = (id) => {
    // Xóa nội dung cũ
    subContent.innerHTML = '';
    
    // Clear các interval cũ
    if (accountsInterval) {
      clearInterval(accountsInterval);
      accountsInterval = null;
    }
    if (lienquanInterval) {
      clearInterval(lienquanInterval);
      lienquanInterval = null;
    }
    if (window.__banListInterval) {
      clearInterval(window.__banListInterval);
      window.__banListInterval = null;
    }
    
    // Render tab tương ứng
    try {
      switch(id) {
        case "accounts":
          renderAccountsTab(subContent);
          break;
        case "create":
          renderCreateAccountTab(subContent);
          break;
        case "log":
          renderLogTab(subContent);
          break;
        case "cards":
          if (typeof renderCreateCardTab === 'function') {
            renderCreateCardTab(subContent);
          } else {
            subContent.innerHTML = '<div style="color: #ff4444; padding: 20px;">Lỗi: renderCreateCardTab chưa được định nghĩa. Kiểm tra file cards.js</div>';
            console.error("renderCreateCardTab is not defined");
          }
          break;
        case "giftcode":
          renderGiftcodeTab(subContent);
          break;
        case "ban":
          renderBanTab(subContent);
          break;
        case "lienquan":
          renderLienQuanTab(subContent);
          break;
        default:
          subContent.innerHTML = '<div class="dim-text">Tab không tồn tại</div>';
      }
    } catch (error) {
      console.error("Lỗi render tab:", error);
      subContent.innerHTML = `<div style="color: #ff4444; padding: 20px;">Lỗi: ${error.message}</div>`;
    }
  };

  // Xóa các tab cũ
  subTabsEl.innerHTML = "";
  
  subTabs.forEach((t, i) => {
    const b = el("button", "sub-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = function(tabId) {
      return function() {
        // Xóa active của tất cả tab
        subTabsEl.querySelectorAll(".sub-tab-btn").forEach(x => x.classList.remove("active"));
        this.classList.add("active");
        
        // Render tab được chọn
        renderSub(tabId);
      };
    }(t.id);
    subTabsEl.appendChild(b);
  });

  // Mặc định hiển thị tab đầu tiên
  renderSub("accounts");
}

window.addEventListener("DOMContentLoaded", initApp);
