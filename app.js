'use strict';
/* Altklausuren Psycho 2 – Abfrage-App. Daten: data.js (QUESTIONS). Speicher nur lokal. */

const VERSION = '2.3';
const KEY = 'psyklausur-v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const FACH = { pers: 'Persönlichkeit', entw: 'Entwicklung', diag: 'Diagnostik' };
/* Originalklausuren in zeitlicher Reihenfolge: Schlüssel (q.e), Datum, Kurzname */
const EXAMS = [['2020w', '08.02.2020', 'Feb 2020'], ['2020', '24.07.2020', 'Jul 2020'], ['2021', '16.07.2021', 'Jul 2021'], ['2022', '11.02.2022', 'Feb 2022']];
const EXAM = {}, EXS = {};
EXAMS.forEach(([k, d, s]) => { EXAM[k] = d; EXS[k] = s; });
const ofExam = (ids, e) => ids.filter(id => BYID[id].e === e).sort((a, b) => BYID[a].n - BYID[b].n);
const MARK = {
  ABGLEICHEN: 'Abgleichen',
  SPEZIALWISSEN: 'Spezialwissen',
  UNSICHER: 'Schlüssel unsicher',
  FRAGESATZ_FEHLT: 'Fragesatz fehlt',
  NICHT_GEWERTET: 'Nicht gewertet',
};
const ICON = {
  pers: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>',
  entw: '<path d="M12 21V11"/><path d="M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5Z"/><path d="M12 11c0-3-2.3-5-5.5-5 0 3 2.3 5 5.5 5Z"/>',
  diag: '<path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V7"/><path d="M17 16v-7"/>',
  mix: '<path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.5"/><path d="M13 10.5c.9-1.9 2-3.5 3.5-3.5H20"/><path d="m17.5 4.5 2.5 2.5-2.5 2.5"/><path d="m17.5 14.5 2.5 2.5-2.5 2.5"/>',
  hist: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  grp: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H11v15H6.5A1.5 1.5 0 0 1 5 17.5Z"/><path d="M13 4h4.5A1.5 1.5 0 0 1 19 5.5v12a1.5 1.5 0 0 1-1.5 1.5H13Z"/><path d="M7.5 8h1.5M15.5 8H17M15.5 11H17"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
};
const SHORT = { pers: 'Persönl.', entw: 'Entwickl.' };
/* Reiter in Wischreihenfolge; die drei Bereiche teilen sich unten einen Punkt, bis man drin ist */
const TABS = [['pers', 'Persönlichkeit'], ['entw', 'Entwicklung'], ['diag', 'Diagnostik'], ['mix', 'Gemischt'], ['hist', 'Versuche']];
const ORDER = TABS.map(t => t[0]);
const EXAM_MIN = 90;
const GOALS = [6, 12, 20, 36];
const LVL = ['Neu', 'Gesehen', 'Sicher', 'Gemeistert'];

const BYID = {};
QUESTIONS.forEach(q => { BYID[q.id] = q; });

/* ---------- Speicher ---------- */
function blank() { return { v: 1, open: {}, done: [], set: {}, badges: {}, gone: {}, marks: {} }; }
function load() {
  let d = null;
  try {
    d = JSON.parse(localStorage.getItem(KEY));
    if (!(d && d.v === 1 && d.open && Array.isArray(d.done))) d = null;
  } catch (e) { d = null; }
  d = d || blank();
  d.set = Object.assign({ theme: 'system', fach: 'pers', goal: 12, examDate: null }, d.set || {});
  d.badges = d.badges || {};
  d.gone = d.gone || {};
  d.marks = d.marks || {};
  return d;
}
let DB = load();
function saveLocal() {
  HC = null;
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* voll oder gesperrt */ }
}
function save() { saveLocal(); syncSoon(); }
const tomb = id => { if (id) DB.gone[id] = Date.now(); };

/* ---------- Markierte Fragen („Mit Folien klären“): marks[id] = { on, note, t } ---------- */
const isMarked = id => !!(DB.marks[id] && DB.marks[id].on);
const markedIds = () => QUESTIONS.filter(q => isMarked(q.id)).map(q => q.id);
function setMark(id, on) { const m = DB.marks[id] || { note: '' }; DB.marks[id] = { on, note: m.note || '', t: Date.now() }; save(); }

/* ---------- Zusammenführen zweier Stände (Sync und Import) ----------
   Versuche: Vereinigung nach id, gelöschte (gone) bleiben weg. Offene Versuche je Reiter: der zuletzt benutzte gewinnt,
   der andere wandert mit seinen Antworten in die Versuche. Abzeichen: früheste Zeit. Tagesziel/Klausurdatum: neuere Änderung. */
function actT(r) { let t = Math.max(r.start || 0, r.end || 0); Object.values(r.at || {}).forEach(x => { if (x > t) t = x; }); return t; }
function validDB(d) { return !!(d && d.v === 1 && d.open && typeof d.open === 'object' && Array.isArray(d.done)); }
function merge(a, b) {
  const gone = Object.assign({}, b.gone || {}, a.gone || {});
  const done = {};
  const addDone = r => { if (!r || !r.id || gone[r.id]) return; const o = done[r.id]; if (!o || actT(r) > actT(o)) done[r.id] = r; };
  a.done.concat(b.done).forEach(addDone);
  const open = {};
  new Set(Object.keys(a.open).concat(Object.keys(b.open))).forEach(tab => {
    const c = [a.open[tab], b.open[tab]].filter(r => r && r.id && !gone[r.id] && !done[r.id]);
    if (!c.length) return;
    if (c.length === 2 && c[0].id !== c[1].id) {
      const [win, lose] = actT(c[1]) > actT(c[0]) ? [c[1], c[0]] : c;
      open[tab] = win;
      if (Object.keys(lose.ans || {}).length) addDone(Object.assign({}, lose, { end: lose.exam ? Math.min(actT(lose), lose.start + lose.limit) : actT(lose) }));
    } else open[tab] = c.length === 2 && actT(c[1]) > actT(c[0]) ? c[1] : c[0];
  });
  const badges = Object.assign({}, b.badges || {});
  Object.entries(a.badges || {}).forEach(([k, t]) => { if (!badges[k] || t < badges[k]) badges[k] = t; });
  const sa = a.set || {}, sb = b.set || {};
  const set = Object.assign({}, sa);
  if ((sb._t || 0) > (sa._t || 0)) ['goal', 'examDate', '_t'].forEach(k => { if (k in sb) set[k] = sb[k]; });
  /* Markierungen: je Frage gewinnt die neuere Änderung */
  const marks = Object.assign({}, b.marks || {});
  Object.entries(a.marks || {}).forEach(([k, m]) => { if (!marks[k] || (m.t || 0) >= (marks[k].t || 0)) marks[k] = m; });
  return { v: 1, open, done: Object.values(done).sort((x, y) => (x.end || x.start) - (y.end || y.start)), set, badges, gone, marks };
}

