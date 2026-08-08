// js/db.js
// Toàn bộ thao tác đọc/ghi Firebase Realtime Database được gom vào đây
// Cấu trúc: users/{key ngẫu nhiên do Firebase tự sinh} -> { username, password, role, token, coins, onyx, status, created }

const DB = {
  // ---------- USERS ----------
  async getAllUsers() {
    const snap = await db.ref("users").get();
    return snap.exists() ? snap.val() : {}; // { userId: {...} }
  },

  async getAllTokens() {
    const users = await this.getAllUsers();
    return new Set(Object.values(users).map((u) => u.token));
  },

  async getUserById(userId) {
    const snap = await db.ref(`users/${userId}`).get();
    return snap.exists() ? { id: userId, ...snap.val() } : null;
  },

  // Tìm user theo username (username là field bên trong, không phải key)
  async getUserByUsername(username) {
    const snap = await db.ref("users").orderByChild("username").equalTo(username).get();
    if (!snap.exists()) return null;
    let result = null;
    snap.forEach((child) => {
      result = { id: child.key, ...child.val() };
    });
    return result;
  },

  // Tìm user theo token
  async getUserByToken(token) {
    const snap = await db.ref("users").orderByChild("token").equalTo(token).get();
    if (!snap.exists()) return null;
    let result = null;
    snap.forEach((child) => {
      result = { id: child.key, ...child.val() };
    });
    return result;
  },

  async createUser(username, passwordHash, role, token) {
    const ref = db.ref("users").push();
    const user = {
      username,
      password: passwordHash,
      role, // "owner" | "admin" | "user"
      token,
      coins: 0,
      onyx: 0,
      status: "offline",
      created: Utils.nowTs(),
    };
    await ref.set(user);
    return { id: ref.key, ...user };
  },

  async updateUser(userId, patch) {
    await db.ref(`users/${userId}`).update(patch);
  },

  async setStatus(userId, status) {
    await db.ref(`users/${userId}/status`).set(status);
  },

  async addCoins(userId, amount) {
    const ref = db.ref(`users/${userId}/coins`);
    await ref.transaction((cur) => (cur || 0) + amount);
  },

  async addOnyx(userId, amount) {
    const ref = db.ref(`users/${userId}/onyx`);
    await ref.transaction((cur) => (cur || 0) + amount);
  },

  async changePassword(userId, newHash) {
    await db.ref(`users/${userId}/password`).set(newHash);
  },

  // ---------- LOGS ----------
  async addLog(actor, action, detail = "") {
    const ref = db.ref("logs").push();
    await ref.set({
      actor,
      action,
      detail,
      time: Utils.nowTs(),
    });
  },

  async getLogs() {
    const snap = await db.ref("logs").orderByChild("time").get();
    if (!snap.exists()) return [];
    const list = [];
    snap.forEach((child) => {
      list.push({ id: child.key, ...child.val() });
    });
    return list.reverse(); // mới nhất lên trên
  },

  // ---------- CARDS (Thẻ Onyx) ----------
  async getAllCardCodes() {
    const snap = await db.ref("cards").get();
    return new Set(snap.exists() ? Object.keys(snap.val()) : []);
  },

  async createCard(code, value, onyxAmount, createdBy) {
    const card = {
      code,
      value,
      onyx: onyxAmount,
      createdAt: Utils.nowTs(),
      expiresAt: Utils.nowTs() + 24 * 60 * 60 * 1000, // hạn 24h
      used: false,
      usedBy: null,
      createdBy,
    };
    await db.ref(`cards/${code}`).set(card);
    return card;
  },

  async getCard(code) {
    const snap = await db.ref(`cards/${code}`).get();
    return snap.exists() ? snap.val() : null;
  },

  async markCardUsed(code, username) {
    await db.ref(`cards/${code}`).update({ used: true, usedBy: username });
  },

  async getAllCards() {
    const snap = await db.ref("cards").get();
    return snap.exists() ? snap.val() : {};
  },

  async deleteExpiredUnusedCards() {
    const cards = await this.getAllCards();
    const now = Utils.nowTs();
    const updates = {};
    for (const [code, c] of Object.entries(cards)) {
      if (!c.used && c.expiresAt < now) updates[code] = null;
    }
    if (Object.keys(updates).length) await db.ref("cards").update(updates);
  },

  // ---------- GIFTCODE BẤT KỲ (random, 48h, dùng 1 lần) ----------
  async getAllGiftAnyCodes() {
    const snap = await db.ref("giftcodesAny").get();
    return new Set(snap.exists() ? Object.keys(snap.val()) : []);
  },

  async createGiftAny(code, createdBy) {
    const gc = {
      code,
      createdAt: Utils.nowTs(),
      expiresAt: Utils.nowTs() + 48 * 60 * 60 * 1000,
      used: false,
      usedBy: null,
      createdBy,
    };
    await db.ref(`giftcodesAny/${code}`).set(gc);
    return gc;
  },

  async getGiftAny(code) {
    const snap = await db.ref(`giftcodesAny/${code}`).get();
    return snap.exists() ? snap.val() : null;
  },

  async markGiftAnyUsed(code, username) {
    await db.ref(`giftcodesAny/${code}`).update({ used: true, usedBy: username });
  },

  // ---------- GIFTCODE VĨNH VIỄN (không hạn, dùng vô hạn nhưng mỗi tài khoản 1 lần) ----------
  async getAllGiftPermCodes() {
    const snap = await db.ref("giftcodesPermanent").get();
    return new Set(snap.exists() ? Object.keys(snap.val()) : []);
  },

  async createGiftPermanent(code, rewardType, amount, createdBy) {
    const gc = {
      code,
      rewardType, // "coins" | "onyx"
      amount,
      createdAt: Utils.nowTs(),
      createdBy,
      usedBy: {}, // { username: true }
    };
    await db.ref(`giftcodesPermanent/${code}`).set(gc);
    return gc;
  },

  async getGiftPermanent(code) {
    const snap = await db.ref(`giftcodesPermanent/${code}`).get();
    return snap.exists() ? snap.val() : null;
  },

  async markGiftPermanentUsed(code, username) {
    await db.ref(`giftcodesPermanent/${code}/usedBy/${username}`).set(true);
  },

  // ---------- BANS (vẫn khoá theo username vì đây là cách admin/owner nhập liệu) ----------
  async getBan(username) {
    const snap = await db.ref(`bans/${username}`).get();
    return snap.exists() ? snap.val() : null;
  },

  async getAllBans() {
    const snap = await db.ref("bans").get();
    return snap.exists() ? snap.val() : {};
  },

  async setBan(username, { untilTs, permanent, reason, bannedBy }) {
    await db.ref(`bans/${username}`).set({
      untilTs: permanent ? null : untilTs,
      permanent,
      reason,
      bannedBy,
      createdAt: Utils.nowTs(),
    });
  },

  async removeBan(username) {
    await db.ref(`bans/${username}`).remove();
  },
};
