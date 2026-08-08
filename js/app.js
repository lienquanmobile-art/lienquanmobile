// ===== App chính =====

let __currentUser = null;
function getCurrentUser() { return __currentUser; }
function setCurrentUser(u) { __currentUser = u; }

const appRoot = () => document.getElementById("app");

async function initApp() {
  await seedOwnerAccount();
  const savedUsername = localStorage.getItem("currentUser");
  if (savedUsername) {
    const user = await getUser(savedUsername);
    const ban = user ? await checkBanStatus(savedUsername) : null;
    if (user && !ban) {
      setCurrentUser(user);
      renderDashboard();
      return;
    }
    localStorage.removeItem("currentUser");
  }
  goToLogin();
}

function goToLogin() {
  setCurrentUser(null);
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
    if (!res.ok) { document.getElementById("loginMsg").innerHTML = `<p>${res.msg}</p>`; return; }
    localStorage.setItem("currentUser", res.user.username);
    setCurrentUser(res.user);
    renderDashboard();
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
    if (!res.ok) { document.getElementById("tokenMsg").innerHTML = `<p>${res.msg}</p>`; return; }
    localStorage.setItem("currentUser", res.user.username);
    setCurrentUser(res.user);
    renderDashboard();
  };
  document.getElementById("tokenBackBtn").onclick = () => goToLogin();
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
  if (tabId === "home") return renderHomeTab(content);
  if (tabId === "settings") return renderSettingsTab(content);
  if (tabId === "manage") return renderManageTab(content);
}

function renderManageTab(container) {
  const me = getCurrentUser();
  const subTabs = [
    { id: "accounts", label: "Tài Khoản" },
    { id: "create", label: "Tạo tài khoản" }
  ];
  if (me.role === "owner") subTabs.push({ id: "log", label: "Log" });
  subTabs.push({ id: "cards", label: "Tạo thẻ" });
  subTabs.push({ id: "giftcode", label: "Tạo giftcode" });
  subTabs.push({ id: "ban", label: "Cấm tài khoản" });

  container.innerHTML = `<div class="sub-tabs" id="subTabs"></div><div id="subContent" class="sub-content"></div>`;
  const subTabsEl = container.querySelector("#subTabs");
  const subContent = container.querySelector("#subContent");

  const renderSub = (id) => {
    if (id === "accounts") renderAccountsTab(subContent);
    if (id === "create") renderCreateAccountTab(subContent);
    if (id === "log") renderLogTab(subContent);
    if (id === "cards") renderCreateCardTab(subContent);
    if (id === "giftcode") renderGiftcodeTab(subContent);
    if (id === "ban") renderBanTab(subContent);
  };

  subTabs.forEach((t, i) => {
    const b = el("button", "sub-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = () => {
      subTabsEl.querySelectorAll(".sub-tab-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      clearInterval(window.__banListInterval);
      renderSub(t.id);
    };
    subTabsEl.appendChild(b);
  });

  renderSub("accounts");
}

window.addEventListener("DOMContentLoaded", initApp);