/* ---------- Synchronisation über Supabase (gleicher Code auf allen Geräten) ---------- */
const SB_URL = 'https://qbdpzamygonpruaafcrt.supabase.co';
const SB_KEY = 'sb_publishable_A7zukzk82Suux8jteQvLGA_WmXnZb14';
const SKEY = 'psyklausur-sync';
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let SY = { code: null, last: null };
try { SY = Object.assign(SY, JSON.parse(localStorage.getItem(SKEY)) || {}); } catch (e) { /* leer */ }
let syncSt = 'idle', syncT = 0, syncBusy = false, syncAgain = false, codeDraft = '', unlinkArmed = false;
function saveSY() { try { localStorage.setItem(SKEY, JSON.stringify({ code: SY.code, last: SY.last })); } catch (e) { /* egal */ } }
function newCode() {
  const r = new Uint32Array(12);
  crypto.getRandomValues(r);
  return fmtCode(Array.from(r, x => CODE_ABC[x % CODE_ABC.length]).join(''));
}
function fmtCode(raw) {
  const c = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 12 ? c.match(/.{4}/g).join('-') : null;
}
async function rpc(fn, body) {
  const r = await fetch(SB_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST', cache: 'no-store',
    headers: { apikey: SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
function syncSoon() { if (!SY.code) return; clearTimeout(syncT); syncT = setTimeout(syncNow, 2500); }
function syncRedraw(changed) {
  const h = location.hash;
  if (/^#set/.test(h) || (changed && !document.body.classList.contains('quiz'))) render();
}
async function syncNow() {
  clearTimeout(syncT);
  if (!SY.code) return;
  if (syncBusy) { syncAgain = true; return; }
  syncBusy = true; syncSt = 'busy'; syncRedraw(false);
  let changed = false;
  try {
    const remote = await rpc('psy_get', { p_code: SY.code });
    if (validDB(remote)) {
      const before = JSON.stringify(DB);
      DB = merge(DB, remote);
      DB.set = Object.assign({ theme: 'system', fach: 'pers', goal: 12, examDate: null }, DB.set);
      changed = JSON.stringify(DB) !== before;
      saveLocal();
    }
    await rpc('psy_put', { p_code: SY.code, p_data: DB });
    SY.last = Date.now(); saveSY();
    syncSt = 'ok';
  } catch (e) {
    syncSt = navigator.onLine === false ? 'offline' : 'err';
  }
  syncBusy = false;
  syncRedraw(changed);
  if (syncAgain) { syncAgain = false; syncSoon(); }
}
async function linkCode(code, isNew) {
  syncSt = 'busy'; render();
  try {
    if (!isNew) {
      const remote = await rpc('psy_get', { p_code: code });
      if (!validDB(remote)) { syncSt = 'idle'; toast('Code nicht gefunden'); render(); return; }
    }
    SY = { code, last: null }; saveSY(); codeDraft = '';
    syncSt = 'idle';
    await syncNow();
    if (syncSt === 'ok') toast(isNew ? 'Synchronisation eingerichtet' : 'Verbunden – Lernstand abgeglichen');
  } catch (e) { syncSt = 'idle'; toast('Keine Verbindung – bitte später nochmal'); render(); }
}

/* ---------- Sicherung als Datei ---------- */
async function exportFile() {
  const name = `psyklausur-sicherung-${dayKey(Date.now())}.json`;
  const blob = new Blob([JSON.stringify(DB)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function importFile(f) {
  const rd = new FileReader();
  rd.onload = () => {
    let d = null;
    try { d = JSON.parse(rd.result); } catch (e) { d = null; }
    if (!validDB(d)) { toast('Datei ist keine gültige Sicherung'); return; }
    DB = merge(DB, Object.assign({ badges: {}, gone: {}, set: {}, marks: {} }, d));
    DB.set = Object.assign({ theme: 'system', fach: 'pers', goal: 12, examDate: null }, DB.set);
    save(); render();
    toast('Sicherung eingelesen');
  };
  rd.readAsText(f);
}

/* ---------- Hilfen ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const isVoid = (q, L) => !!q.x && q.x.includes(L);
function ofFach(f) { return QUESTIONS.filter(q => q.f === f).map(q => q.id); }
const p2 = n => String(n).padStart(2, '0');
function fmtDate(ts) {
  const d = new Date(ts);
  return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}, ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
function fmtDay(ts) { const d = new Date(ts); return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`; }
function fmtDur(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${p2(s % 60)}`; }
function dayKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; }
function dayNum(key) { const [y, m, d] = key.split('-').map(Number); return Math.round(new Date(y, m - 1, d, 12) / 864e5); }

/* Auswertung einer Antwort: korrekt behandelte Aussagen (0–4) und vollständig richtig */
function grade(q, a) {
  let n = 0;
  /* Nicht gewertete Aussagen (q.x) zählen immer als richtig behandelt – wie in der Originalklausur */
  LETTERS.forEach(L => { if (isVoid(q, L) || q.k.includes(L) === a.includes(L)) n++; });
  /* Klausurwertung: +1 je richtig behandelter, −1 je falsch behandelter Aussage, nicht unter 0 → 0, 2 oder 4 Punkte */
  return { n, full: n === 4, pts: Math.max(0, 2 * n - 4) };
}
const PASS = 0.6;
function runStats(run) {
  const ids = run.ids.filter(id => run.ans[id] !== undefined);
  let full = 0, stm = 0, pts = 0;
  const wrong = [], unsure = [];
  ids.forEach(id => {
    const g = grade(BYID[id], run.ans[id]);
    stm += g.n; pts += g.pts;
    if (g.full) full++; else wrong.push(id);
    if (BYID[id].m.includes('UNSICHER')) unsure.push(id);
  });
  /* Klausur-Modus: unbeantwortete Fragen zählen mit 0 Punkten */
  if (run.exam) run.ids.forEach(id => { if (run.ans[id] === undefined) wrong.push(id); });
  const max = 4 * (run.exam ? run.ids.length : ids.length);
  return { answered: ids.length, total: run.ids.length, full, stm, pts, max, pass: max > 0 && pts >= PASS * max, wrong, unsure, ids };
}
const pctOf = r => { const s = runStats(r); return s.max ? Math.round(100 * s.pts / s.max) : 0; };

/* ---------- Lernstand aus allen Antworten ----------
   Stufe: 0 neu · 1 gesehen (noch nicht richtig / zuletzt falsch) · 2 sicher (richtig an 1–2 Tagen) · 3 gemeistert (richtig an 3 Tagen ohne Fehler dazwischen).
   Fällig: nach falsch am nächsten Tag, sonst nach 3 / 7 / 14 Tagen. */
const INTERVAL = [1, 3, 7, 14];
function histRuns() { return DB.done.concat(Object.values(DB.open).filter(r => !r.exam)); }
let HC = null;
function H() {
  if (HC) return HC;
  const ev = {};
  histRuns().forEach(r => Object.keys(r.ans).forEach(id => {
    if (!BYID[id]) return;
    { const g = grade(BYID[id], r.ans[id]); (ev[id] = ev[id] || []).push([(r.at && r.at[id]) || r.start, g.full, g.pts]); }
  }));
  const q = {}, days = {};
  let resc = 0;
  const today = dayNum(dayKey(Date.now()));
  Object.keys(ev).forEach(id => {
    const e = ev[id].sort((a, b) => a[0] - b[0]);
    let c = 0, lastUp = null, prev = null;
    e.forEach(([t, full]) => {
      const k = dayKey(t);
      days[k] = (days[k] || 0) + 1;
      if (full) {
        if (prev === false) resc++;
        if (k !== lastUp) { c++; lastUp = k; }
      } else { c = 0; lastUp = null; }
      prev = full;
    });
    const last = dayNum(dayKey(e[e.length - 1][0]));
    const recent = e.slice(-5);
    const avg = recent.reduce((s, x) => s + x[2], 0) / (4 * recent.length);
    q[id] = { c, lvl: c === 0 ? 1 : c < 3 ? 2 : 3, due: today >= last + INTERVAL[Math.min(c, 3)], full: prev, n: e.length, avg, lastPts: e[e.length - 1][2] };
  });
  HC = { q, days, resc, today };
  return HC;
}
const lvl = id => (H().q[id] ? H().q[id].lvl : 0);
const isDue = id => !!(H().q[id] && H().q[id].due);
/* Letzter Stand je Frage (für „bisher Falsche“) */
function lastStatus() {
  const out = {};
  Object.entries(H().q).forEach(([id, x]) => { out[id] = { full: x.full }; });
  return out;
}
/* Lerntage-Kette: Tage mit mindestens einer Antwort; höchstens ein Pausetag je 7 Tage. Heute zählt erst, wenn gelernt. */
function streakNow() {
  const days = H().days;
  const keys = Object.keys(days);
  if (!keys.length) return 0;
  const first = keys.sort()[0];
  const d = new Date(); d.setHours(12, 0, 0, 0);
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0, lastMiss = null;
  while (dayKey(d) >= first) {
    if (days[dayKey(d)]) n++;
    else {
      if (lastMiss !== null && lastMiss - dayNum(dayKey(d)) < 7) break;
      lastMiss = dayNum(dayKey(d));
    }
    d.setDate(d.getDate() - 1);
  }
  return n;
}
/* Gerettet: Antwort vollständig richtig, die vorherige Antwort auf dieselbe Frage war falsch */
function rescuedIn(run) {
  const others = histRuns().filter(r => r !== run && r.id !== run.id);
  return Object.keys(run.ans).filter(id => {
    if (!grade(BYID[id], run.ans[id]).full) return false;
    const t = (run.at && run.at[id]) || run.start;
    let prev = null;
    others.forEach(r => {
      if (r.ans[id] === undefined) return;
      const pt = (r.at && r.at[id]) || r.start;
      if (pt < t && (!prev || pt > prev[0])) prev = [pt, grade(BYID[id], r.ans[id]).full];
    });
    return prev && !prev[1];
  }).length;
}
/* Bestwerte je Probeklausur und Originalklausur (nur vollständige Durchgänge oder Klausur-Modus) */
function runKey(r) {
  if (r.key !== undefined) return r.key;
  if (r.tab === 'mix') {
    if (r.title === 'Probeklausur') return 'probe';
    const y = EXAMS.map(x => x[0]).find(y => r.title === `Klausur ${EXAM[y]}`);
    if (y) return 'y' + y;
  }
  return null;
}
function qualifies(r) { const s = runStats(r); return r.exam || s.answered === s.total; }
function best(key, before) {
  let b = null;
  DB.done.forEach(r => {
    if (runKey(r) !== key || !qualifies(r) || (before && (r.end || 0) >= before)) return;
    const p = pctOf(r);
    if (b === null || p > b) b = p;
  });
  return b;
}
const bestTxt = key => { const b = best(key); return b === null ? '' : `Best ${b} %`; };

/* ---------- Abzeichen ---------- */
const BADGES = [
  ['seen', `Alle ${QUESTIONS.length} gesehen`, 'Jede Frage mindestens einmal beantwortet'],
  ['m_pers', 'Persönlichkeit gemeistert', `Alle ${ofFach('pers').length} Fragen auf Stufe „gemeistert“`],
  ['m_entw', 'Entwicklung gemeistert', `Alle ${ofFach('entw').length} Fragen auf Stufe „gemeistert“`],
  ['m_diag', 'Diagnostik gemeistert', `Alle ${ofFach('diag').length} Fragen auf Stufe „gemeistert“`],
  ['exams', 'Jede Originalklausur bestanden', `Alle ${EXAMS.length} Klausuren je einmal vollständig mit mind. 60 %`],
  ['probe80', 'Probeklausur über 80 %', 'Eine vollständige Probeklausur mit mehr als 80 %'],
  ['exam', 'Klausur-Modus bestanden', 'Eine Prüfung unter Zeitlimit mit mind. 60 %'],
  ['streak7', '7 Lerntage in Folge', 'Mit höchstens einem Pausetag pro Woche'],
  ['goal5', 'Tagesziel an 5 Tagen', 'Fünfmal das Tagesziel erreicht'],
  ['resc10', '10 Fragen gerettet', 'Zehnmal eine zuvor falsche Frage richtig beantwortet'],
];
function badgeState() {
  const h = H();
  const passKey = k => DB.done.some(r => runKey(r) === k && qualifies(r) && runStats(r).pass);
  const allM = f => ofFach(f).every(id => lvl(id) === 3);
  return {
    seen: QUESTIONS.every(q => h.q[q.id]),
    m_pers: allM('pers'), m_entw: allM('entw'), m_diag: allM('diag'),
    exams: EXAMS.every(([y]) => passKey('y' + y)),
    probe80: DB.done.some(r => runKey(r) === 'probe' && qualifies(r) && pctOf(r) > 80),
    exam: DB.done.some(r => r.exam && runStats(r).pass),
    streak7: streakNow() >= 7,
    goal5: Object.values(h.days).filter(n => n >= DB.set.goal).length >= 5,
    resc10: h.resc >= 10,
  };
}
function checkBadges() {
  const st = badgeState();
  const neu = [];
  BADGES.forEach(([id, name]) => { if (st[id] && !DB.badges[id]) { DB.badges[id] = Date.now(); neu.push(name); } });
  if (neu.length) { save(); toast('Abzeichen erreicht: ' + neu.join(', ')); }
}
let toastT = 0;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3800);
}

/* ---------- Versuche ---------- */
function startRun(tab, title, ids, extra) {
  finishOpen(tab);
  DB.open[tab] = Object.assign({ id: 'r' + Date.now().toString(36), tab, title, ids, ans: {}, at: {}, pos: 0, start: Date.now() }, extra || {});
  save();
  pick = new Set();
  go('#quiz/' + tab);
}
/* Offenen Versuch abschließen: mit Antworten → Versuche, ohne → verwerfen (Klausur-Modus wird immer abgegeben) */
function finishOpen(tab, timeout) {
  const r = DB.open[tab];
  if (!r) return null;
  delete DB.open[tab];
  if (Object.keys(r.ans).length || r.exam) {
    r.end = r.exam ? Math.min(Date.now(), r.start + r.limit) : Date.now();
    if (timeout) r.timeout = true;
    DB.done.push(r);
    save();
    return r;
  }
  tomb(r.id);
  save();
  return null;
}
const examLeft = r => r.limit - (Date.now() - r.start);

/* ---------- Ansichten ---------- */
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
let pick = new Set();
let openDetail = null;
let delArmed = false;
let subArmed = false;

/* Tab-Leiste: einmal aufbauen, danach nur Klassen und Hinterlegung umstellen (damit es gleitet) */
function buildTabs() {
  tabsEl.innerHTML = `<div class="pill"><span class="glow"></span>` +
    `<a href="#${DB.set.fach || 'pers'}" class="grp" data-t="grp"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON.grp}</svg><span>Bereiche</span></a>` +
    TABS.map(([id, name]) => `<a href="#${id}" data-t="${id}" class="${FACH[id] ? 'f' : ''}">` +
      `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg><span>${SHORT[id] || name}</span></a>`).join('') + `</div>` +
    `<button class="gearbub" aria-label="Einstellungen"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON.gear}</svg></button>`;
}
function openSettings() { setFrom = ORDER.includes(prevTab) ? prevTab : 'mix'; go('#set'); }
tabsEl.addEventListener('click', e => { if (e.target.closest('.gearbub')) openSettings(); });
function renderTabs(active) {
  if (!tabsEl.firstChild) buildTabs();
  const pill = tabsEl.querySelector('.pill');
  const open = !!FACH[active];
  pill.classList.toggle('open', open);
  pill.querySelector('.grp').setAttribute('href', '#' + (DB.set.fach || 'pers'));
  pill.querySelectorAll('a[data-t]').forEach(a => {
    const on = a.dataset.t === active;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    a.tabIndex = (a.classList.contains('f') && !open) || (a.dataset.t === 'grp' && open) ? -1 : 0;
  });
  const vis = open ? ORDER : ['grp', 'mix', 'hist'];
  const i = vis.indexOf(active), n = vis.length;
  const g = pill.querySelector('.glow');
  g.style.width = `calc((100% - 10px) / ${n})`;
  g.style.left = `calc(5px + (100% - 10px) * ${i} / ${n})`;
}
const gearBtn = () => `<div class="topbar"><span></span><button class="gear" data-act="settings" aria-label="Einstellungen"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON.gear}</svg></button></div>`;

function row(act, t, d, v, attrs = '') {
  return `<button class="row" data-act="${act}" ${attrs}><span class="main"><span class="t">${t}</span>` +
    (d ? `<span class="d">${d}</span>` : '') + `</span>` +
    (v !== undefined && v !== '' ? `<span class="v">${v}</span>` : '') + `<span class="chev">›</span></button>`;
}

function resumeCard(tab) {
  const r = DB.open[tab];
  if (!r) return '';
  const s = runStats(r);
  if (r.exam) {
    return `<div class="label">Klausur läuft</div><div class="resume exam">
    <div class="t">${esc(r.title)}</div>
    <div class="d">${s.answered} von ${s.total} beantwortet · noch <span data-left>${fmtDur(examLeft(r))}</span> Min.</div>
    <div class="bar"><i data-w="${Math.round(100 * s.answered / s.total)}"></i></div>
    <div class="btns"><button class="btn primary" data-act="resume" data-tab="exam">Fortsetzen</button></div></div>`;
  }
  const pct = Math.round(100 * s.answered / s.total);
  return `<div class="label">Laufender Versuch</div><div class="resume">
    <div class="t">${esc(r.title)}</div>
    <div class="d">${s.answered} von ${s.total} beantwortet · ${s.pts} von ${s.max} Punkten</div>
    <div class="bar"><i data-w="${pct}"></i></div>
    <div class="btns"><button class="btn primary" data-act="resume" data-tab="${tab}">Fortsetzen</button>
    ${s.answered ? `<button class="btn" data-act="finish" data-tab="${tab}">Auswerten</button>` : ''}
    <button class="btn plain" data-act="discard" data-tab="${tab}">Verwerfen</button></div></div>`;
}

/* Kopf von Gemischt: Tagesziel, Lerntage-Kette, Countdown */
function todayCard() {
  const h = H(), goal = DB.set.goal, n = h.days[dayKey(Date.now())] || 0, reached = n >= goal;
  const C = 2 * Math.PI * 20, f = Math.min(1, n / goal) * C;
  const st = streakNow();
  const WD = ['S', 'M', 'D', 'M', 'D', 'F', 'S'];
  let week = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
    week += `<span class="wd ${h.days[dayKey(d)] ? 'on' : ''} ${i === 0 ? 'now' : ''}"><i></i>${WD[d.getDay()]}</span>`;
  }
  let hc = `<div class="today"><div class="top">` +
    `<div class="ring ${reached ? 'ok' : ''}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="rb" cx="24" cy="24" r="20"/>` +
    (n ? `<circle class="rf" cx="24" cy="24" r="20" stroke-dasharray="${f.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/>` : '') + `</svg>` +
    `<span>${Math.min(n, 999)}</span></div>` +
    `<div class="tx"><b>${reached ? 'Tagesziel erreicht' : `Heute ${n} von ${goal} Fragen`}</b>` +
    `<span>${st === 0 ? 'Noch keine Lerntage-Kette' : st === 1 ? '1 Lerntag in Folge' : `${st} Lerntage in Folge`}</span>` +
    `<div class="week">${week}</div></div></div>`;
  const ed = DB.set.examDate;
  const days = ed ? dayNum(ed) - h.today : null;
  if (ed && days >= 0) {
    const notSure = QUESTIONS.filter(q => lvl(q.id) < 2).length;
    let line;
    if (days === 0) line = 'Heute ist Klausur – viel Erfolg!';
    else line = `Noch <b>${days} ${days === 1 ? 'Tag' : 'Tage'}</b> bis zur Klausur` +
      (notSure ? ` · ${notSure} Fragen noch nicht sicher → ca. ${Math.ceil(notSure / days)} am Tag` : ' · alle Fragen mindestens sicher');
    hc += `<div class="cd">${line}</div>`;
  } else {
    hc += `<button class="cd link" data-act="settings">${ed ? 'Klausurdatum liegt in der Vergangenheit – ändern' : 'Klausurdatum festlegen'} ›</button>`;
  }
  return hc + `</div>`;
}

function fachView(f) {
  const ids = ofFach(f);
  const last = lastStatus();
  const seen = ids.filter(id => last[id]);
  const ok = seen.filter(id => last[id].full).length;
  const wrong = seen.length - ok;
  const due = ids.filter(isDue).length;
  const mast = ids.filter(id => lvl(id) === 3).length;
  let h = gearBtn() + `<h1>${FACH[f]}</h1><p class="sub">${ids.length} Fragen aus ${EXAMS.length} Klausuren (2020–2022) · 1–4 Antworten richtig</p>`;
  h += resumeCard(f);
  h += `<div class="label">Abfragen</div><div class="list">`;
  h += row('start', 'Heute fällig', due ? 'Wiederholung nach Plan' : 'Für heute ist alles wiederholt', String(due), `data-tab="${f}" data-kind="due" ${due ? '' : 'disabled'}`);
  h += row('start', `Alle ${ids.length} Fragen`, 'Reihenfolge wie in den Klausuren', '', `data-tab="${f}" data-kind="all"`);
  h += row('start', `Alle ${ids.length} Fragen gemischt`, 'Zufällige Reihenfolge', '', `data-tab="${f}" data-kind="shuf"`);
  h += row('start', '12 zufällige Fragen', 'Kurze Runde', '', `data-tab="${f}" data-kind="r12"`);
  h += row('start', 'Bisher Falsche', 'Zuletzt nicht vollständig richtig', String(wrong), `data-tab="${f}" data-kind="wrong" ${wrong ? '' : 'disabled'}`);
  h += row('start', 'Noch nie beantwortet', '', String(ids.length - seen.length), `data-tab="${f}" data-kind="new" ${ids.length - seen.length ? '' : 'disabled'}`);
  h += `</div><div class="label">Nach Klausur</div><div class="list">`;
  EXAMS.forEach(([y]) => {
    h += row('start', `Klausur ${EXAM[y]}`, '', String(ofExam(ids, y).length), `data-tab="${f}" data-kind="y${y}"`);
  });
  h += `</div><p class="foot">Stand: ${ok} von ${ids.length} zuletzt vollständig richtig · ${mast} gemeistert.</p>`;
  return h;
}

function mixView() {
  const last = lastStatus();
  const wrong = QUESTIONS.filter(q => last[q.id] && !last[q.id].full).length;
  const ok = QUESTIONS.filter(q => last[q.id] && last[q.id].full).length;
  const due = QUESTIONS.filter(q => isDue(q.id)).length;
  const exOpen = !!DB.open.exam;
  let h = gearBtn() + `<h1>Gemischt</h1><p class="sub">Alle drei Bereiche · ${ok} von ${QUESTIONS.length} zuletzt vollständig richtig</p>`;
  h += todayCard();
  h += resumeCard('exam') + resumeCard('mix');
  h += `<div class="label">Abfragen</div><div class="list">`;
  h += row('start', 'Heute fällig', due ? 'Wiederholung nach Plan, alle Bereiche' : 'Für heute ist alles wiederholt', String(due), `data-tab="mix" data-kind="due" ${due ? '' : 'disabled'}`);
  h += row('start', 'Probeklausur', '36 Fragen, je 12 pro Bereich, zufällig', bestTxt('probe'), 'data-tab="mix" data-kind="probe"');
  h += row('start', `Alle ${QUESTIONS.length} Fragen gemischt`, '', '', 'data-tab="mix" data-kind="shuf"');
  h += row('start', '20 zufällige Fragen', 'Kurze Runde', '', 'data-tab="mix" data-kind="r20"');
  h += row('start', 'Bisher Falsche', 'Aus allen Bereichen', String(wrong), `data-tab="mix" data-kind="wrong" ${wrong ? '' : 'disabled'}`);
  const nMark = markedIds().length;
  if (nMark) h += row('start', 'Markierte üben', 'Zum Klären mit den Folien', String(nMark), 'data-tab="mix" data-kind="marked"');
  h += `</div><div class="label">Klausur-Modus · ${EXAM_MIN} Minuten</div><div class="list">`;
  h += row('start', 'Probeklausur als Prüfung', '36 Fragen · Auflösung erst nach dem Abgeben', '', `data-tab="exam" data-kind="probe" ${exOpen ? 'disabled' : ''}`);
  EXAMS.forEach(([y]) => {
    h += row('start', `Klausur ${EXAM[y]} als Prüfung`, `${ofExam(QUESTIONS.map(q => q.id), y).length} Fragen · Originalreihenfolge`, bestTxt('y' + y), `data-tab="exam" data-kind="y${y}" ${exOpen ? 'disabled' : ''}`);
  });
  h += `</div><p class="foot">${exOpen ? 'Es läuft schon eine Prüfung – erst abgeben, dann neu starten.' : 'Läuft wie die echte Klausur: Zeit läuft, nichts wird zwischendurch aufgelöst.'}</p>`;
  h += `<div class="label">Originalklausuren</div><div class="list">`;
  EXAMS.forEach(([y]) => {
    h += row('start', `Klausur ${EXAM[y]}`, `Alle ${ofExam(QUESTIONS.map(q => q.id), y).length} Fragen in Originalreihenfolge`, bestTxt('y' + y), `data-tab="mix" data-kind="y${y}"`);
  });
  h += `</div>`;
  return h;
}

function buildIds(tab, kind) {
  const pool = tab === 'mix' ? QUESTIONS.map(q => q.id) : ofFach(tab);
  const last = lastStatus();
  const name = tab === 'mix' ? 'Gemischt' : FACH[tab];
  const R = (ids, title, key = null) => ({ ids, title, key });
  if (kind === 'due') return R(shuffle(pool.filter(isDue)), `${name} · heute fällig`);
  if (kind === 'all') return R(pool, `${name} · alle ${pool.length}`);
  if (kind === 'shuf') return R(shuffle(pool), `${name} · alle gemischt`);
  if (kind === 'r12') return R(shuffle(pool).slice(0, 12), `${name} · 12 zufällige`);
  if (kind === 'r20') return R(shuffle(pool).slice(0, 20), 'Gemischt · 20 zufällige');
  if (kind === 'wrong') return R(shuffle(pool.filter(id => last[id] && !last[id].full)), `${name} · bisher Falsche`);
  if (kind === 'marked') return R(pool.filter(isMarked), `${name} · zum Klären`);
  if (kind === 'new') return R(pool.filter(id => !last[id]), `${name} · noch nie beantwortet`);
  if (kind === 'probe') {
    const ids = [].concat(...Object.keys(FACH).map(f => shuffle(ofFach(f)).slice(0, 12)));
    return R(shuffle(ids), 'Probeklausur', 'probe');
  }
  if (kind[0] === 'y') {
    const y = kind.slice(1);
    const ids = ofExam(pool, y);
    return tab === 'mix' ? R(ids, `Klausur ${EXAM[y]}`, 'y' + y) : R(ids, `${name} · Klausur ${EXAM[y]}`);
  }
  return R(pool, name);
}

function quizView(tab) {
  const r = DB.open[tab];
  if (!r) return null;
  if (r.pos >= r.ids.length) r.pos = r.ids.length - 1;
  const q = BYID[r.ids[r.pos]];
  const a = r.ans[q.id];
  const done = a !== undefined;
  const pct = Math.round(100 * Object.keys(r.ans).length / r.ids.length);
  let h = `<div class="qtop"><div class="line"><button class="back" data-act="leave" data-tab="${tab}">‹ ${esc(tab === 'mix' ? 'Gemischt' : FACH[tab])}</button>` +
    `<span class="count">${r.pos + 1} / ${r.ids.length}</span></div><div class="bar"><i data-w="${pct}"></i></div></div>`;
  h += `<div class="meta">Klausur ${EXAM[q.e]} · Frage ${q.n} · ${FACH[q.f]}</div>`;
  if (q.m.includes('FRAGESATZ_FEHLT')) h += `<div class="note"><b>Fragesatz fehlt.</b> In der Vorlage ist nur die Fallbeschreibung übertragen, der eigentliche Fragesatz fehlt.</div>`;
  if (q.m.includes('UNSICHER')) h += `<div class="note"><b>Schlüssel unsicher.</b> Der Lösungsschlüssel war im Original nicht eindeutig lesbar. Die Wertung gilt unter Vorbehalt.</div>`;
  h += `<div class="qtext">${esc(q.q)}</div><div class="hint1">1–4 Antworten richtig</div><div class="opts">`;
  LETTERS.forEach((L, i) => {
    if (isVoid(q, L)) { h += `<div class="opt void" aria-disabled="true"><span class="let">${L}</span><span class="ot">${esc(q.o[i])}<span class="res">Nicht gewertet – zählt immer als richtig</span></span></div>`; return; }
    if (!done) {
      const on = pick.has(L);
      h += `<button class="opt ${on ? 'on' : ''}" data-act="pick" data-l="${L}" aria-pressed="${on}"><span class="let">${L}</span><span class="ot">${esc(q.o[i])}</span></button>`;
    } else {
      const inKey = q.k.includes(L), picked = a.includes(L), good = inKey === picked;
      const res = (inKey ? 'Laut Schlüssel richtig' : 'Laut Schlüssel falsch') + ' · ' +
        (picked ? 'angekreuzt' : 'nicht angekreuzt') + (good ? '' : picked ? ' (falsches Kreuz)' : ' (fehlendes Kreuz)');
      h += `<div class="opt done ${good ? 'good' : 'wrong'}"><span class="let ${inKey ? 'k' : 'nk'} ${picked ? 'x' : ''}">${L}</span>` +
        `<span class="ot">${esc(q.o[i])}<span class="res">${res}</span></span></div>`;
    }
  });
  h += `</div>`;
  if (done) {
    const g = grade(q, a);
    h += `<div class="verdict ${g.full ? 'ok' : 'bad'}">${g.full ? 'Vollständig richtig' : `Nicht ganz: ${g.n} von 4 Aussagen richtig behandelt`} · ${g.pts} von 4 Punkten` +
      `${q.m.includes('UNSICHER') ? ' (unter Vorbehalt)' : ''}</div>`;
    h += `<div class="legend">Schlüssel: ${q.k} · Deine Kreuze: ${a || 'keine'} · Stufe: ${LVL[lvl(q.id)]}</div>`;
    h += `<div class="topic">Thema: ${esc(q.t)}</div>`;
    if (q.h.length) {
      h += `<div class="hints">` + q.h.map(([t, msg]) => `<div><b>${MARK[t] || esc(t)}</b>${esc(msg)}</div>`).join('') + `</div>`;
    }
    h += markHtml(q.id);
  }
  const last = r.pos === r.ids.length - 1;
  h += `<div class="action"><div class="in">`;
  if (r.pos > 0) h += `<button class="btn plain" data-act="prev" data-tab="${tab}">Zurück</button>`;
  if (!done) h += `<button class="btn primary" data-act="check" data-tab="${tab}">${pick.size ? 'Prüfen' : 'Prüfen (nichts angekreuzt)'}</button>`;
  else if (!last) h += `<button class="btn primary" data-act="next" data-tab="${tab}">Weiter</button>`;
  else h += `<button class="btn primary" data-act="finish" data-tab="${tab}">Auswertung</button>`;
  if (done) h += markBtn(q.id);
  h += `</div></div><p class="keys">1–4 ankreuzen · Enter prüfen/weiter · ← → blättern · Esc zurück</p>`;
  return h;
}

/* ---------- Klausur-Modus ---------- */
const GRID_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>';
function timerHtml(r) {
  return `<span class="timer ${examLeft(r) < 600000 ? 'low' : ''}" data-timer><span data-el>${fmtDur(Date.now() - r.start)}</span><small> / ${EXAM_MIN}:00</small></span>`;
}
function examTop(r, right) {
  return `<div class="qtop"><div class="line"><button class="back" data-act="leave" data-tab="exam">‹ Gemischt</button>` +
    timerHtml(r) + `<span class="count">${right}</span></div>` +
    `<div class="bar"><i data-w="${Math.round(100 * Object.keys(r.ans).length / r.ids.length)}"></i></div></div>`;
}
function examView() {
  const r = DB.open.exam;
  if (r.pos >= r.ids.length) r.pos = r.ids.length - 1;
  const q = BYID[r.ids[r.pos]];
  const a = r.ans[q.id] || '';
  const fl = !!r.flag[q.id];
  let h = examTop(r, `${r.pos + 1} / ${r.ids.length}`);
  h += `<div class="meta">Frage ${r.pos + 1} · ${FACH[q.f]}</div>`;
  if (q.m.includes('FRAGESATZ_FEHLT')) h += `<div class="note"><b>Fragesatz fehlt.</b> In der Vorlage ist nur die Fallbeschreibung übertragen, der eigentliche Fragesatz fehlt.</div>`;
  h += `<div class="qtext">${esc(q.q)}</div><div class="hint1">1–4 Antworten richtig</div><div class="opts">`;
  LETTERS.forEach((L, i) => {
    if (isVoid(q, L)) { h += `<div class="opt void" aria-disabled="true"><span class="let">${L}</span><span class="ot">${esc(q.o[i])}<span class="res">Nicht gewertet – zählt immer als richtig</span></span></div>`; return; }
    const on = a.includes(L);
    h += `<button class="opt ${on ? 'on' : ''}" data-act="xpick" data-l="${L}" aria-pressed="${on}"><span class="let">${L}</span><span class="ot">${esc(q.o[i])}</span></button>`;
  });
  h += `</div><button class="flagbtn ${fl ? 'on' : ''}" data-act="flag" aria-pressed="${fl}"><span class="box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9"/></svg></span>Unsicher – später nochmal ansehen</button>`;
  h += `<p class="foot">${r.ans[q.id] === undefined ? 'Noch nicht beantwortet.' : 'Antwort gespeichert – du kannst sie bis zum Abgeben ändern.'}</p>`;
  const last = r.pos === r.ids.length - 1;
  h += `<div class="action"><div class="in">`;
  if (r.pos > 0) h += `<button class="btn plain" data-act="xprev">Zurück</button>`;
  if (r.seenGrid) h += `<button class="btn plain icon" data-act="grid" aria-label="Gesamtansicht">${GRID_ICO}</button>`;
  h += last ? `<button class="btn primary" data-act="grid">Zur Übersicht</button>` : `<button class="btn primary" data-act="xnext">Weiter</button>`;
  h += `</div></div><p class="keys">1–4 ankreuzen · U unsicher · ← → blättern · Enter weiter · G Übersicht</p>`;
  return h;
}
function gridView() {
  const r = DB.open.exam;
  if (!r.seenGrid) { r.seenGrid = true; save(); }
  const answered = Object.keys(r.ans).length, open = r.ids.length - answered;
  const flagged = r.ids.filter(id => r.flag[id]).length;
  let h = examTop(r, `${answered} / ${r.ids.length}`);
  h += `<h1>Übersicht</h1><p class="sub">${answered} von ${r.ids.length} beantwortet` + (flagged ? ` · ${flagged} als unsicher markiert` : '') + `</p>`;
  h += `<div class="tiles">` + r.ids.map((id, i) =>
    `<button class="tile ${r.ans[id] !== undefined ? 'ans' : ''} ${r.flag[id] ? 'flag' : ''} ${i === r.pos ? 'cur' : ''}" data-act="jump" data-i="${i}" aria-label="Frage ${i + 1}">${i + 1}</button>`).join('') + `</div>`;
  h += `<div class="tlegend"><span><i class="ans"></i>Beantwortet</span><span><i></i>Offen</span><span><i class="flag"></i>Unsicher</span></div>`;
  h += `<p class="foot">Antippen springt zur Frage. Unbeantwortete Fragen zählen beim Abgeben 0 Punkte.</p>`;
  h += `<div class="action"><div class="in"><button class="btn primary ${subArmed ? 'armed' : ''}" data-act="submit">` +
    (subArmed ? 'Wirklich abgeben? Nochmal tippen' : open ? `Abgeben (${open} offen)` : 'Abgeben') + `</button></div></div>`;
  return h;
}

function resultList(run, withDetail) {
  const ids = run.exam ? run.ids : runStats(run).ids;
  return ids.map(id => {
    const q = BYID[id], a = run.ans[id];
    const flg = run.flag && run.flag[id] ? ' · als unsicher markiert' : '';
    if (a === undefined) {
      return `<button class="row" data-act="toggle" data-id="${id}"><span class="dot"></span><span class="main">` +
        `<span class="t">${EXS[q.e]} · Frage ${q.n} · ${FACH[q.f]}</span><span class="d">Nicht beantwortet${flg}</span></span><span class="v">0 P.</span></button>` +
        (withDetail && openDetail === id ? `<div class="detail"><p>${esc(q.q)}</p><ul>` + LETTERS.map((L, i) =>
          `<li class="${q.k.includes(L) ? 'good' : ''}">${L}) ${esc(q.o[i])} – ${isVoid(q, L) ? 'nicht gewertet' : q.k.includes(L) ? 'richtig' : 'falsch'}</li>`).join('') + `</ul></div>` : '');
    }
    const g = grade(q, a);
    const uns = q.m.includes('UNSICHER');
    const cls = g.full ? (uns ? 'warn' : 'ok') : 'bad';
    let h = `<button class="row" data-act="toggle" data-id="${id}"><span class="dot ${cls}"></span><span class="main">` +
      `<span class="t">${EXS[q.e]} · Frage ${q.n} · ${FACH[q.f]}</span><span class="d">${esc(q.t)}${flg}</span></span>` +
      `<span class="v">${g.pts} P.</span></button>`;
    if (withDetail && openDetail === id) {
      h += `<div class="detail"><p>${esc(q.q)}</p><ul>` + LETTERS.map((L, i) => {
        const inKey = q.k.includes(L), picked = a.includes(L);
        if (isVoid(q, L)) return `<li>${L}) ${esc(q.o[i])} – nicht gewertet</li>`;
        return `<li class="${inKey === picked ? 'good' : 'wrong'}">${L}) ${esc(q.o[i])} – ${inKey ? 'richtig' : 'falsch'}, ${picked ? 'angekreuzt' : 'nicht angekreuzt'}</li>`;
      }).join('') + `</ul>${uns ? '<p>Schlüssel unsicher: Wertung unter Vorbehalt.</p>' : ''}</div>`;
    }
    return h;
  }).join('');
}

function summaryView(run, fromHist) {
  const s = runStats(run);
  const pct = s.max ? Math.round(100 * s.pts / s.max) : 0;
  const need = Math.ceil(PASS * s.max);
  let h = fromHist ? `<div class="qtop"><div class="line"><button class="back" data-act="gohist">‹ Versuche</button><span></span></div></div>` : '';
  h += `<div class="big">${s.pts}<small> / ${s.max} Punkte</small></div>`;
  h += `<div class="pass ${s.pass ? 'ok' : 'bad'}">${s.pass ? 'Bestanden' : 'Nicht bestanden'} · ${pct} %</div>`;
  const key = runKey(run);
  if (key && qualifies(run)) {
    const prev = best(key, run.end || Date.now());
    if (prev === null) h += `<div class="pass best">Erster Durchgang · Bestwert ${pct} %</div>`;
    else if (pct > prev) h += `<div class="pass best">Neuer Bestwert · vorher ${prev} %</div>`;
  }
  h += `<p class="sub">Bestanden ab 60 % (${need} Punkte) · ${s.full} von ${run.exam ? s.total : s.answered} Fragen vollständig richtig` +
    (s.answered < s.total ? ` · ${s.total - s.answered} Fragen nicht beantwortet${run.exam ? ' (0 Punkte)' : ''}` : '') + `</p>`;
  const resc = rescuedIn(run);
  let meta = fmtDate(run.start);
  if (run.exam) meta += run.timeout ? ` · Zeit abgelaufen, automatisch abgegeben` : ` · Zeit ${fmtDur((run.end || Date.now()) - run.start)} von ${EXAM_MIN}:00`;
  h += `<div class="list"><div class="row"><span class="main"><span class="t">${esc(run.title)}</span>` +
    `<span class="d">${meta}</span></span></div>` +
    (resc ? `<div class="row"><span class="main"><span class="t okc">${resc} ${resc === 1 ? 'Frage' : 'Fragen'} gerettet</span><span class="d">Letztes Mal falsch, diesmal vollständig richtig</span></span></div>` : '') +
    `</div>`;
  if (s.unsure.length) h += `<p class="foot">Unter Vorbehalt (Schlüssel unsicher): ${s.unsure.map(id => `${EXS[BYID[id].e]} · Frage ${BYID[id].n}`).join(', ')}</p>`;
  h += `<div class="label">Fragen</div><div class="list">${resultList(run, true)}</div>`;
  h += `<p class="foot">Antippen zeigt die Aussagen mit Schlüssel und deinen Kreuzen.</p>`;
  h += `<div class="label">Aktionen</div><div class="list">`;
  if (s.wrong.length) h += `<button class="row accent" data-act="retry" data-run="${run.id}"><span class="main"><span class="t">Falsche wiederholen (${s.wrong.length})</span></span></button>`;
  if (fromHist) h += `<button class="row danger" data-act="del" data-run="${run.id}"><span class="main"><span class="t">${delArmed ? 'Wirklich löschen? Nochmal tippen' : 'Versuch löschen'}</span></span></button>`;
  else h += `<button class="row accent" data-act="gohist"><span class="main"><span class="t">Fertig</span></span></button>`;
  h += `</div>`;
  return h;
}

const THEMES = { system: 'Wie System', light: 'Hell', dark: 'Dunkel' };
let upd = { st: 'idle', remote: null, at: null };
function newer(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
  return false;
}
function setView() {
  let h = `<div class="topbar"><button class="back" data-act="setback"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Zurück</button><span></span></div><h1>Einstellungen</h1><p class="sub">Lernen, Abgleich, Darstellung und App-Version</p>`;
  h += `<div class="label">Lernen</div><div class="list"><div class="row"><span class="main"><span class="t">Tagesziel</span><span class="d">Fragen pro Tag</span></span></div>` +
    `<div class="seg" role="radiogroup">` + GOALS.map(g => `<button data-act="goal" data-g="${g}" role="radio" aria-checked="${DB.set.goal === g}" class="${DB.set.goal === g ? 'on' : ''}">${g}</button>`).join('') + `</div>` +
    `<label class="row"><span class="main"><span class="t">Klausurdatum</span><span class="d">Für den Countdown auf Gemischt</span></span>` +
    `<input type="date" class="date" data-in="examdate" value="${DB.set.examDate || ''}"></label>` +
    (DB.set.examDate ? `<button class="row danger" data-act="clrdate"><span class="main"><span class="t">Datum entfernen</span></span></button>` : '') +
    `</div><p class="foot">Lerntage zählen, sobald du an einem Tag mindestens eine Frage beantwortest. Ein Pausetag pro Woche unterbricht die Kette nicht.</p>`;
  h += `<div class="label">Darstellung</div><div class="list"><div class="seg" role="radiogroup">` +
    Object.keys(THEMES).map(t => `<button data-act="theme" data-t="${t}" role="radio" aria-checked="${DB.set.theme === t}" class="${DB.set.theme === t ? 'on' : ''}">${t === 'system' ? 'System' : THEMES[t]}</button>`).join('') +
    `</div></div><p class="foot">„System“ folgt der Einstellung deines iPhones.</p>`;
  h += `<div class="label">Synchronisieren</div><div class="list">`;
  if (SY.code) {
    const st = syncSt === 'busy' ? '…' : syncSt === 'err' ? 'Fehler' : syncSt === 'offline' ? 'Keine Verbindung'
      : SY.last ? (dayKey(SY.last) === dayKey(Date.now()) ? 'heute, ' + fmtDate(SY.last).slice(-5) : fmtDay(SY.last)) : '–';
    h += `<button class="row" data-act="copycode"><span class="main"><span class="t">Code</span><span class="d">Antippen zum Kopieren</span></span><span class="v code">${esc(SY.code)}</span></button>`;
    h += `<button class="row accent" data-act="syncnow" ${syncSt === 'busy' ? 'disabled' : ''}><span class="main"><span class="t">Jetzt abgleichen</span></span><span class="v ${syncSt === 'ok' ? 'ok' : syncSt === 'err' ? 'bad' : ''}">${st}</span></button>`;
    h += `<button class="row danger" data-act="unlink"><span class="main"><span class="t">${unlinkArmed ? 'Wirklich trennen? Nochmal tippen' : 'Synchronisation beenden'}</span></span></button>`;
    h += `</div><p class="foot">Gib diesen Code auf deinem anderen Gerät ein. Der Lernstand gleicht sich dann automatisch ab. Behalte den Code für dich.</p>`;
  } else {
    h += `<button class="row accent" data-act="mkcode" ${syncSt === 'busy' ? 'disabled' : ''}><span class="main"><span class="t">Code erzeugen</span><span class="d">Auf dem ersten Gerät</span></span></button>`;
    h += `<div class="row"><input class="code-in" data-in="code" value="${esc(codeDraft)}" placeholder="Code vom anderen Gerät" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" maxlength="16" enterkeyhint="go">` +
      `<button class="pill" data-act="link" ${syncSt === 'busy' ? 'disabled' : ''}>${syncSt === 'busy' ? '…' : 'Verbinden'}</button></div>`;
    h += `</div><p class="foot">Mit demselben Code auf iPhone und Mac bleibt dein Lernstand überall gleich.</p>`;
  }
  h += `<div class="label">Sicherung</div><div class="list">` +
    `<button class="row accent" data-act="export"><span class="main"><span class="t">Sicherung exportieren</span><span class="d">Lernstand als Datei speichern</span></span></button>` +
    `<label class="row accent"><span class="main"><span class="t">Sicherung einlesen</span><span class="d">Wird mit dem jetzigen Stand zusammengeführt</span></span><input type="file" class="hidden-file" data-in="import" accept=".json,application/json"></label>` +
    `</div>`;
  const stTxt = { idle: '', checking: 'Suche …', current: 'Aktuell', offline: 'Keine Verbindung', new: `Version ${upd.remote} verfügbar` }[upd.st];
  const stCls = upd.st === 'current' ? 'ok' : upd.st === 'new' ? 'new' : '';
  h += `<div class="label">App</div><div class="list">`;
  h += `<div class="row"><span class="main"><span class="t">Version</span></span><span class="v">${VERSION}</span></div>`;
  h += `<button class="row accent" data-act="updcheck" ${upd.st === 'checking' ? 'disabled' : ''}><span class="main"><span class="t">Nach Updates suchen</span></span><span class="v ${stCls}">${stTxt}</span></button>`;
  if (upd.st === 'new') h += `<button class="row accent" data-act="updapply"><span class="main"><span class="t">Jetzt aktualisieren</span><span class="d">Lädt die neue Version. Dein Fortschritt bleibt erhalten.</span></span></button>`;
  h += `</div>`;
  if (upd.at) h += `<p class="foot">Zuletzt geprüft: ${fmtDate(upd.at)}</p>`;
  h += `<p class="foot">Version ${VERSION} · ${SY.code ? 'Lernstand wird über deinen Code abgeglichen.' : 'Alle Ergebnisse bleiben nur auf diesem Gerät gespeichert.'}</p>`;
  return h;
}
async function checkUpdate() {
  upd = { st: 'checking', remote: null, at: upd.at };
  render();
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const j = await r.json();
    upd = { st: newer(j.version, VERSION) ? 'new' : 'current', remote: j.version, at: Date.now() };
  } catch (e) {
    upd = { st: 'offline', remote: null, at: upd.at };
  }
  if (location.hash.slice(1) === 'set') render();
}
async function applyUpdate() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('psyklausur-')).map(k => caches.delete(k)));
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) await reg.update();
  } catch (e) { /* trotzdem neu laden */ }
  location.replace('./?u=' + Date.now() + '#set');
}

