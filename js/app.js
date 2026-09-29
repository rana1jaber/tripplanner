/* =========================================================
   App: moving between pages, buttons in the header, startup.
   ========================================================= */
function show(view) {
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== view));
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === (view === 'home' ? 'home' : 'trips')));
}

function goStep(n, keepScroll) {
  if (!canGo(n)) n = trip.mode ? 3 : 1;
  step = n;
  show('wizard');
  const c = $('#stepContent');
  c.onclick = c.onchange = c.oninput = c.onkeydown = null; // clear handlers from the previous step
  renderSteps();
  [renderPlan, renderInvite, renderVote, renderItinerary][n - 1]();
  updateAvatar();
  subscribe();
  if (!keepScroll) window.scrollTo(0, 0);
}

function updateAvatar() {
  const name = meMember()?.name || trip?.admin;
  $('#avatar').textContent = name ? [...name][0].toUpperCase() : '?';
  $('#avatar').style.background = name ? avColor(name) : '';
}

function canGo(n) {
  if (n <= 2 && !isAdmin()) return false; // only the organizer edits the plan & invites
  if (n === 1) return true;
  if (n === 2) return trip.mode === 'group';
  return !!trip.mode;
}

function renderSteps() {
  $('#steps').innerHTML = t('steps').map(([title, sub], i) => {
    const n = i + 1;
    const solo = n === 2 && trip.mode === 'solo';
    const cls = n === step ? 'active' : n < step ? 'done' : '';
    return `<button class="step ${cls}" data-step="${n}" ${canGo(n) ? '' : 'disabled'}>
      <span class="num">${n < step && !solo ? '✓' : n}</span>
      <span><b>${title}</b><small>${solo ? t('solo_step') : n <= 2 && !isAdmin() ? t('admin_step') : sub}</small></span>
    </button>`;
  }).join('');
}

/* ---------- Header & home page buttons ---------- */
$('#steps').onclick = (e) => {
  const b = e.target.closest('.step');
  if (b && !b.disabled) goStep(+b.dataset.step);
};

$('#newTripBtn').onclick = () => {
  if (stream) { stream.close(); stream = null; }
  trip = newTrip(); me = null; cityTab = 0; goStep(1);
};

$('#joinBtn').onclick = () => {
  const val = $('#joinInput').value.trim();
  const i = val.indexOf('#join=');
  if (i < 0) return toast(t('invalid_link'));
  location.hash = val.slice(i); // triggers handleJoin via hashchange
};
$('#joinInput').onkeydown = (e) => { if (e.key === 'Enter') $('#joinBtn').click(); };

$('#logo').onclick = (e) => { e.preventDefault(); show('home'); };
document.querySelectorAll('.nav a').forEach((a) => (a.onclick = (e) => {
  e.preventDefault();
  if (a.dataset.nav === 'home') return show('home');
  const last = trip || loadTrip(store.get('lastTrip'));
  if (!last) return toast(t('no_trips'));
  trip = last;
  me = me || store.get('me_' + trip.id);
  goStep(trip.mode ? (isAdmin() ? 4 : 3) : 1);
  if (ONLINE && trip.created) pull(); // get the latest from the shared database
}));

$('#langBtn').onclick = () => {
  lang = lang === 'en' ? 'ar' : 'en';
  store.set('lang', lang);
  applyLang();
  if (!$('#wizard').hidden && trip) goStep(step, true); // re-render current step
};
$('#themeBtn').onclick = () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  store.set('theme', theme);
  applyTheme();
};
$('#installBtn').onclick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('#installBtn').hidden = true;
};

$('#modalX').onclick = closeModal;
$('#modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
window.addEventListener('hashchange', handleJoin);

// Keep the "voting ends in…" countdown current, and lock voting when the time is up
let wasClosed = null;
setInterval(() => {
  if (!trip || !trip.deadline) return;
  const badge = $('#deadlineBadge');
  if (badge) badge.textContent = deadlineText();
  const closed = votingClosed();
  if (wasClosed !== null && closed !== wasClosed && step === 3) refreshView();
  wasClosed = closed;
}, 30000);

// Works offline & can be installed on the phone's home screen
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Start
applyLang();
handleJoin().then((joined) => { if (!joined) show('home'); });
