function renderManageTab(container) {
  if (!container) return;
  
  var me = getCurrentUser();
  var subTabs = [
    { id: "accounts", label: "Tài Khoản" },
    { id: "create", label: "Tạo tài khoản" }
  ];
  if (me.role === "owner") subTabs.push({ id: "log", label: "Log" });
  subTabs.push({ id: "cards", label: "Tạo thẻ" });
  subTabs.push({ id: "giftcode", label: "Tạo giftcode" });
  subTabs.push({ id: "ban", label: "Cấm tài khoản" });
  subTabs.push({ id: "lienquan", label: "Tài khoản Liên Quân" });

  container.innerHTML = '<div class="sub-tabs" id="subTabs"></div><div id="subContent" class="sub-content"></div>';
  
  var subTabsEl = container.querySelector("#subTabs");
  var subContent = container.querySelector("#subContent");

  if (!subTabsEl || !subContent) return;

  // Hàm render tab con
  function renderSub(id) {
    // Xóa nội dung cũ
    subContent.innerHTML = '';
    
    // Render tab tương ứng
    try {
      if (id === "accounts") {
        renderAccountsTab(subContent);
      } else if (id === "create") {
        renderCreateAccountTab(subContent);
      } else if (id === "log") {
        renderLogTab(subContent);
      } else if (id === "cards") {
        if (typeof renderCreateCardTab === 'function') {
          renderCreateCardTab(subContent);
        } else {
          subContent.innerHTML = '<div style="color: #ff4444; padding: 20px;">Lỗi: renderCreateCardTab chưa được định nghĩa. Kiểm tra file cards.js</div>';
          console.error("renderCreateCardTab is not defined");
        }
      } else if (id === "giftcode") {
        renderGiftcodeTab(subContent);
      } else if (id === "ban") {
        renderBanTab(subContent);
      } else if (id === "lienquan") {
        renderLienQuanTab(subContent);
      } else {
        subContent.innerHTML = '<div class="dim-text">Tab không tồn tại</div>';
      }
    } catch (error) {
      console.error("Lỗi render tab:", error);
      subContent.innerHTML = '<div style="color: #ff4444; padding: 20px;">Lỗi: ' + error.message + '</div>';
    }
  }

  // Xóa các tab cũ
  subTabsEl.innerHTML = "";
  
  for (var i = 0; i < subTabs.length; i++) {
    var t = subTabs[i];
    var b = el("button", "sub-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = function(tabId) {
      return function() {
        // Xóa active của tất cả tab
        var btns = subTabsEl.querySelectorAll(".sub-tab-btn");
        for (var j = 0; j < btns.length; j++) {
          btns[j].classList.remove("active");
        }
        this.classList.add("active");
        
        // Clear các interval
        if (window.__banListInterval) {
          clearInterval(window.__banListInterval);
          window.__banListInterval = null;
        }
        if (window.lienquanInterval) {
          clearInterval(window.lienquanInterval);
          window.lienquanInterval = null;
        }
        
        // Render tab được chọn
        renderSub(tabId);
      };
    }(t.id);
    subTabsEl.appendChild(b);
  }

  // Mặc định hiển thị tab đầu tiên
  renderSub("accounts");
}
