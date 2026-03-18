// ── D4 VAULT THEME SYSTEM ─────────────────────────────────────────────────
// Themes change background pattern. Accents change text/borders/highlights.
// Brightness applies a global filter to the whole app.

const THEMES = {
  bloodFury: {
    name: 'Blood Fury',
    cls: 'Barbarian',
    bg: '#0e0604',
    panelBg: '#160a06',
    pattern: `radial-gradient(ellipse at 30% 60%, rgba(140,20,10,.5) 0%, transparent 55%),
              radial-gradient(ellipse at 80% 20%, rgba(100,15,5,.4) 0%, transparent 45%),
              repeating-linear-gradient(75deg, transparent, transparent 30px, rgba(160,30,10,.04) 30px, rgba(160,30,10,.04) 31px),
              repeating-linear-gradient(-15deg, transparent, transparent 50px, rgba(120,20,5,.03) 50px, rgba(120,20,5,.03) 51px)`,
    overlay: 'rgba(14,6,4,.90)',
  },
  wildHeart: {
    name: 'Wild Heart',
    cls: 'Druid',
    bg: '#050e06',
    panelBg: '#081208',
    pattern: `radial-gradient(ellipse at 40% 70%, rgba(20,80,20,.5) 0%, transparent 55%),
              radial-gradient(ellipse at 75% 30%, rgba(10,60,15,.4) 0%, transparent 50%),
              repeating-linear-gradient(20deg, transparent, transparent 60px, rgba(20,80,20,.04) 60px, rgba(20,80,20,.04) 61px),
              repeating-linear-gradient(110deg, transparent, transparent 40px, rgba(10,50,10,.03) 40px, rgba(10,50,10,.03) 41px)`,
    overlay: 'rgba(5,14,6,.91)',
  },
  boneWitch: {
    name: 'Bone Witch',
    cls: 'Necromancer',
    bg: '#050810',
    panelBg: '#080c18',
    pattern: `radial-gradient(ellipse at 50% 40%, rgba(20,80,90,.45) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 80%, rgba(10,50,70,.4) 0%, transparent 50%),
              repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(20,80,90,.04) 44px, rgba(20,80,90,.04) 45px),
              repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(10,60,80,.03) 44px, rgba(10,60,80,.03) 45px)`,
    overlay: 'rgba(5,8,16,.91)',
  },
  shadowStep: {
    name: 'Shadow Step',
    cls: 'Rogue',
    bg: '#060606',
    panelBg: '#0c0c0e',
    pattern: `radial-gradient(ellipse at 70% 30%, rgba(40,30,60,.4) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 70%, rgba(30,20,50,.35) 0%, transparent 45%),
              repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(60,50,80,.04) 35px, rgba(60,50,80,.04) 36px),
              repeating-linear-gradient(45deg, transparent, transparent 55px, rgba(40,30,60,.03) 55px, rgba(40,30,60,.03) 56px)`,
    overlay: 'rgba(6,6,6,.93)',
  },
  voidArcanist: {
    name: 'Void Arcanist',
    cls: 'Sorcerer',
    bg: '#05060f',
    panelBg: '#08091a',
    pattern: `radial-gradient(ellipse at 50% 30%, rgba(30,20,120,.5) 0%, transparent 55%),
              radial-gradient(ellipse at 15% 70%, rgba(20,10,100,.4) 0%, transparent 50%),
              radial-gradient(ellipse at 85% 80%, rgba(40,10,80,.3) 0%, transparent 40%),
              repeating-conic-gradient(from 30deg at 50% 50%, transparent 0deg, rgba(40,20,120,.04) 1deg, transparent 2deg, transparent 15deg)`,
    overlay: 'rgba(5,6,15,.91)',
  },
  spiritWarden: {
    name: 'Spirit Warden',
    cls: 'Spiritborn',
    bg: '#0c0900',
    panelBg: '#140e00',
    pattern: `radial-gradient(ellipse at 60% 40%, rgba(120,90,10,.45) 0%, transparent 55%),
              radial-gradient(ellipse at 25% 65%, rgba(100,70,5,.4) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(140,100,20,.25) 0%, transparent 35%),
              repeating-linear-gradient(30deg, transparent, transparent 50px, rgba(120,90,10,.04) 50px, rgba(120,90,10,.04) 51px)`,
    overlay: 'rgba(12,9,0,.91)',
  },
  sacredOath: {
    name: 'Sacred Oath',
    cls: 'Paladin',
    bg: '#0a0a08',
    panelBg: '#121208',
    pattern: `radial-gradient(ellipse at 50% 0%, rgba(160,140,40,.35) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, rgba(100,90,20,.25) 0%, transparent 40%),
              repeating-linear-gradient(90deg, transparent, transparent 70px, rgba(160,140,40,.03) 70px, rgba(160,140,40,.03) 71px),
              repeating-linear-gradient(0deg, transparent, transparent 70px, rgba(140,120,30,.025) 70px, rgba(140,120,30,.025) 71px)`,
    overlay: 'rgba(10,10,8,.91)',
  },
};

