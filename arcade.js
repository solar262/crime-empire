(() => {
const canvas = document.getElementById('streetRunCanvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('arcadeOverlay');
const startBtn = document.getElementById('startStreetRun');
const retryBtn = document.getElementById('retryStreetRun');
const rewardEl = document.getElementById('arcadeReward');
const flash = document.getElementById('arcadeFlash');
const scoreEl = document.getElementById('arcadeScore');
const timerEl = document.getElementById('arcadeTimer');
const heatEl = document.getElementById('arcadeHeat');
const bestEl = document.getElementById('arcadeBest');
const leftBtn = document.getElementById('moveLeft');
const rightBtn = document.getElementById('moveRight');
const resultEl = document.getElementById('arcadeResult');
let raf = 0;
let last = 0;
let spawnTimer = 0;
const game = { running:false, score:0, best:Number(localStorage.getItem('crimeEmpireStreetBest')||0), heat:0, time:60, lane:1, speed:5, road:0, shake:0, pickups:[], patrols:[], particles:[] };
if (bestEl) bestEl.textContent = String(game.best);
function cssW(){ return Math.max(320, canvas.clientWidth || 720); }
function cssH(){ return Math.max(420, canvas.clientHeight || 560); }
function fit(){ const d = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.floor(cssW()*d); canvas.height = Math.floor(cssH()*d); ctx.setTransform(d,0,0,d,0,0); drawAttract(); }
function laneX(lane, y = cssH() * .78){ const w=cssW(); const center=w/2; const spread=w*.19 + y*.035; return center + (lane-1)*spread; }
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); }
function start(){ game.running=true; game.score=0; game.heat=0; game.time=60; game.lane=1; game.speed=6; game.road=0; game.shake=0; game.pickups=[]; game.patrols=[]; game.particles=[]; spawnTimer=0; last=0; overlay?.classList.add('hidden'); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); }
function end(){ game.running=false; cancelAnimationFrame(raf); const payout=game.score*3; try{ const save=JSON.parse(localStorage.getItem('crimeEmpireSaveV3')||'{}'); save.cash=(save.cash||0)+payout; localStorage.setItem('crimeEmpireSaveV3',JSON.stringify(save)); }catch{} if(game.score>game.best){ game.best=game.score; localStorage.setItem('crimeEmpireStreetBest',String(game.best)); if(bestEl) bestEl.textContent=String(game.best); } if(resultEl) resultEl.innerHTML=`Run complete. Score <strong>${game.score}</strong><br><strong>$${payout}</strong> added to your empire save.`; overlay?.classList.remove('hidden'); }
function spawn(){ const lane=Math.floor(Math.random()*3); if(Math.random()>.36){ game.pickups.push({lane,y:-60,spin:0,value:10}); } else { game.patrols.push({lane,y:-80,warn:0}); } }
function move(d){ if(!game.running) return; game.lane=Math.max(0,Math.min(2,game.lane+d)); pop(laneX(game.lane), cssH()-95, '#46d9ff', 7); }
function pop(x,y,color,n=8){ for(let i=0;i<n;i++) game.particles.push({x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*5-1,life:1,color}); }
function collect(x,y){ game.score+=10; if(scoreEl) scoreEl.textContent=String(game.score); if(rewardEl){ rewardEl.textContent='+$10'; rewardEl.classList.remove('show'); void rewardEl.offsetWidth; rewardEl.classList.add('show'); } pop(x,y,'#ffd35a',12); }
function hit(x,y){ game.heat+=20; game.shake=12; flash?.classList.remove('hit'); if(flash){ void flash.offsetWidth; flash.classList.add('hit'); } pop(x,y,'#ff415c',18); if(game.heat>=100) end(); }
function update(dt){ game.time-=dt/1000; if(game.time<=0){ end(); return; } game.road += game.speed*dt*.22; spawnTimer += dt; if(spawnTimer>420){ spawnTimer=0; spawn(); } game.speed = Math.min(14, 6 + (60-game.time)*.12); game.pickups.forEach(o=>{ o.y += game.speed*dt*.34; o.spin+=dt*.008; }); game.patrols.forEach(o=>{ o.y += game.speed*dt*.42; o.warn+=dt*.006; }); const py=cssH()-95; game.pickups.forEach(o=>{ const x=laneX(o.lane,o.y); if(Math.abs(o.lane-game.lane)<.1 && Math.abs(o.y-py)<48){ collect(x,o.y); o.y=9999; }}); game.patrols.forEach(o=>{ const x=laneX(o.lane,o.y); if(Math.abs(o.lane-game.lane)<.1 && Math.abs(o.y-py)<58){ hit(x,o.y); o.y=9999; }}); game.pickups=game.pickups.filter(o=>o.y<cssH()+90); game.patrols=game.patrols.filter(o=>o.y<cssH()+110); game.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.life-=dt/650}); game.particles=game.particles.filter(p=>p.life>0); if(game.shake>0) game.shake*=.82; if(timerEl) timerEl.textContent=String(Math.max(0,Math.ceil(game.time))); if(heatEl) heatEl.textContent=Math.min(100,Math.floor(game.heat))+'%'; }
function drawCity(){ const w=cssW(), h=cssH(); const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#11182b'); g.addColorStop(.42,'#07101e'); g.addColorStop(1,'#03040a'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); for(let side of [0,1]){ for(let i=0;i<10;i++){ const bw=w*.055 + (i%3)*12; const bh=90 + ((i*37)%180); const x=side? w*.79 + (i%3)*bw : w*.02 + (i%4)*bw; const y=h-bh-((i*23)%90); ctx.fillStyle=i%2?'#121b2c':'#0c1322'; ctx.fillRect(x,y,bw,bh); ctx.fillStyle='rgba(255,211,90,.55)'; for(let wy=y+16;wy<y+bh-12;wy+=22){ for(let wx=x+8;wx<x+bw-8;wx+=18){ if((wx+wy+i)%3<1) ctx.fillRect(wx,wy,5,7); } } } } }
function drawRoad(){ const w=cssW(), h=cssH(); const topW=w*.25, botW=w*.72, cx=w/2; ctx.fillStyle='#0a0d14'; ctx.beginPath(); ctx.moveTo(cx-topW/2,0); ctx.lineTo(cx+topW/2,0); ctx.lineTo(cx+botW/2,h); ctx.lineTo(cx-botW/2,h); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(255,211,90,.65)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-topW/2,0); ctx.lineTo(cx-botW/2,h); ctx.moveTo(cx+topW/2,0); ctx.lineTo(cx+botW/2,h); ctx.stroke(); for(let i=0;i<16;i++){ const y=((i*80)+(game.road%80))-80; const t=y/h; const x1=cx-(topW/6+(botW-topW)*t/6); const x2=cx+(topW/6+(botW-topW)*t/6); ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2+t*5; ctx.setLineDash([18+t*28, 24]); ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(cx-botW*.13,h); ctx.moveTo(x2,y); ctx.lineTo(cx+botW*.13,h); ctx.stroke(); ctx.setLineDash([]); } }
function drawPickup(o){ const x=laneX(o.lane,o.y), y=o.y, s=16+(y/cssH())*10; ctx.save(); ctx.translate(x,y); ctx.rotate(o.spin); ctx.shadowColor='#ffd35a'; ctx.shadowBlur=24; ctx.fillStyle='#ffd35a'; ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#1b1103'; ctx.font=`900 ${s}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$',0,1); ctx.restore(); }
function drawPatrol(o){ const x=laneX(o.lane,o.y), y=o.y, scale=.65+(y/cssH())*.85; ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale); ctx.shadowColor='#ff415c'; ctx.shadowBlur=22; rr(-28,-44,56,88,14); ctx.fillStyle='#26334b'; ctx.fill(); ctx.fillStyle='#ff415c'; ctx.fillRect(-24,-36,48,14); ctx.fillStyle='#46d9ff'; ctx.fillRect(-20,-14,16,18); ctx.fillStyle='#fff'; ctx.fillRect(4,-14,16,18); ctx.fillStyle='#05070d'; ctx.fillRect(-25,28,12,10); ctx.fillRect(13,28,12,10); ctx.restore(); }
function drawPlayer(){ const x=laneX(game.lane), y=cssH()-95; ctx.save(); ctx.translate(x,y); ctx.shadowColor='#ffd35a'; ctx.shadowBlur=26; rr(-31,-52,62,104,18); ctx.fillStyle='#e8b949'; ctx.fill(); ctx.fillStyle='#111827'; rr(-20,-34,40,30,8); ctx.fill(); ctx.fillStyle='#fff6b3'; ctx.fillRect(-24,-44,14,10); ctx.fillRect(10,-44,14,10); ctx.fillStyle='#171005'; ctx.fillRect(-28,30,14,12); ctx.fillRect(14,30,14,12); ctx.restore(); }
function drawParticles(){ game.particles.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,4+p.life*4,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }); }
function render(){ const sx=(Math.random()-.5)*game.shake, sy=(Math.random()-.5)*game.shake; ctx.save(); ctx.translate(sx,sy); drawCity(); drawRoad(); game.pickups.forEach(drawPickup); game.patrols.forEach(drawPatrol); drawPlayer(); drawParticles(); ctx.restore(); }
function drawAttract(){ drawCity(); drawRoad(); drawPlayer(); ctx.fillStyle='rgba(0,0,0,.34)'; ctx.fillRect(0,0,cssW(),cssH()); ctx.fillStyle='#ffd35a'; ctx.font='900 28px sans-serif'; ctx.textAlign='center'; ctx.fillText('STREET RUN',cssW()/2,cssH()/2-12); ctx.fillStyle='#b8c6df'; ctx.font='700 15px sans-serif'; ctx.fillText('Press Start Run to play',cssW()/2,cssH()/2+20); }
function loop(ts){ if(!last) last=ts; const dt=Math.min(32,ts-last); last=ts; update(dt); render(); if(game.running) raf=requestAnimationFrame(loop); }
window.addEventListener('resize',fit);
window.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a') move(-1); if(e.key==='ArrowRight'||e.key.toLowerCase()==='d') move(1); });
leftBtn?.addEventListener('click',()=>move(-1)); rightBtn?.addEventListener('click',()=>move(1));
leftBtn?.addEventListener('touchstart',e=>{e.preventDefault();move(-1)},{passive:false}); rightBtn?.addEventListener('touchstart',e=>{e.preventDefault();move(1)},{passive:false});
startBtn?.addEventListener('click',start); retryBtn?.addEventListener('click',start);
fit();
})();
