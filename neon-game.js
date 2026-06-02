const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mini = document.getElementById("miniMap");
const mtx = mini.getContext("2d");

const ui = {
  cash: document.getElementById("cash"),
  health: document.getElementById("health"),
  wave: document.getElementById("wave"),
  score: document.getElementById("score"),
  start: document.getElementById("startScreen"),
  gameOver: document.getElementById("gameOver"),
  final: document.getElementById("finalScore"),
  mission: document.getElementById("missionText"),
  toast: document.getElementById("toast")
};

let W, H, keys = {};
let running = false;
let last = 0;
let shake = 0;

const world = {
  width: 3200,
  height: 3200,
  camX: 0,
  camY: 0
};

const player = {
  x: 1600,
  y: 1600,
  speed: 260,
  hp: 100,
  cash: 0,
  score: 0,
  wave: 1,
  cooldown: 0,
  dash: 0
};

let enemies = [];
let bullets = [];
let pickups = [];
let particles = [];
let buildings = [];

function resize() {
  W = canvas.width = innerWidth * devicePixelRatio;
  H = canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

resize();
addEventListener("resize", resize);

function buildCity() {
  buildings = [];

  for (let i = 0; i < 70; i++) {
    buildings.push({
      x: Math.random() * world.width,
      y: Math.random() * world.height,
      w: 120 + Math.random() * 260,
      h: 120 + Math.random() * 320,
      neon: Math.random() > 0.5 ? "#00d9ff" : "#ff2d75"
    });
  }
}

function reset() {
  player.x = world.width / 2;
  player.y = world.height / 2;
  player.hp = 100;
  player.cash = 0;
  player.score = 0;
  player.wave = 1;

  enemies = [];
  bullets = [];
  pickups = [];
  particles = [];

  buildCity();
  spawnWave();
}

function spawnWave() {
  ui.toast.textContent = `Wave ${player.wave}`;
  ui.toast.classList.remove("hidden");
  setTimeout(() => ui.toast.classList.add("hidden"), 1400);

  for (let i = 0; i < 6 + player.wave * 3; i++) {
    enemies.push({
      x: Math.random() * world.width,
      y: Math.random() * world.height,
      hp: 2 + player.wave,
      speed: 70 + player.wave * 10,
      type: Math.random() > 0.7 ? "heavy" : "runner"
    });
  }
}

function dash() {
  if (player.dash > 0) return;

  player.dash = 1.2;

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["ArrowUp"]) dy--;
  if (keys["s"] || keys["ArrowDown"]) dy++;
  if (keys["a"] || keys["ArrowLeft"]) dx--;
  if (keys["d"] || keys["ArrowRight"]) dx++;

  const len = Math.hypot(dx, dy) || 1;

  player.x += (dx / len) * 200;
  player.y += (dy / len) * 200;

  shake = 18;
  addParticles(player.x, player.y, "#00d9ff", 35);
}

function shoot() {
  if (player.cooldown > 0) return;

  player.cooldown = 0.12;

  const target = enemies[0];
  let angle = -Math.PI / 2;

  if (target) {
    angle = Math.atan2(target.y - player.y, target.x - player.x);
  }

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 820,
    vy: Math.sin(angle) * 820,
    life: 1
  });

  shake = 6;
}

function addParticles(x, y, color, amount = 10) {
  for (let i = 0; i < amount; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 260;

    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.7,
      color
    });
  }
}

function update(dt) {
  if (!running) return;

  player.cooldown -= dt;
  player.dash -= dt;

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["ArrowUp"]) dy--;
  if (keys["s"] || keys["ArrowDown"]) dy++;
  if (keys["a"] || keys["ArrowLeft"]) dx--;
  if (keys["d"] || keys["ArrowRight"]) dx++;

  const len = Math.hypot(dx, dy) || 1;

  player.x += (dx / len) * player.speed * dt;
  player.y += (dy / len) * player.speed * dt;

  if (keys[" "] || keys["f"]) shoot();
  if (keys["Shift"]) dash();

  bullets.forEach(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  });

  enemies.forEach(e => {
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    const speed = e.type === "heavy" ? e.speed * 0.65 : e.speed;

    e.x += Math.cos(a) * speed * dt;
    e.y += Math.sin(a) * speed * dt;

    if (Math.hypot(player.x - e.x, player.y - e.y) < 34) {
      player.hp -= 24 * dt;
      shake = 8;
    }
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < 28) {
        e.hp--;
        b.life = 0;

        addParticles(e.x, e.y, "#ff2d75", 12);

        if (e.hp <= 0) {
          player.score += 50;

          if (Math.random() < 0.8) {
            pickups.push({ x: e.x, y: e.y, value: 25 });
          }
        }
      }
    });
  });

  enemies = enemies.filter(e => e.hp > 0);
  bullets = bullets.filter(b => b.life > 0);

  pickups.forEach(p => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 36) {
      player.cash += p.value;
      player.score += 10;
      p.collected = true;
      addParticles(p.x, p.y, "#ffd15c", 18);
    }
  });

  pickups = pickups.filter(p => !p.collected);

  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  });

  particles = particles.filter(p => p.life > 0);

  if (enemies.length === 0) {
    player.wave++;
    player.hp = Math.min(100, player.hp + 20);
    spawnWave();
  }

  world.camX += ((player.x - innerWidth / 2) - world.camX) * 0.08;
  world.camY += ((player.y - innerHeight / 2) - world.camY) * 0.08;

  shake *= 0.9;

  ui.cash.textContent = `$${player.cash}`;
  ui.health.textContent = Math.max(0, Math.floor(player.hp));
  ui.wave.textContent = player.wave;
  ui.score.textContent = player.score;
}

