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
    
    // Kiểm tra nhập liệu
    if (!username) { 
      toast("Vui lòng nhập tên đăng nhập!"); 
      return; 
    }
    
    if (!password) { 
      toast("Vui lòng nhập mật khẩu!"); 
      return; 
    }
    
    // Kiểm tra độ dài tối thiểu (cho phép 1 ký tự)
    if (username.length < 1) {
      toast("Tên đăng nhập phải có ít nhất 1 ký tự!");
      return;
    }
    
    if (password.length < 1) {
      toast("Mật khẩu phải có ít nhất 1 ký tự!");
      return;
    }

    // Kiểm tra tên đăng nhập đã tồn tại
    const exists = await db.ref("users/" + keyify(username)).get();
    if (exists.exists()) { 
      toast("Tên tài khoản đã tồn tại!"); 
      return; 
    }

    const token = await genUniqueToken();
    const userData = {
      username, 
      password, 
      role, 
      token,
      status: "offline",
      coins: role === "vip" ? Infinity : 0,
      onyx: role === "vip" ? Infinity : 0,
      created: Date.now(), 
      banned: false
    };
    await db.ref("users/" + keyify(username)).set(userData);
    await db.ref("tokens/" + token).set(username);
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo tài khoản ${role} "${username}" lúc ${nowVN()}`);

    container.querySelector("#createAccResult").innerHTML =
      `<p style="color: #5dff8f;">✅ Tạo tài khoản thành công!</p>
       <p>Tên: <b>${username}</b></p>
       <p>Role: <b>${role === "vip" ? "⭐ VIP" : role}</b></p>
       <p>Token: <b class="glow-text">${token}</b></p>`;
    
    container.querySelector("#newAccUsername").value = "";
    container.querySelector("#newAccPassword").value = "";
    
    if (accountsInterval) {
      await loadAccountsData();
    }
  };
}
