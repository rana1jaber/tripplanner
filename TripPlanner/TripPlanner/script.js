/* =========================================================
   TripPlanner – group trip planner (English / العربية)
   - Destinations are free text: any city or country.
   - Hotels & attractions are searched live on OpenStreetMap
     (Nominatim search inside the destination's area),
     and any member can suggest their own.
   - Members join by opening the invite link and typing their name.
   ========================================================= */

/* =========================================================
   SHARED DATABASE (Firebase Realtime Database) — setup, ~5 minutes:
   1. Go to https://console.firebase.google.com → "Add project" (any name).
   2. In the project: Build → Realtime Database → Create Database → "Start in test mode".
   3. Copy the database link shown at the top (it ends with firebaseio.com or firebasedatabase.app)
      and paste it below between the quotes.
   With the link, everyone who opens the invite link is added for all members
   and votes update live. Left empty, the site still works but each person
   only sees what is on their own device.
   ========================================================= */
const FIREBASE_URL = '';
const ONLINE = /^https:\/\//.test(FIREBASE_URL);
const DB_URL = FIREBASE_URL.replace(/\/+$/, '');

/* ---------- Language ---------- */
let lang = (() => { try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; } })();
const L = () => (lang === 'ar' ? 1 : 0); // index into [en, ar] pairs

