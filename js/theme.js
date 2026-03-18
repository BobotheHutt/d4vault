// ── D4 VAULT THEME SYSTEM ─────────────────────────────────────────────────
// Themes change background pattern. Accents change text/borders/highlights.
// Brightness applies a global filter to the whole app.

const THEMES = {
  abyss: {
    name: 'Abyss',
    bg: '#0a0a0f',
    pattern: `radial-gradient(ellipse at 20% 50%, rgba(40,20,60,.4) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(20,10,40,.5) 0%, transparent 50%),
              repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(80,60,120,.03) 40px, rgba(80,60,120,.03) 41px)`,
    overlay: 'rgba(10,10,20,.92)',
  },
  infernal: {
    name: 'Infernal',
    bg: '#0f0806',
    pattern: `radial-gradient(ellipse at 30% 70%, rgba(120,30,10,.45) 0%, transparent 55%),
              radial-gradient(ellipse at 75% 25%, rgba(80,20,5,.4) 0%, transparent 50%),
              repeating-linear-gradient(-30deg, transparent, transparent 50px, rgba(150,40,10,.04) 50px, rgba(150,40,10,.04) 51px),
              repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(100,20,5,.03) 30px, rgba(100,20,5,.03) 31px)`,
    overlay: 'rgba(15,8,6,.91)',
  },
  celestial: {
    name: 'Celestial',
    bg: '#060810',
    pattern: `radial-gradient(ellipse at 50% 0%, rgba(20,40,120,.5) 0%, transparent 60%),
              radial-gradient(ellipse at 10% 80%, rgba(10,20,80,.4) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 60%, rgba(30,10,80,.3) 0%, transparent 40%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='20' cy='40' r='0.8' fill='rgba(200,210,255,0.4)'/%3E%3Ccircle cx='80' cy='15' r='0.6' fill='rgba(200,210,255,0.3)'/%3E%3Ccircle cx='150' cy='60' r='1' fill='rgba(200,210,255,0.5)'/%3E%3Ccircle cx='40' cy='120' r='0.7' fill='rgba(200,210,255,0.3)'/%3E%3Ccircle cx='120' cy='100' r='0.9' fill='rgba(200,210,255,0.4)'/%3E%3Ccircle cx='170' cy='150' r='0.6' fill='rgba(200,210,255,0.3)'/%3E%3Ccircle cx='60' cy='170' r='0.8' fill='rgba(200,210,255,0.35)'/%3E%3Ccircle cx='190' cy='30' r='0.5' fill='rgba(200,210,255,0.25)'/%3E%3C/svg%3E")`,
    overlay: 'rgba(6,8,16,.90)',
  },
  sanctuary: {
    name: 'Sanctuary',
    bg: '#0d0b08',
    pattern: `radial-gradient(ellipse at 60% 40%, rgba(80,60,20,.4) 0%, transparent 55%),
              radial-gradient(ellipse at 20% 70%, rgba(60,40,15,.35) 0%, transparent 50%),
              repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(100,80,30,.04) 60px, rgba(100,80,30,.04) 61px),
              repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(80,60,20,.03) 80px, rgba(80,60,20,.03) 81px)`,
    overlay: 'rgba(13,11,8,.91)',
  },
  void: {
    name: 'Void',
    bg: '#050508',
    pattern: `radial-gradient(ellipse at 50% 50%, rgba(20,20,60,.6) 0%, transparent 70%),
              repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(30,20,60,.04) 1deg, transparent 2deg, transparent 20deg),
              linear-gradient(180deg, rgba(10,5,30,.3) 0%, transparent 100%)`,
    overlay: 'rgba(5,5,8,.93)',
  },
};

