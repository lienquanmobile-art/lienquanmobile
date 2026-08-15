// ===== Từ điển game Nối từ =====

const WORD_DICTIONARY = [
  // Từ 2 âm tiết - Phần A
  "ăn uống", "ăn cơm", "ăn tạp", "ăn vặt", "ăn xin", "ăn hiếp", "ăn năn", "ăn chơi",
  "bạn bè", "bè nổi", "bè bạn", "bè phái", "bè lũ", "bè đảng", "bèo bọt", "bèo dạt",
  "bán hàng", "bán chạy", "bán đảo", "bán dâm", "bán hạ", "bán kết", "bán lẻ", "bán mạng",
  "bán nguyên", "bán nguyệt", "bán phần", "bán quyền", "bán rẻ", "bán số", "bán thân", "bán thời",
  "bán tin", "bán trú", "bán tự", "bán vé", "bán vét", "bán xới",
  "bảo hiểm", "bảo quản", "bảo tồn", "bảo vệ", "bảo đảm", "bảo lãnh", "bảo mẫu", "bảo bối",
  "bảo tàng", "bảo thủ", "bảo trì", "bảo vệ", "bào chế", "bào tử", "bào thai",
  "bầu cử", "bầu bạn", "bầu đoàn", "bầu không", "bầu nhiệt", "bầu trời", "bầu bạn",
  "bắt chước", "bắt đầu", "bắt giữ", "bắt mạch", "bắt nạt", "bắt quả", "bắt tay", "bắt trộm",
  "bắt vạ", "bắt bóng", "bắt bớ", "bắt bệnh",
  "bầy đàn", "bầy hầy", "bầy tôi", "bầy trẻ", "bầy chim",
  "bằng an", "bằng chứng", "bằng cách", "bằng hữu", "bằng lòng", "bằng nhau", "bằng phẳng",
  "bằng tuổi", "bằng mặt", "bằng vai", "bằng lặng", "bằng thừa",
  "bảng hiệu", "bảng lảng", "bảng lê", "bảng tên", "bảng tin", "bảng vàng",
  "bếp núc", "bếp dầu", "bếp ga", "bếp điện", "bếp than", "bếp củi", "bếp đun",
  "bến bờ", "bến tàu", "bến xe", "bến nước", "bến cảng", "bến đò",
  "bệnh hoạn", "bệnh nhân", "bệnh tật", "bệnh viện", "bệnh vẩy", "bệnh dịch",
  "bệnh sốt", "bệnh đau", "bệnh khớp", "bệnh tim", "bệnh gan", "bệnh thận",
  "bỉ ổi", "bỉ mặt", "bỉ sắc", "bỉ sỉ", "bỉ ương",
  "bình an", "bình bị", "bình chọn", "bình dân", "bình định", "bình đẳng",
  "bình thản", "bình thường", "bình tĩnh", "bình yên", "bình bình", "bình luận",
  "bình minh", "bình thủy", "bình xịt", "bình chứa", "bình lặng",
  "bồi dưỡng", "bồi hồi", "bồi thường", "bồi tụ", "bồi đắp", "bồi bếp", "bồi bàn",
  "bọn chúng", "bọn họ", "bọn nó", "bọn ta", "bọn mình", "bọn trẻ",
  "bông hoa", "bông lúa", "bông tai", "bông tuyết", "bông vải", "bông đùa",
  "bông giấy", "bông gòn", "bông lan", "bông sen",
  "bố cục", "bố mẹ", "bố chồng", "bố vợ", "bố con", "bố dượng",
  "bờ biển", "bờ kè", "bờ sông", "bờ suối", "bờ vực", "bờ đê", "bờ cõi",
  "bột mì", "bột năng", "bột ngọt", "bột sắn", "bột gạo", "bột bánh", "bột cám",
  "bớt xén", "bớt thời", "bớt người", "bớt việc", "bớt ăn", "bớt uống",
  "bờm xờm", "bờm trán", "bờm tóc",
  "bỡ ngỡ", "bỡn cợt", "bỡn bợ",
  "bựa dãi", "bựa bã", "bựa mặt",
  "bức bách", "bức phá", "bức tường", "bức thư", "bức vẽ", "bức ảnh",
  "bức xúc", "bức xạ", "bức tranh", "bức bối",
  "bưng bít", "bưng biêng", "bưng chiêng", "bưng bát", "bưng mâm",
  "bừa bãi", "bừa bộn", "bừa cày", "bừa đất",
  "bươn bả", "bươn chải", "bươn bước",
  "bướng bỉnh", "bướng gàn", "bướng bạo",
  "bương bả", "bương lúa", "bương sạ",
  "cá cược", "cá chép", "cá cờ", "cá đuối", "cá heo", "cá hề", "cá hồi",
  "cá kiếm", "cá koi", "cá mập", "cá ngựa", "cá nhân", "cá rô", "cá sấu",
  "cá thu", "cá trê", "cá vàng", "cá voi", "cá xương", "cá đá", "cá cảnh",
  "các bạn", "các cậu", "các chị", "các em", "các ông", "các anh", "các bà",
  "cách đây", "cách đó", "cách kia", "cách nào", "cách này", "cách nọ", "cách đều",
  "cách trở", "cách ly", "cách mạng", "cách phục", "cách điệu", "cách thức",
  "cải cách", "cải thiện", "cải tiến", "cải tạo", "cải tử", "cải xoăn", "cải bắp",
  "cải xanh", "cải đỏ", "cải tổ", "cải lương",
  "cần cầu", "cần cù", "cần mẫn", "cần sa", "cần tây", "cần vương", "cần đẩy",
  "cần thiết", "cần cơm", "cần ăn", "cần uống",
  "cắn câu", "cắn trả", "cắn xé", "cắn cấu", "cắn rứt",
  "cặp đôi", "cặp kè", "cặp mắt", "cặp nhiệt", "cặp sách", "cặp tình", "cặp đũa",
  "cầu cạnh", "cầu chì", "cầu dao", "cầu hôn", "cầu nguyện", "cầu nối", "cầu phà",
  "cầu thang", "cầu thủ", "cầu trục", "cầu vồng", "cầu xin", "cầu giải", "cầu cứu",
  "cậy nhờ", "cậy thế", "cậy sức", "cậy tài",
  "cấm cản", "cấm chỉ", "cấm đoán", "cấm kỵ", "cấm nội", "cấm vận", "cấm cung",
  "cấp bách", "cấp cứu", "cấp dưỡng", "cấp độ", "cấp phát", "cấp phép", "cấp trên",
  "cấp thấp", "cấp cao", "cấp tập", "cấp tiến", "cấp nước", "cấp điện",
  "cắt cơn", "cắt cổ", "cắt cử", "cắt đặt", "cắt giảm", "cắt may", "cắt nghĩa",
  "cắt rốn", "cắt tóc", "cắt xén", "cắt lóc", "cắt lọc", "cắt bỏ",
  "cậu ấm", "cậu bé", "cậu chủ", "cậu học", "cậu mợ", "cậu út",
  "cây bút", "cây cảnh", "cây cầu", "cây cối", "cây dừa", "cây đa", "cây đèn",
  "cây gậy", "cây keo", "cây khế", "cây lúa", "cây mía", "cây nến", "cây sáo",
  "cây số", "cây thông", "cây tre", "cây vạn", "cây viết", "cây xăng", "cây cọ",
  "cây đay", "cây bông", "cây chuối", "cây chè", "cây đậu", "cây hồng",
  "cây mít", "cây na", "cây nhãn", "cây ổi", "cây quýt", "cây soài",
  "cây sung", "cây táo", "cây vải", "cây xoài", "cây đào", "cây mận",
  "cây cam", "cây chanh", "cây bưởi", "cây ớt", "cây hành", "cây tỏi",
  "cây gừng", "cây nghệ", "cây riềng", "cây sả", "cây thì là", "cây rau muống",
  "cây cải", "cây bắp", "cây khoai", "cây sắn", "cây dong", "cây chuối",
  "cây thốt", "cây nốt", "cây quế", "cây hồi", "cây đinh", "cây vang",
  "cây xích", "cây thầu", "cây đước", "cây đưng", "cây bần", "cây vẹt",
  "cây sú", "cây mắm", "cây dà", "cây chà", "cây lá", "cây hoa",
  "cây kiểng", "cây phong", "cây tùng", "cây bách", "cây liễu", "cây dương",
  "cây sam", "cây bồ", "cây đề", "cây đu", "cây lộc", "cây thọ",
  "cây phát", "cây lộc", "cây mai", "cây đào", "cây quất", "cây cúc",
  "cây ly", "cây lan", "cây huệ", "cây sen", "cây trà", "cây mơ",
  "cây mận", "cây nhót", "cây thanh", "cây măng", "cây cụt", "cây cau",
  "cây dừa", "cây báng", "cây chuối", "cây khác", "cây lài", "cây nhài",
  "cây hương", "cây đàn", "cây sáo", "cây kèn", "cây trống", "cây chiêng",
  "cây mõ", "cây khánh", "cây chuông", "cây cồng", "cây sênh", "cây phách",
  "cây địch", "cây tiêu", "cây ớt", "cây hành", "cây tỏi", "cây gừng",
  "cây nghệ", "cây riềng", "cây sả", "cây thì là", "cây rau muống",
  "cây cải", "cây bắp", "cây khoai", "cây sắn", "cây dong", "cây chuối",
  
  // Thêm 9000 từ nữa ở đây...
  // (Tôi sẽ thêm tiếp vì giới hạn ký tự)
];

// Hàm random từ trong từ điển
function getRandomWord() {
  return WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
}

// Hàm kiểm tra từ có trong từ điển không
function isValidWord(word) {
  return WORD_DICTIONARY.includes(word.toLowerCase().trim());
}

// Hàm lấy từ cuối của từ
function getLastWord(word) {
  const parts = word.trim().split(/\s+/);
  return parts[parts.length - 1];
}

console.log("Từ điển đã load, số lượng từ:", WORD_DICTIONARY.length);