const STR = {
  en: {
    nav_home: 'Home', nav_trips: 'My Trips', lang_btn: 'العربية', dark_mode: 'Dark mode', light_mode: 'Light mode',
    hero_title: 'Plan Together.<br>Travel Better.',
    hero_sub: 'Create your dream trip, invite your friends, and let everyone vote on the perfect hotels and attractions.',
    join_ph: 'Paste your trip link', join_btn: 'Join Trip', new_trip: '+ Start a new trip',
    hero_p1: 'Beaches', hero_p2: 'Cities', hero_p3: 'Adventures',
    f1_t: 'Plan Your Trip', f1_p: 'Add dates, destinations and days in each place.',
    f2_t: 'Invite Friends', f2_p: 'Share one link and get everyone involved.',
    f3_t: 'Vote Together', f3_p: 'Choose the best hotels and attractions.',
    f4_t: 'Get Your Itinerary', f4_p: 'A day-by-day final plan with costs and details.',
    steps: [['Plan', 'Dates & destinations'], ['Invite', 'Share with your friends'], ['Vote', 'Choose together'], ['Itinerary', 'See the final plan']],
    solo_step: 'Solo trip – no invites needed', admin_step: 'Set by the trip organizer',
    default_trip: 'My Trip',
    plan_title: 'Plan Your Trip', plan_sub: 'Start by setting your dates, destinations and travel details.',
    f_name: 'Trip name', f_admin: 'Your name (organizer)', f_admin_ph: 'e.g. Rana',
    f_start: 'Start date', f_end: 'End date', f_trav: 'Travelers', f_cur: 'Currency',
    dests: 'Destinations', dests_sub: 'Type any city or country you want to visit, then pick it from the list and set the number of days.',
    dest_ph: 'e.g. Jeddah', searching: 'Searching…', no_match: 'No matches found — you can keep what you typed',
    add_dest: '+ Add destination', next: 'Next →', back: '← Back', delete: 'Delete',
    need_name: 'Please enter your name first', need_dest: 'Add at least one destination', need_dest_name: 'Type a name for every destination',
    end_before_start: "The end date can't be before the start date",
    alloc_ok: (n) => `✓ All ${t('days', n)} of the trip are planned`,
    alloc_less: (r) => `⚠️ You haven't planned all your trip days yet — ${t('days', r)} left. Add days to a destination or change the end date.`,
    alloc_more: (r) => `⚠️ Your destinations add up to ${t('days', r)} more than your trip dates. Remove days or extend the end date.`,
    split_even: 'Split days evenly',
    setup_title: 'Before we continue 👋',
    q_mode: 'Is this trip just for you, or are other members joining?',
    solo_t: 'Just me', solo_s: 'I pick the hotels and places myself',
    group_t: 'More than one member', group_s: 'We share a link and everyone votes',
    q_hotel: 'Do you prefer one hotel for the whole stay, or mixing hotels?',
    single_t: 'One hotel', single_s: 'Same hotel for the whole stay in each destination',
    mixed_t: 'Mix hotels', mixed_s: 'Two hotels per destination, nights split between them',
    continue: 'Continue →', answer_all: 'Please answer both questions',
    inv_title: 'Invite Trip Members', inv_sub: 'Send this link to your friends. Whoever opens it types their name and joins the trip automatically.',
    link_title: 'Trip link', copy: 'Copy', copied: 'Link copied ✓', wa: 'Share on WhatsApp',
    inv_note_online: '💡 New members appear in the list below as soon as they join — no need to add anyone yourself.',
    inv_note_local: '⚠️ Shared mode is off: friends can open the link and vote on their own device, but they won\'t appear on your screen. To connect everyone, add your Firebase database link at the top of script.js (steps are written there). The site must also be online (e.g. GitHub Pages) for the link to open on other devices.',
    members: 'Trip members', waiting: 'Waiting for friends to join…', you_tag: 'you',
    start_voting: 'Start voting →',
    admin_role: '👑 Trip admin', voted: '✓ Voted', not_voted: 'Not voted yet',
    share_msg: (name, link) => `Join our trip "${name}" and vote on hotels and places: ${link}`,
    invalid_link: 'Invalid link — make sure it is a trip link', trip_not_found: 'This trip was not found — the link may be wrong or the trip was deleted',
    opening_trip: 'Opening the trip…', sync_error: "Couldn't save to the shared database — check your internet",
    join_title: (n) => `Join "${n}" ✈️`,
    join_sub: (a, c) => `${a} invited you to vote on hotels and attractions in ${c}.`,
    your_name: 'Your name', your_name_ph: 'e.g. Sara', join_ok: 'Join & start voting →',
    welcome: (n) => `Welcome ${n}! Start voting`, welcome_back: (n) => `Welcome back ${n}!`, enter_name: 'Please enter your name',
    travelers: (n) => `${n} ${n === 1 ? 'traveler' : 'travelers'}`,
    voting_as: 'Voting as',
    vote_hotels: (c) => `Hotel Voting – ${c}`, pick_hotels: (c) => `Choose a Hotel – ${c}`,
    hint_mixed: (c, d) => `Pick up to two hotels — we'll split the ${d} in ${c} between the top two.`,
    hint_single: (c, d) => `Pick one hotel for your whole stay in ${c} (${d}).`,
    votes: (n) => `${n} ${n === 1 ? 'vote' : 'votes'}`,
    per_night: '/ night', price_unknown: 'Price not set', vote: 'Vote', pick: 'Select', picked: '✓ Selected',
    current_votes: 'Current votes', on_map: 'Map ↗', website: 'Website ↗', stars: (n) => `${'★'.repeat(n)} ${n}-star`,
    spots_title: (c) => `Attractions in ${c}`, spots_sub: (n) => `Pick up to ${n} places (two per day: morning & evening).`,
    max_two: 'You can pick two hotels only — remove one first', max_spots: (n) => `Maximum ${n} places for this destination`,
    next_city: (c) => `Next: ${c} →`, show_plan: 'View final itinerary →', need_hotel: (c) => `Pick a hotel in ${c} first`,
    no_stay: '✈️ This is the last day of the trip, so no hotel is needed here.',
    loading_sugg: (c) => `Finding hotels and places in ${c}…`,
    sugg_error: "Couldn't load suggestions right now (check your internet). You can still add your own below.", retry: 'Try again',
    no_hotels: (c) => `No hotels found for ${c} — suggest one below.`, no_spots: (c) => `No attractions found for ${c} — suggest one below.`,
    hotel_name_ph: 'Hotel name', price_ph: 'Price per night (optional)', place_name_ph: 'Place name',
    suggest_hotel: 'Suggest a hotel', suggest_spot: 'Suggest a place', suggested_by: (n) => `Suggested by ${n}`, need_item_name: 'Type a name first',
    osm_credit: 'Hotel & place suggestions: © OpenStreetMap contributors',
    final_title: 'Your Final Itinerary 🎉', final_group: "Here's the complete plan based on everyone's votes!", final_solo: "Here's the complete plan based on your choices!",
    still_loading: 'Some suggestions are still loading — the plan will update automatically.',
    pdf: '⬇ Download PDF', day_n: (n) => `Day ${n}`, morning: 'Morning', evening: 'Evening', free_time: 'Free time',
    stay: '🛏 Staying at:', departure: '✈️ Departure day', hotel_tbd: 'Hotel to be decided',
    costs_title: 'Trip Cost Breakdown',
    costs_sub: (r, n, t) => `Estimates — the organizer can edit the amounts to match the budget. ${r} rooms, ${n} nights, ${t} travelers.`,
    c_hotels: 'Hotels', c_transport: 'Transportation', c_activities: 'Activities & Tickets', c_food: 'Food & Dining',
    u_hotel: 'per night (when no price is set)', u_person: 'per person', u_person_day: 'per person / day',
    total: 'Total estimated cost', per_person_n: (n) => `Per person (${n})`,
    members_title: 'Trip Members', stay_type: '🏨 Stay type:', stay_mixed: 'Mixing hotels', stay_single: 'One hotel per destination',
    back_vote: '← Back to voting', share_link: 'Share link', home: 'Home', no_trips: 'No trips yet — start a new one',
    days: (n) => `${n} ${n === 1 ? 'day' : 'days'}`, nights: (n) => `${n} ${n === 1 ? 'night' : 'nights'}`,
  },
  ar: {
    nav_home: 'الرئيسية', nav_trips: 'رحلاتي', lang_btn: 'English', dark_mode: 'الوضع الداكن', light_mode: 'الوضع الفاتح',
    hero_title: 'خطّطوا معًا.<br>سافروا أفضل.',
    hero_sub: 'أنشئ رحلة أحلامك، ادعُ أصدقاءك، ودع الجميع يصوّت على أفضل الفنادق والأماكن السياحية.',
    join_ph: 'الصق رابط الرحلة هنا', join_btn: 'انضم للرحلة', new_trip: '+ ابدأ رحلة جديدة',
    hero_p1: 'شواطئ', hero_p2: 'مدن', hero_p3: 'مغامرات',
    f1_t: 'خطّط لرحلتك', f1_p: 'حدد التواريخ والوجهات وعدد الأيام في كل وجهة.',
    f2_t: 'ادعُ أصدقاءك', f2_p: 'شارك رابطًا واحدًا ليشارك الجميع في القرار.',
    f3_t: 'صوّتوا معًا', f3_p: 'اختاروا أفضل الفنادق والأماكن السياحية.',
    f4_t: 'احصل على برنامجك', f4_p: 'خطة نهائية يومًا بيوم مع التكاليف والتفاصيل.',
    steps: [['التخطيط', 'التواريخ والوجهات'], ['الدعوة', 'شارك الرابط مع أصدقائك'], ['التصويت', 'اختاروا معًا'], ['البرنامج', 'الخطة النهائية']],
    solo_step: 'رحلة فردية – لا حاجة للدعوة', admin_step: 'يحدده منظّم الرحلة',
    default_trip: 'رحلتي',
    plan_title: 'خطّط لرحلتك', plan_sub: 'ابدأ بتحديد التواريخ والوجهات وتفاصيل السفر.',
    f_name: 'اسم الرحلة', f_admin: 'اسمك (منظّم الرحلة)', f_admin_ph: 'مثال: رنا',
    f_start: 'تاريخ البداية', f_end: 'تاريخ النهاية', f_trav: 'عدد المسافرين', f_cur: 'العملة',
    dests: 'الوجهات', dests_sub: 'اكتب أي مدينة أو دولة تريد زيارتها، ثم اخترها من القائمة وحدد عدد الأيام.',
    dest_ph: 'مثال: جدة', searching: 'جارٍ البحث…', no_match: 'لا توجد نتائج — يمكنك الإبقاء على ما كتبته',
    add_dest: '+ إضافة وجهة', next: 'التالي ←', back: '→ رجوع', delete: 'حذف',
    need_name: 'اكتب اسمك أولًا', need_dest: 'أضف وجهة واحدة على الأقل', need_dest_name: 'اكتب اسم كل وجهة',
    end_before_start: 'تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية',
    alloc_ok: (n) => `✓ تم توزيع كل أيام الرحلة (${t('days', n)})`,
    alloc_less: (r) => `⚠️ لم توزّع كل أيام الرحلة بعد — باقي ${t('days', r)}. أضف أيامًا لإحدى الوجهات أو غيّر تاريخ النهاية.`,
    alloc_more: (r) => `⚠️ أيام الوجهات أكثر من مدة الرحلة بـ ${t('days', r)}. قلّل الأيام أو مدّد تاريخ النهاية.`,
    split_even: 'وزّع الأيام بالتساوي',
    setup_title: 'قبل ما نكمل 👋',
    q_mode: 'هل الرحلة لك وحدك أم معك أعضاء آخرون؟',
    solo_t: 'أنا فقط', solo_s: 'أختار الفنادق والأماكن بنفسي',
    group_t: 'أكثر من عضو', group_s: 'نشارك رابطًا ويصوّت الجميع',
    q_hotel: 'هل تفضّلون فندقًا واحدًا طوال الإقامة أم التنويع؟',
    single_t: 'فندق واحد', single_s: 'نفس الفندق طوال الإقامة في كل وجهة',
    mixed_t: 'ننوّع الفنادق', mixed_s: 'فندقان في كل وجهة وتُقسَّم الليالي بينهما',
    continue: 'متابعة ←', answer_all: 'اختر إجابة لكل سؤال',
    inv_title: 'ادعُ أعضاء الرحلة', inv_sub: 'أرسل هذا الرابط لأصدقائك، وكل من يفتحه يكتب اسمه وينضم للرحلة تلقائيًا.',
    link_title: 'رابط الرحلة', copy: 'نسخ', copied: 'تم نسخ الرابط ✓', wa: 'مشاركة عبر واتساب',
    inv_note_online: '💡 الأعضاء الجدد يظهرون في القائمة بالأسفل فور انضمامهم — لا حاجة لإضافة أحد بنفسك.',
    inv_note_local: '⚠️ وضع المشاركة غير مفعّل: أصدقاؤك يقدرون يفتحون الرابط ويصوّتون على أجهزتهم، لكن لن يظهروا عندك. لربط الجميع أضف رابط قاعدة بيانات Firebase في أعلى ملف script.js (الخطوات مكتوبة هناك). ولازم يكون الموقع مرفوعًا على الإنترنت (مثل GitHub Pages) لكي يفتح الرابط على الأجهزة الأخرى.',
    members: 'أعضاء الرحلة', waiting: 'بانتظار انضمام أصدقائك…', you_tag: 'أنت',
    start_voting: 'ابدأ التصويت ←',
    admin_role: '👑 منظّم الرحلة', voted: '✓ صوّت', not_voted: 'لم يصوّت بعد',
    share_msg: (name, link) => `انضم لرحلتنا «${name}» وصوّت على الفنادق والأماكن: ${link}`,
    invalid_link: 'الرابط غير صحيح — تأكد أنه رابط رحلة', trip_not_found: 'لم نجد هذه الرحلة — ربما الرابط غير صحيح أو حُذفت الرحلة',
    opening_trip: 'جارٍ فتح الرحلة…', sync_error: 'تعذّر الحفظ في قاعدة البيانات المشتركة — تأكد من الإنترنت',
    join_title: (n) => `انضم إلى «${n}» ✈️`,
    join_sub: (a, c) => `دعاك ${a} للتصويت على الفنادق والأماكن السياحية في ${c}.`,
    your_name: 'اكتب اسمك', your_name_ph: 'مثال: سارة', join_ok: 'انضمام وبدء التصويت ←',
    welcome: (n) => `أهلًا ${n}! ابدأ التصويت`, welcome_back: (n) => `أهلًا بعودتك ${n}!`, enter_name: 'اكتب اسمك',
    travelers: (n) => `${n} ${n > 2 && n < 11 ? 'مسافرين' : 'مسافر'}`,
    voting_as: 'تصوّت باسم',
    vote_hotels: (c) => `تصويت الفنادق – ${c}`, pick_hotels: (c) => `اختيار الفندق – ${c}`,
    hint_mixed: (c, d) => `اختر حتى فندقين — سنقسم ${d} في ${c} بين الفندقين الأعلى تصويتًا.`,
    hint_single: (c, d) => `اختر فندقًا واحدًا لكامل الإقامة في ${c} (${d}).`,
    votes: (n) => `${n} صوت`,
    per_night: '/ الليلة', price_unknown: 'السعر غير محدد', vote: 'صوّت', pick: 'اختر', picked: '✓ تم اختياره',
    current_votes: 'الأصوات الحالية', on_map: 'الخريطة ↗', website: 'الموقع ↗', stars: (n) => `${'★'.repeat(n)} ${n} نجوم`,
    spots_title: (c) => `الأماكن السياحية في ${c}`, spots_sub: (n) => `اختر حتى ${n} أماكن (مكانان لكل يوم: صباحًا ومساءً).`,
    max_two: 'يمكنك اختيار فندقين فقط، ألغِ أحدهما أولًا', max_spots: (n) => `الحد الأقصى ${n} أماكن لهذه الوجهة`,
    next_city: (c) => `التالي: ${c} ←`, show_plan: 'عرض البرنامج النهائي ←', need_hotel: (c) => `اختر فندقًا في ${c} أولًا`,
    no_stay: '✈️ هذا آخر يوم في الرحلة، لذلك لا حاجة لفندق هنا.',
    loading_sugg: (c) => `نبحث عن الفنادق والأماكن في ${c}…`,
    sugg_error: 'تعذّر تحميل الاقتراحات الآن (تأكد من الإنترنت). يمكنك إضافة اقتراحاتك بالأسفل.', retry: 'إعادة المحاولة',
    no_hotels: (c) => `لم نجد فنادق في ${c} — اقترح فندقًا بالأسفل.`, no_spots: (c) => `لم نجد أماكن سياحية في ${c} — اقترح مكانًا بالأسفل.`,
    hotel_name_ph: 'اسم الفندق', price_ph: 'السعر لليلة (اختياري)', place_name_ph: 'اسم المكان',
    suggest_hotel: 'اقترح فندقًا', suggest_spot: 'اقترح مكانًا', suggested_by: (n) => `اقترحه ${n}`, need_item_name: 'اكتب الاسم أولًا',
    osm_credit: 'اقتراحات الفنادق والأماكن: © مساهمو OpenStreetMap',
    final_title: 'برنامجك النهائي 🎉', final_group: 'الخطة الكاملة بناءً على أصوات الجميع!', final_solo: 'الخطة الكاملة بناءً على اختياراتك!',
    still_loading: 'بعض الاقتراحات ما زالت تُحمَّل — سيتحدّث البرنامج تلقائيًا.',
    pdf: '⬇ تحميل PDF', day_n: (n) => `اليوم ${n}`, morning: 'صباحًا', evening: 'مساءً', free_time: 'وقت حر',
    stay: '🛏 المبيت:', departure: '✈️ يوم المغادرة', hotel_tbd: 'الفندق لم يُحدَّد بعد',
    costs_title: 'تفاصيل التكاليف',
    costs_sub: (r, n, t) => `تقديرية — يقدر منظّم الرحلة تعديل المبالغ حسب الميزانية. ${r} غرف، ${n} ليالٍ، ${t} مسافرين.`,
    c_hotels: 'الفنادق', c_transport: 'المواصلات', c_activities: 'الأنشطة والتذاكر', c_food: 'الطعام',
    u_hotel: 'لليلة (عند عدم تحديد السعر)', u_person: 'للشخص', u_person_day: 'للشخص / يوم',
    total: 'التكلفة الإجمالية التقديرية', per_person_n: (n) => `للشخص الواحد (${n})`,
    members_title: 'أعضاء الرحلة', stay_type: '🏨 نوع الإقامة:', stay_mixed: 'تنويع الفنادق', stay_single: 'فندق واحد في كل وجهة',
    back_vote: '→ الرجوع للتصويت', share_link: 'مشاركة الرابط', home: 'الصفحة الرئيسية', no_trips: 'لا توجد رحلات بعد — ابدأ رحلة جديدة',
    days: (n) => `${n} ${n > 2 && n < 11 ? 'أيام' : 'يوم'}`, nights: (n) => `${n} ${n > 2 && n < 11 ? 'ليالٍ' : 'ليلة'}`,
  },
};
const t = (key, ...args) => { const v = STR[lang][key]; return typeof v === 'function' ? v(...args) : v; };

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
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/* ---------- State ---------- */
let trip = null;   // current trip
let step = 1;      // current wizard step
let me = null;     // my member id in this trip
let cityTab = 0;   // destination shown on the voting page
const SUGG = {};   // loaded suggestions per destination: { status, hotels, spots }

