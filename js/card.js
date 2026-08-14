// ===== Thẻ Onyx =====

const CARD_RATES = {
  10000: 20, 20000: 40, 50000: 102, 100000: 204, 200000: 408, 500000: 1020
};

function renderCreateCardTab(container) {
  // Xóa nội dung cũ
  container.innerHTML = '';
  
  // Tạo HTML mới
  const html = `
    <h3 class="neon-title-sm">Tạo thẻ Onyx</h3>
    <div class="form-row">
      <label>Mệnh giá</label>
      <select id="cardValueSel" class="neon-input">
        ${Object.keys(CARD_RATES).map(v => `<option value="${v}">${Number(v).toLocaleString("vi-VN")}đ</option>`).join("")}
      </select>
    </div>
    <button class="neon-btn" id="createCardBtn">Tạo thẻ</button>
    <div id="createCardResult" class="result-box"></div>
    <h3 class="neon-title-sm">Log thẻ</h3>
    <table class="neon-table">
      <thead><tr><th>Mã thẻ</th><th>Mệnh giá</th><th>Trạng thái</th><th>Thời gian còn lại</th></tr></thead>
      <tbody id="cardLogTbody"></tbody>
    </table>
  `;
  
  container.innerHTML = html;

  // Gán sự kiện cho nút tạo thẻ
  const createBtn = document.getElementById("createCardBtn");
  if (createBtn) {
    createBtn.onclick = async function() {
      const valueSelect = document.getElementById("cardValueSel");
      if (!valueSelect) return;
      
      const value = Number(valueSelect.value);
      const onyx = CARD_RATES[value];
      const code = await genUniqueCardCode();
      const createdAt = Date.now();
      const expiresAt = createdAt + 24 * 3600 * 1000;
      const me = getCurrentUser();
      
      await db.ref("cards/" + code).set({
        code, value, onyx, createdAt, expiresAt, used: false, usedBy: null, createdBy: me.username
      });
      
      await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo thẻ Onyx mệnh giá ${value.toLocaleString("vi-VN")}đ - Mã: ${code} lúc ${nowVN()}`);

      const resultDiv = document.getElementById("createCardResult");
      if (resultDiv) {
        resultDiv.innerHTML = `
          <p>Tạo thẻ thành công!</p>
          <p>Thẻ Onyx mệnh giá: <b>${value.toLocaleString("vi-VN")}đ</b></p>
          <p>Mã thẻ: <b class="glow-text">${code}</b></p>
          <p>Thời gian còn lại: <b>24:00:00</b></p>
        `;
      }
      
      // Load lại log thẻ
      const tbody = document.getElementById("cardLogTbody");
      if (tbody) {
        await loadCardLog(tbody);
      }
    };
  }

  // Load log thẻ
  const tbody = document.getElementById("cardLogTbody");
  if (tbody) {
    loadCardLog(tbody);
  }
}

async function loadCardLog(tbody) {
  if (!tbody) return;
  
  try {
    const snap = await db.ref("cards").get();
    const cards = snap.exists() ? Object.values(snap.val()) : [];
    const now = Date.now();

    // Xóa thẻ hết hạn
    for (const c of cards) {
      if (!c.used && c.expiresAt <= now) {
        await db.ref("cards/" + c.code).remove();
      }
    }

    // Lọc thẻ còn sống
    const alive = cards.filter(c => c.used || c.expiresAt > now);
    alive.sort((a, b) => {
      const rank = (c) => c.used ? 1 : 0;
      return rank(a) - rank(b) || b.createdAt - a.createdAt;
    });

    tbody.innerHTML = "";
    if (alive.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">Chưa có thẻ nào được tạo</td></tr>`;
      return;
    }

    alive.forEach(c => {
      const remain = c.used ? "-" : fmtCountdown(c.expiresAt - now);
      const status = c.used ? `Đã dùng (${c.usedBy || "?"})` : (c.expiresAt <= now ? "Hết hạn" : "Chưa sử dụng");
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.code}</td><td>${c.value.toLocaleString("vi-VN")}đ</td><td>${status}</td><td>${remain}</td>`;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Lỗi load card log:", error);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ff4444;">Lỗi tải dữ liệu</td></tr>`;
  }
}

// Nạp thẻ (dành cho user tại trang chủ)
async function redeemCard(code) {
  const snap = await db.ref("cards/" + keyify(code)).get();
  if (!snap.exists()) return { ok: false, msg: "Vui lòng nhập thông tin thẻ chính xác" };
  const card = snap.val();
  if (card.used) return { ok: false, msg: "Thẻ đã được sử dụng" };
  if (card.expiresAt <= Date.now()) {
    await db.ref("cards/" + code).remove();
    return { ok: false, msg: "Vui lòng nhập thông tin thẻ chính xác" };
  }
  const me = getCurrentUser();
  await db.ref("cards/" + code + "/used").set(true);
  await db.ref("cards/" + code + "/usedBy").set(me.username);
  const oSnap = await db.ref("users/" + keyify(me.username) + "/onyx").get();
  const cur = oSnap.exists() ? oSnap.val() : 0;
  await db.ref("users/" + keyify(me.username) + "/onyx").set(cur + card.onyx);
  await addLog(`Tài khoản user: "${me.username}" đã nạp thẻ Onyx mã ${code} (+${card.onyx} Onyx) lúc ${nowVN()}`);
  return { ok: true, onyx: card.onyx };
}
