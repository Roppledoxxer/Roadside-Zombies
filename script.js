const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

const keys = {};
const mouse = { x: W / 2, y: H / 2, down: false };
let controlMode = "pc";

/* =========================
   BACKGROUND MUSIC
========================= */

const bgMusic = document.getElementById("bgMusic");

bgMusic.loop = true;
bgMusic.volume = 0.45;

/*
  Starts the music.
  Browsers allow this because this function is called
  from the player's Start/Restart button click.
*/
function startMusic() {
  bgMusic.currentTime = 0;

  bgMusic.play().catch(err => {
    console.log("Background music could not start:", err);
  });
}

function stopMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

/* =========================
   GAME CONSTANTS
========================= */

const START = {
  playerX: W / 2,
  playerY: H - 145
};

const hut = {
  x: 40,
  y: H - 185,
  w: 275,
  h: 130
};

const sellZone = {
  x: 62,
  y: H - 163,
  w: 100,
  h: 72
};

const shopZone = {
  x: 183,
  y: H - 163,
  w: 108,
  h: 72
};

const ROAD = {
  x: W / 2 - 165,
  w: 330
};

const MAX_WORLD_Y = 2400;
const MIN_WORLD_Y = 90;

const weapons = {
  pistol: {
    name: "Pistol",
    damage: 1,
    fireDelay: 320,
    pellets: 1,
    spread: 0.03,
    bulletSpeed: 900,
    cost: 0,
    color: "#e4d9ac",
    auto: false,
    range: 800
  },

  shotgun: {
    name: "Shotgun",
    damage: 1,
    fireDelay: 620,
    pellets: 7,
    spread: 0.42,
    bulletSpeed: 780,
    cost: 30,
    color: "#f7d47a",
    auto: false,
    range: 650
  },

  rifle: {
    name: "Rifle",
    damage: 2,
    fireDelay: 165,
    pellets: 1,
    spread: 0.035,
    bulletSpeed: 1050,
    cost: 50,
    color: "#c5d1dd",
    auto: false,
    range: 1050
  },

  minigun: {
    name: "Minigun",
    damage: 1,
    fireDelay: 75,
    pellets: 1,
    spread: 0.11,
    bulletSpeed: 950,
    cost: 150,
    color: "#f5a95f",
    auto: true,
    range: 900
  }
};

const MAX_SLOTS = 3;
const MAX_STACK = 10;

const lootTypes = [
  {
    type: "boot",
    icon: "👢",
    name: "BOOT",
    value: 1,
    weight: 55
  },

  {
    type: "flesh",
    icon: "🥩",
    name: "FLESH",
    value: 0,
    weight: 30
  },

  {
    type: "gold",
    icon: "🪙",
    name: "GOLD",
    value: 10,
    weight: 15
  }
];

let game = {
  running: false,
  dead: false,

  money: 0,

  health: 3,
  maxHealth: 3,

  selectedWeapon: "pistol",

  ownedWeapons: {
    pistol: true,
    shotgun: false,
    rifle: false,
    minigun: false
  },

  inventory: [],

  player: {
    x: START.playerX,
    y: START.playerY,
    speed: 185,
    facing: 0,
    hurtTimer: 0
  },

  zombies: [],
  bullets: [],
  drops: [],
  particles: [],

  spawnTimer: 0,
  spawnRate: 1.35,

  kills: 0,
  elapsed: 0,
  lastShot: 0,
  toastTimer: 0
};

/* =========================
   RESET / START GAME
========================= */

function resetGame() {
  game.running = true;
  game.dead = false;

  game.money = 0;

  game.health = 3;
  game.maxHealth = 3;

  game.selectedWeapon = "pistol";

  game.ownedWeapons = {
    pistol: true,
    shotgun: false,
    rifle: false,
    minigun: false
  };

  game.inventory = [];

  game.player = {
    x: START.playerX,
    y: START.playerY,
    speed: 185,
    facing: -Math.PI / 2,
    hurtTimer: 0
  };

  game.zombies = [];
  game.bullets = [];
  game.drops = [];
  game.particles = [];

  game.spawnTimer = 0;
  game.spawnRate = 1.35;

  game.kills = 0;
  game.elapsed = 0;
  game.lastShot = 0;
  game.toastTimer = 0;

  mouse.down = false;

  for (const k in keys) {
    keys[k] = false;
  }

  document
    .querySelectorAll(".touchBtn")
    .forEach(btn => btn.classList.remove("pressed"));

  mobileControls.classList.toggle(
    "hidden",
    controlMode !== "mobile"
  );

  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("deathScreen").classList.add("hidden");

  /* START MUSIC */
  startMusic();

  showToast("Survive the road.");
  updateUI();
}

/* =========================
   BUTTONS
========================= */

document.getElementById("startBtn").onclick = resetGame;
document.getElementById("restartBtn").onclick = resetGame;
document.getElementById("closeShopBtn").onclick = closeShop;

const pcModeBtn = document.getElementById("pcModeBtn");
const mobileModeBtn = document.getElementById("mobileModeBtn");
const pcControls = document.getElementById("pcControls");
const mobileControlsInfo =
  document.getElementById("mobileControlsInfo");
const mobileControls =
  document.getElementById("mobileControls");

/* =========================
   CONTROL MODE
========================= */

function setControlMode(mode) {
  controlMode = mode;

  const isMobile = mode === "mobile";

  pcModeBtn.classList.toggle("active", !isMobile);
  mobileModeBtn.classList.toggle("active", isMobile);

  pcControls.classList.toggle(
    "hiddenControlInfo",
    isMobile
  );

  mobileControlsInfo.classList.toggle(
    "hiddenControlInfo",
    !isMobile
  );

  mobileControls.classList.toggle(
    "hidden",
    !isMobile
  );

  if (!isMobile) {
    mouse.down = false;

    for (const k in keys) {
      keys[k] = false;
    }
  }
}

