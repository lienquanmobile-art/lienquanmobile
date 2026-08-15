// ===== Game Nối từ =====

// Cấu trúc dữ liệu game
const wordChainGames = {};
let wordChainQueue = [];
let wordChainInterval = null;
let currentGameId = null;

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
      if (user.coins < betAmount) {
        toast("Bạn không đủ xu để cược!");
        return;
      }
    }
    
    document.getElementById("searchStatus").style.display = "block";
    document.getElementById("searchOpponentBtn").disabled = true;
    
    // Thêm vào hàng đợi trên Firebase
    const playerData = {
      username: getCurrentUser().username,
      betAmount: betAmount,
      isAdminOrOwner: isAdminOrOwner,
      timestamp: Date.now()
    };
    
    // Lưu vào Firebase queue
    const queueRef = db.ref("wordchain_queue/" + getCurrentUser().username);
    await queueRef.set(playerData);
    
    // Lắng nghe queue để ghép cặp
    listenQueue();
  };
  
  // Hủy tìm kiếm
  document.getElementById("cancelSearchBtn").onclick = async () => {
    const username = getCurrentUser().username;
    await db.ref("wordchain_queue/" + username).remove();
    document.getElementById("searchStatus").style.display = "none";
    document.getElementById("searchOpponentBtn").disabled = false;
    toast("Đã hủy tìm kiếm!");
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
  
  // Kiểm tra nếu đang trong game
  checkExistingGame();
}

// Lắng nghe queue để ghép cặp
function listenQueue() {
  const queueRef = db.ref("wordchain_queue");
  
  queueRef.on("value", async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    const players = Object.values(data);
    const me = getCurrentUser();
    
    // Kiểm tra xem có đủ 2 người chơi không
    if (players.length >= 2) {
      // Lấy 2 người chơi đầu tiên
      const playerKeys = Object.keys(data);
      const player1Key = playerKeys[0];
      const player2Key = playerKeys[1];
      
      const player1 = data[player1Key];
      const player2 = data[player2Key];
      
      // Kiểm tra nếu có 1 trong 2 là mình
      if (player1.username === me.username || player2.username === me.username) {
        // Xóa 2 người chơi khỏi queue
        await db.ref("wordchain_queue/" + player1Key).remove();
        await db.ref("wordchain_queue/" + player2Key).remove();
        
        // Tạo game
        createWordChainGame(player1, player2);
      }
    }
  });
}

// Tạo game mới
async function createWordChainGame(player1, player2) {
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
    players: {
      [player1.username]: { isAdminOrOwner: player1.isAdminOrOwner, inGame: true },
      [player2.username]: { isAdminOrOwner: player2.isAdminOrOwner, inGame: true }
    },
    wordHistory: [firstWord],
    createdAt: Date.now()
  };
  
  // Lưu game lên Firebase
  await db.ref("wordchain_games/" + gameId).set(gameData);
  
  // Lưu gameId cho người chơi
  await db.ref("wordchain_players/" + player1.username + "/gameId").set(gameId);
  await db.ref("wordchain_players/" + player2.username + "/gameId").set(gameId);
  
  // Lưu local
  wordChainGames[gameId] = gameData;
  currentGameId = gameId;
  
  toast(`Đã ghép cặp! ${player1.username} vs ${player2.username}`);
  
  // Mở game cho người chơi
  openGameForPlayer(gameId);
}

// Mở game cho người chơi
function openGameForPlayer(gameId) {
  const modal = document.getElementById("wordChainModal");
  if (!modal) return;
  
  const me = getCurrentUser();
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  if (!isPlayer) return;
  
  const isPlayer1 = me.username === game.player1;
  const opponent = isPlayer1 ? game.player2 : game.player1;
  const myBet = isPlayer1 ? game.bet1 : game.bet2;
  
  // Cập nhật giao diện
  document.getElementById("wordChainStatus").style.display = "none";
  document.getElementById("wordChainGame").style.display = "block";
  
  document.getElementById("gamePlayers").innerHTML = `
    ${game.player1} (${game.bet1} xu) vs ${game.player2} (${game.bet2} xu)
  `;
  
  document.getElementById("currentWord").textContent = game.currentWord;
  document.getElementById("lastWordDisplay").textContent = game.lastWord;
  
  // Cập nhật lượt chơi
  updateWordChainTurn(gameId);
  
  // Lắng nghe realtime game
  listenWordChainGame(gameId);
}

