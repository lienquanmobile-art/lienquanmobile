// ===== Quản lí tài khoản (danh sách + tạo tài khoản) =====

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
        const onyxDisplay = (u.onyx >= 999999999 || u.role === "vip" || u.role === "owner") ? "∞" : (u.onyx || 0);
        const coinsDisplay = (u.coins >= 999999999 || u.role === "vip" || u.role === "owner") ? "∞" : (u.coins || 0);
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
  
  if (!me) {
    container.innerHTML = `<div style="color: #ff4444; padding: 20px;">Vui lòng đăng nhập!</div>`;
    return;
  }
  
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

  const createBtn = container.querySelector("#createAccBtn");
  if (createBtn) {
    createBtn.onclick = async function() {
      const role = roleSel.value;
      const username = container.querySelector("#newAccUsername").value.trim();
      const password = container.querySelector("#newAccPassword").value;
      
      if (!username) { toast("Vui lòng nhập tên đăng nhập!"); return; }
      if (!password) { toast("Vui lòng nhập mật khẩu!"); return; }
      
      try {
        const exists = await db.ref("users/" + keyify(username)).get();
        if (exists.exists()) { toast("Tên tài khoản đã tồn tại!"); return; }
      } catch (error) {
        toast("Lỗi kiểm tra tài khoản: " + error.message);
        return;
      }

      let token;
      try {
        token = await genUniqueToken();
      } catch (error) {
        toast("Lỗi tạo token: " + error.message);
        return;
      }
      
      const isVip = role === "vip";
      const userData = {
        username: username, 
        password: password, 
        role: role, 
        token: token,
        status: "offline",
        coins: isVip ? 999999999 : 0,
        onyx: isVip ? 999999999 : 0,
        created: Date.now(), 
        banned: false
      };
      
      try {
        await db.ref("users/" + keyify(username)).set(userData);
        await db.ref("tokens/" + token).set(username);
        await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo tài khoản ${role} "${username}" lúc ${nowVN()}`);
        
        const resultDiv = container.querySelector("#createAccResult");
        if (resultDiv) {
          resultDiv.innerHTML = `
            <p style="color: #5dff8f;">✅ Tạo tài khoản thành công!</p>
            <p>Tên: <b>${username}</b></p>
            <p>Role: <b>${role === "vip" ? "⭐ VIP" : role}</b></p>
            <p>Token: <b class="glow-text">${token}</b></p>
          `;
        }
        
        container.querySelector("#newAccUsername").value = "";
        container.querySelector("#newAccPassword").value = "";
        
        toast("Tạo tài khoản thành công!");
        
        await loadAccountsData();
      } catch (error) {
        toast("Lỗi lưu dữ liệu: " + error.message);
        const resultDiv = container.querySelector("#createAccResult");
        if (resultDiv) {
          resultDiv.innerHTML = `<p style="color: #ff4444;">❌ Lỗi: ${error.message}</p>`;
        }
      }
    };
  }
}