pcModeBtn.onclick = () => setControlMode("pc");
mobileModeBtn.onclick = () => setControlMode("mobile");

/* =========================
   KEYBOARD
========================= */

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (
    [
      "w",
      "a",
      "s",
      "d",
      "e",
      "1",
      "2",
      "3",
      "4",
      " "
    ].includes(e.key.toLowerCase())
  ) {
    e.preventDefault();
  }

  if (!game.running || game.dead) return;

  if (e.key === "Escape") {
    closeShop();
    return;
  }

  if (e.key === "1") {
    selectWeapon("pistol");
  }

  if (e.key === "2") {
    selectWeapon("shotgun");
  }

  if (e.key === "3") {
    selectWeapon("rifle");
  }

  if (e.key === "4") {
    selectWeapon("minigun");
  }

  if (
    e.key.toLowerCase() === "e" &&
    document
      .getElementById("shopMenu")
      .classList.contains("hidden")
  ) {
    interact();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

/* =========================
   MOUSE
========================= */

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();

  mouse.x =
    (e.clientX - rect.left) * W / rect.width;

  mouse.y =
    (e.clientY - rect.top) * H / rect.height;
});

canvas.addEventListener("mousedown", e => {
  if (controlMode === "pc" && e.button === 0) {
    mouse.down = true;
  }
});

canvas.addEventListener("mouseup", e => {
  if (e.button === 0) {
    mouse.down = false;
  }
});

/* =========================
   ZOMBIE TARGETING
========================= */

function getNearestZombie() {
  let nearest = null;
  let nearestDist = Infinity;

  for (const z of game.zombies) {
    const dx = z.x - game.player.x;
    const dy = z.y - game.player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = z;
    }
  }

  return nearest;
}

/* =========================
   MOBILE SHOOTING
========================= */

function mobileShootStart(e) {
  e.preventDefault();

  if (
    !game.running ||
    game.dead ||
    controlMode !== "mobile"
  ) {
    return;
  }

  document
    .getElementById("mobileShoot")
    .classList.add("pressed");

  mouse.down = true;

  const target = getNearestZombie();

  if (target) {
    mouse.x = target.x;
    mouse.y = target.y;
  } else {
    mouse.x =
      game.player.x +
      Math.cos(game.player.facing) * 400;

    mouse.y =
      game.player.y +
      Math.sin(game.player.facing) * 400;
  }

  shoot();
}

function mobileShootEnd(e) {
  e.preventDefault();

  document
    .getElementById("mobileShoot")
    .classList.remove("pressed");

  mouse.down = false;
}

const mobileShootBtn =
  document.getElementById("mobileShoot");

mobileShootBtn.addEventListener(
  "pointerdown",
  mobileShootStart
);

window.addEventListener(
  "pointerup",
  mobileShootEnd
);

window.addEventListener(
  "pointercancel",
  mobileShootEnd
);

/* =========================
   MOBILE USE
========================= */

document
  .getElementById("mobileUse")
  .addEventListener("pointerdown", e => {
    e.preventDefault();

    if (
      !game.running ||
      game.dead ||
      controlMode !== "mobile"
    ) {
      return;
    }

    const shopHidden =
      document
        .getElementById("shopMenu")
        .classList.contains("hidden");

    if (shopHidden) {
      interact();
    } else {
      closeShop();
    }
  });

/* =========================
   MOBILE MOVEMENT
========================= */

