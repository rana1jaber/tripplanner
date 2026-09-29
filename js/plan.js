/* =========================================================
   Step 1: Plan (organizer only) + the "solo or group?" questions
   ========================================================= */
function renderPlan() {
  const c = $('#stepContent');
  const cur = Object.keys(CURRENCIES).map((k) => `<option ${k === trip.currency ? 'selected' : ''}>${k}</option>`).join('');
  const trav = Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}" ${i + 1 === trip.travelers ? 'selected' : ''}>${i + 1}</option>`).join('');

  c.innerHTML = `
    <h1>${t('plan_title')}</h1>
    <p class="lead">${t('plan_sub')}</p>
    <div class="grid2">
      <label class="field"><span>${t('f_name')}</span><input id="fName" value="${esc(trip.name)}"></label>
      <label class="field"><span>${t('f_admin')}</span><input id="fAdmin" value="${esc(trip.admin)}" placeholder="${t('f_admin_ph')}"></label>
      <label class="field"><span>${t('f_start')}</span><input type="date" id="fStart" value="${trip.start}"><small class="hijri" id="startHijri"></small></label>
      <label class="field"><span>${t('f_end')}</span><input type="date" id="fEnd"><small class="hijri" id="endHijri"></small></label>
      <label class="field"><span>${t('f_trav')}</span><select id="fTrav">${trav}</select></label>
      <label class="field"><span>${t('f_cur')}</span><select id="fCur">${cur}</select></label>
    </div>
    <h3>${t('dests')}</h3>
    <p class="muted small">${t('dests_sub')}</p>
    <div id="destList"></div>
    <div id="allocBar"></div>
    <button class="btn-outline" id="addDest">${t('add_dest')}</button>
    <div class="actions"><button class="btn" id="planNext">${t('next')}</button></div>`;

  renderDests();
  const changed = () => { save(); pushCore(); };

  $('#fName').oninput = (e) => { trip.name = e.target.value; changed(); };
  $('#fAdmin').oninput = (e) => {
    trip.admin = e.target.value.trim();
    const m = trip.members.find((x) => x.role === 'admin');
    if (m && trip.admin) { m.name = trip.admin; if (trip.created) pushMember(m); }
    changed(); updateAvatar();
  };
  // Changing the dates re-splits the days evenly between the destinations
  $('#fStart').onchange = (e) => {
    if (!e.target.value) { e.target.value = trip.start; return; }
    const len = tripDays();
    trip.start = e.target.value;
    if (daysBetween(trip.start, trip.end) < 0) trip.end = toISO(addDays(trip.start, len - 1)); // keep the same length
    distributeDays(); changed(); renderDests();
  };
  $('#fEnd').onchange = (e) => {
    if (!e.target.value) return renderDests();
    if (daysBetween(trip.start, e.target.value) < 0) { toast(t('end_before_start')); return renderDests(); }
    trip.end = e.target.value;
    distributeDays(); changed(); renderDests();
  };
  $('#fTrav').onchange = (e) => { trip.travelers = +e.target.value; changed(); };
  $('#fCur').onchange = (e) => {
    // Convert the budget, suggested prices and expenses to the new currency
    const f = CURRENCIES[e.target.value].rate / CURRENCIES[trip.currency].rate;
    Object.keys(trip.budget).forEach((k) => (trip.budget[k] = roundNice(trip.budget[k] * f)));
    for (const [did, cu] of Object.entries(trip.custom)) {
      cu.hotels.forEach((h) => { if (h.price) { h.price = roundNice(h.price * f); if (trip.created) pushCustom(did, 'hotels', h); } });
    }
    trip.expenses.forEach((x) => { x.amount = roundNice(x.amount * f); if (trip.created) pushExpense(x); });
    trip.currency = e.target.value;
    changed();
  };
  $('#addDest').onclick = () => {
    trip.dests.push({ id: uid(), name: '', days: 1 });
    distributeDays(); changed(); renderDests();
    document.querySelector(`[data-dname="${trip.dests.length - 1}"]`).focus();
  };
  $('#planNext').onclick = () => {
    if (!trip.admin) { $('#fAdmin').focus(); return toast(t('need_name')); }
    if (!trip.dests.length) return toast(t('need_dest'));
    const empty = trip.dests.findIndex((d) => !d.name.trim());
    if (empty >= 0) { document.querySelector(`[data-dname="${empty}"]`).focus(); return toast(t('need_dest_name')); }
    const diff = tripDays() - totalDays();
    if (diff !== 0) return toast(diff > 0 ? t('alloc_less', diff) : t('alloc_more', -diff));
    trip.dests.forEach((d) => (d.name = d.name.trim()));
    changed();
    openSetupModal();
  };
}