// Lắng nghe realtime game
function listenWordChainGame(gameId) {
  const gameRef = db.ref("wordchain_games/" + gameId);
  
  gameRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      // Game đã bị xóa
      document.getElementById("wordChainGame").style.display = "none";
      toast("Game đã kết thúc!");
      return;
    }
    
    // Cập nhật dữ liệu local
    wordChainGames[gameId] = data;
    currentGameId = gameId;
    
    // Cập nhật giao diện
    if (document.getElementById("wordChainGame").style.display !== "none") {
      document.getElementById("currentWord").textContent = data.currentWord;
      document.getElementById("lastWordDisplay").textContent = data.lastWord;
      updateWordChainTurn(gameId);
    }
    
    // Kiểm tra game over
    if (data.isOver) {
      handleWordChainGameOver(gameId, data.winner);
    }
  });
}

// Kiểm tra game hiện tại
async function checkExistingGame() {
  const me = getCurrentUser();
  const snap = await db.ref("wordchain_players/" + me.username + "/gameId").get();
  if (!snap.exists()) return;
  
  const gameId = snap.val();
  const gameSnap = await db.ref("wordchain_games/" + gameId).get();
  if (!gameSnap.exists()) return;
  
  const game = gameSnap.val();
  wordChainGames[gameId] = game;
  currentGameId = gameId;
  
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  if (isPlayer && !game.isOver) {
    // Mở game
    document.getElementById("wordChainStatus").style.display = "none";
    document.getElementById("wordChainGame").style.display = "block";
    
    document.getElementById("gamePlayers").innerHTML = `
      ${game.player1} (${game.bet1} xu) vs ${game.player2} (${game.bet2} xu)
    `;
    
    document.getElementById("currentWord").textContent = game.currentWord;
    document.getElementById("lastWordDisplay").textContent = game.lastWord;
    
    updateWordChainTurn(gameId);
    listenWordChainGame(gameId);
  }
}

// Cập nhật lượt chơi
function updateWordChainTurn(gameId) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const me = getCurrentUser();
  const isMyTurn = game.currentTurn === me.username;
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  
  if (!isPlayer) return;
  
  document.getElementById("gameTurn").textContent = isMyTurn ? 
    "🟢 Lượt của bạn" : `⏳ Đợi ${game.currentTurn} trả lời...`;
  
  document.getElementById("wordInput").disabled = !isMyTurn;
  document.getElementById("submitWordBtn").disabled = !isMyTurn;
  
  if (isMyTurn) {
    document.getElementById("wordInput").focus();
  }
}

// Nộp từ
async function submitWordChainWord() {
  const me = getCurrentUser();
  const input = document.getElementById("wordInput");
  const word = input.value.trim().toLowerCase();
  
  if (!word) {
    toast("Vui lòng nhập từ!");
    return;
  }
  
  // Lấy gameId từ Firebase
  const snap = await db.ref("wordchain_players/" + me.username + "/gameId").get();
  if (!snap.exists()) {
    toast("Không tìm thấy game!");
    return;
  }
  
  const gameId = snap.val();
  const game = wordChainGames[gameId];
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
  
  // Cập nhật giao diện
  document.getElementById("currentWord").textContent = word;
  document.getElementById("lastWordDisplay").textContent = newLastWord;
  updateWordChainTurn(gameId);
}

// Kết thúc game
async function handleWordChainGameOver(gameId, winner) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  // Ngừng lắng nghe
  db.ref("wordchain_games/" + gameId).off();
  
  const me = getCurrentUser();
  const isPlayer = me.username === game.player1 || me.username === game.player2;
  
  if (!isPlayer) return;
  
  const isWinner = me.username === winner;
  const opponent = game.player1 === me.username ? game.player2 : game.player1;
  const myBet = game.player1 === me.username ? game.bet1 : game.bet2;
  const opponentBet = game.player1 === me.username ? game.bet2 : game.bet1;
  const myIsAdmin = game.players[me.username].isAdminOrOwner;
  const oppIsAdmin = game.players[opponent].isAdminOrOwner;
  
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
      const userRef = db.ref("users/" + keyify(me.username) + "/coins");
      const snap = await userRef.get();
      const cur = snap.exists() ? snap.val() : 0;
      await userRef.set(Math.max(0, cur - myBet));
      document.getElementById("resultDetail").textContent = `Bạn thua ${opponent}! Mất ${myBet} xu.`;
    }
  }
  
  // Xóa game khỏi Firebase
  await db.ref("wordchain_games/" + gameId).remove();
  await db.ref("wordchain_players/" + game.player1 + "/gameId").remove();
  await db.ref("wordchain_players/" + game.player2 + "/gameId").remove();
  
  delete wordChainGames[gameId];
  currentGameId = null;
  
  // Refresh home stats
  refreshHomeStats();
}

