(() => {
  function totalBuilt() {
    return Object.values(state.businesses || {}).reduce((a, b) => a + b, 0);
  }
  function pressureScore() {
    return Math.max(0, Math.min(100, Math.floor(state.heat + (state.districts || []).length * 3 + totalBuilt() - ((state.hq && state.hq.legal) || 0) * 4)));
  }
  function applyPressure() {
    const growth = ((state.districts || []).length * 0.015) + totalBuilt() * 0.003 - (((state.hq && state.hq.legal) || 0) * 0.01);
    state.heat = Math.max(0, Math.min(100, state.heat + growth));
    if (pressureScore() >= 100) {
      const amount = Math.min(state.cash, Math.max(100, Math.floor(state.cash * 0.12 + rawIncome() * 12)));
      state.cash -= amount;
      state.respect = Math.max(0, state.respect - 10);
      state.heat = 45;
      log('City pressure hit 100%. You paid a penalty. Upgrade Legal Team or use Lay Low.');
      save(false);
    }
  }
  const oldRender = render;
  render = function () {
    oldRender();
    const next = document.getElementById('nextMoveText');
    if (next && pressureScore() > 75) next.textContent = 'Pressure is high. Use Lay Low or upgrade Legal Team before expanding.';
    const event = document.getElementById('cityEvent');
    if (event) event.textContent = currentEvent().name + ': ' + currentEvent().text + ' · Pressure ' + pressureScore() + '%';
  };
  setInterval(applyPressure, 1000);
})();
