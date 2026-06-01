const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultState = {
  cash: 0,
  respect: 0,
  heat: 0,
  energy: 10,
  maxEnergy: 10,
  boostUntil: 0,
  lastSave: Date.now(),
  lastDaily: '',
  dailyStreak: 0,
  tutorialSeen: false,
  eventIndex: 0,
  eventUntil: Date.now() + 120000,
  missionIndex: 0,
  missionPoints: 0,
  chestsOpened: 0,
  bossIndex: 0,
  bossHp: 0,
  bossesBeaten: 0,
  hq: { office: 1, training: 0, logistics: 0, legal: 0 },
  businesses: { cornerShop: 0, nightClub: 0, autoGarage: 0, privateSecurity: 0, importWarehouse: 0, luxuryHotel: 0, mediaCompany: 0, tower: 0 },
  crew: { lookout: 0, driver: 0, fixer: 0, lieutenant: 0, strategist: 0, captain: 0, negotiator: 0, mastermind: 0 },
  districts: []
};

const icons = {
  cornerShop:'Shop', nightClub:'Club', autoGarage:'Cars', privateSecurity:'Shield', importWarehouse:'Cargo', luxuryHotel:'Hotel', mediaCompany:'Media', tower:'Tower',
  lookout:'Eye', driver:'Drive', fixer:'Fix', lieutenant:'Lt', strategist:'Plan', captain:'Cap', negotiator:'Deal', mastermind:'Mind',
  street:'Cash', club:'Club', garage:'Shop', dock:'Dock', casino:'Dice', summit:'Boss',
  office:'Office', training:'Train', logistics:'Truck', legal:'Legal'
};

const businesses = [
  ['cornerShop', 'Corner Shop', 25, 1, 'Fast early cash.'],
  ['nightClub', 'Night Club', 175, 9, 'Bigger nightly income.'],
  ['autoGarage', 'Auto Garage', 950, 42, 'Cars, parts, and favors.'],
  ['privateSecurity', 'Private Security', 4200, 165, 'Protection and influence.'],
  ['importWarehouse', 'Import Warehouse', 18000, 640, 'Big logistics profits.'],
  ['luxuryHotel', 'Luxury Hotel', 75000, 2400, 'Elite cash flow.'],
  ['mediaCompany', 'Media Company', 240000, 7800, 'Controls the story.'],
  ['tower', 'Crown Tower', 900000, 25000, 'Endgame landmark.']
].map(([id, name, baseCost, income, text]) => ({ id, name, baseCost, income, text }));

const crew = [
  ['lookout', 'Lookout', 60, 3, 'Sees trouble early.'],
  ['driver', 'Driver', 240, 11, 'Fast wheels.'],
  ['fixer', 'Fixer', 1050, 46, 'Solves problems.'],
  ['lieutenant', 'Lieutenant', 5200, 190, 'Runs blocks.'],
  ['strategist', 'Strategist', 21000, 760, 'Plans better jobs.'],
  ['captain', 'Captain', 90000, 3000, 'Commands districts.'],
  ['negotiator', 'Negotiator', 340000, 9500, 'Cuts deals.'],
  ['mastermind', 'Mastermind', 1250000, 32000, 'Controls the board.']
].map(([id, name, baseCost, power, text]) => ({ id, name, baseCost, power, text }));

const jobs = [
  { id: 'street', name: 'Street Collection', energy: 1, cash: 35, respect: 2, heat: 2, power: 0, text: 'Low risk starter job.' },
  { id: 'club', name: 'Club Negotiation', energy: 2, cash: 160, respect: 8, heat: 5, power: 12, text: 'Needs a small crew.' },
  { id: 'garage', name: 'Garage Takeover', energy: 3, cash: 620, respect: 24, heat: 9, power: 55, text: 'Midgame growth move.' },
  { id: 'dock', name: 'Dockyard Deal', energy: 4, cash: 2400, respect: 70, heat: 14, power: 180, text: 'Big payday.' },
  { id: 'casino', name: 'Casino Night', energy: 5, cash: 9000, respect: 210, heat: 22, power: 650, text: 'High stakes play.' },
  { id: 'summit', name: 'Underworld Summit', energy: 6, cash: 30000, respect: 600, heat: 32, power: 2200, text: 'Late-game boss move.' }
];