/* Mosaik als Heatmap: Farbe = Ø-Punkte der letzten 5 Antworten, Krone = gemeistert */
const CROWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5 3 7.5l5 4 4-6.5 4 6.5 5-4-1 10Z"/></svg>';
let mosSel = null;
const heat = a => (a < .2 ? 0 : a < .45 ? 1 : a < .65 ? 2 : a < .85 ? 3 : 4);
function mosInfo(id) {
  if (!id) return `<span class="mi-hint">Kachel antippen für Details</span>`;
  const q = BYID[id], x = H().q[id];
  const st = x ? `${x.n}×\u00a0beantwortet · Ø\u00a0${Math.round(100 * x.avg)}\u00a0%${x.n > 5 ? '\u00a0(letzte\u00a05)' : ''} · zuletzt\u00a0${x.lastPts}/4 · ${LVL[x.lvl]}` : 'Noch nicht beantwortet';
  return `<span class="mi-t"><b>${EXS[q.e]} · Frage ${q.n}</b> · ${esc(st)}</span><button class="mi-go" data-act="one" data-id="${id}">Üben ›</button>`;
}
function mosaic() {
  let h = `<div class="mosaic">`;
  Object.keys(FACH).forEach(f => {
    const ids = ofFach(f);
    const m = ids.filter(id => lvl(id) === 3).length;
    h += `<div class="mblock"><div class="mh"><span>${FACH[f]}</span><span>${m} / ${ids.length} gemeistert</span></div><div class="mgrid">` +
      ids.map(id => {
        const x = H().q[id];
        return `<i data-q="${id}" class="${x ? 'h' + heat(x.avg) : ''}${mosSel === id ? ' sel' : ''}">${x && x.lvl === 3 ? CROWN : ''}</i>`;
      }).join('') + `</div></div>`;
  });
  h += `<div class="minfo" data-minfo>${mosInfo(mosSel)}</div>`;
  return h + `<div class="mlegend"><span><i></i>Neu</span><span class="scale">0 %<i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i>100 %</span>` +
    `<span><i class="h4 crown">${CROWN}</i>Gemeistert</span></div></div>`;
}
function selectTile(id) {
  mosSel = id;
  view.querySelectorAll('.mgrid i.sel').forEach(e => e.classList.remove('sel'));
  const t = view.querySelector(`.mgrid i[data-q="${id}"]`);
  if (t) t.classList.add('sel');
  const inf = view.querySelector('[data-minfo]');
  if (inf) inf.innerHTML = mosInfo(id);
}

