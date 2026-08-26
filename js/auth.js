// ===== Auth =====

const OWNER_SEED = {
  username: "black",
  password: "m",
  token: "nguyenminhsonyeutmai"
};

// Tạo sẵn tài khoản owner đầu tiên nếu chưa tồn tại
async function seedOwnerAccount() {
  const snap = await db.ref("users/" + OWNER_SEED.username).get();
  if (snap.exists()) return;

  const userData = {
    username: OWNER_SEED.username,
    password: OWNER_SEED.password,
    role: "owner",
    token: OWNER_SEED.token,
    status: "offline",
    coins: Infinity,
    onyx: Infinity,
    created: Date.now(),
    banned: false
  };

  await db.ref("users/" + OWNER_SEED.username).set(userData);
  await db.ref("tokens/" + OWNER_SEED.token).set(OWNER_SEED.username);
}

async function getUser(username) {
  const snap = await db.ref("users/" + keyify(username)).get();
  return snap.exists() ? snap.val() : null;
}

async function checkBanStatus(username) {
  const snap = await db.ref("bans/" + keyify(username)).get();
  if (!snap.exists()) return null;
  const ban = snap.val();
  if (!ban.permanent && ban.until && ban.until <= Date.now()) {
    // hết hạn -> tự mở khóa
    await db.ref("bans/" + keyify(username)).remove();
    await db.ref("ban_trigger/" + keyify(username)).remove();
    return null;
  }
  return ban;
}

async function loginWithPassword(username, password) {
  const user = await getUser(username);
  if (!user || user.password !== password) {
    return { ok: false, msg: "Sai tên đăng nhập hoặc mật khẩu!" };
  }
  const ban = await checkBanStatus(username);
  if (ban) {
    return { 
      ok: false, 
      msg: "Tài khoản đang bị cấm",
      banned: true,
      banData: ban,
      username: username
    };
  }
  await db.ref("users/" + keyify(username) + "/status").set("online");
  await addLog(`Tài khoản ${user.role}: "${username}" đã đăng nhập lúc ${nowVN()}`);
  return { ok: true, user };
}

async function loginWithToken(token) {
  const snap = await db.ref("tokens/" + keyify(token)).get();
  if (!snap.exists()) return { ok: false, msg: "Token không hợp lệ!" };
  const username = snap.val();
  const user = await getUser(username);
  if (!user) return { ok: false, msg: "Token không hợp lệ!" };

  const ban = await checkBanStatus(username);
  if (ban) {
    return { 
      ok: false, 
      msg: "Tài khoản đang bị cấm",
      banned: true,
      banData: ban,
      username: username
    };
  }

  await db.ref("users/" + keyify(username) + "/status").set("online");
  await addLog(`Tài khoản ${user.role}: "${username}" đã đăng nhập bằng token lúc ${nowVN()}`);
  return { ok: true, user };
}

async function logoutUser(username) {
  await db.ref("users/" + keyify(username) + "/status").set("offline");
  localStorage.removeItem("currentUser");
}

async function changePassword(username, oldPass, newPass) {
  const user = await getUser(username);
  if (!user || user.password !== oldPass) return { ok: false, msg: "Mật khẩu cũ không đúng!" };
  await db.ref("users/" + keyify(username) + "/password").set(newPass);
  await addLog(`Tài khoản ${user.role}: "${username}" đã đổi mật khẩu lúc ${nowVN()}`);
  return { ok: true };
}

// Hàm kiểm tra quyền cấm
function canBan(banBy, targetUser) {
  const roleHierarchy = {
    "owner": 4,
    "vip": 3,
    "admin": 2,
    "user": 1
  };
  
  const byRank = roleHierarchy[banBy.role] || 0;
  const targetRank = roleHierarchy[targetUser.role] || 0;
  
  // Owner có thể cấm tất cả
  if (banBy.role === "owner") return true;
  
  // VIP có thể cấm admin và user, nhưng không cấm owner và vip khác
  if (banBy.role === "vip") {
    if (targetUser.role === "owner") return false;
    if (targetUser.role === "vip") return false;
    return true;
  }
  
  // Admin chỉ cấm được user
  if (banBy.role === "admin") {
    return targetUser.role === "user";
  }
  
  return false;
}