/* ---------- Helpers ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
};
// Parse "YYYY-MM-DD" as a local date (new Date("2026-10-01") is UTC and can shift a day)
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
const sym = () => CURRENCIES[trip.currency].sym[L()];
const money = (v) => sym() + Math.round(v).toLocaleString('en');
const roundNice = (x) => (x >= 20 ? Math.round(x) : Math.round(x * 10) / 10);
const avColor = (name) => AV_COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV_COLORS.length];
const hue = (s) => [...(s || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;
const destGrad = (d, a = 135) => { const h = hue(d.name.trim().toLowerCase()); return `linear-gradient(${a}deg, hsl(${h} 42% 52%), hsl(${(h + 40) % 360} 58% 76%))`; };
const itemName = (it) => (it.names ? it.names[lang] || it.names.en : it.name);
const mapLink = (it, d) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(itemName(it) + ', ' + d.name)}`;
const meMember = () => trip && trip.members.find((m) => m.id === me);
const isAdmin = () => !trip.created || meMember()?.role === 'admin';

// Distribute the trip days evenly between destinations (extra days go to the first ones)
function distributeDays() {
  const n = trip.dests.length, T = tripDays();
  if (!n) return;
  const base = Math.floor(T / n), extra = T % n;
  trip.dests.forEach((d, i) => (d.days = Math.max(1, base + (i < extra ? 1 : 0))));
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; }

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
  $('#themeBtn').title = $('#themeBtn').ariaLabel = theme === 'dark' ? t('light_mode') : t('dark_mode');
}

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
  return tr;
}
const arr = (x) => (Array.isArray(x) ? x.filter((v) => v != null) : x ? Object.values(x) : []);

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
    created: false,   // true once the trip is set up (and shared, when online)
  };
}

/* =========================================================
   Shared database (Firebase REST API + live updates)
   ========================================================= */
