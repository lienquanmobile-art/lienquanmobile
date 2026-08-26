// ===== Quản lí tài khoản (danh sách + tạo tài khoản) =====

let accountsInterval = null;

async function renderAccountsTab(container) {
  container.innerHTML = `<div class="loading">Đang tải...</div>`;
  
  container.innerHTML = `
    <h3 class="neon-title-sm">Quản lí tài khoản User</h3>
    <table class="neon-table">
      <thead><tr><th>Tên tài khoản</th><th>Trạng thái</th><th>Onyx</th><th>Xu</th></tr></thead>
      <tbody id="usersTbody"></tbody>
    </table>
    <h3 class="neon-title-sm">Quản lí tài khoản Admin</h3>
    <table class="neon-table">
      <thead><tr><th>Tên tài khoản</th><th>Trạng thái</th></tr></thead>
      <tbody id="adminsTbody"></tbody>
    </table>
    <h3 class="neon-title-sm">Quản lí tài khoản VIP</h3>
    <table class="neon-table">
      <thead><tr><th>Tên tài khoản</th><th>Trạng thái</th></tr></thead>
      <tbody id="vipTbody"></tbody>
    </table>
  `;

  await loadAccountsData();
  
  if (accountsInterval) {
    clearInterval(accountsInterval);
    accountsInterval = null;
  }
  
  accountsInterval = setInterval(async () => {
    if (!document.body.contains(container)) {
      clearInterval(accountsInterval);
      accountsInterval = null;
      return;
    }
    await loadAccountsData();
  }, 2000);
}

async function loadAccountsData() {
  try {
    const snap = await db.ref("users").get();
    if (!snap.exists()) return;
    
    const all = snap.val();
    const users = Object.values(all).filter(u => u.role === "user");
    const admins = Object.values(all).filter(u => u.role === "admin");
    const vips = Object.values(all).filter(u => u.role === "vip");
    const owner = Object.values(all).filter(u => u.role === "owner");
    
    // Cập nhật bảng User
    const userTbody = document.getElementById("usersTbody");
    if (userTbody) {
      userTbody.innerHTML = "";
      users.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const tr = document.createElement("tr");
        const onyxDisplay = u.onyx === Infinity ? "∞" : (u.onyx || 0);
        const coinsDisplay = u.coins === Infinity ? "∞" : (u.coins || 0);
        tr.innerHTML = `<td>${u.username}</td><td class="${statusClass}">${statusText}</td><td>${onyxDisplay}</td><td>${coinsDisplay}</td>`;
        userTbody.appendChild(tr);
      });
    }
    
    // Cập nhật bảng Admin
    const adminTbody = document.getElementById("adminsTbody");
    if (adminTbody) {
      adminTbody.innerHTML = "";
      admins.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.username}</td><td class="${statusClass}">${statusText}</td>`;
        adminTbody.appendChild(tr);
      });
    }
    
    // Cập nhật bảng VIP
    const vipTbody = document.getElementById("vipTbody");
    if (vipTbody) {
      vipTbody.innerHTML = "";
      const allVips = [...vips, ...owner];
      allVips.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const roleDisplay = u.role === "owner" ? "👑 Owner" : "⭐ VIP";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.username} ${roleDisplay}</td><td class="${statusClass}">${statusText}</td>`;
        vipTbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Lỗi load accounts:", error);
  }
}

async function renderCreateAccountTab(container) {
  const me = getCurrentUser();
  
  // Chỉ owner và admin mới tạo được tài khoản
  if (me.role !== "owner" && me.role !== "admin") {
    container.innerHTML = `<div style="color: #ff4444; padding: 20px;">Bạn không có quyền tạo tài khoản!</div>`;
    return;
  }
  
  container.innerHTML = `
    <h3 class="neon-title-sm">Tạo tài khoản</h3>
    <div class="form-row">
      <label>Loại tài khoản</label>
      <select id="newAccRole" class="neon-input">
        ${me.role === "owner" ? `<option value="vip">VIP</option>` : ""}
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
    </div>
    <div class="form-row">
      <label>Tên đăng nhập</label>
      <input id="newAccUsername" class="neon-input" placeholder="Nhập tên đăng nhập">
    </div>
    <div class="form-row">
      <label>Mật khẩu</label>
      <input id="newAccPassword" class="neon-input" type="password" placeholder="Nhập mật khẩu">
    </div>
    <button class="neon-btn" id="createAccBtn">Tạo</button>
    <div id="createAccResult" class="result-box"></div>
  `;

  const roleSel = container.querySelector("#newAccRole");
  if (me.role === "admin") {
    roleSel.innerHTML = `<option value="user">User</option>`;
  }

  container.querySelector("#createAccBtn").onclick = async () => {
    const role = roleSel.value;
    const username = container.querySelector("#newAccUsername").value.trim();
    const password = container.querySelector("#newAccPassword").value;
    if (!username || !password) { toast("Vui lòng nhập đầy đủ thông tin!"); return; }

    const exists = await db.ref("users/" + keyify(username)).get();
    if (exists.exists()) { toast("Tên tài khoản đã tồn tại!"); return; }

    const token = await genUniqueToken();
    const userData = {
      username, password, role, token,
      status: "offline",
      coins: role === "vip" ? Infinity : 0,
      onyx: role === "vip" ? Infinity : 0,
      created: Date.now(), banned: false
    };
    await db.ref("users/" + keyify(username)).set(userData);
    await db.ref("tokens/" + token).set(username);
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo tài khoản ${role} "${username}" lúc ${nowVN()}`);

    container.querySelector("#createAccResult").innerHTML =
      `<p>Tạo tài khoản thành công!</p><p>Token tài khoản: <b class="glow-text">${token}</b></p>`;
    container.querySelector("#newAccUsername").value = "";
    container.querySelector("#newAccPassword").value = "";
    
    if (accountsInterval) {
      await loadAccountsData();
    }
  };
}