const ACCENTS = {
  blood:    { name: 'Blood',   color: '#c03535', rgb: '192,53,53',   glow: 'rgba(192,53,53,.35)',   dark: '#180808', mid: '#802020' },
  moss:     { name: 'Moss',    color: '#4a9040', rgb: '74,144,64',   glow: 'rgba(74,144,64,.35)',   dark: '#081008', mid: '#2a6020' },
  death:    { name: 'Death',   color: '#30a8a0', rgb: '48,168,160',  glow: 'rgba(48,168,160,.35)',  dark: '#041414', mid: '#1a7070' },
  shadow:   { name: 'Shadow',  color: '#8870c0', rgb: '136,112,192', glow: 'rgba(136,112,192,.35)', dark: '#0c0818', mid: '#504080' },
  arc:      { name: 'Arc',     color: '#4070d8', rgb: '64,112,216',  glow: 'rgba(64,112,216,.35)',  dark: '#040818', mid: '#203080' },
  spirit:   { name: 'Spirit',  color: '#c89030', rgb: '200,144,48',  glow: 'rgba(200,144,48,.35)',  dark: '#140c00', mid: '#806010' },
  holy:     { name: 'Holy',    color: '#c9a84c', rgb: '201,168,76',  glow: 'rgba(201,168,76,.35)',  dark: '#1a1408', mid: '#8a6020' },
};

let currentTheme = 'sacredOath';
let currentAccent = 'holy';
let currentBrightness = 100;
let currentFontSize = 100;

function applyTheme(themeKey, accentKey, brightness, fontSize) {
  if (themeKey !== null && themeKey !== undefined) currentTheme = themeKey;
  if (accentKey !== null && accentKey !== undefined) currentAccent = accentKey;
  if (brightness !== null && brightness !== undefined) currentBrightness = brightness;
  if (fontSize !== null && fontSize !== undefined) currentFontSize = fontSize;

  const t = THEMES[currentTheme];
  const a = ACCENTS[currentAccent];
  const r = document.documentElement;

  // Background — apply directly to body so pattern is visible everywhere
  document.body.style.backgroundColor = t.bg;
  document.body.style.backgroundImage = t.pattern;
  r.style.setProperty('--bg-color', t.bg);
  r.style.setProperty('--bg-pattern', t.pattern);
  r.style.setProperty('--bg-overlay', t.overlay);
  r.style.setProperty('--panel-bg', t.panelBg || '#12122a');

  // Accent colors
  r.style.setProperty('--accent',      a.color);
  r.style.setProperty('--accent-rgb',  a.rgb || '201,168,76');
  r.style.setProperty('--accent-glow', a.glow);
  r.style.setProperty('--accent-dark', a.dark);
  r.style.setProperty('--accent-mid',  a.mid);

  // Font size — scale text only via CSS custom property
  r.style.setProperty('--font-scale', currentFontSize / 100);

  // Brightness — use a CSS variable + overlay approach to avoid filter breaking fixed elements
  const bv = currentBrightness / 100;
  document.documentElement.style.removeProperty('filter');
  document.body.style.filter = '';
  // Apply brightness via a dedicated overlay div
  let bOverlay = document.getElementById('brightnessOverlay');
  if (!bOverlay) {
    bOverlay = document.createElement('div');
    bOverlay.id = 'brightnessOverlay';
    bOverlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;transition:background .2s;';
    document.body.appendChild(bOverlay);
  }
  if (bv < 1) {
    const darkness = Math.round((1 - bv) * 100);
    bOverlay.style.background = `rgba(0,0,0,${(1-bv) * 0.85})`;
  } else if (bv > 1) {
    const lightness = Math.round((bv - 1) * 100);
    bOverlay.style.background = `rgba(255,255,255,${(bv-1) * 0.3})`;
  } else {
    bOverlay.style.background = 'transparent';
  }

  // Save to localStorage
  localStorage.setItem('d4v_theme', JSON.stringify({ theme: currentTheme, accent: currentAccent, brightness: currentBrightness, fontSize: currentFontSize }));

  // Broadcast theme to skill tree iframes
  const themeMsg = { type: 'themeChange', panelBg: t.panelBg || '#12122a', accent: a.color, accentRgb: a.rgb || '201,168,76' };
  document.querySelectorAll('iframe').forEach(f => {
    try { f.contentWindow.postMessage(themeMsg, '*'); } catch(e) {}
  });

  // Update selector UI if open
  updateThemeUI();
}

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('d4v_theme') || '{}');
    applyTheme(saved.theme || 'sacredOath', saved.accent || 'holy', saved.brightness ?? 100, saved.fontSize ?? 100);
  // Reset if saved value was in old narrow range

  } catch(e) {
    applyTheme('abyss', 'gold', 100);
  }
}

