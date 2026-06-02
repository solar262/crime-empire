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
  r: 18,
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
  for (let i = 0; i < 80; i++) {
    buildings.push({
      x: Math.random() * world.width,
      y: Math.random() * world.height,
      w: 120 + Math.random() * 200,
      h: 80 + Math.random() * 180,
      color: i % 2 ? "rgba(255,40,120,0.16)" : "rgba(0,200,255,0.16)"
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
  setTimeout(() => ui.toast.classList.add("hidden"), 1500);

  for (let i = 0; i < 6 + player.wave * 3; i++) {
    enemies.push({
      x: Math.random() * world.width,
      y: Math.random() * world.height,
      r: 16,
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

  player.x += (dx / len) * 180;
  player.y += (dy / len) * 180;

  shake = 18;
  addParticles(player.x, player.y, "#67e8f9", 28);
}

function shoot() {
  if (player.cooldown > 0) return;
  player.cooldown = 0.14;

  const target = enemies[0];
  let angle = -Math.PI / 2;

  if (target) {
    angle = Math.atan2(target.y - player.y, target.x - player.x);
  }

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 760,
    vy: Math.sin(angle) * 760,
    life: 1
  });

  shake = 5;
}

function addParticles(x, y, color, amount = 10) {
  for (let i = 0; i < amount; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 240;
    particles.push({
      x, y,
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

  let dx = 0, dy = 0;
  if (keys["w"] || keys["ArrowUp"]) dy--;
  if (keys["s"] || keys["ArrowDown"]) dy++;
  if (keys["a"] || keys["ArrowLeft"]) dx--;
  if (keys["d"] || keys["ArrowRight"]) dx++;

  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx / len) * player.speed * dt;
  player.y += (dy / len) * player.speed * dt;

  player.x = Math.max(30, Math.min(world.width - 30, player.x));
  player.y = Math.max(30, Math.min(world.height - 30, player.y));

  if (keys[" "] || keys["f"]) shoot();
  if (keys["Shift"]) dash();

  bullets.forEach(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  });

  enemies.forEach(e => {
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    const speed = e.type === "heavy" ? e.speed * 0.6 : e.speed;

    e.x += Math.cos(a) * speed * dt;
    e.y += Math.sin(a) * speed * dt;

    if (Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r) {
      player.hp -= 24 * dt;
      shake = 8;
    }
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 6) {
        e.hp--;
        b.life = 0;

        addParticles(e.x, e.y, "#ff3f6e", 10);

        if (e.hp <= 0) {
          player.score += 50;

          if (Math.random() < 0.8) {
            pickups.push({ x: e.x, y: e.y, r: 10, value: 25 });
          }
        }
      }
    });
  });

  enemies = enemies.filter(e => e.hp > 0);
  bullets = bullets.filter(b => b.life > 0);

  pickups.forEach(p => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      player.cash += p.value;
      player.score += 10;
      p.collected = true;
      addParticles(p.x, p.y, "#ffd15c", 12);
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

  if (player.hp <= 0) {
    running = false;
    ui.final.textContent = `Score: ${player.score}`;
    ui.gameOver.classList.remove("hidden");
  }

  world.camX += ((player.x - innerWidth / 2) - world.camX) * 0.08;
  world.camY += ((player.y - innerHeight / 2) - world.camY) * 0.08;

  shake *= 0.88;

  ui.cash.textContent = `$${player.cash}`;
  ui.health.textContent = Math.max(0, Math.floor(player.hp));
  ui.wave.textContent = player.wave;
  ui.score.textContent = player.score;
  ui.mission.textContent = `Survive wave ${player.wave} and collect cash drops.`;
}

function drawCity() {
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.save();
  ctx.translate(-world.camX, -world.camY);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;

  for (let x = -200; x < world.width + 200; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + world.height * 0.2, world.height);
    ctx.stroke();
  }

  for (let y = 0; y < world.height; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(world.width, y + 50);
    ctx.stroke();
  }

  buildings.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  pickups.forEach(p => {
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffd15c";
    ctx.fillStyle = "#ffd15c";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  bullets.forEach(b => {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#67e8f9";
    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  enemies.forEach(e => {
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff3f6e";
    ctx.fillStyle = e.type === "heavy" ? "#ff914d" : "#ff3f6e";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(e.x - 18, e.y - 28, 36, 5);

    ctx.fillStyle = "#67ff9f";
    ctx.fillRect(e.x - 18, e.y - 28, (e.hp / (2 + player.wave)) * 36, 5);
  });

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
  });

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#ffd15c";
  ctx.fillStyle = "#ffd15c";
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.fillRect(-7, -9, 14, 18);
  ctx.restore();

  ctx.restore();
}

function drawMiniMap() {
  mtx.clearRect(0,0,180,180);
  mtx.fillStyle = "rgba(5,8,16,0.92)";
  mtx.fillRect(0,0,180,180);

  buildings.forEach(b => {
    mtx.fillStyle = "rgba(0,180,255,0.18)";
    mtx.fillRect((b.x/world.width)*180,(b.y/world.height)*180,(b.w/world.width)*180,(b.h/world.height)*180);
  });

  enemies.forEach(e => {
    mtx.fillStyle = "#ff3f6e";
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
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawCity();
  drawMiniMap();

  ctx.restore();
}

function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

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

document.getElementById("upBtn").ontouchstart = () => keys["ArrowUp"] = true;
document.getElementById("upBtn").ontouchend = () => keys["ArrowUp"] = false;

document.getElementById("downBtn").ontouchstart = () => keys["ArrowDown"] = true;
document.getElementById("downBtn").ontouchend = () => keys["ArrowDown"] = false;

document.getElementById("leftBtn").ontouchstart = () => keys["ArrowLeft"] = true;
document.getElementById("leftBtn").ontouchend = () => keys["ArrowLeft"] = false;

document.getElementById("rightBtn").ontouchstart = () => keys["ArrowRight"] = true;
document.getElementById("rightBtn").ontouchend = () => keys["ArrowRight"] = false;

document.getElementById("fireBtn").ontouchstart = () => keys[" "] = true;
document.getElementById("fireBtn").ontouchend = () => keys[" "] = false;

document.getElementById("dashBtn").ontouchstart = () => keys["Shift"] = true;
document.getElementById("dashBtn").ontouchend = () => keys["Shift"] = false;

requestAnimationFrame(loop);
