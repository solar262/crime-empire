import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

(() => {
  const state = { active:false, ready:false, t:0, keys:new Set(), cash:12540, heat:7, kills:0, player:null, enemies:[], pickups:[], bullets:[], lights:[] };
  let root, canvas, renderer, scene, camera, clock, playerGroup, worldGroup, hudCash, hudKills, frameId;
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
      <div class="webgl-ui">
        <button id="webglClose" class="webgl-close">×</button>
        <div class="wg-profile"><div class="wg-portrait"></div><div><h2>Rookie</h2><p>LVL 7 <span>320 / 900 XP</span></p><i><b></b></i></div></div>
        <div class="wg-resources"><div>💵 <strong id="wgCash">$12,540</strong><button>+</button></div><div>🟨 <strong>125</strong><button>+</button></div><div>⚡ <strong>12/12</strong><button>+</button></div></div>
        <div class="wg-mission"><small>💀 MAIN MISSION</small><h1>TAKE OVER THE BLOCK</h1><p>Eliminate <b id="wgKills">0</b>/25 enemies and secure cash.</p><strong>REWARD: $2,500</strong></div>
        <div class="wg-event">DOUBLE CASH EVENT <b>2X</b></div>
        <div class="wg-heat"><span>HEAT LEVEL</span><div>${'<i></i>'.repeat(10)}</div><b>WANTED ★★★★★</b></div>
        <div class="wg-map"><em></em>${'<i></i>'.repeat(8)}</div>
        <div class="wg-side"><button>▦ CITY</button><button>▣ ARSENAL</button><button>♛ EMPIRE</button><button>◆ UPGRADES</button></div>
        <div class="wg-actions"><button id="wgDash">DASH</button><button id="wgFire">⌖</button><button>💣 3</button></div>
        <div class="wg-joy"></div>
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
    scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x05070d,.018);
    camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,1000);
    camera.position.set(0,38,44);
    camera.lookAt(0,0,0);
    clock=new THREE.Clock();
    worldGroup=new THREE.Group(); scene.add(worldGroup);
    const hemi=new THREE.HemisphereLight(0x2c5cff,0x06070d,1.15); scene.add(hemi);
    const moon=new THREE.DirectionalLight(0xffffff,1.15); moon.position.set(-15,35,20); moon.castShadow=true; scene.add(moon);
    addCity(); addPlayer(); addPickups(); addEnemies(); resize(); renderOnce();
    window.addEventListener('resize',resize);
  }

  function mat(color, emissive=0x000000, intensity=0){ return new THREE.MeshStandardMaterial({ color, roughness:.58, metalness:.18, emissive, emissiveIntensity:intensity }); }
  function box(w,h,d,m){ const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); mesh.castShadow=true; mesh.receiveShadow=true; return mesh; }

  function addCity(){
    const roadMat=mat(0x090d14,0x000000,0);
    const road=box(34,.18,90,roadMat); road.position.y=-.08; road.receiveShadow=true; worldGroup.add(road);
    const lineMat=mat(0xf8c64a,0xf8c64a,.8);
    for(let z=-42;z<44;z+=7){ const l=box(.3,.04,3,lineMat); l.position.set(0,.06,z); worldGroup.add(l); }
    const sideMat=mat(0x101827,0x00d8ff,.18);
    for(let side of [-1,1]){
      for(let i=0;i<22;i++){
        const h=3+Math.random()*14, w=3+Math.random()*4, d=3+Math.random()*7;
        const b=box(w,h,d,sideMat.clone());
        b.material.emissive=new THREE.Color(i%2?0xff2d74:0x00d8ff); b.material.emissiveIntensity=.12;
        b.position.set(side*(22+Math.random()*20),h/2-0.05,-43+i*4+Math.random()*2);
        worldGroup.add(b);
        for(let k=0;k<4;k++){ const light=new THREE.PointLight(i%2?0xff2d74:0x00d8ff,.75,12); light.position.set(b.position.x+(Math.random()-.5)*w,h*.55,b.position.z+(Math.random()-.5)*d); worldGroup.add(light); state.lights.push(light); }
      }
    }
    for(let i=0;i<10;i++){ const car=box(3,.9,5,mat(i%2?0x211024:0x101827,i%2?0xff2d74:0x00d8ff,.45)); car.position.set((Math.random()-.5)*26,.45,-38+i*8); worldGroup.add(car); }
    const heliLight=new THREE.SpotLight(0x9edcff,3.5,80,0.26,0.55); heliLight.position.set(12,34,-8); heliLight.target.position.set(0,0,-8); scene.add(heliLight,heliLight.target); state.heli=heliLight;
  }

  function addPlayer(){
    playerGroup=new THREE.Group(); playerGroup.userData={speed:18,dash:0,hp:100};
    const body=box(1.4,2.2,1.4,mat(0xffd35a,0xffd35a,.5)); body.position.y=1.1; playerGroup.add(body);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.8,.05,16,64),new THREE.MeshBasicMaterial({color:0x46d9ff})); ring.rotation.x=Math.PI/2; ring.position.y=.06; playerGroup.add(ring);
    const light=new THREE.PointLight(0x46d9ff,2.2,10); light.position.y=2; playerGroup.add(light);
    playerGroup.position.set(0,0,12); scene.add(playerGroup); state.player=playerGroup;
  }

  function addEnemy(x,z){ const g=new THREE.Group(); g.userData={hp:45,kind:'enemy'}; const m=box(1.2,1.8,1.2,mat(0x111827,0xff2d74,.4)); m.position.y=.9; g.add(m); const l=new THREE.PointLight(0xff2d74,1.5,8); l.position.y=1.8; g.add(l); g.position.set(x,0,z); scene.add(g); state.enemies.push(g); }
  function addEnemies(){ for(let i=0;i<16;i++) addEnemy((Math.random()-.5)*25,-35+Math.random()*64); }
  function addPickup(x,z){ const g=new THREE.Group(); g.userData={kind:'cash',value:100}; const coin=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,.16,32),new THREE.MeshStandardMaterial({color:0x42ef74,emissive:0x42ef74,emissiveIntensity:.7,metalness:.2,roughness:.35})); coin.rotation.x=Math.PI/2; coin.position.y=.7; g.add(coin); const l=new THREE.PointLight(0x42ef74,1.2,7); l.position.y=1; g.add(l); g.position.set(x,0,z); scene.add(g); state.pickups.push(g); }
  function addPickups(){ for(let i=0;i<28;i++) addPickup((Math.random()-.5)*28,-40+Math.random()*76); }

  function startMission(){ state.cash=12540; state.kills=0; sync(); }
  function axis(){ let x=0,z=0; if(state.keys.has('a')||state.keys.has('arrowleft'))x--; if(state.keys.has('d')||state.keys.has('arrowright'))x++; if(state.keys.has('w')||state.keys.has('arrowup'))z--; if(state.keys.has('s')||state.keys.has('arrowdown'))z++; const l=Math.hypot(x,z)||1; return {x:x/l,z:z/l}; }
  function nearestEnemy(){ let best=null,d=999; for(const e of state.enemies){ const n=e.position.distanceTo(playerGroup.position); if(n<d){d=n;best=e;} } return best; }
  function shoot(){ if(!playerGroup) return; const e=nearestEnemy(); if(!e) return; e.userData.hp-=25; const beam=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,8),new THREE.MeshBasicMaterial({color:0xffd35a})); const start=playerGroup.position.clone().add(new THREE.Vector3(0,1.4,0)); const end=e.position.clone().add(new THREE.Vector3(0,1,0)); const mid=start.clone().add(end).multiplyScalar(.5); beam.position.copy(mid); beam.scale.y=start.distanceTo(end); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize()); scene.add(beam); setTimeout(()=>scene.remove(beam),80); if(e.userData.hp<=0){ scene.remove(e); state.enemies=state.enemies.filter(x=>x!==e); state.kills++; state.cash+=250; addEnemy((Math.random()-.5)*25,-35+Math.random()*64); addPickup(e.position.x,e.position.z); sync(); } }
  function sync(){ if(hudCash)hudCash.textContent=money(state.cash); if(hudKills)hudKills.textContent=state.kills; }

  function update(dt){
    if(!state.active) return;
    state.t+=dt;
    const a=axis(); const speed=playerGroup.userData.dash>0?36:16; playerGroup.userData.dash=Math.max(0,playerGroup.userData.dash-dt);
    playerGroup.position.x=clamp(playerGroup.position.x+a.x*speed*dt,-15,15); playerGroup.position.z=clamp(playerGroup.position.z+a.z*speed*dt,-38,36);
    camera.position.x += (playerGroup.position.x - camera.position.x)*dt*1.8;
    camera.position.z += (playerGroup.position.z + 30 - camera.position.z)*dt*1.4;
    camera.lookAt(playerGroup.position.x,0,playerGroup.position.z-4);
    for(const e of state.enemies){ const dir=playerGroup.position.clone().sub(e.position); dir.y=0; const len=dir.length()||1; dir.multiplyScalar(1/len); e.position.addScaledVector(dir,dt*3.2); e.children[0].rotation.y+=dt*2; }
    for(const p of [...state.pickups]){ p.rotation.y+=dt*3; if(p.position.distanceTo(playerGroup.position)<2.2){ state.cash+=p.userData.value; scene.remove(p); state.pickups=state.pickups.filter(x=>x!==p); addPickup((Math.random()-.5)*28,-40+Math.random()*76); sync(); } }
    if(state.keys.has(' ')) shoot();
    if(state.heli){ state.heli.position.x=Math.sin(state.t*.55)*18; state.heli.position.z=-8+Math.cos(state.t*.4)*14; state.heli.target.position.copy(playerGroup.position); }
    for(let i=0;i<state.lights.length;i++){ state.lights[i].intensity=.45+Math.sin(state.t*3+i)*.22; }
  }
  function renderOnce(){ renderer.render(scene,camera); }
  function animate(){ frameId=requestAnimationFrame(animate); const dt=Math.min(.033,clock.getDelta()); update(dt); renderer.render(scene,camera); }
  function resize(){ if(!renderer||!camera)return; renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }

  document.addEventListener('DOMContentLoaded',boot);
})();
