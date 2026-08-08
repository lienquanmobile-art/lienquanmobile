// js/settings.js
// Tab "Cài Đặt": đổi mật khẩu + đăng xuất (giống nhau cho mọi loại tài khoản)

const Settings = {
  render(panel, account, onLogout) {
    panel.innerHTML = `
      <h3>Đổi mật khẩu</h3>
      <div class="field-group">
        <label>Mật khẩu cũ</label>
        <input id="old-pass" type="password" />
      </div>
      <div class="field-group">
        <label>Mật khẩu mới</label>
        <input id="new-pass" type="password" />
      </div>
      <div class="field-group">
        <label>Xác nhận lại mật khẩu mới</label>
        <input id="confirm-pass" type="password" />
      </div>
      <button class="btn primary" id="btn-change-pass">Đổi mật khẩu</button>
      <div id="change-pass-result" class="result-box"></div>

      <hr class="divider" />
      <button class="btn danger" id="btn-logout">Đăng xuất khỏi tài khoản</button>
    `;

    panel.querySelector("#btn-change-pass").addEventListener("click", async () => {
      const resultBox = panel.querySelector("#change-pass-result");
      const oldPass = panel.querySelector("#old-pass").value;
      const newPass = panel.querySelector("#new-pass").value;
      const confirmPass = panel.querySelector("#confirm-pass").value;

      if (!oldPass || !newPass || !confirmPass) {
        resultBox.innerHTML = `<p class="error">Vui lòng nhập đầy đủ thông tin</p>`;
        return;
      }
      if (newPass !== confirmPass) {
        resultBox.innerHTML = `<p class="error">Mật khẩu mới xác nhận không khớp</p>`;
        return;
      }
      const fresh = await DB.getAccount(account.username);
      const oldHash = await Utils.hashPassword(oldPass);
      if (oldHash !== fresh.password) {
        resultBox.innerHTML = `<p class="error">Mật khẩu cũ không đúng</p>`;
        return;
      }
      const newHash = await Utils.hashPassword(newPass);
      await DB.changePassword(account.username, newHash);
      await DB.addLog(account.username, "Đổi mật khẩu", `${account.username} đã đổi mật khẩu`);
      resultBox.innerHTML = `<p class="success">Đổi mật khẩu thành công</p>`;
      panel.querySelector("#old-pass").value = "";
      panel.querySelector("#new-pass").value = "";
      panel.querySelector("#confirm-pass").value = "";
    });

    panel.querySelector("#btn-logout").addEventListener("click", async () => {
      await Auth.logout();
      onLogout();
    });
  },
};
