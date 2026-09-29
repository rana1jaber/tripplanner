/* =========================================================
   Step 2: Invite (organizer) + voting deadline + joining through a link
   ========================================================= */
const toLocalInput = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function renderInvite() {
  const c = $('#stepContent');
  const link = inviteLink();
  const suggested = trip.deadline ? toLocalInput(trip.deadline) : toLocalInput(Date.now() + 3 * 86400000);

  c.innerHTML = `
    <h1>${t('inv_title')}</h1>
    <p class="lead">${t('inv_sub')}</p>
    <div class="card">
      <h3>${t('link_title')}</h3>
      <div class="link-box"><input id="linkInput" readonly value="${esc(link)}"><button class="btn" id="copyBtn">${t('copy')}</button></div>
      <div class="share-row">
        <a class="btn wa" target="_blank" rel="noopener" style="text-decoration:none"
           href="https://wa.me/?text=${encodeURIComponent(t('share_msg', trip.name, link))}">${t('wa')}</a>
      </div>
      <div class="note">${ONLINE ? t('inv_note_online') : t('inv_note_local')}</div>
    </div>
    <div class="card">
      <h3>${t('deadline')}</h3>
      <p class="muted small" style="margin-bottom:.7rem">${t('deadline_hint')}</p>
      <div class="deadline-row">
        <input type="datetime-local" id="deadlineInput" value="${suggested}">
        <button class="btn" id="deadlineSave">${t('save')}</button>
        ${trip.deadline ? `<button class="btn-ghost" id="deadlineRemove">${t('remove')}</button>` : ''}
      </div>
      ${trip.deadline ? `<p class="deadline-status" id="deadlineBadge">${deadlineText()}</p>` : ''}
    </div>
    <div class="card">
      <h3>${t('members')} (${trip.members.length})</h3>
      ${membersHTML()}
      ${trip.members.length < 2 ? `<div class="loading small"><span class="spinner"></span>${t('waiting')}</div>` : ''}
    </div>
    <div class="actions">
      <button class="btn-ghost" id="backBtn">${t('back')}</button>
      <button class="btn" id="inviteNext">${t('start_voting')}</button>
    </div>`;

  $('#copyBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(link); }
    catch (e) { $('#linkInput').select(); document.execCommand('copy'); }
    toast(t('copied'));
  };
  $('#deadlineSave').onclick = () => {
    const v = $('#deadlineInput').value;
    if (!v || new Date(v).getTime() <= Date.now()) return toast(t('deadline_past'));
    trip.deadline = new Date(v).toISOString();
    save(); pushCore(); renderInvite(); toast(t('deadline_saved'));
  };
  if ($('#deadlineRemove')) $('#deadlineRemove').onclick = () => {
    trip.deadline = null;
    save(); pushCore(); renderInvite(); toast(t('deadline_removed'));
  };
  $('#backBtn').onclick = () => goStep(1);
  $('#inviteNext').onclick = () => goStep(3);
}

/* ---------- Voting deadline ---------- */
const votingClosed = () => !!trip.deadline && Date.now() >= Date.parse(trip.deadline);
const canVote = () => !votingClosed() || isAdmin();
function deadlineText() {
  if (!trip.deadline) return '';
  const ms = Date.parse(trip.deadline) - Date.now();
  if (ms <= 0) return t('voting_closed');
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return t('ends_in', t('dur', d, h, m));
}

/* ---------- Members list ---------- */
function hasVoted(id) {
  const v = trip.votes[id];
  return !!v && [...Object.values(v.hotels || {}), ...Object.values(v.spots || {})].some((a) => a.length);
}
function membersHTML() {
  return trip.members.map((m) => `
    <div class="member">
      <div class="m-av" style="background:${avColor(m.name)}">${esc([...m.name][0].toUpperCase())}</div>
      <div><b>${esc(m.name)}</b>${m.id === me ? ` <span class="you">(${t('you_tag')})</span>` : ''}
        ${m.role === 'admin' ? `<div class="role">${t('admin_role')}</div>` : ''}</div>
      <span class="status ${hasVoted(m.id) ? '' : 'wait'}">${hasVoted(m.id) ? t('voted') : t('not_voted')}</span>
    </div>`).join('');
}

/* ---------- Joining through a link: type your name, you're in ---------- */
async function handleJoin() {
  const m = location.hash.match(/^#join=(.+)$/);
  if (!m) return false;
  const code = m[1];
  history.replaceState(null, '', location.pathname + location.search);
  show('home');

  if (/^[a-z0-9]{6,12}$/.test(code)) { // short link → shared trip in the database
    if (!ONLINE) { toast(t('invalid_link')); return true; }
    openModal(`<div class="loading"><span class="spinner"></span>${t('opening_trip')}</div>`);
    let data = null;
    try { data = await db('GET', code); } catch (e) {}
    if (!data) { closeModal(); toast(t('trip_not_found')); return true; }
    trip = { id: code };
    trip = fromRemote(data);
  } else { // offline link with the trip details inside
    let data;
    try { data = decodeTrip(code); } catch (e) { toast(t('invalid_link')); return true; }
    const existing = loadTrip(data.id);
    trip = normalize(existing
      ? { ...existing, ...data, members: existing.members, votes: existing.votes, custom: mergeCustom(existing.custom, data.custom) }
      : { ...data, members: [{ id: 'admin', name: data.admin, role: 'admin', at: 0 }], votes: {} });
  }
  loadAllSugg();

  // Already joined on this device? Go straight in.
  const saved = store.get('me_' + trip.id);
  const known = trip.members.find((x) => x.id === saved);
  if (known) {
    me = known.id; cityTab = 0; closeModal(); save();
    goStep(3); toast(t('welcome_back', known.name));
    return true;
  }

  const places = trip.dests.map((d) => d.name).join(lang === 'ar' ? '، ' : ', ');
  openModal(`
    <h2>${esc(t('join_title', trip.name))}</h2>
    <p class="muted" style="margin:.5rem 0 1rem">${esc(t('join_sub', trip.admin, places))}</p>
    <label class="field"><span>${t('your_name')}</span><input id="joinName" maxlength="40" placeholder="${t('your_name_ph')}"></label>
    <div class="actions"><button class="btn" id="joinOk">${t('join_ok')}</button></div>`);
  $('#joinName').focus();
  $('#joinOk').onclick = async () => {
    const n = $('#joinName').value.trim();
    if (!n) return toast(t('enter_name'));
    // Same name as an existing member → it's the same person on another device
    let member = trip.members.find((x) => x.name.toLowerCase() === n.toLowerCase());
    if (!member) {
      member = { id: uid(), name: n, role: 'member', at: Date.now() };
      trip.members.push(member);
      if (ONLINE) await pushMember(member); // everyone sees the new member right away
    }
    me = member.id; cityTab = 0;
    save(); closeModal(); goStep(3);
    toast(t('welcome', member.name));
  };
  $('#joinName').onkeydown = (e) => { if (e.key === 'Enter') $('#joinOk').click(); };
  return true;
}
