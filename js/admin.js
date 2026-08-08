// Generate random token
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 20; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Check if token exists
function isTokenExists(token, callback) {
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].token === token) {
                    callback(true);
                    return;
                }
            }
        }
        callback(false);
    });
}

// Generate unique token
function generateUniqueToken(callback) {
    let token;
    let attempts = 0;
    function checkToken() {
        token = generateToken();
        isTokenExists(token, function(exists) {
            if (!exists || attempts > 100) {
                callback(token);
            } else {
                attempts++;
                checkToken();
            }
        });
    }
    checkToken();
}

// Show management tabs
function showManagementTab(tab) {
    // Update tab buttons
    const buttons = document.querySelectorAll('.tabs .tab-btn');
    buttons.forEach(function(btn) { btn.classList.remove('active'); });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const content = document.getElementById('management-content');
    if (!content) return;
    
    switch(tab) {
        case 'accounts':
            showAccounts(content);
            break;
        case 'create-account':
            showCreateAccount(content);
            break;
        case 'logs':
            showLogs(content);
            break;
        case 'create-card':
            showCreateCard(content);
            break;
        case 'create-giftcode':
            showCreateGiftCode(content);
            break;
        case 'ban-account':
            showBanAccount(content);
            break;
    }
}

// Show accounts
function showAccounts(content) {
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        let usersHTML = '';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Separate users by role
            const admins = [];
            const usersList = [];
            
            for (let key in users) {
                const user = { ...users[key], id: key };
                if (user.role === 'owner') continue;
                else if (user.role === 'admin') admins.push(user);
                else usersList.push(user);
            }
            
            // Users table
            usersHTML += `
                <h3>Quản lí tài khoản user</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên tài khoản</th>
                                <th>Trạng Thái</th>
                                <th>Onyx</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            usersList.forEach(function(user) {
                const statusClass = user.banned && user.banned.until > Date.now() ? 'status-banned' : 
                                   user.status === 'online' ? 'status-online' : 'status-offline';
                const statusText = user.banned && user.banned.until > Date.now() ? 'Bị cấm' :
                                  user.status === 'online' ? 'Online' : 'Offline';
                usersHTML += `
                    <tr>
                        <td>${user.username}</td>
                        <td class="${statusClass}">${statusText}</td>
                        <td>${user.onyx || 0}</td>
                    </tr>
                `;
            });
            
            usersHTML += `
                        </tbody>
                    </table>
                </div>
                <h3 style="margin-top: 30px;">Quản lí tài khoản admin</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên tài khoản</th>
                                <th>Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            admins.forEach(function(user) {
                const statusClass = user.banned && user.banned.until > Date.now() ? 'status-banned' : 
                                   user.status === 'online' ? 'status-online' : 'status-offline';
                const statusText = user.banned && user.banned.until > Date.now() ? 'Bị cấm' :
                                  user.status === 'online' ? 'Online' : 'Offline';
                usersHTML += `
                    <tr>
                        <td>${user.username}</td>
                        <td class="${statusClass}">${statusText}</td>
                    </tr>
                `;
            });
            
            usersHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        content.innerHTML = usersHTML;
    });
}

// Show create account
function showCreateAccount(content) {
    const isOwner = currentUser.role === 'owner';
    const isAdmin = currentUser.role === 'admin';
    
    let roleOptions = '';
    if (isOwner) {
        roleOptions = `
            <option value="admin">Admin</option>
            <option value="user">User</option>
        `;
    } else if (isAdmin) {
        roleOptions = `
            <option value="user">User</option>
        `;
    }
    
    content.innerHTML = `
        <h3>Tạo tài khoản</h3>
        <div class="form-group">
            <label>Loại tài khoản:</label>
            <select id="account-role">
                ${roleOptions}
            </select>
        </div>
        <div class="form-group">
            <label>Tên đăng nhập:</label>
            <input type="text" id="new-username" placeholder="Nhập tên đăng nhập">
        </div>
        <div class="form-group">
            <label>Mật khẩu:</label>
            <input type="text" id="new-password" placeholder="Nhập mật khẩu">
        </div>
        <button onclick="createAccount()" class="btn btn-primary">Tạo</button>
        <div id="new-token-display" style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 5px; display: none;">
            <strong>Token tài khoản:</strong>
            <span id="new-token-text"></span>
        </div>
    `;
}

