const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const defaultState = {
  cash: 0,
  boostUntil: 0,
  lastSave: Date.now(),
  businesses: {
    cornerShop: 0,
    nightClub: 0,
    autoGarage: 0,
    privateSecurity: 0
  },
  crew: {
    lookout: 0,
    driver: 0,
    fixer: 0,
    lieutenant: 0
  },
  districts: []
};

const businessDefs = [
  { id: 'cornerShop', name: 'Corner Shop', baseCost: 25, income: 1, text: 'Small front. Fast early cash.' },
  { id: 'nightClub', name: 'Night Club', baseCost: 175, income: 9, text: 'Popular spot with bigger nightly income.' },
  { id: 'autoGarage', name: 'Auto Garage', baseCost: 950, income: 42, text: 'Moves parts, cars, and favors.' },
  { id: 'privateSecurity', name: 'Private Security', baseCost: 4200, income: 165, text: 'High-end operation with steady contracts.' }
];

const crewDefs = [
  { id: 'lookout', name: 'Lookout', baseCost: 60, power: 3, text: 'Keeps the crew one step ahead.' },
  { id: 'driver', name: 'Driver', baseCost: 240, power: 11, text: 'Fast wheels. Faster escapes.' },
  { id: 'fixer', name: 'Fixer', baseCost: 1050, power: 46, text: 'Solves expensive problems quietly.' },
  { id: 'lieutenant', name: 'Lieutenant', baseCost: 5200, power: 190, text: 'Runs blocks while you expand.' }
];

const districtNames = [
  'Old Docks', 'Market Row', 'West Blocks', 'Neon Mile',
  'Harbor Point', 'Iron Yard', 'Gold Avenue', 'Uptown',
  'Casino Strip', 'Royal Park', 'Diamond Pier', 'City Hall'
];

let state = loadState();