for (
  const button of document.querySelectorAll(".dpad")
) {
  const key = button.dataset.key;

  const press = e => {
    e.preventDefault();

    if (controlMode !== "mobile") return;

    button.classList.add("pressed");
    keys[key] = true;
  };

  const release = e => {
    e.preventDefault();

    button.classList.remove("pressed");
    keys[key] = false;
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

window.addEventListener("blur", () => {
  mouse.down = false;

  for (const k in keys) {
    keys[k] = false;
  }
});

/* =========================
   WEAPONS
========================= */

function selectWeapon(id) {
  if (!game.ownedWeapons[id]) {
    showToast(
      `YOU DON'T OWN THE ${weapons[id].name.toUpperCase()}`
    );

    return;
  }

  game.selectedWeapon = id;
  updateUI();
}

/* =========================
   ZONES / HUT
========================= */

function isInsideZone(p, z, pad = 0) {
  return (
    p.x >= z.x - pad &&
    p.x <= z.x + z.w + pad &&
    p.y >= z.y - pad &&
    p.y <= z.y + z.h + pad
  );
}

function inHut() {
  return (
    game.player.x > hut.x - 10 &&
    game.player.x < hut.x + hut.w + 10 &&
    game.player.y > hut.y - 10 &&
    game.player.y < hut.y + hut.h + 10
  );
}

/* =========================
   INTERACTION
========================= */

function interact() {
  if (
    isInsideZone(game.player, sellZone, 18)
  ) {
    sellInventory();
    return;
  }

  if (
    isInsideZone(game.player, shopZone, 18)
  ) {
    openShop();
    return;
  }

  showToast(
    "Move into a station and press E."
  );
}

function openShop() {
  document
    .getElementById("shopMenu")
    .classList.remove("hidden");

  renderShop();
}

function closeShop() {
  document
    .getElementById("shopMenu")
    .classList.add("hidden");
}

/* =========================
   SHOP
========================= */

function buyItem(id) {
  const prices = {
    health: 20,
    shotgun: 30,
    rifle: 50,
    minigun: 150
  };

  const price = prices[id];

  if (game.money < price) {
    showToast("NOT ENOUGH MONEY");
    return;
  }

  if (id === "health") {
    if (game.health >= game.maxHealth) {
      showToast(
        "YOUR HEALTH IS ALREADY FULL"
      );
      return;
    }

    game.money -= price;
    game.health++;

    showToast("+1 HEART PURCHASED");
  } else {
    if (game.ownedWeapons[id]) {
      showToast(
        "YOU ALREADY OWN THIS WEAPON"
      );
      return;
    }

    game.money -= price;
    game.ownedWeapons[id] = true;
    game.selectedWeapon = id;

    showToast(
      `${weapons[id].name.toUpperCase()} PURCHASED`
    );
  }

  renderShop();
  updateUI();
}

function renderShop() {
  const items = [
    {
      id: "health",
      icon: "♥",
      name: "MORE HEALTH",
      price: 20,
      desc: "+1 heart"
    },

    {
      id: "shotgun",
      icon: "🔫",
      name: "SHOTGUN",
      price: 30,
      desc: "7-pellet spread"
    },

    {
      id: "rifle",
      icon: "🎯",
      name: "RIFLE",
      price: 50,
      desc: "Powerful and accurate"
    },

    {
      id: "minigun",
      icon: "⚡",
      name: "MINIGUN",
      price: 150,
      desc: "Rapid automatic fire"
    }
  ];

  const container =
    document.getElementById("shopItems");

  container.innerHTML = "";

  for (const item of items) {
    const owned =
      item.id !== "health" &&
      game.ownedWeapons[item.id];

    const full =
      item.id === "health" &&
      game.health >= game.maxHealth;

    const b =
      document.createElement("button");

    b.className = "shopItem";

    b.disabled =
      owned ||
      full ||
      game.money < item.price;

    b.innerHTML =
      `<span class="shopIcon">${item.icon}</span>` +
      `<span class="shopInfo">` +
      `<strong>${item.name}</strong>` +
      `<small>${
        owned
          ? "OWNED"
          : full
          ? "HEALTH FULL"
          : item.desc
      }</small>` +
      `</span>` +
      `<span class="shopPrice">${
        owned
          ? "✓"
          : "$" + item.price
      }</span>`;

    b.onclick = () =>
      buyItem(item.id);

    container.appendChild(b);
  }

  document.getElementById(
    "shopMoney"
  ).textContent = `$${game.money}`;
}

/* =========================
   SELL
========================= */

function sellInventory() {
  if (!game.inventory.length) {
    showToast("Your inventory is empty.");
    return;
  }

  let earned = 0;
  let count = 0;

  for (const stack of game.inventory) {
    earned +=
      stack.value * stack.amount;

    count += stack.amount;
  }

  game.money += earned;
  game.inventory = [];

  showToast(
    `SOLD ${count} LOOT — +$${earned}`
  );

  updateUI();
}

/* =========================
   AUTO BUY
========================= */

function buyNextUsefulItem() {
  const options = [
    ["health", 20],
    ["shotgun", 30],
    ["rifle", 50],
    ["minigun", 150]
  ];

  if (
    game.health < game.maxHealth &&
    game.money >= 20
  ) {
    game.money -= 20;

    game.health =
      Math.min(
        game.maxHealth,
        game.health + 1
      );

    showToast("+1 HEART");
    updateUI();

    return;
  }

  for (
    const [item, cost]
    of options.slice(1)
  ) {
    if (
      !game.ownedWeapons[item] &&
      game.money >= cost
    ) {
      game.money -= cost;
      game.ownedWeapons[item] = true;

      selectWeapon(item);

      showToast(
        `${weapons[item].name.toUpperCase()} PURCHASED`
      );

      updateUI();

      return;
    }
  }

  if (game.money < 20) {
    showToast(
      "NOT ENOUGH MONEY — BOOT = $1, GOLD = $10"
    );
  } else {
    showToast(
      "BUYABLE UPGRADES: HEALTH / NEW GUNS"
    );
  }
}

/* =========================
   LOOT
========================= */

function randomLoot() {
  const total =
    lootTypes.reduce(
      (s, x) => s + x.weight,
      0
    );

  let r =
    Math.random() * total;

  for (const loot of lootTypes) {
    r -= loot.weight;

    if (r <= 0) {
      return loot;
    }
  }

  return lootTypes[0];
}

function addLoot(loot) {
  const stack =
    game.inventory.find(
      item =>
        item.type === loot.type &&
        item.amount < MAX_STACK
    );

  if (stack) {
    stack.amount++;

    showToast(
      `${loot.name} +1 — ${stack.amount}/${MAX_STACK}`
    );

    updateUI();

    return true;
  }

  if (
    game.inventory.length >= MAX_SLOTS
  ) {
    showToast(
      "INVENTORY FULL — RETURN TO THE HUT"
    );

    return false;
  }

  game.inventory.push({
    type: loot.type,
    icon: loot.icon,
    name: loot.name,
    value: loot.value,
    amount: 1
  });

  showToast(
    `${loot.name} COLLECTED 1/${MAX_STACK}`
  );

  updateUI();

  return true;
}

/* =========================
   SHOOTING
========================= */

function shoot() {
  const now =
    performance.now();

  const gun =
    weapons[game.selectedWeapon];

  if (
    now - game.lastShot <
    gun.fireDelay
  ) {
    return;
  }

  game.lastShot = now;

  const angBase =
    Math.atan2(
      mouse.y - game.player.y,
      mouse.x - game.player.x
    );

  game.player.facing = angBase;

  for (
    let i = 0;
    i < gun.pellets;
    i++
  ) {
    const ang =
      angBase +
      (Math.random() - 0.5) *
        gun.spread;

    game.bullets.push({
      x:
        game.player.x +
        Math.cos(ang) * 18,

      y:
        game.player.y +
        Math.sin(ang) * 18,

      vx:
        Math.cos(ang) *
        gun.bulletSpeed,

      vy:
        Math.sin(ang) *
        gun.bulletSpeed,

      life:
        gun.range /
        gun.bulletSpeed,

      damage: gun.damage,
      color: gun.color
    });
  }

  const recoil =
    gun.name === "Shotgun"
      ? 2
      : 0.5;

  game.player.x -=
    Math.cos(angBase) *
    recoil;

  game.player.y -=
    Math.sin(angBase) *
    recoil;

  for (
    let i = 0;
    i <
    (gun.name === "Shotgun"
      ? 5
      : 2);
    i++
  ) {
    addParticle(
      game.player.x +
        Math.cos(angBase) *
        20,

      game.player.y +
        Math.sin(angBase) *
        20,

      gun.color,
      0.25
    );
  }
}

/* =========================
   ZOMBIE SPAWNING
========================= */

function spawnZombie() {
  const fromSide =
    Math.random() < 0.22;

  let x;
  let y;

  if (fromSide) {
    const side =
      Math.random() < 0.5
        ? -1
        : 1;

    x =
      side < 0
        ? 25
        : W - 25;

    y = Math.max(
      MIN_WORLD_Y,
      game.player.y +
        (Math.random() - 0.5) *
          750
    );
  } else {
    x =
      ROAD.x +
      25 +
      Math.random() *
        (ROAD.w - 50);

    y = Math.max(
      MIN_WORLD_Y,
      game.player.y -
        (300 +
          Math.random() *
            750)
    );
  }

  if (y > hut.y - 40) {
    y =
      hut.y -
      50 -
      Math.random() *
        250;
  }

  const hp =
    2 +
    Math.floor(
      game.elapsed / 35
    );

  const speed =
    44 +
    Math.random() * 19 +
    Math.min(
      game.elapsed * 0.15,
      24
    );

  game.zombies.push({
    x,
    y,
    hp,
    maxHp: hp,
    speed,
    radius: 15,
    hitFlash: 0,
    attackCooldown: 0,
    wobble:
      Math.random() *
      Math.PI *
      2
  });
}

/* =========================
   DAMAGE / DEATH
========================= */

function hurtPlayer(amount) {
  if (
    game.player.hurtTimer > 0 ||
    game.dead
  ) {
    return;
  }

  game.player.hurtTimer = 0.8;

  game.health -= amount;

  addParticle(
    game.player.x,
    game.player.y,
    "#ff4f4f",
    0.45,
    15
  );

  if (game.health <= 0) {
    die();
  }

  updateUI();
}

function die() {
  game.dead = true;
  game.running = false;
  mouse.down = false;

  /* STOP MUSIC WHEN PLAYER DIES */
  stopMusic();

  document.getElementById(
    "deathStats"
  ).textContent =
    `You survived ${Math.floor(
      game.elapsed
    )} seconds and killed ${
      game.kills
    } zombies.`;

  document
    .getElementById("deathScreen")
    .classList.remove("hidden");
}

/* =========================
   UPDATE
========================= */

function update(dt) {
  if (
    !game.running ||
    game.dead
  ) {
    return;
  }

  game.elapsed += dt;

  game.player.hurtTimer =
    Math.max(
      0,
      game.player.hurtTimer - dt
    );

  const speedBoost =
    keys["shift"]
      ? 1.25
      : 1;

  let dx =
    (keys["d"] ? 1 : 0) -
    (keys["a"] ? 1 : 0);

  let dy =
    (keys["s"] ? 1 : 0) -
    (keys["w"] ? 1 : 0);

  if (dx || dy) {
    const len =
      Math.hypot(dx, dy) ||
      1;

    dx /= len;
    dy /= len;

    const moveSpeed =
      game.player.speed *
      speedBoost;

    game.player.x +=
      dx *
      moveSpeed *
      dt;

    game.player.y +=
      dy *
      moveSpeed *
      dt;
  }

  game.player.x =
    Math.max(
      18,
      Math.min(
        W - 18,
        game.player.x
      )
    );

  game.player.y =
    Math.max(
      MIN_WORLD_Y,
      Math.min(
        MAX_WORLD_Y,
        game.player.y
      )
    );

  if (
    controlMode === "mobile"
  ) {
    const target =
      getNearestZombie();

    if (target) {
      mouse.x = target.x;
      mouse.y = target.y;
    } else {
      mouse.x =
        game.player.x +
        Math.cos(
          game.player.facing
        ) *
          400;

      mouse.y =
        game.player.y +
        Math.sin(
          game.player.facing
        ) *
          400;
    }
  }

  game.player.facing =
    Math.atan2(
      mouse.y -
        game.player.y,
      mouse.x -
        game.player.x
    );

  if (mouse.down) {
    shoot();
  }

  game.spawnTimer -= dt;

  game.spawnRate =
    Math.max(
      0.42,
      1.35 -
        game.elapsed *
          0.0055
    );

  if (
    game.spawnTimer <= 0
  ) {
    const currentNear =
      game.zombies.length;

    if (currentNear < 22) {
      spawnZombie();
    }

    game.spawnTimer =
      game.spawnRate;
  }

  /* =========================
     BULLETS
  ========================= */

  for (
    let i =
      game.bullets.length - 1;
    i >= 0;
    i--
  ) {
    const b =
      game.bullets[i];

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    let hit = false;

    if (
      b.life <= 0 ||
      b.x < -20 ||
      b.x > W + 20 ||
      b.y < -30 ||
      b.y > H + 30
    ) {
      game.bullets.splice(i, 1);
      continue;
    }

    for (
      let j =
        game.zombies.length - 1;
      j >= 0;
      j--
    ) {
      const z =
        game.zombies[j];

      if (
        Math.hypot(
          b.x - z.x,
          b.y - z.y
        ) <
        z.radius + 3
      ) {
        z.hp -= b.damage;
        z.hitFlash = 0.12;

        addParticle(
          b.x,
          b.y,
          "#fff",
          0.2,
          6
        );

        hit = true;

        if (z.hp <= 0) {
          game.kills++;

          const loot =
            randomLoot();

          game.drops.push({
            x: z.x,
            y: z.y,
            item: loot,
            bob:
              Math.random() *
              6.28,
            pulse: 0
          });

          for (
            let p = 0;
            p < 8;
            p++
          ) {
            addParticle(
              z.x,
              z.y,
              "#a33",
              0.5,
              10
            );
          }

          game.zombies.splice(
            j,
            1
          );
        }

        break;
      }
    }

    if (hit) {
      game.bullets.splice(i, 1);
    }
  }

  /* =========================
     ZOMBIES
  ========================= */

  for (
    let i =
      game.zombies.length - 1;
    i >= 0;
    i--
  ) {
    const z =
      game.zombies[i];

    z.hitFlash =
      Math.max(
        0,
        z.hitFlash - dt
      );

    z.attackCooldown =
      Math.max(
        0,
        z.attackCooldown - dt
      );

    z.wobble +=
      dt * 7;

    const vx =
      game.player.x -
      z.x;

    const vy =
      game.player.y -
      z.y;

    const dist =
      Math.hypot(
        vx,
        vy
      ) || 1;

    let zx = vx / dist;
    let zy = vy / dist;

    const targetInHut =
      inHut() ||
      isInsideZone(
        game.player,
        hut,
        0
      );

    if (
      z.y >
        hut.y - 22 &&
      z.x >
        hut.x - 20 &&
      z.x <
        hut.x +
          hut.w +
          20
    ) {
      if (
        z.x <
        hut.x +
          hut.w / 2
      ) {
        zx = -1;
      } else {
        zx = 1;
      }

      zy *= 0.2;
    }

    z.x +=
      zx *
      z.speed *
      dt;

    z.y +=
      zy *
      z.speed *
      dt;

    if (
      !inHut() &&
      dist <
        z.radius + 13 &&
      z.attackCooldown <= 0
    ) {
      hurtPlayer(1);
      z.attackCooldown =
        0.7;
    }

    if (
      z.x > hut.x &&
      z.x <
        hut.x +
          hut.w &&
      z.y > hut.y &&
      z.y <
        hut.y +
          hut.h
    ) {
      const pushLeft =
        Math.abs(
          z.x -
            hut.x
        );

      const pushRight =
        Math.abs(
          z.x -
            (hut.x +
              hut.w)
        );

      z.x =
        pushLeft <
        pushRight
          ? hut.x - 18
          : hut.x +
              hut.w +
              18;
    }

    if (
      z.x < -60 ||
      z.x >
        W + 60 ||
      z.y < -80 ||
      z.y >
        MAX_WORLD_Y +
          100
    ) {
      game.zombies.splice(
        i,
        1
      );
    }
  }

  /* =========================
     LOOT PICKUP
  ========================= */

  for (
    let i =
      game.drops.length - 1;
    i >= 0;
    i--
  ) {
    const d =
      game.drops[i];

    d.bob +=
      dt * 3;

    d.pulse += dt;

    if (
      Math.hypot(
        game.player.x -
          d.x,
        game.player.y -
          d.y
      ) < 25
    ) {
      if (
        addLoot(d.item)
      ) {
        game.drops.splice(
          i,
          1
        );
      }
    }
  }

  updateParticles(dt);
  updateUI();
}

/* =========================
   PARTICLES
========================= */

function addParticle(
  x,
  y,
  color,
  life = 0.35,
  speed = 12
) {
  const a =
    Math.random() *
    Math.PI *
    2;

  game.particles.push({
    x,
    y,

    vx:
      Math.cos(a) *
      speed *
      (0.5 +
        Math.random()),

    vy:
      Math.sin(a) *
      speed *
      (0.5 +
        Math.random()),

    color,
    life,
    maxLife: life,

    size:
      2 +
      Math.random() *
        3
  });
}

function updateParticles(dt) {
  for (
    let i =
      game.particles.length - 1;
    i >= 0;
    i--
  ) {
    const p =
      game.particles[i];

    p.life -= dt;

    p.x +=
      p.vx * dt;

    p.y +=
      p.vy * dt;

    p.vx *= 0.97;
    p.vy *= 0.97;

    if (p.life <= 0) {
      game.particles.splice(
        i,
        1
      );
    }
  }
}

/* =========================
   DRAW
========================= */

function draw() {
  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  drawWorld();
  drawRoadside();
  drawHut();
  drawDrops();
  drawZombies();
  drawBullets();
  drawPlayer();
  drawParticles();
  drawCrosshair();

  const g =
    ctx.createRadialGradient(
      W / 2,
      H / 2,
      150,
      W / 2,
      H / 2,
      600
    );

  g.addColorStop(
    0,
    "rgba(0,0,0,0)"
  );

  g.addColorStop(
    1,
    "rgba(0,0,0,.38)"
  );

  ctx.fillStyle = g;
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  if (
    game.player.hurtTimer >
    0
  ) {
    ctx.fillStyle =
      `rgba(255,0,0,${game.player.hurtTimer * 0.15})`;

    ctx.fillRect(
      0,
      0,
      W,
      H
    );
  }
}

/* =========================
   WORLD
========================= */

function drawWorld() {
  ctx.fillStyle =
    "#4c5a3d";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  for (
    let y = 0;
    y < H;
    y += 26
  ) {
    for (
      let x = 0;
      x < W;
      x += 26
    ) {
      const seed =
        Math.sin(
          (x *
            12.9898 +
            y *
              78.233) *
            0.013
        ) *
        43758.5453;

      const r =
        seed -
        Math.floor(seed);

      if (r > 0.55) {
        ctx.fillStyle =
          r > 0.8
            ? "#465536"
            : "#536243";

        ctx.fillRect(
          x +
            (r * 16) |
              0,

          y +
            (r * 9) |
              0,

          3,
          2
        );
      }
    }
  }

  ctx.fillStyle =
    "#4a4a4a";

  ctx.fillRect(
    ROAD.x,
    0,
    ROAD.w,
    H
  );

  ctx.fillStyle =
    "#2b2b2b";

  ctx.fillRect(
    ROAD.x,
    0,
    8,
    H
  );

  ctx.fillRect(
    ROAD.x +
      ROAD.w -
      8,
    0,
    8,
    H
  );

  ctx.fillStyle =
    "#b9a85d";

  for (
    let y = -30;
    y < H;
    y += 58
  ) {
    ctx.fillRect(
      W / 2 - 3,
      y,
      6,
      30
    );
  }

  ctx.fillStyle =
    "#8d8d8d";

  for (
    let y = 12;
    y < H;
    y += 80
  ) {
    ctx.fillRect(
      ROAD.x - 20,
      y,
      8,
      18
    );

    ctx.fillRect(
      ROAD.x +
        ROAD.w +
        12,
      y + 30,
      8,
      18
    );
  }
}

/* =========================
   ROADSIDE
========================= */

function drawRoadside() {
  const objs = [
    {
      x: 340,
      y: 140,
      t: "rock"
    },

    {
      x: 820,
      y: 160,
      t: "rock"
    },

    {
      x: 360,
      y: 380,
      t: "tree"
    },

    {
      x: 780,
      y: 300,
      t: "tree"
    },

    {
      x: 330,
      y: 530,
      t: "crate"
    },

    {
      x: 850,
      y: 510,
      t: "crate"
    }
  ];

  for (const o of objs) {
    if (o.t === "rock") {
      ctx.fillStyle =
        "#5d625d";

      ctx.fillRect(
        o.x - 9,
        o.y - 6,
        18,
        12
      );

      ctx.fillStyle =
        "#737a72";

      ctx.fillRect(
        o.x - 4,
        o.y - 9,
        8,
        4
      );
    } else if (
      o.t === "tree"
    ) {
      ctx.fillStyle =
        "#40362b";

      ctx.fillRect(
        o.x - 6,
        o.y,
        12,
        28
      );

      ctx.fillStyle =
        "#243922";

      ctx.fillRect(
        o.x - 20,
        o.y - 16,
        40,
        30
      );

      ctx.fillStyle =
        "#314a29";

      ctx.fillRect(
        o.x - 26,
        o.y - 6,
        52,
        20
      );
    } else {
      ctx.fillStyle =
        "#705438";

      ctx.fillRect(
        o.x - 18,
        o.y - 14,
        36,
        28
      );

      ctx.strokeStyle =
        "#312517";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        o.x - 18,
        o.y - 14,
        36,
        28
      );

      ctx.beginPath();

      ctx.moveTo(
        o.x - 14,
        o.y - 10
      );

      ctx.lineTo(
        o.x + 14,
        o.y + 10
      );

      ctx.moveTo(
        o.x + 14,
        o.y - 10
      );

      ctx.lineTo(
        o.x - 14,
        o.y + 10
      );

      ctx.stroke();
    }
  }
}

/* =========================
   HUT
========================= */

function drawHut() {
  ctx.fillStyle =
    "rgba(0,0,0,.3)";

  ctx.fillRect(
    hut.x + 8,
    hut.y + 8,
    hut.w,
    hut.h
  );

  ctx.fillStyle =
    "#7d5a3d";

  ctx.fillRect(
    hut.x,
    hut.y,
    hut.w,
    hut.h
  );

  ctx.strokeStyle =
    "#4f3726";

  ctx.lineWidth = 2;

  for (
    let x =
      hut.x + 10;
    x < hut.x + hut.w;
    x += 22
  ) {
    ctx.beginPath();

    ctx.moveTo(
      x,
      hut.y
    );

    ctx.lineTo(
      x,
      hut.y +
        hut.h
    );

    ctx.stroke();
  }

  ctx.fillStyle =
    "#352a26";

  ctx.beginPath();

  ctx.moveTo(
    hut.x - 18,
    hut.y + 8
  );

  ctx.lineTo(
    hut.x + 24,
    hut.y - 30
  );

  ctx.lineTo(
    hut.x +
      hut.w -
      24,
    hut.y - 30
  );

  ctx.lineTo(
    hut.x +
      hut.w +
      18,
    hut.y + 8
  );

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle =
    "#2a221e";

  ctx.fillRect(
    hut.x +
      hut.w / 2 -
      18,
    hut.y + 50,
    36,
    80
  );

  ctx.fillStyle =
    "#92734d";

  ctx.fillRect(
    hut.x +
      hut.w / 2 +
      10,
    hut.y + 88,
    5,
    5
  );

  ctx.strokeStyle =
    "#f2d279";

  ctx.lineWidth = 3;

  ctx.strokeRect(
    hut.x + 3,
    hut.y + 3,
    hut.w - 6,
    hut.h - 6
  );

  ctx.fillStyle =
    "#275c34";

  ctx.fillRect(
    sellZone.x,
    sellZone.y,
    sellZone.w,
    sellZone.h
  );

  ctx.fillStyle =
    "#d8f1d5";

  ctx.font =
    "bold 12px Courier New";

  ctx.textAlign = "center";

  ctx.fillText(
    "SELL",
    sellZone.x +
      sellZone.w / 2,
    sellZone.y + 27
  );

  ctx.font =
    "10px Courier New";

  ctx.fillText(
    "E",
    sellZone.x +
      sellZone.w / 2,
    sellZone.y + 44
  );

  ctx.fillStyle =
    "#3f4f72";

  ctx.fillRect(
    shopZone.x,
    shopZone.y,
    shopZone.w,
    shopZone.h
  );

  ctx.fillStyle =
    "#dbe4ff";

  ctx.font =
    "bold 12px Courier New";

  ctx.fillText(
    "BUY",
    shopZone.x +
      shopZone.w / 2,
    shopZone.y + 27
  );

  ctx.font =
    "10px Courier New";

  ctx.fillText(
    "E",
    shopZone.x +
      shopZone.w / 2,
    shopZone.y + 44
  );

  ctx.fillStyle =
    "#fff";

  ctx.font =
    "bold 11px Courier New";

  ctx.fillText(
    "SAFE HUT",
    hut.x +
      hut.w / 2,
    hut.y - 10
  );

  ctx.textAlign =
    "left";
}

/* =========================
   DROPS
========================= */

function drawDrops() {
  for (
    const d of game.drops
  ) {
    const bob =
      Math.sin(d.bob) *
      3;

    ctx.save();

    ctx.translate(
      d.x,
      d.y + bob
    );

    const glow =
      7 +
      Math.sin(
        d.pulse * 5
      ) *
        2;

    ctx.fillStyle =
      d.item.type === "gold"
        ? "rgba(255,215,50,.28)"
        : "rgba(255,255,255,.08)";

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      glow,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.font =
      "22px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      d.item.icon,
      0,
      8
    );

    ctx.font =
      "9px Courier New";

    ctx.fillStyle =
      "#fff";

    ctx.fillText(
      d.item.name,
      0,
      22
    );

    ctx.restore();
  }
}

