/* =========================================================
   Core: constants, app state, small helpers, saving on this device,
   language & dark mode.
   ========================================================= */
const ONLINE = /^https:\/\//.test(FIREBASE_URL);
const DB_URL = FIREBASE_URL.replace(/\/+$/, '');

/* ---------- Constants ---------- */
const TYPES = { // [English, Arabic, emoji]
  attraction: ['Attraction', 'معلم سياحي', '⭐'], museum: ['Museum', 'متحف', '🏛️'], theme_park: ['Theme park', 'مدينة ملاهي', '🎢'],
  zoo: ['Zoo', 'حديقة حيوان', '🦁'], aquarium: ['Aquarium', 'أكواريوم', '🐠'], gallery: ['Art gallery', 'معرض فني', '🖼️'],
  viewpoint: ['Viewpoint', 'إطلالة', '🌄'], castle: ['Castle', 'قلعة', '🏰'], fort: ['Fort', 'حصن', '🏰'],
  monument: ['Monument', 'نصب تذكاري', '🗿'], archaeological_site: ['Historic site', 'موقع أثري', '🏺'],
  mall: ['Mall', 'مول', '🛍️'], beach: ['Beach', 'شاطئ', '🏖️'], park: ['Park', 'حديقة', '🌳'], custom: ['Suggested', 'مقترح', '📍'],
};
const CURRENCIES = {
  USD: { rate: 1, sym: ['$', '$'] }, SAR: { rate: 3.75, sym: ['SAR ', 'ر.س '] }, AED: { rate: 3.67, sym: ['AED ', 'د.إ '] },
  QAR: { rate: 3.64, sym: ['QAR ', 'ر.ق '] }, BHD: { rate: 0.376, sym: ['BHD ', 'د.ب '] }, KWD: { rate: 0.307, sym: ['KWD ', 'د.ك '] },
  EUR: { rate: 0.92, sym: ['€', '€'] }, GBP: { rate: 0.79, sym: ['£', '£'] },
};
const BUDGET_USD = { hotel: 120, transport: 150, activity: 20, food: 35 }; // starting estimates, editable
const HOTEL_ICONS = ['🏨', '🏩', '🏛️', '🏰'];
const AV_COLORS = ['#2f6b57', '#c7794a', '#6c63b5', '#c0567a', '#3c86a8', '#8a9a3b'];
const DAY_COLORS = ['#e4572e', '#2e86ab', '#8f2d56', '#3bb273', '#f0a202', '#7768ae', '#1b998b', '#c33c54'];

/* ---------- App state ---------- */
let trip = null;   // the trip being viewed
let step = 1;      // current wizard step (1 plan, 2 invite, 3 vote, 4 itinerary)
let me = null;     // my member id in this trip
let cityTab = 0;   // destination shown on the voting page

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const arr = (x) => (Array.isArray(x) ? x.filter((v) => v != null) : x ? Object.values(x) : []);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
};

