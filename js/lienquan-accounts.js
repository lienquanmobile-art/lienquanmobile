// ===== Quản lý tài khoản Liên Quân =====

let lienquanInterval = null;

async function renderLienQuanTab(container) {
  const me = getCurrentUser();
  
  container.innerHTML = `
    <h3 class="neon-title-sm">📱 Quản lý tài khoản Liên Quân</h3>
    
    <div style="background: rgba(0,255,224,0.05); border: 1px solid var(--neon-cyan); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <h4 style="color: var(--neon-cyan); margin-bottom: 12px;">Thêm tài khoản mới</h4>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: end;">
        <div class="form-row" style="flex: 1; min-width: 150px;">
          <label>Tên đăng nhập</label>
          <input id="lqUsername" class="neon-input" placeholder="Nhập tên đăng nhập">
        </div>
        <div class="form-row" style="flex: 1; min-width: 150px;">
          <label>Mật khẩu</label>
          <input id="lqPassword" class="neon-input" placeholder="Nhập mật khẩu">
        </div>
        <button class="neon-btn" id="addLqBtn" style="flex: 0 0 auto; margin-bottom: 14px;">➕ Thêm</button>
      </div>
      <div id="addLqResult" class="result-box"></div>
    </div>

    <h4 style="color: var(--neon-cyan); margin-bottom: 12px;">📋 Danh sách tài khoản Liên Quân</h4>
    <div style="overflow-x: auto;">
      <table class="neon-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên đăng nhập</th>
            <th>Mật khẩu</th>
            <th>Trạng thái</th>
            <th>Người thêm</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody id="lqListTbody"></tbody>
      </table>
    </div>
    <div id="lqEmptyMsg" class="dim-text" style="text-align: center; padding: 20px;">Chưa có tài khoản Liên Quân nào.</div>
  `;

  // Xử lý thêm tài khoản
  container.querySelector("#addLqBtn").onclick = async () => {
    const username = container.querySelector("#lqUsername").value.trim();
    const password = container.querySelector("#lqPassword").value.trim();
    
    if (!username || !password) {
      toast("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    if (username.length < 6 || username.length > 30) {
      toast("Tên đăng nhập phải từ 6-30 ký tự!");
      return;
    }

    if (password.length < 6) {
      toast("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Kiểm tra trùng tên
    const snap = await db.ref("lienquan_accounts").get();
    const accounts = snap.exists() ? snap.val() : {};
    const exists = Object.values(accounts).some(acc => acc.username === username);
    
    if (exists) {
      toast("Tên đăng nhập đã tồn tại!");
      return;
    }

    // Thêm tài khoản mới
    const newAccount = {
      username: username,
      password: password,
      status: "Unlock",
      createdBy: me.username,
      createdAt: Date.now(),
      createdAtStr: nowVN()
    };

    const ref = db.ref("lienquan_accounts").push();
    await ref.set(newAccount);
    
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã thêm tài khoản Liên Quân "${username}" lúc ${nowVN()}`);
    
    container.querySelector("#addLqResult").innerHTML = `<p style="color: #5dff8f;">✅ Đã thêm tài khoản "${username}" thành công!</p>`;
    container.querySelector("#lqUsername").value = "";
    container.querySelector("#lqPassword").value = "";
    
    loadLienQuanList(container);
  };

  // Load danh sách
  loadLienQuanList(container);
  
  // Auto refresh mỗi 5 giây
  clearInterval(lienquanInterval);
  lienquanInterval = setInterval(() => {
    if (document.getElementById("lqListTbody")) {
      loadLienQuanList(container, true);
    }
  }, 5000);
}

async function loadLienQuanList(container, silent = false) {
  const snap = await db.ref("lienquan_accounts").get();
  const accounts = snap.exists() ? Object.values(snap.val()) : [];
  const tbody = container.querySelector("#lqListTbody");
  const emptyMsg = container.querySelector("#lqEmptyMsg");
  
  if (accounts.length === 0) {
    tbody.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }
  if (emptyMsg) emptyMsg.style.display = "none";

  // Sắp xếp theo thời gian tạo mới nhất
  accounts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  tbody.innerHTML = "";
  accounts.forEach((acc, index) => {
    const tr = document.createElement("tr");
    
    // STT
    const td1 = document.createElement("td");
    td1.textContent = String(index + 1);
    tr.appendChild(td1);
    
    // Tên đăng nhập
    const td2 = document.createElement("td");
    td2.textContent = acc.username;
    tr.appendChild(td2);
    
    // Mật khẩu - HIỂN THỊ ĐẦY ĐỦ 100%
    const td3 = document.createElement("td");
    td3.textContent = acc.password; // Hiển thị nguyên văn mật khẩu
    tr.appendChild(td3);
    
    // Trạng thái
    const td4 = document.createElement("td");
    const statusColor = acc.status === "Unlock" ? "#5dff8f" : "#ff4444";
    const statusText = acc.status === "Unlock" ? "🔓 Unlock" : "🔒 Lock";
    td4.innerHTML = `<span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>`;
    tr.appendChild(td4);
    
    // Người thêm
    const td5 = document.createElement("td");
    td5.textContent = acc.createdBy || "Unknown";
    tr.appendChild(td5);
    
    // Thao tác
    const td6 = document.createElement("td");
    
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "neon-btn small";
    toggleBtn.textContent = acc.status === "Unlock" ? "🔒 Khóa" : "🔓 Mở khóa";
    toggleBtn.style.marginRight = "5px";
    toggleBtn.onclick = async () => {
      const newStatus = acc.status === "Unlock" ? "Lock" : "Unlock";
      // Tìm key của account này
      const snapAll = await db.ref("lienquan_accounts").get();
      const all = snapAll.exists() ? snapAll.val() : {};
      let foundKey = null;
      for (const [key, val] of Object.entries(all)) {
        if (val.username === acc.username && val.password === acc.password) {
          foundKey = key;
          break;
        }
      }
      if (foundKey) {
        await db.ref("lienquan_accounts/" + foundKey + "/status").set(newStatus);
        await addLog(`Tài khoản ${getCurrentUser().role}: "${getCurrentUser().username}" đã ${newStatus === "Unlock" ? "mở khóa" : "khóa"} tài khoản Liên Quân "${acc.username}" lúc ${nowVN()}`);
        loadLienQuanList(container);
      }
    };
    td6.appendChild(toggleBtn);
    
    // Nút xóa (chỉ owner)
    if (getCurrentUser().role === "owner") {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "neon-btn small danger";
      deleteBtn.textContent = "🗑️ Xóa";
      deleteBtn.onclick = async () => {
        if (!confirm(`Bạn có chắc muốn xóa tài khoản Liên Quân "${acc.username}"?`)) return;
        const snapAll = await db.ref("lienquan_accounts").get();
        const all = snapAll.exists() ? snapAll.val() : {};
        let foundKey = null;
        for (const [key, val] of Object.entries(all)) {
          if (val.username === acc.username && val.password === acc.password) {
            foundKey = key;
            break;
          }
        }
        if (foundKey) {
          await db.ref("lienquan_accounts/" + foundKey).remove();
          await addLog(`Tài khoản Owner: "${getCurrentUser().username}" đã xóa tài khoản Liên Quân "${acc.username}" lúc ${nowVN()}`);
          loadLienQuanList(container);
        }
      };
      td6.appendChild(deleteBtn);
    }
    
    tr.appendChild(td6);
    tbody.appendChild(tr);
  });
}