async function db(method, path, body) {
  const r = await fetch(`${DB_URL}/trips/${path}.json`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error('DB ' + r.status);
  return r.json();
}
const dbSafe = (...a) => (ONLINE ? db(...a).catch(() => toast(t('sync_error'))) : Promise.resolve());

const CORE = ['name', 'admin', 'start', 'end', 'travelers', 'currency', 'mode', 'hotelMode', 'dests', 'budget', 'created'];
const coreOf = () => Object.fromEntries(CORE.map((k) => [k, trip[k]]));

// Local shape → database shape (lists become objects keyed by id so people never overwrite each other)
function toRemote() {
  const custom = {};
  for (const [did, c] of Object.entries(trip.custom)) {
    custom[did] = {
      hotels: Object.fromEntries(c.hotels.map((h) => [h.id, h])),
      spots: Object.fromEntries(c.spots.map((s) => [s.id, s])),
    };
  }
  const members = Object.fromEntries(trip.members.map(({ id, ...m }) => [id, m]));
  return { ...coreOf(), members, votes: trip.votes, custom };
}
// Database shape → local shape
function fromRemote(data) {
  const byTime = (a, b) => (a.at || 0) - (b.at || 0);
  const tr = { ...data, id: trip && trip.id };
  tr.members = Object.entries(data.members || {}).map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : byTime(a, b)));
  tr.votes = {};
  for (const [id, v] of Object.entries(data.votes || {})) {
    const fix = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, x]) => [k, arr(x)]));
    tr.votes[id] = { hotels: fix(v.hotels), spots: fix(v.spots) };
  }
  tr.custom = {};
  for (const [did, c] of Object.entries(data.custom || {})) {
    tr.custom[did] = { hotels: arr(c.hotels).sort(byTime), spots: arr(c.spots).sort(byTime) };
  }
  return normalize(tr);
}

