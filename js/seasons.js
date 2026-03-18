// seasons.js — season add/delete/render

let pendingDeleteSeasonId = null;

function renderSeasons() {
  const data = getData();
  const tabs = document.getElementById('seasonTabs');
  tabs.innerHTML = '';

  if (!data.seasons.length) {
    state.activeSeasonId = null;
    renderBuilds();
    return;
  }

  data.seasons.forEach(s => {
    const tab = document.createElement('button');
    tab.className = 'season-tab' + (s.id === state.activeSeasonId ? ' active' : '');
    tab.innerHTML = `
      <span class="s-num">S${s.number}</span>
      <span>${s.name}</span>
      <button class="s-delete" onclick="event.stopPropagation();promptDeleteSeason('${s.id}')" title="Delete season">×</button>
    `;
    tab.addEventListener('click', () => selectSeason(s.id));
    tabs.appendChild(tab);
  });

  // Auto-select first season if none active
  if (!state.activeSeasonId && data.seasons.length) {
    selectSeason(data.seasons[data.seasons.length - 1].id);
  }
}

function selectSeason(id) {
  state.activeSeasonId = id;
  state.activeBuildId = null;
  renderSeasons();
  renderBuilds();
  showEmptyState();
}

function openSeasonModal() {
  // Refresh the dropdown to exclude already-added seasons
  fetch('data/seasons.json')
    .then(r => r.json())
    .then(seasons => {
      const data = getData();
      const usedNums = data.seasons.map(s => s.number);
      const sel = document.getElementById('seasonSelect');
      sel.innerHTML = '';
      const available = seasons.filter(s => !usedNums.includes(s.number)).reverse();
      if (!available.length) {
        sel.innerHTML = '<option disabled>All seasons already added</option>';
      } else {
        available.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.number;
          opt.textContent = `S${s.number} — ${s.name}`;
          sel.appendChild(opt);
        });
      }
      openModal('seasonModal');
    });
}

function addSeason() {
  const sel = document.getElementById('seasonSelect');
  const num = parseInt(sel.value);
  if (!num) return;

  fetch('data/seasons.json')
    .then(r => r.json())
    .then(seasons => {
      const found = seasons.find(s => s.number === num);
      if (!found) return;
      const data = getData();
      const newSeason = {
        id: 's' + Date.now(),
        number: found.number,
        name: found.name,
        patch: found.patch
      };
      data.seasons.push(newSeason);
      // Sort seasons by number
      data.seasons.sort((a, b) => a.number - b.number);
      saveData(data);
      state.activeSeasonId = newSeason.id;
      closeModal('seasonModal');
      renderSeasons();
      renderBuilds();
    });
}

function promptDeleteSeason(id) {
  const data = getData();
  const season = data.seasons.find(s => s.id === id);
  if (!season) return;
  const buildCount = data.builds.filter(b => b.seasonId === id).length;
  pendingDeleteSeasonId = id;
  document.getElementById('deleteSeasonText').textContent =
    `Delete "S${season.number} — ${season.name}"? This will also permanently delete ${buildCount} build${buildCount !== 1 ? 's' : ''} in this season. This cannot be undone.`;
  openModal('deleteSeasonModal');
}

function confirmDeleteSeason() {
  if (!pendingDeleteSeasonId) return;
  const data = getData();
  data.seasons = data.seasons.filter(s => s.id !== pendingDeleteSeasonId);
  data.builds  = data.builds.filter(b => b.seasonId !== pendingDeleteSeasonId);
  if (state.activeSeasonId === pendingDeleteSeasonId) {
    state.activeSeasonId = data.seasons.length ? data.seasons[data.seasons.length - 1].id : null;
    state.activeBuildId = null;
  }
  saveData(data);
  pendingDeleteSeasonId = null;
  closeModal('deleteSeasonModal');
  renderSeasons();
  renderBuilds();
  showEmptyState();
}