const hqDefs = [
  { id: 'office', name: 'Back Office', base: 500, text: 'Raises max energy.', effect: level => `Max energy +${level * 2}` },
  { id: 'training', name: 'Training Room', base: 1200, text: 'Increases crew power.', effect: level => `Power +${level * 8}%` },
  { id: 'logistics', name: 'Logistics Network', base: 1800, text: 'Improves income.', effect: level => `Income +${level * 6}%` },
  { id: 'legal', name: 'Legal Team', base: 1500, text: 'Reduces heat.', effect: level => `Heat -${level * 5}%` }
];

const cityEvents = [
  { name: 'Quiet Streets', text: 'The city is quiet. Build your base.', income: 1, job: 1, heat: 1 },
  { name: 'Busy Weekend', text: 'Job payouts are 25% higher.', income: 1, job: 1.25, heat: 1.05 },
  { name: 'Police Pressure', text: 'Heat rises faster, respect pays more.', income: 1, job: 1.05, heat: 1.35 },
  { name: 'Business Boom', text: 'Front income is 30% higher.', income: 1.3, job: 1, heat: 1 },
  { name: 'Rival War', text: 'Rival fights pay more.', income: 1, job: 1, heat: 1.15 }
];

const bosses = [
  { name: 'Street Captain', power: 15, hp: 80, reward: 450, respect: 20 },
  { name: 'Dockyard Enforcer', power: 75, hp: 220, reward: 1800, respect: 70 },
  { name: 'Casino Baron', power: 240, hp: 640, reward: 6500, respect: 180 },
  { name: 'Uptown King', power: 850, hp: 1800, reward: 24000, respect: 520 },
  { name: 'City Mayor', power: 2600, hp: 5200, reward: 90000, respect: 1500 },
  { name: 'Crown Syndicate', power: 8500, hp: 15000, reward: 300000, respect: 5000 }
];

const districtNames = ['Old Docks','Market Row','West Blocks','Neon Mile','Harbor Point','Iron Yard','Gold Avenue','Uptown','Casino Strip','Royal Park','Diamond Pier','City Hall','Airport Road','The Heights','Crown Island'];
const ranks = [['Rookie',0,0],['Enforcer',20,50],['Operator',75,200],['Shot Caller',200,700],['Boss',700,2500],['Kingpin',2500,9000],['City Legend',9000,25000]];
const missions = [
  { text: 'Collect $100 cash', goal: s => Math.min(1, s.cash / 100), done: s => s.cash >= 100, reward: 120 },
  { text: 'Buy 1 business', goal: s => Math.min(1, totalFronts(s) / 1), done: s => totalFronts(s) >= 1, reward: 180 },
  { text: 'Hire 2 crew members', goal: s => Math.min(1, totalCrew(s) / 2), done: s => totalCrew(s) >= 2, reward: 260 },
  { text: 'Beat the first Arena boss', goal: s => Math.min(1, s.bossesBeaten / 1), done: s => s.bossesBeaten >= 1, reward: 500 },
  { text: 'Reach 50 respect', goal: s => Math.min(1, s.respect / 50), done: s => s.respect >= 50, reward: 500 },
  { text: 'Take 1 district', goal: s => Math.min(1, s.districts.length / 1), done: s => s.districts.length >= 1, reward: 900 },
  { text: 'Reach $50/sec income', goal: s => Math.min(1, rawIncome(s) / 50), done: s => rawIncome(s) >= 50, reward: 1800 },
  { text: 'Control 5 districts', goal: s => Math.min(1, s.districts.length / 5), done: s => s.districts.length >= 5, reward: 10000 }
];

let state = load();

