'use strict';
/* Altklausuren Psycho 2 – Abfrage-App. Daten: data.js (QUESTIONS). Speicher nur lokal. */

const VERSION = '1.5';
const KEY = 'psyklausur-v1';
const LETTERS = ['A', 'B', 'C', 'D'];
const FACH = { pers: 'Persönlichkeit', entw: 'Entwicklung', diag: 'Diagnostik' };
const EXAM = { 2020: '24.07.2020', 2021: '16.07.2021', 2022: '11.02.2022' };
const MARK = {
  ABGLEICHEN: 'Abgleichen',
  SPEZIALWISSEN: 'Spezialwissen',
  UNSICHER: 'Schlüssel unsicher',
  FRAGESATZ_FEHLT: 'Fragesatz fehlt',
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

const BYID = {};
QUESTIONS.forEach(q => { BYID[q.id] = q; });

/* ---------- Speicher ---------- */
function blank() { return { v: 1, open: {}, done: [], set: { theme: 'system', fach: 'pers' } }; }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.v === 1 && d.open && Array.isArray(d.done)) { d.set = d.set || { theme: 'system' }; return d; }
  } catch (e) { /* leer */ }
  return blank();
}
let DB = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* voll oder gesperrt */ }
}

/* ---------- Hilfen ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function ofFach(f) { return QUESTIONS.filter(q => q.f === f).map(q => q.id); }
function fmtDate(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}
/* Auswertung einer Antwort: korrekt behandelte Aussagen (0–4) und vollständig richtig */
function grade(q, a) {
  let n = 0;
  LETTERS.forEach(L => { if (q.k.includes(L) === a.includes(L)) n++; });
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
  const max = 4 * ids.length;
  return { answered: ids.length, total: run.ids.length, full, stm, pts, max, pass: max > 0 && pts >= PASS * max, wrong, unsure, ids };
}
/* Letzter Stand je Frage über alle Versuche */
function lastStatus() {
  const last = {};
  const runs = DB.done.concat(Object.values(DB.open));
  runs.forEach(r => {
    Object.keys(r.ans).forEach(id => {
      const t = (r.at && r.at[id]) || r.start;
      if (!last[id] || last[id].t < t) last[id] = { t, full: grade(BYID[id], r.ans[id]).full };
    });
  });
  return last;
}

/* ---------- Versuche ---------- */
function startRun(tab, title, ids) {
  finishOpen(tab);
  DB.open[tab] = { id: 'r' + Date.now().toString(36), tab, title, ids, ans: {}, at: {}, pos: 0, start: Date.now() };
  save();
  pick = new Set();
  go('#quiz/' + tab);
}
/* Offenen Versuch abschließen: mit Antworten → Versuche, ohne → verwerfen */
function finishOpen(tab) {
  const r = DB.open[tab];
  if (!r) return null;
  delete DB.open[tab];
  if (Object.keys(r.ans).length) {
    r.end = Date.now();
    DB.done.push(r);
    save();
    return r;
  }
  save();
  return null;
}

/* ---------- Ansichten ---------- */
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
let pick = new Set();
let openDetail = null;
let delArmed = false;

/* Tab-Leiste: einmal aufbauen, danach nur Klassen und Hinterlegung umstellen (damit es gleitet) */
function buildTabs() {
  tabsEl.innerHTML = `<div class="pill"><span class="glow"></span>` +
    `<a href="#${DB.set.fach || 'pers'}" class="grp" data-t="grp"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON.grp}</svg><span>Bereiche</span></a>` +
    TABS.map(([id, name]) => `<a href="#${id}" data-t="${id}" class="${FACH[id] ? 'f' : ''}">` +
      `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg><span>${SHORT[id] || name}</span></a>`).join('') + `</div>`;
}
function renderTabs(active) {
  if (!tabsEl.firstChild) buildTabs();
  const pill = tabsEl.firstChild;
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
  const pct = Math.round(100 * s.answered / s.total);
  return `<div class="label">Laufender Versuch</div><div class="resume">
    <div class="t">${esc(r.title)}</div>
    <div class="d">${s.answered} von ${s.total} beantwortet · ${s.pts} von ${s.max} Punkten</div>
    <div class="bar"><i data-w="${pct}"></i></div>
    <div class="btns"><button class="btn primary" data-act="resume" data-tab="${tab}">Fortsetzen</button>
    ${s.answered ? `<button class="btn" data-act="finish" data-tab="${tab}">Auswerten</button>` : ''}
    <button class="btn plain" data-act="discard" data-tab="${tab}">Verwerfen</button></div></div>`;
}

