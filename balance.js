(() => {
  function totalBuilt() {
    return Object.values(state.businesses || {}).reduce((a, b) => a + b, 0);
  }
  function level(id) {
    return (state.businesses && state.businesses[id]) || 0;
  }
  function pressureScore() {
    return Math.max(0, Math.min(100, Math.floor(state.heat + (state.districts || []).length * 3 + totalBuilt() - ((state.hq && state.hq.legal) || 0) * 4 - level('privateSecurity') * 2 - level('mediaCompany') * 3)));
  }
  function applyPressure() {
    const growth = ((state.districts || []).length * 0.015) + totalBuilt() * 0.003 + level('nightClub') * 0.002 + level('importWarehouse') * 0.003 - (((state.hq && state.hq.legal) || 0) * 0.01) - level('privateSecurity') * 0.004 - level('mediaCompany') * 0.005;
    state.heat = Math.max(0, Math.min(100, state.heat + growth));
    const bonusRespect = level('luxuryHotel') * 0.02 + level('mediaCompany') * 0.01;
    if (bonusRespect > 0) state.respect += bonusRespect;
    if (pressureScore() >= 100) {
      const amount = Math.min(state.cash, Math.max(100, Math.floor(state.cash * 0.12 + rawIncome() * 12)));
      state.cash -= amount;
      state.respect = Math.max(0, state.respect - 10);
      state.heat = 45;
      log('City pressure hit 100%. You paid a penalty. Upgrade Legal Team or use Lay Low.');
      save(false);
    }
  }
  const oldPower = power;
  power = function (s = state) {
    return Math.floor(oldPower(s) + level('autoGarage') * 2 + level('tower') * 12);
  };
  const oldIncomeBonus = incomeBonus;
  incomeBonus = function (s = state) {
    return oldIncomeBonus(s) + level('tower') * 0.03;
  };
  const oldRenderList = renderList;
  renderList = function (el, defs, type) {
    oldRenderList(el, defs, type);
    if (type !== 'business') return;
    const notes = {
      cornerShop: 'Safe income', nightClub: 'High income, higher pressure', autoGarage: 'Adds power', privateSecurity: 'Lowers pressure', importWarehouse: 'Big income, higher pressure', luxuryHotel: 'Generates respect', mediaCompany: 'Lowers pressure', tower: 'Boosts income and power'
    };
    const root = document.getElementById(el);
    if (!root) return;
    [...root.querySelectorAll('.item-card')].forEach((card, index) => {
      const def = defs[index];
      const small = card.querySelector('small');
      if (small && notes[def.id] && !small.textContent.includes(notes[def.id])) small.textContent += ' · ' + notes[def.id];
    });
  };
  const oldShowModal = showModal;
  showModal = function (title, html) {
    oldShowModal(title, html);
    const dangerButton = document.getElementById('resetButton');
    if (dangerButton) dangerButton.style.display = 'none';
  };
  function stableMissionPercent(text, currentPercent) {
    state.bestMissionProgress = state.bestMissionProgress || {};
    const key = (state.missionIndex || 0) + ':' + text;
    const previous = state.bestMissionProgress[key] || 0;
    const best = Math.max(previous, currentPercent);
    state.bestMissionProgress[key] = best;
    return best;
  }
  const oldRenderMission = renderMission;
  renderMission = function () {
    oldRenderMission();
    const textEl = document.getElementById('missionText');
    const bar = document.getElementById('missionBar');
    if (!textEl || !bar) return;
    const match = textEl.textContent.match(/\((\d+)%\)/);
    if (!match) return;
    const current = Number(match[1]);
    const stable = stableMissionPercent(textEl.textContent.replace(/\s*\(\d+%\)/, ''), current);
    textEl.textContent = textEl.textContent.replace(/\(\d+%\)/, '(' + stable + '%)');
    bar.style.width = stable + '%';
  };
  const oldRender = render;
  render = function () {
    oldRender();
    const next = document.getElementById('nextMoveText');
    if (next && pressureScore() > 75) next.textContent = 'Pressure is high. Use Lay Low, Legal Team, Private Security, or Media Company.';
    const event = document.getElementById('cityEvent');
    if (event) event.textContent = currentEvent().name + ': ' + currentEvent().text + ' · Pressure ' + pressureScore() + '%';
  };
  setInterval(applyPressure, 1000);
})();