function cloneDefault(){ return JSON.parse(JSON.stringify(defaultState)); }
function load(){
  const base = cloneDefault();
  try {
    const saved = JSON.parse(localStorage.getItem('crimeEmpireSaveV3') || localStorage.getItem('crimeEmpireSaveV2') || 'null');
    const merged = saved ? { ...base, ...saved } : base;
    merged.hq = { ...base.hq, ...(saved?.hq || {}) };
    merged.businesses = { ...base.businesses, ...(saved?.businesses || {}) };
    merged.crew = { ...base.crew, ...(saved?.crew || {}) };
    merged.missionIndex = saved?.missionIndex || 0;
    merged.missionPoints = saved?.missionPoints || 0;
    merged.chestsOpened = saved?.chestsOpened || 0;
    merged.bossIndex = saved?.bossIndex || 0;
    merged.bossesBeaten = saved?.bossesBeaten || 0;
    merged.bossHp = saved?.bossHp || 0;
    return merged;
  } catch { return base; }
}
function save(show = true){ state.lastSave = Date.now(); localStorage.setItem('crimeEmpireSaveV3', JSON.stringify(state)); if(show) log('Progress saved.'); }
function fmt(v){ return money.format(Math.floor(v)); }
function currentEvent(){ if(Date.now() > state.eventUntil){ state.eventIndex = (state.eventIndex + 1) % cityEvents.length; state.eventUntil = Date.now() + 120000; } return cityEvents[state.eventIndex] || cityEvents[0]; }
function totalFronts(s = state){ return Object.values(s.businesses).reduce((a,b)=>a+b,0); }
function totalCrew(s = state){ return Object.values(s.crew).reduce((a,b)=>a+b,0); }
function boost(){ return Date.now() < state.boostUntil ? 2 : 1; }
function incomeBonus(s = state){ return 1 + s.districts.length * 0.04 + (s.hq.logistics || 0) * 0.06; }
function rawIncome(s = state){ return businesses.reduce((sum,b)=>sum + (s.businesses[b.id] || 0) * b.income, 0) * incomeBonus(s) * currentEvent().income; }
function income(){ return rawIncome() * boost(); }
function crewBonus(s = state){ return 1 + (s.hq.training || 0) * 0.08; }
function power(s = state){ const base = crew.reduce((sum,c)=>sum + (s.crew[c.id] || 0) * c.power, 0); return Math.floor(base * crewBonus(s) + s.districts.length * 18 + Math.floor(s.respect / 20)); }
function cost(base, level, growth){ return Math.floor(base * Math.pow(growth, level)); }
function businessCost(b){ return cost(b.baseCost, state.businesses[b.id] || 0, 1.18); }
function crewCost(c){ return cost(c.baseCost, state.crew[c.id] || 0, 1.2); }
function hqCost(h){ return cost(h.base, state.hq[h.id] || 0, 1.75); }
function tapValue(){ return 1 + Math.floor(rawIncome() / 5) + state.districts.length + Math.floor(state.respect / 100); }
function heatModifier(){ return Math.max(0.35, (1 - (state.hq.legal || 0) * 0.05) * currentEvent().heat); }
function rivalPower(){ return Math.floor(25 + state.districts.length * (currentEvent().name === 'Rival War' ? 48 : 35) + rawIncome() * .65 + state.heat * 2); }
function districtCost(i){ return 350 + i * 520 + Math.floor(i*i*110); }
function districtPower(i){ return 12 + i * 28; }
function rankName(s = state){ let r = ranks[0][0]; for(const [name, needPower, needRespect] of ranks){ if(power(s) >= needPower && s.respect >= needRespect) r = name; } return r; }
function nextRankText(){ const current = rankName(); const next = ranks.find(r => r[0] !== current && (power() < r[1] || state.respect < r[2])); return next ? `Next: ${next[0]} · ${next[1]} power · ${next[2]} respect` : 'Max rank reached'; }
function maxEnergy(){ return 10 + (state.hq.office || 0) * 2; }
function activeMission(){ return missions[Math.min(state.missionIndex, missions.length - 1)]; }
function activeBoss(){ return bosses[Math.min(state.bossIndex, bosses.length - 1)]; }
function ensureBossHp(){ const b = activeBoss(); if(!state.bossHp || state.bossHp <= 0 || state.bossHp > b.hp) state.bossHp = b.hp; }
function log(msg){ const el = document.getElementById('eventLog'); if(el) el.textContent = msg; }
function battleLog(msg){ const el = document.getElementById('battleLog'); if(el) el.textContent = msg; log(msg); }
function showModal(title, html){ document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); }
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }
function floatCash(text){ const layer=document.getElementById('floatLayer'); if(!layer) return; const el=document.createElement('div'); el.className='float-cash'; el.textContent=text; el.style.left=(window.innerWidth/2-30+Math.random()*60)+'px'; el.style.top=(window.innerHeight*.58)+'px'; layer.appendChild(el); setTimeout(()=>el.remove(),900); }

