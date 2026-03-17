module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const html = await response.text();
  
  // Return the first 3000 chars so we can see what structure they're using
  return res.status(200).json({
    status: response.status,
    hasNextData: html.includes('__NEXT_DATA__'),
    hasNuxtData: html.includes('__NUXT__'),
    hasWindowData: html.includes('window.__'),
    first3000: html.slice(0, 3000),
    scriptTags: (html.match(/<script[^>]*>/g) || []).slice(0, 10)
  });
};
