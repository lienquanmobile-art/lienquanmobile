// ===== Utils =====

function keyify(str) {
  return str.replace(/[.#$\/\[\]]/g, '_');
}

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove("show"), 3000);
}

function nowVN() {
  return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function fmtCountdown(ms) {
  if (ms <= 0) return "0s";
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let parts = [];
  if (d) parts.push(d + "d");
  if (h) parts.push(h + "h");
  if (m) parts.push(m + "m");
  if (s) parts.push(s + "s");
  return parts.join(" ") || "0s";
}

async function genUniqueToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token;
  let exists = true;
  while (exists) {
    token = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const snap = await db.ref("tokens/" + keyify(token)).get();
    exists = snap.exists();
  }
  return token;
}

async function genUniqueCardCode() {
  const chars = "0123456789";
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const snap = await db.ref("cards/" + code).get();
    exists = snap.exists();
  }
  return code;
}

async function genUniqueGiftcode(path) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let exists = true;
  while (exists) {
    code = "GC" + Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const key = keyify(code);
    const snap = await db.ref(path + "/" + key).get();
    exists = snap.exists();
  }
  return { code, key: keyify(code) };
}

async function addLog(text) {
  const ref = db.ref("logs").push();
  await ref.set({ text, time: Date.now() });
}
