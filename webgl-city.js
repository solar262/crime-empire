import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

(() => {
  const state = { active:false, t:0, keys:new Set(), cash:12540, heat:7, kills:0, player:null, enemies:[], pickups:[], lights:[], vehicles:[], rain:[] };
  let root, canvas, renderer, scene, camera, clock, playerGroup, worldGroup, hudCash, hudKills, frameId, rainGroup;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const money=n=>'$'+Math.floor(n).toLocaleString();

  function make(tag, cls, html=''){ const e=document.createElement(tag); if(cls)e.className=cls; e.innerHTML=html; return e; }

  function boot(){
    const open=make('button','webgl-open','◆ WebGL City');
    document.body.appendChild(open);
    open.addEventListener('click',show);
    root=make('section','webgl-mode');
    root.style.display='none';
    root.innerHTML=`
      <canvas id="webglCanvas" class="webgl-canvas"></canvas>
      <div class="webgl-vignette"></div>
      <div class="webgl-ui">
        <button id="webglClose" class="webgl-close">×</button>
        <div class="wg-topbar">
          <div class="wg-profile"><div class="wg-portrait"></div><div><h2>Rookie</h2><p>LVL 7 <span>320 / 900 XP</span></p><i><b></b></i></div></div>
          <div class="wg-resources"><div>💵 <strong id="wgCash">$12,540</strong><button>+</button></div><div>🟨 <strong>125</strong><button>+</button></div><div>⚡ <strong>12/12</strong><button>+</button></div></div>
          <div class="wg-menu"><button>🏆<span>Rank</span></button><button>📋<span>Mission</span></button><button>🛒<span>Store</span></button><button>⚙<span>Settings</span></button></div>
        </div>
        <div class="wg-leftcol">
          <div class="wg-mission"><small>💀 MAIN MISSION</small><h1>TAKE OVER THE BLOCK</h1><p>Eliminate <b id="wgKills">0</b>/25 enemies and secure cash.</p><strong>REWARD: $2,500</strong></div>
          <div class="wg-side"><button>▦ CITY</button><button>▣ ARSENAL</button><button>♛ EMPIRE</button><button>◆ UPGRADES</button></div>
        </div>
        <div class="wg-event">DOUBLE CASH EVENT <b>2X</b></div>
        <div class="wg-rightcol">
          <div class="wg-heat"><span>HEAT LEVEL</span><div>${'<i></i>'.repeat(10)}</div><b>WANTED ★★★★★</b></div>
          <div class="wg-map"><em></em>${'<i></i>'.repeat(8)}</div>
        </div>
        <div class="wg-bottom">
          <div class="wg-joy"></div>
          <div class="wg-upgrades"><div><b>HEALTH</b><span>💗</span><small>LVL 3</small></div><div><b>DAMAGE</b><span>🗡</span><small>LVL 2</small></div><div><b>ARMOR</b><span>🛡</span><small>LVL 2</small></div><div><b>INCOME</b><span>💲</span><small>LVL 4</small></div></div>
          <div class="wg-actions"><button id="wgDash">DASH</button><button id="wgFire">⌖</button><button>💣 3</button></div>
        </div>
        <button id="wgPlay" class="wg-play">PLAY<small>ENTER THE CITY</small></button>
      </div>`;
    document.body.appendChild(root);
    canvas=document.getElementById('webglCanvas');
    hudCash=document.getElementById('wgCash'); hudKills=document.getElementById('wgKills');
    document.getElementById('webglClose').onclick=hide;
    document.getElementById('wgPlay').onclick=()=>{ document.getElementById('wgPlay').style.display='none'; startMission(); };
    document.getElementById('wgFire').onpointerdown=shoot;
    document.getElementById('wgDash').onclick=()=>{ if(playerGroup) playerGroup.userData.dash=.2; };
    window.addEventListener('keydown',e=>{state.keys.add(e.key.toLowerCase()); if(e.code==='Space')shoot();});
    window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
    initThree();
  }

  function show(){ root.style.display='block'; state.active=true; resize(); if(!frameId) animate(); }
  function hide(){ root.style.display='none'; state.active=false; }

  function initThree(){
    renderer=new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.25;
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x02040a);
    scene.fog=new THREE.FogExp2(0x07101a,.026);
    camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,1000);
    camera.position.set(0,34,48);
    camera.lookAt(0,0,0);
    clock=new THREE.Clock();
    worldGroup=new THREE.Group(); scene.add(worldGroup);
    const hemi=new THREE.HemisphereLight(0x365cff,0x06070d,1.35); scene.add(hemi);
    const moon=new THREE.DirectionalLight(0xf4fbff,1.7); moon.position.set(-18,40,26); moon.castShadow=true; moon.shadow.mapSize.set(2048,2048); scene.add(moon);
    addCity(); addRain(); addPlayer(); addPickups(); addEnemies(); resize(); renderOnce();
    window.addEventListener('resize',resize);
  }

  function mat(color, emissive=0x000000, intensity=0, rough=.52, metal=.22){ return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal, emissive, emissiveIntensity:intensity }); }
  function box(w,h,d,m){ const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); mesh.castShadow=true; mesh.receiveShadow=true; return mesh; }

  function addCity(){
    const roadMat=new THREE.MeshStandardMaterial({color:0x06090f,roughness:.18,metalness:.62,emissive:0x020509,emissiveIntensity:.2});
    const road=box(38,.22,110,roadMat); road.position.y=-.1; road.receiveShadow=true; worldGroup.add(road);
    const sidewalkMat=mat(0x101827,0x071a2d,.25,.35,.35);
    for(const x of [-24,24]){ const walk=box(7,.25,110,sidewalkMat); walk.position.set(x,0,0); worldGroup.add(walk); }
    const lineMat=mat(0xf8c64a,0xf8c64a,1.8,.32,.15);
    for(let z=-52;z<54;z+=7){ const l=box(.34,.055,3.1,lineMat); l.position.set(0,.08,z); worldGroup.add(l); }
    const curbBlue=mat(0x00d8ff,0x00d8ff,1.2);
    const curbPink=mat(0xff2d74,0xff2d74,1.2);
    for(let z=-52;z<54;z+=8){ for(const side of [-1,1]){ const c=box(.18,.12,4, side<0?curbBlue:curbPink); c.position.set(side*19,.14,z); worldGroup.add(c); } }
    for(let side of [-1,1]){
      for(let i=0;i<28;i++){
        const h=5+Math.random()*22, w=4+Math.random()*6, d=4+Math.random()*9;
        const neon=i%2?0xff2d74:0x00d8ff;
        const b=box(w,h,d,mat(0x0b1322,neon,.12,.5,.28));
        b.position.set(side*(25+Math.random()*25),h/2-0.05,-54+i*4+Math.random()*2);
        worldGroup.add(b);
        const trim=box(w+.18,.08,d+.18,mat(neon,neon,1.15)); trim.position.set(b.position.x,h+.05,b.position.z); worldGroup.add(trim);
        for(let floor=1;floor<h-1;floor+=2.2){
          for(let col=-w/2+1;col<w/2-0.3;col+=1.3){
            if(Math.random()>.45){ const win=box(.42,.58,.04,mat(neon,neon,1.65)); win.position.set(b.position.x+col,floor,b.position.z-side*d/2-.04); worldGroup.add(win); }
          }
        }
        if(i%3===0){ const light=new THREE.PointLight(neon,1.25,18); light.position.set(b.position.x,h*.65,b.position.z); worldGroup.add(light); state.lights.push(light); }
      }
    }
    for(let i=0;i<12;i++) addVehicle((Math.random()-.5)*24,-48+i*8, i%2?0xff2d74:0x00d8ff);
    const heliLight=new THREE.SpotLight(0x9edcff,5.5,90,0.22,0.65); heliLight.position.set(12,36,-8); heliLight.target.position.set(0,0,-8); scene.add(heliLight,heliLight.target); state.heli=heliLight;
  }

  function addVehicle(x,z,neon){
    const g=new THREE.Group();
    const body=box(3.4,.9,5.4,mat(0x121827,neon,.45,.35,.45)); body.position.y=.55; g.add(body);
    const top=box(2.2,.7,2.2,mat(0x17243a,0x000000,0,.25,.4)); top.position.y=1.25; top.position.z=-.25; g.add(top);
    const l1=new THREE.PointLight(neon,1.6,9); l1.position.set(-1.3,1,2.4); const l2=new THREE.PointLight(0xffffff,1.4,7); l2.position.set(1.3,1,2.4); g.add(l1,l2);
    g.position.set(x,0,z); worldGroup.add(g); state.vehicles.push(g);
  }

  function addRain(){
    rainGroup=new THREE.Group(); scene.add(rainGroup);
    const rainMat=new THREE.MeshBasicMaterial({color:0x7fdcff,transparent:true,opacity:.28});
    for(let i=0;i<220;i++){ const drop=new THREE.Mesh(new THREE.BoxGeometry(.025,.7,.025),rainMat); drop.position.set((Math.random()-.5)*80,8+Math.random()*35,(Math.random()-.5)*120); rainGroup.add(drop); state.rain.push(drop); }
  }

  function addPlayer(){
    playerGroup=new THREE.Group(); playerGroup.userData={speed:18,dash:0,hp:100};
    const body=box(1.45,2.15,1.45,mat(0xffd35a,0xffd35a,.85,.42,.25)); body.position.y=1.12; playerGroup.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.48,24,18),mat(0xffe0a3,0x000000,0,.48,.1)); head.position.y=2.45; playerGroup.add(head);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9,.06,16,80),new THREE.MeshBasicMaterial({color:0x46d9ff,transparent:true,opacity:.95})); ring.rotation.x=Math.PI/2; ring.position.y=.07; playerGroup.add(ring);
    const light=new THREE.PointLight(0x46d9ff,3.2,13); light.position.y=2; playerGroup.add(light);
    playerGroup.position.set(0,0,12); scene.add(playerGroup); state.player=playerGroup;
  }

  function addEnemy(x,z){ const g=new THREE.Group(); g.userData={hp:45,kind:'enemy'}; const m=box(1.25,1.85,1.25,mat(0x111827,0xff2d74,.65,.45,.25)); m.position.y=.95; g.add(m); const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),mat(0x242a38,0xff2d74,.2)); head.position.y=2.1; g.add(head); const l=new THREE.PointLight(0xff2d74,2.1,10); l.position.y=1.8; g.add(l); g.position.set(x,0,z); scene.add(g); state.enemies.push(g); }
  function addEnemies(){ for(let i=0;i<16;i++) addEnemy((Math.random()-.5)*25,-35+Math.random()*64); }
  function addPickup(x,z){ const g=new THREE.Group(); g.userData={kind:'cash',value:100}; const coin=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.18,40),new THREE.MeshStandardMaterial({color:0x42ef74,emissive:0x42ef74,emissiveIntensity:1.2,metalness:.25,roughness:.28})); coin.rotation.x=Math.PI/2; coin.position.y=.78; g.add(coin); const l=new THREE.PointLight(0x42ef74,1.8,8); l.position.y=1; g.add(l); g.position.set(x,0,z); scene.add(g); state.pickups.push(g); }
  function addPickups(){ for(let i=0;i<28;i++) addPickup((Math.random()-.5)*28,-40+Math.random()*76); }

  function startMission(){ state.cash=12540; state.kills=0; sync(); }
  function axis(){ let x=0,z=0; if(state.keys.has('a')||state.keys.has('arrowleft'))x--; if(state.keys.has('d')||state.keys.has('arrowright'))x++; if(state.keys.has('w')||state.keys.has('arrowup'))z--; if(state.keys.has('s')||state.keys.has('arrowdown'))z++; const l=Math.hypot(x,z)||1; return {x:x/l,z:z/l}; }
  function nearestEnemy(){ let best=null,d=999; for(const e of state.enemies){ const n=e.position.distanceTo(playerGroup.position); if(n<d){d=n;best=e;} } return best; }
  function shoot(){ if(!playerGroup) return; const e=nearestEnemy(); if(!e) return; e.userData.hp-=25; const beamMat=new THREE.MeshBasicMaterial({color:0xffd35a,transparent:true,opacity:.95}); const beam=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,1,8),beamMat); const start=playerGroup.position.clone().add(new THREE.Vector3(0,1.4,0)); const end=e.position.clone().add(new THREE.Vector3(0,1,0)); const mid=start.clone().add(end).multiplyScalar(.5); beam.position.copy(mid); beam.scale.y=start.distanceTo(end); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()); scene.add(beam); const flash=new THREE.PointLight(0xffd35a,4,10); flash.position.copy(start); scene.add(flash); setTimeout(()=>{scene.remove(beam);scene.remove(flash)},80); if(e.userData.hp<=0){ scene.remove(e); state.enemies=state.enemies.filter(x=>x!==e); state.kills++; state.cash+=250; addEnemy((Math.random()-.5)*25,-35+Math.random()*64); addPickup(e.position.x,e.position.z); sync(); } }
  function sync(){ if(hudCash)hudCash.textContent=money(state.cash); if(hudKills)hudKills.textContent=state.kills; }

  function update(dt){
    if(!state.active || !playerGroup) return;
    state.t+=dt;
    const a=axis(); const speed=playerGroup.userData.dash>0?38:16; playerGroup.userData.dash=Math.max(0,playerGroup.userData.dash-dt);
    playerGroup.position.x=clamp(playerGroup.position.x+a.x*speed*dt,-15,15); playerGroup.position.z=clamp(playerGroup.position.z+a.z*speed*dt,-38,36);
    camera.position.x += (playerGroup.position.x - camera.position.x)*dt*1.65;
    camera.position.z += (playerGroup.position.z + 32 - camera.position.z)*dt*1.25;
    camera.position.y += (32 + Math.sin(state.t*.8)*.8 - camera.position.y)*dt*.8;
    camera.lookAt(playerGroup.position.x,0,playerGroup.position.z-5);
    for(const e of state.enemies){ const dir=playerGroup.position.clone().sub(e.position); dir.y=0; const len=dir.length()||1; dir.multiplyScalar(1/len); e.position.addScaledVector(dir,dt*2.9); e.children[0].rotation.y+=dt*2.2; }
    for(const p of [...state.pickups]){ p.rotation.y+=dt*3; p.position.y=Math.sin(state.t*3+p.position.x)*.18; if(p.position.distanceTo(playerGroup.position)<2.2){ state.cash+=p.userData.value; scene.remove(p); state.pickups=state.pickups.filter(x=>x!==p); addPickup((Math.random()-.5)*28,-40+Math.random()*76); sync(); } }
    for(const v of state.vehicles){ v.position.z += dt*(v.position.x>0?-3.5:3.5); if(v.position.z>55)v.position.z=-55; if(v.position.z<-55)v.position.z=55; }
    for(const r of state.rain){ r.position.y-=dt*24; r.position.z+=dt*8; if(r.position.y<0){ r.position.y=25+Math.random()*18; r.position.x=(Math.random()-.5)*80; r.position.z=(Math.random()-.5)*120; } }
    if(state.keys.has(' ')) shoot();
    if(state.heli){ state.heli.position.x=Math.sin(state.t*.55)*18; state.heli.position.z=-8+Math.cos(state.t*.4)*14; state.heli.target.position.copy(playerGroup.position); }
    for(let i=0;i<state.lights.length;i++){ state.lights[i].intensity=.8+Math.sin(state.t*3+i)*.32; }
  }
  function renderOnce(){ renderer.render(scene,camera); }
  function animate(){ frameId=requestAnimationFrame(animate); const dt=Math.min(.033,clock.getDelta()); update(dt); renderer.render(scene,camera); }
  function resize(){ if(!renderer||!camera)return; renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }

  document.addEventListener('DOMContentLoaded',boot);
})();
