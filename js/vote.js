/* =========================================================
   Step 3: Vote on hotels & attractions (+ photos, comments, map, deadline)
   ========================================================= */
function myVote() {
  if (!trip.votes[me]) trip.votes[me] = { hotels: {}, spots: {} };
  const v = trip.votes[me];
  v.hotels = v.hotels || {}; v.spots = v.spots || {};
  return v;
}

function tally(type, destId) {
  const counts = {};
  Object.values(trip.votes).forEach((v) => ((v[type] || {})[destId] || []).forEach((id) => (counts[id] = (counts[id] || 0) + 1)));
  return counts;
}

function statusHTML(d, S, empty, emptyMsg, ready) {
  if ((S.status === 'loading' || S.status === 'idle') && !ready) return `<div class="loading"><span class="spinner"></span>${esc(t('loading_sugg', d.name))}</div>`;
  if (S.status === 'error') return `<div class="note" style="margin:0 0 1rem">${t('sugg_error')} <button class="link-btn" data-retry>${t('retry')}</button></div>`;
  return empty ? `<p class="muted small" style="margin-bottom:.8rem">${esc(emptyMsg)}</p>` : '';
}

// A photo if we have one; the emoji stays underneath in case the photo fails to load
const photo = (it, emoji) => `${emoji}${it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}`;

