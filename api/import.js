// api/import.js — Vercel serverless function
// Fetches and parses build data from D4Builds, Maxroll, and Mobalytics
// Mobalytics uses __NEXT_DATA__ extraction (no headless browser needed)

module.exports = async function handler(req, res) {
  // CORS headers so the frontend can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let result;
    if (url.includes('d4builds.gg'))     result = await scrapeD4Builds(url);
    else if (url.includes('maxroll.gg')) result = await scrapeMaxroll(url);
    else if (url.includes('mobalytics.gg')) result = await scrapeMobalytics(url);
    else return res.status(400).json({ error: 'Unsupported site' });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: err.message || 'Scrape failed' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SHARED FETCH HELPER
// ─────────────────────────────────────────────────────────────────────────
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

// Simple regex-based HTML attribute extractor (no DOM parser in Node edge runtime)
function attr(html, selector, attribute) {
  // Extract content attr from a tag matching a pattern
  const re = new RegExp(`${selector}[^>]*${attribute}="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? decode(m[1]) : null;
}

function textBetween(html, open, close) {
  const idx = html.indexOf(open);
  if (idx === -1) return null;
  const start = idx + open.length;
  const end = html.indexOf(close, start);
  if (end === -1) return null;
  return decode(html.slice(start, end).replace(/<[^>]+>/g, '').trim());
}

function allMatches(html, re) {
  const results = [];
  let m;
  const g = new RegExp(re.source, 'gi');
  while ((m = g.exec(html)) !== null) results.push(m);
  return results;
}

function decode(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function guessClass(text) {
  const t = text.toLowerCase();
  if (t.includes('barbarian') || t.includes('barb')) return 'Barbarian';
  if (t.includes('druid'))    return 'Druid';
  if (t.includes('necromancer') || t.includes('necro')) return 'Necromancer';
  if (t.includes('rogue'))    return 'Rogue';
  if (t.includes('sorcerer') || t.includes('sorc')) return 'Sorcerer';
  if (t.includes('spiritborn') || t.includes('spirit')) return 'Spiritborn';
  if (t.includes('paladin'))  return 'Paladin';
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// D4BUILDS SCRAPER
// Server-rendered HTML — straightforward parse
// ─────────────────────────────────────────────────────────────────────────
async function scrapeD4Builds(url) {
  const html = await fetchPage(url);

  // Build name — in the page title or h1
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].replace('· D4 Builds', '').replace('Diablo 4', '').trim() : null;

  // Class — look for class name near the header area
  const classFromUrl = guessClass(url);
  const classFromHtml = guessClass(html.slice(0, 5000)); // check top of page

  // Season
  const seasonMatch = html.match(/Season\s+(\d+)/i);
  const season = seasonMatch ? `Season ${seasonMatch[1]}` : null;

  // Skills — d4builds renders skill nodes with data attributes
  const skillMatches = allMatches(html, /data-skill-name="([^"]+)"[^>]*data-rank="(\d+)"/);
  const skillsFromData = skillMatches.map(m => ({
    name: decode(m[1]),
    rank: parseInt(m[2]) || 1,
    desc: ''
  }));

  // Also try alt text on skill images as fallback
  const skillImgMatches = allMatches(html, /class="[^"]*skill[^"]*"[^>]*alt="([^"]+)"/);
  const skillsFromImg = skillImgMatches
    .map(m => ({ name: decode(m[1]), rank: 1, desc: '' }))
    .filter(s => s.name && s.name.length > 1 && !s.name.includes('empty'));

  const skills = skillsFromData.length ? skillsFromData : skillsFromImg.slice(0, 6);

  // Gear slots
  const gearSlotMatches = allMatches(html, /class="[^"]*gear-slot[^"]*"[^>]*>\s*<[^>]+>([^<]+)<\/[^>]+>/);
  const gearItemMatches = allMatches(html, /class="[^"]*item-name[^"]*"[^>]*>([^<]+)<\//);

  const gear = [];
  const slots = ['Helm', 'Chest', 'Gloves', 'Pants', 'Boots', 'Amulet', 'Ring 1', 'Ring 2', 'Weapon', 'Offhand'];
  gearItemMatches.slice(0, 10).forEach((m, i) => {
    const name = decode(m[1]).trim();
    if (name && name.length > 1) {
      gear.push({
        slot: slots[i] || `Slot ${i + 1}`,
        name,
        quality: 'rare',
        stats: []
      });
    }
  });

  const cls = classFromHtml || classFromUrl || 'Necromancer';

  return {
    name: rawTitle || 'D4Builds Build',
    cls,
    season: season || '',
    source: 'd4builds',
    variants: [{
      name: 'Default',
      skills: skills.slice(0, 8),
      gear,
      paragonBoards: [],
      levelingSteps: []
    }],
    skillTreeImage: null,
    contentTypes: [],
    strengths: [],
    weaknesses: [],
    notes: `Imported from D4Builds.\nSource: ${url}`
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MAXROLL SCRAPER
// Guide pages are server-rendered — good HTML parse
// Planner pages encode data in URL hash (client-side only, handled in parsers.js)
// ─────────────────────────────────────────────────────────────────────────
async function scrapeMaxroll(url) {
  const isGuide = url.includes('build-guides');

  if (!isGuide) {
    // Planner URL — hash fragment can't be read server-side
    // Return structured empty with helpful note
    const code = (url.match(/planner\/([a-z0-9]+)/i) || [])[1];
    return {
      name: code ? `Maxroll Planner (${code})` : 'Maxroll Build',
      cls: guessClass(url) || 'Necromancer',
      season: '',
      source: 'maxroll',
      variants: [{ name: 'Default', skills: [], gear: [], paragonBoards: [], levelingSteps: [] }],
      skillTreeImage: null,
      contentTypes: [],
      strengths: [],
      weaknesses: [],
      notes: `Maxroll planner URLs encode data in the URL hash which can only be read client-side.\nURL: ${url}\n\nFor better auto-import, use the build guide URL (maxroll.gg/d4/build-guides/...) instead of the planner URL.`
    };
  }

  const html = await fetchPage(url);

  // Build name from title or h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const titleMatch = html.match(/<title>([^<|–-]+)/i);
  const rawName = h1Match ? decode(h1Match[1])
    : titleMatch ? decode(titleMatch[1]).replace(/maxroll|guide|diablo/gi, '').trim()
    : null;

  // Slug-based name fallback
  const slug = (url.match(/build-guides\/([^/?#]+)/) || [])[1] || '';
  const slugName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Class
  const cls = guessClass(html.slice(0, 8000)) || guessClass(url) || 'Necromancer';

  // Season
  const seasonMatch = html.match(/Season\s+(\d+)/i);
  const season = seasonMatch ? `Season ${seasonMatch[1]}` : '';

  // Skills — Maxroll guide pages have skill tables
  const skills = [];
  // Try data-skill or skill name patterns
  const skillRowMatches = allMatches(html, /class="[^"]*skill[^"]*row[^"]*"[^>]*>([\s\S]{0,400}?)<\/tr>/);
  skillRowMatches.forEach(m => {
    const nameM = m[1].match(/alt="([^"]+)"/);
    const rankM = m[1].match(/rank[^>]*>(\d+)</i) || m[1].match(/>(\d+)\s*<\/\s*(?:td|span)/);
    if (nameM && nameM[1].length > 1) {
      skills.push({
        name: decode(nameM[1]),
        rank: rankM ? parseInt(rankM[1]) : 1,
        desc: ''
      });
    }
  });

  // Try simpler skill image alt fallback
  if (!skills.length) {
    const imgAlts = allMatches(html, /class="[^"]*skill[^"]*"[^>]*alt="([^"]+)"/);
    imgAlts.slice(0, 8).forEach(m => {
      const name = decode(m[1]);
      if (name && name.length > 2) skills.push({ name, rank: 1, desc: '' });
    });
  }

  // Gear — Maxroll guide pages list BiS items
  const gear = [];
  const gearMatches = allMatches(html, /class="[^"]*(?:item|gear)[^"]*name[^"]*"[^>]*>([^<]{3,60})</i);
  const statMatches  = allMatches(html, /class="[^"]*(?:affix|stat)[^"]*"[^>]*>([^<]{3,80})</i);
  gearMatches.slice(0, 13).forEach((m, i) => {
    const name = decode(m[1]).trim();
    if (name && name.length > 2) {
      gear.push({
        slot: ['Helm', 'Chest', 'Gloves', 'Pants', 'Boots', 'Amulet', 'Ring 1', 'Ring 2', 'Weapon', 'Offhand', 'Sword 1', 'Sword 2', 'Axe'][i] || `Slot ${i + 1}`,
        name,
        quality: name.toLowerCase().includes('unique') || name.toLowerCase().includes("'s") ? 'unique' : 'rare',
        stats: statMatches.slice(i * 4, i * 4 + 4).map(s => decode(s[1]).trim()).filter(Boolean)
      });
    }
  });

  // Leveling steps — look for level-gated progression notes
  const levelingSteps = [];
  const levelMatches = allMatches(html, /level\s+(\d+)[^<]{0,200}?([A-Z][^<.]{10,120})/i);
  levelMatches.slice(0, 20).forEach(m => {
    levelingSteps.push({ level: parseInt(m[1]), action: decode(m[2]).trim() });
  });

  // Content types
  const contentTypes = [];
  if (/speed\s*farm/i.test(html))     contentTypes.push('Speed Farm');
  if (/boss\s*killer/i.test(html))    contentTypes.push('Boss Killer');
  if (/pit\s*push/i.test(html))       contentTypes.push('Pit Push');
  if (/leveling/i.test(html))         contentTypes.push('Leveling');
  if (/endgame/i.test(html))          contentTypes.push('Endgame');

  return {
    name: rawName || slugName || 'Maxroll Build',
    cls,
    season,
    source: 'maxroll',
    variants: [{
      name: 'Default',
      skills: skills.slice(0, 10),
      gear,
      paragonBoards: [],
      levelingSteps: levelingSteps.slice(0, 25)
    }],
    skillTreeImage: null,
    contentTypes,
    strengths: [],
    weaknesses: [],
    notes: `Imported from Maxroll.\nSource: ${url}`
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MOBALYTICS SCRAPER
// Uses __NEXT_DATA__ — the full React page state embedded in the HTML
// This contains the complete build data before hydration
// ─────────────────────────────────────────────────────────────────────────
async function scrapeMobalytics(url) {
  const html = await fetchPage(url);

  // Extract __NEXT_DATA__ JSON blob
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (!nextDataMatch) {
    throw new Error('Could not find __NEXT_DATA__ on Mobalytics page. The page structure may have changed.');
  }

  let pageData;
  try {
    pageData = JSON.parse(nextDataMatch[1]);
  } catch(e) {
    throw new Error('Failed to parse Mobalytics page data JSON.');
  }

  // Dig into the Next.js page props — structure varies but build data is usually here:
  // pageData.props.pageProps.build  OR
  // pageData.props.pageProps.initialData.build  OR
  // pageData.props.pageProps.data
  const props = pageData?.props?.pageProps || {};
  const build = props.build || props.initialData?.build || props.data?.build || props.data || null;

  if (!build) {
    // Fall back to HTML scraping if __NEXT_DATA__ doesn't have build key
    return scrapeMobalyticsFromHtml(url, html);
  }

  return parseMobalyticsData(build, url);
}

function parseMobalyticsData(build, url) {
  // Normalize whatever shape Mobalytics uses into our schema
  const name  = build.title || build.name || build.buildName || guessNameFromUrl(url);
  const cls   = normalizeClass(build.class || build.className || build.heroClass || guessClass(url));
  const season = build.season || build.seasonName || '';

  // Variants — Mobalytics calls these "variations" or "variants"
  const rawVariants = build.variants || build.variations || build.buildVariants || [];
  const variants = rawVariants.length
    ? rawVariants.map(v => parseVariant(v))
    : [parseVariant(build)]; // single variant build

  // Content types
  const contentTypes = [];
  const tags = build.tags || build.contentTags || build.playstyleTags || [];
  tags.forEach(t => {
    const label = typeof t === 'string' ? t : t.name || t.label || '';
    if (label) contentTypes.push(label);
  });

  // Strengths / weaknesses
  const strengths = (build.strengths || build.pros || []).map(s => typeof s === 'string' ? s : s.text || s.value || '').filter(Boolean);
  const weaknesses = (build.weaknesses || build.cons || []).map(w => typeof w === 'string' ? w : w.text || w.value || '').filter(Boolean);

  // Notes / overview
  const notes = build.overview || build.description || build.playstyle || `Imported from Mobalytics.\nSource: ${url}`;

  return {
    name,
    cls,
    season,
    source: 'mobalytics',
    variants,
    skillTreeImage: null,
    contentTypes,
    strengths,
    weaknesses,
    notes
  };
}

function parseVariant(v) {
  const name = v.name || v.variantName || v.title || 'Default';

  // Skills
  const rawSkills = v.skills || v.assignedSkills || v.skillSlots || [];
  const skills = rawSkills.map(s => ({
    name:    s.name || s.skillName || s.title || '',
    rank:    s.rank || s.skillRank || s.points || 1,
    maxRank: s.maxRank || s.maxPoints || null,
    desc:    s.description || s.desc || '',
    iconUrl: s.iconUrl || s.icon || s.imageUrl || null
  })).filter(s => s.name);

  // Gear
  const rawGear = v.gear || v.items || v.equipment || [];
  const gear = rawGear.map(item => ({
    slot:    item.slot || item.slotName || item.position || '',
    name:    item.name || item.itemName || '',
    quality: normalizeQuality(item.quality || item.rarity || item.tier || 'rare'),
    stats:   (item.stats || item.affixes || item.mods || []).map(s =>
               typeof s === 'string' ? s : s.name || s.stat || s.text || ''
             ).filter(Boolean)
  })).filter(g => g.name);

  // Paragon
  const rawBoards = v.paragon || v.paragonBoards || v.paragonSetup || [];
  const paragonBoards = rawBoards.map(b => ({
    boardId: slugifyBoardName(b.name || b.boardName || ''),
    guideNodes: (b.nodes || b.selectedNodes || []).map(n => n.id || n.nodeId || '').filter(Boolean),
    unlockedNodes: []
  }));

  // Leveling steps
  const rawSteps = v.levelingGuide || v.levelingSteps || v.progression || [];
  const levelingSteps = rawSteps.map(s => ({
    level:  s.level || s.levelRequired || 0,
    action: s.action || s.text || s.description || ''
  })).filter(s => s.action);

  return { name, skills, gear, paragonBoards, levelingSteps };
}

// Fallback if __NEXT_DATA__ doesn't contain build key — parse raw HTML
function scrapeMobalyticsFromHtml(url, html) {
  const slug = (url.match(/builds\/([^/?#]+)/) || [])[1] || '';
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cls  = guessClass(url) || guessClass(html.slice(0, 5000)) || 'Necromancer';

  // Try to grab skill names from alt text on skill images
  const skillImgs = allMatches(html, /cdn\.mobalytics\.gg[^"]*\/skills\/([^"]+)\.(?:png|webp)/);
  const skills = skillImgs.slice(0, 8).map(m => ({
    name: m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    rank: 1,
    desc: '',
    iconUrl: null
  }));

  // Content type tags
  const contentTypes = [];
  if (/speed\s*farm/i.test(html))     contentTypes.push('Speed Farm');
  if (/boss\s*kill/i.test(html))      contentTypes.push('Boss Killer');
  if (/pit\s*push/i.test(html))       contentTypes.push('Pit Push');
  if (/infernal\s*horde/i.test(html)) contentTypes.push('Infernal Hordes');

  // Variant names from tab text
  const variantMatches = allMatches(html, /class="[^"]*variant[^"]*tab[^"]*"[^>]*>([^<]{2,30})</i);
  const variantNames = [...new Set(variantMatches.map(m => decode(m[1]).trim()).filter(v => v.length > 1))];

  const variants = variantNames.length
    ? variantNames.map(n => ({ name: n, skills: n === variantNames[0] ? skills : [], gear: [], paragonBoards: [], levelingSteps: [] }))
    : [{ name: 'Default', skills, gear: [], paragonBoards: [], levelingSteps: [] }];

  return {
    name,
    cls,
    season: '',
    source: 'mobalytics',
    variants,
    skillTreeImage: null,
    contentTypes,
    strengths: [],
    weaknesses: [],
    notes: `Imported from Mobalytics (HTML fallback).\nSource: ${url}\n\nSome data may be incomplete — Mobalytics uses JavaScript rendering. Add missing details manually.`
  };
}

// ─────────────────────────────────────────────────────────────────────────
// NORMALIZE HELPERS
// ─────────────────────────────────────────────────────────────────────────
function normalizeClass(raw) {
  if (!raw) return 'Necromancer';
  const r = raw.toLowerCase();
  if (r.includes('barb'))    return 'Barbarian';
  if (r.includes('druid'))   return 'Druid';
  if (r.includes('necro'))   return 'Necromancer';
  if (r.includes('rogue'))   return 'Rogue';
  if (r.includes('sorc'))    return 'Sorcerer';
  if (r.includes('spirit'))  return 'Spiritborn';
  if (r.includes('paladin')) return 'Paladin';
  return raw;
}

function normalizeQuality(raw) {
  if (!raw) return 'rare';
  const r = raw.toLowerCase();
  if (r.includes('mythic'))    return 'mythic';
  if (r.includes('unique'))    return 'unique';
  if (r.includes('ancestral')) return 'ancestral';
  if (r.includes('sacred'))    return 'sacred';
  return 'rare';
}

function slugifyBoardName(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function guessNameFromUrl(url) {
  const slug = (url.match(/builds\/([^/?#]+)/) || [])[1] || '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Mobalytics Build';
}
