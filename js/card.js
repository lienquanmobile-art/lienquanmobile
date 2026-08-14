// ===== Thẻ Onyx =====

console.log("Đang load cards.js...");

const CARD_RATES = {
  10000: 20,
  20000: 40,
  50000: 102,
  100000: 204,
  200000: 408,
  500000: 1020
};

// Định nghĩa hàm renderCreateCardTab
window.renderCreateCardTab = function(container) {
  console.log("renderCreateCardTab được gọi");
  
  if (!container) {
    console.error("container is null");
    return;
  }
  
  try {
    // Xóa nội dung cũ
    container.innerHTML = '';
    
    // Tạo HTML mới
    var html = '';
    html += '<h3 class="neon-title-sm">Tạo thẻ Onyx</h3>';
    html += '<div class="form-row">';
    html += '  <label>Mệnh giá</label>';
    html += '  <select id="cardValueSel" class="neon-input">';
    
    var keys = Object.keys(CARD_RATES);
    for (var i = 0; i < keys.length; i++) {
      var v = keys[i];
      html += '<option value="' + v + '">' + Number(v).toLocaleString("vi-VN") + 'đ</option>';
    }
    
    html += '  </select>';
    html += '</div>';
    html += '<button class="neon-btn" id="createCardBtn">Tạo thẻ</button>';
    html += '<div id="createCardResult" class="result-box"></div>';
    html += '<h3 class="neon-title-sm">Log thẻ</h3>';
    html += '<table class="neon-table">';
    html += '  <thead><tr><th>Mã thẻ</th><th>Mệnh giá</th><th>Trạng thái</th><th>Thời gian còn lại</th></tr></thead>';
    html += '  <tbody id="cardLogTbody"></tbody>';
    html += '</table>';
    
    container.innerHTML = html;
    console.log("HTML đã được set");

    // Gán sự kiện cho nút tạo thẻ
    var createBtn = document.getElementById("createCardBtn");
    if (createBtn) {
      createBtn.onclick = function() {
        handleCreateCard();
      };
      console.log("Đã gán sự kiện cho nút tạo thẻ");
    } else {
      console.error("Không tìm thấy nút createCardBtn");
    }

    // Load log thẻ
    var tbody = document.getElementById("cardLogTbody");
    if (tbody) {
      loadCardLog(tbody);
      console.log("Đã load log thẻ");
    } else {
      console.error("Không tìm thấy cardLogTbody");
    }
  } catch (error) {
    console.error("Lỗi trong renderCreateCardTab:", error);
    container.innerHTML = '<div style="color: #ff4444; padding: 20px;">Lỗi: ' + error.message + '</div>';
  }
};

async function handleCreateCard() {
  try {
    var valueSelect = document.getElementById("cardValueSel");
    if (!valueSelect) {
      console.error("Không tìm thấy cardValueSel");
      return;
    }
    
    var value = Number(valueSelect.value);
    var onyx = CARD_RATES[value];
    var code = await genUniqueCardCode();
    var createdAt = Date.now();
    var expiresAt = createdAt + 24 * 3600 * 1000;
    var me = getCurrentUser();
    
    await db.ref("cards/" + code).set({
      code: code,
      value: value,
      onyx: onyx,
      createdAt: createdAt,
      expiresAt: expiresAt,
      used: false,
      usedBy: null,
      createdBy: me.username
    });
    
    await addLog('Tài khoản ' + me.role + ': "' + me.username + '" đã tạo thẻ Onyx mệnh giá ' + value.toLocaleString("vi-VN") + 'đ - Mã: ' + code + ' lúc ' + nowVN());

    var resultDiv = document.getElementById("createCardResult");
    if (resultDiv) {
      resultDiv.innerHTML = '<p style="color: #5dff8f;">✅ Tạo thẻ thành công!</p>' +
        '<p>Thẻ Onyx mệnh giá: <b>' + value.toLocaleString("vi-VN") + 'đ</b></p>' +
        '<p>Mã thẻ: <b class="glow-text">' + code + '</b></p>' +
        '<p>Thời gian còn lại: <b>24:00:00</b></p>';
    }
    
    // Load lại log thẻ
    var tbody = document.getElementById("cardLogTbody");
    if (tbody) {
      await loadCardLog(tbody);
    }
  } catch (error) {
    console.error("Lỗi tạo thẻ:", error);
    toast("Lỗi tạo thẻ: " + error.message);
  }
}

