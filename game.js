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
  hq: { office: 1, training: 0, logistics: 0, legal: 0 },
  businesses: { cornerShop: 0, nightClub: 0, autoGarage: 0, privateSecurity: 0, importWarehouse: 0, luxuryHotel: 0, mediaCompany: 0, tower: 0 },
  crew: { lookout: 0, driver: 0, fixer: 0, lieutenant: 0, strategist: 0, captain: 0, negotiator: 0, mastermind: 0 },
  districts: [],
  achievements: []
};

const businesses = [
  ['cornerShop', 'Corner Shop', 25, 1, 'Small front. Fast early cash.'],
  ['nightClub', 'Night Club', 175, 9, 'Popular spot with bigger nightly income.'],
  ['autoGarage', 'Auto Garage', 950, 42, 'Moves cars, parts, and favors.'],
  ['privateSecurity', 'Private Security', 4200, 165, 'Contracts, protection, and influence.'],
  ['importWarehouse', 'Import Warehouse', 18000, 640, 'Big logistics. Bigger profits.'],
  ['luxuryHotel', 'Luxury Hotel', 75000, 2400, 'A city landmark with elite cash flow.'],
  ['mediaCompany', 'Media Company', 240000, 7800, 'Controls the story and multiplies influence.'],
  ['tower', 'Crown Tower', 900000, 25000, 'Endgame headquarters for city domination.']
].map(([id, name, baseCost, income, text]) => ({ id, name, baseCost, income, text }));

const crew = [
  ['lookout', 'Lookout', 60, 3, 'Keeps the crew one step ahead.'],
  ['driver', 'Driver', 240, 11, 'Fast wheels. Faster exits.'],
  ['fixer', 'Fixer', 1050, 46, 'Solves expensive problems quietly.'],
  ['lieutenant', 'Lieutenant', 5200, 190, 'Runs blocks while you expand.'],
  ['strategist', 'Strategist', 21000, 760, 'Plans jobs and reduces bad odds.'],
  ['captain', 'Captain', 90000, 3000, 'Commands entire districts.'],
  ['negotiator', 'Negotiator', 340000, 9500, 'Cuts deals and lowers city pressure.'],
  ['mastermind', 'Mastermind', 1250000, 32000, 'Turns the whole city into a chessboard.']
].map(([id, name, baseCost, power, text]) => ({ id, name, baseCost, power, text }));

const jobs = [
  { id: 'street', name: 'Street Collection', energy: 1, cash: 35, respect: 2, heat: 2, power: 0, text: 'Low risk job for early money.' },
  { id: 'club', name: 'Club Negotiation', energy: 2, cash: 160, respect: 8, heat: 5, power: 12, text: 'Needs a small crew presence.' },
  { id: 'garage', name: 'Garage Takeover', energy: 3, cash: 620, respect: 24, heat: 9, power: 55, text: 'A stronger move for midgame growth.' },
  { id: 'dock', name: 'Dockyard Deal', energy: 4, cash: 2400, respect: 70, heat: 14, power: 180, text: 'Big payday. Big attention.' },
  { id: 'casino', name: 'Casino Night', energy: 5, cash: 9000, respect: 210, heat: 22, power: 650, text: 'High stakes city power play.' },
  { id: 'summit', name: 'Underworld Summit', energy: 6, cash: 30000, respect: 600, heat: 32, power: 2200, text: 'Elite job for late-game bosses.' }
];

const hqDefs = [
  { id: 'office', name: 'Back Office', base: 500, text: 'Raises max energy and unlocks smoother growth.', effect: level => `Max energy +${level * 2}` },
  { id: 'training', name: 'Training Room', base: 1200, text: 'Increases crew power with better preparation.', effect: level => `Crew power +${level * 8}%` },
  { id: 'logistics', name: 'Logistics Network', base: 1800, text: 'Improves all business income.', effect: level => `Income +${level * 6}%` },
  { id: 'legal', name: 'Legal Team', base: 1500, text: 'Reduces heat gained from jobs and fights.', effect: level => `Heat gain -${level * 5}%` }
];

const cityEvents = [
  { name: 'Quiet Streets', text: 'The city is quiet. Build your base.', income: 1, job: 1, heat: 1 },
  { name: 'Busy Weekend', text: 'Busy weekend: job payouts are 25% higher.', income: 1, job: 1.25, heat: 1.05 },
  { name: 'Police Pressure', text: 'Police pressure: heat rises faster, but respect gains are higher.', income: 1, job: 1.05, heat: 1.35 },
  { name: 'Business Boom', text: 'Business boom: all front income is 30% higher.', income: 1.3, job: 1, heat: 1 },
  { name: 'Rival War', text: 'Rival war: fights pay more, but threat is higher.', income: 1, job: 1, heat: 1.15 }
];

