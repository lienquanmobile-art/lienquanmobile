// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Hệ thống quản lý tài khoản đã sẵn sàng');
    
    // Add enter key support for login
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('password').focus();
        }
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('token-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginWithToken();
        }
    });
});