let coreTimer;
function pushCore() { // organizer's edits (dates, destinations, budget…) — debounced while typing
  if (!ONLINE || !trip.created) return;
  clearTimeout(coreTimer);
  const id = trip.id, core = coreOf();
  coreTimer = setTimeout(() => dbSafe('PATCH', id, core), 500);
}
const pushMember = (m) => dbSafe('PUT', `${trip.id}/members/${m.id}`, { name: m.name, role: m.role, at: m.at });
const pushVote = () => dbSafe('PUT', `${trip.id}/votes/${me}`, myVote());
const pushCustom = (destId, kind, item) => dbSafe('PUT', `${trip.id}/custom/${destId}/${kind}/${item.id}`, item);

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

/* =========================================================
   OpenStreetMap: search places, load hotels & attractions
   ========================================================= */
let netQueue = Promise.resolve(); // one request at a time (be polite to the free servers)
const enqueue = (fn) => { const p = netQueue.then(fn, fn); netQueue = p.catch(() => {}); return p; };

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

/* ---- Hotels & attractions: search Nominatim inside the destination's area ---- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
      const cached = JSON.parse(store.get('sugg2_' + key0));
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
        Object.assign(d, { lat: p.lat, lon: p.lon, osm: p.osm, bbox: p.bbox, sub: d.sub || p.sub });
        SUGG[suggKey(d)] = SUGG[key0]; // same request under the new key, so it isn't started twice
        if (trip) save();
      }
      const res = await searchPlaces(d, (hotels) => {
        // show hotels right away while attractions keep loading
        SUGG[key0] = SUGG[suggKey(d)] = { status: 'loading', hotels, spots: [] };
        onSuggUpdate();
      });
      result = { status: 'ok', ...res };
      store.set('sugg2_' + suggKey(d), JSON.stringify(res));
    } catch (e) {
      result = { status: 'error', hotels: [], spots: [] };
    }
    SUGG[key0] = SUGG[suggKey(d)] = result;
    onSuggUpdate();
  });
}
const loadAllSugg = () => trip.dests.forEach((d) => loadSugg(d));
const onSuggUpdate = () => { if (step === 3 || step === 4) refreshView(); };

/* ---------- Navigation ---------- */
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

