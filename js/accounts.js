async function renderCreateAccountTab(container) {
  const me = getCurrentUser();
  
  // Kiểm tra đăng nhập
  if (!me) {
    container.innerHTML = `<div style="color: #ff4444; padding: 20px;">Vui lòng đăng nhập!</div>`;
    return;
  }
  
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

  // Gán sự kiện cho nút Tạo
  const createBtn = container.querySelector("#createAccBtn");
  if (createBtn) {
    createBtn.onclick = async function() {
      console.log("=== Bắt đầu tạo tài khoản ===");
      
      const role = roleSel.value;
      const username = container.querySelector("#newAccUsername").value.trim();
      const password = container.querySelector("#newAccPassword").value;
      
      console.log("Role:", role);
      console.log("Username:", username);
      console.log("Password:", password);
      
      // Kiểm tra nhập liệu
      if (!username) { 
        toast("Vui lòng nhập tên đăng nhập!"); 
        console.log("Lỗi: Chưa nhập username");
        return; 
      }
      
      if (!password) { 
        toast("Vui lòng nhập mật khẩu!"); 
        console.log("Lỗi: Chưa nhập password");
        return; 
      }
      
      // Kiểm tra tên đăng nhập đã tồn tại
      try {
        console.log("Đang kiểm tra username tồn tại...");
        const exists = await db.ref("users/" + keyify(username)).get();
        if (exists.exists()) { 
          toast("Tên tài khoản đã tồn tại!"); 
          console.log("Lỗi: Username đã tồn tại");
          return; 
        }
        console.log("Username chưa tồn tại, tiếp tục...");
      } catch (error) {
        console.error("Lỗi kiểm tra username:", error);
        toast("Lỗi kiểm tra tài khoản: " + error.message);
        return;
      }

      // Tạo token
      let token;
      try {
        console.log("Đang tạo token...");
        token = await genUniqueToken();
        console.log("Token đã tạo:", token);
      } catch (error) {
        console.error("Lỗi tạo token:", error);
        toast("Lỗi tạo token: " + error.message);
        return;
      }
      
      // Tạo dữ liệu user
      const userData = {
        username: username, 
        password: password, 
        role: role, 
        token: token,
        status: "offline",
        coins: role === "vip" ? Infinity : 0,
        onyx: role === "vip" ? Infinity : 0,
        created: Date.now(), 
        banned: false
      };
      
      console.log("User data:", userData);
      
      // Lưu vào Firebase
      try {
        console.log("Đang lưu user vào Firebase...");
        await db.ref("users/" + keyify(username)).set(userData);
        console.log("Đã lưu user");
        
        console.log("Đang lưu token...");
        await db.ref("tokens/" + token).set(username);
        console.log("Đã lưu token");
        
        console.log("Đang ghi log...");
        await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo tài khoản ${role} "${username}" lúc ${nowVN()}`);
        console.log("Đã ghi log");
        
        // Hiển thị kết quả
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
        console.log("=== Tạo tài khoản thành công ===");
        
        if (accountsInterval) {
          await loadAccountsData();
        }
      } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        toast("Lỗi lưu dữ liệu: " + error.message);
        const resultDiv = container.querySelector("#createAccResult");
        if (resultDiv) {
          resultDiv.innerHTML = `<p style="color: #ff4444;">❌ Lỗi: ${error.message}</p>`;
        }
      }
    };
  }
}