function buyBusiness(id){ const b = businesses.find(x=>x.id===id), c = businessCost(b); if(state.cash < c) return log('Need more cash for that front.'); state.cash -= c; state.businesses[id]++; state.respect += 1; log(`${b.name} upgraded.`); render(); }
function hire(id){ const c = crew.find(x=>x.id===id), price = crewCost(c); if(state.cash < price) return log('Need more cash to hire.'); state.cash -= price; state.crew[id]++; state.respect += 2; log(`${c.name} joined the crew.`); render(); }
function upgradeHq(id){ const h = hqDefs.find(x=>x.id===id), price = hqCost(h); if(state.cash < price) return log('Need more cash for that HQ upgrade.'); state.cash -= price; state.hq[id] = (state.hq[id] || 0) + 1; state.maxEnergy = maxEnergy(); log(`${h.name} upgraded to level ${state.hq[id]}.`); render(); }
function runJob(id){
  const j = jobs.find(x=>x.id===id); if(state.energy < j.energy) return log('Not enough energy.'); if(power() < j.power) return log('Crew power too low.');
  state.energy -= j.energy; const heatRisk = Math.max(0, state.heat - power()/120); const success = Math.random()*100 > heatRisk * .35;
  const payout = Math.floor((j.cash + rawIncome()*8) * currentEvent().job);
  if(success){ state.cash += payout; state.respect += j.respect; state.heat = Math.min(100, state.heat + j.heat * heatModifier()); log(`${j.name}: +${fmt(payout)}, +${j.respect} respect.`); floatCash(`+${fmt(payout)}`); }
  else { state.respect += Math.ceil(j.respect/4); state.heat = Math.min(100, state.heat + (j.heat + 8) * heatModifier()); log(`${j.name} got messy. Heat rose.`); }
  render();
}
function takeDistrict(i){ if(state.districts.includes(i)) return; if(state.cash < districtCost(i)) return log('Need more cash for that district.'); if(power() < districtPower(i)) return log('Crew power too low.'); state.cash -= districtCost(i); state.districts.push(i); state.respect += 30 + i*10; log(`${districtNames[i]} is yours.`); render(); }
function fight(){ const r = rivalPower(); if(power() + Math.random()*80 >= r){ const prize = Math.floor((150 + r*5) * (currentEvent().name === 'Rival War' ? 1.5 : 1)); state.cash += prize; state.respect += 18; state.heat = Math.min(100, state.heat+6*heatModifier()); log(`Rival beaten. +${fmt(prize)}.`); floatCash(`+${fmt(prize)}`); } else { state.respect += 4; state.heat = Math.min(100, state.heat+3*heatModifier()); log('Rival crew pushed back. +4 respect.'); } render(); }
function attackBoss(){
  ensureBossHp();
  const b = activeBoss();
  if(state.energy < 2) return battleLog('Need 2 energy to attack the boss.');
  if(power() < Math.floor(b.power * 0.55)) return battleLog('Your crew is too weak. Hire crew or upgrade HQ Training.');
  state.energy -= 2;
  const damage = Math.max(8, Math.floor(power() * (0.42 + Math.random() * 0.38)));
  state.bossHp = Math.max(0, state.bossHp - damage);
  if(state.bossHp <= 0){
    const reward = b.reward + Math.floor(rawIncome() * 60);
    state.cash += reward;
    state.respect += b.respect;
    state.missionPoints += 35;
    state.bossesBeaten += 1;
    if(state.bossIndex < bosses.length - 1) state.bossIndex += 1;
    state.bossHp = activeBoss().hp;
    battleLog(`${b.name} defeated. +${fmt(reward)}, +${b.respect} respect, +35 chest points.`);
    showModal('Boss Defeated', `<div class="reward-box"><strong>${b.name} defeated!</strong><p>You earned ${fmt(reward)}, ${b.respect} respect, and 35 chest points.</p></div>`);
  } else {
    const counter = Math.max(1, Math.floor((b.power - power()) / 120));
    state.heat = Math.min(100, state.heat + counter * heatModifier());
    battleLog(`Hit ${b.name} for ${damage} damage. Boss HP: ${Math.ceil(state.bossHp)}/${b.hp}.`);
  }
  render(); save(false);
}
function layLow(){ const price = Math.max(50, Math.floor(rawIncome()*20)); if(state.cash < price) return log(`Need ${fmt(price)} to lay low.`); state.cash -= price; state.heat = Math.max(0, state.heat - 25 - (state.hq.legal || 0) * 3); log(`Heat reduced. Cost: ${fmt(price)}.`); render(); }
function activateBoost(){ if(Date.now() < state.boostUntil) return; state.boostUntil = Date.now() + 60000; log('Income doubled for 60 seconds.'); render(); }
function claimMission(){ const m = activeMission(); if(!m.done(state)) return log('Mission not complete yet.'); const reward = m.reward + Math.floor(rawIncome() * 20); state.cash += reward; state.missionPoints += 25; if(state.missionIndex < missions.length - 1) state.missionIndex += 1; log(`Mission complete: +${fmt(reward)} and +25 chest points.`); floatCash(`+${fmt(reward)}`); render(); save(false); }
function openChest(){ if(state.missionPoints < 100) return log('Need 100 chest points. Complete missions.'); state.missionPoints -= 100; state.chestsOpened += 1; const reward = 1000 + state.chestsOpened * 500 + Math.floor(rawIncome() * 90); state.cash += reward; state.respect += 50 + state.chestsOpened * 10; state.energy = maxEnergy(); showModal('Reward Chest', `<div class="reward-box"><strong>Chest opened: +${fmt(reward)}</strong><p>Energy refilled. Respect increased. Complete more missions to earn another chest.</p></div>`); render(); save(false); }
function claimDaily(){
  const t = todayKey(); if(state.lastDaily === t) return showModal('Daily Reward', '<div class="reward-box"><strong>Already claimed today.</strong><p>Come back tomorrow.</p></div>');
  state.dailyStreak = state.lastDaily ? state.dailyStreak + 1 : 1; state.lastDaily = t;
  const reward = 250 + state.dailyStreak * 150 + Math.floor(rawIncome()*60);
  state.cash += reward; state.energy = maxEnergy(); state.respect += 10 * state.dailyStreak;
  showModal('Daily Reward Claimed', `<div class="reward-box"><strong>+${fmt(reward)}</strong><p>Streak: ${state.dailyStreak} day${state.dailyStreak===1?'':'s'}. Energy refilled.</p></div>`);
  render(); save(false);
}
function tutorial(){ state.tutorialSeen = true; save(false); showModal('How to Play', '<ol><li>Collect tribute for starting cash.</li><li>Buy businesses for automatic income.</li><li>Hire crew to increase Power.</li><li>Fight bosses in the Arena.</li><li>Complete Missions and open Chests.</li><li>Take districts and upgrade HQ.</li></ol>'); }

