// ===== Game Nối từ =====

let wordChainQueue = [];
let wordChainGames = {};
let wordChainListener = null;

// Khởi tạo listener cho hàng đợi
function initWordChainQueueListener() {
  // Lắng nghe hàng đợi từ Firebase
  const queueRef = db.ref("wordchain_queue");
  
  queueRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      wordChainQueue = [];
      return;
    }
    
    // Chuyển object thành array
    wordChainQueue = Object.values(data);
    
    // Sắp xếp theo thời gian
    wordChainQueue.sort((a, b) => a.timestamp - b.timestamp);
    
    // Thử ghép cặp
    matchPlayers();
  });
}

// Hiển thị game trên trang chủ
function renderWordChainCard(container) {
  const card = document.createElement("div");
  card.className = "snake-launch-box";
  card.innerHTML = `
    <div style="font-size: 30px;">🔤</div>
    <div class="snake-label">NỐI TỪ</div>
  `;
  card.onclick = () => openWordChainGame();
  container.appendChild(card);
}

// Mở game Nối từ
function openWordChainGame() {
  // Kiểm tra xem đã có modal nào chưa
  if (document.getElementById("wordChainModal")) {
    return;
  }
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "wordChainModal";
  
  const me = getCurrentUser();
  const isAdminOrOwner = me.role === "admin" || me.role === "owner";
  
  modal.innerHTML = `
    <div class="modal-box neon-box" style="max-width: 600px;">
      <div class="modal-close" id="wordChainClose">✕</div>
      <h2 class="neon-title">🔤 NỐI TỪ</h2>
      
      <div id="wordChainStatus">
        <div class="form-row">
          <label>Số xu cược:</label>
          <input type="number" id="betAmount" class="neon-input" min="100" value="100" ${isAdminOrOwner ? 'disabled' : ''}>
          <span style="color: #888; font-size: 12px;">${isAdminOrOwner ? '(Admin/Owner không cần cược)' : '(Tối thiểu 100 xu)'}</span>
        </div>
        <button class="neon-btn" id="searchOpponentBtn">🔍 Bắt đầu tìm kiếm người chơi</button>
        <div id="searchStatus" style="text-align: center; padding: 10px; display: none;">
          <p style="color: var(--neon-yellow);">Đang tìm kiếm người chơi...</p>
          <p style="color: var(--neon-cyan);">. . .</p>
          <button class="neon-btn danger" id="cancelSearchBtn">Hủy tìm kiếm</button>
        </div>
      </div>
      
      <div id="wordChainGame" style="display: none;">
        <div id="gameInfo" style="text-align: center; margin-bottom: 10px;">
          <p style="color: var(--neon-yellow);" id="gamePlayers"></p>
          <p style="color: var(--neon-cyan); font-size: 13px;" id="gameTurn"></p>
        </div>
        <div style="background: rgba(0,255,224,0.05); padding: 20px; border-radius: 8px; margin: 10px 0; text-align: center;">
          <p style="color: var(--neon-pink); font-size: 18px;" id="currentWord"></p>
          <p style="color: #888; font-size: 13px;">Từ cuối: <b id="lastWordDisplay" style="color: var(--neon-yellow);"></b></p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; justify-content: center;">
          <input type="text" id="wordInput" class="neon-input" placeholder="Nhập từ nối..." style="flex: 1; max-width: 300px;" disabled>
          <button class="neon-btn" id="submitWordBtn" disabled>OK</button>
        </div>
        <div style="margin-top: 10px; text-align: center;">
          <button class="neon-btn danger" id="quitGameBtn">✕ Thoát</button>
        </div>
      </div>
      
      <div id="wordChainResult" style="display: none;">
        <div style="text-align: center; padding: 20px;">
          <h3 id="resultTitle" style="color: var(--neon-yellow);"></h3>
          <p id="resultDetail" style="color: var(--neon-cyan);"></p>
          <button class="neon-btn" id="resultOkBtn">OK</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Xử lý đóng modal
  document.getElementById("wordChainClose").onclick = () => {
    // Hủy tìm kiếm nếu đang tìm
    cancelSearch();
    // Thoát game nếu đang chơi
    quitWordChainGame(true);
    modal.remove();
  };
  
  // Xử lý tìm kiếm người chơi
  document.getElementById("searchOpponentBtn").onclick = async () => {
    const betAmount = parseInt(document.getElementById("betAmount").value) || 100;
    
    if (!isAdminOrOwner && betAmount < 100) {
      toast("Số xu cược tối thiểu là 100!");
      return;
    }
    
    if (!isAdminOrOwner) {
      // Kiểm tra đủ xu không
      const user = getCurrentUser();
      const snap = await db.ref("users/" + keyify(user.username) + "/coins").get();
      const coins = snap.exists() ? snap.val() : 0;
      if (coins < betAmount) {
        toast("Bạn không đủ xu để cược!");
        return;
      }
    }
    
    // Hiển thị trạng thái tìm kiếm
    document.getElementById("searchStatus").style.display = "block";
    document.getElementById("searchOpponentBtn").disabled = true;
    
    // Thêm vào hàng đợi trên Firebase
    const username = getCurrentUser().username;
    const playerData = {
      username: username,
      betAmount: betAmount,
      isAdminOrOwner: isAdminOrOwner,
      timestamp: Date.now()
    };
    
    // Lưu lên Firebase
    const queueRef = db.ref("wordchain_queue/" + keyify(username));
    await queueRef.set(playerData);
    
    // Tự động hủy sau 30 giây nếu không tìm thấy
    setTimeout(async () => {
      const snap = await queueRef.get();
      if (snap.exists()) {
        await queueRef.remove();
        if (document.getElementById("searchStatus") && 
            document.getElementById("searchStatus").style.display !== "none") {
          toast("Hết thời gian tìm kiếm!");
          document.getElementById("searchStatus").style.display = "none";
          document.getElementById("searchOpponentBtn").disabled = false;
        }
      }
    }, 30000);
  };
  
  // Hủy tìm kiếm
  document.getElementById("cancelSearchBtn").onclick = () => {
    cancelSearch();
  };
  
  // Xử lý nộp từ
  document.getElementById("submitWordBtn").onclick = () => {
    submitWordChainWord();
  };
  
  document.getElementById("wordInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitWordChainWord();
    }
  });
  
  // Xử lý thoát game
  document.getElementById("quitGameBtn").onclick = () => {
    quitWordChainGame();
  };
  
  // Xử lý nút OK kết quả
  document.getElementById("resultOkBtn").onclick = () => {
    document.getElementById("wordChainResult").style.display = "none";
    document.getElementById("wordChainStatus").style.display = "block";
    document.getElementById("wordChainGame").style.display = "none";
    document.getElementById("searchOpponentBtn").disabled = false;
    document.getElementById("searchStatus").style.display = "none";
  };
  
  // Lắng nghe game của người chơi
  const username = getCurrentUser().username;
  listenUserGame(username);
}

// Hủy tìm kiếm
async function cancelSearch() {
  const username = getCurrentUser().username;
  const queueRef = db.ref("wordchain_queue/" + keyify(username));
  await queueRef.remove();
  
  document.getElementById("searchStatus").style.display = "none";
  document.getElementById("searchOpponentBtn").disabled = false;
  toast("Đã hủy tìm kiếm!");
}

// Hàm ghép cặp người chơi
async function matchPlayers() {
  if (wordChainQueue.length < 2) return;
  
  // Lấy 2 người chơi đầu tiên
  const player1 = wordChainQueue[0];
  const player2 = wordChainQueue[1];
  
  // Kiểm tra xem 2 người có đang online không
  const user1 = await getUser(player1.username);
  const user2 = await getUser(player2.username);
  
  if (!user1 || !user2) {
    // Xóa người chơi không tồn tại
    if (!user1) {
      await db.ref("wordchain_queue/" + keyify(player1.username)).remove();
    }
    if (!user2) {
      await db.ref("wordchain_queue/" + keyify(player2.username)).remove();
    }
    return;
  }
  
  // Xóa khỏi hàng đợi
  await db.ref("wordchain_queue/" + keyify(player1.username)).remove();
  await db.ref("wordchain_queue/" + keyify(player2.username)).remove();
  
  // Tạo game mới
  const gameId = "wc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  
  // Random từ đầu tiên
  const firstWord = getRandomWord();
  const lastWord = getLastWord(firstWord);
  
  // Random người chơi đi trước
  const firstPlayer = Math.random() < 0.5 ? player1.username : player2.username;
  
  const gameData = {
    id: gameId,
    player1: player1.username,
    player2: player2.username,
    bet1: player1.betAmount,
    bet2: player2.betAmount,
    currentWord: firstWord,
    lastWord: lastWord,
    currentTurn: firstPlayer,
    isOver: false,
    winner: null,
    wordHistory: [firstWord],
    createdAt: Date.now()
  };
  
  // Lưu game lên Firebase
  await db.ref("wordchain_games/" + gameId).set(gameData);
  
  // Thông báo cho 2 người chơi
  toast(`Đã ghép cặp! ${player1.username} vs ${player2.username}`);
  
  // Cập nhật game local
  wordChainGames[gameId] = gameData;
  
  // Lắng nghe game
  listenGame(gameId);
}

// Lắng nghe game của người chơi
function listenUserGame(username) {
  const gamesRef = db.ref("wordchain_games");
  
  gamesRef.on("child_added", (snapshot) => {
    const game = snapshot.val();
    if (!game) return;
    
    if (game.player1 === username || game.player2 === username) {
      // Đây là game của người chơi
      wordChainGames[game.id] = game;
      
      // Kiểm tra modal đang mở
      const modal = document.getElementById("wordChainModal");
      if (!modal) return;
      
      // Cập nhật giao diện
      document.getElementById("wordChainStatus").style.display = "none";
      document.getElementById("wordChainGame").style.display = "block";
      
      document.getElementById("gamePlayers").innerHTML = `
        ${game.player1} (${game.bet1} xu) vs ${game.player2} (${game.bet2} xu)
      `;
      
      document.getElementById("currentWord").textContent = game.currentWord;
      document.getElementById("lastWordDisplay").textContent = game.lastWord;
      
      updateWordChainTurn(game.id);
    }
  });
  
  // Lắng nghe cập nhật game
  gamesRef.on("child_changed", (snapshot) => {
    const game = snapshot.val();
    if (!game) return;
    
    if (game.player1 === username || game.player2 === username) {
      wordChainGames[game.id] = game;
      
      const modal = document.getElementById("wordChainModal");
      if (!modal) return;
      
      if (document.getElementById("wordChainGame").style.display !== "none") {
        document.getElementById("currentWord").textContent = game.currentWord;
        document.getElementById("lastWordDisplay").textContent = game.lastWord;
        updateWordChainTurn(game.id);
      }
      
      // Kiểm tra game over
      if (game.isOver) {
        handleWordChainGameOver(game.id, game.winner);
      }
    }
  });
  
  // Lắng nghe game bị xóa
  gamesRef.on("child_removed", (snapshot) => {
    const game = snapshot.val();
    if (!game) return;
    
    if (game.player1 === username || game.player2 === username) {
      const modal = document.getElementById("wordChainModal");
      if (modal) {
        document.getElementById("wordChainGame").style.display = "none";
        toast("Game đã kết thúc!");
      }
    }
  });
}

// Lắng nghe game cụ thể
function listenGame(gameId) {
  const gameRef = db.ref("wordchain_games/" + gameId);
  
  gameRef.on("value", (snapshot) => {
    const game = snapshot.val();
    if (!game) {
      // Game đã bị xóa
      return;
    }
    
    wordChainGames[gameId] = game;
    
    const modal = document.getElementById("wordChainModal");
    if (!modal) return;
    
    if (document.getElementById("wordChainGame").style.display !== "none") {
      document.getElementById("currentWord").textContent = game.currentWord;
      document.getElementById("lastWordDisplay").textContent = game.lastWord;
      updateWordChainTurn(gameId);
    }
    
    if (game.isOver) {
      handleWordChainGameOver(gameId, game.winner);
    }
  });
}

// Cập nhật lượt chơi
function updateWordChainTurn(gameId) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const me = getCurrentUser();
  if (!me) return;
  
  const isMyTurn = game.currentTurn === me.username;
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  
  if (!isPlayer) return;
  
  const turnDisplay = document.getElementById("gameTurn");
  const wordInput = document.getElementById("wordInput");
  const submitBtn = document.getElementById("submitWordBtn");
  
  if (turnDisplay) {
    turnDisplay.textContent = isMyTurn ? 
      "🟢 Lượt của bạn" : `⏳ Đợi ${game.currentTurn} trả lời...`;
  }
  
  if (wordInput) {
    wordInput.disabled = !isMyTurn;
  }
  
  if (submitBtn) {
    submitBtn.disabled = !isMyTurn;
  }
  
  if (isMyTurn && wordInput) {
    wordInput.focus();
  }
}

// Nộp từ
async function submitWordChainWord() {
  const me = getCurrentUser();
  if (!me) return;
  
  const input = document.getElementById("wordInput");
  const word = input.value.trim().toLowerCase();
  
  if (!word) {
    toast("Vui lòng nhập từ!");
    return;
  }
  
  // Tìm game hiện tại
  let gameId = null;
  let game = null;
  
  for (const [id, g] of Object.entries(wordChainGames)) {
    if (!g.isOver && (g.player1 === me.username || g.player2 === me.username)) {
      gameId = id;
      game = g;
      break;
    }
  }
  
  if (!game) {
    toast("Không tìm thấy game!");
    return;
  }
  
  // Kiểm tra lượt
  if (game.currentTurn !== me.username) {
    toast("Chưa đến lượt của bạn!");
    return;
  }
  
  // Kiểm tra từ nối
  const expectedStart = game.lastWord;
  const wordParts = word.split(/\s+/);
  
  if (wordParts.length !== 2) {
    toast("Chỉ được nối 2 từ!");
    return;
  }
  
  if (wordParts[0] !== expectedStart) {
    toast(`Từ phải bắt đầu bằng "${expectedStart}"!`);
    return;
  }
  
  // Kiểm tra từ có trong từ điển không
  if (!isValidWord(word)) {
    toast("Từ không có trong từ điển!");
    return;
  }
  
  // Kiểm tra trùng lặp
  if (game.wordHistory.includes(word)) {
    toast("Từ này đã được sử dụng!");
    return;
  }
  
  // Xác định người chơi tiếp theo
  const nextPlayer = game.player1 === me.username ? game.player2 : game.player1;
  const newLastWord = getLastWord(word);
  
  // Cập nhật game
  game.currentWord = word;
  game.lastWord = newLastWord;
  game.currentTurn = nextPlayer;
  game.wordHistory.push(word);
  
  // Lưu lên Firebase
  await db.ref("wordchain_games/" + gameId).update({
    currentWord: word,
    lastWord: newLastWord,
    currentTurn: nextPlayer,
    wordHistory: game.wordHistory
  });
  
  // Xóa input
  input.value = "";
}

// Kết thúc game
async function handleWordChainGameOver(gameId, winner) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  // Ngừng lắng nghe
  db.ref("wordchain_games/" + gameId).off();
  
  const me = getCurrentUser();
  if (!me) return;
  
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  if (!isPlayer) return;
  
  const isWinner = me.username === winner;
  const opponent = game.player1 === me.username ? game.player2 : game.player1;
  const myBet = game.player1 === me.username ? game.bet1 : game.bet2;
  const opponentBet = game.player1 === me.username ? game.bet2 : game.bet1;
  const myIsAdmin = me.role === "admin" || me.role === "owner";
  const oppIsAdmin = (await getUser(opponent)).role === "admin" || (await getUser(opponent)).role === "owner";
  
  // Ẩn game, hiện kết quả
  document.getElementById("wordChainGame").style.display = "none";
  document.getElementById("wordChainResult").style.display = "block";
  
  if (isWinner) {
    document.getElementById("resultTitle").textContent = "🎉 BẠN THẮNG!";
    document.getElementById("resultTitle").style.color = "#5dff8f";
    
    let reward = 0;
    if (myIsAdmin) {
      reward = 0;
      document.getElementById("resultDetail").textContent = `Bạn đã thắng ${opponent}! (Admin/Owner không nhận xu)`;
    } else {
      if (oppIsAdmin) {
        reward = myBet * 2 + 200;
        document.getElementById("resultDetail").textContent = `Bạn thắng ${opponent} (Admin)! Nhận ${reward} xu!`;
      } else {
        reward = myBet * 2;
        document.getElementById("resultDetail").textContent = `Bạn thắng ${opponent}! Nhận ${reward} xu!`;
      }
      
      // Cộng xu cho người thắng
      const userRef = db.ref("users/" + keyify(me.username) + "/coins");
      const snap = await userRef.get();
      const cur = snap.exists() ? snap.val() : 0;
      await userRef.set(cur + reward);
    }
  } else {
    document.getElementById("resultTitle").textContent = "💔 BẠN THUA!";
    document.getElementById("resultTitle").style.color = "#ff4444";
    
    if (myIsAdmin) {
      document.getElementById("resultDetail").textContent = `Bạn đã thua ${opponent}! (Admin/Owner không mất xu)`;
    } else {
      // Trừ xu của người thua
      const userRef = db.ref("users/" + keyify(me.username) + "/coins");
      const snap = await userRef.get();
      const cur = snap.exists() ? snap.val() : 0;
      await userRef.set(Math.max(0, cur - myBet));
      document.getElementById("resultDetail").textContent = `Bạn thua ${opponent}! Mất ${myBet} xu.`;
    }
  }
  
  // Xóa game khỏi Firebase
  await db.ref("wordchain_games/" + gameId).remove();
  delete wordChainGames[gameId];
  
  // Refresh home stats
  refreshHomeStats();
}

// Thoát game
async function quitWordChainGame(forceClose = false) {
  const me = getCurrentUser();
  if (!me) return;
  
  let gameId = null;
  let game = null;
  
  for (const [id, g] of Object.entries(wordChainGames)) {
    if (!g.isOver && (g.player1 === me.username || g.player2 === me.username)) {
      gameId = id;
      game = g;
      break;
    }
  }
  
  if (!game) {
    if (!forceClose) toast("Không tìm thấy game!");
    return;
  }
  
  // Xác định người thắng
  const opponent = game.player1 === me.username ? game.player2 : game.player1;
  const myBet = game.player1 === me.username ? game.bet1 : game.bet2;
  const oppBet = game.player1 === me.username ? game.bet2 : game.bet1;
  const myIsAdmin = me.role === "admin" || me.role === "owner";
  
  // Đánh dấu game over
  game.isOver = true;
  game.winner = opponent;
  
  await db.ref("wordchain_games/" + gameId).update({
    isOver: true,
    winner: opponent
  });
  
  // Trừ tiền người rời
  if (!myIsAdmin) {
    const userRef = db.ref("users/" + keyify(me.username) + "/coins");
    const snap = await userRef.get();
    const cur = snap.exists() ? snap.val() : 0;
    await userRef.set(Math.max(0, cur - myBet));
  }
  
  // Cộng tiền cho người ở lại
  const oppUser = await getUser(opponent);
  if (oppUser) {
    const oppIsAdmin = oppUser.role === "admin" || oppUser.role === "owner";
    if (!oppIsAdmin) {
      const oppRef = db.ref("users/" + keyify(opponent) + "/coins");
      const oppSnap = await oppRef.get();
      const oppCur = oppSnap.exists() ? oppSnap.val() : 0;
      const reward = myBet * 2 + oppBet;
      await oppRef.set(oppCur + reward);
    }
  }
  
  await addLog(`Tài khoản ${me.role}: "${me.username}" đã rời game nối từ, ${opponent} thắng lúc ${nowVN()}`);
  
  toast(`Bạn đã rời game! ${opponent} thắng.`);
  refreshHomeStats();
  
  if (!forceClose) {
    const modal = document.getElementById("wordChainModal");
    if (modal) modal.remove();
  }
}

// Khởi tạo
console.log("Game Nối từ đã sẵn sàng!");
initWordChainQueueListener();
