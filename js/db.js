// js/db.js
// Toàn bộ thao tác đọc/ghi Firebase Realtime Database được gom vào đây

const DB = {
  // ---------- ACCOUNTS ----------
  async getAccount(username) {
    const snap = await db.ref(`accounts/${username}`).get();
    return snap.exists() ? snap.val() : null;
  },

  async getAllAccounts() {
    const snap = await db.ref("accounts").get();
    return snap.exists() ? snap.val() : {};
  },

  async getAllTokens() {
    const accounts = await this.getAllAccounts();
    return new Set(Object.values(accounts).map((a) => a.token));
  },

  async findAccountByToken(token) {
    const accounts = await this.getAllAccounts();
    for (const [username, acc] of Object.entries(accounts)) {
      if (acc.token === token) return { username, ...acc };
    }
    return null;
  },

  async createAccount(username, passwordHash, role, token) {
    const account = {
      password: passwordHash,
      role, // "owner" | "admin" | "user"
      token,
      coins: 0,
      onyx: 0,
      status: "offline",
      createdAt: Utils.nowTs(),
    };
    await db.ref(`accounts/${username}`).set(account);
    return account;
  },

  async updateAccount(username, patch) {
    await db.ref(`accounts/${username}`).update(patch);
  },

  async setStatus(username, status) {
    await db.ref(`accounts/${username}/status`).set(status);
  },

  async addCoins(username, amount) {
    const ref = db.ref(`accounts/${username}/coins`);
    await ref.transaction((cur) => (cur || 0) + amount);
  },

  async addOnyx(username, amount) {
    const ref = db.ref(`accounts/${username}/onyx`);
    await ref.transaction((cur) => (cur || 0) + amount);
  },

  async changePassword(username, newHash) {
    await db.ref(`accounts/${username}/password`).set(newHash);
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

  // ---------- BANS ----------
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
