// ===== Kiểm tra ban realtime =====

let banCheckInterval = null;
let banPopupShown = false;

function startBanChecker() {
  const me = getCurrentUser();
  if (!me) return;
  
  // Kiểm tra mỗi 2 giây
  if (banCheckInterval) clearInterval(banCheckInterval);
  
  banCheckInterval = setInterval(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      clearInterval(banCheckInterval);
      return;
    }
    
    // Kiểm tra xem tài khoản có bị ban không
    const ban = await checkBanStatus(currentUser.username);
    if (ban) {
      // Kiểm tra xem đã hiển thị popup chưa
      const triggerSnap = await db.ref("ban_trigger/" + keyify(currentUser.username)).get();
      if (triggerSnap.exists()) {
        showBanPopup(ban, currentUser);
        await db.ref("ban_trigger/" + keyify(currentUser.username)).remove();
      }
    }
  }, 2000);
}

function showBanPopup(ban, user) {
  if (banPopupShown) return;
  banPopupShown = true;
  
  const modal = el("div", "modal-overlay");
  modal.style.zIndex = "9999";
  
  const timeText = ban.permanent ? "VĨNH VIỄN" : fmtCountdown(ban.until - Date.now());
  
  modal.innerHTML = `
    <div class="modal-box neon-box" style="max-width: 450px; text-align: center; border-color: #ff4444; box-shadow: 0 0 30px rgba(255,68,68,0.5);">
      <h2 style="color: #ff4444; text-shadow: 0 0 20px #ff4444; font-family: 'Press Start 2P', cursive; font-size: 18px;">
        ⛔ TÀI KHOẢN ĐÃ BỊ CẤM
      </h2>
      <hr style="border-color: #ff4444; margin: 15px 0;">
      <p style="color: #ff8888; font-size: 15px;">
        Tài khoản <b style="color: #ff4444;">${user.username}</b> của bạn đã bị cấm
      </p>
      <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; border-radius: 6px; padding: 12px; margin: 12px 0;">
        <p style="color: #ffaa00; font-size: 14px;"><b>Lý do:</b> ${ban.reason}</p>
        <p style="color: #ffaa00; font-size: 14px;"><b>Thời gian cấm:</b> ${timeText}</p>
        <p style="color: #ffaa00; font-size: 12px;"><b>Người cấm:</b> ${ban.by}</p>
      </div>
      <p style="color: #888; font-size: 12px;">
        ${ban.permanent ? "Tài khoản đã bị cấm vĩnh viễn" : "Vui lòng đợi hết thời gian cấm để đăng nhập lại"}
      </p>
      <button class="neon-btn danger" id="banPopupLogout" style="margin-top: 15px; width: 100%;">
        ĐĂNG XUẤT NGAY
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector("#banPopupLogout").onclick = async () => {
    const me = getCurrentUser();
    if (me) {
      await logoutUser(me.username);
    }
    banPopupShown = false;
    modal.remove();
    goToLogin();
  };
  
  // Không cho phép tắt bằng click ra ngoài
  modal.onclick = (e) => {
    if (e.target === modal) return;
  };
}

// Hàm kiểm tra ban khi refresh
async function checkBanOnLoad() {
  const savedUsername = localStorage.getItem("currentUser");
  if (savedUsername) {
    const ban = await checkBanStatus(savedUsername);
    if (ban) {
      localStorage.removeItem("currentUser");
      const user = await getUser(savedUsername);
      if (user) {
        showBanPopup(ban, user);
      }
    }
  }
}