/* =========================================================
   Step 1: Plan (organizer only)
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
      <label class="field"><span>${t('f_start')}</span><input type="date" id="fStart" value="${trip.start}"></label>
      <label class="field"><span>${t('f_end')}</span><input type="date" id="fEnd"></label>
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
    // Convert the budget and suggested prices to the new currency
    const f = CURRENCIES[e.target.value].rate / CURRENCIES[trip.currency].rate;
    Object.keys(trip.budget).forEach((k) => (trip.budget[k] = roundNice(trip.budget[k] * f)));
    for (const [did, cu] of Object.entries(trip.custom)) {
      cu.hotels.forEach((h) => { if (h.price) { h.price = roundNice(h.price * f); if (trip.created) pushCustom(did, 'hotels', h); } });
    }
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

/* =========================================================
   Step 2: Invite (organizer)
   ========================================================= */
function renderInvite() {
  const c = $('#stepContent');
  const link = inviteLink();

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
  $('#backBtn').onclick = () => goStep(1);
  $('#inviteNext').onclick = () => goStep(3);
}

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
  history.replaceState(null, '', location.pathname);
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
    <label class="field"><span>${t('your_name')}</span><input id="joinName" placeholder="${t('your_name_ph')}"></label>
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

/* =========================================================
   Step 3: Vote
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

  c.innerHTML = `
    <div class="trip-head">
      <div><h1>${esc(trip.name)}</h1><p class="muted">${fmt(trip.start)} – ${fmt(endDate())} · ${t('travelers', trip.travelers)}</p></div>
      ${group && meMember() ? `<div class="voter">${t('voting_as')} <b>${esc(meMember().name)}</b></div>` : ''}
    </div>

    <div class="tabs">${trip.dests.map((x, i) =>
      `<button class="tab ${i === cityTab ? 'active' : ''}" data-tab="${i}">📍 ${esc(x.name)}</button>`).join('')}</div>
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
          <div class="h-img" style="background:${destGrad(d, 160 + i * 30)}">${HOTEL_ICONS[i % HOTEL_ICONS.length]}
            ${group ? `<span class="h-votes">${t('votes', hc[h.id] || 0)}</span>` : ''}</div>
          <div class="h-body">
            <b>${esc(itemName(h))}</b>
            <span class="rate">${h.stars ? `<b>${t('stars', h.stars)}</b>` : h.by ? esc(t('suggested_by', h.by)) : '&nbsp;'}</span>
            <span class="price">${h.price ? `${money(h.price)} <small>${t('per_night')}</small>` : `<small>${t('price_unknown')}</small>`}</span>
            <span class="links"><a class="map-link" href="${mapLink(h, d)}" target="_blank" rel="noopener">${t('on_map')}</a>
              ${h.website ? `<a class="map-link" href="${esc(h.website)}" target="_blank" rel="noopener">${t('website')}</a>` : ''}</span>
            <button class="btn" data-hotel="${h.id}">${myH.includes(h.id) ? t('picked') : group ? t('vote') : t('pick')}</button>
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
        <input id="newHotel" placeholder="${t('hotel_name_ph')}">
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
        <div class="spot ${myS.includes(s.id) ? 'on' : ''}" data-spot="${s.id}" role="button" tabindex="0">
          <span class="spot-emoji">${ty[2]}</span>
          <span><b>${esc(itemName(s))}</b><small>${s.by ? esc(t('suggested_by', s.by)) : ty[L()]}${group ? ` · ${t('votes', sc[s.id] || 0)}` : ''}
            · <a class="map-link" href="${mapLink(s, d)}" target="_blank" rel="noopener">${t('on_map')}</a></small></span>
          <span class="check">✓</span>
        </div>`;
      }).join('')}
      </div>
      <div class="add-item">
        <input id="newSpot" placeholder="${t('place_name_ph')}">
        <button class="btn-outline" id="addSpot">+ ${t('suggest_spot')}</button>
      </div>
    </section>

    <div class="actions">
      ${showBack ? `<button class="btn-ghost" id="voteBack">${t('back')}</button>` : ''}
      <button class="btn" id="voteNext">${cityTab < trip.dests.length - 1 ? esc(t('next_city', trip.dests[cityTab + 1].name)) : t('show_plan')}</button>
    </div>`;

  const voted = () => { save(); pushVote(); renderVote(); };
  const toggleSpot = (id) => {
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

    const hb = e.target.closest('[data-hotel]');
    if (hb) {
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
    if (nights > 0 && hotels.length && !(v.hotels[d.id] || []).length) return toast(t('need_hotel', cn));
    if (cityTab < trip.dests.length - 1) { cityTab++; renderVote(); window.scrollTo(0, 0); }
    else goStep(4);
  };
}

/* =========================================================
   Step 4: Final itinerary + costs
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
  return `<div class="slot"><span class="spot-emoji">${ty[2]}</span><span><b>${esc(itemName(s))}</b><small>${label}</small></span></div>`;
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
      <button class="btn-outline no-print" id="pdfBtn">${t('pdf')}</button>
    </div>
    ${loading ? `<div class="loading no-print"><span class="spinner"></span>${t('still_loading')}</div>` : ''}

    ${plan.cities.map((pc) => `
      <section class="city-block">
        <div class="banner" style="background:${destGrad(pc.d)}">
          <div><h2>📍 ${esc(pc.d.name)}</h2><p>${t('days', pc.d.days)} · ${fmt(pc.from)} – ${fmt(pc.to)}</p></div>
          <div class="banner-hotels">${pc.hotels.map((h) => `
            <div class="hchip">🏨<div><b>${esc(itemName(h.hotel))}</b>
              <small>${h.hotel.stars ? '★ ' + h.hotel.stars + ' · ' : ''}${t('nights', h.nights)}${h.hotel.price ? ' · ' + money(h.hotel.price) + ' ' + t('per_night') : ''}${group ? ` · ${t('votes', h.votes)}` : ''}</small></div></div>`).join('')}
          </div>
        </div>
        <div class="days">${pc.days.map((day, i) => `
          <div class="day">
            <h3>${t('day_n', i + 1)}</h3>
            <div class="date">${fmtLong(day.date)}</div>
            ${slotHTML(day.morning, t('morning'))}
            ${slotHTML(day.evening, t('evening'))}
            <div class="stay">${day.hotel ? `${t('stay')} ${esc(itemName(day.hotel))}` : t('departure')}</div>
          </div>`).join('')}
        </div>
      </section>`).join('')}

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
  $('#pdfBtn').onclick = () => window.print();
  $('#itBack').onclick = () => { cityTab = 0; goStep(3); };
  $('#homeBtn').onclick = () => show('home');
  if ($('#shareAgain')) $('#shareAgain').onclick = () => goStep(2);
}

/* =========================================================
   Global events & startup
   ========================================================= */
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
document.querySelectorAll('.nav a').forEach((a) => (a.onclick = async (e) => {
  e.preventDefault();
  if (a.dataset.nav === 'home') return show('home');
  let last = trip || loadTrip(store.get('lastTrip'));
  if (!last) return toast(t('no_trips'));
  trip = last;
  me = me || store.get('me_' + trip.id);
  goStep(trip.mode ? (isAdmin() ? 4 : 3) : 1);
  if (ONLINE && trip.created) pull(); // get the latest from the shared database
}));

$('#modalX').onclick = closeModal;
$('#modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); };
window.addEventListener('hashchange', handleJoin);

// Start
applyLang();
handleJoin().then((joined) => { if (!joined) show('home'); });
