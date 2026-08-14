// ===== Thẻ Onyx =====

console.log("=== cards.js đang được load ===");

// Định nghĩa CARD_RATES
var CARD_RATES = {
  10000: 20,
  20000: 40,
  50000: 102,
  100000: 204,
  200000: 408,
  500000: 1020
};

// Định nghĩa hàm renderCreateCardTab GLOBAL
function renderCreateCardTab(container) {
  console.log("=== renderCreateCardTab được gọi ===");
  
  if (!container) {
    console.error("container is null");
    return;
  }
  
  // Hiển thị nội dung đơn giản để test
  container.innerHTML = `
    <h3 class="neon-title-sm">Tạo thẻ Onyx</h3>
    <div style="background: rgba(0,255,224,0.05); padding: 20px; border-radius: 8px;">
      <p style="color: #5dff8f;">✅ Tab Tạo thẻ đã hoạt động!</p>
      <p>Đây là nội dung test.</p>
    </div>
    <div class="form-row">
      <label>Mệnh giá</label>
      <select id="cardValueSel" class="neon-input">
        <option value="10000">10.000đ</option>
        <option value="20000">20.000đ</option>
        <option value="50000">50.000đ</option>
        <option value="100000">100.000đ</option>
        <option value="200000">200.000đ</option>
        <option value="500000">500.000đ</option>
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

  // Gán sự kiện cho nút tạo thẻ
  var createBtn = document.getElementById("createCardBtn");
  if (createBtn) {
    createBtn.onclick = function() {
      alert("Nút Tạo thẻ đã hoạt động!");
    };
  }
  
  console.log("=== renderCreateCardTab đã hoàn thành ===");
}

console.log("=== cards.js đã load xong ===");
console.log("typeof renderCreateCardTab:", typeof renderCreateCardTab);
