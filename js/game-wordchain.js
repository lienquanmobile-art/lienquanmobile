// ===== Game Nối từ =====

// Lưu trữ các phòng chơi
let wordChainGames = {};
let wordChainQueue = [];

function renderWordChainCard(container) {
  container.innerHTML = "";
  const card = el("div", "snake-launch-box");
  card.innerHTML = `<div class="snake-icon">📝</div><div class="snake-label">NỐI TỪ</div>`;
  card.onclick = () => openWordChainGame();
  container.appendChild(card);
}

function openWordChainGame() {
  const modal = el("div", "modal-overlay");
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
        <div id="wordchainStatus" class="result-box" style="margin-top: 10px;"></div>
      </div>
      <div id="wordchainGameArea" style="display: none;">
        <div id="wordchainGameInfo"></div>
        <div id="wordchainGamePlay"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  
  document.getElementById("wordchainClose").onclick = () => {
    cancelWordChainSearch();
    modal.remove();
  };
  
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
    
    // Ẩn form tìm kiếm
    document.getElementById("wordchainContent").style.display = "none";
    document.getElementById("wordchainStatus").style.display = "block";
    document.getElementById("wordchainStatus").innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p>🔍 Đang tìm kiếm người chơi...</p>
        <p style="font-size: 24px; margin-top: 10px;">. . .</p>
      </div>
    `;
    
    // Thêm vào hàng đợi
    const playerData = {
      username: me.username,
      role: me.role,
      bet: bet,
      timestamp: Date.now()
    };
    
    wordChainQueue.push(playerData);
    
    // Kiểm tra ghép cặp
    checkWordChainMatch();
  };
}

function cancelWordChainSearch() {
  const me = getCurrentUser();
  if (!me) return;
  
  // Xóa khỏi hàng đợi
  wordChainQueue = wordChainQueue.filter(p => p.username !== me.username);
}

async function checkWordChainMatch() {
  // Nếu có ít nhất 2 người trong hàng đợi
  if (wordChainQueue.length >= 2) {
    // Lấy 2 người đầu tiên
    const player1 = wordChainQueue.shift();
    const player2 = wordChainQueue.shift();
    
    // Tạo phòng chơi
    const gameId = "wc_" + Date.now();
    const randomWord = getRandomWord();
    
    const gameData = {
      player1: {
        username: player1.username,
        role: player1.role,
        bet: player1.bet,
        ready: false
      },
      player2: {
        username: player2.username,
        role: player2.role,
        bet: player2.bet,
        ready: false
      },
      currentWord: randomWord,
      currentTurn: player1.username,
      lastPlayer: null,
      status: "waiting", // waiting, playing, finished
      winner: null,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    wordChainGames[gameId] = gameData;
    
    // Thông báo cho cả 2 người chơi
    await notifyWordChainPlayers(gameId, player1.username, player2.username);
  }
}

async function notifyWordChainPlayers(gameId, username1, username2) {
  // Tìm user1 và user2 trong queue và gửi thông báo
  // Vì không có realtime, ta sẽ hiển thị trực tiếp cho cả 2
  
  // Đóng modal hiện tại của cả 2 (nếu có)
  // Mở modal mới cho cả 2
  
  // Gửi thông báo đến cả 2 người chơi
  toast(`Đã ghép cặp thành công!`);
  
  // Mở game cho cả 2
  openWordChainGameForPlayers(gameId, username1, username2);
}

function openWordChainGameForPlayers(gameId, username1, username2) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const me = getCurrentUser();
  if (!me) return;
  
  // Xác định người chơi là player1 hay player2
  const isPlayer1 = me.username === game.player1.username;
  const isPlayer2 = me.username === game.player2.username;
  
  if (!isPlayer1 && !isPlayer2) return;
  
  const player = isPlayer1 ? game.player1 : game.player2;
  const opponent = isPlayer1 ? game.player2 : game.player1;
  
  // Tìm modal hiện tại và cập nhật
  const modal = document.querySelector('.modal-overlay');
  if (!modal) return;
  
  // Cập nhật nội dung modal
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
        <span style="color: var(--neon-cyan);">${me.username} (${betText})</span>
        <span style="color: var(--neon-pink);">VS</span>
        <span style="color: var(--neon-yellow);">${opponent.username} (${oppBetText})</span>
      </div>
      <div style="text-align: center; padding: 10px; background: rgba(255,45,157,0.05); border-radius: 8px; margin-bottom: 10px;">
        <span style="font-size: 20px; color: var(--neon-yellow);">📝 ${game.currentWord}</span>
      </div>
    `;
  }
  
  // Cập nhật game play
  const gamePlay = document.getElementById('wordchainGamePlay');
  if (gamePlay) {
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
      submitBtn.onclick = () => handleWordChainSubmit(gameId, me.username);
      input.onkeypress = (e) => {
        if (e.key === 'Enter') {
          handleWordChainSubmit(gameId, me.username);
        }
      };
    }
  }
  
  // Nếu game đã kết thúc
  if (game.status === 'finished') {
    endWordChainGame(gameId);
  }
}

async function handleWordChainSubmit(gameId, username) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const me = getCurrentUser();
  if (!me || me.username !== username) return;
  
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
  
  // Cập nhật game
  game.currentWord = newWord;
  game.lastPlayer = username;
  game.currentTurn = (game.player1.username === username) ? game.player2.username : game.player1.username;
  game.lastActivity = Date.now();
  
  // Cập nhật giao diện cho cả 2 người
  updateWordChainGame(gameId);
  
  // Kiểm tra nếu đối thủ đã rời game
  // (sẽ được xử lý trong hàm checkWordChainGameStatus)
}

