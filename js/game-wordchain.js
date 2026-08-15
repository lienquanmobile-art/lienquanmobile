// ===== Game Nối từ =====

console.log("=== game-wordchain.js đang được load ===");

// Khai báo biến toàn cục
const WORDCHAIN_QUEUE = "wordchain_queue";
const WORDCHAIN_GAMES = "wordchain_games";
let currentGameListener = null;
let currentQueueListener = null;
let currentGameId = null;

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
  
  // Đóng modal cũ nếu có
  const oldModal = document.querySelector('.modal-overlay');
  if (oldModal) {
    // Dừng listener cũ
    if (currentGameListener) {
      currentGameListener.off();
      currentGameListener = null;
    }
    if (currentQueueListener) {
      currentQueueListener.off();
      currentQueueListener = null;
    }
    oldModal.remove();
  }
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "wordchainModal";
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
    currentGameId = null;
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
    
    // Bắt đầu lắng nghe game - kiểm tra xem đã có game nào ghép cho mình chưa
    listenForMyGame(me.username);
    
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
  if (currentGameListener) {
    currentGameListener.off();
    currentGameListener = null;
  }
}

// Lắng nghe game mới được tạo cho mình
function listenForMyGame(username) {
  if (currentGameListener) {
    currentGameListener.off();
    currentGameListener = null;
  }
  
  // Lắng nghe tất cả game mới được tạo
  currentGameListener = db.ref(WORDCHAIN_GAMES);
  currentGameListener.on("child_added", (snapshot) => {
    const gameId = snapshot.key;
    const game = snapshot.val();
    
    // Kiểm tra xem mình có trong game này không
    if (game.player1.username === username || game.player2.username === username) {
      console.log("Phát hiện game mới cho", username, "gameId:", gameId);
      
      // Dừng lắng nghe game mới
      currentGameListener.off();
      currentGameListener = null;
      
      // Xóa khỏi hàng đợi
      db.ref(WORDCHAIN_QUEUE + "/" + keyify(username)).remove();
      
      // Lưu gameId
      currentGameId = gameId;
      
      // Thông báo
      toast("✅ Đã ghép cặp thành công!");
      
      // Cập nhật giao diện
      const modal = document.getElementById('wordchainModal');
      if (modal) {
        const status = modal.querySelector('#wordchainStatus');
        if (status) {
          status.innerHTML = `<p style="color: #5dff8f;">✅ Đã ghép cặp thành công!</p>`;
        }
      }
      
      // Mở game
      openGame(gameId);
    }
  });
}

function listenForMatch(username) {
  // Dừng listener cũ
  if (currentQueueListener) {
    currentQueueListener.off();
    currentQueueListener = null;
  }
  
  // Lắng nghe hàng đợi để ghép cặp
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
      console.log("Ghép cặp:", username, "vs", opponent.username);
      
      // Xóa cả 2 khỏi hàng đợi
      await db.ref(WORDCHAIN_QUEUE + "/" + keyify(username)).remove();
      await db.ref(WORDCHAIN_QUEUE + "/" + keyify(opponent.username)).remove();
      
      // Dừng lắng nghe queue
      if (currentQueueListener) {
        currentQueueListener.off();
        currentQueueListener = null;
      }
      
      // Tạo game mới
      const gameId = "wc_" + Date.now();
      const randomWord = getRandomWord();
      
      // Random người chơi bắt đầu
      const firstPlayer = Math.random() < 0.5 ? username : opponent.username;
      
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
        currentTurn: firstPlayer,
        lastPlayer: null,
        status: "playing",
        winner: null,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      
      // Lưu game lên Firebase
      await db.ref(WORDCHAIN_GAMES + "/" + gameId).set(gameData);
      
      // Không cần gọi openGame ở đây vì listenForMyGame sẽ bắt được
    }
  });
}

