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
function showPage(page) {
    const content = document.getElementById('content');
    
    switch(page) {
        case 'home':
            content.innerHTML = `
                <div class="page-content">
                    <h2>🏠 Trang Chủ</h2>
                    <div class="tabs">
                        <button class="tab-btn active" onclick="showGame('snake')">🎮 Game kiếm xu</button>
                    </div>
                    <div id="game-container">
                        <div class="game-container">
                            <div class="score-display">
                                <span>Điểm: <span id="snake-score">0</span></span>
                                <span style="margin-left: 20px;">Xu: <span id="snake-xu">0</span></span>
                            </div>
                            <canvas id="snake-canvas" width="450" height="450"></canvas>
                            <div class="game-controls">
                                <button onclick="startGame()" class="btn btn-primary" id="start-btn">Bắt đầu</button>
                                <button onclick="resetGame()" class="btn btn-danger">Reset</button>
                            </div>
                            <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                                <button onclick="changeDirection('up')" class="btn btn-secondary">↑</button>
                                <button onclick="changeDirection('down')" class="btn btn-secondary">↓</button>
                                <button onclick="changeDirection('left')" class="btn btn-secondary">←</button>
                                <button onclick="changeDirection('right')" class="btn btn-secondary">→</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            initSnakeGame();
            break;
        case 'management':
            content.innerHTML = `
                <div class="page-content">
                    <h2>⚙️ Quản Lí</h2>
                    <div class="tabs">
                        <button class="tab-btn active" onclick="showManagementTab('accounts')">Tài Khoản</button>
                        <button class="tab-btn" onclick="showManagementTab('create-account')">Tạo tài khoản</button>
                        ${currentUser.role === 'owner' ? '<button class="tab-btn" onclick="showManagementTab(\'logs\')">Log</button>' : ''}
                        <button class="tab-btn" onclick="showManagementTab('create-card')">Tạo thẻ</button>
                        <button class="tab-btn" onclick="showManagementTab('create-giftcode')">Tạo giftcode</button>
                        <button class="tab-btn" onclick="showManagementTab('ban-account')">Cấm tài khoản</button>
                    </div>
                    <div id="management-content">
                        <p>Đang tải...</p>
                    </div>
                </div>
            `;
            showManagementTab('accounts');
            break;
        case 'settings':
            content.innerHTML = `
                <div class="page-content">
                    <h2>⚙️ Cài Đặt</h2>
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
            break;
        default:
            content.innerHTML = '<div class="page-content"><h2>Trang không tồn tại</h2></div>';
    }
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
    }).catch(function(error) {
        console.error('Change password error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    });
}

// Logout
function logout() {
    if (currentUser) {
        db.ref('users/' + currentUser.id + '/status').set('offline');
    }
    location.reload();
}