function cardIcon(id){ return `<div class="item-icon">${icons[id] || 'Star'}</div>`; }
function renderList(el, defs, type){ const root = document.getElementById(el); if(!root) return; root.innerHTML = ''; defs.forEach(d => { const isBiz = type==='business'; const level = isBiz ? state.businesses[d.id] : state.crew[d.id]; const price = isBiz ? businessCost(d) : crewCost(d); const gain = isBiz ? `+${fmt(d.income)}/sec each` : `+${d.power} power`; const card = document.createElement('div'); card.className='item-card'; card.innerHTML=`${cardIcon(d.id)}<div><h3>${d.name} · Lv ${level}</h3><p>${d.text}</p><small>${gain}</small></div><button ${state.cash < price ? 'disabled':''}>${fmt(price)}</button>`; card.querySelector('button').onclick = () => isBiz ? buyBusiness(d.id) : hire(d.id); root.appendChild(card); }); }
function renderJobs(){ const root = document.getElementById('jobsList'); if(!root) return; root.innerHTML=''; jobs.forEach(j=>{ const card=document.createElement('div'); card.className='item-card job-card'; card.innerHTML=`${cardIcon(j.id)}<div><h3>${j.name}</h3><p>${j.text}</p><small>${j.energy} energy · ${j.power} power · +${j.heat}% heat</small></div><button ${state.energy < j.energy || power() < j.power ? 'disabled':''}>${fmt(j.cash)}+</button>`; card.querySelector('button').onclick=()=>runJob(j.id); root.appendChild(card); }); }
function renderHq(){ const root = document.getElementById('hqList'); if(!root) return; root.innerHTML=''; hqDefs.forEach(h=>{ const level=state.hq[h.id]||0, price=hqCost(h); const card=document.createElement('div'); card.className='item-card hq-card'; card.innerHTML=`${cardIcon(h.id)}<div><h3>${h.name} · Lv ${level}</h3><p>${h.text}</p><small>${h.effect(level)}</small></div><button ${state.cash < price ? 'disabled':''}>${fmt(price)}</button>`; card.querySelector('button').onclick=()=>upgradeHq(h.id); root.appendChild(card); }); }
function renderDistricts(){ const root=document.getElementById('districts'); if(!root) return; root.innerHTML=''; districtNames.forEach((name,i)=>{ const owned=state.districts.includes(i); const card=document.createElement('div'); card.className=`district ${owned?'owned':''}`; card.innerHTML= owned ? `<strong>${name}</strong><span>Controlled</span>` : `<strong>${name}</strong><span>${fmt(districtCost(i))}<br>${districtPower(i)} power</span><button ${state.cash<districtCost(i)||power()<districtPower(i)?'disabled':''}>Take</button>`; const btn=card.querySelector('button'); if(btn) btn.onclick=()=>takeDistrict(i); root.appendChild(card); }); }
function objective(){ return activeMission().text; }
function renderMission(){ const m = activeMission(); const pct = Math.floor(m.goal(state) * 100); const mt=document.getElementById('missionText'); const mb=document.getElementById('missionBar'); const btn=document.getElementById('missionButton'); const ct=document.getElementById('chestText'); const cb=document.getElementById('chestButton'); if(mt) mt.textContent = `${m.text} (${pct}%)`; if(mb) mb.style.width = `${pct}%`; if(btn){ btn.disabled = !m.done(state); btn.textContent = m.done(state) ? 'Claim Reward' : 'In Progress'; } if(ct) ct.textContent = `${state.missionPoints}/100 chest points · ${state.chestsOpened} opened`; if(cb){ cb.disabled = state.missionPoints < 100; cb.textContent = state.missionPoints >= 100 ? 'Open Chest' : 'Locked'; } }
function renderBoss(){ ensureBossHp(); const b=activeBoss(); const hpPct=Math.max(0,Math.min(100,Math.floor((state.bossHp/b.hp)*100))); const name=document.getElementById('bossName'); const stats=document.getElementById('bossStats'); const bar=document.getElementById('bossHpBar'); const face=document.getElementById('bossFace'); const btn=document.getElementById('bossAttackButton'); if(name) name.textContent=b.name; if(stats) stats.textContent=`Power ${b.power} · HP ${Math.ceil(state.bossHp)}/${b.hp} · Reward ${fmt(b.reward)}`; if(bar) bar.style.width=`${hpPct}%`; if(face) face.textContent=b.name.split(' ')[0]; if(btn){ btn.disabled = state.energy < 2 || power() < Math.floor(b.power*0.55); btn.textContent = state.energy < 2 ? 'Need Energy' : 'Attack Boss'; } }
function render(){
  state.maxEnergy = maxEnergy(); state.energy = Math.min(state.energy, state.maxEnergy); const ev = currentEvent();
  document.getElementById('cash').textContent=fmt(state.cash); document.getElementById('income').textContent=`${fmt(income())}/s`; document.getElementById('power').textContent=power().toLocaleString(); document.getElementById('respect').textContent=Math.floor(state.respect).toLocaleString(); document.getElementById('heat').textContent=`${Math.floor(state.heat)}%`; document.getElementById('energy').textContent=`${Math.floor(state.energy)}/${state.maxEnergy}`; document.getElementById('districtCount').textContent=`${state.districts.length}/${districtNames.length}`; document.getElementById('rankName').textContent=rankName(); document.getElementById('nextRank').textContent=nextRankText(); document.getElementById('objectiveText').textContent=objective(); document.getElementById('cityEvent').textContent=`${ev.name}: ${ev.text}`;
  const db=document.getElementById('dailyButton'); db.textContent = state.lastDaily === todayKey() ? 'Claimed' : 'Daily'; db.disabled = state.lastDaily === todayKey();
  const bb=document.getElementById('boostButton'); if(Date.now()<state.boostUntil){bb.textContent=`${Math.ceil((state.boostUntil-Date.now())/1000)}s Boost`;bb.disabled=true}else{bb.textContent='2x Boost';bb.disabled=false}
  renderMission(); renderBoss(); renderList('businesses', businesses, 'business'); renderList('crew', crew, 'crew'); renderJobs(); renderHq(); renderDistricts();
}
function offline(){ const elapsed=Math.min(7200,Math.floor((Date.now()-state.lastSave)/1000)); const earned=elapsed*rawIncome(); const energyGain=Math.floor(elapsed/20); if(earned>0){state.cash+=earned;log(`Away earnings: ${fmt(earned)}.`)} state.energy=Math.min(maxEnergy(),state.energy+energyGain); state.lastSave=Date.now(); }