// Create account
function createAccount() {
    const role = document.getElementById('account-role').value;
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    
    if (!username || !password) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    // Check if username exists
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].username === username) {
                    alert('Tên đăng nhập đã tồn tại');
                    return;
                }
            }
        }
        
        // Generate unique token
        generateUniqueToken(function(token) {
            // Create account
            const newUserRef = db.ref('users').push();
            newUserRef.set({
                username: username,
                password: password,
                role: role,
                token: token,
                status: 'offline',
                xu: 0,
                onyx: 0,
                created: Date.now()
            }).then(function() {
                // Show token
                document.getElementById('new-token-display').style.display = 'block';
                document.getElementById('new-token-text').textContent = token;
                alert('Tạo tài khoản ' + username + ' thành công!');
            });
        });
    });
}

// Show logs (Owner only)
function showLogs(content) {
    if (currentUser.role !== 'owner') {
        content.innerHTML = '<p>Bạn không có quyền truy cập</p>';
        return;
    }
    
    const logsRef = db.ref('logs');
    logsRef.once('value', function(snapshot) {
        let logsHTML = '<h3>Lịch sử hoạt động</h3>';
        logsHTML += '<p><em>Chức năng Log đang được phát triển</em></p>';
        content.innerHTML = logsHTML;
    });
}

// Show create card
function showCreateCard(content) {
    content.innerHTML = `
        <h3>Tạo thẻ Onyx</h3>
        <div class="form-group">
            <label>Mệnh giá:</label>
            <select id="card-value">
                <option value="10000">10.000đ</option>
                <option value="20000">20.000đ</option>
                <option value="50000">50.000đ</option>
                <option value="100000">100.000đ</option>
                <option value="200000">200.000đ</option>
                <option value="500000">500.000đ</option>
            </select>
        </div>
        <button onclick="createCard()" class="btn btn-primary">Tạo thẻ</button>
        <div id="card-result" style="margin-top: 20px; display: none;"></div>
        
        <h3 style="margin-top: 30px;">Lịch sử thẻ</h3>
        <div id="card-history"></div>
    `;
    
    loadCardHistory();
}

