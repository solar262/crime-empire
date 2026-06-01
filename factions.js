(() => {
  const factions = [
    { id: 'dock', name: 'Dock Kings', zone: 'Harbor', strength: 45, reward: 800 },
    { id: 'casino', name: 'Casino Circle', zone: 'Neon Mile', strength: 140, reward: 3200 },
    { id: 'uptown', name: 'Uptown Family', zone: 'Uptown', strength: 420, reward: 12000 },
    { id: 'crown', name: 'Black Crown', zone: 'Crown Island', strength: 1200, reward: 45000 }
  ];

  function initFactions() {
    if (!state.factions) {
      state.factions = {};
      factions.forEach(f => state.factions[f.id] = { influence: 100, wins: 0 });
    }
  }

  function factionPower(f) {
    const data = state.factions[f.id];
    return Math.floor(f.strength * (1 + data.wins * 0.25 + (data.influence / 180)));
  }

  function attackFaction(id) {
    initFactions();
    const f = factions.find(x => x.id === id);
    const data = state.factions[id];
    const needed = Math.floor(factionPower(f) * 0.55);

    if (state.energy < 3) return log('Need 3 energy for a faction move.');
    if (power() < needed) return log('Power too low. Build crew and HQ Training first.');

    state.energy -= 3;
    const damage = Math.max(8, Math.floor((power() / factionPower(f)) * 24 + Math.random() * 18));
    data.influence = Math.max(0, data.influence - damage);
    state.heat = Math.min(100, state.heat + 7);

    if (data.influence <= 0) {
      const reward = f.reward + Math.floor(rawIncome() * 45);
      state.cash += reward;
      state.respect += Math.floor(f.strength / 3);
      state.missionPoints = (state.missionPoints || 0) + 30;
      data.wins += 1;
      data.influence = 100;
      showModal('Faction Broken', `<div class="reward-box"><strong>${f.name} weakened.</strong><p>You gained ${fmt(reward)}, respect, and 30 chest points.</p><p>They will rebuild stronger.</p></div>`);
    } else {
      log(`${f.name} influence reduced to ${Math.ceil(data.influence)}%.`);
    }

    renderFactions();
    render();
    save(false);
  }

  function renderFactions() {
    initFactions();
    const root = document.getElementById('factionList');
    if (!root) return;
    root.innerHTML = '';

    factions.forEach(f => {
      const data = state.factions[f.id];
      const card = document.createElement('div');
      card.className = 'item-card faction-card';
      card.innerHTML = `<div class="item-icon">War</div><div><h3>${f.name}</h3><p>${f.zone} · Influence ${Math.ceil(data.influence)}%</p><small>Power ${factionPower(f)} · Wins ${data.wins}</small><div class="mission-progress"><span style="width:${data.influence}%"></span></div></div><button ${state.energy < 3 || power() < Math.floor(factionPower(f) * 0.55) ? 'disabled' : ''}>Move</button>`;
      card.querySelector('button').onclick = () => attackFaction(f.id);
      root.appendChild(card);
    });
  }

  const oldRender = render;
  render = function () {
    oldRender();
    renderFactions();
    const next = document.getElementById('nextMoveText');
    if (next && state.districts && state.districts.length >= 3) next.textContent = 'Faction pressure is rising. Weaken factions to control the city.';
  };

  initFactions();
})();
