function renderManageTab(container) {
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

  container.innerHTML = `<div class="sub-tabs" id="subTabs"></div><div id="subContent" class="sub-content"></div>`;
  const subTabsEl = container.querySelector("#subTabs");
  const subContent = container.querySelector("#subContent");

  const renderSub = (id) => {
    // Xóa nội dung cũ
    subContent.innerHTML = "";
    
    // Render tab tương ứng
    if (id === "accounts") renderAccountsTab(subContent);
    else if (id === "create") renderCreateAccountTab(subContent);
    else if (id === "log") renderLogTab(subContent);
    else if (id === "cards") renderCreateCardTab(subContent);
    else if (id === "giftcode") renderGiftcodeTab(subContent);
    else if (id === "ban") renderBanTab(subContent);
    else if (id === "lienquan") renderLienQuanTab(subContent);
  };

  subTabs.forEach((t, i) => {
    const b = el("button", "sub-tab-btn" + (i === 0 ? " active" : ""), t.label);
    b.onclick = () => {
      subTabsEl.querySelectorAll(".sub-tab-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      clearInterval(window.__banListInterval);
      clearInterval(lienquanInterval);
      renderSub(t.id);
    };
    subTabsEl.appendChild(b);
  });

  // Mặc định hiển thị tab đầu tiên
  renderSub("accounts");
}