/* =========================
   ZOMBIES
========================= */

function drawZombies() {
  for (
    const z of game.zombies
  ) {
    ctx.save();

    ctx.translate(
      z.x,
      z.y
    );

    const wiggle =
      Math.sin(
        z.wobble
      ) * 2;

    ctx.fillStyle =
      "rgba(0,0,0,.35)";

    ctx.fillRect(
      -13,
      10,
      26,
      7
    );

    ctx.fillStyle =
      "#293226";

    ctx.fillRect(
      -10,
      8 + wiggle,
      7,
      12
    );

    ctx.fillRect(
      3,
      8 - wiggle,
      7,
      12
    );

    ctx.fillStyle =
      z.hitFlash > 0
        ? "#f2b1a5"
        : "#57704e";

    ctx.fillRect(
      -12,
      -6,
      24,
      18
    );

    ctx.fillStyle =
      z.hitFlash > 0
        ? "#ffd0be"
        : "#7d936e";

    ctx.fillRect(
      -10,
      -19,
      20,
      17
    );

    ctx.fillStyle =
      "#293026";

    ctx.fillRect(
      -11,
      -22,
      22,
      5
    );

    ctx.fillStyle =
      "#d93636";

    ctx.fillRect(
      -6,
      -15,
      3,
      3
    );

    ctx.fillRect(
      4,
      -15,
      3,
      3
    );

    ctx.strokeStyle =
      "#6f8660";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
      -12,
      -1
    );

    ctx.lineTo(
      -21,
      7 + wiggle
    );

    ctx.moveTo(
      12,
      -1
    );

    ctx.lineTo(
      21,
      7 - wiggle
    );

    ctx.stroke();

    const bw = 30;

    ctx.fillStyle =
      "#1a1a1a";

    ctx.fillRect(
      -bw / 2,
      -29,
      bw,
      4
    );

    ctx.fillStyle =
      "#d55";

    ctx.fillRect(
      -bw / 2,
      -29,
      bw *
        (z.hp /
          z.maxHp),
      4
    );

    ctx.restore();
  }
}

