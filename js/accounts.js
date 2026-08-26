async function loadAccountsData() {
  try {
    const snap = await db.ref("users").get();
    if (!snap.exists()) return;
    
    const all = snap.val();
    const users = Object.values(all).filter(u => u.role === "user");
    const admins = Object.values(all).filter(u => u.role === "admin");
    const vips = Object.values(all).filter(u => u.role === "vip");
    const owner = Object.values(all).filter(u => u.role === "owner");
    
    // Cập nhật bảng User
    const userTbody = document.getElementById("usersTbody");
    if (userTbody) {
      userTbody.innerHTML = "";
      users.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const tr = document.createElement("tr");
        const onyxDisplay = (u.onyx >= 999999999 || u.role === "vip" || u.role === "owner") ? "∞" : (u.onyx || 0);
        const coinsDisplay = (u.coins >= 999999999 || u.role === "vip" || u.role === "owner") ? "∞" : (u.coins || 0);
        tr.innerHTML = `<td>${u.username}</td><td class="${statusClass}">${statusText}</td><td>${onyxDisplay}</td><td>${coinsDisplay}</td>`;
        userTbody.appendChild(tr);
      });
    }
    
    // Cập nhật bảng Admin
    const adminTbody = document.getElementById("adminsTbody");
    if (adminTbody) {
      adminTbody.innerHTML = "";
      admins.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.username}</td><td class="${statusClass}">${statusText}</td>`;
        adminTbody.appendChild(tr);
      });
    }
    
    // Cập nhật bảng VIP
    const vipTbody = document.getElementById("vipTbody");
    if (vipTbody) {
      vipTbody.innerHTML = "";
      const allVips = [...vips, ...owner];
      allVips.forEach(u => {
        const statusClass = u.status === "online" ? "online" : "offline";
        const statusText = u.status === "online" ? "🟢 Online" : "🔴 Offline";
        const roleDisplay = u.role === "owner" ? "👑 Owner" : "⭐ VIP";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${u.username} ${roleDisplay}</td><td class="${statusClass}">${statusText}</td>`;
        vipTbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error("Lỗi load accounts:", error);
  }
}
