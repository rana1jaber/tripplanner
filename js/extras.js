/* =========================================================
   Extras: weather, maps, calendar file, sharing the plan, install as an app.
   ========================================================= */

/* ---------- Weather (Open-Meteo, free, no key) ---------- */
const WEATHER = {}; // key → { status, days: [{ code, max, min }], kind: 'forecast' | 'typical' }
const WX_ICON = (c) => (c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '❄️' : c <= 82 ? '🌦️' : '⛈️');
const shiftYears = (iso, n) => `${+iso.slice(0, 4) - n}${iso.slice(4)}`;

// Returns the weather for a destination's days (or undefined while loading / unavailable)
function weatherFor(d, from, to) {
  if (d.lat == null) return undefined;
  const key = `${d.lat.toFixed(2)},${d.lon.toFixed(2)},${from},${to}`;
  if (WEATHER[key]) return WEATHER[key].status === 'ok' ? WEATHER[key] : undefined;
  WEATHER[key] = { status: 'loading' };
  const today = toISO(new Date());
  const forecast = daysBetween(today, from) >= 0 && daysBetween(today, to) <= 15; // forecasts reach ~16 days ahead
  let url, kind;
  const q = `latitude=${d.lat}&longitude=${d.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  if (forecast) {
    url = `https://api.open-meteo.com/v1/forecast?${q}&start_date=${from}&end_date=${to}`;
    kind = 'forecast';
  } else {
    // Further away: show what the weather was on the same dates in a past year
    let n = 1;
    while (daysBetween(shiftYears(to, n), today) < 7 && n < 5) n++;
    url = `https://archive-api.open-meteo.com/v1/archive?${q}&start_date=${shiftYears(from, n)}&end_date=${shiftYears(to, n)}`;
    kind = 'typical';
  }
  fetchJSON(url, {}, 15000)
    .then((j) => {
      const dd = j.daily;
      WEATHER[key] = { status: 'ok', kind, days: dd.time.map((_, i) => ({ code: dd.weather_code[i], max: dd.temperature_2m_max[i], min: dd.temperature_2m_min[i] })) };
    })
    .catch(() => { WEATHER[key] = { status: 'error' }; })
    .finally(() => { if (step === 4) refreshView(); });
  return undefined;
}
const wxHTML = (w) => (w && w.max != null ? `<span class="wx">${WX_ICON(w.code)} ${Math.round(w.max)}° / ${Math.round(w.min)}°</span>` : '');

/* ---------- Maps (Leaflet + OpenStreetMap tiles) ---------- */
// points: [{ lat, lon, emoji, color, name, sub, big }] · routes: [{ latlngs, color }]
function openMap(title, hint, points, routes = []) {
  const pts = points.filter((p) => p.lat != null && !isNaN(p.lat));
  openModal(`<h2>${esc(title)}</h2><p class="muted small" style="margin:.3rem 0 .8rem">${esc(hint)}</p>
    <div id="mapBox" class="map-box">${pts.length ? '' : `<p class="map-empty">${t('no_coords')}</p>`}</div>`, true);
  if (!pts.length) return;
  if (!window.L || !window.L.map) { $('#mapBox').innerHTML = `<p class="map-empty">${t('map_offline')}</p>`; return; }
  const Lf = window.L;
  const map = Lf.map('mapBox', { scrollWheelZoom: true });
  Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  routes.forEach((r) => { if (r.latlngs.length > 1) Lf.polyline(r.latlngs, { color: r.color, weight: 4, opacity: 0.8 }).addTo(map); });
  const markers = pts.map((p) => Lf.marker([p.lat, p.lon], {
    icon: Lf.divIcon({ className: 'map-pin', html: `<span class="${p.big ? 'big' : ''}" style="background:${p.color}">${p.emoji}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }),
  }).bindPopup(`<b>${esc(p.name)}</b>${p.sub ? '<br>' + esc(p.sub) : ''}`).addTo(map));
  const bounds = Lf.featureGroup(markers).getBounds();
  if (pts.length === 1) map.setView([pts[0].lat, pts[0].lon], 14);
  else map.fitBounds(bounds, { padding: [30, 30] });
  setTimeout(() => map.invalidateSize(), 150);
  onModalClose = () => map.remove();
}

/* ---------- Calendar file (.ics) ---------- */
const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const ymd = (d) => toISO(parseDate(d)).replace(/-/g, '');
function downloadCalendar() {
  const plan = buildPlan();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TripPlanner//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsEsc(trip.name)}`];
  plan.cities.forEach((pc) => pc.days.forEach((day, i) => {
    const desc = [
      `${t('morning')}: ${day.morning ? itemName(day.morning) : t('free_time')}`,
      `${t('evening')}: ${day.evening ? itemName(day.evening) : t('free_time')}`,
      day.hotel ? `${t('stay')} ${itemName(day.hotel)}` : t('departure'),
    ].join('\n');
    lines.push('BEGIN:VEVENT', `UID:${trip.id}-${ymd(day.date)}@tripplanner`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(day.date)}`, `DTEND;VALUE=DATE:${ymd(addDays(day.date, 1))}`,
      `SUMMARY:${icsEsc(`${trip.name} – ${pc.d.name} (${t('day_n', i + 1)})`)}`,
      `LOCATION:${icsEsc(pc.d.name)}`, `DESCRIPTION:${icsEsc(desc)}`, 'END:VEVENT');
  }));
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (trip.name.replace(/[\\/:*?"<>|]/g, '').trim() || 'trip') + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(t('cal_done'));
}

/* ---------- Share the final plan as text (WhatsApp / phone share sheet) ---------- */
function planText() {
  const plan = buildPlan();
  const out = [`✈️ ${trip.name}`, t('sh_dates', fmtLong(trip.start), fmtLong(trip.end)), ''];
  plan.cities.forEach((pc) => {
    out.push(`📍 ${pc.d.name} — ${t('days', pc.d.days)}`);
    pc.hotels.forEach((h) => out.push(`🏨 ${itemName(h.hotel)} (${t('nights', h.nights)})`));
    pc.days.forEach((day, i) => {
      const parts = [day.morning, day.evening].filter(Boolean).map(itemName);
      out.push(`• ${t('day_n', i + 1)} (${fmt(day.date)}): ${parts.length ? parts.join(' ← ') : t('free_time')}`);
    });
    out.push('');
  });
  out.push(t('sh_total', money(plan.total), money(plan.total / trip.travelers)));
  return out.join('\n').replace(/ ← /g, lang === 'ar' ? ' ← ' : ' → ');
}
async function sharePlan() {
  const text = planText();
  if (navigator.share) {
    try { await navigator.share({ title: trip.name, text }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
}

/* ---------- Install as an app (PWA) ---------- */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  $('#installBtn').hidden = false;
});
window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; installPrompt = null; });
