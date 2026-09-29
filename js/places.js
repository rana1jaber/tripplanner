/* =========================================================
   Places: search destinations, find hotels & attractions
   (OpenStreetMap / Nominatim) and their photos (Wikidata / Wikimedia Commons).
   ========================================================= */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const SUGG = {}; // loaded suggestions per destination: { status, hotels, spots }

let netQueue = Promise.resolve(); // one request at a time (be polite to the free servers)
const enqueue = (fn) => { const p = netQueue.then(fn, fn); netQueue = p.catch(() => {}); return p; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, opts = {}, ms = 30000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  if (opts.signal) opts.signal.addEventListener('abort', () => ac.abort());
  try {
    const r = await fetch(url, { ...opts, signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/* ---- Destination search (autocomplete) ---- */
async function geocode(q, signal) {
  const url = `${NOMINATIM}?format=jsonv2&limit=8&accept-language=${lang}&q=${encodeURIComponent(q)}`;
  const seen = new Set();
  return (await fetchJSON(url, { signal }, 12000))
    .filter((r) => ['place', 'boundary'].includes(r.category))
    .filter((r) => !seen.has(r.display_name) && seen.add(r.display_name))
    .slice(0, 5);
}
function placeFromResult(r) {
  const parts = r.display_name.split(',').map((s) => s.trim());
  return {
    name: r.name || parts[0],
    sub: parts.slice(1).join(lang === 'ar' ? '، ' : ', '),
    lat: +r.lat, lon: +r.lon, osm: `${r.osm_type}/${r.osm_id}`,
    bbox: r.boundingbox.map(Number), // [south, north, west, east]
  };
}

/* ---- Hotels & attractions: search inside the destination's area ---- */
function viewboxFor(d) {
  const [south, north, west, east] = d.bbox || [d.lat - 0.15, d.lat + 0.15, d.lon - 0.15, d.lon + 0.15];
  return `${west},${north},${east},${south}`;
}
async function searchIn(d, q) {
  const url = `${NOMINATIM}?format=jsonv2&limit=40&bounded=1&extratags=1&namedetails=1&viewbox=${viewboxFor(d)}&q=${encodeURIComponent(q)}`;
  const res = await fetchJSON(url, {}, 15000);
  await sleep(1100); // Nominatim's rule: at most one request per second
  return res;
}
const HOTEL_TYPES = ['hotel', 'hostel', 'guest_house', 'motel', 'apartment', 'chalet'];
const SPOT_QUERIES = [ // [search word, how many to keep, which results count]
  ['attraction', 5, (c, t) => (c === 'tourism' && (t === 'attraction' || t === 'viewpoint')) || c === 'historic'],
  ['museum', 3, (c, t) => c === 'tourism' && (t === 'museum' || t === 'gallery')],
  ['beach', 2, (c, t) => (c === 'natural' && t === 'beach') || (c === 'leisure' && t === 'beach_resort')],
  ['mall', 2, (c, t) => c === 'shop' && t === 'mall'],
  ['park', 2, (c, t) => c === 'leisure' && (t === 'park' || t === 'garden')],
  ['theme park', 1, (c, t) => c === 'tourism' && t === 'theme_park'],
  ['zoo', 1, (c, t) => c === 'tourism' && (t === 'zoo' || t === 'aquarium')],
];
// OpenStreetMap has some junk entries (people's names, shops) wrongly tagged as attractions
const JUNK = /\b(company|trading|contracting|bank|home)\b|شركة|مؤسسة|مقاولات|للحدادة/i;
const hasWiki = (r) => !!(r.extratags && (r.extratags.wikidata || r.extratags.wikipedia));
const plausible = (r) => {
  const n = ((r.namedetails || {}).name || r.name || '').trim();
  return hasWiki(r) || (n.length >= 3 && !/^[a-z0-9 .,'@&-]+$/.test(n) && !JUNK.test(n));
};
const typeOf = (c, t) => (TYPES[t] ? t : c === 'historic' ? 'archaeological_site' : t === 'beach_resort' ? 'beach' : t === 'garden' ? 'park' : 'attraction');
function toItem(r, extra) {
  const nd = r.namedetails || {}, et = r.extratags || {};
  const base = nd.name || r.name;
  const website = et.website || et['contact:website'] || '';
  return {
    id: r.osm_type[0] + r.osm_id,
    names: { en: nd['name:en'] || base, ar: nd['name:ar'] || base },
    score: (r.importance || 0) + (et.wikidata ? 0.5 : 0),
    website: /^https?:\/\//.test(website) ? website : '',
    lat: +r.lat, lon: +r.lon,
    wd: /^Q\d+$/.test(et.wikidata || '') ? et.wikidata : '',
    ...extra,
  };
}
// Calls onHotels() as soon as hotels arrive, then returns hotels + attractions
async function searchPlaces(d, onHotels) {
  const seen = new Set();
  const fresh = (r) => { const n = ((r.namedetails || {}).name || r.name || '').toLowerCase(); if (!n || seen.has(n)) return false; seen.add(n); return true; };
  const hotels = (await searchIn(d, 'hotel'))
    .filter((r) => r.category === 'tourism' && HOTEL_TYPES.includes(r.type) && fresh(r))
    .map((r) => toItem(r, { stars: Math.min(5, parseInt((r.extratags || {}).stars, 10) || 0) }))
    .sort((a, b) => b.score + b.stars * 0.2 - (a.score + a.stars * 0.2))
    .slice(0, 8);
  onHotels(hotels);
  const spots = [];
  for (const [q, keep, match] of SPOT_QUERIES) {
    let rs = [];
    try { rs = await searchIn(d, q); } catch (e) { continue; } // one failed category doesn't stop the others
    rs.filter((r) => match(r.category, r.type) && plausible(r))
      .sort((a, b) => hasWiki(b) - hasWiki(a)) // well-known places (with a Wikipedia page) first
      .filter(fresh).slice(0, keep)
      .forEach((r) => spots.push(toItem(r, { type: typeOf(r.category, r.type) })));
  }
  return { hotels, spots };
}

/* ---- Photos: the Wikidata "image" of each well-known place ---- */
async function addPhotos(items) {
  const ids = [...new Set(items.filter((i) => i.wd && !i.img).map((i) => i.wd))].slice(0, 40);
  if (!ids.length) return;
  const q = `SELECT ?item ?img WHERE { VALUES ?item { ${ids.map((id) => 'wd:' + id).join(' ')} } ?item wdt:P18 ?img }`;
  try {
    const res = await fetchJSON(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`, {}, 15000);
    const imgs = {};
    for (const b of res.results.bindings) {
      const id = b.item.value.split('/').pop();
      if (!imgs[id]) imgs[id] = b.img.value.replace(/^http:/, 'https:') + '?width=480';
    }
    items.forEach((i) => { if (imgs[i.wd]) i.img = imgs[i.wd]; });
  } catch (e) { /* no photos this time — the colored card is shown instead */ }
}

/* ---- Suggestions per destination (cached on this device) ---- */
const suggKey = (d) => d.osm || 'q:' + d.name.trim().toLowerCase();
const suggFor = (d) => SUGG[suggKey(d)] || { status: 'idle', hotels: [], spots: [] };
const customFor = (d) => (trip.custom[d.id] = trip.custom[d.id] || { hotels: [], spots: [] });
const hotelsFor = (d) => [...suggFor(d).hotels, ...customFor(d).hotels];
const spotsFor = (d) => [...suggFor(d).spots, ...customFor(d).spots];

function loadSugg(d, force) {
  if (!d.name.trim()) return;
  const key0 = suggKey(d);
  const cur = SUGG[key0];
  // Already loading, loaded, or failed → don't start again (a failure is retried only by the "Try again" button)
  if (cur && (cur.status === 'loading' || !force)) return;
  if (!force && !cur) {
    try {
      const cached = JSON.parse(store.get('sugg3_' + key0));
      if (cached) { SUGG[key0] = { status: 'ok', ...cached }; return; }
    } catch (e) {}
  }
  SUGG[key0] = { status: 'loading', hotels: [], spots: [] };
  enqueue(async () => {
    let result;
    try {
      if (d.lat == null) { // typed without picking from the list: look it up now
        const [r] = await geocode(d.name);
        if (!r) throw new Error('place not found');
        const p = placeFromResult(r);
        const fill = (x) => Object.assign(x, { lat: p.lat, lon: p.lon, osm: p.osm, bbox: p.bbox, sub: x.sub || p.sub });
        fill(d);
        // The trip may have been refreshed from the database meanwhile — update the current copy too
        const now = trip && trip.dests.find((x) => x.id === d.id);
        if (now && now !== d) fill(now);
        SUGG[suggKey(d)] = SUGG[key0]; // same request under the new key, so it isn't started twice
        if (trip) { save(); if (isAdmin()) pushCore(); } // share the location with everyone
      }
      const res = await searchPlaces(d, (hotels) => {
        // show hotels right away while attractions keep loading
        SUGG[key0] = SUGG[suggKey(d)] = { status: 'loading', hotels, spots: [] };
        onSuggUpdate();
      });
      await addPhotos([...res.hotels, ...res.spots]);
      result = { status: 'ok', ...res };
      store.set('sugg3_' + suggKey(d), JSON.stringify(res));
    } catch (e) {
      result = { status: 'error', hotels: [], spots: [] };
    }
    SUGG[key0] = SUGG[suggKey(d)] = result;
    onSuggUpdate();
  });
}
const loadAllSugg = () => trip.dests.forEach((d) => loadSugg(d));
const onSuggUpdate = () => { if (step === 3 || step === 4) refreshView(); };
