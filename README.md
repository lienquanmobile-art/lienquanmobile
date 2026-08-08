# Quản Lí Tài Khoản (Web quản lí tài khoản + game kiếm xu)

Web tĩnh (HTML/CSS/JS thuần, không cần build) dùng Firebase Realtime Database làm nơi lưu dữ liệu, phù hợp để host trên GitHub Pages.

## Cấu trúc thư mục

```
index.html
css/
  style.css
js/
  firebase-config.js   Cấu hình + khởi tạo Firebase
  utils.js              Hàm tiện ích (sinh token, mã thẻ, giftcode, băm mật khẩu, định dạng thời gian...)
  db.js                 Toàn bộ hàm đọc/ghi Realtime Database
  auth.js                Đăng nhập bằng mật khẩu/token, quản lí phiên đăng nhập, tạo Owner mặc định
  game.js                Trò chơi Snake (rắn ăn táo) 15x15
  admin.js               Toàn bộ tab "Quản Lí": Tài khoản, Tạo tài khoản, Log, Tạo thẻ, Tạo giftcode, Cấm tài khoản
  settings.js            Tab "Cài Đặt": đổi mật khẩu, đăng xuất
  app.js                 Điều phối chính: màn hình đăng nhập, layout theo vai trò, trang chủ + ví xu/Onyx
```

## Bước 1 — Cấu hình Firebase Realtime Database rules

Vì web này **không dùng Firebase Authentication** (đăng nhập tự quản lí trong database), bạn cần mở quyền đọc/ghi cho Realtime Database, nếu không mọi thao tác sẽ báo lỗi "Permission denied".

Vào Firebase Console → Realtime Database → Rules, dán tạm:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Lưu ý quan trọng:** cấu hình trên cho phép BẤT KỲ AI cũng đọc/ghi được toàn bộ database nếu biết địa chỉ project (kể cả sửa xu, Onyx, mật khẩu người khác...). Đây là cách đơn giản nhất để chạy được ngay, nhưng không an toàn cho một web thật sự có người dùng. Khi rảnh, bạn nên tìm hiểu thêm về Firebase Authentication + Rules theo `auth.uid` để bảo mật đúng cách.

## Bước 2 — Chạy thử

Mở trực tiếp `index.html` bằng trình duyệt (hoặc dùng extension Live Server), hoặc đẩy lên GitHub Pages là dùng được ngay vì mọi thứ đều load qua CDN.

## Tài khoản Owner mặc định

Lần đầu chạy web, hệ thống tự tạo **duy nhất 1 tài khoản Owner**:

- Tên đăng nhập: `owner`
- Mật khẩu: `owner123`

**Hãy đăng nhập và đổi mật khẩu ngay** ở tab Cài Đặt.

## Ghi chú về logic đã cài đặt

- Mật khẩu được băm SHA-256 trước khi lưu vào database (không lưu chữ thường).
- Token tài khoản: 20 số, đảm bảo không trùng giữa các tài khoản.
- Mã thẻ Onyx: 16 số, hạn dùng 24h, chỉ dùng được 1 lần, tự động coi là hết hạn nếu quá 24h.
- Giftcode bất kỳ: cú pháp `BLACK=<7 ký tự>`, hạn 48h, dùng 1 lần, phần thưởng random theo tỉ lệ khi người chơi nhập.
- Giftcode vĩnh viễn: không hết hạn, dùng được nhiều tài khoản nhưng mỗi tài khoản chỉ 1 lần, phần thưởng cố định do Owner/Admin đặt.
- Owner cấm được Admin + User; Admin chỉ cấm được User; không ai cấm được Owner.
- Chỉ tài khoản **User** mới nhận xu khi chơi Snake.
- Log lưu lại toàn bộ hoạt động (đăng nhập, tạo tài khoản, tạo thẻ, tạo giftcode, cấm/mở khóa...) trừ hoạt động của Owner, và chỉ Owner mới xem được tab Log.
