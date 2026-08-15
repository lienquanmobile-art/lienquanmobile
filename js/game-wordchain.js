// ===== Game Nối từ =====

console.log("=== game-wordchain.js đang được load ===");

// Lưu trữ thông tin game trên Firebase
const WORDCHAIN_QUEUE = "wordchain_queue";
const WORDCHAIN_GAMES = "wordchain_games";

function renderWordChainCard(container) {
  console.log("renderWordChainCard được gọi");
  
  if (!container) {
    console.error("container is null");
    return;
  }
  
  container.innerHTML = "";
  const card = el("div", "snake-launch-box");
  card.innerHTML = `<div class="snake-icon">📝</div><div class="snake-label">NỐI TỪ</div>`;
  card.onclick = () => openWordChainGame();
  container.appendChild(card);
  console.log("Đã render game Nối từ");
  
  // Lắng nghe sự kiện ghép cặp
  listenForWordChainMatch();
}

function openWordChainGame() {
  console.log("openWordChainGame được gọi");
  
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
    
    // Thêm vào hàng đợi trên Firebase
    await db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).set({
      username: me.username,
      role: me.role,
      bet: bet,
      timestamp: Date.now()
    });
    
    // Bắt đầu lắng nghe sự kiện ghép cặp
    listenForWordChainMatch(me.username);
  };
}

function cancelWordChainSearch() {
  const me = getCurrentUser();
  if (!me) return;
  
  // Xóa khỏi hàng đợi trên Firebase
  db.ref(WORDCHAIN_QUEUE + "/" + keyify(me.username)).remove();
}

function listenForWordChainMatch(username) {
  // Lắng nghe sự thay đổi trên node game
  const gameRef = db.ref(WORDCHAIN_GAMES);
  gameRef.on("child_added", async (snapshot) => {
    const gameId = snapshot.key;
    const game = snapshot.val();
    
    // Kiểm tra xem người chơi có trong game này không
    if (game.player1.username === username || game.player2.username === username) {
      // Dừng lắng nghe
      gameRef.off();
      
      // Xóa khỏi hàng đợi
      await db.ref(WORDCHAIN_QUEUE + "/" + keyify(username)).remove();
      
      // Thông báo đã ghép cặp
      toast("Đã ghép cặp thành công!");
      
      // Mở game
      openWordChainGameForPlayers(gameId, username);
    }
  });
}

function openWordChainGameForPlayers(gameId, username) {
  const modal = document.querySelector('.modal-overlay');
  if (!modal) {
    // Nếu modal đã bị đóng, tạo mới
    openWordChainGame();
    setTimeout(() => {
      openWordChainGameForPlayers(gameId, username);
    }, 500);
    return;
  }
  
  // Lấy dữ liệu game từ Firebase
  db.ref(WORDCHAIN_GAMES + "/" + gameId).on("value", async (snapshot) => {
    const game = snapshot.val();
    if (!game) return;
    
    const me = getCurrentUser();
    if (!me) return;
    
    // Xác định người chơi
    const isPlayer1 = me.username === game.player1.username;
    const isPlayer2 = me.username === game.player2.username;
    
    if (!isPlayer1 && !isPlayer2) return;
    
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
      
      // Kiểm tra game đã kết thúc
      if (game.status === 'finished') {
        gamePlay.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p style="color: ${game.winner === me.username ? '#5dff8f' : '#ff4444'}; font-size: 20px;">
              ${game.winner === me.username ? '🎉 Bạn đã thắng!' : `😢 Bạn đã thua. Người thắng: ${game.winner}`}
            </p>
            <button class="neon-btn" id="wordchainCloseBtn">Đóng</button>
          </div>
        `;
        document.getElementById('wordchainCloseBtn').onclick = () => {
          modal.remove();
          // Xóa game khỏi Firebase
          db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
        };
        return;
      }
      
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
  });
}

async function handleWordChainSubmit(gameId, username) {
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

// Hàm kiểm tra và tự động kết thúc game khi không hoạt động
function checkWordChainGames() {
  db.ref(WORDCHAIN_GAMES).once("value", (snapshot) => {
    const games = snapshot.val();
    if (!games) return;
    
    const now = Date.now();
    for (const [gameId, game] of Object.entries(games)) {
      // Nếu không có hoạt động trong 30 giây và game chưa kết thúc
      if (now - game.lastActivity > 30000 && game.status !== 'finished') {
        // Xác định người thắng là người chơi cuối cùng
        if (game.lastPlayer) {
          db.ref(WORDCHAIN_GAMES + "/" + gameId + "/winner").set(game.lastPlayer);
          db.ref(WORDCHAIN_GAMES + "/" + gameId + "/status").set("finished");
          
          // Xóa sau 5 phút
          setTimeout(() => {
            db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
          }, 300000);
        }
      }
    }
  });
}

// Kiểm tra mỗi 5 giây
setInterval(checkWordChainGames, 5000);

console.log("game-wordchain.js đã được load!");
