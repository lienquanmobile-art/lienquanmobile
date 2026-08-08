// js/auth.js
// Xử lý đăng nhập bằng tài khoản/mật khẩu hoặc bằng token, và quản lý phiên đăng nhập

const Auth = {
  SESSION_KEY: "qltk_session_username",

  // Tạo tài khoản Owner mặc định nếu chưa tồn tại tài khoản Owner nào
  async ensureOwnerExists() {
    const accounts = await DB.getAllAccounts();
    const hasOwner = Object.values(accounts).some((a) => a.role === "owner");
    if (hasOwner) return;

    const tokens = new Set(Object.values(accounts).map((a) => a.token));
    const token = Utils.generateUniqueToken(tokens);
    const passwordHash = await Utils.hashPassword("owner123");
    await DB.createAccount("owner", passwordHash, "owner", token);
    console.log(
      "%cĐã tạo tài khoản Owner mặc định -> Tên đăng nhập: owner | Mật khẩu: owner123. Hãy đổi mật khẩu ngay!",
      "color: orange; font-weight: bold;"
    );
  },

  getCurrentUsername() {
    return sessionStorage.getItem(this.SESSION_KEY);
  },

  setCurrentUsername(username) {
    sessionStorage.setItem(this.SESSION_KEY, username);
  },

  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  // Kiểm tra tài khoản có đang bị cấm hay không. Trả về ban record hoặc null (đã tự mở khóa nếu hết hạn)
  async checkBan(username) {
    const ban = await DB.getBan(username);
    if (!ban) return null;
    if (ban.permanent) return ban;
    if (ban.untilTs && ban.untilTs > Utils.nowTs()) return ban;
    // Hết hạn cấm -> tự động mở khóa
    await DB.removeBan(username);
    return null;
  },

  async loginWithPassword(username, password) {
    const account = await DB.getAccount(username);
    if (!account) return { ok: false, error: "Tài khoản không tồn tại" };

    const hash = await Utils.hashPassword(password);
    if (hash !== account.password) return { ok: false, error: "Sai mật khẩu" };

    const ban = await this.checkBan(username);
    if (ban) return { ok: false, error: this.banMessage(ban) };

    this.setCurrentUsername(username);
    await DB.setStatus(username, "online");
    await DB.addLog(username, "Đăng nhập", `${username} đã đăng nhập vào lúc ${Utils.formatDateTime(Utils.nowTs())}`);
    return { ok: true, account: { username, ...account } };
  },

  async loginWithToken(token) {
    const found = await DB.findAccountByToken(token);
    if (!found) return { ok: false, error: "Token không hợp lệ" };

    const ban = await this.checkBan(found.username);
    if (ban) return { ok: false, error: this.banMessage(ban) };

    this.setCurrentUsername(found.username);
    await DB.setStatus(found.username, "online");
    await DB.addLog(
      found.username,
      "Đăng nhập bằng token",
      `${found.username} đã đăng nhập bằng token vào lúc ${Utils.formatDateTime(Utils.nowTs())}`
    );
    return { ok: true, account: found };
  },

  banMessage(ban) {
    if (ban.permanent) return `Tài khoản đã bị cấm vĩnh viễn. Lý do: ${ban.reason}`;
    const remain = Utils.formatCountdown(ban.untilTs - Utils.nowTs());
    return `Tài khoản đang bị cấm, còn lại ${remain}. Lý do: ${ban.reason}`;
  },

  async logout() {
    const username = this.getCurrentUsername();
    if (username) {
      await DB.setStatus(username, "offline");
    }
    this.clearSession();
  },
};
