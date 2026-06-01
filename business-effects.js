(() => {
  const effects = {
    cornerShop: 'Safe income. Low pressure.',
    nightClub: 'High income. Raises pressure faster.',
    autoGarage: 'Crew mobility. Small power bonus.',
    privateSecurity: 'Protection network. Helps reduce pressure.',
    importWarehouse: 'Major income. Bigger pressure risk.',
    luxuryHotel: 'Respect engine. Adds respect over time.',
    mediaCompany: 'Public image. Softens heat penalties.',
    tower: 'Empire HQ. Boosts income and power.'
  };

  function lvl(id) {
    return (state.businesses && state.businesses[id]) || 0;
  }

  const oldPower = power;
  power = function (s = state) {
    const base = oldPower(s);
    const bonus = lvl('autoGarage') * 2 + lvl('tower') * 12;
    return Math.floor(base + bonus);
  };

  const oldIncomeBonus = incomeBonus;
  incomeBonus = function (s = state) {
    let bonus = oldIncomeBonus(s);
    bonus += lvl('tower') * 0.03;
    return bonus;
  };

  const oldHeatModifier = heatModifier;
  heatModifier = function () {
    let mod = oldHeatModifier();
    mod -= lvl('privateSecurity') * 0.01;
    mod -= lvl('mediaCompany') * 0.015;
    mod += lvl('nightClub') * 0.004;
    mod += lvl('importWarehouse') * 0.006;
    return Math.max(0.25, mod);
  };

  setInterval(() => {
    const respectGain = lvl('luxuryHotel') * 0.02 + lvl('mediaCompany') * 0.01;
    if (respectGain > 0) state.respect += respectGain;
  }, 1000);

  const oldRenderList = renderList;
  renderList = function (el, defs, type) {
    oldRenderList(el, defs, type);
    if (type !== 'business') return;
    const root = document.getElementById(el);
    if (!root) return;
    [...root.querySelectorAll('.item-card')].forEach((card, index) => {
      const def = defs[index];
      const small = card.querySelector('small');
      if (small && effects[def.id]) small.textContent += ' · ' + effects[def.id];
    });
  };

  const oldRender = render;
  render = function () {
    oldRender();
    const next = document.getElementById('nextMoveText');
    if (next && lvl('privateSecurity') < 1 && state.heat > 50) next.textContent = 'Pressure is rising. Private Security and Media Company help manage heat.';
  };
})();
