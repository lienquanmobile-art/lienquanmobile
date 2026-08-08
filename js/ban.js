// ===== Cấm tài khoản =====

const BAN_PRESETS = {
  "apk3y": { label: "Dùng APK, phần mềm thứ 3, code độc hại", ms: 3 * 365 * 86400 * 1000 },
  "hack3y": { label: "Hack mã thẻ, Hack Giftcode, Hack tỉ lệ", ms: 3 * 365 * 86400 * 1000 },
  "game1w": { label: "Hack những game có trong web để kiếm xu", ms: 7 * 86400 * 1000 },
  "coin1w": { label: "Hack xu, hack Onyx", ms: 7 * 86400 * 1000 }
};

function renderBanTab(container) {
  const me = getCurrentUser();
  container.innerHTML = `
    <h3 class="neon-title-sm">Mục cấm</h3>
    <div class="form-row">
      <label>Tài khoản bị cấm</label>
      <input id="banUsername" class="neon-input" placeholder="Nhập tên tài khoản">
    </div>
    <div class="form-row">
      <label>Token</label>
      <input id="banToken" class="neon-input" placeholder="Nhập token tài khoản bị cấm">
    </div>
    <div class="form-row"><label>Tài khoản cấm</label><input class="neon-input" value="${me.username}" disabled></div>
    <div class="form-row time-row">
      <label>Thời gian cấm</label>
      <div class="time-inputs">
        <input id="banSec" type="number" min="0" class="neon-input small" placeholder="Giây">
        <input id="banMin" type="number" min="0" class="neon-input small" placeholder="Phút">
        <input id="banHour" type="number" min="0" class="neon-input small" placeholder="Giờ">
        <input id="banDay" type="number" min="0" class="neon-input small" placeholder="Ngày">
        <input id="banYear" type="number" min="0" class="neon-input small" placeholder="Năm">
      </div>
    </div>
    <div class="form-row">
      <label><input type="checkbox" id="banPermanent"> Vĩnh viễn</label>
    </div>
    <div class="form-row">
      <label>Lý do có sẵn</label>
      <select id="banPreset" class="neon-input">
        <option value="">-- Không chọn --</option>
        ${Object.entries(BAN_PRESETS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
      </select>
    </div>
    <div class="form-row">
      <label>Lý do khác</label>
      <input id="banReasonOther" class="neon-input" placeholder="Nhập lý do khác">
    </div>
    <button class="neon-btn" id="banConfirmBtn">Cấm</button>
    <div id="banResult" class="result-box"></div>

    <h3 class="neon-title-sm">Danh sách cấm</h3>
    <table class="neon-table">
      <thead><tr><th>Tên</th><th>Lý do</th><th>Thời gian cấm</th><th></th></tr></thead>
      <tbody id="banListTbody"></tbody>
    </table>
  `;

  container.querySelector("#banPreset").onchange = (e) => {
    if (e.target.value) container.querySelector("#banReasonOther").value = "";
  };

  container.querySelector("#banConfirmBtn").onclick = async () => {
    const target = container.querySelector("#banUsername").value.trim();
    const token = container.querySelector("#banToken").value.trim();
    if (!target || !token) { toast("Vui lòng nhập đầy đủ thông tin!"); return; }

    const targetUser = await getUser(target);
    if (!targetUser || targetUser.token !== token) { toast("Tài khoản hoặc token không đúng!"); return; }
    if (targetUser.role === "owner") { toast("Không thể cấm tài khoản Owner!"); return; }
    if (me.role === "admin" && targetUser.role !== "user") { toast("Admin chỉ có thể cấm tài khoản User!"); return; }

    const permanent = container.querySelector("#banPermanent").checked;
    const preset = container.querySelector("#banPreset").value;
    let reason = container.querySelector("#banReasonOther").value.trim();
    let durationMs = 0;

    if (preset) {
      reason = BAN_PRESETS[preset].label;
      durationMs = BAN_PRESETS[preset].ms;
    } else {
      const sec = Number(container.querySelector("#banSec").value) || 0;
      const min = Number(container.querySelector("#banMin").value) || 0;
      const hour = Number(container.querySelector("#banHour").value) || 0;
      const day = Number(container.querySelector("#banDay").value) || 0;
      const year = Number(container.querySelector("#banYear").value) || 0;
      durationMs = (sec + min * 60 + hour * 3600 + day * 86400 + year * 365 * 86400) * 1000;
    }

    if (!permanent && durationMs <= 0) { toast("Vui lòng nhập thời gian cấm hoặc chọn vĩnh viễn!"); return; }
    if (!reason) { toast("Vui lòng chọn hoặc nhập lý do cấm!"); return; }

    const banData = {
      by: me.username, reason, permanent,
      until: permanent ? null : Date.now() + durationMs,
      createdAt: Date.now()
    };
    await db.ref("bans/" + keyify(target)).set(banData);
    await db.ref("users/" + keyify(target) + "/status").set("offline");
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã cấm tài khoản "${target}" - Lý do: ${reason} lúc ${nowVN()}`);

    container.querySelector("#banResult").innerHTML = `<p>Đã cấm tài khoản "${target}" thành công!</p>`;
    loadBanList(container.querySelector("#banListTbody"), me);
  };

  loadBanList(container.querySelector("#banListTbody"), me);
  clearInterval(window.__banListInterval);
  window.__banListInterval = setInterval(() => {
    const tb = document.getElementById("banListTbody");
    if (tb) loadBanList(tb, me, true);
  }, 1000);
}

async function loadBanList(tbody, me, silent) {
  const snap = await db.ref("bans").get();
  const bans = snap.exists() ? snap.val() : {};
  const now = Date.now();

  if (!silent) tbody.innerHTML = "";
  else if (tbody.dataset.rendering === "1") return;

  tbody.innerHTML = "";
  for (const [username, ban] of Object.entries(bans)) {
    if (!ban.permanent && ban.until <= now) {
      await db.ref("bans/" + username).remove();
      continue;
    }
    const timeTxt = ban.permanent ? "Vĩnh viễn" : fmtCountdown(ban.until - now);
    const tr = el("tr", "", `<td>${username}</td><td>${ban.reason}</td><td>${timeTxt}</td>`);
    const tdBtn = el("td");
    const btn = el("button", "neon-btn small", "Mở khóa");
    btn.onclick = async () => {
      await db.ref("bans/" + username).remove();
      await addLog(`Tài khoản ${me.role}: "${me.username}" đã mở khóa tài khoản "${username}" lúc ${nowVN()}`);
      loadBanList(tbody, me);
    };
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  }
}