document.querySelectorAll('.nav-button').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('.nav-button,.view').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active'); window.scrollTo(0,0); });
document.getElementById('tapButton').onclick=()=>{ const v=tapValue(); state.cash+=v; log(`Collected ${fmt(v)}.`); floatCash(`+${fmt(v)}`); render(); };
document.getElementById('fightButton').onclick=fight; document.getElementById('boostButton').onclick=activateBoost; document.getElementById('layLowButton').onclick=layLow; document.getElementById('saveButton').onclick=()=>save(true); document.getElementById('dailyButton').onclick=claimDaily; document.getElementById('tutorialButton').onclick=tutorial; document.getElementById('missionButton').onclick=claimMission; document.getElementById('chestButton').onclick=openChest; document.getElementById('bossAttackButton').onclick=attackBoss; document.getElementById('closeModal').onclick=closeModal; document.getElementById('modal').onclick=e=>{ if(e.target.id==='modal') closeModal(); };
document.getElementById('resetButton').onclick=()=>{ if(confirm('Reset progress?')){ localStorage.removeItem('crimeEmpireSaveV3'); localStorage.removeItem('crimeEmpireSaveV2'); state=cloneDefault(); log('Progress reset.'); render(); } };

offline(); render(); if(!state.tutorialSeen) setTimeout(tutorial, 500);
setInterval(()=>{ state.cash += income(); state.heat=Math.max(0,state.heat-.03-(state.hq.legal||0)*.005); state.energy=Math.min(maxEnergy(),state.energy+0.05); render(); },1000);
setInterval(()=>save(false),15000);
