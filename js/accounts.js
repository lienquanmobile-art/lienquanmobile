// ===== Quản lí tài khoản (danh sách + tạo tài khoản) =====

async function renderAccountsTab(container) {
  container.innerHTML = `<div class="loading">Đang tải...</div>`;
  const snap = await db.ref("users").get();
  const all = snap.exists() ? snap.val() : {};
  const users = Object.values(all).filter(u => u.role === "user");
  const admins = Object.values(all).filter(u => u.role === "admin");

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
  `;

  const ub = container.querySelector("#usersTbody");
  users.forEach(u => {
    ub.appendChild(el("tr", "", `<td>${u.username}</td><td class="${u.status}">${u.status}</td><td>${u.onyx || 0}</td><td>${u.coins || 0}</td>`));
  });
  const ab = container.querySelector("#adminsTbody");
  admins.forEach(u => {
    ab.appendChild(el("tr", "", `<td>${u.username}</td><td class="${u.status}">${u.status}</td>`));
  });
}

async function renderCreateAccountTab(container) {
  container.innerHTML = `
    <h3 class="neon-title-sm">Tạo tài khoản</h3>
    <div class="form-row">
      <label>Loại tài khoản</label>
      <select id="newAccRole" class="neon-input">
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
  const me = getCurrentUser();
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
      status: "offline", coins: 0, onyx: 0,
      created: Date.now(), banned: false
    };
    await db.ref("users/" + keyify(username)).set(userData);
    await db.ref("tokens/" + token).set(username);
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo tài khoản ${role} "${username}" lúc ${nowVN()}`);

    container.querySelector("#createAccResult").innerHTML =
      `<p>Tạo tài khoản thành công!</p><p>Token tài khoản: <b class="glow-text">${token}</b></p>`;
    container.querySelector("#newAccUsername").value = "";
    container.querySelector("#newAccPassword").value = "";
  };
}