function openGame(gameId) {
  console.log("openGame được gọi với gameId:", gameId);
  
  // Dừng listener game cũ
  if (currentGameListener) {
    currentGameListener.off();
    currentGameListener = null;
  }
  
  // Tìm modal
  const modal = document.getElementById('wordchainModal');
  if (!modal) {
    console.error("Không tìm thấy modal");
    return;
  }
  
  // Lắng nghe game cụ thể
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
    
    // KIỂM TRA GAME ĐÃ KẾT THÚC
    if (game.status === 'finished') {
      const isWinner = game.winner === me.username;
      
      // Tính thưởng
      let rewardText = '';
      if (isWinner) {
        let reward = player.bet * 2;
        if (opponent.role === "admin" || opponent.role === "owner") {
          reward += 200;
        }
        rewardText = reward > 0 ? `<p style="color: var(--neon-yellow);">🎉 Nhận được ${reward} xu!</p>` : '<p style="color: #888;">Không nhận xu (Admin/Owner)</p>';
      } else {
        rewardText = player.bet > 0 ? `<p style="color: #ff8888;">Mất ${player.bet} xu</p>` : '<p style="color: #888;">Không mất xu (Admin/Owner)</p>';
      }
      
      const gamePlay = document.getElementById('wordchainGamePlay');
      if (gamePlay) {
        gamePlay.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p style="color: ${isWinner ? '#5dff8f' : '#ff4444'}; font-size: 20px;">
              ${isWinner ? '🎉 Bạn đã thắng!' : `😢 Bạn đã thua. Người thắng: ${game.winner}`}
            </p>
            ${rewardText}
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
            currentGameId = null;
            db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
          };
        }
      }
      return;
    }
    
    // Cập nhật game info
    const gameInfo = document.getElementById('wordchainGameInfo');
    if (gameInfo) {
      const p1Bet = game.player1.bet > 0 ? game.player1.bet + ' xu' : 'Không cược';
      const p2Bet = game.player2.bet > 0 ? game.player2.bet + ' xu' : 'Không cược';
      gameInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,255,224,0.05); border-radius: 8px; margin-bottom: 10px;">
          <span style="color: var(--neon-cyan);">${game.player1.username} (${p1Bet})</span>
          <span style="color: var(--neon-pink);">VS</span>
          <span style="color: var(--neon-yellow);">${game.player2.username} (${p2Bet})</span>
        </div>
        <div style="text-align: center; padding: 10px; background: rgba(255,45,157,0.05); border-radius: 8px; margin-bottom: 10px;">
          <span style="font-size: 24px; color: var(--neon-yellow); font-weight: bold;">📝 ${game.currentWord}</span>
        </div>
      `;
    }
    
    // Cập nhật game play
    const gamePlay = document.getElementById('wordchainGamePlay');
    if (gamePlay) {
      const isMyTurn = game.currentTurn === me.username;
      const lastWord = getLastWord(game.currentWord);
      
      // Nếu là lượt của mình
      if (isMyTurn) {
        gamePlay.innerHTML = `
          <div style="text-align: center; padding: 10px; margin-bottom: 10px;">
            <span style="color: #5dff8f; font-size: 16px;">🟢 Lượt của bạn</span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
            <span style="color: var(--neon-cyan); font-size: 20px; font-weight: bold;">${lastWord}</span>
            <span style="color: #888; font-size: 20px;">|</span>
            <input id="wordchainInput" class="neon-input" placeholder="Nhập từ nối..." style="flex: 1; min-width: 150px; font-size: 16px;">
            <button class="neon-btn" id="wordchainSubmitBtn" style="font-size: 16px;">
              OK
            </button>
          </div>
          <div id="wordchainMessage" class="result-box" style="margin-top: 10px;"></div>
        `;
        
        const submitBtn = document.getElementById('wordchainSubmitBtn');
        const input = document.getElementById('wordchainInput');
        
        submitBtn.onclick = () => handleSubmit(gameId, me.username);
        input.onkeypress = (e) => {
          if (e.key === 'Enter') {
            handleSubmit(gameId, me.username);
          }
        };
        
        setTimeout(() => {
          input.focus();
        }, 100);
        
      } else {
        // Không phải lượt của mình
        const opponentName = game.currentTurn;
        gamePlay.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 20px; color: var(--neon-cyan); margin-bottom: 10px;">
              ${game.currentWord}
            </div>
            <div style="font-size: 16px; color: #ffaa00;">
              ⏳ <b>${opponentName}</b> đang trả lời...
            </div>
            <div style="margin-top: 10px; font-size: 14px; color: #888;">
              (Từ cuối: <b style="color: var(--neon-cyan);">${lastWord}</b>)
            </div>
          </div>
        `;
      }
    }
  });
}

