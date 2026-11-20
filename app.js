'use strict';
/* Altklausuren Psycho 2 – Abfrage-App. Daten: data.js (QUESTIONS). Speicher nur lokal. */

const VERSION = '1.0';
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
};
const TABS = [
  ['pers', 'Persönlichkeit'], ['entw', 'Entwicklung'], ['diag', 'Diagnostik'],
  ['mix', 'Gemischt'], ['hist', 'Versuche'],
];

const BYID = {};
QUESTIONS.forEach(q => { BYID[q.id] = q; });

/* ---------- Speicher ---------- */
function blank() { return { v: 1, open: {}, done: [] }; }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.v === 1 && d.open && Array.isArray(d.done)) return d;
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
  return { n, full: n === 4 };
}
function runStats(run) {
  const ids = run.ids.filter(id => run.ans[id] !== undefined);
  let full = 0, stm = 0;
  const wrong = [], unsure = [];
  ids.forEach(id => {
    const g = grade(BYID[id], run.ans[id]);
    stm += g.n;
    if (g.full) full++; else wrong.push(id);
    if (BYID[id].m.includes('UNSICHER')) unsure.push(id);
  });
  return { answered: ids.length, total: run.ids.length, full, stm, wrong, unsure, ids };
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

function renderTabs(active) {
  tabsEl.innerHTML = TABS.map(([id, name]) =>
    `<a href="#${id}" class="${id === active ? 'on' : ''}" ${id === active ? 'aria-current="page"' : ''}>` +
    `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg>${name}</a>`).join('');
}

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
    <div class="d">${s.answered} von ${s.total} beantwortet · ${s.full} vollständig richtig</div>
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
  let h = `<h1>${FACH[f]}</h1><p class="sub">36 Fragen aus den Klausuren 2020–2022 · 1–4 Antworten richtig</p>`;
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
  let h = `<h1>Gemischt</h1><p class="sub">Alle drei Bereiche · 108 Fragen</p>`;
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
    h += `<div class="verdict ${g.full ? 'ok' : 'bad'}">${g.full ? 'Vollständig richtig' : `Nicht ganz: ${g.n} von 4 Aussagen richtig behandelt`}` +
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
      `<span class="v">${g.n}/4</span></button>`;
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
  const pct = s.answered ? Math.round(100 * s.stm / (4 * s.answered)) : 0;
  let h = fromHist ? `<div class="qtop"><div class="line"><button class="back" data-act="gohist">‹ Versuche</button><span></span></div></div>` : '';
  h += `<div class="big">${s.full}<small> / ${s.answered}</small></div>`;
  h += `<p class="sub">vollständig richtig · ${pct} % der Aussagen richtig behandelt` +
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

function histView() {
  const last = lastStatus();
  let h = `<h1>Versuche</h1><p class="sub">Abgeschlossene Abfragen, neueste zuerst</p>`;
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
    return row('openrun', esc(r.title), fmtDate(r.start), `${s.full}/${s.answered}`, `data-run="${r.id}"`);
  }).join('') + `</div>`;
  return h;
}

/* ---------- Router ---------- */
function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}
function render() {
  const hash = location.hash.slice(1) || 'pers';
  const [a, b] = hash.split('/');
  let html = null, tab = a, quiz = false;
  if (a === 'quiz' && DB.open[b]) { html = quizView(b); tab = b; quiz = true; }
  else if (a === 'sum' || a === 'run') {
    const r = DB.done.find(x => x.id === b);
    if (r) { html = summaryView(r, a === 'run'); tab = a === 'run' ? 'hist' : r.tab; quiz = a === 'sum'; }
  }
  if (html === null) {
    if (a === 'quiz') tab = b;
    if (!TABS.some(t => t[0] === tab)) tab = 'pers';
    html = tab === 'hist' ? histView() : tab === 'mix' ? mixView() : fachView(tab);
  }
  document.body.classList.toggle('quiz', quiz);
  renderTabs(tab);
  view.innerHTML = html;
  view.querySelectorAll('[data-w]').forEach(e => { e.style.width = e.dataset.w + '%'; });
}

let lastHash = '';
window.addEventListener('hashchange', () => {
  const h = location.hash;
  if (h !== lastHash) { openDetail = null; delArmed = false; pick = new Set(); window.scrollTo(0, 0); }
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

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
