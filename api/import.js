// api/import.js — Vercel serverless function
// D4Builds + Maxroll: plain fetch + HTML parse
// Mobalytics: Browserless.io headless rendering

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    let result;
    if (url.includes('d4builds.gg'))        result = await scrapeD4Builds(url);
    else if (url.includes('maxroll.gg'))    result = await scrapeMaxroll(url);
    else if (url.includes('mobalytics.gg')) result = await scrapeMobalytics(url);
    else return res.status(400).json({ error: 'Unsupported site' });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Import error:', err);
    return res.status(500).json({ error: err.message || 'Scrape failed' });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
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

async function fetchWithBrowser(url) {
  const key = process.env.BROWSERLESS_KEY;
  if (!key) throw new Error('BROWSERLESS_KEY environment variable not set');

  const res = await fetch(`https://chrome.browserless.io/content?token=${key}&waitUntil=networkidle2&timeout=30000`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserless error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.text();
}

function allMatches(html, re) {
  const results = [];
  let m;
  const g = new RegExp(re.source, 'gi');
  while ((m = g.exec(html)) !== null) results.push(m);
  return results;
}

function decode(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function guessClass(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('barbarian') || t.includes('barb')) return 'Barbarian';
  if (t.includes('druid'))    return 'Druid';
  if (t.includes('necromancer') || t.includes('necro')) return 'Necromancer';
  if (t.includes('rogue'))    return 'Rogue';
  if (t.includes('sorcerer') || t.includes('sorc')) return 'Sorcerer';
  if (t.includes('spiritborn') || t.includes('spirit')) return 'Spiritborn';
  if (t.includes('paladin'))  return 'Paladin';
  return null;
}

function normalizeClass(raw) {
  return guessClass(raw) || raw || 'Necromancer';
}

function normalizeQuality(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('mythic'))    return 'mythic';
  if (n.includes('unique'))    return 'unique';
  if (n.includes('ancestral')) return 'ancestral';
  if (n.includes('sacred'))    return 'sacred';
  return 'rare';
}