async function handleSubmit(gameId, username) {
  const me = getCurrentUser();
  if (!me || me.username !== username) return;
  
  const snap = await db.ref(WORDCHAIN_GAMES + "/" + gameId).get();
  const game = snap.val();
  if (!game) {
    toast("Game không tồn tại!");
    return;
  }
  
  if (game.currentTurn !== username) {
    toast("Không phải lượt của bạn!");
    return;
  }
  
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
  
  const isValid = isValidConnection(game.currentWord, newWord);
  if (!isValid) {
    toast("❌ Từ nối không hợp lệ!");
    const msgDiv = document.getElementById('wordchainMessage');
    if (msgDiv) {
      msgDiv.innerHTML = `<p style="color: #ff4444;">❌ Từ nối không hợp lệ!</p>`;
      setTimeout(() => {
        msgDiv.innerHTML = '';
      }, 2000);
    }
    return;
  }
  
  const nextTurn = (game.player1.username === username) ? game.player2.username : game.player1.username;
  
  await db.ref(WORDCHAIN_GAMES + "/" + gameId).update({
    currentWord: newWord,
    lastPlayer: username,
    currentTurn: nextTurn,
    lastActivity: Date.now()
  });
  
  input.value = '';
  
  const msgDiv = document.getElementById('wordchainMessage');
  if (msgDiv) {
    msgDiv.innerHTML = `<p style="color: #5dff8f;">✅ Đã nối từ thành công!</p>`;
    setTimeout(() => {
      msgDiv.innerHTML = '';
    }, 1500);
  }
}

function checkInactiveGames() {
  db.ref(WORDCHAIN_GAMES).once("value", async (snapshot) => {
    const games = snapshot.val();
    if (!games) return;
    
    const now = Date.now();
    for (const [gameId, game] of Object.entries(games)) {
      if (game.status === 'playing' && now - game.lastActivity > 60000) {
        const winner = game.lastPlayer || game.player1.username;
        await db.ref(WORDCHAIN_GAMES + "/" + gameId + "/winner").set(winner);
        await db.ref(WORDCHAIN_GAMES + "/" + gameId + "/status").set("finished");
        
        const winnerPlayer = game.player1.username === winner ? game.player1 : game.player2;
        const loserPlayer = game.player1.username === winner ? game.player2 : game.player1;
        
        if (winnerPlayer.bet > 0) {
          const winnerSnap = await db.ref("users/" + keyify(winner) + "/coins").get();
          const winnerCoins = winnerSnap.exists() ? winnerSnap.val() : 0;
          let reward = winnerPlayer.bet * 2;
          if (loserPlayer.role === "admin" || loserPlayer.role === "owner") {
            reward += 200;
          }
          await db.ref("users/" + keyify(winner) + "/coins").set(winnerCoins + reward);
        }
        
        if (loserPlayer.bet > 0) {
          const loserSnap = await db.ref("users/" + keyify(loserPlayer.username) + "/coins").get();
          const loserCoins = loserSnap.exists() ? loserSnap.val() : 0;
          await db.ref("users/" + keyify(loserPlayer.username) + "/coins").set(loserCoins - loserPlayer.bet);
        }
        
        setTimeout(() => {
          db.ref(WORDCHAIN_GAMES + "/" + gameId).remove();
        }, 300000);
      }
    }
  });
}

setInterval(checkInactiveGames, 10000);

console.log("game-wordchain.js đã được load!");