/* Knopf + Notiz unter der Auflösung (nur Abfragen, nicht Klausur-Modus) */
function markHtml(id) {
  if (!isMarked(id)) return '';
  return `<div class="mkhead">Markiert zum Klären</div><textarea class="mnote" data-in="mnote" data-id="${id}" rows="2" maxlength="500" placeholder="Was ist unklar? (optional)">${esc(DB.marks[id].note || '')}</textarea>`;
}
/* Gelbe Blase rechts neben „Weiter“ */
function markBtn(id) {
  const on = isMarked(id);
  return `<button class="btn mkb ${on ? 'on' : ''}" data-act="mark" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Markierung entfernen' : 'Mit Folien klären'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4"/><path d="M6 4h11l-2.2 4L17 12H6"/></svg></button>`;
}
/* Liste „Zum Klären“ unter Versuche */
function markList() {
  const ids = markedIds();
  if (!ids.length) return '';
  let h = `<div class="label">Zum Klären · ${ids.length}</div><div class="list">`;
  h += row('start', 'Alle markierten üben', 'In Klausur-Reihenfolge', '', 'data-tab="mix" data-kind="marked"');
  ids.forEach(id => {
    const q = BYID[id], note = DB.marks[id].note;
    h += `<button class="row" data-act="toggle" data-id="${id}"><span class="dot mk"></span><span class="main">` +
      `<span class="t">${EXS[q.e]} · Frage ${q.n} · ${FACH[q.f]}</span><span class="d">${esc(note || q.t)}</span></span></button>`;
    if (openDetail === id) {
      h += `<div class="detail"><p>${esc(q.q)}</p><ul>` + LETTERS.map((L, i) =>
        `<li class="${q.k.includes(L) ? 'good' : ''}">${L}) ${esc(q.o[i])} – ${isVoid(q, L) ? 'nicht gewertet' : q.k.includes(L) ? 'richtig' : 'falsch'}</li>`).join('') + `</ul>` +
        `<p>Thema: ${esc(q.t)}</p>` + (note ? `<p class="mknote">Notiz: ${esc(note)}</p>` : '') +
        `<div class="mkact"><button class="btn plain" data-act="unmark" data-id="${id}">Erledigt</button><button class="btn primary" data-act="one" data-id="${id}">Üben</button></div></div>`;
    }
  });
  return h + `</div>`;
}

