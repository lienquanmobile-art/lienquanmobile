// ===== Tiện ích chung =====

function randChars(len, pool) {
  let s = "";
  for (let i = 0; i < len; i++) s += pool[Math.floor(Math.random() * pool.length)];
  return s;
}

function randAlnum(len) {
  return randChars(len, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
}

function randDigits(len) {
  return randChars(len, "0123456789");
}

// Sinh token 20 ký tự không trùng với bất kỳ token nào đã tồn tại trong DB
async function genUniqueToken() {
  while (true) {
    const t = randAlnum(20);
    const snap = await db.ref("tokens/" + t).get();
    if (!snap.exists()) return t;
  }
}

// Sinh mã thẻ 16 số không trùng
async function genUniqueCardCode() {
  while (true) {
    const c = randDigits(16);
    const snap = await db.ref("cards/" + c).get();
    if (!snap.exists()) return c;
  }
}

// Sinh giftcode dạng BLACK=xxxxxxx (7 ký tự) không trùng ở node cho trước
async function genUniqueGiftcode(node) {
  while (true) {
    const code = "BLACK=" + randAlnum(7);
    const key = code.replace(/[.#$/\[\]]/g, "_");
    const snap = await db.ref(node + "/" + key).get();
    if (!snap.exists()) return { code, key };
  }
}

function keyify(str) {
  return String(str).replace(/[.#$/\[\]]/g, "_");
}

function nowVN() {
  return new Date().toLocaleString("vi-VN", { hour12: false });
}

function fmtCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return (days > 0 ? days + "d " : "") + `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

async function addLog(text) {
  try {
    await db.ref("logs").push({ text, time: Date.now(), timeStr: nowVN() });
  } catch (error) {
    console.error("Lỗi addLog:", error);
  }
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
