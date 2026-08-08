// ===== Cài đặt =====

function renderSettingsTab(container) {
  container.innerHTML = `
    <h3 class="neon-title-sm">Đổi mật khẩu</h3>
    <div class="form-row"><label>Mật khẩu cũ</label><input id="oldPass" type="password" class="neon-input"></div>
    <div class="form-row"><label>Mật khẩu mới</label><input id="newPass" type="password" class="neon-input"></div>
    <div class="form-row"><label>Xác nhận lại mật khẩu mới</label><input id="confirmPass" type="password" class="neon-input"></div>
    <button class="neon-btn" id="changePassBtn">Đổi mật khẩu</button>
    <div id="changePassResult" class="result-box"></div>
    <hr class="neon-hr">
    <button class="neon-btn danger" id="logoutBtn">Đăng xuất khỏi tài khoản</button>
  `;

  container.querySelector("#changePassBtn").onclick = async () => {
    const me = getCurrentUser();
    const oldP = container.querySelector("#oldPass").value;
    const newP = container.querySelector("#newPass").value;
    const confP = container.querySelector("#confirmPass").value;
    if (!oldP || !newP || !confP) { toast("Vui lòng nhập đầy đủ!"); return; }
    if (newP !== confP) { toast("Xác nhận mật khẩu không khớp!"); return; }
    const res = await changePassword(me.username, oldP, newP);
    container.querySelector("#changePassResult").innerHTML = res.ok
      ? `<p>Đổi mật khẩu thành công!</p>` : `<p>${res.msg}</p>`;
    if (res.ok) {
      container.querySelector("#oldPass").value = "";
      container.querySelector("#newPass").value = "";
      container.querySelector("#confirmPass").value = "";
    }
  };

  container.querySelector("#logoutBtn").onclick = async () => {
    const me = getCurrentUser();
    await logoutUser(me.username);
    goToLogin();
  };
}