const districtNames = ['Old Docks','Market Row','West Blocks','Neon Mile','Harbor Point','Iron Yard','Gold Avenue','Uptown','Casino Strip','Royal Park','Diamond Pier','City Hall','Airport Road','The Heights','Crown Island'];
const ranks = [['Rookie',0,0],['Enforcer',20,50],['Operator',75,200],['Shot Caller',200,700],['Boss',700,2500],['Kingpin',2500,9000],['City Legend',9000,25000]];
const achievementDefs = [
  ['firstCash','First Cash','Reach $100 cash', s => s.cash >= 100],
  ['firstFront','Open For Business','Buy any front business', s => totalFronts(s) >= 1],
  ['crewUp','Crew Formed','Hire 5 total crew members', s => totalCrew(s) >= 5],
  ['firstJob','Job Runner','Earn 25 respect', s => s.respect >= 25],
  ['firstDistrict','Block Owner','Control your first district', s => s.districts.length >= 1],
  ['income100','Real Income','Reach $100 per second', s => rawIncome(s) >= 100],
  ['power500','Heavy Crew','Reach 500 crew power', s => power(s) >= 500],
  ['hq3','HQ Built','Upgrade any HQ room to level 3', s => Math.max(...Object.values(s.hq)) >= 3],
  ['fiveDistricts','City Presence','Control 5 districts', s => s.districts.length >= 5],
  ['respect1000','Known Name','Reach 1,000 respect', s => s.respect >= 1000],
  ['daily3','Regular Boss','Claim 3 daily rewards', s => s.dailyStreak >= 3],
  ['legend','Endgame Boss','Reach Kingpin rank', s => rankName(s) === 'Kingpin' || rankName(s) === 'City Legend']
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
function netWorth(){ return state.cash + rawIncome() * 120 + power() * 18 + state.respect * 4; }
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
function log(msg){ const el = document.getElementById('eventLog'); if(el) el.textContent = msg; }
function showModal(title, html){ document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); }
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

function buyBusiness(id){ const b = businesses.find(x=>x.id===id), c = businessCost(b); if(state.cash < c) return log('Need more cash for that front.'); state.cash -= c; state.businesses[id]++; state.respect += 1; log(`${b.name} upgraded.`); render(); }
function hire(id){ const c = crew.find(x=>x.id===id), price = crewCost(c); if(state.cash < price) return log('Need more cash to hire.'); state.cash -= price; state.crew[id]++; state.respect += 2; log(`${c.name} joined the crew.`); render(); }
function upgradeHq(id){ const h = hqDefs.find(x=>x.id===id), price = hqCost(h); if(state.cash < price) return log('Need more cash for that HQ upgrade.'); state.cash -= price; state.hq[id] = (state.hq[id] || 0) + 1; state.maxEnergy = maxEnergy(); log(`${h.name} upgraded to level ${state.hq[id]}.`); render(); }
function runJob(id){
  const j = jobs.find(x=>x.id===id); if(state.energy < j.energy) return log('Not enough energy. Wait for it to refill.'); if(power() < j.power) return log('Crew power too low for that job.');
  state.energy -= j.energy; const heatRisk = Math.max(0, state.heat - power()/120); const success = Math.random()*100 > heatRisk * .35;
  const payout = Math.floor((j.cash + rawIncome()*8) * currentEvent().job);
  if(success){ state.cash += payout; state.respect += j.respect; state.heat = Math.min(100, state.heat + j.heat * heatModifier()); log(`${j.name} succeeded: +${fmt(payout)}, +${j.respect} respect.`); }
  else { state.respect += Math.ceil(j.respect/4); state.heat = Math.min(100, state.heat + (j.heat + 8) * heatModifier()); log(`${j.name} got messy. Small respect gain, heat rose.`); }
  render();
}
function takeDistrict(i){ if(state.districts.includes(i)) return; if(state.cash < districtCost(i)) return log('Need more cash for that district.'); if(power() < districtPower(i)) return log('Crew power too low for that district.'); state.cash -= districtCost(i); state.districts.push(i); state.respect += 30 + i*10; log(`${districtNames[i]} is yours.`); render(); }
function fight(){ const r = rivalPower(); if(power() + Math.random()*80 >= r){ const prize = Math.floor((150 + r*5) * (currentEvent().name === 'Rival War' ? 1.5 : 1)); state.cash += prize; state.respect += 18; state.heat = Math.min(100, state.heat+6*heatModifier()); log(`Rival crew beaten. +${fmt(prize)} and +18 respect.`); } else { state.respect += 4; state.heat = Math.min(100, state.heat+3*heatModifier()); log('Rival crew pushed back. Gain +4 respect.'); } render(); }
function layLow(){ const price = Math.max(50, Math.floor(rawIncome()*20)); if(state.cash < price) return log(`Need ${fmt(price)} to lay low.`); state.cash -= price; state.heat = Math.max(0, state.heat - 25 - (state.hq.legal || 0) * 3); log(`Heat reduced. Cost: ${fmt(price)}.`); render(); }
function activateBoost(){ if(Date.now() < state.boostUntil) return; state.boostUntil = Date.now() + 60000; log('Income doubled for 60 seconds.'); render(); }
function claimDaily(){
  const t = todayKey();
  if(state.lastDaily === t) return showModal('Daily Reward', '<div class="reward-box"><strong>Already claimed today.</strong><p>Come back tomorrow for the next reward.</p></div>');
  state.dailyStreak = state.lastDaily ? state.dailyStreak + 1 : 1;
  state.lastDaily = t;
  const reward = 250 + state.dailyStreak * 150 + Math.floor(rawIncome()*60);
  state.cash += reward; state.energy = maxEnergy(); state.respect += 10 * state.dailyStreak;
  showModal('Daily Reward Claimed', `<div class="reward-box"><strong>+${fmt(reward)}</strong><p>Streak: ${state.dailyStreak} day${state.dailyStreak===1?'':'s'}. Energy refilled and respect gained.</p></div>`);
  render(); save(false);
}
function tutorial(){
  state.tutorialSeen = true; save(false);
  showModal('How to Play', '<ol><li><strong>Collect Tribute</strong> to get starting cash.</li><li><strong>Buy Front Businesses</strong> to earn cash every second.</li><li><strong>Hire Crew</strong> to raise power for jobs and districts.</li><li><strong>Run Jobs</strong> for big payouts, but watch your heat.</li><li><strong>Upgrade HQ</strong> for permanent boosts.</li><li><strong>Take Districts</strong> to control the city and increase income.</li></ol>');
}