const ACCENTS = {
  gold:    { name: 'Gold',    color: '#c9a84c', glow: 'rgba(201,168,76,.35)',  dark: '#1a1408', mid: '#8a6020' },
  blood:   { name: 'Blood',   color: '#c03535', glow: 'rgba(192,53,53,.35)',   dark: '#180808', mid: '#802020' },
  frost:   { name: 'Frost',   color: '#4090c8', glow: 'rgba(64,144,200,.35)',  dark: '#081018', mid: '#205880' },
  void:    { name: 'Void',    color: '#9040c8', glow: 'rgba(144,64,200,.35)',  dark: '#100818', mid: '#602090' },
  emerald: { name: 'Emerald', color: '#30a860', glow: 'rgba(48,168,96,.35)',   dark: '#081408', mid: '#1a6035' },
  bone:    { name: 'Bone',    color: '#d0c8a8', glow: 'rgba(208,200,168,.25)', dark: '#181810', mid: '#908870' },
  silver:  { name: 'Silver',  color: '#a0b0c0', glow: 'rgba(160,176,192,.25)', dark: '#0c1018', mid: '#607080' },
};

let currentTheme = 'abyss';
let currentAccent = 'gold';
let currentBrightness = 100;
let currentFontSize = 100;

function applyTheme(themeKey, accentKey, brightness, fontSize) {
  currentTheme = themeKey || currentTheme;
  currentAccent = accentKey || currentAccent;
  currentBrightness = brightness !== undefined ? brightness : currentBrightness;
  currentFontSize = fontSize !== undefined ? fontSize : currentFontSize;

  const t = THEMES[currentTheme];
  const a = ACCENTS[currentAccent];
  const r = document.documentElement;

  // Background
  r.style.setProperty('--bg-color', t.bg);
  r.style.setProperty('--bg-pattern', t.pattern);
  r.style.setProperty('--bg-overlay', t.overlay);

  // Accent colors
  r.style.setProperty('--accent',      a.color);
  r.style.setProperty('--accent-glow', a.glow);
  r.style.setProperty('--accent-dark', a.dark);
  r.style.setProperty('--accent-mid',  a.mid);

  // Font size — applied to body so it scales text without breaking layouts
  document.body.style.fontSize = currentFontSize === 100 ? '' : `${currentFontSize}%`;

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

  // Update selector UI if open
  updateThemeUI();
}

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('d4v_theme') || '{}');
    applyTheme(saved.theme || 'abyss', saved.accent || 'gold', saved.brightness ?? 100, saved.fontSize ?? 100);
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
  const fSlider = document.getElementById('fontSizeSlider');
  if (fSlider) fSlider.value = currentFontSize;
  const fLabel = document.getElementById('fontSizeLabel');
  if (fLabel) fLabel.textContent = currentFontSize + '%';
}

function toggleThemePanel() {
  const panel = document.getElementById('themePanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) updateThemeUI();
}

// Build the theme panel HTML
function buildThemePanel() {
  const panel = document.getElementById('themePanel');
  if (!panel) return;

  const themeCards = Object.entries(THEMES).map(([key, t]) => `
    <div class="theme-card ${key === currentTheme ? 'active' : ''}" data-theme="${key}"
      onclick="applyTheme('${key}')"
      style="background:${t.bg};background-image:${t.pattern};">
      <div class="theme-card-overlay" style="background:${t.overlay};">
        <span class="theme-card-name">${t.name}</span>
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
        <input type="range" id="fontSizeSlider" min="70" max="130" value="${currentFontSize}"
          oninput="applyTheme(null,null,null,parseInt(this.value));document.getElementById('fontSizeLabel').textContent=this.value+'%'"
          style="flex:1;accent-color:var(--accent,#c9a84c);">
        <span id="fontSizeLabel" style="min-width:36px;text-align:right;font-size:12px;color:var(--accent,#c9a84c);">${currentFontSize}%</span>
      </div>
      <div class="theme-section-label" style="margin-top:14px;">Brightness</div>
      <div class="brightness-row">
        <input type="range" id="brightnessSlider" min="30" max="160" value="${currentBrightness}"
          oninput="applyTheme(null,null,parseInt(this.value));document.getElementById('brightnessLabel').textContent=this.value+'%'"
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

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  buildThemePanel();
});