/* =========================
   BULLETS
========================= */

function drawBullets() {
  for (
    const b of game.bullets
  ) {
    ctx.fillStyle =
      b.color;

    ctx.fillRect(
      b.x - 2,
      b.y - 2,
      4,
      4
    );
  }
}

/* =========================
   PLAYER
========================= */

function drawPlayer() {
  const p =
    game.player;

  ctx.save();

  ctx.translate(
    p.x,
    p.y
  );

  ctx.rotate(
    p.facing
  );

  ctx.fillStyle =
    "rgba(0,0,0,.4)";

  ctx.fillRect(
    -11,
    10,
    23,
    7
  );

  ctx.fillStyle =
    "#2d5b8a";

  ctx.fillRect(
    -11,
    -2,
    22,
    18
  );

  ctx.fillStyle =
    "#d9a77a";

  ctx.fillRect(
    -9,
    -17,
    18,
    16
  );

  ctx.fillStyle =
    "#2b211d";

  ctx.fillRect(
    -10,
    -20,
    20,
    6
  );

  ctx.fillStyle =
    "#d9a77a";

  ctx.fillRect(
    1,
    -1,
    18,
    6
  );

  ctx.fillStyle =
    "#222";

  if (
    game.selectedWeapon ===
    "minigun"
  ) {
    ctx.fillRect(
      8,
      -6,
      22,
      8
    );

    ctx.fillRect(
      20,
      -9,
      13,
      4
    );

    ctx.fillRect(
      20,
      3,
      13,
      4
    );
  } else if (
    game.selectedWeapon ===
    "shotgun"
  ) {
    ctx.fillRect(
      8,
      -4,
      26,
      6
    );
  } else if (
    game.selectedWeapon ===
    "rifle"
  ) {
    ctx.fillRect(
      8,
      -4,
      34,
      4
    );
  } else {
    ctx.fillRect(
      8,
      -3,
      17,
      5
    );
  }

  ctx.restore();
}

