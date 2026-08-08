// js/auth.js
// Xử lý đăng nhập bằng tài khoản/mật khẩu hoặc bằng token, và quản lý phiên đăng nhập
// Lưu ý: mỗi user giờ nằm ở users/{key ngẫu nhiên}, nên đăng nhập phải TRUY VẤN theo field username/token

const Auth = {
  SESSION_KEY: "qltk_session_userid",

  // Tạo tài khoản Owner mặc định nếu chưa tồn tại tài khoản Owner nào
  async ensureOwnerExists() {
    const users = await DB.getAllUsers();
    const hasOwner = Object.values(users).some((u) => u.role === "owner");
    if (hasOwner) return;

    const tokens = new Set(Object.values(users).map((u) => u.token));
    const token = Utils.generateUniqueToken(tokens);
    const passwordHash = await Utils.hashPassword("owner123");
    await DB.createUser("owner", passwordHash, "owner", token);
    console.log(
      "%cĐã tạo tài khoản Owner mặc định -> Tên đăng nhập: owner | Mật khẩu: owner123. Hãy đổi mật khẩu ngay!",
      "color: orange; font-weight: bold;"
    );
  },

  getCurrentUserId() {
    return sessionStorage.getItem(this.SESSION_KEY);
  },

  setCurrentUserId(userId) {
    sessionStorage.setItem(this.SESSION_KEY, userId);
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
    const user = await DB.getUserByUsername(username);
    if (!user) return { ok: false, error: "Tài khoản không tồn tại" };

    const hash = await Utils.hashPassword(password);
    if (hash !== user.password) return { ok: false, error: "Sai mật khẩu" };

    const ban = await this.checkBan(user.username);
    if (ban) return { ok: false, error: this.banMessage(ban) };

    this.setCurrentUserId(user.id);
    await DB.setStatus(user.id, "online");
    await DB.addLog(user.username, "Đăng nhập", `${user.username} đã đăng nhập vào lúc ${Utils.formatDateTime(Utils.nowTs())}`);
    return { ok: true, account: user };
  },

  async loginWithToken(token) {
    const user = await DB.getUserByToken(token);
    if (!user) return { ok: false, error: "Token không hợp lệ" };

    const ban = await this.checkBan(user.username);
    if (ban) return { ok: false, error: this.banMessage(ban) };

    this.setCurrentUserId(user.id);
    await DB.setStatus(user.id, "online");
    await DB.addLog(
      user.username,
      "Đăng nhập bằng token",
      `${user.username} đã đăng nhập bằng token vào lúc ${Utils.formatDateTime(Utils.nowTs())}`
    );
    return { ok: true, account: user };
  },

  banMessage(ban) {
    if (ban.permanent) return `Tài khoản đã bị cấm vĩnh viễn. Lý do: ${ban.reason}`;
    const remain = Utils.formatCountdown(ban.untilTs - Utils.nowTs());
    return `Tài khoản đang bị cấm, còn lại ${remain}. Lý do: ${ban.reason}`;
  },

  async logout() {
    const userId = this.getCurrentUserId();
    if (userId) {
      await DB.setStatus(userId, "offline");
    }
    this.clearSession();
  },
};