function histView() {
  const last = lastStatus();
  let h = gearBtn() + `<h1>Versuche</h1><p class="sub">Fortschritt, Abzeichen und abgeschlossene Abfragen</p>`;
  h += `<div class="stats">` + Object.keys(FACH).map(f => {
    const ids = ofFach(f);
    const ok = ids.filter(id => last[id] && last[id].full).length;
    return `<div class="stat"><b>${ok}<span> / ${ids.length}</span></b><span>${FACH[f]}</span></div>`;
  }).join('') + `</div><p class="foot">Zuletzt vollständig richtig beantwortet, je Bereich.</p>`;
  h += `<div class="label">Fortschritt je Frage</div>` + mosaic();
  h += `<p class="foot">Farbe: Durchschnitt deiner letzten 5 Antworten (0, 2 oder 4 Punkte). Krone: an drei verschiedenen Tagen richtig, ohne Fehler dazwischen.</p>`;
  const open = Object.values(DB.open);
  if (open.length) {
    h += `<div class="label">Noch offen</div><div class="list">` + open.map(r => {
      const s = runStats(r);
      return row('resume', esc(r.title), `${s.answered} von ${s.total} beantwortet`, '', `data-tab="${r.tab}"`);
    }).join('') + `</div>`;
  }
  h += markList();
  h += `<div class="label">Abgeschlossen</div>`;
  if (!DB.done.length) h += `<div class="list"><div class="empty">Noch keine abgeschlossenen Versuche.</div></div>`;
  else {
    h += `<div class="list">` + DB.done.slice().reverse().map(r => {
      const s = runStats(r);
      const pc = s.max ? Math.round(100 * s.pts / s.max) : 0;
      return row('openrun', esc(r.title), `${fmtDate(r.start)} · ${s.pts}/${s.max} Punkte`, `<span class="${s.pass ? 'okc' : 'badc'}">${pc} %</span>`, `data-run="${r.id}"`);
    }).join('') + `</div>`;
  }
  const got = BADGES.filter(b => DB.badges[b[0]]).length;
  h += `<div class="label">Abzeichen · ${got} von ${BADGES.length}</div><div class="list">` + BADGES.map(([id, name, desc]) => {
    const t = DB.badges[id];
    return `<div class="row badge ${t ? 'got' : ''}"><span class="medal"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9.5" r="5.5"/><path d="m8.8 14 -1.8 6.5 5-2.5 5 2.5-1.8-6.5"/></svg></span>` +
      `<span class="main"><span class="t">${name}</span><span class="d">${t ? 'Erreicht am ' + fmtDay(t) : desc}</span></span></div>`;
  }).join('') + `</div>`;
  return h;
}