function renderList(el, defs, type){ const root = document.getElementById(el); root.innerHTML = ''; defs.forEach(d => { const isBiz = type==='business'; const level = isBiz ? state.businesses[d.id] : state.crew[d.id]; const price = isBiz ? businessCost(d) : crewCost(d); const gain = isBiz ? `+${fmt(d.income)}/sec each` : `+${d.power} power each`; const card = document.createElement('div'); card.className='item-card'; card.innerHTML=`<div><h3>${d.name} · Lv ${level}</h3><p>${d.text}</p><small>${gain}</small></div><button ${state.cash < price ? 'disabled':''}>${fmt(price)}</button>`; card.querySelector('button').onclick = () => isBiz ? buyBusiness(d.id) : hire(d.id); root.appendChild(card); }); }
function renderJobs(){ const root = document.getElementById('jobsList'); root.innerHTML=''; jobs.forEach(j=>{ const card=document.createElement('div'); card.className='item-card job-card'; card.innerHTML=`<div><h3>${j.name}</h3><p>${j.text}</p><small>Energy ${j.energy} · ${fmt(j.cash)}+ · ${j.respect} respect · ${j.power} power needed · +${j.heat}% heat</small></div><button ${state.energy < j.energy || power() < j.power ? 'disabled':''}>Run Job</button>`; card.querySelector('button').onclick=()=>runJob(j.id); root.appendChild(card); }); }
function renderHq(){ const root = document.getElementById('hqList'); root.innerHTML=''; hqDefs.forEach(h=>{ const level=state.hq[h.id]||0, price=hqCost(h); const card=document.createElement('div'); card.className='item-card hq-card'; card.innerHTML=`<div><h3>${h.name} · Lv ${level}</h3><p>${h.text}</p><small>${h.effect(level)}</small></div><button ${state.cash < price ? 'disabled':''}>${fmt(price)}</button>`; card.querySelector('button').onclick=()=>upgradeHq(h.id); root.appendChild(card); }); }
function renderDistricts(){ const root=document.getElementById('districts'); root.innerHTML=''; districtNames.forEach((name,i)=>{ const owned=state.districts.includes(i); const card=document.createElement('div'); card.className=`district ${owned?'owned':''}`; card.innerHTML= owned ? `<strong>${name}</strong><span>Controlled · +4% income bonus</span>` : `<strong>${name}</strong><span>${fmt(districtCost(i))} · ${districtPower(i)} power</span><button ${state.cash<districtCost(i)||power()<districtPower(i)?'disabled':''}>Take District</button>`; const btn=card.querySelector('button'); if(btn) btn.onclick=()=>takeDistrict(i); root.appendChild(card); }); }
function renderAchievements(){ const root=document.getElementById('achievements'); root.innerHTML=''; achievementDefs.forEach(([id,name,text,check])=>{ const done=check(state); if(done && !state.achievements.includes(id)){ state.achievements.push(id); state.cash += 100; log(`Achievement unlocked: ${name}. +$100`); } const card=document.createElement('div'); card.className=`achievement ${done?'done':''}`; card.innerHTML=`<strong>${done?'✓ ':''}${name}</strong><span>${text}${done?' · Reward claimed':''}</span>`; root.appendChild(card); }); }
function objective(){ if(state.cash < 50) return 'Collect your first $50'; if(totalFronts() < 1) return 'Buy your first front'; if(totalCrew() < 3) return 'Hire 3 crew members'; if(state.respect < 50) return 'Run jobs to reach 50 respect'; if((state.hq.office || 0) < 2) return 'Upgrade your HQ Back Office'; if(state.districts.length < 1) return 'Take your first district'; if(rawIncome() < 100) return 'Reach $100/sec income'; return 'Expand across the whole city'; }
function render(){
  state.maxEnergy = maxEnergy(); state.energy = Math.min(state.energy, state.maxEnergy); const ev = currentEvent();
  document.getElementById('cash').textContent=fmt(state.cash); document.getElementById('income').textContent=`${fmt(income())}/s`; document.getElementById('power').textContent=power().toLocaleString(); document.getElementById('respect').textContent=Math.floor(state.respect).toLocaleString(); document.getElementById('heat').textContent=`${Math.floor(state.heat)}%`; document.getElementById('energy').textContent=`${Math.floor(state.energy)}/${state.maxEnergy}`; document.getElementById('districtCount').textContent=`${state.districts.length}/${districtNames.length}`; document.getElementById('netWorth').textContent=fmt(netWorth()); document.getElementById('rankName').textContent=rankName(); document.getElementById('nextRank').textContent=nextRankText(); document.getElementById('objectiveText').textContent=objective(); document.getElementById('rivalPower').textContent=rivalPower().toLocaleString(); document.getElementById('frontCount').textContent=totalFronts().toLocaleString(); document.getElementById('achievementCount').textContent=`${state.achievements.length}/${achievementDefs.length}`; document.getElementById('dailyStreak').textContent=`${state.dailyStreak} day${state.dailyStreak===1?'':'s'}`; document.getElementById('hqLevel').textContent=Math.max(...Object.values(state.hq)); document.getElementById('cityEvent').textContent=`${ev.name}: ${ev.text}`;
  const db=document.getElementById('dailyButton'); db.textContent = state.lastDaily === todayKey() ? 'Daily Claimed' : 'Daily Reward'; db.disabled = state.lastDaily === todayKey();
  const bb=document.getElementById('boostButton'); if(Date.now()<state.boostUntil){bb.textContent=`2x Active: ${Math.ceil((state.boostUntil-Date.now())/1000)}s`;bb.disabled=true}else{bb.textContent='2x Income Boost';bb.disabled=false}
  renderList('businesses', businesses, 'business'); renderList('crew', crew, 'crew'); renderJobs(); renderHq(); renderDistricts(); renderAchievements();
}
function offline(){ const elapsed=Math.min(7200,Math.floor((Date.now()-state.lastSave)/1000)); const earned=elapsed*rawIncome(); const energyGain=Math.floor(elapsed/20); if(earned>0){state.cash+=earned;log(`Away earnings: ${fmt(earned)}.`)} state.energy=Math.min(maxEnergy(),state.energy+energyGain); state.lastSave=Date.now(); }

