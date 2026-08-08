// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
        return;
    }
    
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        let found = false;
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].username === username && users[key].password === password) {
                    found = true;
                    currentUser = { ...users[key], id: key };
                    showDashboard(currentUser);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Tên đăng nhập hoặc mật khẩu không đúng');
        }
    });
}

// Token login function
function loginWithToken() {
    const token = document.getElementById('token-input').value;
    
    if (!token) {
        alert('Vui lòng nhập token');
        return;
    }
    
    const usersRef = db.ref('users');
    usersRef.once('value', function(snapshot) {
        let found = false;
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (let key in users) {
                if (users[key].token === token) {
                    found = true;
                    currentUser = { ...users[key], id: key };
                    showDashboard(currentUser);
                    break;
                }
            }
        }
        
        if (!found) {
            alert('Token không hợp lệ');
        }
    });
}

// Show token login form
function showTokenLogin() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('token-login-form').style.display = 'block';
}

// Show normal login form
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('token-login-form').style.display = 'none';
}

let currentUser = null;