function drawBackground() {
  const g = ctx.createLinearGradient(0,0,0,innerHeight);
  g.addColorStop(0,"#070b1a");
  g.addColorStop(1,"#02040b");

  ctx.fillStyle = g;
  ctx.fillRect(0,0,innerWidth,innerHeight);
}

function drawBuildings() {
  buildings.forEach(b => {
    ctx.fillStyle = "#09101f";
    ctx.fillRect(b.x,b.y,b.w,b.h);

    ctx.strokeStyle = b.neon;
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x,b.y,b.w,b.h);

    for (let wx = 12; wx < b.w - 20; wx += 26) {
      for (let wy = 12; wy < b.h - 20; wy += 26) {
        ctx.fillStyle = Math.random() > 0.5 ? b.neon : "rgba(255,255,255,0.08)";
        ctx.fillRect(b.x + wx,b.y + wy,10,14);
      }
    }
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.shadowBlur = 30;
  ctx.shadowColor = "#ffd15c";

  ctx.fillStyle = "#1a1f2e";
  ctx.beginPath();
  ctx.moveTo(0,-26);
  ctx.lineTo(18,-8);
  ctx.lineTo(14,22);
  ctx.lineTo(-14,22);
  ctx.lineTo(-18,-8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#ffd15c";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#00d9ff";
  ctx.fillRect(-10,-6,20,10);

  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x,e.y);

  ctx.shadowBlur = 24;
  ctx.shadowColor = e.type === "heavy" ? "#ff8c42" : "#ff2d75";

  ctx.fillStyle = "#1a1020";

  if (e.type === "heavy") {
    ctx.fillRect(-18,-18,36,36);
    ctx.strokeStyle = "#ff8c42";
  } else {
    ctx.beginPath();
    ctx.moveTo(0,-20);
    ctx.lineTo(18,0);
    ctx.lineTo(0,20);
    ctx.lineTo(-18,0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ff2d75";
  }

  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#67ff9f";
  ctx.fillRect(-16,-32,(e.hp/(2+player.wave))*32,5);

  ctx.restore();
}

function drawWorld() {
  drawBackground();

  ctx.save();
  ctx.translate(-world.camX,-world.camY);

  drawBuildings();

  pickups.forEach(p => {
    ctx.save();
    ctx.translate(p.x,p.y);

    ctx.shadowBlur = 22;
    ctx.shadowColor = "#ffd15c";

    ctx.fillStyle = "#ffd15c";
    ctx.rotate(performance.now()/400);
    ctx.fillRect(-8,-8,16,16);

    ctx.restore();
  });

  bullets.forEach(b => {
    ctx.strokeStyle = "#00d9ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(b.x,b.y);
    ctx.lineTo(b.x - b.vx * 0.02,b.y - b.vy * 0.02);
    ctx.stroke();
  });

  enemies.forEach(drawEnemy);

  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x,p.y,5,5);
    ctx.globalAlpha = 1;
  });

  drawPlayer();

  ctx.restore();
}

function drawMiniMap() {
  mtx.clearRect(0,0,180,180);
  mtx.fillStyle = "#06101c";
  mtx.fillRect(0,0,180,180);

  buildings.forEach(b => {
    mtx.fillStyle = "rgba(0,180,255,0.18)";
    mtx.fillRect((b.x/world.width)*180,(b.y/world.height)*180,(b.w/world.width)*180,(b.h/world.height)*180);
  });

  enemies.forEach(e => {
    mtx.fillStyle = "#ff2d75";
    mtx.fillRect((e.x/world.width)*180,(e.y/world.height)*180,4,4);
  });

  mtx.fillStyle = "#ffd15c";
  mtx.beginPath();
  mtx.arc((player.x/world.width)*180,(player.y/world.height)*180,5,0,Math.PI*2);
  mtx.fill();
}

function draw() {
  ctx.save();

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake,(Math.random() - 0.5) * shake);
  }

  drawWorld();
  drawMiniMap();

  ctx.restore();
}

function loop(t) {
  const dt = Math.min(0.033,(t-last)/1000 || 0);
  last = t;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

addEventListener("keydown",e => keys[e.key] = true);
addEventListener("keyup",e => keys[e.key] = false);

document.getElementById("startBtn").onclick = () => {
  reset();
  running = true;
  ui.start.classList.add("hidden");
};

document.getElementById("restartBtn").onclick = () => {
  reset();
  running = true;
  ui.gameOver.classList.add("hidden");
};

requestAnimationFrame(loop);
