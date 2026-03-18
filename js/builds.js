// builds.js — build CRUD + full detail rendering

let pendingDeleteBuildId = null;

// ── RENDER BUILD SIDEBAR ───────────────────────────────────────────────────
function renderBuilds() {
  const data = getData();
  const icons = document.getElementById('buildIcons');
  icons.innerHTML = '';

  if (!state.activeSeasonId) return;

  const seasonBuilds = data.builds.filter(b => b.seasonId === state.activeSeasonId);
  seasonBuilds.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'build-icon-btn' + (b.id === state.activeBuildId ? ' active' : '');
    btn.innerHTML = `
      <div class="build-icon-class">
        <div class="class-dot" style="background:${CLASS_COLORS[b.cls] || '#888'}"></div>
        ${b.cls}
      </div>
      <div class="build-icon-name">${b.name}</div>
      <button class="build-icon-del" onclick="event.stopPropagation();promptDeleteBuild('${b.id}')" title="Delete">×</button>
    `;
    btn.addEventListener('click', () => selectBuild(b.id));
    icons.appendChild(btn);
  });

  // Show/hide add button
  document.getElementById('addBuildBtn').style.display = state.activeSeasonId ? 'flex' : 'none';
}

function selectBuild(id) {
  state.activeBuildId = id;
  state.activeVariant = 0;
  state.activeBoard = 0;
  renderBuilds();
  renderBuildDetail();
  syncSkillTreeFrames(id, 0);
}

// ── ADD BUILD MODAL ────────────────────────────────────────────────────────
function openAddBuildModal() {
  if (!state.activeSeasonId) { alert('Please add and select a season first.'); return; }
  document.getElementById('buildUrl').value = '';
  document.getElementById('buildNameInput').value = '';
  document.getElementById('buildClassInput').value = 'Barbarian';
  document.getElementById('buildSitePill').className = 'site-pill hidden';
  document.getElementById('importStatus').className = 'import-status hidden';
  openModal('addBuildModal');
}

function detectBuildSite(url) {
  const pill = document.getElementById('buildSitePill');
  url = url.trim();
  if (!url) { pill.className = 'site-pill hidden'; return null; }
  let site = null;
  if (url.includes('d4builds.gg'))    site = 'd4builds';
  else if (url.includes('maxroll.gg')) site = 'maxroll';
  else if (url.includes('mobalytics.gg')) site = 'mobalytics';
  pill.className = 'site-pill ' + (site ? 'p-' + site : 'p-unknown');
  const labels = { d4builds: 'D4Builds', maxroll: 'Maxroll', mobalytics: 'Mobalytics' };
  pill.textContent = site ? labels[site] : 'Unknown';
  return site;
}

async function addBuild() {
  const url   = document.getElementById('buildUrl').value.trim();
  const name  = document.getElementById('buildNameInput').value.trim();
  const cls   = document.getElementById('buildClassInput').value;
  const status = document.getElementById('importStatus');

  if (!name) { alert('Please enter a build name.'); return; }

  const site = url ? detectBuildSite(url) : null;
  let buildData = {};

  if (url && site) {
    status.className = 'import-status loading';
    status.textContent = `Detecting ${SOURCE_LABELS[site] || site}...`;
    await new Promise(r => setTimeout(r, 600));
    try {
      buildData = parseBuildUrl(url, site, name, cls);
      status.className = 'import-status success';
      status.textContent = `Parsed from ${SOURCE_LABELS[site]}. You can fill in more details after adding.`;
    } catch(e) {
      status.className = 'import-status error';
      status.textContent = 'Could not parse URL. Build added with manual data only.';
    }
  }

  const data = getData();
  const season = data.seasons.find(s => s.id === state.activeSeasonId);

  const newBuild = {
    id: 'b' + Date.now(),
    seasonId: state.activeSeasonId,
    name,
    cls,
    source: site || 'manual',
    sourceUrl: url || null,
    season: season ? `S${season.number} — ${season.name}` : '',
    // Variant data — each variant has its own skills, gear, paragon
    variants: buildData.variants || [
      { name: 'Default', skills: [], gear: [], paragonBoards: [], levelingSteps: [] }
    ],
    skillTreeImage: buildData.skillTreeImage || null,
    contentTypes: buildData.contentTypes || [],
    strengths: buildData.strengths || [],
    weaknesses: buildData.weaknesses || [],
    notes: buildData.notes || ''
  };

  data.builds.push(newBuild);
  saveData(data);
  closeModal('addBuildModal');
  state.activeBuildId = newBuild.id;
  state.activeVariant = 0;
  state.activeBoard = 0;
  renderBuilds();
  renderBuildDetail();
}

