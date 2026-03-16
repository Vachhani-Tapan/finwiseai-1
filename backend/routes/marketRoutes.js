import express from 'express';

const router = express.Router();

// ─── Simple in-memory cache (key → { data, timestamp }) ─────────────────────
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leak – cap at 200 entries
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// Helper: fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MUTUAL FUNDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/market/mf/search?q=sbi
 * @desc Search mutual fund schemes by name
 */
router.get('/mf/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const cacheKey = `mf-search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    const response = await fetchWithTimeout(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    setCache(cacheKey, data);
    res.status(200).json(data);
  } catch (error) {
    console.error('MF search error:', error.name === 'AbortError' ? 'Request timed out' : error);
    res.status(500).json({ error: 'Failed to search mutual funds' });
  }
});

/**
 * @route GET /api/market/mf/:schemeCode
 * @desc Get NAV history for a specific mutual fund
 */
router.get('/mf/:schemeCode', async (req, res) => {
  try {
    const { schemeCode } = req.params;
    const response = await fetchWithTimeout(`https://api.mfapi.in/mf/${schemeCode}`, {}, 15000);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('MF data error:', error);
    res.status(500).json({ error: 'Failed to fetch mutual fund data' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STOCKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @route GET /api/market/stock/search?q=tata
 * @desc Search stocks by company name using Yahoo Finance autocomplete
 */
router.get('/stock/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const cacheKey = `stock-search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Try query2 first (faster), fallback to query1
    let data;
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0&listsCount=0&quotesQueryId=tss_match_phrase_query`;
      const response = await fetchWithTimeout(url, { headers: YAHOO_HEADERS }, 6000);
      data = await response.json();
    } catch (err) {
      console.log('query2 failed, trying query1...', err.message);
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0&listsCount=0&quotesQueryId=tss_match_phrase_query`;
      const response = await fetchWithTimeout(url, { headers: YAHOO_HEADERS }, 8000);
      data = await response.json();
    }

    // Filter to equity results, prioritize Indian exchanges
    const quotes = (data.quotes || [])
      .filter((q) => q.quoteType === 'EQUITY')
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
        exchDisp: q.exchDisp,
      }));

    setCache(cacheKey, quotes);
    res.status(200).json(quotes);
  } catch (error) {
    console.error('Stock search error:', error.name === 'AbortError' ? 'Request timed out' : error);
    res.status(500).json({ error: 'Failed to search stocks. Please try again.' });
  }
});

/**
 * @route GET /api/market/stock/:symbol
 * @desc Proxy Yahoo Finance chart data (bypasses CORS)
 */
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1y', interval = '1d' } = req.query;

    const cacheKey = `stock-chart:${symbol}:${range}:${interval}`;
    const cached = getCached(cacheKey);
    if (cached) return res.status(200).json(cached);

    let data;
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const response = await fetchWithTimeout(url, { headers: YAHOO_HEADERS }, 8000);
      data = await response.json();
    } catch (err) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const response = await fetchWithTimeout(url, { headers: YAHOO_HEADERS }, 10000);
      data = await response.json();
    }

    setCache(cacheKey, data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Stock data error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

export default router;