// Create card
function createCard() {
    const value = parseInt(document.getElementById('card-value').value);
    
    // Generate card code
    let cardCode = '';
    for (let i = 0; i < 16; i++) {
        cardCode += Math.floor(Math.random() * 10);
    }
    
    const cardRef = db.ref('cards').push();
    cardRef.set({
        code: cardCode,
        value: value,
        created: Date.now(),
        expiry: Date.now() + (24 * 60 * 60 * 1000),
        used: false,
        usedBy: null,
        usedAt: null,
        status: 'active'
    }).then(function() {
        // Show result
        const resultDiv = document.getElementById('card-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="padding: 15px; background: #f0fff4; border: 1px solid #48bb78; border-radius: 5px;">
                <p><strong>✅ Tạo thẻ thành công</strong></p>
                <p>Thẻ Onyx mệnh giá: ${value.toLocaleString()}đ</p>
                <p>Mã thẻ: <strong>${cardCode}</strong></p>
                <p>Thời gian còn lại: 24 giờ</p>
            </div>
        `;
        
        loadCardHistory();
    });
}

// Load card history
function loadCardHistory() {
    const cardsRef = db.ref('cards');
    cardsRef.once('value', function(snapshot) {
        let cardsHTML = '';
        
        if (snapshot.exists()) {
            const cards = snapshot.val();
            const cardList = [];
            
            for (let key in cards) {
                const card = { ...cards[key], id: key };
                cardList.push(card);
            }
            
            // Sort: active cards first
            cardList.sort(function(a, b) {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return 0;
            });
            
            cardsHTML = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã thẻ</th>
                                <th>Mệnh giá</th>
                                <th>Trạng thái</th>
                                <th>Người dùng</th>
                                <th>Hạn sử dụng</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            cardList.forEach(function(card) {
                let statusText = 'Chưa sử dụng';
                let statusColor = '#48bb78';
                
                if (card.used) {
                    statusText = 'Đã sử dụng';
                    statusColor = '#a0aec0';
                } else if (card.expiry < Date.now()) {
                    statusText = 'Hết hạn';
                    statusColor = '#f56565';
                }
                
                cardsHTML += `
                    <tr>
                        <td><code>${card.code}</code></td>
                        <td>${card.value.toLocaleString()}đ</td>
                        <td style="color: ${statusColor};">${statusText}</td>
                        <td>${card.usedBy || '-'}</td>
                        <td>${new Date(card.expiry).toLocaleString()}</td>
                    </tr>
                `;
            });
            
            cardsHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            cardsHTML = '<p>Chưa có thẻ nào được tạo</p>';
        }
        
        document.getElementById('card-history').innerHTML = cardsHTML;
    });
}

// Show create giftcode
function showCreateGiftCode(content) {
    content.innerHTML = `
        <div class="tabs" style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            <button class="tab-btn active" onclick="showGiftCodeTab('normal')">Giftcode bất kì</button>
            <button class="tab-btn" onclick="showGiftCodeTab('permanent')">Giftcode vĩnh viễn</button>
        </div>
        <div id="giftcode-content">
            ${getNormalGiftCodeHTML()}
        </div>
    `;
}

// Show giftcode tab
function showGiftCodeTab(tab) {
    const buttons = document.querySelectorAll('#giftcode-content ~ .tab-btn');
    buttons.forEach(function(btn) { btn.classList.remove('active'); });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const content = document.getElementById('giftcode-content');
    if (tab === 'normal') {
        content.innerHTML = getNormalGiftCodeHTML();
    } else {
        content.innerHTML = getPermanentGiftCodeHTML();
    }
}

// Get normal giftcode HTML
function getNormalGiftCodeHTML() {
    return `
        <div style="margin-top: 20px;">
            <button onclick="createRandomGiftCode()" class="btn btn-primary">Tạo giftcode</button>
            <div id="giftcode-result" style="margin-top: 20px;"></div>
        </div>
    `;
}

// Get permanent giftcode HTML
function getPermanentGiftCodeHTML() {
    return `
        <div style="margin-top: 20px;">
            <div class="form-group">
                <label>Phần thưởng:</label>
                <select id="giftcode-reward">
                    <option value="xu">Xu</option>
                    <option value="onyx">Onyx</option>
                </select>
            </div>
            <div class="form-group">
                <label>Số lượng:</label>
                <input type="number" id="giftcode-amount" value="100" min="1">
            </div>
            <div class="form-group">
                <label>Tên giftcode (BLACK= + 7 ký tự):</label>
                <input type="text" id="giftcode-name" placeholder="BLACK=abc1234">
            </div>
            <button onclick="createPermanentGiftCode()" class="btn btn-primary">Tạo giftcode</button>
            <div id="giftcode-permanent-result" style="margin-top: 20px;"></div>
        </div>
    `;
}

// Create random giftcode
function createRandomGiftCode() {
    // Generate random code
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = 'BLACK=';
    for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Random rewards with probabilities
    const rewards = [
        { type: 'xu', amount: 100, prob: 0.75 },
        { type: 'xu', amount: 200, prob: 0.75 },
        { type: 'xu', amount: 500, prob: 0.50 },
        { type: 'xu', amount: 10000, prob: 0.42 },
        { type: 'xu', amount: 50000, prob: 0.15 },
        { type: 'onyx', amount: 100, prob: 0.10 },
        { type: 'onyx', amount: 200, prob: 0.08 },
        { type: 'onyx', amount: 10000, prob: 0.02 },
        { type: 'onyx', amount: 50000, prob: 0.00004 }
    ];
    
    let selected = rewards[0];
    let rand = Math.random();
    let cumulative = 0;
    for (var i = 0; i < rewards.length; i++) {
        cumulative += rewards[i].prob;
        if (rand <= cumulative) {
            selected = rewards[i];
            break;
        }
    }
    
    const giftRef = db.ref('giftcodes').push();
    giftRef.set({
        code: code,
        type: 'normal',
        rewardType: selected.type,
        rewardAmount: selected.amount,
        created: Date.now(),
        expiry: Date.now() + (48 * 60 * 60 * 1000),
        used: false,
        usedBy: null,
        permanent: false
    }).then(function() {
        document.getElementById('giftcode-result').innerHTML = `
            <div style="padding: 15px; background: #f0fff4; border: 1px solid #48bb78; border-radius: 5px;">
                <p><strong>✅ Tạo giftcode thành công</strong></p>
                <p>Mã giftcode: <strong>${code}</strong></p>
                <p>Phần thưởng: ${selected.amount} ${selected.type}</p>
                <p>Hạn sử dụng: 48 giờ</p>
            </div>
        `;
    });
}

// Create permanent giftcode
function createPermanentGiftCode() {
    const reward = document.getElementById('giftcode-reward').value;
    const amount = parseInt(document.getElementById('giftcode-amount').value);
    const name = document.getElementById('giftcode-name').value;
    
    if (!name || !name.startsWith('BLACK=') || name.length !== 12) {
        alert('Tên giftcode phải có dạng BLACK= + 7 ký tự');
        return;
    }
    
    if (!amount || amount < 1) {
        alert('Vui lòng nhập số lượng hợp lệ');
        return;
    }
    
    // Check if code exists
    const giftRef = db.ref('giftcodes');
    giftRef.once('value', function(snapshot) {
        if (snapshot.exists()) {
            const gifts = snapshot.val();
            for (let key in gifts) {
                if (gifts[key].code === name) {
                    alert('Mã giftcode đã tồn tại');
                    return;
                }
            }
        }
        
        const newGiftRef = db.ref('giftcodes').push();
        newGiftRef.set({
            code: name,
            type: 'permanent',
            rewardType: reward,
            rewardAmount: amount,
            created: Date.now(),
            expiry: null,
            used: false,
            usedBy: null,
            permanent: true,
            usedCount: 0
        }).then(function() {
            document.getElementById('giftcode-permanent-result').innerHTML = `
                <div style="padding: 15px; background: #f0fff4; border: 1px solid #48bb78; border-radius: 5px;">
                    <p><strong>✅ Tạo giftcode vĩnh viễn thành công</strong></p>
                    <p>Mã giftcode: <strong>${name}</strong></p>
                    <p>Phần thưởng: ${amount} ${reward}</p>
                    <p>Hạn sử dụng: Vĩnh viễn</p>
                </div>
            `;
        });
    });
}

// Show ban account
function showBanAccount(content) {
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        let userOptions = '';
        let bannedList = '';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Build user options for banning
            for (let key in users) {
                const user = users[key];
                if (user.username !== currentUser.username) {
                    userOptions += `<option value="${key}">${user.username} (${user.role})</option>`;
                }
            }
            
            // Build banned list
            bannedList = `
                <h3 style="margin-top: 30px;">Danh sách cấm</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tên</th>
                                <th>Thời gian cấm</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (let key in users) {
                const user = users[key];
                if (user.banned && user.banned.until > Date.now()) {
                    const remaining = user.banned.until - Date.now();
                    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                    const timeStr = days + 'd ' + hours + 'h ' + minutes + 'm';
                    
                    bannedList += `
                        <tr>
                            <td>${user.username}</td>
                            <td>${timeStr}</td>
                            <td><button onclick="unbanAccount('${key}')" class="btn btn-primary" style="padding: 5px 10px;">Mở khóa</button></td>
                        </tr>
                    `;
                }
            }
            
            bannedList += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        content.innerHTML = `
            <h3>Cấm tài khoản</h3>
            <div class="form-group">
                <label>Tài khoản bị cấm:</label>
                <select id="ban-user">
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Token:</label>
                <input type="text" id="ban-token" placeholder="Nhập token của tài khoản bị cấm">
            </div>
            <div class="form-group">
                <label>Tài khoản cấm:</label>
                <input type="text" id="ban-by" value="${currentUser.username}" readonly>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Giây:</label>
                    <input type="number" id="ban-seconds" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Phút:</label>
                    <input type="number" id="ban-minutes" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Giờ:</label>
                    <input type="number" id="ban-hours" value="0" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Ngày:</label>
                    <input type="number" id="ban-days" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Năm:</label>
                    <input type="number" id="ban-years" value="0" min="0">
                </div>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="ban-permanent">
                <label for="ban-permanent">Vĩnh Viễn</label>
            </div>
            <div class="reason-group">
                <label><strong>Lí do cấm:</strong></label>
                <div class="reason-item">
                    <input type="radio" name="ban-reason" value="Dùng APK, phần mềm thứ 3, code độc hại">
                    <label>Dùng APK, phần mềm thứ 3, code độc hại (Cấm 3 năm)</label>
                </div>
                <div class="reason-item">
                    <input type="radio" name="ban-reason" value="Hack mã thẻ, Hack Giftcode, Hack tỉ lệ">
                    <label>Hack mã thẻ, Hack Giftcode, Hack tỉ lệ (Cấm 3 năm)</label>
                </div>
                <div class="reason-item">
                    <input type="radio" name="ban-reason" value="Hack những game có trong web để kiếm xu">
                    <label>Hack những game có trong web để kiếm xu (Cấm 1 tuần)</label>
                </div>
                <div class="reason-item">
                    <input type="radio" name="ban-reason" value="Hack xu, hack Onyx">
                    <label>Hack xu, hack Onyx (Cấm 1 tuần)</label>
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <label>Lí do khác:</label>
                    <input type="text" id="ban-other-reason" placeholder="Nhập lí do khác">
                </div>
            </div>
            <button onclick="banAccount()" class="btn btn-danger">Cấm</button>
            ${bannedList}
        `;
    });
}

// Ban account
function banAccount() {
    const userId = document.getElementById('ban-user').value;
    const token = document.getElementById('ban-token').value;
    const seconds = parseInt(document.getElementById('ban-seconds').value) || 0;
    const minutes = parseInt(document.getElementById('ban-minutes').value) || 0;
    const hours = parseInt(document.getElementById('ban-hours').value) || 0;
    const days = parseInt(document.getElementById('ban-days').value) || 0;
    const years = parseInt(document.getElementById('ban-years').value) || 0;
    const permanent = document.getElementById('ban-permanent').checked;
    
    var reasonEl = document.querySelector('input[name="ban-reason"]:checked');
    const otherReason = document.getElementById('ban-other-reason').value;
    
    var reason = reasonEl ? reasonEl.value : '';
    if (otherReason) {
        reason = otherReason;
    }
    
    if (!reason) {
        alert('Vui lòng chọn hoặc nhập lí do cấm');
        return;
    }
    
    if (!userId) {
        alert('Vui lòng chọn tài khoản bị cấm');
        return;
    }
    
    // Verify token
    db.ref('users/' + userId).once('value', function(snapshot) {
        if (!snapshot.exists()) {
            alert('Tài khoản không tồn tại');
            return;
        }
        
        const user = snapshot.val();
        if (user.token !== token) {
            alert('Token không khớp với tài khoản');
            return;
        }
        
        // Check permission
        if (currentUser.role === 'admin' && user.role !== 'user') {
            alert('Admin chỉ có thể cấm tài khoản User');
            return;
        }
        
        // Calculate ban duration
        var duration = 0;
        if (permanent) {
            duration = 100 * 365 * 24 * 60 * 60 * 1000;
        } else {
            duration = 
                seconds * 1000 +
                minutes * 60 * 1000 +
                hours * 60 * 60 * 1000 +
                days * 24 * 60 * 60 * 1000 +
                years * 365 * 24 * 60 * 60 * 1000;
        }
        
        if (duration === 0 && !permanent) {
            alert('Vui lòng chọn thời gian cấm hoặc chọn Vĩnh Viễn');
            return;
        }
        
        // Apply ban
        db.ref('users/' + userId).update({
            banned: {
                reason: reason,
                until: Date.now() + duration,
                bannedBy: currentUser.username,
                bannedAt: Date.now()
            },
            status: 'banned'
        }).then(function() {
            alert('Đã cấm tài khoản ' + user.username + ' thành công!');
            showManagementTab('ban-account');
        });
    });
}

// Unban account
function unbanAccount(userId) {
    if (!confirm('Bạn có chắc muốn mở khóa tài khoản này?')) return;
    
    db.ref('users/' + userId).update({
        banned: null,
        status: 'offline'
    }).then(function() {
        alert('Mở khóa tài khoản thành công!');
        showManagementTab('ban-account');
    });
}

// Redeem card
function redeemCard() {
    const cardCode = document.getElementById('card-code').value;
    
    if (!cardCode || cardCode.length !== 16) {
        alert('Vui lòng nhập mã thẻ hợp lệ (16 số)');
        return;
    }
    
    const cardsRef = db.ref('cards');
    cardsRef.once('value', function(snapshot) {
        var found = false;
        
        if (snapshot.exists()) {
            const cards = snapshot.val();
            for (let key in cards) {
                const card = cards[key];
                if (card.code === cardCode) {
                    found = true;
                    
                    // Check if card is valid
                    if (card.used) {
                        alert('Thẻ đã được sử dụng');
                        return;
                    }
                    
                    if (card.expiry < Date.now()) {
                        alert('Thẻ đã hết hạn');
                        return;
                    }
                    
                    // Calculate Onyx
                    const onyxMap = {
                        10000: 20,
                        20000: 40,
                        50000: 102,
                        100000: 204,
                        200000: 408,
                        500000: 1020
                    };
                    
                    const onyxAmount = onyxMap[card.value] || 0;
                    
                    // Update user's Onyx
                    db.ref('users/' + currentUser.id).once('value', function(userSnapshot) {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const currentOnyx = userData.onyx || 0;
                            db.ref('users/' + currentUser.id).update({
                                onyx: currentOnyx + onyxAmount
                            });
                        }
                    });
                    
                    // Mark card as used
                    db.ref('cards/' + key).update({
                        used: true,
                        usedBy: currentUser.username,
                        usedAt: Date.now(),
                        status: 'used'
                    }).then(function() {
                        alert('Nạp thẻ thành công! Bạn nhận được ' + onyxAmount + ' Onyx');
                        closeModal('redeem-modal');
                    });
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Vui lòng nhập thông tin thẻ chính xác');
        }
    });
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Show redeem card modal
function showRedeemCard() {
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

// Redeem giftcode
function redeemGiftCode(code) {
    if (!code) {
        code = prompt('Nhập mã giftcode:');
        if (!code) return;
    }
    
    const giftsRef = db.ref('giftcodes');
    giftsRef.once('value', function(snapshot) {
        var found = false;
        
        if (snapshot.exists()) {
            const gifts = snapshot.val();
            for (let key in gifts) {
                const gift = gifts[key];
                if (gift.code === code) {
                    found = true;
                    
                    // Check if used (for non-permanent)
                    if (!gift.permanent) {
                        if (gift.used) {
                            alert('Giftcode đã được sử dụng');
                            return;
                        }
                        if (gift.expiry && gift.expiry < Date.now()) {
                            alert('Giftcode đã hết hạn');
                            return;
                        }
                    } else {
                        // Check if user already used this permanent code
                        if (gift.usedBy && gift.usedBy.includes(currentUser.id)) {
                            alert('Bạn đã sử dụng giftcode này rồi');
                            return;
                        }
                    }
                    
                    // Apply reward
                    db.ref('users/' + currentUser.id).once('value', function(userSnapshot) {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const field = gift.rewardType === 'xu' ? 'xu' : 'onyx';
                            const currentAmount = userData[field] || 0;
                            db.ref('users/' + currentUser.id).update({
                                [field]: currentAmount + gift.rewardAmount
                            });
                        }
                    });
                    
                    // Update giftcode
                    if (gift.permanent) {
                        var usedBy = gift.usedBy || [];
                        usedBy.push(currentUser.id);
                        db.ref('giftcodes/' + key).update({
                            usedBy: usedBy,
                            usedCount: (gift.usedCount || 0) + 1
                        });
                    } else {
                        db.ref('giftcodes/' + key).update({
                            used: true,
                            usedBy: currentUser.username,
                            usedAt: Date.now()
                        });
                    }
                    
                    alert('Nhận giftcode thành công! Bạn nhận được ' + gift.rewardAmount + ' ' + gift.rewardType);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Mã giftcode không hợp lệ');
        }
    });
}