/* =========================
   PARTICLES
========================= */

function drawParticles() {
  for (
    const p of game.particles
  ) {
    ctx.globalAlpha =
      Math.max(
        0,
        p.life /
          p.maxLife
      );

    ctx.fillStyle =
      p.color;

    ctx.fillRect(
      p.x,
      p.y,
      p.size,
      p.size
    );
  }

  ctx.globalAlpha = 1;
}

/* =========================
   CROSSHAIR
========================= */

function drawCrosshair() {
  ctx.strokeStyle =
    "rgba(255,255,255,.8)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    mouse.x - 7,
    mouse.y
  );

  ctx.lineTo(
    mouse.x - 2,
    mouse.y
  );

  ctx.moveTo(
    mouse.x + 2,
    mouse.y
  );

  ctx.lineTo(
    mouse.x + 7,
    mouse.y
  );

  ctx.moveTo(
    mouse.x,
    mouse.y - 7
  );

  ctx.lineTo(
    mouse.x,
    mouse.y - 2
  );

  ctx.moveTo(
    mouse.x,
    mouse.y + 2
  );

  ctx.lineTo(
    mouse.x,
    mouse.y + 7
  );

  ctx.stroke();
}

/* =========================
   UI
========================= */

function updateUI() {
  const hearts =
    "♥".repeat(
      Math.max(
        0,
        game.health
      )
    ) +
    "♡".repeat(
      Math.max(
        0,
        game.maxHealth -
          game.health
      )
    );

  document.getElementById(
    "hearts"
  ).textContent =
    hearts;

  document.getElementById(
    "money"
  ).textContent =
    `$${game.money}`;

  document.getElementById(
    "weaponName"
  ).textContent =
    weapons[
      game.selectedWeapon
    ].name.toUpperCase();

  document.getElementById(
    "zombieCount"
  ).textContent =
    game.zombies.length;

  const ammo =
    game.selectedWeapon ===
    "pistol"
      ? "∞"
      : "UNLIMITED";

  document.getElementById(
    "ammoText"
  ).textContent =
    ammo;

  const slots =
    document.getElementById(
      "slots"
    );

  slots.innerHTML = "";

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    const slot =
      document.createElement(
        "div"
      );

    slot.className =
      "slot";

    if (game.inventory[i]) {
      const item =
        game.inventory[i];

      slot.innerHTML =
        `<div class="icon">${item.icon}</div>` +
        `<div>${item.name}</div>` +
        `<div class="stackCount">x${item.amount}</div>` +
        `<div>$${item.value * item.amount}</div>`;
    } else {
      slot.classList.add(
        "empty"
      );

      slot.innerHTML =
        `<div class="icon">·</div>` +
        `<div>EMPTY</div>`;
    }

    slots.appendChild(
      slot
    );
  }

  const sell =
    document.getElementById(
      "sellPanel"
    );

  const buy =
    document.getElementById(
      "buyPanel"
    );

  sell.classList.toggle(
    "show",
    isInsideZone(
      game.player,
      sellZone,
      25
    )
  );

  buy.classList.toggle(
    "show",
    isInsideZone(
      game.player,
      shopZone,
      25
    )
  );

  let msg = "";

  if (
    isInsideZone(
      game.player,
      sellZone,
      25
    )
  ) {
    msg =
      "SELL AREA — PRESS E";
  } else if (
    isInsideZone(
      game.player,
      shopZone,
      25
    )
  ) {
    msg =
      "BUY AREA — PRESS E";
  } else if (
    game.inventory.length >=
      MAX_SLOTS &&
    game.inventory.every(
      item =>
        item.amount >=
        MAX_STACK
    )
  ) {
    msg =
      "INVENTORY FULL — RETURN TO THE HUT";
  } else if (
    controlMode ===
    "mobile"
  ) {
    msg =
      "ARROWS TO MOVE • SHOOT TO ATTACK";
  } else {
    msg =
      "LEFT CLICK TO SHOOT • WASD TO MOVE";
  }

  document.getElementById(
    "message"
  ).textContent =
    msg;
}

/* =========================
   TOAST
========================= */

function showToast(text) {
  const el =
    document.getElementById(
      "toast"
    );

  el.textContent =
    text;

  el.style.display =
    "block";

  game.toastTimer =
    1.5;
}

/* =========================
   GAME LOOP
========================= */

let lastTime =
  performance.now();

function loop(now) {
  const dt =
    Math.min(
      0.033,
      (now - lastTime) /
        1000
    );

  lastTime = now;

  if (
    game.toastTimer >
    0
  ) {
    game.toastTimer -=
      dt;

    if (
      game.toastTimer <=
      0
    ) {
      document.getElementById(
        "toast"
      ).style.display =
        "none";
    }
  }

  update(dt);
  draw();

  requestAnimationFrame(
    loop
  );
}

updateUI();
requestAnimationFrame(
  loop
);
