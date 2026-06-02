const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  cash: document.getElementById("cash"),
  health: document.getElementById("health"),
  wave: document.getElementById("wave"),
  score: document.getElementById("score"),
  start: document.getElementById("startScreen"),
  gameOver: document.getElementById("gameOver"),
  final: document.getElementById("finalScore"),
};

let W, H, keys = {};
let running = false;
let last = 0;
let shake = 0;

const player = {
  x: 0,
  y: 0,
  r: 18,
  speed: 260,
  hp: 100,
  cash: 0,
  score: 0,
  wave: 1,
  cooldown: 0
};

let enemies = [];
let bullets = [];
let pickups = [];
let particles = [];

function resize() {
  W = canvas.width = innerWidth * devicePixelRatio;
  H = canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
resize();
addEventListener("resize", resize);

function reset() {
  player.x = innerWidth / 2;
  player.y = innerHeight / 2;
  player.hp = 100;
  player.cash = 0;
  player.score = 0;
  player.wave = 1;
  enemies = [];
  bullets = [];
  pickups = [];
  particles = [];
  spawnWave();
}

function spawnWave() {
  for (let i = 0; i < 6 + player.wave * 2; i++) {
    enemies.push({
      x: Math.random() < 0.5 ? -50 : innerWidth + 50,
      y: Math.random() * innerHeight,
      r: 16,
      hp: 2 + player.wave,
      speed: 70 + player.wave * 8
    });
  }
}

function shoot() {
  if (player.cooldown > 0) return;
  player.cooldown = 0.18;

  const target = enemies[0];
  let angle = -Math.PI / 2;

  if (target) {
    angle = Math.atan2(target.y - player.y, target.x - player.x);
  }

  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 560,
    vy: Math.sin(angle) * 560,
    life: 1.2
  });

  shake = 4;
}

function addParticles(x, y, color, amount = 10) {
  for (let i = 0; i < amount; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 180;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.6,
      color
    });
  }
}

function update(dt) {
  if (!running) return;

  player.cooldown -= dt;

  let dx = 0, dy = 0;
  if (keys["w"] || keys["ArrowUp"]) dy--;
  if (keys["s"] || keys["ArrowDown"]) dy++;
  if (keys["a"] || keys["ArrowLeft"]) dx--;
  if (keys["d"] || keys["ArrowRight"]) dx++;

  const len = Math.hypot(dx, dy) || 1;
  player.x += (dx / len) * player.speed * dt;
  player.y += (dy / len) * player.speed * dt;

  player.x = Math.max(30, Math.min(innerWidth - 30, player.x));
  player.y = Math.max(120, Math.min(innerHeight - 30, player.y));

  if (keys[" "] || keys["f"]) shoot();

  bullets.forEach(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  });

  enemies.forEach(e => {
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(a) * e.speed * dt;
    e.y += Math.sin(a) * e.speed * dt;

    if (Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r) {
      player.hp -= 20 * dt;
      shake = 8;
    }
  });

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 6) {
        e.hp--;
        b.life = 0;
        addParticles(e.x, e.y, "#ff3f6e", 8);
        if (e.hp <= 0) {
          player.score += 50;
          if (Math.random() < 0.75) {
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
    spawnWave();
    player.hp = Math.min(100, player.hp + 18);
  }

  if (player.hp <= 0) {
    running = false;
    ui.final.textContent = `Score: ${player.score}`;
    ui.gameOver.classList.remove("hidden");
  }

  shake *= 0.88;

  ui.cash.textContent = `$${player.cash}`;
  ui.health.textContent = Math.max(0, Math.floor(player.hp));
  ui.wave.textContent = player.wave;
  ui.score.textContent = player.score;
}

function drawCity() {
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  for (let x = -80; x < innerWidth + 80; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + innerHeight * 0.35, innerHeight);
    ctx.stroke();
  }

  for (let y = 0; y < innerHeight; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(innerWidth, y + 40);
    ctx.stroke();
  }

  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = i % 2 ? "rgba(255,40,120,0.12)" : "rgba(0,200,255,0.12)";
    ctx.fillRect((i * 137) % innerWidth, (i * 211) % innerHeight, 80, 34);
  }
}

function drawPlayer() {
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
}

function draw() {
  ctx.save();

  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawCity();

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
    ctx.fillStyle = "#ff3f6e";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  });

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
  });

  drawPlayer();
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

requestAnimationFrame(loop);