function updateWordChainGame(gameId) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  // Cập nhật cho cả 2 người chơi
  const gameInfo = document.getElementById('wordchainGameInfo');
  const gamePlay = document.getElementById('wordchainGamePlay');
  
  if (gameInfo) {
    const p1 = game.player1;
    const p2 = game.player2;
    const betText1 = p1.bet > 0 ? `${p1.bet} xu` : 'Không cược';
    const betText2 = p2.bet > 0 ? `${p2.bet} xu` : 'Không cược';
    gameInfo.innerHTML = `
      <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,255,224,0.05); border-radius: 8px; margin-bottom: 10px;">
        <span style="color: var(--neon-cyan);">${p1.username} (${betText1})</span>
        <span style="color: var(--neon-pink);">VS</span>
        <span style="color: var(--neon-yellow);">${p2.username} (${betText2})</span>
      </div>
      <div style="text-align: center; padding: 10px; background: rgba(255,45,157,0.05); border-radius: 8px; margin-bottom: 10px;">
        <span style="font-size: 20px; color: var(--neon-yellow);">📝 ${game.currentWord}</span>
      </div>
    `;
  }
  
  if (gamePlay) {
    const isMyTurn = game.currentTurn === getCurrentUser().username;
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
      submitBtn.onclick = () => handleWordChainSubmit(gameId, getCurrentUser().username);
      input.onkeypress = (e) => {
        if (e.key === 'Enter') {
          handleWordChainSubmit(gameId, getCurrentUser().username);
        }
      };
    }
  }
}

async function endWordChainGame(gameId) {
  const game = wordChainGames[gameId];
  if (!game) return;
  
  const me = getCurrentUser();
  const isPlayer1 = me.username === game.player1.username;
  const isPlayer2 = me.username === game.player2.username;
  
  if (!isPlayer1 && !isPlayer2) return;
  
  const player = isPlayer1 ? game.player1 : game.player2;
  const opponent = isPlayer1 ? game.player2 : game.player1;
  
  let message = '';
  let isWinner = false;
  
  // Xác định người thắng
  if (game.winner === me.username) {
    isWinner = true;
    message = '🎉 Bạn đã thắng!';
  } else if (game.winner === opponent.username) {
    message = `😢 Bạn đã thua. Người thắng: ${opponent.username}`;
  } else {
    message = 'Game đã kết thúc!';
  }
  
  // Cập nhật xu
  const playerSnap = await db.ref("users/" + keyify(me.username) + "/coins").get();
  const playerCoins = playerSnap.exists() ? playerSnap.val() : 0;
  
  if (isWinner) {
    // Thắng: nhận gấp đôi số xu cược
    let reward = player.bet * 2;
    
    // Nếu thắng admin hoặc owner, thêm 200 xu
    if (opponent.role === "admin" || opponent.role === "owner") {
      reward += 200;
    }
    
    await db.ref("users/" + keyify(me.username) + "/coins").set(playerCoins + reward);
    await addLog(`Tài khoản ${me.role}: "${me.username}" thắng game Nối từ, nhận ${reward} xu lúc ${nowVN()}`);
    
    // Cập nhật UI
    const gamePlay = document.getElementById('wordchainGamePlay');
    if (gamePlay) {
      gamePlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #5dff8f; font-size: 20px;">${message}</p>
          <p style="color: var(--neon-yellow);">Nhận được ${reward} xu!</p>
          <button class="neon-btn" id="wordchainCloseBtn">Đóng</button>
        </div>
      `;
      document.getElementById('wordchainCloseBtn').onclick = () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
      };
    }
  } else if (game.winner === opponent.username) {
    // Thua: mất số xu cược
    if (player.bet > 0) {
      await db.ref("users/" + keyify(me.username) + "/coins").set(playerCoins - player.bet);
      await addLog(`Tài khoản ${me.role}: "${me.username}" thua game Nối từ, mất ${player.bet} xu lúc ${nowVN()}`);
    }
    
    const gamePlay = document.getElementById('wordchainGamePlay');
    if (gamePlay) {
      gamePlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #ff4444; font-size: 20px;">${message}</p>
          ${player.bet > 0 ? `<p style="color: #ff8888;">Mất ${player.bet} xu</p>` : ''}
          <button class="neon-btn" id="wordchainCloseBtn">Đóng</button>
        </div>
      `;
      document.getElementById('wordchainCloseBtn').onclick = () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
      };
    }
  }
  
  // Xóa game sau 5 phút
  setTimeout(() => {
    delete wordChainGames[gameId];
  }, 300000);
}

// Hàm kiểm tra game status (gọi mỗi 2 giây)
function checkWordChainGameStatus() {
  const now = Date.now();
  for (const [gameId, game] of Object.entries(wordChainGames)) {
    // Nếu không có hoạt động trong 30 giây
    if (now - game.lastActivity > 30000 && game.status !== 'finished') {
      // Xác định người thắng là người chơi cuối cùng
      if (game.lastPlayer) {
        game.winner = game.lastPlayer;
        game.status = 'finished';
        endWordChainGame(gameId);
      }
    }
  }
}

// Khởi tạo interval kiểm tra game
setInterval(checkWordChainGameStatus, 5000);
