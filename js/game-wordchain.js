// ===== Từ điển cho game Nối từ =====

const WORD_DICTIONARY = [
  // CHỈ LẤY TỪ 2 TỪ
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
  "chào hỏi",
  "chào mừng",
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
  
  const prev = previousWord.trim().toLowerCase();
  const newW = newWord.trim().toLowerCase();
  
  // Kiểm tra từ mới có trong từ điển không
  if (!isValidWord(newW)) return false;
  
  // Kiểm tra số lượng từ = 2
  const wordParts = newW.split(/\s+/);
  if (wordParts.length !== 2) {
    return false;
  }
  
  // Lấy từ cuối của từ trước
  const lastWord = getLastWord(prev);
  
  // Lấy từ đầu của từ mới
  const firstWord = wordParts[0];
  
  // Kiểm tra từ đầu của từ mới có khớp với từ cuối của từ trước không
  return lastWord === firstWord;
}

// Hàm lấy từ ngẫu nhiên (chỉ lấy từ 2 từ)
function getRandomWord() {
  // Lọc chỉ lấy từ có đúng 2 từ
  const twoWordList = WORD_DICTIONARY.filter(w => w.trim().split(/\s+/).length === 2);
  return twoWordList[Math.floor(Math.random() * twoWordList.length)];
}

console.log("word-dictionary.js đã được load! Số từ 2 từ:", WORD_DICTIONARY.filter(w => w.trim().split(/\s+/).length === 2).length);