// Dates: "YYYY-MM-DD" is read as a local date (new Date("2026-10-01") is UTC and can shift a day)
const parseDate = (v) => {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); }
  return new Date(v);
};
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (date, n) => { const d = parseDate(date); d.setDate(d.getDate() + n); return d; };
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const totalDays = () => trip.dests.reduce((n, d) => n + d.days, 0);
const tripDays = () => daysBetween(trip.start, trip.end) + 1;       // days between start and end (inclusive)
const endDate = () => parseDate(trip.end);
const nightsIn = (i) => trip.dests[i].days - (i === trip.dests.length - 1 ? 1 : 0); // no hotel on the final day
const totalNights = () => totalDays() - 1;
const locale = () => (lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US');
const fmt = (d) => parseDate(d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
const fmtLong = (d) => parseDate(d).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
const fmtHijri = (d) => {
  try {
    return parseDate(d).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura',
      { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return ''; }
};

const sym = () => CURRENCIES[trip.currency].sym[li()];
const money = (v) => sym() + Math.round(v).toLocaleString('en');
const roundNice = (x) => (x >= 20 ? Math.round(x) : Math.round(x * 10) / 10);
const avColor = (name) => AV_COLORS[[...(name || '?')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV_COLORS.length];
const hue = (s) => [...(s || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
const destGrad = (d, a = 135) => { const h = hue(d.name.trim().toLowerCase()); return `linear-gradient(${a}deg, hsl(${h} 42% 52%), hsl(${(h + 40) % 360} 58% 76%))`; };
const itemName = (it) => (it.names ? it.names[lang] || it.names.en : it.name);
const mapLink = (it, d) => (it.lat != null
  ? `https://www.google.com/maps/search/?api=1&query=${it.lat},${it.lon}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(itemName(it) + ', ' + d.name)}`);
const memberName = (id) => trip.members.find((m) => m.id === id)?.name || '?';
const meMember = () => trip && trip.members.find((m) => m.id === me);
const isAdmin = () => !trip.created || meMember()?.role === 'admin';

// Split the trip days evenly between destinations (extra days go to the first ones)
function distributeDays() {
  const n = trip.dests.length, T = tripDays();
  if (!n) return;
  const base = Math.floor(T / n), extra = T % n;
  trip.dests.forEach((d, i) => (d.days = Math.max(1, base + (i < extra ? 1 : 0))));
}

/* ---------- Toast & modal ---------- */
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}
let onModalClose = null;   // e.g. removes a map when the modal closes
let onModalRefresh = null; // e.g. redraws comments when new data arrives
function openModal(html, wide) {
  closeModal();
  $('#modalBody').innerHTML = html;
  $('.modal-box').classList.toggle('wide', !!wide);
  $('#modal').hidden = false;
}
function closeModal() {
  $('#modal').hidden = true;
  if (onModalClose) { const f = onModalClose; onModalClose = null; f(); }
  onModalRefresh = null;
}

/* ---------- Saving on this device ---------- */
function save() {
  store.set('trip_' + trip.id, JSON.stringify(trip));
  store.set('lastTrip', trip.id);
  if (me) store.set('me_' + trip.id, me);
}
function loadTrip(id) {
  try { return normalize(JSON.parse(store.get('trip_' + id))); } catch (e) { return null; }
}
// Fills in anything missing (also makes trips saved by older versions work)
function normalize(tr) {
  if (!tr) return null;
  tr.dests = arr(tr.dests).map((d) => ({ ...d, id: d.id || uid(), name: d.name || d.city || '', days: d.days || 1, bbox: d.bbox ? arr(d.bbox) : undefined }));
  if (!tr.end) tr.end = toISO(addDays(tr.start, Math.max(1, tr.dests.reduce((n, d) => n + d.days, 0)) - 1));
  tr.custom = tr.custom || {};
  tr.budget = tr.budget || { ...BUDGET_USD };
  if (!CURRENCIES[tr.currency]) tr.currency = 'USD';
  tr.members = arr(tr.members).map((m) => ({ ...m, id: m.id || uid() }));
  tr.votes = tr.votes || {};
  tr.comments = tr.comments || {};
  tr.expenses = arr(tr.expenses);
  tr.deadline = tr.deadline || null;
  return tr;
}

function newTrip() {
  const start = addDays(new Date(), 30);
  return {
    id: uid(),
    name: t('default_trip'), admin: '',
    start: toISO(start),
    end: toISO(addDays(start, 6)), // one week by default
    travelers: 4, currency: 'USD',
    mode: null,       // 'solo' | 'group'
    hotelMode: null,  // 'single' | 'mixed'
    dests: [{ id: uid(), name: '', days: 7 }],
    custom: {},       // member suggestions: { destId: { hotels: [], spots: [] } }
    budget: { ...BUDGET_USD },
    members: [],      // [{ id, name, role, at }]
    votes: {},        // { memberId: { hotels: {destId: [ids]}, spots: {destId: [ids]} } }
    comments: {},     // { itemId: [{ id, by, text, at }] }
    expenses: [],     // [{ id, desc, amount, by, at }]
    deadline: null,   // ISO time when voting closes
    created: false,   // true once the trip is set up (and shared, when online)
  };
}

/* ---------- Language & dark mode ---------- */
let theme = store.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  $('#langBtn').textContent = t('lang_btn');
  applyTheme();
}
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $('#themeBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
  $('#themeBtn').title = theme === 'dark' ? t('light_mode') : t('dark_mode');
  $('#themeBtn').setAttribute('aria-label', $('#themeBtn').title);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0e1513' : '#2f6b57';
}