// ── DELETE BUILD ───────────────────────────────────────────────────────────
function promptDeleteBuild(id) {
  const data = getData();
  const build = data.builds.find(b => b.id === id);
  if (!build) return;
  pendingDeleteBuildId = id;
  document.getElementById('deleteBuildText').textContent =
    `Permanently delete "${build.name}"? This cannot be undone.`;
  openModal('deleteBuildModal');
}

function confirmDeleteBuild() {
  if (!pendingDeleteBuildId) return;
  const data = getData();
  data.builds = data.builds.filter(b => b.id !== pendingDeleteBuildId);
  if (state.activeBuildId === pendingDeleteBuildId) {
    state.activeBuildId = null;
  }
  saveData(data);
  pendingDeleteBuildId = null;
  closeModal('deleteBuildModal');
  renderBuilds();
  if (state.activeBuildId) renderBuildDetail(); else showEmptyState();
}

// ── SHOW/HIDE CONTENT AREAS ────────────────────────────────────────────────
function showEmptyState() {
  document.getElementById('emptyState').style.display = 'flex';
  document.getElementById('buildContent').style.display = 'none';
}

// ── RENDER FULL BUILD DETAIL ───────────────────────────────────────────────
function renderBuildDetail() {
  if (!state.activeBuildId) { showEmptyState(); return; }
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  if (!build) { showEmptyState(); return; }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('buildContent').style.display = 'block';

  // Header
  document.getElementById('buildName').textContent = build.name;
  document.getElementById('buildMeta').innerHTML = `
    <span class="tag tag-class">${build.cls}</span>
    <span class="tag tag-season">${build.season}</span>
    <span class="tag tag-${build.source}">${SOURCE_LABELS[build.source] || build.source}</span>
    ${(build.contentTypes || []).map(t => `<span class="tag tag-content">${t}</span>`).join('')}
  `;
  const srcLink = document.getElementById('buildSourceLink');
  if (build.sourceUrl) {
    srcLink.href = build.sourceUrl;
    srcLink.textContent = build.sourceUrl.length > 70
      ? build.sourceUrl.slice(0, 70) + '…' : build.sourceUrl;
    srcLink.style.display = 'inline';
  } else {
    srcLink.style.display = 'none';
  }

  // Variant bar
  renderVariantBar(build);

  // Content for active variant
  const variant = build.variants[state.activeVariant] || build.variants[0];
  if (!variant) return;

  renderSkillSection(build, variant);
  renderGearSection(variant);
  renderParagonSection(build, variant);
  renderNotesSection(build);
}

// ── SYNC SKILL TREE IFRAMES ───────────────────────────────────────────────
function syncSkillTreeFrames(buildId, variantIdx) {
  const msg = { type: 'variantChange', buildId: buildId || 'default', variantIdx: variantIdx || 0 };
  const progress = document.getElementById('skillTreeProgress');
  const guide    = document.getElementById('skillTreeGuide');
  if (progress?.contentWindow) progress.contentWindow.postMessage(msg, '*');
  if (guide?.contentWindow)    guide.contentWindow.postMessage(msg, '*');
  // Also update src params for fresh loads
  if (progress) {
    const u = new URL(progress.src, window.location.href);
    u.searchParams.set('buildId', msg.buildId);
    u.searchParams.set('variantIdx', msg.variantIdx);
    if (progress.src !== u.href) progress.src = u.href;
  }
  if (guide) {
    const u = new URL(guide.src, window.location.href);
    u.searchParams.set('buildId', msg.buildId);
    u.searchParams.set('variantIdx', msg.variantIdx);
    if (guide.src !== u.href) guide.src = u.href;
  }
}

