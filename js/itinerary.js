/* =========================================================
   Step 4: Final itinerary (+ weather, Hijri dates, route map,
   calendar, sharing, costs and shared expenses)
   ========================================================= */
function buildPlan() {
  const rooms = Math.ceil(trip.travelers / 2); // one room per two travelers
  const B = trip.budget;
  let cursor = parseDate(trip.start);
  let hotelCost = 0;
  const TBD = { id: 'tbd', name: t('hotel_tbd'), price: null };

  const cities = trip.dests.map((d, ci) => {
    const n = nightsIn(ci);
    const hc = tally('hotels', d.id);
    const sc = tally('spots', d.id);

    // Most voted first (the list is already ranked, so ties keep that order)
    const hs = [...hotelsFor(d)].sort((a, b) => (hc[b.id] || 0) - (hc[a.id] || 0));
    let hotels;
    if (n === 0) hotels = [];
    else if (trip.hotelMode === 'mixed' && n > 1 && hs.length > 1) {
      const first = Math.ceil(n / 2);
      hotels = [
        { hotel: hs[0], nights: first, votes: hc[hs[0].id] || 0 },
        { hotel: hs[1], nights: n - first, votes: hc[hs[1].id] || 0 },
      ];
    } else {
      hotels = [{ hotel: hs[0] || TBD, nights: n, votes: hs[0] ? hc[hs[0].id] || 0 : 0 }];
    }
    hotels.forEach((h) => (hotelCost += (h.hotel.price || B.hotel) * h.nights * rooms));

    const spots = [...spotsFor(d)].sort((a, b) => (sc[b.id] || 0) - (sc[a.id] || 0));
    const from = new Date(cursor);
    const days = [];
    for (let i = 0; i < d.days; i++) {
      const hotel = i >= n ? null : i < hotels[0].nights ? hotels[0].hotel : hotels[1].hotel;
      days.push({ date: new Date(cursor), morning: spots[i * 2], evening: spots[i * 2 + 1], hotel });
      cursor = addDays(cursor, 1);
    }
    return { d, hotels, days, from, to: addDays(cursor, -1) };
  });

  const days = totalDays(), p = trip.travelers;
  const costs = [
    { key: 'hotel', ico: '🏨', label: t('c_hotels'), unit: t('u_hotel'), value: hotelCost, color: '#4f9d7e' },
    { key: 'transport', ico: '🚆', label: t('c_transport'), unit: t('u_person'), value: B.transport * p, color: '#8b7fd1' },
    { key: 'activity', ico: '🎟️', label: t('c_activities'), unit: t('u_person_day'), value: B.activity * p * days, color: '#f0a35e' },
    { key: 'food', ico: '🍽️', label: t('c_food'), unit: t('u_person_day'), value: B.food * p * days, color: '#e97a7a' },
  ];
  const total = costs.reduce((s, x) => s + x.value, 0);
  return { cities, costs, total };
}

function slotHTML(s, label) {
  if (!s) return `<div class="slot"><span class="spot-emoji">☕</span><span><b>${t('free_time')}</b><small>${label}</small></span></div>`;
  const ty = TYPES[s.type] || TYPES.custom;
  return `<div class="slot"><span class="spot-emoji ${s.img ? 'photo' : ''}">${photo(s, ty[2])}</span><span><b>${esc(itemName(s))}</b><small>${label}</small></span></div>`;
}

/* ---------- Shared expenses: who paid what, who owes whom ---------- */
function settleUp() {
  const ids = trip.members.map((m) => m.id);
  const total = trip.expenses.reduce((s, x) => s + x.amount, 0);
  const share = ids.length ? total / ids.length : 0;
  const bal = Object.fromEntries(ids.map((id) => [id, -share]));
  trip.expenses.forEach((x) => { if (x.by in bal) bal[x.by] += x.amount; });
  const debtors = ids.filter((id) => bal[id] < -0.5).map((id) => ({ id, amt: -bal[id] })).sort((a, b) => b.amt - a.amt);
  const creditors = ids.filter((id) => bal[id] > 0.5).map((id) => ({ id, amt: bal[id] })).sort((a, b) => b.amt - a.amt);
  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amt, creditors[j].amt);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, amt });
    debtors[i].amt -= amt; creditors[j].amt -= amt;
    if (debtors[i].amt < 0.5) i++;
    if (creditors[j].amt < 0.5) j++;
  }
  return { total, share, transfers };
}