function updateThemeUI() {
  document.querySelectorAll('.theme-card').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === currentTheme);
  });
  document.querySelectorAll('.accent-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.accent === currentAccent);
  });
  const bSlider = document.getElementById('brightnessSlider');
  if (bSlider) bSlider.value = currentBrightness;
  const bLabel = document.getElementById('brightnessLabel');
  if (bLabel) bLabel.textContent = currentBrightness + '%';
  const fSlider = document.getElementById('zoomSlider');
  if (fSlider) fSlider.value = currentFontSize;
  const fLabel = document.getElementById('zoomLabel');
  if (fLabel) fLabel.textContent = currentFontSize + '%';
}

function toggleThemePanel() {
  const panel = document.getElementById('themePanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // Build panel content lazily on first open (ensures DOM is ready)
    if (!panel.innerHTML.trim()) buildThemePanel();
    updateThemeUI();
  }
}

// Build the theme panel HTML
function buildThemePanel() {
  const panel = document.getElementById('themePanel');
  if (!panel) return;

  const themeCards = Object.entries(THEMES).map(([key, t]) => `
    <div class="theme-card ${key === currentTheme ? 'active' : ''}" data-theme="${key}"
      onclick="applyTheme('${key}')"
      style="background:${t.bg};background-image:${t.pattern};">
      <div class="theme-card-overlay">
        <span class="theme-card-name">${t.name}</span>
        <span class="theme-card-cls">${t.cls}</span>
      </div>
    </div>
  `).join('');

  const accentSwatches = Object.entries(ACCENTS).map(([key, a]) => `
    <div class="accent-swatch ${key === currentAccent ? 'active' : ''}" data-accent="${key}"
      onclick="applyTheme(null, '${key}')"
      style="background:${a.color};box-shadow:0 0 8px ${a.glow};"
      title="${a.name}">
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="theme-panel-inner">
      <div class="theme-section-label">Main Theme</div>
      <div class="theme-cards">${themeCards}</div>
      <div class="theme-section-label" style="margin-top:14px;">Accent</div>
      <div class="accent-swatches">${accentSwatches}</div>
      <div class="theme-section-label" style="margin-top:14px;">Font Size</div>
      <div class="brightness-row">
        <input type="range" id="zoomSlider" min="70" max="130" value="${currentFontSize}"
          oninput="currentFontSize=parseInt(this.value);document.documentElement.style.setProperty('--font-scale',currentFontSize/100);document.getElementById('zoomLabel').textContent=this.value+'%';localStorage.setItem('d4v_theme',JSON.stringify({theme:currentTheme,accent:currentAccent,brightness:currentBrightness,fontSize:currentFontSize}))"
          style="flex:1;accent-color:var(--accent,#c9a84c);">
        <span id="zoomLabel" style="min-width:36px;text-align:right;font-size:12px;color:var(--accent,#c9a84c);">${currentFontSize}%</span>
      </div>
      <div class="theme-section-label" style="margin-top:14px;">Brightness</div>
      <div class="brightness-row">
        <input type="range" id="brightnessSlider" min="30" max="160" value="${currentBrightness}"
          oninput="currentBrightness=parseInt(this.value);applyTheme(null,null,currentBrightness);document.getElementById('brightnessLabel').textContent=this.value+'%'"
          style="flex:1;accent-color:var(--accent,#c9a84c);">
        <span id="brightnessLabel" style="min-width:36px;text-align:right;font-size:12px;color:var(--accent,#c9a84c);">${currentBrightness}%</span>
      </div>
    </div>
  `;
}

// Close panel on outside click
document.addEventListener('click', e => {
  const panel = document.getElementById('themePanel');
  const btn = document.getElementById('themeBtnWrap');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    panel.style.display = 'none';
  }
});

// Apply theme immediately so no flash of unstyled content
loadTheme();
// Panel built lazily on first open via toggleThemePanel()
