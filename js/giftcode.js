// ===== Giftcode =====

const RANDOM_REWARD_TABLE = [
  { type: "coins", amount: 100, rate: 0.75 },
  { type: "coins", amount: 200, rate: 0.75 },
  { type: "coins", amount: 500, rate: 0.50 },
  { type: "coins", amount: 10000, rate: 0.42 },
  { type: "coins", amount: 50000, rate: 0.15 },
  { type: "onyx", amount: 100, rate: 0.10 },
  { type: "onyx", amount: 200, rate: 0.08 },
  { type: "onyx", amount: 10000, rate: 0.02 },
  { type: "onyx", amount: 50000, rate: 0.00004 }
];

function renderGiftcodeTab(container) {
  container.innerHTML = `
    <div class="gc-grid">
      <div>
        <h3 class="neon-title-sm">Giftcode bất kì</h3>
        <p class="dim-text">Hạn sử dụng 48h, dùng được 1 lần. Phần thưởng random theo tỉ lệ khi người chơi nhập.</p>
        <button class="neon-btn" id="createRandomGcBtn">Tạo giftcode</button>
        <div id="randomGcResult" class="result-box"></div>
      </div>
      <div>
        <h3 class="neon-title-sm">Giftcode vĩnh viễn</h3>
        <div class="form-row">
          <label>Phần thưởng</label>
          <select id="permGcType" class="neon-input">
            <option value="coins">Xu</option>
            <option value="onyx">Onyx</option>
          </select>
        </div>
        <div class="form-row">
          <label>Số lượng</label>
          <input id="permGcAmount" class="neon-input" type="number" min="1" placeholder="Ví dụ: 100">
        </div>
        <div class="form-row">
          <label>Tên giftcode (BLACK=xxxxxxx)</label>
          <input id="permGcName" class="neon-input" maxlength="7" placeholder="7 ký tự chữ/số">
        </div>
        <button class="neon-btn" id="createPermGcBtn">Tạo giftcode</button>
        <div id="permGcResult" class="result-box"></div>
      </div>
    </div>
  `;

  container.querySelector("#createRandomGcBtn").onclick = async () => {
    const me = getCurrentUser();
    const { code, key } = await genUniqueGiftcode("giftcodes_random");
    const createdAt = Date.now();
    const expiresAt = createdAt + 48 * 3600 * 1000;
    await db.ref("giftcodes_random/" + key).set({ code, createdAt, expiresAt, used: false, usedBy: null, createdBy: me.username });
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo giftcode bất kì ${code} lúc ${nowVN()}`);
    container.querySelector("#randomGcResult").innerHTML = `<p>Tạo thành công!</p><p>Giftcode: <b class="glow-text">${code}</b></p>`;
  };

  container.querySelector("#createPermGcBtn").onclick = async () => {
    const me = getCurrentUser();
    const type = container.querySelector("#permGcType").value;
    const amount = Number(container.querySelector("#permGcAmount").value);
    const name = container.querySelector("#permGcName").value.trim();
    if (!amount || amount <= 0) { toast("Vui lòng nhập số lượng hợp lệ!"); return; }
    if (!/^[A-Za-z0-9]{7}$/.test(name)) { toast("Tên giftcode phải gồm đúng 7 ký tự chữ/số!"); return; }
    const code = "BLACK=" + name;
    const key = keyify(code);
    const exists = await db.ref("giftcodes_perm/" + key).get();
    if (exists.exists()) { toast("Tên giftcode đã tồn tại!"); return; }

    await db.ref("giftcodes_perm/" + key).set({
      code, type, amount, createdBy: me.username, createdAt: Date.now(), usedBy: {}
    });
    await addLog(`Tài khoản ${me.role}: "${me.username}" đã tạo giftcode vĩnh viễn ${code} (${amount} ${type === "coins" ? "Xu" : "Onyx"}) lúc ${nowVN()}`);
    container.querySelector("#permGcResult").innerHTML = `<p>Tạo thành công!</p><p>Giftcode: <b class="glow-text">${code}</b></p>`;
    container.querySelector("#permGcName").value = "";
    container.querySelector("#permGcAmount").value = "";
  };
}

// Nhập giftcode (dành cho user ở trang chủ) - tự nhận diện loại random hay vĩnh viễn
async function redeemGiftcode(rawCode) {
  const code = rawCode.trim();
  const key = keyify(code);
  const me = getCurrentUser();

  // Thử giftcode vĩnh viễn trước
  const permSnap = await db.ref("giftcodes_perm/" + key).get();
  if (permSnap.exists()) {
    const gc = permSnap.val();
    const used = gc.usedBy && gc.usedBy[keyify(me.username)];
    if (used) return { ok: false, msg: "Giftcode đã được sử dụng" };
    await db.ref(`giftcodes_perm/${key}/usedBy/${keyify(me.username)}`).set(true);
    const field = gc.type === "coins" ? "coins" : "onyx";
    const curSnap = await db.ref(`users/${keyify(me.username)}/${field}`).get();
    const cur = curSnap.exists() ? curSnap.val() : 0;
    await db.ref(`users/${keyify(me.username)}/${field}`).set(cur + gc.amount);
    await addLog(`Tài khoản user: "${me.username}" đã nhập giftcode vĩnh viễn ${code} (+${gc.amount} ${gc.type === "coins" ? "Xu" : "Onyx"}) lúc ${nowVN()}`);
    return { ok: true, msg: `Nhận được ${gc.amount} ${gc.type === "coins" ? "Xu" : "Onyx"}!` };
  }

  // Giftcode bất kì
  const randSnap = await db.ref("giftcodes_random/" + key).get();
  if (randSnap.exists()) {
    const gc = randSnap.val();
    if (gc.used) return { ok: false, msg: "Giftcode đã được sử dụng" };
    if (gc.expiresAt <= Date.now()) {
      await db.ref("giftcodes_random/" + key).remove();
      return { ok: false, msg: "Giftcode không hợp lệ hoặc đã hết hạn" };
    }
    // Roll thưởng theo tỉ lệ độc lập từng mục
    let coinsWon = 0, onyxWon = 0;
    RANDOM_REWARD_TABLE.forEach(r => {
      if (Math.random() < r.rate) {
        if (r.type === "coins") coinsWon += r.amount; else onyxWon += r.amount;
      }
    });
    await db.ref("giftcodes_random/" + key + "/used").set(true);
    await db.ref("giftcodes_random/" + key + "/usedBy").set(me.username);

    if (coinsWon > 0) {
      const cSnap = await db.ref(`users/${keyify(me.username)}/coins`).get();
      await db.ref(`users/${keyify(me.username)}/coins`).set((cSnap.exists() ? cSnap.val() : 0) + coinsWon);
    }
    if (onyxWon > 0) {
      const oSnap = await db.ref(`users/${keyify(me.username)}/onyx`).get();
      await db.ref(`users/${keyify(me.username)}/onyx`).set((oSnap.exists() ? oSnap.val() : 0) + onyxWon);
    }
    await addLog(`Tài khoản user: "${me.username}" đã nhập giftcode ${code} (+${coinsWon} Xu, +${onyxWon} Onyx) lúc ${nowVN()}`);
    return { ok: true, msg: `Chúc mừng! Nhận được ${coinsWon} Xu và ${onyxWon} Onyx.` };
  }

  return { ok: false, msg: "Giftcode không hợp lệ" };
}
