// app.js — core state, init, modal helpers

const CLASS_COLORS = {
  Barbarian: '#e74c3c', Druid: '#27ae60', Necromancer: '#9b59b6',
  Rogue: '#e67e22', Sorcerer: '#3498db', Spiritborn: '#1abc9c', Paladin: '#f1c40f'
};

const SOURCE_LABELS = {
  d4builds: 'D4Builds', maxroll: 'Maxroll', mobalytics: 'Mobalytics', manual: 'Manual'
};

// ── STATE ──────────────────────────────────────────────────────────────────
let state = {
  activeSeasonId: null,
  activeBuildId: null,
  activeVariant: 0,
  activeBoard: 0,
  trackingVariant: 0,
  showTooltips: true,
  paragons: []          // loaded from JSON
};

// ── DATA ───────────────────────────────────────────────────────────────────
function getData() {
  return JSON.parse(localStorage.getItem('d4vault_data') || JSON.stringify({
    seasons: [],
    builds: []
  }));
}
function saveData(data) {
  localStorage.setItem('d4vault_data', JSON.stringify(data));
}

// ── INIT ───────────────────────────────────────────────────────────────────
async function init() {
  // Set username in header
  const session = JSON.parse(localStorage.getItem('d4vault_session') || '{}');
  document.getElementById('usernameLabel').textContent = session.username || '';

  // Load paragon database
  try {
    const res = await fetch('data/paragon-boards.json');
    const db = await res.json();
    state.paragons = db.boards;
  } catch(e) {
    console.warn('Could not load paragon-boards.json', e);
    state.paragons = [];
  }

  // Load seasons list for the add-season modal
  try {
    const res = await fetch('data/seasons.json');
    const seasons = await res.json();
    const sel = document.getElementById('seasonSelect');
    const data = getData();
    const usedNums = data.seasons.map(s => s.number);
    seasons.forEach(s => {
      if (!usedNums.includes(s.number)) {
        const opt = document.createElement('option');
        opt.value = s.number;
        opt.textContent = `S${s.number} — ${s.name}`;
        sel.appendChild(opt);
      }
    });
  } catch(e) { console.warn('Could not load seasons.json', e); }

  renderSeasons();
  renderBuilds();
}

document.addEventListener('DOMContentLoaded', init);

// ── MODAL HELPERS ──────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── TOGGLE TOOLTIPS ────────────────────────────────────────────────────────
function toggleTooltips() {
  state.showTooltips = !state.showTooltips;
  const btn = document.getElementById('tooltipToggle');
  const canvas = document.getElementById('boardCanvas');
  if (state.showTooltips) {
    btn.textContent = 'Node Info: ON';
    btn.classList.add('toggle-active');
    canvas.classList.remove('tooltips-off');
  } else {
    btn.textContent = 'Node Info: OFF';
    btn.classList.remove('toggle-active');
    canvas.classList.add('tooltips-off');
  }
}

// ── TOGGLE LEVELING GUIDE ──────────────────────────────────────────────────
function toggleLevelingGuide() {
  const guide = document.getElementById('levelingGuide');
  guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
}

// ── RENAME BUILD ───────────────────────────────────────────────────────────
function renameBuild() {
  if (!state.activeBuildId) return;
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  if (!build) return;
  document.getElementById('renameInput').value = build.name;
  openModal('renameBuildModal');
  setTimeout(() => document.getElementById('renameInput').select(), 50);
}

function confirmRename() {
  const val = document.getElementById('renameInput').value.trim();
  if (!val) return;
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  if (build) {
    build.name = val;
    saveData(data);
    renderBuilds();
    renderBuildDetail();
  }
  closeModal('renameBuildModal');
}
