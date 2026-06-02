const canvas=document.getElementById('streetRunCanvas');
if(canvas){
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('arcadeOverlay');
const startBtn=document.getElementById('startStreetRun');
const retryBtn=document.getElementById('retryStreetRun');
const rewardEl=document.getElementById('arcadeReward');
const flash=document.getElementById('arcadeFlash');
const scoreEl=document.getElementById('arcadeScore');
const timerEl=document.getElementById('arcadeTimer');
const heatEl=document.getElementById('arcadeHeat');
const bestEl=document.getElementById('arcadeBest');
const mobileLeft=document.getElementById('moveLeft');
const mobileRight=document.getElementById('moveRight');
let w,h,raf,last;
const state={running:false,score:0,best:Number(localStorage.getItem('crimeEmpireStreetBest')||0),heat:0,time:60,playerX:0,lane:1,speed:5,coins:[],cops:[],lines:0};
bestEl.textContent=state.best;
function resize(){w=canvas.width=canvas.clientWidth*devicePixelRatio;h=canvas.height=canvas.clientHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
resize();window.addEventListener('resize',resize);
function reset(){state.running=true;state.score=0;state.heat=0;state.time=60;state.speed=5;state.coins=[];state.cops=[];state.lines=0;state.lane=1;state.playerX=laneX(state.lane);overlay.classList.add('hidden');spawnLoop()}
function laneX(l){const lanes=[canvas.clientWidth*.24,canvas.clientWidth*.5,canvas.clientWidth*.76];return lanes[l]}
function spawnLoop(){clearInterval(window.streetSpawn);window.streetSpawn=setInterval(()=>{if(!state.running)return;const lane=Math.floor(Math.random()*3);if(Math.random()>.28){state.coins.push({x:laneX(lane),y:-30,size:14})}else{state.cops.push({x:laneX(lane),y:-50,size:22})}},520)}
function drawRoad(){ctx.fillStyle='#070910';ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);const roadW=canvas.clientWidth*.62;const x=(canvas.clientWidth-roadW)/2;ctx.fillStyle='#111827';ctx.fillRect(x,0,roadW,canvas.clientHeight);ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=4;ctx.strokeRect(x,0,roadW,canvas.clientHeight);ctx.strokeStyle='rgba(255,211,90,.4)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+8,0);ctx.lineTo(x+8,canvas.clientHeight);ctx.moveTo(x+roadW-8,0);ctx.lineTo(x+roadW-8,canvas.clientHeight);ctx.stroke();for(let i=0;i<12;i++){const yy=((i*90)+(state.lines%90))-90;ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(canvas.clientWidth/2-4,yy,8,42)}}
function drawPlayer(){const y=canvas.clientHeight-92;ctx.save();ctx.translate(state.playerX,y);ctx.fillStyle='#ffd35a';ctx.shadowBlur=25;ctx.shadowColor='rgba(255,211,90,.6)';ctx.beginPath();ctx.roundRect(-24,-40,48,78,14);ctx.fill();ctx.fillStyle='#161007';ctx.fillRect(-12,-28,24,18);ctx.restore()}
function drawCoins(){ctx.shadowBlur=18;ctx.shadowColor='rgba(255,211,90,.45)';state.coins.forEach(c=>{ctx.fillStyle='#ffd35a';ctx.beginPath();ctx.arc(c.x,c.y,c.size,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b1405';ctx.font='bold 12px sans-serif';ctx.fillText('$',c.x-4,c.y+4)})}
function drawCops(){ctx.shadowBlur=20;ctx.shadowColor='rgba(255,65,92,.4)';state.cops.forEach(c=>{ctx.fillStyle='#ff415c';ctx.beginPath();ctx.roundRect(c.x-22,c.y-26,44,52,12);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(c.x-10,c.y-8,20,12)})}
function update(dt){if(!state.running)return;state.lines+=state.speed*dt*.26;state.time-=dt/1000;if(state.time<=0){endGame()}state.coins.forEach(c=>c.y+=state.speed*dt*.24);state.cops.forEach(c=>c.y+=state.speed*dt*.3);state.coins=state.coins.filter(c=>c.y<canvas.clientHeight+40);state.cops=state.cops.filter(c=>c.y<canvas.clientHeight+60);const py=canvas.clientHeight-92;state.coins.forEach(c=>{if(Math.abs(c.x-state.playerX)<34&&Math.abs(c.y-py)<42){state.score+=10;rewardEl.textContent='+$10';rewardEl.classList.remove('show');void rewardEl.offsetWidth;rewardEl.classList.add('show');c.y=9999}});state.cops.forEach(c=>{if(Math.abs(c.x-state.playerX)<40&&Math.abs(c.y-py)<52){state.heat+=18;flash.classList.remove('hit');void flash.offsetWidth;flash.classList.add('hit');c.y=9999;if(state.heat>=100){endGame()}}});state.speed=Math.min(11,5+(60-state.time)/8);scoreEl.textContent=state.score;timerEl.textContent=Math.ceil(state.time);heatEl.textContent=Math.min(100,Math.floor(state.heat))+'%'}
function render(){drawRoad();drawCoins();drawCops();drawPlayer()}
function frame(ts){if(!last)last=ts;const dt=ts-last;last=ts;update(dt);render();raf=requestAnimationFrame(frame)}
function endGame(){state.running=false;clearInterval(window.streetSpawn);cancelAnimationFrame(raf);overlay.classList.remove('hidden');const payout=state.score*3;if(window.state){window.state.cash=(window.state.cash||0)+payout}
if(state.score>state.best){state.best=state.score;localStorage.setItem('crimeEmpireStreetBest',state.best);bestEl.textContent=state.best}
document.getElementById('arcadeResult').innerHTML=`Street Run Complete<br><strong>$${payout}</strong> added to your empire`}
function move(dir){if(!state.running)return;state.lane=Math.max(0,Math.min(2,state.lane+dir));state.playerX=laneX(state.lane)}
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')move(-1);if(e.key==='ArrowRight'||e.key==='d')move(1)});
mobileLeft?.addEventListener('touchstart',e=>{e.preventDefault();move(-1)},{passive:false});
mobileRight?.addEventListener('touchstart',e=>{e.preventDefault();move(1)},{passive:false});
startBtn?.addEventListener('click',()=>{reset();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)});
retryBtn?.addEventListener('click',()=>{reset();last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)});
render();
}