function renderDests() {
  const list = $('#destList');
  const changed = () => { save(); pushCore(); };
  list.innerHTML = trip.dests.map((d, i) => `
    <div class="dest-row">
      <div class="thumb" style="background:${destGrad(d)}">📍</div>
      <div class="dest-input">
        <input data-dname="${i}" value="${esc(d.name)}" placeholder="${t('dest_ph')}" autocomplete="off">
        ${d.sub ? `<small class="dest-sub">${esc(d.sub)}</small>` : ''}
        <div class="ac" data-ac="${i}" hidden></div>
      </div>
      <div class="days-ctl">
        <button class="icon-btn" data-minus="${i}">−</button>
        <span class="days-pill">${t('days', d.days)}</span>
        <button class="icon-btn" data-plus="${i}">+</button>
      </div>
      <button class="icon-btn del" data-del="${i}" title="${t('delete')}">🗑</button>
    </div>`).join('');
  $('#fStart').value = trip.start;
  $('#fEnd').min = trip.start;
  $('#fEnd').value = trip.end;
  $('#startHijri').textContent = fmtHijri(trip.start);
  $('#endHijri').textContent = fmtHijri(trip.end);

  // Are all the trip days given to a destination?
  const diff = tripDays() - totalDays();
  $('#allocBar').innerHTML = diff === 0
    ? `<div class="alloc ok">${t('alloc_ok', tripDays())}</div>`
    : `<div class="alloc warn"><span>${diff > 0 ? t('alloc_less', diff) : t('alloc_more', -diff)}</span>
        <button class="btn-outline" id="splitEven">${t('split_even')}</button></div>`;
  if ($('#splitEven')) $('#splitEven').onclick = () => { distributeDays(); changed(); renderDests(); };

  // Typing a destination: update it and search for matching places
  list.oninput = (e) => {
    const i = e.target.dataset.dname;
    if (i === undefined) return;
    const d = trip.dests[i];
    d.name = e.target.value;
    delete d.lat; delete d.lon; delete d.osm; delete d.bbox; delete d.sub; // no longer the picked place
    e.target.closest('.dest-row').querySelector('.thumb').style.background = destGrad(d);
    const sub = e.target.parentElement.querySelector('.dest-sub');
    if (sub) sub.remove();
    changed();
    searchDest(+i);
  };
  list.onfocusout = (e) => {
    const i = e.target.dataset.dname;
    if (i !== undefined) setTimeout(() => { const box = document.querySelector(`[data-ac="${i}"]`); if (box) box.hidden = true; }, 200);
  };
  // mousedown (not click) so the choice registers before the input loses focus
  list.onmousedown = (e) => {
    const it = e.target.closest('.ac-item');
    if (!it) return;
    e.preventDefault();
    const i = +it.dataset.pick;
    const box = document.querySelector(`[data-ac="${i}"]`);
    const p = placeFromResult(box._results[+it.dataset.k]);
    Object.assign(trip.dests[i], { name: p.name, sub: p.sub, lat: p.lat, lon: p.lon, osm: p.osm, bbox: p.bbox });
    changed(); renderDests();
    loadSugg(trip.dests[i]); // start loading hotels & places early
  };
  list.onclick = (e) => {
    const b = e.target.closest('button.icon-btn'); if (!b) return;
    const { minus, plus, del } = b.dataset;
    if (minus !== undefined) trip.dests[minus].days = Math.max(1, trip.dests[minus].days - 1);
    if (plus !== undefined) trip.dests[plus].days = Math.min(60, trip.dests[plus].days + 1);
    if (del !== undefined) { trip.dests.splice(del, 1); distributeDays(); }
    changed(); renderDests();
  };
}