/* ---------- Router ---------- */
function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}
let prevTab = null, first = true, setFrom = 'mix';
/* Während eine Notiz getippt wird, nicht neu zeichnen (Fokus bliebe sonst nicht erhalten) */
let renderLater = false;
view.addEventListener('focusout', e => {
  if (e.target.dataset && e.target.dataset.in === 'mnote' && renderLater) { renderLater = false; setTimeout(render, 0); }
});
function render() {
  const ae = document.activeElement;
  if (ae && ae.dataset && ae.dataset.in === 'mnote' && view.contains(ae)) { renderLater = true; return; }
  if (DB.open.exam && examLeft(DB.open.exam) <= 0) {
    const d = finishOpen('exam', true);
    if (/^#(quiz|grid)\/exam/.test(location.hash)) { location.replace('#sum/' + d.id); }
  }
  checkBadges();
  let hash = location.hash.slice(1) || 'mix';
  if (hash === 'home') hash = 'mix';
  const [a, b] = hash.split('/');
  let html = null, tab = a, quiz = false;
  if (a === 'quiz' && b === 'exam' && DB.open.exam) { html = examView(); tab = 'exam'; quiz = true; }
  else if (a === 'grid' && b === 'exam' && DB.open.exam) { html = gridView(); tab = 'exam'; quiz = true; }
  else if (a === 'quiz' && DB.open[b]) { html = quizView(b); tab = b; quiz = true; }
  else if (a === 'sum' || a === 'run') {
    const r = DB.done.find(x => x.id === b);
    if (r) { html = summaryView(r, a === 'run'); tab = a === 'run' ? 'hist' : r.tab; quiz = a === 'sum'; }
  }
  const isSet = a === 'set' && html === null;
  if (html === null) {
    if (a === 'quiz' || a === 'grid') tab = b;
    if (isSet) tab = 'set';
    else if (!ORDER.includes(tab)) tab = 'mix';
    html = isSet ? setView() : tab === 'hist' ? histView() : tab === 'mix' ? mixView() : fachView(tab);
  }
  if (FACH[tab] && !quiz && DB.set.fach !== tab) { DB.set.fach = tab; save(); }
  /* Farbhauch: Einstellungen behalten den Hauch der Seite, von der man kommt; Klausur-Modus gehört zu Gemischt */
  document.documentElement.dataset.tab = isSet ? setFrom : tab === 'exam' ? 'mix' : tab;
  document.body.classList.toggle('quiz', quiz);
  document.body.classList.toggle('set', isSet);
  document.body.classList.toggle('enter', first);
  /* Richtung beim Reiterwechsel: Inhalt gleitet von der Seite herein */
  view.classList.remove('sl', 'sr');
  const pi = ORDER.indexOf(prevTab), ni = ORDER.indexOf(tab);
  const plain = !quiz && !isSet && a === tab;
  if (plain && pi >= 0 && ni >= 0 && pi !== ni && !first) { void view.offsetWidth; view.classList.add(ni > pi ? 'sl' : 'sr'); }
  prevTab = plain ? tab : null;
  first = false;
  if (!isSet) renderTabs(tab);
  view.innerHTML = html;
  view.querySelectorAll('[data-w]').forEach(e => { e.style.width = e.dataset.w + '%'; });
}

/* Uhr für den Klausur-Modus: Anzeige jede Sekunde, bei Ablauf automatisch abgeben */
setInterval(() => {
  const r = DB.open.exam;
  if (!r) return;
  if (examLeft(r) <= 0) {
    const onExam = /^#(quiz|grid)\/exam/.test(location.hash);
    const d = finishOpen('exam', true);
    if (onExam) go('#sum/' + d.id); else render();
    toast('Zeit abgelaufen – Klausur automatisch abgegeben');
    return;
  }
  document.querySelectorAll('[data-timer]').forEach(e => {
    e.querySelector('[data-el]').textContent = fmtDur(Date.now() - r.start);
    e.classList.toggle('low', examLeft(r) < 600000);
  });
  document.querySelectorAll('[data-left]').forEach(e => { e.textContent = fmtDur(examLeft(r)); });
}, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { HC = null; render(); syncNow(); }
  else if (syncT) syncNow();
});
window.addEventListener('online', () => syncNow());

