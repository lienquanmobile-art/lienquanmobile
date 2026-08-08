import { db, ref, set, get, push, update, query, orderByChild, equalTo } from './firebase-config.js';

let currentUser = null;

// Login function
window.login = async function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
        return;
    }
    
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        let found = false;
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].username === username && users[key].password === password) {
                    found = true;
                    currentUser = { ...users[key], id: key };
                    
                    // Log login
                    await logAction(key, 'login', `Đăng nhập vào lúc ${new Date().toLocaleTimeString()}`);
                    
                    // Update status
                    await update(ref(db, `users/${key}/status`), 'online');
                    
                    showDashboard(currentUser);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Tên đăng nhập hoặc mật khẩu không đúng');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Token login
window.loginWithToken = async function() {
    const token = document.getElementById('token-input').value;
    
    if (!token) {
        alert('Vui lòng nhập token');
        return;
    }
    
    try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        let found = false;
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].token === token) {
                    found = true;
                    currentUser = { ...users[key], id: key };
                    
                    // Check if banned
                    if (currentUser.banned && currentUser.banned.until > Date.now()) {
                        alert('Tài khoản của bạn đã bị cấm');
                        return;
                    }
                    
                    await logAction(key, 'login', `Đăng nhập bằng token vào lúc ${new Date().toLocaleTimeString()}`);
                    await update(ref(db, `users/${key}/status`), 'online');
                    
                    showDashboard(currentUser);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Token không hợp lệ');
        }
    } catch (error) {
        console.error('Token login error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại');
    }
}

// Show token login form
window.showTokenLogin = function() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('token-login-form').style.display = 'block';
}

// Show normal login form
window.showLogin = function() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('token-login-form').style.display = 'none';
}

// Log actions
async function logAction(userId, action, details) {
    try {
        const logsRef = ref(db, `logs/${userId}`);
        const newLogRef = push(logsRef);
        await set(newLogRef, {
            action: action,
            details: details,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Log error:', error);
    }
}

// Check if user has permission
function hasPermission(user, action) {
    if (!user) return false;
    
    switch(user.role) {
        case 'owner':
            return true;
        case 'admin':
            return action !== 'createAdmin' && action !== 'viewLogs';
        case 'user':
            return action === 'playGame' || action === 'changePassword';
        default:
            return false;
    }
}

export { currentUser, hasPermission, logAction };