function expensesHTML() {
  const s = settleUp();
  const opts = trip.members.map((m) => `<option value="${m.id}" ${m.id === me ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
  return `
    <section class="card">
      <h2>${t('exp_title')}</h2>
      <p class="muted small" style="margin-bottom:1rem">${t('exp_sub')}</p>
      <div class="exp-form">
        <input id="expDesc" maxlength="80" placeholder="${t('exp_desc_ph')}">
        <input id="expAmount" type="number" min="0" step="any" placeholder="${t('exp_amount_ph')} (${esc(sym().trim())})">
        <label class="exp-by">${t('exp_paid_by')} <select id="expBy">${opts}</select></label>
        <button class="btn" id="expAdd">${t('exp_add')}</button>
      </div>
      ${trip.expenses.length ? `
        <div class="exp-list">${trip.expenses.map((x) => `
          <div class="exp-item">
            <div class="m-av small" style="background:${avColor(memberName(x.by))}">${esc([...memberName(x.by)][0].toUpperCase())}</div>
            <div><b>${esc(x.desc)}</b><small class="muted">${esc(memberName(x.by))}</small></div>
            <b class="exp-amt">${money(x.amount)}</b>
            ${x.by === me || isAdmin() ? `<button class="icon-btn del" data-delexp="${x.id}" title="${t('delete')}">🗑</button>` : '<span></span>'}
          </div>`).join('')}
        </div>
        <div class="exp-summary">
          <span>${t('exp_total', money(s.total))}</span><span>${t('exp_each', money(s.share))}</span>
        </div>
        <h3 style="margin-top:1rem">${t('exp_settle')}</h3>
        ${s.transfers.length
          ? s.transfers.map((x) => `<div class="transfer">💳 ${esc(t('owes', memberName(x.from), memberName(x.to), money(x.amt)))}</div>`).join('')
          : `<p class="muted small">${t('exp_settled')}</p>`}`
      : `<p class="muted small">${t('exp_none')}</p>`}
    </section>`;
}

function renderItinerary() {
  const c = $('#stepContent');
  const group = trip.mode === 'group';
  loadAllSugg();
  const loading = trip.dests.some((d) => ['loading', 'idle'].includes(suggFor(d).status));
  const plan = buildPlan();
  const canEdit = isAdmin();

  c.innerHTML = `
    <div class="trip-head">
      <div><h1>${t('final_title')}</h1><p class="muted">${group ? t('final_group') : t('final_solo')}</p></div>
      <div class="head-actions no-print">
        <button class="btn-outline small-btn" id="shareBtn">${t('share_plan')}</button>
        <button class="btn-outline small-btn" id="calBtn">${t('add_cal')}</button>
        <button class="btn-outline small-btn" id="pdfBtn">${t('pdf')}</button>
      </div>
    </div>
    ${loading ? `<div class="loading no-print"><span class="spinner"></span>${t('still_loading')}</div>` : ''}

    ${plan.cities.map((pc, ci) => {
      const wx = weatherFor(pc.d, toISO(pc.from), toISO(pc.to));
      return `
      <section class="city-block">
        <div class="banner" style="background:${destGrad(pc.d)}">
          <div><h2>📍 ${esc(pc.d.name)}</h2><p>${t('days', pc.d.days)} · ${fmt(pc.from)} – ${fmt(pc.to)}</p>
            ${wx ? `<p class="wx-note">${wx.kind === 'forecast' ? t('wx_forecast') : t('wx_typical')}</p>` : ''}</div>
          <div class="banner-hotels">${pc.hotels.map((h) => `
            <div class="hchip">🏨<div><b>${esc(itemName(h.hotel))}</b>
              <small>${h.hotel.stars ? '★ ' + h.hotel.stars + ' · ' : ''}${t('nights', h.nights)}${h.hotel.price ? ' · ' + money(h.hotel.price) + ' ' + t('per_night') : ''}${group ? ` · ${t('votes', h.votes)}` : ''}</small></div></div>`).join('')}
            <button class="hchip map-chip no-print" data-routemap="${ci}">${t('route_map')}</button>
          </div>
        </div>
        <div class="days">${pc.days.map((day, i) => `
          <div class="day" style="border-top:3px solid ${DAY_COLORS[i % DAY_COLORS.length]}">
            <div class="day-head"><h3>${t('day_n', i + 1)}</h3>${wx ? wxHTML(wx.days[i]) : ''}</div>
            <div class="date">${fmtLong(day.date)}<br><span class="hijri">${fmtHijri(day.date)}</span></div>
            ${slotHTML(day.morning, t('morning'))}
            ${slotHTML(day.evening, t('evening'))}
            <div class="stay">${day.hotel ? `${t('stay')} ${esc(itemName(day.hotel))}` : t('departure')}</div>
          </div>`).join('')}
        </div>
      </section>`;
    }).join('')}

    <div class="bottom-grid">
      <section class="card">
        <h2>${t('costs_title')}</h2>
        <p class="muted small">${t('costs_sub', Math.ceil(trip.travelers / 2), totalNights(), trip.travelers)}</p>
        ${plan.costs.map((x) => {
          const pct = plan.total ? Math.round((x.value / plan.total) * 100) : 0;
          return `<div class="cost-row">
            <span class="cost-ico">${x.ico}</span>
            <span><span>${x.label}</span>
              <label class="unit">${esc(sym().trim())}<input type="number" min="0" step="any" data-budget="${x.key}" value="${trip.budget[x.key]}" ${canEdit ? '' : 'disabled'}>${x.unit}</label></span>
            <b>${money(x.value)}</b>
            <span class="pct"><span class="bar"><i style="width:${pct}%;background:${x.color}"></i></span><small class="muted">${pct}%</small></span>
          </div>`;
        }).join('')}
        <div class="total">
          <div><small>${t('total')}</small><strong>${money(plan.total)}</strong></div>
          <div><small>${t('per_person_n', trip.travelers)}</small><strong>${money(plan.total / trip.travelers)}</strong></div>
        </div>
      </section>
      <section class="card">
        <h2>${t('members_title')}</h2>
        ${membersHTML()}
        <p class="muted small" style="margin-top:1rem">${t('stay_type')} ${trip.hotelMode === 'mixed' ? t('stay_mixed') : t('stay_single')}</p>
      </section>
    </div>

    ${group ? expensesHTML() : ''}

    <div class="actions">
      <button class="btn-ghost" id="itBack">${t('back_vote')}</button>
      ${group && canEdit ? `<button class="btn-outline" id="shareAgain">${t('share_link')}</button>` : ''}
      <button class="btn" id="homeBtn">${t('home')}</button>
    </div>`;

  // Editable budget amounts (organizer)
  c.onchange = (e) => {
    const k = e.target.dataset.budget;
    if (!k || !canEdit) return;
    trip.budget[k] = Math.max(0, parseFloat(e.target.value) || 0);
    save(); pushCore(); renderItinerary();
  };
  c.onclick = (e) => {
    const rm = e.target.closest('[data-routemap]');
    if (rm) return openRouteMap(plan.cities[+rm.dataset.routemap]);
    const del = e.target.closest('[data-delexp]');
    if (del) {
      trip.expenses = trip.expenses.filter((x) => x.id !== del.dataset.delexp);
      save(); deleteExpense(del.dataset.delexp); renderItinerary();
    }
  };
  if ($('#expAdd')) {
    $('#expAdd').onclick = () => {
      const desc = $('#expDesc').value.trim();
      const amount = parseFloat($('#expAmount').value);
      if (!desc || !(amount > 0)) return toast(t('exp_need'));
      const x = { id: uid(), desc, amount, by: $('#expBy').value, at: Date.now() };
      trip.expenses.push(x);
      save(); pushExpense(x); renderItinerary();
    };
    $('#expDesc').onkeydown = $('#expAmount').onkeydown = (e) => { if (e.key === 'Enter') $('#expAdd').click(); };
  }
  $('#pdfBtn').onclick = () => window.print();
  $('#calBtn').onclick = downloadCalendar;
  $('#shareBtn').onclick = sharePlan;
  $('#itBack').onclick = () => { cityTab = 0; goStep(3); };
  $('#homeBtn').onclick = () => show('home');
  if ($('#shareAgain')) $('#shareAgain').onclick = () => goStep(2);
}

// Map of one destination: each day's route hotel → morning → evening → hotel
function openRouteMap(pc) {
  const points = [], routes = [];
  pc.hotels.forEach((h) => points.push({ lat: h.hotel.lat, lon: h.hotel.lon, emoji: '🏨', color: '#2f6b57', name: itemName(h.hotel), sub: t('nights', h.nights), big: true }));
  pc.days.forEach((day, i) => {
    const color = DAY_COLORS[i % DAY_COLORS.length];
    const stops = [];
    if (day.hotel && day.hotel.lat != null) stops.push([day.hotel.lat, day.hotel.lon]);
    [['morning', day.morning], ['evening', day.evening]].forEach(([when, s]) => {
      if (s && s.lat != null) {
        points.push({ lat: s.lat, lon: s.lon, emoji: String(i + 1), color, name: itemName(s), sub: `${t('day_n', i + 1)} · ${t(when)}` });
        stops.push([s.lat, s.lon]);
      }
    });
    if (day.hotel && day.hotel.lat != null && stops.length > 1) stops.push([day.hotel.lat, day.hotel.lon]);
    routes.push({ latlngs: stops, color });
  });
  openMap(t('route_title', pc.d.name), t('map_hint_route'), points, routes);
}