let lastHash = '';
let navT = 0;
window.addEventListener('hashchange', () => {
  const h = location.hash;
  if (h !== lastHash) {
    openDetail = null; delArmed = false; subArmed = false; unlinkArmed = false; pick = new Set(); window.scrollTo(0, 0);
    document.body.classList.add('nav');
    clearTimeout(navT); navT = setTimeout(() => document.body.classList.remove('nav'), 450);
  }
  lastHash = h;
  render();
});

view.addEventListener('change', e => {
  if (e.target.dataset.in === 'examdate') { DB.set.examDate = e.target.value || null; DB.set._t = Date.now(); save(); render(); }
  if (e.target.dataset.in === 'import' && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; }
});

view.addEventListener('mouseover', e => {
  const tile = e.target.closest && e.target.closest('.mgrid i[data-q]');
  if (tile && matchMedia('(hover: hover)').matches && tile.dataset.q !== mosSel) selectTile(tile.dataset.q);
});
view.addEventListener('input', e => {
  if (e.target.dataset.in === 'code') codeDraft = e.target.value;
  if (e.target.dataset.in === 'mnote') {
    const m = DB.marks[e.target.dataset.id];
    if (m) { m.note = e.target.value.slice(0, 500); m.t = Date.now(); saveLocal(); syncSoon(); }
  }
});
view.addEventListener('keydown', e => {
  if (e.target.dataset.in === 'code' && e.key === 'Enter') { e.preventDefault(); const b = view.querySelector('[data-act="link"]'); if (b) b.click(); }
});

