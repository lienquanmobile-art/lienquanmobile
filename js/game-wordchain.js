// ===== Game Nối từ =====

console.log("=== game-wordchain.js đang được load ===");

// Khai báo biến toàn cục
const WORDCHAIN_QUEUE = "wordchain_queue";
const WORDCHAIN_GAMES = "wordchain_games";
let currentGameListener = null;
let currentQueueListener = null;

function renderWordChainCard(container) {
  console.log("renderWordChainCard được gọi");
  
  if (!container) {
    console.error("container is null");
    return;
  }
  
  container.innerHTML = "";
  const card = document.createElement("div");
  card.className = "snake-launch-box";
  card.innerHTML = `<div class="snake-icon">📝</div><div class="snake-label">NỐI TỪ</div>`;
  card.onclick = () => openWordChainGame();
  container.appendChild(card);
  console.log("Đã render game Nối từ");
}

function openWordChainGame() {
  console.log("openWordChainGame được gọi");
  
  // Kiểm tra đăng nhập
  const me = getCurrentUser();
  if (!me) {
    toast("Vui lòng đăng nhập!");
    return;
  }
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-box neon-box" style="max-width: 500px;">
      <div class="modal-close" id="wordchainClose">✕</div>
      <h2 class="neon-title">🎯 NỐI TỪ</h2>
      <div id="wordchainContent">
        <div class="form-row">
          <label>Dev&Debug: <span style="color: var(--neon-yellow);">Black</span></label>
        </div>
        <div class="form-row" id="betRow">
          <label>Số xu cược (tối thiểu 100)</label>
          <input id="wordchainBet" class="neon-input" type="number" min="100" value="100" placeholder="Nhập số xu">
        </div>
        <button class="neon-btn" id="wordchainFindBtn">🔍 Bắt đầu tìm kiếm người chơi</button>
        <button class="neon-btn ghost" id="wordchainCancelBtn" style="display:none;">❌ Hủy tìm kiếm</button>
        <div id="wordchainStatus" class="result-box" style="margin-top: 10px;"></div>
      </div>
      <div id="wordchainGameArea" style="display: none;">
        <div id="wordchainGameInfo"></div>
        <div id="wordchainGamePlay"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  
  // Đóng modal
  document.getElementById("wordchainClose").onclick = () => {
    cancelWordChainSearch();
    modal.remove();
    if (currentGameListener) {
      currentGameListener.off();
      currentGameListener = null;
    }
    if (currentQueueListener) {
      currentQueueListener.off();
      currentQueueListener = null;
    }
  };
  
  // Hủy tìm kiếm
  document.getElementById("wordchainCancelBtn").onclick = () => {
    cancelWordChainSearch();
    document.getElementById("wordchainFindBtn").style.display = "block";
    document.getElementById("wordchainCancelBtn").style.display = "none";
    document.getElementById("wordchainStatus").innerHTML = '<p style="color: #ff8888;">Đã hủy tìm kiếm</p>';
  };
  
  // Bắt đầu tìm kiếm
  document.getElementById("wordchainFindBtn").onclick = async () => {
    const me = getCurrentUser();
    if (!me) { toast("Vui lòng đăng nhập!"); return; }
    
    const betInput = document.getElementById("wordchainBet");
    let bet = parseInt(betInput.value);
    
    // Nếu là admin hoặc owner, không cần cược
    if (me.role === "admin" || me.role === "owner") {
      bet = 0;
    } else {
      if (isNaN(bet) || bet < 100) {
        toast("Số xu cược tối thiểu là 100!");
        return;
      }
      // Kiểm tra số xu của user
      const userSnap = await db.ref("users/" + keyify(me.username) + "/coins").get();
      const coins = userSnap.exists() ? userSnap.val() : 0;
      if (bet > coins) {
        toast("Bạn không đủ xu để cược!");
        return;
      }
    }
    
    // Ẩn nút tìm kiếm, hiện nút hủy
    document.getElementById("wordchainFindBtn").style.display = "none";
    document.getElementById("wordchainCancelBtn").style.display = "block";
    document.getElementById("wordchainStatus").innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p>🔍 Đang tìm kiếm người chơi...</p>
        <p style="font-size: 24px; margin-top: 10px;">. . .</p>
      </div>
    `;
    
    // Xóa khỏi hàng đợi cũ nếu có
    await db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).remove();
    
    // Thêm vào hàng đợi trên Firebase
    await db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).set({
      username: me.username,
      role: me.role,
      bet: bet,
      timestamp: Date.now()
    });
    
    // Lắng nghe hàng đợi để ghép cặp
    listenForMatch(me.username);
  };
}

function cancelWordChainSearch() {
  const me = getCurrentUser();
  if (!me) return;
  
  // Xóa khỏi hàng đợi
  db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).remove();
  
  if (currentQueueListener) {
    currentQueueListener.off();
    currentQueueListener = null;
  }
}

function listenForMatch(username) {
  // Dừng listener cũ
  if (currentQueueListener) {
    currentQueueListener.off();
    currentQueueListener = null;
  }
  
  // Lắng nghe hàng đợi
  currentQueueListener = db.ref(WORDCHAIN_QUEUE);
  currentQueueListener.on("value", async (snapshot) => {
    const queue = snapshot.val();
    if (!queue) return;
    
    // Lấy danh sách người chơi trong hàng đợi
    const players = Object.values(queue);
    
    // Tìm người chơi hiện tại
    const currentPlayer = players.find(p => p.username === username);
    if (!currentPlayer) return;
    
    // Tìm người chơi khác (không phải chính mình)
    const opponent = players.find(p => p.username !== username);
    
    if (opponent) {
      // Ghép cặp thành công!
      console.log("Ghép cặp:", username, "vs", opponent.username);
      
      // Xóa cả 2 khỏi hàng đợi
      await db.ref(WORDCHAIN_QUEUE + "/" + keyify(username)).remove();
      await db.ref(WORDCHAIN_QUEUE + "/" + keyify(opponent.username)).remove();
      
      // Dừng lắng nghe
      if (currentQueueListener) {
        currentQueueListener.off();
        currentQueueListener = null;
      }
      
      // Tạo game mới
      const gameId = "wc_" + Date.now();
      const randomWord = getRandomWord();
      
      const gameData = {
        player1: {
          username: username,
          role: currentPlayer.role,
          bet: currentPlayer.bet
        },
        player2: {
          username: opponent.username,
          role: opponent.role,
          bet: opponent.bet
        },
        currentWord: randomWord,
        currentTurn: username,
        lastPlayer: null,
        status: "playing",
        winner: null,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      
      // Lưu game lên Firebase
      await db.ref(WORDCHAIN_GAMES + "/" + gameId).set(gameData);
      
      // Thông báo
      toast("Đã ghép cặp thành công!");
      
      // Mở game cho cả 2
      openGame(gameId, username);
      openGame(gameId, opponent.username);
    }
  });
}

function openGame(gameId, username) {
  // Dừng listener game cũ
  if (currentGameListener) {
    currentGameListener.off();
    currentGameListener = null;
  }
  
  // Tìm modal hiện tại
  const modal = document.querySelector('.modal-overlay');
  if (!modal) return;
  
  // Lắng nghe game
  currentGameListener = db.ref(WORDCHAIN_GAMES + "/" + gameId);
  currentGameListener.on("value", (snapshot) => {
    const game = snapshot.val();
    if (!game) {
      // Game đã bị xóa
      toast("Game đã kết thúc!");
      if (modal) modal.remove();
      return;
    }
    
    const me = getCurrentUser();
    if (!me) return;
    
    // Xác định người chơi
    const isPlayer1 = me.username === game.player1.username;
    const isPlayer2 = me.username === game.player2.username;
    
    if (!isPlayer1 && !isPlayer2) {
      // Không phải người chơi trong game
      return;
    }
    
    const player = isPlayer1 ? game.player1 : game.player2;
    const opponent = isPlayer1 ? game.player2 : game.player1;
    
    // Cập nhật modal
    const content = modal.querySelector('#wordchainContent');
    const gameArea = modal.querySelector('#wordchainGameArea');
    const status = modal.querySelector('#wordchainStatus');
    
    if (content) content.style.display = 'none';
    if (status) status.style.display = 'none';
    if (gameArea) {
      gameArea.style.display = 'block';
    }
    
    // Cập nhật game info
    const gameInfo = document.getElementById('wordchainGameInfo');
    if (gameInfo) {
      const betText = player.bet > 0 ? `${player.bet} xu` : 'Không cược';
      const oppBetText = opponent.bet > 0 ? `${opponent.bet} xu` : 'Không cược';
      gameInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,255,224,0.05); border-radius: 8px; margin-bottom: 10px;">
          <span style="color: var(--neon-cyan);">${game.player1.username} (${game.player1.bet > 0 ? game.player1.bet + ' xu' : 'Không cược'})</span>
          <span style="color: var(--neon-pink);">VS</span>
          <span style="color: var(--neon-yellow);">${game.player2.username} (${game.player2.bet > 0 ? game.player2.bet + ' xu' : 'Không cược'})</span>
        </div>
        <div style="text-align: center; padding: 10px; background: rgba(255,45,157,0.05); border-radius: 8px; margin-bottom: 10px;">
          <span style="font-size: 20px; color: var(--neon-yellow);">📝 ${game.currentWord}</span>
        </div>
      `;
    }
    
    // Cập nhật game play
    const gamePlay = document.getElementById('wordchainGamePlay');
    if (gamePlay) {
      // Kiểm tra game đã kết thúc
      if (game.status === 'finished') {
        const isWinner = game.winner === me.username;
        const reward = isWinner ? player.bet * 2 : 0;
        const rewardText = isWinner && reward > 0 ? `<p style="color: var(--neon-yellow);">Nhận được ${reward} xu!</p>` : '';
        const oppReward = opponent.bet * 2;
        const oppRewardText = isWinner && oppReward > 0 ? `<p style="color: #888;">Đối thủ mất ${opponent.bet} xu</p>` : '';
        
        gamePlay.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p style="color: ${isWinner ? '#5dff8f' : '#ff4444'}; font-size: 20px;">
              ${isWinner ? '🎉 Bạn đã thắng!' : `😢 Bạn đã thua. Người thắng: ${game.winner}`}
            </p>
            ${rewardText}
            ${oppRewardText}
            <button class="neon-btn" id="wordchainCloseBtn">Đóng</button>
          </div>
        `;
        const closeBtn = document.getElementById('wordchainCloseBtn');
        if (closeBtn) {
          closeBtn.onclick = () => {
            modal.remove();
            if (currentGameListener) {
              currentGameListener.off();
              currentGameListener = null;
            }
            // Xóa game khỏi Firebase
            db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
          };
        }
        return;
      }
      
      const isMyTurn = game.currentTurn === me.username;
      const turnText = isMyTurn ? 'Lượt của bạn' : `Lượt của ${game.currentTurn}`;
      const lastWord = getLastWord(game.currentWord);
      
      gamePlay.innerHTML = `
        <div style="text-align: center; padding: 10px; margin-bottom: 10px;">
          <span style="color: ${isMyTurn ? '#5dff8f' : '#ff8888'};">${turnText}</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
          <span style="color: var(--neon-cyan); font-size: 18px;">${lastWord}</span>
          <span style="color: #888;">|</span>
          <input id="wordchainInput" class="neon-input" placeholder="Nhập từ nối..." style="flex: 1; min-width: 150px;" ${!isMyTurn ? 'disabled' : ''}>
          <button class="neon-btn" id="wordchainSubmitBtn" ${!isMyTurn ? 'disabled' : ''} style="opacity: ${!isMyTurn ? '0.5' : '1'};">
            OK
          </button>
        </div>
        <div id="wordchainMessage" class="result-box" style="margin-top: 10px;"></div>
      `;
      
      // Gán sự kiện submit
      const submitBtn = document.getElementById('wordchainSubmitBtn');
      const input = document.getElementById('wordchainInput');
      
      if (submitBtn && isMyTurn) {
        submitBtn.onclick = () => handleSubmit(gameId, me.username);
        input.onkeypress = (e) => {
          if (e.key === 'Enter') {
            handleSubmit(gameId, me.username);
          }
        };
      }
    }
  });
}

async function handleSubmit(gameId, username) {
  const me = getCurrentUser();
  if (!me || me.username !== username) return;
  
  // Lấy game từ Firebase
  const snap = await db.ref(WORDCHAIN_GAMES + "/" + gameId).get();
  const game = snap.val();
  if (!game) return;
  
  // Kiểm tra lượt
  if (game.currentTurn !== username) {
    toast("Không phải lượt của bạn!");
    return;
  }
  
  // Kiểm tra game đã kết thúc
  if (game.status === 'finished') {
    toast("Game đã kết thúc!");
    return;
  }
  
  const input = document.getElementById('wordchainInput');
  if (!input) return;
  
  const newWord = input.value.trim();
  if (!newWord) {
    toast("Vui lòng nhập từ nối!");
    return;
  }
  
  // Kiểm tra từ nối có hợp lệ không
  const isValid = isValidConnection(game.currentWord, newWord);
  if (!isValid) {
    toast("Từ nối không hợp lệ hoặc không có trong từ điển!");
    return;
  }
  
  // Xác định người chơi tiếp theo
  const nextTurn = (game.player1.username === username) ? game.player2.username : game.player1.username;
  
  // Cập nhật game trên Firebase
  await db.ref(WORDCHAIN_GAMES + "/" + gameId).update({
    currentWord: newWord,
    lastPlayer: username,
    currentTurn: nextTurn,
    lastActivity: Date.now()
  });
  
  // Xóa input
  input.value = '';
}

// Hàm kiểm tra game không hoạt động và tự động kết thúc
function checkInactiveGames() {
  db.ref(WORDCHAIN_GAMES).once("value", (snapshot) => {
    const games = snapshot.val();
    if (!games) return;
    
    const now = Date.now();
    for (const [gameId, game] of Object.entries(games)) {
      if (game.status === 'playing' && now - game.lastActivity > 60000) {
        // Không hoạt động quá 60 giây, kết thúc game
        const winner = game.lastPlayer || game.player1.username;
        db.ref(WORDCHAIN_GAMES + "/" + gameId + "/winner").set(winner);
        db.ref(WORDCHAIN_GAMES + "/" + gameId + "/status").set("finished");
        
        // Xóa sau 5 phút
        setTimeout(() => {
          db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
        }, 300000);
      }
    }
  });
}

// Kiểm tra mỗi 10 giây
setInterval(checkInactiveGames, 10000);

console.log("game-wordchain.js đã được load!");