function fachView(f) {
  const ids = ofFach(f);
  const last = lastStatus();
  const seen = ids.filter(id => last[id]);
  const ok = seen.filter(id => last[id].full).length;
  const wrong = seen.length - ok;
  let h = gearBtn() + `<h1>${FACH[f]}</h1><p class="sub">36 Fragen aus den Klausuren 2020–2022 · 1–4 Antworten richtig</p>`;
  h += resumeCard(f);
  h += `<div class="label">Abfragen</div><div class="list">`;
  h += row('start', 'Alle 36 Fragen', 'Reihenfolge wie in den Klausuren', '', `data-tab="${f}" data-kind="all"`);
  h += row('start', 'Alle 36 Fragen gemischt', 'Zufällige Reihenfolge', '', `data-tab="${f}" data-kind="shuf"`);
  h += row('start', '12 zufällige Fragen', 'Kurze Runde', '', `data-tab="${f}" data-kind="r12"`);
  h += row('start', 'Bisher Falsche', 'Zuletzt nicht vollständig richtig', String(wrong), `data-tab="${f}" data-kind="wrong" ${wrong ? '' : 'disabled'}`);
  h += row('start', 'Noch nie beantwortet', '', String(ids.length - seen.length), `data-tab="${f}" data-kind="new" ${ids.length - seen.length ? '' : 'disabled'}`);
  h += `</div><div class="label">Nach Klausur</div><div class="list">`;
  [2020, 2021, 2022].forEach(y => {
    h += row('start', `Klausur ${EXAM[y]}`, '', '12', `data-tab="${f}" data-kind="y${y}"`);
  });
  h += `</div><p class="foot">Stand: ${ok} von 36 zuletzt vollständig richtig.</p>`;
  return h;
}

function mixView() {
  const last = lastStatus();
  const wrong = QUESTIONS.filter(q => last[q.id] && !last[q.id].full).length;
  const ok = QUESTIONS.filter(q => last[q.id] && last[q.id].full).length;
  let h = gearBtn() + `<h1>Gemischt</h1><p class="sub">Alle drei Bereiche · ${ok} von 108 zuletzt vollständig richtig</p>`;
  h += resumeCard('mix');
  h += `<div class="label">Abfragen</div><div class="list">`;
  h += row('start', 'Probeklausur', '36 Fragen, je 12 pro Bereich, zufällig', '', 'data-tab="mix" data-kind="probe"');
  h += row('start', 'Alle 108 Fragen gemischt', '', '', 'data-tab="mix" data-kind="shuf"');
  h += row('start', '20 zufällige Fragen', 'Kurze Runde', '', 'data-tab="mix" data-kind="r20"');
  h += row('start', 'Bisher Falsche', 'Aus allen Bereichen', String(wrong), `data-tab="mix" data-kind="wrong" ${wrong ? '' : 'disabled'}`);
  h += `</div><div class="label">Originalklausuren</div><div class="list">`;
  [2020, 2021, 2022].forEach(y => {
    h += row('start', `Klausur ${EXAM[y]}`, 'Alle 36 Fragen in Originalreihenfolge', '', `data-tab="mix" data-kind="y${y}"`);
  });
  h += `</div>`;
  return h;
}