let acTimer, acCtrl;
function searchDest(i) {
  clearTimeout(acTimer);
  if (acCtrl) acCtrl.abort();
  const q = trip.dests[i].name.trim();
  const box = document.querySelector(`[data-ac="${i}"]`);
  if (q.length < 2) { box.hidden = true; return; }
  acTimer = setTimeout(async () => {
    box.hidden = false;
    box.innerHTML = `<div class="ac-msg">${t('searching')}</div>`;
    acCtrl = new AbortController();
    try {
      const rs = await geocode(q, acCtrl.signal);
      box._results = rs;
      box.innerHTML = rs.length
        ? rs.map((r, k) => { const p = placeFromResult(r); return `<button type="button" class="ac-item" data-pick="${i}" data-k="${k}"><b>📍 ${esc(p.name)}</b><small>${esc(p.sub)}</small></button>`; }).join('')
        : `<div class="ac-msg">${t('no_match')}</div>`;
    } catch (e) {
      if (e.name !== 'AbortError') box.hidden = true; // offline: the typed name is still used
    }
  }, 600);
}

/* ---------- Ask: solo or group? one hotel or mix? ---------- */
function openSetupModal() {
  const sel = { mode: trip.mode, hotelMode: trip.hotelMode };
  const opt = (group, v, ico, title, sub) =>
    `<button class="opt ${sel[group] === v ? 'sel' : ''}" data-g="${group}" data-v="${v}"><span class="ico">${ico}</span><b>${title}</b><small>${sub}</small></button>`;

  openModal(`
    <h2>${t('setup_title')}</h2>
    <p class="q">${t('q_mode')}</p>
    <div class="opts">
      ${opt('mode', 'solo', '🧍', t('solo_t'), t('solo_s'))}
      ${opt('mode', 'group', '👨‍👩‍👧‍👦', t('group_t'), t('group_s'))}
    </div>
    <p class="q">${t('q_hotel')}</p>
    <div class="opts">
      ${opt('hotelMode', 'single', '🏨', t('single_t'), t('single_s'))}
      ${opt('hotelMode', 'mixed', '🔀', t('mixed_t'), t('mixed_s'))}
    </div>
    <div class="actions"><button class="btn" id="setupOk">${t('continue')}</button></div>`);

  $('#modalBody').onclick = (e) => {
    const b = e.target.closest('.opt'); if (!b) return;
    sel[b.dataset.g] = b.dataset.v;
    document.querySelectorAll(`.opt[data-g="${b.dataset.g}"]`).forEach((o) => o.classList.toggle('sel', o === b));
  };
  $('#setupOk').onclick = async () => {
    if (!sel.mode || !sel.hotelMode) return toast(t('answer_all'));
    // Hotel votes mean something different if the hotel mode changed, so reset them
    const resetVotes = trip.hotelMode && trip.hotelMode !== sel.hotelMode;
    if (resetVotes) Object.values(trip.votes).forEach((v) => (v.hotels = {}));
    trip.mode = sel.mode;
    trip.hotelMode = sel.hotelMode;
    // The organizer is always the first member
    let admin = trip.members.find((m) => m.role === 'admin');
    if (!admin) { admin = { id: uid(), name: trip.admin, role: 'admin', at: Date.now() }; trip.members.unshift(admin); }
    admin.name = trip.admin;
    me = admin.id;
    cityTab = 0;
    $('#modalBody').onclick = null;
    closeModal();
    if (!trip.created) {
      trip.created = true;
      if (ONLINE) await dbSafe('PUT', trip.id, toRemote()); // create the shared trip
    } else {
      pushCore();
      if (resetVotes) dbSafe('PUT', `${trip.id}/votes`, trip.votes);
    }
    save();
    loadAllSugg();
    goStep(trip.mode === 'group' ? 2 : 3);
  };
}
