import { db, ref, set, get, push, update, remove, query, orderByChild, equalTo } from './firebase-config.js';
import { currentUser, logAction } from './auth.js';

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
async function isTokenExists(token) {
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].token === token) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Check token error:', error);
        return true;
    }
}

// Generate unique token
async function generateUniqueToken() {
    let token;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 100) {
        token = generateToken();
        exists = await isTokenExists(token);
        attempts++;
    }
    return token;
}

// Show management tabs
window.showManagementTab = async function(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('management-content');
    if (!content) return;
    
    switch(tab) {
        case 'accounts':
            await showAccounts(content);
            break;
        case 'create-account':
            await showCreateAccount(content);
            break;
        case 'logs':
            await showLogs(content);
            break;
        case 'create-card':
            await showCreateCard(content);
            break;
        case 'create-giftcode':
            await showCreateGiftCode(content);
            break;
        case 'ban-account':
            await showBanAccount(content);
            break;
    }
}

// Show accounts
async function showAccounts(content) {
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        let usersHTML = '';
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            // Separate users by role
            const owners = [];
            const admins = [];
            const usersList = [];
            
            for (let key in users) {
                const user = { ...users[key], id: key };
                if (user.role === 'owner') owners.push(user);
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
            
            usersList.forEach(user => {
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
            
            admins.forEach(user => {
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
    } catch (error) {
        console.error('Show accounts error:', error);
        content.innerHTML = '<p>Có lỗi xảy ra khi tải danh sách tài khoản</p>';
    }
}

// Show create account
async function showCreateAccount(content) {
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
window.createAccount = async function() {
    const role = document.getElementById('account-role').value;
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    
    if (!username || !password) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    // Check if username exists
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
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
        const token = await generateUniqueToken();
        
        // Create account
        const newUserRef = push(ref(db, 'users'));
        await set(newUserRef, {
            username: username,
            password: password,
            role: role,
            token: token,
            status: 'offline',
            xu: 0,
            onyx: 0,
            created: Date.now()
        });
        
        // Log
        await logAction(currentUser.id, 'create_account', `Đã tạo tài khoản ${username} (${role})`);
        
        // Show token
        document.getElementById('new-token-display').style.display = 'block';
        document.getElementById('new-token-text').textContent = token;
        
        alert(`Tạo tài khoản ${username} thành công!`);
        
    } catch (error) {
        console.error('Create account error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Show logs (Owner only)
async function showLogs(content) {
    if (currentUser.role !== 'owner') {
        content.innerHTML = '<p>Bạn không có quyền truy cập</p>';
        return;
    }
    
    try {
        const logsRef = ref(db, 'logs');
        const snapshot = await get(logsRef);
        let logsHTML = '<h3>Lịch sử hoạt động</h3>';
        
        if (snapshot.exists()) {
            const logs = snapshot.val();
            const allLogs = [];
            
            for (let userId in logs) {
                for (let logId in logs[userId]) {
                    const log = logs[userId][logId];
                    // Get user info
                    const userSnapshot = await get(ref(db, `users/${userId}`));
                    if (userSnapshot.exists()) {
                        const user = userSnapshot.val();
                        allLogs.push({
                            ...log,
                            username: user.username,
                            role: user.role
                        });
                    }
                }
            }
            
            // Sort by timestamp descending
            allLogs.sort((a, b) => b.timestamp - a.timestamp);
            
            logsHTML += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Tài khoản</th>
                                <th>Hành động</th>
                                <th>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            allLogs.forEach(log => {
                const date = new Date(log.timestamp);
                logsHTML += `
                    <tr>
                        <td>${log.username} (${log.role})</td>
                        <td>${log.details}</td>
                        <td>${date.toLocaleString()}</td>
                    </tr>
                `;
            });
            
            logsHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            logsHTML += '<p>Chưa có hoạt động nào</p>';
        }
        
        // Show tokens
        logsHTML += `
            <h3 style="margin-top: 30px;">Danh sách Token</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tài khoản</th>
                            <th>Token</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const usersRef = ref(db, 'users');
        const usersSnapshot = await get(usersRef);
        if (usersSnapshot.exists()) {
            const users = usersSnapshot.val();
            for (let key in users) {
                logsHTML += `
                    <tr>
                        <td>${users[key].username}</td>
                        <td><code>${users[key].token}</code></td>
                    </tr>
                `;
            }
        }
        
        logsHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        content.innerHTML = logsHTML;
    } catch (error) {
        console.error('Show logs error:', error);
        content.innerHTML = '<p>Có lỗi xảy ra khi tải logs</p>';
    }
}

// Show create card
async function showCreateCard(content) {
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
    
    // Load card history
    await loadCardHistory();
}

// Create card
window.createCard = async function() {
    const value = parseInt(document.getElementById('card-value').value);
    
    // Generate card code
    let cardCode = '';
    for (let i = 0; i < 16; i++) {
        cardCode += Math.floor(Math.random() * 10);
    }
    
    try {
        const cardRef = push(ref(db, 'cards'));
        await set(cardRef, {
            code: cardCode,
            value: value,
            created: Date.now(),
            expiry: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            used: false,
            usedBy: null,
            usedAt: null,
            status: 'active'
        });
        
        // Log
        await logAction(currentUser.id, 'create_card', `Đã tạo thẻ Onyx ${value.toLocaleString()}đ - Mã: ${cardCode}`);
        
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
        
        // Reload card history
        await loadCardHistory();
    } catch (error) {
        console.error('Create card error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Load card history
async function loadCardHistory() {
    try {
        const cardsRef = ref(db, 'cards');
        const snapshot = await get(cardsRef);
        let cardsHTML = '';
        
        if (snapshot.exists()) {
            const cards = snapshot.val();
            const cardList = [];
            
            for (let key in cards) {
                const card = { ...cards[key], id: key };
                cardList.push(card);
            }
            
            // Sort: active cards first, then expired/used
            cardList.sort((a, b) => {
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
            
            cardList.forEach(card => {
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
    } catch (error) {
        console.error('Load card history error:', error);
    }
}

// Show create giftcode
async function showCreateGiftCode(content) {
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
window.showGiftCodeTab = function(tab) {
    document.querySelectorAll('#giftcode-content ~ .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
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
window.createRandomGiftCode = async function() {
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
    for (let reward of rewards) {
        cumulative += reward.prob;
        if (rand <= cumulative) {
            selected = reward;
            break;
        }
    }
    
    try {
        const giftRef = push(ref(db, 'giftcodes'));
        await set(giftRef, {
            code: code,
            type: 'normal',
            rewardType: selected.type,
            rewardAmount: selected.amount,
            created: Date.now(),
            expiry: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
            used: false,
            usedBy: null,
            permanent: false
        });
        
        // Log
        await logAction(currentUser.id, 'create_giftcode', `Đã tạo giftcode ${code} (${selected.amount} ${selected.type})`);
        
        document.getElementById('giftcode-result').innerHTML = `
            <div style="padding: 15px; background: #f0fff4; border: 1px solid #48bb78; border-radius: 5px;">
                <p><strong>✅ Tạo giftcode thành công</strong></p>
                <p>Mã giftcode: <strong>${code}</strong></p>
                <p>Phần thưởng: ${selected.amount} ${selected.type}</p>
                <p>Hạn sử dụng: 48 giờ</p>
            </div>
        `;
    } catch (error) {
        console.error('Create giftcode error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Create permanent giftcode
window.createPermanentGiftCode = async function() {
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
    
    try {
        // Check if code exists
        const giftRef = ref(db, 'giftcodes');
        const snapshot = await get(giftRef);
        if (snapshot.exists()) {
            const gifts = snapshot.val();
            for (let key in gifts) {
                if (gifts[key].code === name) {
                    alert('Mã giftcode đã tồn tại');
                    return;
                }
            }
        }
        
        const newGiftRef = push(ref(db, 'giftcodes'));
        await set(newGiftRef, {
            code: name,
            type: 'permanent',
            rewardType: reward,
            rewardAmount: amount,
            created: Date.now(),
            expiry: null, // No expiry
            used: false,
            usedBy: null,
            permanent: true,
            usedCount: 0
        });
        
        // Log
        await logAction(currentUser.id, 'create_giftcode', `Đã tạo giftcode vĩnh viễn ${name} (${amount} ${reward})`);
        
        document.getElementById('giftcode-permanent-result').innerHTML = `
            <div style="padding: 15px; background: #f0fff4; border: 1px solid #48bb78; border-radius: 5px;">
                <p><strong>✅ Tạo giftcode vĩnh viễn thành công</strong></p>
                <p>Mã giftcode: <strong>${name}</strong></p>
                <p>Phần thưởng: ${amount} ${reward}</p>
                <p>Hạn sử dụng: Vĩnh viễn</p>
            </div>
        `;
    } catch (error) {
        console.error('Create permanent giftcode error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Show ban account
async function showBanAccount(content) {
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
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
                    const timeStr = `${days}d ${hours}h ${minutes}m`;
                    
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
    } catch (error) {
        console.error('Show ban account error:', error);
        content.innerHTML = '<p>Có lỗi xảy ra</p>';
    }
}

// Ban account
window.banAccount = async function() {
    const userId = document.getElementById('ban-user').value;
    const token = document.getElementById('ban-token').value;
    const seconds = parseInt(document.getElementById('ban-seconds').value) || 0;
    const minutes = parseInt(document.getElementById('ban-minutes').value) || 0;
    const hours = parseInt(document.getElementById('ban-hours').value) || 0;
    const days = parseInt(document.getElementById('ban-days').value) || 0;
    const years = parseInt(document.getElementById('ban-years').value) || 0;
    const permanent = document.getElementById('ban-permanent').checked;
    
    let reason = document.querySelector('input[name="ban-reason"]:checked');
    const otherReason = document.getElementById('ban-other-reason').value;
    
    if (otherReason) {
        reason = { value: otherReason };
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
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
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
        let duration = 0;
        if (permanent) {
            duration = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
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
        await update(ref(db, `users/${userId}`), {
            banned: {
                reason: reason.value,
                until: Date.now() + duration,
                bannedBy: currentUser.username,
                bannedAt: Date.now()
            },
            status: 'banned'
        });
        
        // Log
        await logAction(currentUser.id, 'ban_account', `Đã cấm tài khoản ${user.username} với lí do: ${reason.value}`);
        
        alert(`Đã cấm tài khoản ${user.username} thành công!`);
        showManagementTab('ban-account');
    } catch (error) {
        console.error('Ban account error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Unban account
window.unbanAccount = async function(userId) {
    if (!confirm('Bạn có chắc muốn mở khóa tài khoản này?')) return;
    
    try {
        await update(ref(db, `users/${userId}`), {
            banned: null,
            status: 'offline'
        });
        
        const snapshot = await get(ref(db, `users/${userId}`));
        if (snapshot.exists()) {
            const user = snapshot.val();
            await logAction(currentUser.id, 'unban_account', `Đã mở khóa tài khoản ${user.username}`);
        }
        
        alert('Mở khóa tài khoản thành công!');
        showManagementTab('ban-account');
    } catch (error) {
        console.error('Unban account error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Redeem card
window.redeemCard = async function() {
    const cardCode = document.getElementById('card-code').value;
    
    if (!cardCode || cardCode.length !== 16) {
        alert('Vui lòng nhập mã thẻ hợp lệ (16 số)');
        return;
    }
    
    try {
        const cardsRef = ref(db, 'cards');
        const snapshot = await get(cardsRef);
        let found = false;
        
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
                    const userRef = ref(db, `users/${currentUser.id}`);
                    const userSnapshot = await get(userRef);
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        const currentOnyx = userData.onyx || 0;
                        await update(userRef, {
                            onyx: currentOnyx + onyxAmount
                        });
                    }
                    
                    // Mark card as used
                    await update(ref(db, `cards/${key}`), {
                        used: true,
                        usedBy: currentUser.username,
                        usedAt: Date.now(),
                        status: 'used'
                    });
                    
                    // Log
                    await logAction(currentUser.id, 'redeem_card', `Đã nạp thẻ ${cardCode} (${card.value}đ) - Nhận ${onyxAmount} Onyx`);
                    
                    alert(`Nạp thẻ thành công! Bạn nhận được ${onyxAmount} Onyx`);
                    closeModal('redeem-modal');
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Vui lòng nhập thông tin thẻ chính xác');
        }
    } catch (error) {
        console.error('Redeem card error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Redeem giftcode
window.redeemGiftCode = async function(code) {
    if (!code) {
        code = prompt('Nhập mã giftcode:');
        if (!code) return;
    }
    
    try {
        const giftsRef = ref(db, 'giftcodes');
        const snapshot = await get(giftsRef);
        let found = false;
        
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
                    const userRef = ref(db, `users/${currentUser.id}`);
                    const userSnapshot = await get(userRef);
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        const field = gift.rewardType === 'xu' ? 'xu' : 'onyx';
                        const currentAmount = userData[field] || 0;
                        await update(userRef, {
                            [field]: currentAmount + gift.rewardAmount
                        });
                    }
                    
                    // Update giftcode
                    if (gift.permanent) {
                        const usedBy = gift.usedBy || [];
                        usedBy.push(currentUser.id);
                        await update(ref(db, `giftcodes/${key}`), {
                            usedBy: usedBy,
                            usedCount: (gift.usedCount || 0) + 1
                        });
                    } else {
                        await update(ref(db, `giftcodes/${key}`), {
                            used: true,
                            usedBy: currentUser.username,
                            usedAt: Date.now()
                        });
                    }
                    
                    // Log
                    await logAction(currentUser.id, 'redeem_giftcode', `Đã nhận giftcode ${code} - ${gift.rewardAmount} ${gift.rewardType}`);
                    
                    alert(`Nhận giftcode thành công! Bạn nhận được ${gift.rewardAmount} ${gift.rewardType}`);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Mã giftcode không hợp lệ');
        }
    } catch (error) {
        console.error('Redeem giftcode error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}
