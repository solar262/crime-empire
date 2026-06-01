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
    if (power() < needed) return log('Need ' + needed + ' power to weaken ' + f.name + '.');

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
      showModal('Faction Weakened', `<div class="reward-box"><strong>${f.name} weakened.</strong><p>You gained ${fmt(reward)}, respect, and 30 chest points.</p><p>They will rebuild stronger.</p></div>`);
    } else {
      log(f.name + ' control reduced to ' + Math.ceil(data.influence) + '%.');
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

    const guide = document.createElement('div');
    guide.className = 'event-card';
    guide.innerHTML = '<strong>Faction Rule</strong><span>Reduce control to 0% to earn rewards. Each faction returns stronger after defeat.</span>';
    root.appendChild(guide);

    factions.forEach(f => {
      const data = state.factions[f.id];
      const needed = Math.floor(factionPower(f) * 0.55);
      const card = document.createElement('div');
      card.className = 'item-card faction-card';
      const buttonText = state.energy < 3 ? 'Need Energy' : power() < needed ? 'Need ' + needed + ' Power' : 'Weaken';
      card.innerHTML = `<div class="item-icon">War</div><div><h3>${f.name}</h3><p>${f.zone} · Control ${Math.ceil(data.influence)}%</p><small>Strength ${factionPower(f)} · Defeated ${data.wins} times</small><div class="mission-progress"><span style="width:${data.influence}%"></span></div></div><button ${state.energy < 3 || power() < needed ? 'disabled' : ''}>${buttonText}</button>`;
      card.querySelector('button').onclick = () => attackFaction(f.id);
      root.appendChild(card);
    });
  }

  const oldRenderDistricts = renderDistricts;
  renderDistricts = function () {
    const root = document.getElementById('districts');
    if (!root) return oldRenderDistricts();
    root.innerHTML = '';

    const guide = document.createElement('div');
    guide.className = 'event-card';
    guide.style.gridColumn = '1 / -1';
    guide.innerHTML = '<strong>Map Rule</strong><span>Districts need cash and power. Owning districts increases income bonus but also pressure.</span>';
    root.appendChild(guide);

    districtNames.forEach((name, i) => {
      const owned = state.districts.includes(i);
      const cost = districtCost(i);
      const need = districtPower(i);
      const lacksCash = state.cash < cost;
      const lacksPower = power() < need;
      const card = document.createElement('div');
      card.className = `district ${owned ? 'owned' : ''}`;
      let label = 'Take';
      if (lacksCash) label = 'Need ' + fmt(cost);
      else if (lacksPower) label = 'Need ' + need + ' Power';
      card.innerHTML = owned ? `<strong>${name}</strong><span>Controlled<br>+4% income, +pressure</span>` : `<strong>${name}</strong><span>Cost ${fmt(cost)}<br>Needs ${need} power</span><button ${lacksCash || lacksPower ? 'disabled' : ''}>${label}</button>`;
      const btn = card.querySelector('button');
      if (btn) btn.onclick = () => takeDistrict(i);
      root.appendChild(card);
    });
  };

  const oldRender = render;
  render = function () {
    oldRender();
    renderFactions();
    const next = document.getElementById('nextMoveText');
    if (next && state.districts && state.districts.length >= 3) next.textContent = 'Faction pressure is rising. Weaken factions and manage pressure before expanding.';
  };

  initFactions();
})();