async function loadCardLog(tbody) {
  console.log("loadCardLog được gọi");
  
  if (!tbody) {
    console.error("tbody is null");
    return;
  }
  
  try {
    var snap = await db.ref("cards").get();
    var cards = snap.exists() ? Object.values(snap.val()) : [];
    var now = Date.now();

    // Xóa thẻ hết hạn
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (!c.used && c.expiresAt <= now) {
        await db.ref("cards/" + c.code).remove();
      }
    }

    // Lọc thẻ còn sống
    var alive = [];
    for (var j = 0; j < cards.length; j++) {
      var card = cards[j];
      if (card.used || card.expiresAt > now) {
        alive.push(card);
      }
    }
    
    alive.sort(function(a, b) {
      var rankA = a.used ? 1 : 0;
      var rankB = b.used ? 1 : 0;
      if (rankA !== rankB) return rankA - rankB;
      return b.createdAt - a.createdAt;
    });

    tbody.innerHTML = "";
    if (alive.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Chưa có thẻ nào được tạo</td></tr>';
      return;
    }

    for (var k = 0; k < alive.length; k++) {
      var cardItem = alive[k];
      var remain = cardItem.used ? "-" : fmtCountdown(cardItem.expiresAt - now);
      var status = cardItem.used ? 'Đã dùng (' + (cardItem.usedBy || "?") + ')' : (cardItem.expiresAt <= now ? "Hết hạn" : "Chưa sử dụng");
      var tr = document.createElement("tr");
      tr.innerHTML = '<td>' + cardItem.code + '</td><td>' + cardItem.value.toLocaleString("vi-VN") + 'đ</td><td>' + status + '</td><td>' + remain + '</td>';
      tbody.appendChild(tr);
    }
    
    console.log("Đã load xong log thẻ, số lượng:", alive.length);
  } catch (error) {
    console.error("Lỗi load card log:", error);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ff4444;">Lỗi tải dữ liệu: ' + error.message + '</td></tr>';
  }
}

// Nạp thẻ (dành cho user tại trang chủ)
async function redeemCard(code) {
  try {
    var snap = await db.ref("cards/" + keyify(code)).get();
    if (!snap.exists()) return { ok: false, msg: "Vui lòng nhập thông tin thẻ chính xác" };
    var card = snap.val();
    if (card.used) return { ok: false, msg: "Thẻ đã được sử dụng" };
    if (card.expiresAt <= Date.now()) {
      await db.ref("cards/" + code).remove();
      return { ok: false, msg: "Vui lòng nhập thông tin thẻ chính xác" };
    }
    var me = getCurrentUser();
    await db.ref("cards/" + code + "/used").set(true);
    await db.ref("cards/" + code + "/usedBy").set(me.username);
    var oSnap = await db.ref("users/" + keyify(me.username) + "/onyx").get();
    var cur = oSnap.exists() ? oSnap.val() : 0;
    await db.ref("users/" + keyify(me.username) + "/onyx").set(cur + card.onyx);
    await addLog('Tài khoản user: "' + me.username + '" đã nạp thẻ Onyx mã ' + code + ' (+' + card.onyx + ' Onyx) lúc ' + nowVN());
    return { ok: true, onyx: card.onyx };
  } catch (error) {
    console.error("Lỗi redeem card:", error);
    return { ok: false, msg: "Lỗi hệ thống: " + error.message };
  }
}

console.log("cards.js đã được load thành công!");
console.log("renderCreateCardTab đã được định nghĩa:", typeof window.renderCreateCardTab);