// ── VARIANT BAR ───────────────────────────────────────────────────────────
function renderVariantBar(build) {
  const bar = document.getElementById('variantBar');
  const affects = document.getElementById('variantAffects');
  bar.innerHTML = '';

  // Always show variant bar (even with 1 variant so user can add more)
  const vs = document.getElementById('variantSection');
  if(vs) vs.style.display = 'block';
  const dtabs = document.getElementById('detail-tabs-row') || document.querySelector('.detail-tabs-row');
  if(dtabs) dtabs.style.display = 'block';

  build.variants.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'variant-btn' + (i === state.activeVariant ? ' active' : '');
    btn.textContent = v.name;
    btn.addEventListener('click', () => {
      state.activeVariant = i;
      state.activeBoard = 0;
      renderVariantBar(build);
      const variant = build.variants[i];
      renderSkillSection(build, variant);
      renderGearSection(variant);
      renderParagonSection(build, variant);
      syncSkillTreeFrames(build.id, i);
    });
    bar.appendChild(btn);
  });

  // Add variant button (max 5)
  if (build.variants.length < 5) {
    const addBtn = document.createElement('button');
    addBtn.className = 'variant-btn variant-add-btn';
    addBtn.textContent = '+ Variant';
    addBtn.addEventListener('click', () => {
      const data = getData();
      const b = data.builds.find(x => x.id === build.id);
      if (!b || b.variants.length >= 5) return;
      b.variants.push({ name: `Variant ${b.variants.length + 1}`, skills: [], gear: [], paragonBoards: [], levelingSteps: [] });
      saveData(data);
      state.activeVariant = b.variants.length - 1;
      renderBuildDetail();
      syncSkillTreeFrames(b.id, state.activeVariant);
    });
    bar.appendChild(addBtn);
  }

  // Show what changes across variants
  const v = build.variants[state.activeVariant];
  const parts = [];
  if (v.skills && v.skills.length)           parts.push('Skills');
  if (v.gear && v.gear.length)               parts.push('Gear');
  if (v.paragonBoards && v.paragonBoards.length) parts.push('Paragon');
  if (v.levelingSteps && v.levelingSteps.length) parts.push('Leveling Guide');
  affects.textContent = parts.length
    ? `This variant includes: ${parts.join(', ')}`
    : 'No data yet for this variant — add skills and gear below.';
}