function renderVote() {
  if (!meMember()) me = trip.members[0]?.id;
  if (cityTab >= trip.dests.length) cityTab = 0;

  const c = $('#stepContent');
  const group = trip.mode === 'group';
  const d = trip.dests[cityTab];
  loadSugg(d);      // current destination first
  loadAllSugg();    // then the others in the background
  const S = suggFor(d);
  const hotels = hotelsFor(d);
  const spots = spotsFor(d);
  const cn = d.name;
  const v = myVote();
  const myH = v.hotels[d.id] || [];
  const myS = v.spots[d.id] || [];
  const hc = tally('hotels', d.id);
  const sc = tally('spots', d.id);
  const nights = nightsIn(cityTab);
  const limitH = trip.hotelMode === 'mixed' && nights > 1 ? 2 : 1;
  const limitS = d.days * 2;
  const maxVotes = Math.max(1, ...Object.values(hc));
  const hint = limitH === 2 ? t('hint_mixed', esc(cn), t('nights', nights)) : t('hint_single', esc(cn), t('nights', nights));
  const showBack = cityTab > 0 || isAdmin();
  const locked = !canVote();
  const nComments = (id) => (trip.comments[id] || []).length;

  c.innerHTML = `
    <div class="trip-head">
      <div><h1>${esc(trip.name)}</h1><p class="muted">${fmt(trip.start)} – ${fmt(endDate())} · ${t('travelers', trip.travelers)}</p></div>
      <div class="head-side">
        ${group && meMember() ? `<div class="voter">${t('voting_as')} <b>${esc(meMember().name)}</b></div>` : ''}
        ${trip.deadline ? `<div class="badge ${votingClosed() ? '' : 'ok'}" id="deadlineBadge">${deadlineText()}</div>` : ''}
      </div>
    </div>

    <div class="tabs-row">
      <div class="tabs">${trip.dests.map((x, i) =>
        `<button class="tab ${i === cityTab ? 'active' : ''}" data-tab="${i}">📍 ${esc(x.name)}</button>`).join('')}</div>
      <button class="btn-outline small-btn" id="mapBtn">${t('show_map')}</button>
    </div>
    <p class="credit"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${t('osm_credit')}</a></p>

    ${nights === 0 ? `<div class="note" style="margin:0 0 1.4rem">${t('no_stay')}</div>` : ''}
    <section class="card" ${nights === 0 ? 'hidden' : ''}>
      <div class="sec-head">
        <div><h2>${group ? t('vote_hotels', esc(cn)) : t('pick_hotels', esc(cn))}</h2><p class="muted small">${hint}</p></div>
        <span class="badge ${myH.length ? 'ok' : ''}">${myH.length} / ${limitH}</span>
      </div>
      ${statusHTML(d, S, !hotels.length, t('no_hotels', cn), S.hotels.length > 0)}
      <div class="hotels">${hotels.map((h, i) => `
        <div class="hotel ${myH.includes(h.id) ? 'on' : ''}">
          <div class="h-img" style="background:${destGrad(d, 160 + i * 30)}">${photo(h, HOTEL_ICONS[i % HOTEL_ICONS.length])}
            ${group ? `<span class="h-votes">${t('votes', hc[h.id] || 0)}</span>` : ''}</div>
          <div class="h-body">
            <b>${esc(itemName(h))}</b>
            <span class="rate">${h.stars ? `<b>${t('stars', h.stars)}</b>` : h.by ? esc(t('suggested_by', h.by)) : '&nbsp;'}</span>
            <span class="price">${h.price ? `${money(h.price)} <small>${t('per_night')}</small>` : `<small>${t('price_unknown')}</small>`}</span>
            <span class="links"><a class="map-link" href="${mapLink(h, d)}" target="_blank" rel="noopener">${t('on_map')}</a>
              ${h.website ? `<a class="map-link" href="${esc(h.website)}" target="_blank" rel="noopener">${t('website')}</a>` : ''}
              ${group ? `<button class="chip-btn" data-comments="${h.id}">${t('comment_btn', nComments(h.id))}</button>` : ''}</span>
            <button class="btn ${locked ? 'locked' : ''}" data-hotel="${h.id}">${myH.includes(h.id) ? t('picked') : group ? t('vote') : t('pick')}</button>
          </div>
        </div>`).join('')}
      </div>
      ${group && hotels.length ? `
      <div class="results">
        <h3>${t('current_votes')}</h3>
        ${[...hotels].sort((a, b) => (hc[b.id] || 0) - (hc[a.id] || 0)).map((h) => `
          <div class="bar-row"><span>${esc(itemName(h))}</span><div class="bar"><i style="width:${((hc[h.id] || 0) / maxVotes) * 100}%"></i></div><span>${t('votes', hc[h.id] || 0)}</span></div>`).join('')}
      </div>` : ''}
      <div class="add-item">
        <input id="newHotel" maxlength="80" placeholder="${t('hotel_name_ph')}">
        <input id="newHotelPrice" type="number" min="0" placeholder="${t('price_ph')}">
        <button class="btn-outline" id="addHotel">+ ${t('suggest_hotel')}</button>
      </div>
    </section>

    <section class="card">
      <div class="sec-head">
        <div><h2>${t('spots_title', esc(cn))}</h2><p class="muted small">${t('spots_sub', limitS)}</p></div>
        <span class="badge ${myS.length ? 'ok' : ''}">${myS.length} / ${limitS}</span>
      </div>
      ${statusHTML(d, S, !spots.length, t('no_spots', cn), false)}
      <div class="spots">${spots.map((s) => {
        const ty = TYPES[s.type] || TYPES.custom;
        return `
        <div class="spot ${myS.includes(s.id) ? 'on' : ''} ${locked ? 'locked' : ''}" data-spot="${s.id}" role="button" tabindex="0">
          <span class="spot-emoji ${s.img ? 'photo' : ''}">${photo(s, ty[2])}</span>
          <span><b>${esc(itemName(s))}</b><small>${s.by ? esc(t('suggested_by', s.by)) : ty[li()]}${group ? ` · ${t('votes', sc[s.id] || 0)}` : ''}
            · <a class="map-link" href="${mapLink(s, d)}" target="_blank" rel="noopener">${t('on_map')}</a></small></span>
          <span class="check">✓</span>
        </div>`;
      }).join('')}
      </div>
      <div class="add-item">
        <input id="newSpot" maxlength="80" placeholder="${t('place_name_ph')}">
        <button class="btn-outline" id="addSpot">+ ${t('suggest_spot')}</button>
      </div>
    </section>

    <div class="actions">
      ${showBack ? `<button class="btn-ghost" id="voteBack">${t('back')}</button>` : ''}
      <button class="btn" id="voteNext">${cityTab < trip.dests.length - 1 ? esc(t('next_city', trip.dests[cityTab + 1].name)) : t('show_plan')}</button>
    </div>`;

  const voted = () => { save(); pushVote(); renderVote(); };
  const toggleSpot = (id) => {
    if (locked) return toast(t('voting_closed_toast'));
    let list = v.spots[d.id] || [];
    if (list.includes(id)) list = list.filter((x) => x !== id);
    else if (list.length < limitS) list = [...list, id];
    else return toast(t('max_spots', limitS));
    v.spots[d.id] = list;
    voted();
  };

  c.onclick = (e) => {
    if (e.target.closest('a')) return; // map links open normally

    const tab = e.target.closest('[data-tab]');
    if (tab) { cityTab = +tab.dataset.tab; return renderVote(); }

    if (e.target.closest('[data-retry]')) { loadSugg(d, true); return renderVote(); }

    const cm = e.target.closest('[data-comments]');
    if (cm) return openComments(hotels.find((h) => h.id === cm.dataset.comments));

    const hb = e.target.closest('[data-hotel]');
    if (hb) {
      if (locked) return toast(t('voting_closed_toast'));
      const id = hb.dataset.hotel;
      let list = v.hotels[d.id] || [];
      if (list.includes(id)) list = list.filter((x) => x !== id);
      else if (limitH === 1) list = [id];
      else if (list.length < limitH) list = [...list, id];
      else return toast(t('max_two'));
      v.hotels[d.id] = list;
      return voted();
    }

    const sb = e.target.closest('[data-spot]');
    if (sb) return toggleSpot(sb.dataset.spot);
  };
  c.onkeydown = (e) => {
    const sb = e.target.closest('[data-spot]');
    if (sb && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleSpot(sb.dataset.spot); }
  };

  // Map of this destination's hotels and attractions
  $('#mapBtn').onclick = () => openMap(t('map_title', cn), t('map_hint_vote'), [
    ...hotels.map((h) => ({ lat: h.lat, lon: h.lon, emoji: '🏨', color: '#2f6b57', name: itemName(h), sub: group ? t('votes', hc[h.id] || 0) : '', big: myH.includes(h.id) })),
    ...spots.map((s) => ({ lat: s.lat, lon: s.lon, emoji: (TYPES[s.type] || TYPES.custom)[2], color: '#e8883a', name: itemName(s), sub: (TYPES[s.type] || TYPES.custom)[li()], big: myS.includes(s.id) })),
  ]);

  // Members can suggest their own hotels and places
  const by = meMember()?.name || '';
  $('#addHotel').onclick = () => {
    const name = $('#newHotel').value.trim();
    if (!name) { $('#newHotel').focus(); return toast(t('need_item_name')); }
    const price = parseFloat($('#newHotelPrice').value);
    const item = { id: 'c' + uid(), name, price: price > 0 ? price : null, by, at: Date.now() };
    customFor(d).hotels.push(item);
    save(); pushCustom(d.id, 'hotels', item); renderVote();
  };
  $('#addSpot').onclick = () => {
    const name = $('#newSpot').value.trim();
    if (!name) { $('#newSpot').focus(); return toast(t('need_item_name')); }
    const item = { id: 'c' + uid(), name, type: 'custom', by, at: Date.now() };
    customFor(d).spots.push(item);
    save(); pushCustom(d.id, 'spots', item); renderVote();
  };
  $('#newHotel').onkeydown = $('#newHotelPrice').onkeydown = (e) => { if (e.key === 'Enter') $('#addHotel').click(); };
  $('#newSpot').onkeydown = (e) => { if (e.key === 'Enter') $('#addSpot').click(); };

  if ($('#voteBack')) $('#voteBack').onclick = () => {
    if (cityTab > 0) { cityTab--; renderVote(); window.scrollTo(0, 0); }
    else goStep(group ? 2 : 1);
  };
  $('#voteNext').onclick = () => {
    if (!locked && nights > 0 && hotels.length && !(v.hotels[d.id] || []).length) return toast(t('need_hotel', cn));
    if (cityTab < trip.dests.length - 1) { cityTab++; renderVote(); window.scrollTo(0, 0); }
    else goStep(4);
  };
}