function guessNameFromUrl(url) {
  const slug = (url.match(/builds\/([^/?#]+)/) || [])[1] || '';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Build';
}

// ─────────────────────────────────────────────────────────────────────────
// D4BUILDS SCRAPER
// ─────────────────────────────────────────────────────────────────────────
async function scrapeD4Builds(url) {
  const html = await fetchPage(url);

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const rawTitle = titleMatch
    ? titleMatch[1].replace('· D4 Builds', '').replace('Diablo 4', '').replace('Custom Build', '').trim()
    : null;

  const cls = guessClass(html.slice(0, 8000)) || guessClass(url) || 'Necromancer';
  const seasonMatch = html.match(/Season\s+(\d+)/i);
  const season = seasonMatch ? `Season ${seasonMatch[1]}` : '';

  const skillMatches = allMatches(html, /data-skill-name="([^"]+)"[^>]*data-rank="(\d+)"/);
  const skills = skillMatches.map(m => ({
    name: decode(m[1]), rank: parseInt(m[2]) || 1, desc: ''
  }));

  const gearItemMatches = allMatches(html, /class="[^"]*item-name[^"]*"[^>]*>([^<]+)</i);
  const slots = ['Helm','Chest','Gloves','Pants','Boots','Amulet','Ring 1','Ring 2','Weapon','Offhand'];
  const gear = gearItemMatches.slice(0, 10).map((m, i) => ({
    slot: slots[i] || `Slot ${i + 1}`,
    name: decode(m[1]).trim(),
    quality: 'rare',
    stats: []
  })).filter(g => g.name && g.name.length > 1);

  return {
    name: rawTitle || 'D4Builds Build',
    cls,
    season,
    source: 'd4builds',
    variants: [{ name: 'Default', skills, gear, paragonBoards: [], levelingSteps: [] }],
    skillTreeImage: null,
    contentTypes: [],
    strengths: [],
    weaknesses: [],
    notes: `Imported from D4Builds.\nSource: ${url}`
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MAXROLL SCRAPER
// ─────────────────────────────────────────────────────────────────────────
async function scrapeMaxroll(url) {
  const isGuide = url.includes('build-guides');
  if (!isGuide) {
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
      notes: `Maxroll planner URLs encode data in the URL hash which requires client-side decoding.\nFor better results use the build guide URL (maxroll.gg/d4/build-guides/...) instead.\nSource: ${url}`
    };
  }

  const html = await fetchPage(url);

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const slug = (url.match(/build-guides\/([^/?#]+)/) || [])[1] || '';
  const slugName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const rawName = h1Match ? decode(h1Match[1]) : slugName;

  const cls = guessClass(html.slice(0, 8000)) || guessClass(url) || 'Necromancer';
  const seasonMatch = html.match(/Season\s+(\d+)/i);
  const season = seasonMatch ? `Season ${seasonMatch[1]}` : '';

  const skills = [];
  const skillImgMatches = allMatches(html, /class="[^"]*skill[^"]*"[^>]*alt="([^"]+)"/);
  skillImgMatches.slice(0, 8).forEach(m => {
    const name = decode(m[1]);
    if (name && name.length > 2) skills.push({ name, rank: 1, desc: '' });
  });

  const gearMatches = allMatches(html, /class="[^"]*item[^"]*name[^"]*"[^>]*>([^<]{3,60})</i);
  const slots = ['Helm','Chest','Gloves','Pants','Boots','Amulet','Ring 1','Ring 2','Weapon','Offhand','Sword 1','Sword 2','Axe'];
  const gear = gearMatches.slice(0, 13).map((m, i) => ({
    slot: slots[i] || `Slot ${i + 1}`,
    name: decode(m[1]).trim(),
    quality: 'rare',
    stats: []
  })).filter(g => g.name && g.name.length > 2);

  const contentTypes = [];
  if (/speed\s*farm/i.test(html))  contentTypes.push('Speed Farm');
  if (/boss\s*killer/i.test(html)) contentTypes.push('Boss Killer');
  if (/pit\s*push/i.test(html))    contentTypes.push('Pit Push');
  if (/leveling/i.test(html))      contentTypes.push('Leveling');
  if (/endgame/i.test(html))       contentTypes.push('Endgame');

  return {
    name: rawName || 'Maxroll Build',
    cls,
    season,
    source: 'maxroll',
    variants: [{ name: 'Default', skills, gear, paragonBoards: [], levelingSteps: [] }],
    skillTreeImage: null,
    contentTypes,
    strengths: [],
    weaknesses: [],
    notes: `Imported from Maxroll.\nSource: ${url}`
  };
}

// ─────────────────────────────────────────────────────────────────────────
// MOBALYTICS SCRAPER — Browserless renders the full JS page
// ─────────────────────────────────────────────────────────────────────────
async function scrapeMobalytics(url) {
  const html = await fetchWithBrowser(url);

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch
    ? titleMatch[1]
        .replace('Diablo 4 Build', '')
        .replace('Build Guide', '')
        .replace('| Mobalytics', '')
        .trim()
    : guessNameFromUrl(url);

  const cls = normalizeClass(guessClass(html.slice(0, 10000)) || guessClass(url));
  const seasonMatch = html.match(/Season\s+(\d+)/i);
  const season = seasonMatch ? `Season ${seasonMatch[1]}` : '';

  // Skills from assigned skill slots
  const skills = [];
  const skillMatches = allMatches(html, /assets\/diablo-4\/images\/skills\/([^"'.]+)\.(?:png|webp|jpg)/i);
  const seen = new Set();
  skillMatches.forEach(m => {
    const name = m[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (!seen.has(name) && name.length > 2) {
      seen.add(name);
      skills.push({ name, rank: 1, desc: '' });
    }
  });

  // Variant tab names
  const variantMatches = allMatches(html, /class="[^"]*variant[^"]*tab[^"]*"[^>]*>\s*([^<]{2,30})\s*</i);
  const variantNames = [...new Set(
    variantMatches.map(m => decode(m[1]).trim()).filter(v => v.length > 1 && v.length < 30)
  )];

  // Gear
  const gear = [];
  const gearMatches = allMatches(html, /class="[^"]*item[^"]*name[^"]*"[^>]*>([^<]{3,60})</i);
  const slotMatches = allMatches(html, /class="[^"]*slot[^"]*label[^"]*"[^>]*>([^<]{2,20})</i);
  gearMatches.slice(0, 13).forEach((m, i) => {
    const name = decode(m[1]).trim();
    if (name && name.length > 2) {
      gear.push({
        slot: slotMatches[i] ? decode(slotMatches[i][1]).trim() : `Slot ${i + 1}`,
        name,
        quality: normalizeQuality(name),
        stats: []
      });
    }
  });

  // Content types
  const contentTypes = [];
  if (/speed\s*farm/i.test(html))     contentTypes.push('Speed Farm');
  if (/boss\s*kill/i.test(html))      contentTypes.push('Boss Killer');
  if (/pit\s*push/i.test(html))       contentTypes.push('Pit Push');
  if (/infernal\s*horde/i.test(html)) contentTypes.push('Infernal Hordes');
  if (/dungeon\s*push/i.test(html))   contentTypes.push('Dungeon Push');

  // Strengths / weaknesses
  const strengths = [];
  const weaknesses = [];
  allMatches(html, /class="[^"]*strength[^"]*item[^"]*"[^>]*>([^<]{5,100})</i)
    .forEach(m => strengths.push(decode(m[1]).trim()));
  allMatches(html, /class="[^"]*weakness[^"]*item[^"]*"[^>]*>([^<]{5,100})</i)
    .forEach(m => weaknesses.push(decode(m[1]).trim()));

  // Notes
  const overviewMatch = html.match(/class="[^"]*overview[^"]*"[^>]*>([\s\S]{20,800}?)<\/(?:p|div)/i);
  const notes = overviewMatch
    ? decode(overviewMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    : `Imported from Mobalytics.\nSource: ${url}`;

  const variants = variantNames.length
    ? variantNames.map((name, i) => ({
        name,
        skills: i === 0 ? skills : [],
        gear: i === 0 ? gear : [],
        paragonBoards: [],
        levelingSteps: []
      }))
    : [{ name: 'Default', skills, gear, paragonBoards: [], levelingSteps: [] }];

  return {
    name: rawTitle || guessNameFromUrl(url),
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