document.querySelectorAll('.tab-button').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('.tab-button,.tab-panel').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active'); });
document.getElementById('tapButton').onclick=()=>{ const v=tapValue(); state.cash+=v; log(`Collected ${fmt(v)}.`); render(); };
document.getElementById('fightButton').onclick=fight; document.getElementById('boostButton').onclick=activateBoost; document.getElementById('layLowButton').onclick=layLow; document.getElementById('saveButton').onclick=()=>save(true); document.getElementById('dailyButton').onclick=claimDaily; document.getElementById('tutorialButton').onclick=tutorial; document.getElementById('closeModal').onclick=closeModal; document.getElementById('modal').onclick=e=>{ if(e.target.id==='modal') closeModal(); };
document.getElementById('resetButton').onclick=()=>{ if(confirm('Reset progress?')){ localStorage.removeItem('crimeEmpireSaveV3'); localStorage.removeItem('crimeEmpireSaveV2'); state=cloneDefault(); log('Progress reset.'); render(); } };

offline(); render(); if(!state.tutorialSeen) setTimeout(tutorial, 500);
setInterval(()=>{ state.cash += income(); state.heat=Math.max(0,state.heat-.03-(state.hq.legal||0)*.005); state.energy=Math.min(maxEnergy(),state.energy+0.05); render(); },1000);
setInterval(()=>save(false),15000);
