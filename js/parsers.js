// parsers.js — URL parsers for D4Builds, Maxroll, Mobalytics
// These run client-side and extract what they can from the URL structure.
// In production a backend proxy handles the actual page fetches.

function parseBuildUrl(url, site, name, cls) {
  if (site === 'd4builds')    return parseD4Builds(url, name, cls);
  if (site === 'maxroll')     return parseMaxroll(url, name, cls);
  if (site === 'mobalytics')  return parseMobalytics(url, name, cls);
  return makeEmptyBuild(name, cls);
}

// ── D4BUILDS ───────────────────────────────────────────────────────────────
// URL: d4builds.gg/builds/{uuid}
// Server-rendered HTML — backend scrapes:
//   h1/.build-title          → name
//   .class-label             → class
//   .season-badge            → season
//   .skill-node[data-name][data-rank] → skills
//   .paragon-board .node[data-name]   → guide nodes per board
//   .gear-slot .item-name    → gear slots
//   .active-rune             → runes
function parseD4Builds(url, name, cls) {
  const uuid = (url.match(/builds\/([a-f0-9-]{36})/i) || [])[1];
  return {
    ...makeEmptyBuild(name || (uuid ? `D4Builds Import` : 'D4Builds Build'), cls),
    notes: `Imported from D4Builds.\nURL: ${url}\n\nData available on this page:\n• Skills with ranks\n• Paragon boards + glyph slots\n• Gear slots + aspects + active runes\n\nBacked scraper can auto-fill skills and gear. For now, add them manually using the board tab and gear section.`
  };
}

// ── MAXROLL ────────────────────────────────────────────────────────────────
// Planner: maxroll.gg/d4/planner/{code}#{variant}
//   Hash fragment = base64 + LZString compressed build blob
//   Decode: atob(hash) → LZString.decompress → JSON
//   JSON has: skills{id→rank}, paragon{boardIds[], nodeIds[]}, gear{slot→{id,affixes[]}}
//   IDs resolved via maxroll's public game-data endpoint
//
// Guide: maxroll.gg/d4/build-guides/{slug}
//   Server-rendered:
//   h1          → name
//   .class-badge → class
//   .season-tag  → season
//   table.skill-table tr → skills + ranks
//   .gear-section .item-row → BiS gear + stat priority list
//   .paragon-section        → board names + glyph choices
//   .consumable-row         → elixirs, incenses
function parseMaxroll(url, name, cls) {
  const isGuide = url.includes('build-guides');
  const code  = (url.match(/planner\/([a-z0-9]+)/i) || [])[1];
  const slug  = (url.match(/build-guides\/([^/?#]+)/) || [])[1];
  const autoName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : (code ? `Maxroll Planner` : 'Maxroll Build');
  return {
    ...makeEmptyBuild(name || autoName, cls || guessClass(url)),
    notes: `Imported from Maxroll.\nURL: ${url}\n\nData available:\n• Skills + ranks\n• Paragon boards + glyph names\n• BiS gear with affix priority lists\n• Stat priority arrows\n• Consumables (elixirs, incenses)\n• Leveling progression steps\n\nBackend scraper can auto-fill all sections.`
  };
}

// ── MOBALYTICS ─────────────────────────────────────────────────────────────
// URL: mobalytics.gg/diablo-4/builds/{slug}
// JS-rendered React — Puppeteer/Playwright reads:
//   h1.build-title                    → name
//   .class-badge img[alt]             → class
//   .season-tag                       → season
//   .content-type-pill[]              → contentTypes[]
//   .assigned-skill img[alt] + .rank  → skills[]
//   .build-variant-tab[]              → variants[]
//   .strength-item[]                  → strengths[]
//   .weakness-item[]                  → weaknesses[]
//   .build-overview p                 → notes
//   .gear-slot .item-name + .quality  → gear[]
//   .paragon-node .node-name[]        → paragon board nodes
//   .rune-slot img[alt]               → runes
//   .author-name                      → author credit
function parseMobalytics(url, name, cls) {
  const slug = (url.match(/builds\/([^/?#]+)/) || [])[1] || '';
  const autoName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    ...makeEmptyBuild(name || autoName || 'Mobalytics Build', cls || guessClass(url)),
    notes: `Imported from Mobalytics.\nURL: ${url}\n\nData available:\n• Skills with ranks\n• Build variants (Hybrid, Push, Speed, 0-Button, Starter, etc.)\n• Content type tags (Speed Farm, Boss Killer, Pit Pusher…)\n• Strengths & weaknesses\n• Playstyle notes & rotation\n• Gear + paragon boards\n• Rune choices\n• Author credit\n\nBackend Puppeteer scraper can auto-fill all sections.`
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function makeEmptyBuild(name, cls) {
  return {
    name: name || 'New Build',
    cls:  cls  || 'Necromancer',
    variants: [
      { name: 'Default', skills: [], gear: [], paragonBoards: [], levelingSteps: [] }
    ],
    skillTreeImage: null,
    contentTypes: [],
    strengths: [],
    weaknesses: [],
    notes: ''
  };
}

function guessClass(url) {
  const u = url.toLowerCase();
  if (u.includes('barb'))    return 'Barbarian';
  if (u.includes('druid'))   return 'Druid';
  if (u.includes('necro'))   return 'Necromancer';
  if (u.includes('rogue'))   return 'Rogue';
  if (u.includes('sorc'))    return 'Sorcerer';
  if (u.includes('spirit'))  return 'Spiritborn';
  if (u.includes('paladin')) return 'Paladin';
  return 'Necromancer';
}
