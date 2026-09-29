/* =========================================================
   Shared database (Firebase Realtime Database REST API)
   + live updates + invite links.
   ========================================================= */
async function db(method, path, body) {
  const r = await fetch(`${DB_URL}/trips/${path}.json`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error('DB ' + r.status);
  return r.json();
}
const dbSafe = (...a) => (ONLINE ? db(...a).catch(() => toast(t('sync_error'))) : Promise.resolve());

// Fields only the organizer changes
const CORE = ['name', 'admin', 'start', 'end', 'travelers', 'currency', 'mode', 'hotelMode', 'dests', 'budget', 'deadline', 'created'];
const coreOf = () => Object.fromEntries(CORE.map((k) => [k, trip[k] ?? null]));

// Local shape → database shape (lists become objects keyed by id, so people never overwrite each other)
const byId = (list) => Object.fromEntries(list.map(({ id, ...x }) => [id, x]));
function toRemote() {
  const custom = {};
  for (const [did, c] of Object.entries(trip.custom)) {
    custom[did] = { hotels: Object.fromEntries(c.hotels.map((h) => [h.id, h])), spots: Object.fromEntries(c.spots.map((s) => [s.id, s])) };
  }
  const comments = {};
  for (const [itemId, list] of Object.entries(trip.comments)) comments[itemId] = byId(list);
  return { ...coreOf(), members: byId(trip.members), votes: trip.votes, custom, comments, expenses: byId(trip.expenses) };
}
// Database shape → local shape
function fromRemote(data) {
  const byTime = (a, b) => (a.at || 0) - (b.at || 0);
  const withIds = (o) => Object.entries(o || {}).map(([id, x]) => ({ ...x, id })).sort(byTime);
  const tr = { ...data, id: trip && trip.id };
  tr.members = withIds(data.members).sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0));
  tr.votes = {};
  for (const [id, v] of Object.entries(data.votes || {})) {
    const fix = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, x]) => [k, arr(x)]));
    tr.votes[id] = { hotels: fix(v.hotels), spots: fix(v.spots) };
  }
  tr.custom = {};
  for (const [did, c] of Object.entries(data.custom || {})) tr.custom[did] = { hotels: arr(c.hotels).sort(byTime), spots: arr(c.spots).sort(byTime) };
  tr.comments = {};
  for (const [itemId, list] of Object.entries(data.comments || {})) tr.comments[itemId] = withIds(list);
  tr.expenses = withIds(data.expenses);
  return normalize(tr);
}

let coreTimer;
function pushCore() { // organizer's edits (dates, destinations, budget, deadline…) — debounced while typing
  if (!ONLINE || !trip.created) return;
  clearTimeout(coreTimer);
  const id = trip.id, core = coreOf();
  coreTimer = setTimeout(() => dbSafe('PATCH', id, core), 500);
}
const pushMember = (m) => dbSafe('PUT', `${trip.id}/members/${m.id}`, { name: m.name, role: m.role, at: m.at });
const pushVote = () => dbSafe('PUT', `${trip.id}/votes/${me}`, myVote());
const pushCustom = (destId, kind, item) => dbSafe('PUT', `${trip.id}/custom/${destId}/${kind}/${item.id}`, item);
const pushComment = (itemId, c) => dbSafe('PUT', `${trip.id}/comments/${itemId}/${c.id}`, { by: c.by, text: c.text, at: c.at });
const pushExpense = (e) => dbSafe('PUT', `${trip.id}/expenses/${e.id}`, { desc: e.desc, amount: e.amount, by: e.by, at: e.at });
const deleteExpense = (id) => dbSafe('DELETE', `${trip.id}/expenses/${id}`);

// Live updates: Firebase streams every change to the trip
let stream = null, pullTimer;
function subscribe() {
  if (!ONLINE || !trip || !trip.created) return;
  if (stream && stream.tripId === trip.id) return;
  if (stream) stream.close();
  stream = new EventSource(`${DB_URL}/trips/${trip.id}.json`);
  stream.tripId = trip.id;
  const changed = () => { clearTimeout(pullTimer); pullTimer = setTimeout(pull, 250); };
  stream.addEventListener('put', changed);
  stream.addEventListener('patch', changed);
}
async function pull() {
  if (!trip) return;
  const id = trip.id;
  try {
    const data = await db('GET', id);
    if (!data || !trip || trip.id !== id) return; // the user switched trips meanwhile
    trip = fromRemote(data);
    save();
    if (onModalRefresh && !$('#modal').hidden) onModalRefresh();
    refreshView();
  } catch (e) { /* offline for a moment — the stream reconnects by itself */ }
}

// Re-render the open page after new data arrives (keeps what the user is typing)
function refreshView() {
  if (!trip || $('#wizard').hidden || step === 1) return; // never re-render the form the organizer is editing
  if (!$('#modal').hidden) return;
  const a = document.activeElement;
  const id = a && a.id, val = a && a.value;
  goStep(step, true);
  const el = id && document.getElementById(id);
  if (el && 'value' in el) { el.value = val; el.focus(); }
}

/* ---------- Invite link ---------- */
// Online: the link only carries the trip id. Offline: the trip details are packed into the link.
function encodeTrip() {
  const bytes = new TextEncoder().encode(JSON.stringify({ id: trip.id, ...coreOf(), custom: trip.custom }));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return encodeURIComponent(btoa(bin));
}
function decodeTrip(str) {
  const bin = atob(decodeURIComponent(str));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}
const inviteLink = () => location.href.split('#')[0] + '#join=' + (ONLINE ? trip.id : encodeTrip());

function mergeCustom(a = {}, b = {}) {
  const out = JSON.parse(JSON.stringify(a));
  for (const [k, v] of Object.entries(b)) {
    out[k] = out[k] || { hotels: [], spots: [] };
    for (const ty of ['hotels', 'spots']) (v[ty] || []).forEach((it) => { if (!out[k][ty].some((x) => x.id === it.id)) out[k][ty].push(it); });
  }
  return out;
}
