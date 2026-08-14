function renderManageTab(container) {
  if (!container) return;
  
  const me = getCurrentUser();
  const subTabs = [
    { id: "accounts", label: "Tài Khoản" },
    { id: "create", label: "Tạo tài khoản" }
  ];
  if (me.role === "owner") subTabs.push({ id: "log", label: "Log" });
  subTabs.push({ id: "cards", label: "Tạo thẻ" });
  subTabs.push({ id: "giftcode", label: "Tạo giftcode" });
  subTabs.push({ id: "ban", label: "Cấm tài khoản" });
  subTabs.push({ id: "lienquan", label: "Tài khoản Liên Quân" });

  container.innerHTML = `
    <div class="sub-tabs" id="subTabs"></div>
    <div id="subContent" class="sub-content"></div>
  `;
  
  const subTabsEl = container.querySelector("#subTabs");
  const subContent = container.querySelector("#subContent");

  if (!subTabsEl || !subContent) return;

  // Hàm render tab con
  const renderSub = (id) => {
    // Xóa nội dung cũ
    subContent.innerHTML = '';
    
    // Clear interval cũ
    if (accountsInterval) {
      clearInterval(accountsInterval);
      accountsInterval = null;
    }
    if (lienquanInterval) {
      clearInterval(lienquanInterval);
      lienquanInterval = null;
    }
    if (window.__banListInterval) {
      clearInterval(window.__banListInterval);
      window.__banListInterval = null;
    }
    
    // Render tab tương ứng
    try {
      switch(id) {
        case "accounts":
          renderAccountsTab(subContent);
          break;
        case "create":
          renderCreateAccountTab(subContent);
          break;
        case "log":
          renderLogTab(subContent);
          break;
        case "cards":
          if (typeof renderCreateCardTab === 'function') {
            renderCreateCardTab(subContent);
          } else {
            subContent.innerHTML = '<div style="color: #ff4444; padding: 20px;">Lỗi: renderCreateCardTab chưa được định nghĩa</div>';
          }
          break;
        case "giftcode":
          renderGiftcodeTab(subContent);
          break;
        case "ban":
          renderBanTab(subContent);
          break;
        case "lienquan":
          renderLienQuanTab(subContent);
          break;
        default:
          subContent.innerHTML = '<div class="dim-text">Tab không tồn tại</div>';
      }
    } catch (error) {
      console.error("Lỗi render tab:", error);
      subContent.innerHTML = `<div style="color: #ff4444; padding: 20px;">Lỗi: ${error.message}</div>`;
    }
  };

  // Xóa các tab cũ
  subTabsEl.innerHTML = "";
  
  subTabs.forEach((t, i) => {
    const b = el("button", "sub-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = function(tabId) {
      return function() {
        // Xóa active của tất cả tab
        subTabsEl.querySelectorAll(".sub-tab-btn").forEach(x => x.classList.remove("active"));
        this.classList.add("active");
        renderSub(tabId);
      };
    }(t.id);
    subTabsEl.appendChild(b);
  });

  // Mặc định hiển thị tab đầu tiên
  renderSub("accounts");
}