/* ---------- Comments on a hotel ---------- */
function openComments(item) {
  if (!item) return;
  const draw = () => {
    const list = trip.comments[item.id] || [];
    $('#commentList').innerHTML = list.length
      ? list.map((c) => `
        <div class="comment">
          <div class="m-av" style="background:${avColor(c.by)}">${esc([...c.by][0].toUpperCase())}</div>
          <div><b>${esc(c.by)}</b> <small class="muted">${new Date(c.at).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</small>
            <p>${esc(c.text)}</p></div>
        </div>`).join('')
      : `<p class="muted small">${t('no_comments')}</p>`;
    $('#commentList').scrollTop = 1e6;
  };
  openModal(`
    <h2>${esc(t('comments_title', itemName(item)))}</h2>
    <div class="comment-list" id="commentList"></div>
    <div class="add-item" style="border:0;padding-top:0">
      <input id="commentInput" maxlength="500" placeholder="${t('comment_ph')}">
      <button class="btn" id="commentSend">${t('send')}</button>
    </div>`);
  draw();
  onModalRefresh = draw; // new comments from others appear while the window is open
  const send = () => {
    const text = $('#commentInput').value.trim();
    if (!text) return;
    const c = { id: uid(), by: meMember()?.name || '?', text, at: Date.now() };
    (trip.comments[item.id] = trip.comments[item.id] || []).push(c);
    $('#commentInput').value = '';
    save(); pushComment(item.id, c); draw();
  };
  $('#commentSend').onclick = send;
  $('#commentInput').onkeydown = (e) => { if (e.key === 'Enter') send(); };
  $('#commentInput').focus();
  onModalClose = () => { if (step === 3) renderVote(); }; // update the 💬 counts
}