view.addEventListener('click', e => {
  const tile = e.target.closest('.mgrid i[data-q]');
  if (tile) { selectTile(tile.dataset.q); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act, tab = el.dataset.tab;
  const r = tab ? DB.open[tab] : null;
  const x = DB.open.exam;
  switch (act) {
    case 'start': {
      const exam = tab === 'exam';
      const b = buildIds(exam ? 'mix' : tab, el.dataset.kind);
      if (!b.ids.length) break;
      if (exam) startRun('exam', 'Prüfung · ' + b.title, b.ids, { key: b.key, exam: true, limit: EXAM_MIN * 60000, flag: {} });
      else startRun(tab, b.title, b.ids, { key: b.key });
      break;
    }
    case 'resume': pick = new Set(); go('#quiz/' + tab); break;
    case 'leave': go('#' + (tab === 'exam' ? 'mix' : tab)); break;
    case 'discard': if (r) tomb(r.id); delete DB.open[tab]; save(); render(); break;
    case 'finish': {
      const done = finishOpen(tab);
      go(done ? '#sum/' + done.id : '#' + tab);
      break;
    }
    case 'pick': {
      const L = el.dataset.l;
      if (pick.has(L)) pick.delete(L); else pick.add(L);
      render();
      break;
    }
    case 'check': {
      const q = BYID[r.ids[r.pos]];
      r.ans[q.id] = LETTERS.filter(L => pick.has(L)).join('');
      r.at[q.id] = Date.now();
      pick = new Set();
      save();
      render();
      break;
    }
    case 'next': case 'prev': {
      r.pos += act === 'next' ? 1 : -1;
      pick = new Set();
      save();
      render();
      window.scrollTo(0, 0);
      break;
    }
    /* Klausur-Modus */
    case 'xpick': {
      const id = x.ids[x.pos], L = el.dataset.l;
      const cur = new Set((x.ans[id] || '').split(''));
      if (cur.has(L)) cur.delete(L); else cur.add(L);
      x.ans[id] = LETTERS.filter(k => cur.has(k)).join('');
      x.at[id] = Date.now();
      save(); render();
      break;
    }
    case 'flag': {
      const id = x.ids[x.pos];
      if (x.flag[id]) delete x.flag[id]; else x.flag[id] = true;
      save(); render();
      break;
    }
    case 'xnext': case 'xprev': x.pos += act === 'xnext' ? 1 : -1; save(); render(); window.scrollTo(0, 0); break;
    case 'grid': go('#grid/exam'); break;
    case 'jump': x.pos = +el.dataset.i; save(); go('#quiz/exam'); break;
    case 'submit': {
      if (!subArmed) { subArmed = true; render(); break; }
      subArmed = false;
      const d = finishOpen('exam');
      if (d) go('#sum/' + d.id);
      break;
    }
    case 'toggle': openDetail = openDetail === el.dataset.id ? null : el.dataset.id; render(); break;
    case 'mark': setMark(el.dataset.id, !isMarked(el.dataset.id)); render(); break;
    case 'unmark': setMark(el.dataset.id, false); if (openDetail === el.dataset.id) openDetail = null; render(); break;
    case 'gohist': go('#hist'); break;
    case 'one': {
      const q = BYID[el.dataset.id];
      if (q) startRun(q.f, `Einzelfrage · ${EXS[q.e]} · Frage ${q.n}`, [q.id]);
      break;
    }
    case 'settings': openSettings(); break;
    case 'setback': go('#' + setFrom); break;
    case 'goal': DB.set.goal = +el.dataset.g; DB.set._t = Date.now(); save(); render(); break;
    case 'clrdate': DB.set.examDate = null; DB.set._t = Date.now(); save(); render(); break;
    case 'mkcode': linkCode(newCode(), true); break;
    case 'link': { const c = fmtCode(codeDraft); if (!c) { toast('Der Code hat 12 Zeichen'); break; } linkCode(c, false); break; }
    case 'copycode': navigator.clipboard && navigator.clipboard.writeText(SY.code).then(() => toast('Code kopiert'), () => {}); break;
    case 'syncnow': syncNow(); break;
    case 'unlink': {
      if (!unlinkArmed) { unlinkArmed = true; render(); break; }
      unlinkArmed = false; SY = { code: null, last: null }; saveSY(); syncSt = 'idle'; render();
      toast('Synchronisation beendet – Lernstand bleibt auf diesem Gerät');
      break;
    }
    case 'export': exportFile(); break;
    case 'theme': DB.set.theme = el.dataset.t; save(); applyTheme(DB.set.theme); render(); break;
    case 'updcheck': checkUpdate(); break;
    case 'updapply': applyUpdate(); break;
    case 'openrun': go('#run/' + el.dataset.run); break;
    case 'retry': {
      const run = DB.done.find(y => y.id === el.dataset.run);
      const s = runStats(run);
      const t = run.tab === 'exam' ? 'mix' : run.tab;
      startRun(t, 'Wiederholung: ' + run.title.replace(/^Wiederholung: /, '').replace(/^Prüfung · /, ''), s.wrong);
      break;
    }
    case 'del': {
      if (!delArmed) { delArmed = true; render(); break; }
      tomb(el.dataset.run);
      DB.done = DB.done.filter(y => y.id !== el.dataset.run);
      save();
      go('#hist');
      break;
    }
  }
});

render();
lastHash = location.hash;
syncNow();

/* Tastatur (Mac): nur Tastendrücke, Touch-Bedienung bleibt unberührt */
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tg = e.target;
  if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
  const press = sel => { const b = view.querySelector(sel); if (b && !b.disabled) { b.click(); return true; } return false; };
  const k = e.key;
  const hash = location.hash.slice(1) || 'mix';
  const inExam = /^(quiz|grid)\/exam/.test(hash) && DB.open.exam;
  const inQuiz = /^quiz\//.test(hash) && document.body.classList.contains('quiz');
  let done = false;
  const n = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', a: 'A', b: 'B', c: 'C', d: 'D' }[k.toLowerCase()];
  if (k === 'Escape') {
    done = press('.back') || press('[data-act="leave"]');
    if (!done && /^sum\//.test(hash)) { const r = DB.done.find(x => x.id === hash.split('/')[1]); go('#' + (r && r.tab !== 'exam' ? r.tab : 'mix')); done = true; }
  } else if (inExam && hash.startsWith('quiz')) {
    if (n && !e.repeat) done = press(`[data-act="xpick"][data-l="${n}"]`);
    else if (k === 'ArrowRight') done = press('[data-act="xnext"]');
    else if (k === 'ArrowLeft') done = press('[data-act="xprev"]');
    else if (k === 'Enter') done = press('[data-act="xnext"]') || press('.btn.primary[data-act="grid"]');
    else if (k.toLowerCase() === 'u' && !e.repeat) done = press('[data-act="flag"]');
    else if (k.toLowerCase() === 'g') done = press('[data-act="grid"]');
  } else if (inQuiz) {
    if (n && !e.repeat) done = press(`[data-act="pick"][data-l="${n}"]`);
    else if (k === 'Enter') done = press('[data-act="check"]') || press('[data-act="next"]') || press('[data-act="finish"]');
    else if (k === 'ArrowRight') done = press('[data-act="next"]') || press('[data-act="finish"]');
    else if (k === 'ArrowLeft') done = press('[data-act="prev"]');
  } else if ((k === 'ArrowRight' || k === 'ArrowLeft') && !document.body.classList.contains('set') && !document.body.classList.contains('quiz')) {
    const cur = ORDER.indexOf(hash.split('/')[0]);
    const nx = cur + (k === 'ArrowRight' ? 1 : -1);
    if (cur >= 0 && nx >= 0 && nx < ORDER.length) { go('#' + ORDER[nx]); done = true; }
    else if (cur === ORDER.length - 1 && nx === ORDER.length) { openSettings(); done = true; }
  } else if (k === 'ArrowLeft' && document.body.classList.contains('set')) {
    done = press('[data-act="setback"]');
  }
  if (done) e.preventDefault();
});

/* Wischen zwischen den Reitern (nicht in Prüfungen und Einstellungen) */
let sw = null;
document.addEventListener('touchstart', e => {
  if (e.touches.length !== 1 || document.body.classList.contains('quiz') || document.body.classList.contains('set')) { sw = null; return; }
  const t = e.touches[0];
  if (t.clientX < 22 || t.clientX > window.innerWidth - 22) { sw = null; return; }
  sw = { x: t.clientX, y: t.clientY, t: Date.now() };
}, { passive: true });
document.addEventListener('touchend', e => {
  if (!sw) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - sw.x, dy = t.clientY - sw.y, dt = Date.now() - sw.t;
  sw = null;
  if (Math.abs(dx) < 60 || Math.abs(dx) < 1.6 * Math.abs(dy) || dt > 700) return;
  const cur = ORDER.indexOf(prevTab);
  if (cur < 0) return;
  const nx = cur + (dx < 0 ? 1 : -1);
  if (nx >= 0 && nx < ORDER.length) go('#' + ORDER[nx]);
}, { passive: true });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
