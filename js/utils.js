// js/utils.js
// Các hàm tiện ích dùng chung cho cả web

const Utils = {
  // Băm mật khẩu bằng SHA-256 (không lưu mật khẩu dạng chữ thường trong database)
  async hashPassword(plain) {
    const enc = new TextEncoder().encode(plain);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  // Sinh chuỗi số ngẫu nhiên có độ dài "len"
  randomDigits(len) {
    let s = "";
    for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
    return s;
  },

  // Sinh chuỗi chữ + số ngẫu nhiên có độ dài "len" (dùng cho giftcode)
  randomAlnum(len) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  },

  // Token tài khoản: 20 số, đảm bảo không trùng với token đã có trong "existingTokens" (Set)
  generateUniqueToken(existingTokens) {
    let token;
    do {
      token = this.randomDigits(20);
    } while (existingTokens.has(token));
    return token;
  },

  // Mã thẻ Onyx: 16 số, không trùng với "existingCodes" (Set)
  generateUniqueCardCode(existingCodes) {
    let code;
    do {
      code = this.randomDigits(16);
    } while (existingCodes.has(code));
    return code;
  },

  // Giftcode dạng BLACK=<7 ký tự chữ và số>, không trùng với "existingCodes" (Set)
  generateUniqueGiftcode(existingCodes) {
    let code;
    do {
      code = "BLACK=" + this.randomAlnum(7);
    } while (existingCodes.has(code));
    return code;
  },

  nowTs() {
    return Date.now();
  },

  formatDateTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(
      d.getDate()
    )}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  },

  // Trả về chuỗi đếm ngược dạng DD:HH:MM:SS từ số mili-giây còn lại
  formatCountdown(msRemaining) {
    if (msRemaining <= 0) return "00:00:00:00";
    let totalSec = Math.floor(msRemaining / 1000);
    const days = Math.floor(totalSec / 86400);
    totalSec -= days * 86400;
    const hours = Math.floor(totalSec / 3600);
    totalSec -= hours * 3600;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec - mins * 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(days)}:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  },

  escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
};