// ── SKILL SECTION ──────────────────────────────────────────────────────────
function renderSkillSection(build, variant) {
  // Skill tree image
  const imgArea = document.getElementById('skillTreeImage');
  if (build.skillTreeImage) {
    imgArea.innerHTML = `<img src="${build.skillTreeImage}" alt="Skill tree" onclick="openModal('skillImageModal')"/>`;
  } else {
    imgArea.innerHTML = `
      <div class="skill-tree-placeholder" onclick="openModal('skillImageModal')">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="color:currentColor">
          <rect x="3" y="3" width="26" height="26" rx="3" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 2"/>
          <line x1="16" y1="9" x2="16" y2="23" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="9" y1="16" x2="23" y2="16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span>Click to add skill tree screenshot or image URL</span>
      </div>`;
  }

  // Leveling steps
  const guide = document.getElementById('levelingGuide');
  const steps = variant.levelingSteps || [];
  if (steps.length) {
    guide.innerHTML = steps.map(s => `
      <div class="leveling-step">
        <span class="level-num">Lvl ${s.level}</span>
        <span class="level-action">${s.action}</span>
      </div>`).join('');
  } else {
    guide.innerHTML = '<div style="font-size:13px;color:var(--text3);padding:8px 0">No leveling guide data for this variant.</div>';
  }

  // Skills list
  const list = document.getElementById('skillsList');
  const skills = variant.skills || [];
  if (!skills.length) {
    list.innerHTML = '<div style="padding:16px 20px;font-size:13px;color:var(--text3)">No skills recorded for this variant.</div>';
    return;
  }
  list.innerHTML = skills.map(s => `
    <div class="skill-card">
      <div class="skill-icon-box">
        ${s.iconUrl ? `<img src="${s.iconUrl}" alt="${s.name}"/>` :
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="color:var(--text4)"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`}
      </div>
      <div class="skill-info">
        <div class="skill-name">${s.name}</div>
        <div class="skill-rank">Rank ${s.rank}${s.maxRank ? ' / ' + s.maxRank : ''}</div>
        ${s.desc ? `<div class="skill-desc">${s.desc}</div>` : ''}
      </div>
    </div>`).join('');
}

// ── GEAR SECTION ───────────────────────────────────────────────────────────
function renderGearSection(variant) {
  const list = document.getElementById('gearList');
  const gear = variant.gear || [];
  if (!gear.length) {
    list.innerHTML = '<div style="padding:20px;font-size:13px;color:var(--text3)">No gear recorded for this variant.</div>';
    return;
  }
  list.innerHTML = gear.map(item => `
    <div class="gear-card">
      <div class="gear-card-header">
        <span class="gear-slot-label">${item.slot}</span>
        <span class="gear-quality-badge qb-${item.quality || 'rare'}">${item.quality || 'Rare'}</span>
      </div>
      <div class="gear-item-name q-${(item.quality || 'rare').toLowerCase()}">${item.name}</div>
      <div class="gear-stats">
        ${(item.stats || []).map((stat, i) => `
          <div class="gear-stat-row">
            <div class="stat-priority ${i === 0 ? 'p1' : i === 1 ? 'p2' : 'p3'}">
              ${i < 3 ? `<span class="priority-arrow">${i === 0 ? '↑↑' : i === 1 ? '↑' : '↗'}</span>` : ''}
            </div>
            <span class="stat-text ${i < 2 ? 'priority' : ''}">${stat}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── PARAGON SECTION ────────────────────────────────────────────────────────
function renderParagonSection(build, variant) {
  const boards = variant.paragonBoards || [];
  renderBoardTabs(build, variant, boards);
  if (boards.length) {
    renderBoard(build, variant, boards[state.activeBoard]);
  } else {
    document.getElementById('boardCanvas').innerHTML =
      '<div style="padding:24px;font-size:13px;color:var(--text3)">No paragon boards added yet. Use "+ Add Board" to add boards for this variant.</div>';
  }
}

function renderBoardTabs(build, variant, boards) {
  const tabBar = document.getElementById('boardTabs');
  tabBar.innerHTML = '';
  boards.forEach((b, i) => {
    const tab = document.createElement('button');
    tab.className = 'board-tab' + (i === state.activeBoard ? ' active' : '');
    tab.innerHTML = `${b.boardId ? (state.paragons.find(p => p.id === b.boardId)?.name || b.boardId) : 'Board ' + (i+1)}
      <button class="tab-del" onclick="event.stopPropagation();removeBoard(${i})" title="Remove board">×</button>`;
    tab.addEventListener('click', () => {
      state.activeBoard = i;
      renderBoardTabs(build, variant, boards);
      renderBoard(build, variant, boards[i]);
    });
    tabBar.appendChild(tab);
  });
}

// ── NOTES SECTION ──────────────────────────────────────────────────────────
function renderNotesSection(build) {
  const el = document.getElementById('notesContent');
  let html = '';

  if (build.contentTypes && build.contentTypes.length) {
    html += `<div class="content-tags">${build.contentTypes.map(t => `<span class="tag tag-content">${t}</span>`).join('')}</div>`;
  }

  if ((build.strengths && build.strengths.length) || (build.weaknesses && build.weaknesses.length)) {
    html += `<div class="strengths-weaknesses">
      <div class="sw-col">
        <h4>Strengths</h4>
        ${(build.strengths || []).map(s => `<div class="sw-item strength"><span class="sw-icon">+</span>${s}</div>`).join('') || '<div style="font-size:13px;color:var(--text3)">None listed.</div>'}
      </div>
      <div class="sw-col">
        <h4>Weaknesses</h4>
        ${(build.weaknesses || []).map(w => `<div class="sw-item weakness"><span class="sw-icon">−</span>${w}</div>`).join('') || '<div style="font-size:13px;color:var(--text3)">None listed.</div>'}
      </div>
    </div>`;
  }

  html += `<textarea class="notes-textarea" placeholder="Add rotation notes, tips, priority stats..." onchange="saveNotes(this.value)">${build.notes || ''}</textarea>`;
  el.innerHTML = html;
}

function saveNotes(val) {
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  if (build) { build.notes = val; saveData(data); }
}

// ── SKILL TREE IMAGE ───────────────────────────────────────────────────────
function setSkillImage() {
  const url = document.getElementById('skillImageUrl').value.trim();
  if (!url) return;
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  if (build) {
    build.skillTreeImage = url;
    saveData(data);
    renderBuildDetail();
  }
  closeModal('skillImageModal');
}

// Drag-and-drop for skill tree
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('skillDropZone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('skillImageUrl').value = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});

// ── PARAGON BOARD ADD/REMOVE ───────────────────────────────────────────────
function openAddBoardModal() {
  if (!state.activeBuildId) return;
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  const variant = build?.variants[state.activeVariant];
  if (!variant) return;

  const sel = document.getElementById('boardSelect');
  sel.innerHTML = '';
  const cls = build.cls;
  state.paragons.forEach(b => {
    if (b.classes.includes(cls) || b.classes.includes('All') || b.id === 'starting-board') {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      sel.appendChild(opt);
    }
  });
  if (!sel.options.length) {
    sel.innerHTML = '<option disabled>No boards available for this class</option>';
  }
  openModal('addBoardModal');
}

function confirmAddBoard() {
  const boardId = document.getElementById('boardSelect').value;
  if (!boardId) return;
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  const variant = build?.variants[state.activeVariant];
  if (!variant) return;
  variant.paragonBoards = variant.paragonBoards || [];
  variant.paragonBoards.push({ boardId, guideNodes: [], unlockedNodes: [] });
  saveData(data);
  state.activeBoard = variant.paragonBoards.length - 1;
  closeModal('addBoardModal');
  renderParagonSection(build, variant);
}

function removeBoard(idx) {
  const data = getData();
  const build = data.builds.find(b => b.id === state.activeBuildId);
  const variant = build?.variants[state.activeVariant];
  if (!variant) return;
  variant.paragonBoards.splice(idx, 1);
  saveData(data);
  if (state.activeBoard >= variant.paragonBoards.length) state.activeBoard = Math.max(0, variant.paragonBoards.length - 1);
  renderParagonSection(build, variant);
}
