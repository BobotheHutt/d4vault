// paragon.js — board grid renderer + click/drag unlock interaction

let dragState = {
  active: false,
  startNode: null,
  lastNode: null,
  path: []       // node ids being painted in current drag
};

function renderBoard(build, variant, boardData) {
  const canvas = document.getElementById('boardCanvas');
  if (!boardData) { canvas.innerHTML = ''; return; }

  const boardDef = state.paragons.find(p => p.id === boardData.boardId);
  if (!boardDef) {
    canvas.innerHTML = `<div style="padding:24px;color:var(--text3);font-size:13px">Board definition not found for "${boardData.boardId}".</div>`;
    return;
  }

  const cols = boardDef.size.cols;
  const rows = boardDef.size.rows;
  const guideSet   = new Set(boardData.guideNodes   || []);
  const unlockedSet = new Set(boardData.unlockedNodes || []);

  // Build a position→node lookup for path routing
  const posMap = {};
  boardDef.nodes.forEach(n => { posMap[`${n.pos[0]},${n.pos[1]}`] = n; });

  // Render grid
  const grid = document.createElement('div');
  grid.className = 'board-grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, 48px)`;
  grid.style.gridTemplateRows    = `repeat(${rows}, 48px)`;

  // Fill entire grid — empty cells for positions without nodes
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const node = posMap[`${col},${row}`];
      if (!node) {
        const empty = document.createElement('div');
        empty.style.width = '48px';
        empty.style.height = '48px';
        grid.appendChild(empty);
        continue;
      }

      const el = document.createElement('div');
      el.className = buildNodeClass(node, guideSet, unlockedSet);
      el.dataset.nodeId = node.id;
      el.dataset.col = col;
      el.dataset.row = row;
      if (node.type === 'glyph') { el.style.width = '52px'; el.style.height = '52px'; }

      // Node name label
      const nameEl = document.createElement('div');
      nameEl.className = 'node-name';
      nameEl.textContent = node.name;
      el.appendChild(nameEl);

      // Tooltip
      const tip = document.createElement('div');
      tip.className = 'node-tooltip';
      tip.innerHTML = `<strong>${node.name}</strong>${node.desc}`;
      el.appendChild(tip);

      // Mouse events for click + drag-path
      el.addEventListener('mousedown', e => {
        if (e.button === 2) return; // right click handled separately
        e.preventDefault();
        startDrag(node, el, build, variant, boardData, boardDef, posMap);
      });
      el.addEventListener('mouseenter', e => {
        if (dragState.active) continueDrag(node, el, build, variant, boardData, boardDef, posMap, grid);
      });
      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        toggleUnlock(node.id, build, variant, boardData, false);
      });

      grid.appendChild(el);
    }
  }

  // Global mouseup ends drag
  const endDragHandler = () => {
    if (dragState.active) endDrag(build, variant, boardData);
  };
  // Remove old listener, add fresh one
  document.removeEventListener('mouseup', window._paragonEndDrag);
  window._paragonEndDrag = endDragHandler;
  document.addEventListener('mouseup', window._paragonEndDrag);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'board-legend';
  legend.innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:rgba(90,80,64,.3);border-color:rgba(90,80,64,.5)"></div>Normal</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(93,173,226,.12);border-color:rgba(93,173,226,.35)"></div>Magic</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(201,168,76,.12);border-color:rgba(201,168,76,.4)"></div>Rare</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(231,76,60,.12);border-color:rgba(231,76,60,.4)"></div>Legendary</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(155,89,182,.15);border-color:rgba(155,89,182,.5)"></div>Glyph Socket</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(46,204,113,.1);border-color:rgba(46,204,113,.4)"></div>Gate</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(201,168,76,.2);border-color:rgba(201,168,76,.6)"></div>Guide Pick</div>
    <div class="legend-item"><div class="legend-dot" style="background:rgba(46,204,113,.15);border-color:rgba(46,204,113,.7)"></div>Unlocked (yours)</div>
  `;

  canvas.innerHTML = '';
  canvas.appendChild(grid);
  canvas.appendChild(legend);
}

function buildNodeClass(node, guideSet, unlockedSet) {
  let cls = 'p-node ' + node.type;
  if (guideSet.has(node.id))    cls += ' guide-pick';
  if (unlockedSet.has(node.id)) cls += ' unlocked';
  return cls;
}

// ── CLICK & DRAG PATH ──────────────────────────────────────────────────────
function startDrag(node, el, build, variant, boardData, boardDef, posMap) {
  dragState.active = true;
  dragState.startNode = node;
  dragState.lastNode  = node;
  dragState.path = [node.id];
  el.classList.add('dragging-over');
}

function continueDrag(node, el, build, variant, boardData, boardDef, posMap, grid) {
  if (!dragState.active || node.id === dragState.lastNode?.id) return;

  // Route path from lastNode to this node following grid adjacency
  const newPath = routePath(dragState.lastNode, node, boardDef, posMap);
  newPath.forEach(nid => {
    if (!dragState.path.includes(nid)) {
      dragState.path.push(nid);
      const nodeEl = grid.querySelector(`[data-node-id="${nid}"]`);
      if (nodeEl) nodeEl.classList.add('dragging-over');
    }
  });
  dragState.lastNode = node;
}

function endDrag(build, variant, boardData) {
  if (!dragState.active) return;
  dragState.active = false;

  // Commit all dragged nodes as unlocked
  dragState.path.forEach(nid => {
    if (!boardData.unlockedNodes.includes(nid)) {
      boardData.unlockedNodes.push(nid);
    }
  });

  const data = getData();
  saveData(data);

  dragState.path = [];
  dragState.startNode = null;
  dragState.lastNode  = null;

  renderBoardAfterChange(build, variant, boardData);
}

// Route between two nodes via Manhattan path (grid-aware, follows adjacency)
function routePath(fromNode, toNode, boardDef, posMap) {
  if (!fromNode || !toNode) return [];
  let [fc, fr] = fromNode.pos;
  let [tc, tr] = toNode.pos;
  const path = [];

  // Walk column first, then row (L-shaped path)
  const dc = tc > fc ? 1 : tc < fc ? -1 : 0;
  const dr = tr > fr ? 1 : tr < fr ? -1 : 0;

  let c = fc, r = fr;
  while (c !== tc) {
    c += dc;
    const n = posMap[`${c},${r}`];
    if (n) path.push(n.id);
  }
  while (r !== tr) {
    r += dr;
    const n = posMap[`${c},${r}`];
    if (n) path.push(n.id);
  }
  return path;
}

// ── TOGGLE SINGLE NODE (right-click removes) ───────────────────────────────
function toggleUnlock(nodeId, build, variant, boardData, forceAdd) {
  const idx = boardData.unlockedNodes.indexOf(nodeId);
  if (forceAdd === true) {
    if (idx === -1) boardData.unlockedNodes.push(nodeId);
  } else if (forceAdd === false) {
    if (idx !== -1) boardData.unlockedNodes.splice(idx, 1);
  } else {
    if (idx === -1) boardData.unlockedNodes.push(nodeId);
    else boardData.unlockedNodes.splice(idx, 1);
  }
  const data = getData();
  saveData(data);
  renderBoardAfterChange(build, variant, boardData);
}

// ── GUIDE NODE TOGGLE (for manually marking guide picks) ──────────────────
function toggleGuide(nodeId, build, variant, boardData) {
  const idx = boardData.guideNodes.indexOf(nodeId);
  if (idx === -1) boardData.guideNodes.push(nodeId);
  else boardData.guideNodes.splice(idx, 1);
  const data = getData();
  saveData(data);
  renderBoardAfterChange(build, variant, boardData);
}

function renderBoardAfterChange(build, variant, boardData) {
  const boards = variant.paragonBoards || [];
  renderBoardTabs(build, variant, boards);
  renderBoard(build, variant, boardData);
}