function buildIds(tab, kind) {
  const pool = tab === 'mix' ? QUESTIONS.map(q => q.id) : ofFach(tab);
  const last = lastStatus();
  const name = tab === 'mix' ? 'Gemischt' : FACH[tab];
  if (kind === 'all') return [pool, `${name} · alle 36`];
  if (kind === 'shuf') return [shuffle(pool), `${name} · alle gemischt`];
  if (kind === 'r12') return [shuffle(pool).slice(0, 12), `${name} · 12 zufällige`];
  if (kind === 'r20') return [shuffle(pool).slice(0, 20), 'Gemischt · 20 zufällige'];
  if (kind === 'wrong') return [shuffle(pool.filter(id => last[id] && !last[id].full)), `${name} · bisher Falsche`];
  if (kind === 'new') return [pool.filter(id => !last[id]), `${name} · noch nie beantwortet`];
  if (kind === 'probe') {
    const ids = [].concat(...Object.keys(FACH).map(f => shuffle(ofFach(f)).slice(0, 12)));
    return [shuffle(ids), 'Probeklausur'];
  }
  if (kind[0] === 'y') {
    const y = +kind.slice(1);
    const ids = pool.filter(id => BYID[id].y === y).sort((a, b) => BYID[a].n - BYID[b].n);
    return [ids, tab === 'mix' ? `Klausur ${EXAM[y]}` : `${name} · Klausur ${EXAM[y]}`];
  }
  return [pool, name];
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
  h += `<div class="meta">Klausur ${EXAM[q.y]} · Frage ${q.n} · ${FACH[q.f]}</div>`;
  if (q.m.includes('FRAGESATZ_FEHLT')) h += `<div class="note"><b>Fragesatz fehlt.</b> In der Vorlage ist nur die Fallbeschreibung übertragen, der eigentliche Fragesatz fehlt.</div>`;
  if (q.m.includes('UNSICHER')) h += `<div class="note"><b>Schlüssel unsicher.</b> Der Lösungsschlüssel war im Original nicht eindeutig lesbar. Die Wertung gilt unter Vorbehalt.</div>`;
  h += `<div class="qtext">${esc(q.q)}</div><div class="hint1">1–4 Antworten richtig</div><div class="opts">`;
  LETTERS.forEach((L, i) => {
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
    h += `<div class="legend">Schlüssel: ${q.k} · Deine Kreuze: ${a || 'keine'}</div>`;
    h += `<div class="topic">Thema: ${esc(q.t)}</div>`;
    if (q.h.length) {
      h += `<div class="hints">` + q.h.map(([t, msg]) => `<div><b>${MARK[t] || esc(t)}</b>${esc(msg)}</div>`).join('') + `</div>`;
    }
  }
  const last = r.pos === r.ids.length - 1;
  h += `<div class="action"><div class="in">`;
  if (r.pos > 0) h += `<button class="btn plain" data-act="prev" data-tab="${tab}">Zurück</button>`;
  if (!done) h += `<button class="btn primary" data-act="check" data-tab="${tab}">${pick.size ? 'Prüfen' : 'Prüfen (nichts angekreuzt)'}</button>`;
  else if (!last) h += `<button class="btn primary" data-act="next" data-tab="${tab}">Weiter</button>`;
  else h += `<button class="btn primary" data-act="finish" data-tab="${tab}">Auswertung</button>`;
  h += `</div></div>`;
  return h;
}

function resultList(run, withDetail) {
  const s = runStats(run);
  return s.ids.map(id => {
    const q = BYID[id], a = run.ans[id], g = grade(q, a);
    const uns = q.m.includes('UNSICHER');
    const cls = g.full ? (uns ? 'warn' : 'ok') : 'bad';
    let h = `<button class="row" data-act="toggle" data-id="${id}"><span class="dot ${cls}"></span><span class="main">` +
      `<span class="t">${q.y} · Frage ${q.n} · ${FACH[q.f]}</span><span class="d">${esc(q.t)}</span></span>` +
      `<span class="v">${g.pts} P.</span></button>`;
    if (withDetail && openDetail === id) {
      h += `<div class="detail"><p>${esc(q.q)}</p><ul>` + LETTERS.map((L, i) => {
        const inKey = q.k.includes(L), picked = a.includes(L);
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
  h += `<p class="sub">Bestanden ab 60 % (${need} Punkte) · ${s.full} von ${s.answered} Fragen vollständig richtig` +
    (s.answered < s.total ? ` · ${s.total - s.answered} Fragen nicht beantwortet` : '') + `</p>`;
  h += `<div class="list"><div class="row"><span class="main"><span class="t">${esc(run.title)}</span>` +
    `<span class="d">${fmtDate(run.start)}</span></span></div></div>`;
  if (s.unsure.length) h += `<p class="foot">Unter Vorbehalt (Schlüssel unsicher): ${s.unsure.map(id => `${BYID[id].y} · Frage ${BYID[id].n}`).join(', ')}</p>`;
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
  let h = `<div class="topbar"><button class="back" data-act="setback"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Zurück</button><span></span></div><h1>Einstellungen</h1><p class="sub">Darstellung und App-Version</p>`;
  h += `<div class="label">Darstellung</div><div class="list"><div class="seg" role="radiogroup">` +
    Object.keys(THEMES).map(t => `<button data-act="theme" data-t="${t}" role="radio" aria-checked="${DB.set.theme === t}" class="${DB.set.theme === t ? 'on' : ''}">${t === 'system' ? 'System' : THEMES[t]}</button>`).join('') +
    `</div></div><p class="foot">„System“ folgt der Einstellung deines iPhones.</p>`;
  const stTxt = { idle: '', checking: 'Suche …', current: 'Aktuell', offline: 'Keine Verbindung', new: `Version ${upd.remote} verfügbar` }[upd.st];
  const stCls = upd.st === 'current' ? 'ok' : upd.st === 'new' ? 'new' : '';
  h += `<div class="label">App</div><div class="list">`;
  h += `<div class="row"><span class="main"><span class="t">Version</span></span><span class="v">${VERSION}</span></div>`;
  h += `<button class="row accent" data-act="updcheck" ${upd.st === 'checking' ? 'disabled' : ''}><span class="main"><span class="t">Nach Updates suchen</span></span><span class="v ${stCls}">${stTxt}</span></button>`;
  if (upd.st === 'new') h += `<button class="row accent" data-act="updapply"><span class="main"><span class="t">Jetzt aktualisieren</span><span class="d">Lädt die neue Version. Dein Fortschritt bleibt erhalten.</span></span></button>`;
  h += `</div>`;
  if (upd.at) h += `<p class="foot">Zuletzt geprüft: ${fmtDate(upd.at)}</p>`;
  h += `<p class="foot">Version ${VERSION} · Alle Ergebnisse bleiben nur auf diesem Gerät gespeichert.</p>`;
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
  if ((location.hash.slice(1) || 'home') === 'set') render();
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

function histView() {
  const last = lastStatus();
  let h = gearBtn() + `<h1>Versuche</h1><p class="sub">Abgeschlossene Abfragen, neueste zuerst</p>`;
  h += `<div class="stats">` + Object.keys(FACH).map(f => {
    const ids = ofFach(f);
    const ok = ids.filter(id => last[id] && last[id].full).length;
    return `<div class="stat"><b>${ok}<span> / 36</span></b><span>${FACH[f]}</span></div>`;
  }).join('') + `</div><p class="foot">Zuletzt vollständig richtig beantwortet, je Bereich.</p>`;
  const open = Object.values(DB.open);
  if (open.length) {
    h += `<div class="label">Noch offen</div><div class="list">` + open.map(r => {
      const s = runStats(r);
      return row('resume', esc(r.title), `${s.answered} von ${s.total} beantwortet`, '', `data-tab="${r.tab}"`);
    }).join('') + `</div>`;
  }
  h += `<div class="label">Abgeschlossen</div>`;
  if (!DB.done.length) return h + `<div class="list"><div class="empty">Noch keine abgeschlossenen Versuche.</div></div>`;
  h += `<div class="list">` + DB.done.slice().reverse().map(r => {
    const s = runStats(r);
    const pc = s.max ? Math.round(100 * s.pts / s.max) : 0;
    return row('openrun', esc(r.title), `${fmtDate(r.start)} · ${s.pts}/${s.max} Punkte`, `<span class="${s.pass ? 'okc' : 'badc'}">${pc} %</span>`, `data-run="${r.id}"`);
  }).join('') + `</div>`;
  return h;
}

/* ---------- Router ---------- */
function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}
let prevTab = null, first = true, setFrom = 'mix';
function render() {
  let hash = location.hash.slice(1) || 'mix';
  if (hash === 'home') hash = 'mix';
  const [a, b] = hash.split('/');
  let html = null, tab = a, quiz = false;
  if (a === 'quiz' && DB.open[b]) { html = quizView(b); tab = b; quiz = true; }
  else if (a === 'sum' || a === 'run') {
    const r = DB.done.find(x => x.id === b);
    if (r) { html = summaryView(r, a === 'run'); tab = a === 'run' ? 'hist' : r.tab; quiz = a === 'sum'; }
  }
  const isSet = a === 'set' && html === null;
  if (html === null) {
    if (a === 'quiz') tab = b;
    if (isSet) tab = 'set';
    else if (!ORDER.includes(tab)) tab = 'mix';
    html = isSet ? setView() : tab === 'hist' ? histView() : tab === 'mix' ? mixView() : fachView(tab);
  }
  if (FACH[tab] && !quiz && DB.set.fach !== tab) { DB.set.fach = tab; save(); }
  /* Farbhauch: Einstellungen behalten den Hauch der Seite, von der man kommt */
  document.documentElement.dataset.tab = isSet ? setFrom : tab;
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

let lastHash = '';
let navT = 0;
window.addEventListener('hashchange', () => {
  const h = location.hash;
  if (h !== lastHash) {
    openDetail = null; delArmed = false; pick = new Set(); window.scrollTo(0, 0);
    document.body.classList.add('nav');
    clearTimeout(navT); navT = setTimeout(() => document.body.classList.remove('nav'), 450);
  }
  lastHash = h;
  render();
});

view.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act, tab = el.dataset.tab;
  const r = tab ? DB.open[tab] : null;
  switch (act) {
    case 'start': {
      const [ids, title] = buildIds(tab, el.dataset.kind);
      if (ids.length) startRun(tab, title, ids);
      break;
    }
    case 'resume': pick = new Set(); go('#quiz/' + tab); break;
    case 'leave': go('#' + tab); break;
    case 'discard': delete DB.open[tab]; save(); render(); break;
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
    case 'toggle': openDetail = openDetail === el.dataset.id ? null : el.dataset.id; render(); break;
    case 'gohist': go('#hist'); break;
    case 'settings': setFrom = ORDER.includes(prevTab) ? prevTab : 'mix'; upd.st = upd.st === 'checking' ? upd.st : 'idle'; go('#set'); break;
    case 'setback': go('#' + setFrom); break;
    case 'theme': DB.set.theme = el.dataset.t; save(); applyTheme(DB.set.theme); render(); break;
    case 'updcheck': checkUpdate(); break;
    case 'updapply': applyUpdate(); break;
    case 'openrun': go('#run/' + el.dataset.run); break;
    case 'retry': {
      const run = DB.done.find(x => x.id === el.dataset.run);
      const s = runStats(run);
      startRun(run.tab, 'Wiederholung: ' + run.title.replace(/^Wiederholung: /, ''), s.wrong);
      break;
    }
    case 'del': {
      if (!delArmed) { delArmed = true; render(); break; }
      DB.done = DB.done.filter(x => x.id !== el.dataset.run);
      save();
      go('#hist');
      break;
    }
  }
});

render();
lastHash = location.hash;

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
