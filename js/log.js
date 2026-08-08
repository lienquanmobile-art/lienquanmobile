// ===== Log (chỉ Owner) =====

async function renderLogTab(container) {
  container.innerHTML = `
    <h3 class="neon-title-sm">Lịch sử hoạt động</h3>
    <div id="logHistory" class="log-box"></div>
    <h3 class="neon-title-sm">Token</h3>
    <table class="neon-table">
      <thead><tr><th>Tên tài khoản</th><th>Vai trò</th><th>Token</th></tr></thead>
      <tbody id="tokenTbody"></tbody>
    </table>
  `;

  const logSnap = await db.ref("logs").get();
  const logs = logSnap.exists() ? Object.values(logSnap.val()) : [];
  logs.sort((a, b) => b.time - a.time);
  const box = container.querySelector("#logHistory");
  logs.forEach(l => box.appendChild(el("div", "log-line", l.text)));
  if (logs.length === 0) box.innerHTML = `<p class="dim-text">Chưa có hoạt động nào.</p>`;

  const userSnap = await db.ref("users").get();
  const users = userSnap.exists() ? Object.values(userSnap.val()).filter(u => u.role !== "owner") : [];
  const tb = container.querySelector("#tokenTbody");
  users.forEach(u => {
    tb.appendChild(el("tr", "", `<td>${u.username}</td><td>${u.role}</td><td>${u.token}</td>`));
  });
}
