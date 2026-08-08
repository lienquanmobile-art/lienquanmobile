// Show dashboard
function showDashboard(user) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('token-login-form').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('current-user').textContent = user.username;
    
    // Set badge
    const badge = document.getElementById('user-role');
    badge.textContent = user.role.toUpperCase();
    badge.className = 'badge badge-' + user.role;
    
    // Show management tab based on role
    if (user.role === 'owner' || user.role === 'admin') {
        document.getElementById('management-tab').style.display = 'inline-block';
    }
    
    // Load home page by default
    showPage('home');
}

// Show page
function showPage(page) {
    const content = document.getElementById('content');
    
    switch(page) {
        case 'home':
            showHomePage(content);
            break;
        case 'management':
            showManagementPage(content);
            break;
        case 'settings':
            showSettingsPage(content);
            break;
        default:
            content.innerHTML = '<div class="page-content"><h2>Trang không tồn tại</h2></div>';
    }
}

// Show home page
function showHomePage(content) {
    const user = currentUser;
    let resourcesHTML = '';
    
    // Only show resources for USER role
    if (user.role === 'user') {
        db.ref('users/' + user.id).once('value', function(snapshot) {
            if (snapshot.exists()) {
                const data = snapshot.val();
                document.getElementById('user-xu').textContent = data.xu || 0;
                document.getElementById('user-onyx').textContent = data.onyx || 0;
            }
        });
        
        resourcesHTML = `
            <div class="resources">
                <div class="resource-item">
                    <span class="icon">💰</span>
                    <span>Xu: <span id="user-xu">0</span></span>
                </div>
                <div class="resource-item">
                    <span class="icon">💎</span>
                    <span>Onyx: <span id="user-onyx">0</span></span>
                    <button class="plus-btn" onclick="showRedeemCard()">+</button>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="page-content">
            <h2>🏠 Trang Chủ</h2>
            ${resourcesHTML}
            <div class="tabs">
                <button class="tab-btn active" onclick="showGameTab()">🎮 Game kiếm xu</button>
            </div>
            <div id="game-tab-content">
                <div class="game-container">
                    <div class="game-box" id="game-box" onclick="startSnakeGame()">
                        <h2>SNAKE</h2>
                    </div>
                    <div id="game-play-area" style="display:none;">
                        <div class="score-display">
                            <span>Điểm: <span id="snake-score">0</span></span>
                            <span>Xu: <span id="snake-xu">0</span></span>
                        </div>
                        <canvas id="snake-canvas" width="450" height="450"></canvas>
                        <div class="game-controls">
                            <button onclick="startGame()" class="btn btn-primary" id="start-btn">Bắt đầu</button>
                            <button onclick="resetGame()" class="btn btn-danger">Reset</button>
                            <button onclick="backToMenu()" class="btn btn-secondary">Quay lại</button>
                        </div>
                        <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                            <button onclick="changeDirection('up')" class="btn btn-secondary" style="width:auto; padding:8px 16px;">↑</button>
                            <button onclick="changeDirection('down')" class="btn btn-secondary" style="width:auto; padding:8px 16px;">↓</button>
                            <button onclick="changeDirection('left')" class="btn btn-secondary" style="width:auto; padding:8px 16px;">←</button>
                            <button onclick="changeDirection('right')" class="btn btn-secondary" style="width:auto; padding:8px 16px;">→</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show game tab
function showGameTab() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Start snake game
function startSnakeGame() {
    document.getElementById('game-box').style.display = 'none';
    document.getElementById('game-play-area').style.display = 'block';
    initSnakeGame();
}

// Back to menu
function backToMenu() {
    document.getElementById('game-box').style.display = 'flex';
    document.getElementById('game-play-area').style.display = 'none';
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    gameRunning = false;
}

// Show management page
function showManagementPage(content) {
    const user = currentUser;
    const isOwner = user.role === 'owner';
    
    let tabsHTML = `
        <div class="tabs">
            <button class="tab-btn active" onclick="showManagementTab('accounts')">📋 Tài Khoản</button>
            <button class="tab-btn" onclick="showManagementTab('create-account')">➕ Tạo tài khoản</button>
    `;
    
    if (isOwner) {
        tabsHTML += `<button class="tab-btn" onclick="showManagementTab('logs')">📜 Log</button>`;
    }
    
    tabsHTML += `
            <button class="tab-btn" onclick="showManagementTab('create-card')">💳 Tạo thẻ</button>
            <button class="tab-btn" onclick="showManagementTab('create-giftcode')">🎁 Tạo giftcode</button>
            <button class="tab-btn" onclick="showManagementTab('ban-account')">🚫 Cấm tài khoản</button>
        </div>
        <div id="management-content">
            <p>Đang tải...</p>
        </div>
    `;
    
    content.innerHTML = `
        <div class="page-content">
            <h2>⚙️ Quản Lý</h2>
            ${tabsHTML}
        </div>
    `;
    
    showManagementTab('accounts');
}

// Show settings page
function showSettingsPage(content) {
    content.innerHTML = `
        <div class="page-content">
            <h2>🔧 Cài Đặt</h2>
            
            <div class="settings-card">
                <h3>🔑 Đổi Mật Khẩu</h3>
                <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn an toàn hơn.</p>
                <div class="form-group">
                    <label>Mật khẩu cũ</label>
                    <input type="password" id="old-password" placeholder="Nhập mật khẩu cũ">
                </div>
                <div class="form-group">
                    <label>Mật khẩu mới</label>
                    <input type="password" id="new-password" placeholder="Nhập mật khẩu mới">
                </div>
                <div class="form-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input type="password" id="confirm-password" placeholder="Xác nhận mật khẩu mới">
                </div>
                <button onclick="changePassword()" class="btn btn-primary" style="width:auto;">Đổi Mật Khẩu</button>
            </div>

            <div class="settings-card" style="border-color: rgba(229, 62, 62, 0.2);">
                <h3 style="color: #fc8181;">🚪 Đăng Xuất</h3>
                <p>Đăng xuất khỏi thiết bị này.</p>
                <button onclick="logout()" class="btn btn-danger" style="width:auto;">Đăng Xuất Hệ Thống</button>
            </div>
        </div>
    `;
}

// Change password
function changePassword() {
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
    
    db.ref('users/' + currentUser.id).update({
        password: newPass
    }).then(function() {
        currentUser.password = newPass;
        alert('Đổi mật khẩu thành công');
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    }).catch(function(error) {
        console.error('Change password error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    });
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        if (currentUser) {
            db.ref('users/' + currentUser.id + '/status').set('offline');
        }
        location.reload();
    }
}

// Update resources for user
function updateUserResources() {
    if (currentUser && currentUser.role === 'user') {
        db.ref('users/' + currentUser.id).on('value', function(snapshot) {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const xuEl = document.getElementById('user-xu');
                const onyxEl = document.getElementById('user-onyx');
                if (xuEl) xuEl.textContent = data.xu || 0;
                if (onyxEl) onyxEl.textContent = data.onyx || 0;
            }
        });
    }
}