function loadState() {
  const saved = localStorage.getItem('crimeEmpireSave');
  if (!saved) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(saved);
    return { ...structuredClone(defaultState), ...parsed };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState(showMessage = true) {
  state.lastSave = Date.now();
  localStorage.setItem('crimeEmpireSave', JSON.stringify(state));
  if (showMessage) log('Progress saved. The city remembers.');
}

function formatCash(value) {
  return money.format(Math.floor(value));
}

function getBusinessCost(def) {
  return Math.floor(def.baseCost * Math.pow(1.18, state.businesses[def.id]));
}

function getCrewCost(def) {
  return Math.floor(def.baseCost * Math.pow(1.2, state.crew[def.id]));
}

function getIncomePerSecond() {
  const base = businessDefs.reduce((sum, def) => sum + state.businesses[def.id] * def.income, 0);
  return base * getBoostMultiplier();
}

function getRawIncomePerSecond() {
  return businessDefs.reduce((sum, def) => sum + state.businesses[def.id] * def.income, 0);
}

function getBoostMultiplier() {
  return Date.now() < state.boostUntil ? 2 : 1;
}

function getPower() {
  const crewPower = crewDefs.reduce((sum, def) => sum + state.crew[def.id] * def.power, 0);
  const districtBonus = state.districts.length * 12;
  return crewPower + districtBonus;
}

function getTapValue() {
  return 1 + Math.floor(getRawIncomePerSecond() / 5) + state.districts.length;
}

function getRivalPower() {
  return 25 + state.districts.length * 32 + Math.floor(getRawIncomePerSecond() * 0.7);
}

function getDistrictCost(index) {
  return 350 + index * 420 + Math.floor(Math.pow(index, 2) * 80);
}

function getDistrictPower(index) {
  return 12 + index * 18;
}

function buyBusiness(id) {
  const def = businessDefs.find(item => item.id === id);
  const cost = getBusinessCost(def);
  if (state.cash < cost) return log('Not enough cash for that upgrade.');
  state.cash -= cost;
  state.businesses[id] += 1;
  log(`${def.name} upgraded. Income is growing.`);
  render();
}

function hireCrew(id) {
  const def = crewDefs.find(item => item.id === id);
  const cost = getCrewCost(def);
  if (state.cash < cost) return log('Not enough cash to hire that crew member.');
  state.cash -= cost;
  state.crew[id] += 1;
  log(`${def.name} joined your crew.`);
  render();
}

function buyDistrict(index) {
  const cost = getDistrictCost(index);
  const requiredPower = getDistrictPower(index);
  if (state.districts.includes(index)) return;
  if (state.cash < cost) return log('You need more cash to move on that block.');
  if (getPower() < requiredPower) return log('Your crew is not strong enough for that district yet.');
  state.cash -= cost;
  state.districts.push(index);
  log(`${districtNames[index]} is now under your control.`);
  render();
}

function fightRival() {
  const rival = getRivalPower();
  const power = getPower();
  const roll = Math.random() * 40;
  if (power + roll >= rival) {
    const prize = 120 + rival * 4 + state.districts.length * 75;
    state.cash += prize;
    log(`Victory. Your crew won ${formatCash(prize)}.`);
  } else {
    const consolation = 15 + Math.floor(power / 3);
    state.cash += consolation;
    log(`The rival crew held the block. You still earned ${formatCash(consolation)} in respect.`);
  }
  render();
}

function activateBoost() {
  if (Date.now() < state.boostUntil) return log('Boost is already active.');
  state.boostUntil = Date.now() + 60_000;
  log('Boost activated: income doubled for 60 seconds.');
  render();
}

function getRankName() {
  const power = getPower();
  const income = getRawIncomePerSecond();
  if (power > 900 && income > 600) return 'Kingpin';
  if (power > 420 && income > 250) return 'Boss';
  if (power > 160 && income > 90) return 'Shot Caller';
  if (power > 55 && income > 25) return 'Operator';
  if (power > 15) return 'Enforcer';
  return 'Rookie';
}

function log(message) {
  document.getElementById('eventLog').textContent = message;
}

function renderBusinesses() {
  const wrap = document.getElementById('businesses');
  wrap.innerHTML = '';
  for (const def of businessDefs) {
    const level = state.businesses[def.id];
    const cost = getBusinessCost(def);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div>
        <h3>${def.name} · Lv ${level}</h3>
        <p>${def.text} +${formatCash(def.income)}/sec each</p>
      </div>
      <button ${state.cash < cost ? 'disabled' : ''}>${formatCash(cost)}</button>
    `;
    card.querySelector('button').addEventListener('click', () => buyBusiness(def.id));
    wrap.appendChild(card);
  }
}

function renderCrew() {
  const wrap = document.getElementById('crew');
  wrap.innerHTML = '';
  for (const def of crewDefs) {
    const count = state.crew[def.id];
    const cost = getCrewCost(def);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div>
        <h3>${def.name} · ${count}</h3>
        <p>${def.text} +${def.power} power each</p>
      </div>
      <button ${state.cash < cost ? 'disabled' : ''}>${formatCash(cost)}</button>
    `;
    card.querySelector('button').addEventListener('click', () => hireCrew(def.id));
    wrap.appendChild(card);
  }
}

function renderDistricts() {
  const wrap = document.getElementById('districts');
  wrap.innerHTML = '';
  districtNames.forEach((name, index) => {
    const owned = state.districts.includes(index);
    const cost = getDistrictCost(index);
    const requiredPower = getDistrictPower(index);
    const card = document.createElement('div');
    card.className = `district ${owned ? 'owned' : ''}`;
    card.innerHTML = owned ? `
      <strong>${name}</strong>
      <span>Controlled</span>
    ` : `
      <strong>${name}</strong>
      <span>${formatCash(cost)} · ${requiredPower} power</span>
      <button ${state.cash < cost || getPower() < requiredPower ? 'disabled' : ''}>Take</button>
    `;
    const button = card.querySelector('button');
    if (button) button.addEventListener('click', () => buyDistrict(index));
    wrap.appendChild(card);
  });
}

function render() {
  document.getElementById('cash').textContent = formatCash(state.cash);
  document.getElementById('income').textContent = `${formatCash(getIncomePerSecond())}/s`;
  document.getElementById('power').textContent = getPower().toLocaleString();
  document.getElementById('districtCount').textContent = `${state.districts.length}/12`;
  document.getElementById('rankName').textContent = getRankName();
  document.getElementById('rivalPower').textContent = getRivalPower().toLocaleString();

  const boostButton = document.getElementById('boostButton');
  if (Date.now() < state.boostUntil) {
    const seconds = Math.ceil((state.boostUntil - Date.now()) / 1000);
    boostButton.textContent = `2x Boost Active: ${seconds}s`;
    boostButton.disabled = true;
  } else {
    boostButton.textContent = '2x Boost: 60s';
    boostButton.disabled = false;
  }

  renderBusinesses();
  renderCrew();
  renderDistricts();
}

function applyOfflineEarnings() {
  const now = Date.now();
  const elapsedSeconds = Math.min(7200, Math.max(0, Math.floor((now - state.lastSave) / 1000)));
  const earned = elapsedSeconds * getRawIncomePerSecond();
  if (earned > 0) {
    state.cash += earned;
    log(`Welcome back. Your empire earned ${formatCash(earned)} while you were away.`);
  }
  state.lastSave = now;
}

document.getElementById('tapButton').addEventListener('click', () => {
  const amount = getTapValue();
  state.cash += amount;
  log(`Collected ${formatCash(amount)} in tribute.`);
  render();
});

document.getElementById('fightButton').addEventListener('click', fightRival);
document.getElementById('boostButton').addEventListener('click', activateBoost);
document.getElementById('saveButton').addEventListener('click', () => saveState(true));
document.getElementById('resetButton').addEventListener('click', () => {
  if (!confirm('Reset your Crime Empire progress?')) return;
  localStorage.removeItem('crimeEmpireSave');
  state = structuredClone(defaultState);
  log('Progress reset. Back to the streets.');
  render();
});

applyOfflineEarnings();
render();
setInterval(() => {
  state.cash += getIncomePerSecond();
  render();
}, 1000);
setInterval(() => saveState(false), 15000);