// Thoát game
async function quitWordChainGame(forceClose = false) {
  const me = getCurrentUser();
  
  // Lấy gameId từ Firebase
  const snap = await db.ref("wordchain_players/" + me.username + "/gameId").get();
  if (!snap.exists()) {
    if (!forceClose) toast("Không tìm thấy game!");
    return;
  }
  
  const gameId = snap.val();
  const game = wordChainGames[gameId];
  if (!game || game.isOver) {
    if (!forceClose) toast("Game đã kết thúc!");
    return;
  }
  
  // Xác định người thắng
  const opponent = game.player1 === me.username ? game.player2 : game.player1;
  const myBet = game.player1 === me.username ? game.bet1 : game.bet2;
  const oppBet = game.player1 === me.username ? game.bet2 : game.bet1;
  const myIsAdmin = game.players[me.username].isAdminOrOwner;
  
  // Đánh dấu game over
  game.isOver = true;
  game.winner = opponent;
  
  await db.ref("wordchain_games/" + gameId).update({
    isOver: true,
    winner: opponent
  });
  
  // Trừ tiền người rời nếu là user
  if (!myIsAdmin) {
    const userRef = db.ref("users/" + keyify(me.username) + "/coins");
    const snapUser = await userRef.get();
    const cur = snapUser.exists() ? snapUser.val() : 0;
    await userRef.set(Math.max(0, cur - myBet));
  }
  
  // Cộng tiền cho người ở lại
  const oppRef = db.ref("users/" + keyify(opponent) + "/coins");
  const oppSnap = await oppRef.get();
  const oppCur = oppSnap.exists() ? oppSnap.val() : 0;
  const reward = myBet * 2 + oppBet;
  await oppRef.set(oppCur + reward);
  
  // Xóa game
  await db.ref("wordchain_games/" + gameId).remove();
  await db.ref("wordchain_players/" + game.player1 + "/gameId").remove();
  await db.ref("wordchain_players/" + game.player2 + "/gameId").remove();
  
  delete wordChainGames[gameId];
  currentGameId = null;
  
  await addLog(`Tài khoản ${me.role}: "${me.username}" đã rời game nối từ, ${opponent} thắng lúc ${nowVN()}`);
  
  toast(`Bạn đã rời game! ${opponent} thắng.`);
  refreshHomeStats();
  
  // Đóng modal
  if (!forceClose) {
    const modal = document.getElementById("wordChainModal");
    if (modal) {
      // Reset giao diện
      document.getElementById("wordChainGame").style.display = "none";
      document.getElementById("wordChainStatus").style.display = "block";
      document.getElementById("wordChainResult").style.display = "none";
      document.getElementById("searchOpponentBtn").disabled = false;
      document.getElementById("searchStatus").style.display = "none";
    }
  }
}

// Khởi tạo listener queue
let queueListenerStarted = false;

function initWordChainQueueListener() {
  if (queueListenerStarted) return;
  queueListenerStarted = true;
  
  // Lắng nghe queue
  const queueRef = db.ref("wordchain_queue");
  queueRef.on("value", async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    const players = Object.values(data);
    
    if (players.length >= 2) {
      const playerKeys = Object.keys(data);
      const player1Key = playerKeys[0];
      const player2Key = playerKeys[1];
      
      const player1 = data[player1Key];
      const player2 = data[player2Key];
      
      // Xóa 2 người chơi khỏi queue
      await db.ref("wordchain_queue/" + player1Key).remove();
      await db.ref("wordchain_queue/" + player2Key).remove();
      
      // Tạo game
      createWordChainGame(player1, player2);
    }
  });
}

// Thêm game vào trang chủ
function renderWordChainOnHome(container) {
  const gameList = container.querySelector(".online-game-list");
  if (gameList) {
    renderWordChainCard(gameList);
  }
}

// Khởi tạo
console.log("Game Nối từ đã sẵn sàng!");
initWordChainQueueListener();
