import { db, ref, set, get, push, update, remove } from './firebase-config.js';
import { currentUser, logAction } from './auth.js';

// Show dashboard
function showDashboard(user) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('token-login-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('current-user').textContent = user.username;
    document.getElementById('user-role').textContent = user.role;
    
    // Show management tab based on role
    if (user.role === 'owner' || user.role === 'admin') {
        document.getElementById('management-tab').style.display = 'inline-block';
    }
    
    // Load home page by default
    showPage('home');
}

// Show page
window.showPage = async function(page) {
    const content = document.getElementById('content');
    
    switch(page) {
        case 'home':
            await showHomePage(content);
            break;
        case 'management':
            await showManagementPage(content);
            break;
        case 'settings':
            await showSettingsPage(content);
            break;
        default:
            content.innerHTML = '<div class="page-content"><h2>Trang không tồn tại</h2></div>';
    }
}

// Show home page
async function showHomePage(content) {
    const user = currentUser;
    let resourcesHTML = '';
    
    if (user.role === 'user') {
        const userData = await getUserData(user.id);
        resourcesHTML = `
            <div class="resources">
                <div class="resource-item">
                    <span>💰 Số xu: ${userData.xu || 0}</span>
                </div>
                <div class="resource-item">
                    <span>💎 Số Onyx: ${userData.onyx || 0}</span>
                    <button class="plus-btn" onclick="showRedeemCard()">+</button>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="page-content">
            ${resourcesHTML}
            <div class="tabs">
                <button class="tab-btn active" onclick="showGame('snake')">🎮 Game kiếm xu</button>
                <!-- Future tabs here -->
            </div>
            <div id="game-container">
                <!-- Snake game will be loaded here -->
            </div>
        </div>
    `;
    
    // Load snake game
    if (typeof initSnakeGame === 'function') {
        initSnakeGame();
    }
}

// Show management page
async function showManagementPage(content) {
    const user = currentUser;
    const isOwner = user.role === 'owner';
    const isAdmin = user.role === 'admin';
    
    let tabsHTML = `
        <div class="tabs">
            <button class="tab-btn active" onclick="showManagementTab('accounts')">Tài Khoản</button>
            <button class="tab-btn" onclick="showManagementTab('create-account')">Tạo tài khoản</button>
    `;
    
    if (isOwner) {
        tabsHTML += `<button class="tab-btn" onclick="showManagementTab('logs')">Log</button>`;
    }
    
    tabsHTML += `
            <button class="tab-btn" onclick="showManagementTab('create-card')">Tạo thẻ</button>
            <button class="tab-btn" onclick="showManagementTab('create-giftcode')">Tạo giftcode</button>
            <button class="tab-btn" onclick="showManagementTab('ban-account')">Cấm tài khoản</button>
        </div>
        <div id="management-content">
            <!-- Tab content will be loaded here -->
        </div>
    `;
    
    content.innerHTML = `
        <div class="page-content">
            ${tabsHTML}
        </div>
    `;
    
    // Load accounts tab by default
    showManagementTab('accounts');
}

// Show settings page
async function showSettingsPage(content) {
    content.innerHTML = `
        <div class="page-content">
            <h2>Cài Đặt Tài Khoản</h2>
            <div class="form-group">
                <label>Mật khẩu cũ:</label>
                <input type="password" id="old-password" placeholder="Nhập mật khẩu cũ">
            </div>
            <div class="form-group">
                <label>Mật khẩu mới:</label>
                <input type="password" id="new-password" placeholder="Nhập mật khẩu mới">
            </div>
            <div class="form-group">
                <label>Xác nhận lại mật khẩu mới:</label>
                <input type="password" id="confirm-password" placeholder="Xác nhận mật khẩu mới">
            </div>
            <button onclick="changePassword()" class="btn btn-primary">Đổi mật khẩu</button>
            <hr style="margin: 20px 0;">
            <button onclick="logout()" class="btn btn-danger">Đăng xuất khỏi tài khoản</button>
        </div>
    `;
}

// Change password
window.changePassword = async function() {
    const oldPass = document.getElementById('old-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    
    if (!oldPass || !newPass || !confirmPass) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    if (newPass !== confirmPass) {
        alert('Mật khẩu mới và xác nhận không khớp');
        return;
    }
    
    if (oldPass !== currentUser.password) {
        alert('Mật khẩu cũ không đúng');
        return;
    }
    
    try {
        await update(ref(db, `users/${currentUser.id}`), {
            password: newPass
        });
        currentUser.password = newPass;
        await logAction(currentUser.id, 'password_change', 'Đã đổi mật khẩu');
        alert('Đổi mật khẩu thành công');
    } catch (error) {
        console.error('Change password error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Logout
window.logout = function() {
    if (currentUser) {
        update(ref(db, `users/${currentUser.id}/status`), 'offline');
        logAction(currentUser.id, 'logout', 'Đã đăng xuất');
    }
    location.reload();
}

// Get user data
async function getUserData(userId) {
    try {
        const snapshot = await get(ref(db, `users/${userId}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return { xu: 0, onyx: 0 };
    } catch (error) {
        console.error('Get user data error:', error);
        return { xu: 0, onyx: 0 };
    }
}

// Show redeem card modal
window.showRedeemCard = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'redeem-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nạp Onyx</h3>
                <button class="close-btn" onclick="closeModal('redeem-modal')">×</button>
            </div>
            <div class="form-group">
                <label>Mã thẻ:</label>
                <input type="text" id="card-code" placeholder="Nhập mã thẻ">
            </div>
            <button onclick="redeemCard()" class="btn btn-primary">Nạp</button>
            <div style="margin-top: 20px;">
                <h4>Bảng quy đổi:</h4>
                <ul>
                    <li>10.000đ = 20 Onyx</li>
                    <li>20.000đ = 40 Onyx</li>
                    <li>50.000đ = 102 Onyx</li>
                    <li>100.000đ = 204 Onyx</li>
                    <li>200.000đ = 408 Onyx</li>
                    <li>500.000đ = 1020 Onyx</li>
                </ul>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close modal
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

export { showDashboard };
