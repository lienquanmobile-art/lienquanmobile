// ===== Từ điển cho game Nối từ =====

const WORD_DICTIONARY = [
  // Từ 2 từ
  "ăn uống",
  "ăn cơm",
  "ăn tạp",
  "ăn chơi",
  "ăn học",
  "ăn mặc",
  "ăn nói",
  "ăn ở",
  "ăn vận",
  "bạn bè",
  "bè nổi",
  "bè gỗ",
  "bè bạn",
  "bè phái",
  "bóng đá",
  "bóng chuyền",
  "bóng rổ",
  "bóng bàn",
  "bóng chày",
  "bóng nước",
  "cây cối",
  "cây xanh",
  "cây cỏ",
  "cây ăn quả",
  "cây công nghiệp",
  "chào hỏi",
  "chào mừng",
  "chào tạm biệt",
  "chào cờ",
  "chào đón",
  "cơm nước",
  "cơm canh",
  "cơm gạo",
  "cơm trắng",
  "cơm tấm",
  "đá bóng",
  "đá cầu",
  "đá banh",
  "đá gà",
  "đá phạt",
  "đi chơi",
  "đi học",
  "đi làm",
  "đi bộ",
  "đi xe",
  "đi lại",
  "gỗ lim",
  "gỗ sưa",
  "gỗ mít",
  "gỗ xoan",
  "gỗ tếch",
  "hoa hồng",
  "hoa cúc",
  "hoa sen",
  "hoa mai",
  "hoa đào",
  "học hành",
  "học tập",
  "học sinh",
  "học viên",
  "học vấn",
  "làm việc",
  "làm ăn",
  "làm quen",
  "làm bạn",
  "làm tình",
  "lim dim",
  "lim bóng",
  "lim xanh",
  "mừng tuổi",
  "mừng xuân",
  "mừng thọ",
  "mừng vui",
  "mừng hộ",
  "nước mắt",
  "nước mía",
  "nước cam",
  "nước chanh",
  "nước dừa",
  "nối từ",
  "nối dài",
  "nối tiếp",
  "nối liền",
  "nối nghiệp",
  "phim ảnh",
  "phim truyền hình",
  "phim điện ảnh",
  "phim hoạt hình",
  "phim tài liệu",
  "quả bóng",
  "quả cam",
  "quả chanh",
  "quả dừa",
  "quả táo",
  "quả xoài",
  "rổ rá",
  "rổ bóng",
  "rổ thóc",
  "rổ trứng",
  "sách vở",
  "sách báo",
  "sách giáo khoa",
  "sách truyện",
  "sách tham khảo",
  "tình bạn",
  "tình yêu",
  "tình cảm",
  "tình thân",
  "tình người",
  "trắng tinh",
  "trắng bóc",
  "trắng xóa",
  "trắng tay",
  "trắng ngần",
  "uống nước",
  "uống trà",
  "uống bia",
  "uống thuốc",
  "uống rượu",
  "việc làm",
  "việc nhà",
  "việc học",
  "việc nước",
  "việc nhẹ",
  "vui chơi",
  "vui vẻ",
  "vui tươi",
  "vui mừng",
  "vui đùa",
  "xe cộ",
  "xe hơi",
  "xe máy",
  "xe đạp",
  "xe buýt",
  "xanh lá",
  "xanh dương",
  "xanh lục",
  "xanh ngọc",
  "xanh đen",
  "bánh mì",
  "bánh kẹo",
  "bánh trái",
  "bánh quy",
  "bánh gạo",
  "màu đen",
  "màu trắng",
  "màu đỏ",
  "màu xanh",
  "màu tím",
  "đường phố",
  "đường xá",
  "đường sắt",
  "đường bộ",
  "đường thủy",
  "nhà cửa",
  "nhà ở",
  "nhà trường",
  "nhà nước",
  "nhà hàng",
  "công viên",
  "công ty",
  "công trình",
  "công nghệ",
  "công nhân"
];

// Hàm kiểm tra từ có tồn tại trong từ điển không
function isValidWord(word) {
  // Chuẩn hóa từ (loại bỏ khoảng trắng thừa)
  const normalized = word.trim().toLowerCase();
  return WORD_DICTIONARY.some(w => w.toLowerCase() === normalized);
}

// Hàm lấy từ cuối của một từ
function getLastWord(word) {
  const parts = word.trim().split(/\s+/);
  return parts[parts.length - 1];
}

// Hàm kiểm tra từ nối có hợp lệ không
function isValidConnection(previousWord, newWord) {
  if (!newWord || !previousWord) return false;
  
  // Chuẩn hóa
  const prev = previousWord.trim().toLowerCase();
  const newW = newWord.trim().toLowerCase();
  
  // Kiểm tra từ nối có trong từ điển không
  if (!isValidWord(newW)) return false;
  
  // Lấy từ cuối của từ trước
  const lastWord = getLastWord(prev);
  
  // Lấy từ đầu của từ mới
  const firstWord = newW.split(/\s+/)[0];
  
  // Kiểm tra từ đầu của từ mới có khớp với từ cuối của từ trước không
  return lastWord === firstWord;
}

// Hàm lấy từ ngẫu nhiên
function getRandomWord() {
  return WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
}
