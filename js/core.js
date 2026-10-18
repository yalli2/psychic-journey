/* MindGauge core: 상태 · 백엔드 · 라우터 · UI 헬퍼 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, ''); else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of kids.flat(3)) { if (c == null || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(c)); }
  return el;
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
const fx = ST.fmt;

const MG = { mods: [], cfg: window.MG_CONFIG || {} };
const S = { room: '', me: null, my: {}, raw: {}, all: {}, backend: null, live: [], dirty: new Set(), demo: [] };
const NAMES = ['민준', '서연', '지호', '하윤', '도윤', '서윤', '예준', '지우', '시우', '수아', '주원', '다은', '현우', '채원', '유진', '태양', '건우', '소율', '은찬', '나연', '재윤', '가온', '승민', '아린', '준서', '하린', '이안', '세아', '정우', '유나', '시현', '다인'];
MG.add = m => { MG.mods.push(m); MG.mods.sort((a, b) => a.no - b.no); };
const modById = id => MG.mods.find(m => m.id === id);

/* ---------- backends ---------- */
function localBackend() {
  const key = `mg:room:${S.room}`;
  const read = () => { try { return JSON.parse(lsGet(key) || '{}'); } catch (e) { return {}; } };
  return {
    name: 'local', label: '체험 모드 · 이 기기에서만',
    async put(m, id, d) { const o = read(); (o[m] = o[m] || {})[id] = d; lsSet(key, JSON.stringify(o)); },
    async del(m, id) { const o = read(); if (o[m]) delete o[m][id]; lsSet(key, JSON.stringify(o)); },
    watch(cb) { let last = null; const tick = () => { const s = lsGet(key) || '{}'; if (s !== last) { last = s; cb(JSON.parse(s)); } }; tick(); const t = setInterval(tick, 1000); return () => clearInterval(t); }
  };
}
function fbBackend(base) {
  base = base.replace(/\/$/, '');
  const u = p => `${base}/mindgauge/${S.room}${p}.json`;
  return {
    name: 'firebase', label: 'LIVE · 실시간 공유',
    put: (m, id, d) => fetch(u(`/${m}/${id}`), { method: 'PUT', body: JSON.stringify(d) }),
    del: (m, id) => fetch(u(`/${m}/${id}`), { method: 'DELETE' }),
    watch(cb) {
      let stop = false, t;
      const tick = async () => { if (stop) return;
        if (!document.hidden) { try { const r = await fetch(u('')); cb((await r.json()) || {}); } catch (e) { } }
        t = setTimeout(tick, 2500); };
      tick(); return () => { stop = true; clearTimeout(t); };
    }
  };
}

/* ---------- data ---------- */
const docsOf = m => (S.all[m] || []);
function rebuild() {
  const all = {};
  const ids = new Set([...MG.mods.map(m => m.id)]);
  for (const m of ids) {
    const o = S.raw[m] || {};
    let arr = Object.entries(o).map(([id, d]) => ({ ...d, id }));
    if (S.room === 'demo') arr = arr.concat(S.demo.filter(d => d._m === m).map(d => d.doc));
    const mine = S.my[m];
    arr = arr.filter(d => !(S.me && d.id === S.me.id));
    if (mine) arr.push({ ...mine, id: S.me.id });
    all[m] = arr;
  }
  S.all = all;
}
let saveT = {};
function save(m, patch, actId) {
  const d = S.my[m] || (S.my[m] = {});
  Object.assign(d, patch);
  if (actId) d._a = { ...(d._a || {}), [actId]: 1 };
  d.name = S.me.name; d.ts = Date.now();
  lsSet(`mg:my:${S.room}:${S.me.id}:${m}`, JSON.stringify(d));
  rebuild(); notify(m);
  clearTimeout(saveT[m]);
  saveT[m] = setTimeout(() => { if (S.backend) Promise.resolve(S.backend.put(m, S.me.id, d)).catch(() => { }); }, 300);
}
function loadMine() {
  S.my = {};
  for (const m of MG.mods) { try { const v = JSON.parse(lsGet(`mg:my:${S.room}:${S.me.id}:${m.id}`) || 'null'); if (v) S.my[m.id] = v; } catch (e) { } }
}
let notifyT = null;
function notify(m) { S.dirty.add(m); clearTimeout(notifyT); notifyT = setTimeout(flush, 100); }
function flush() {
  const ds = S.dirty; S.dirty = new Set();
  S.live = S.live.filter(l => l.box.isConnected);
  S.live.forEach(l => { if (l.mods.some(x => ds.has(x))) l.run(); });
  updateRuler();
}
function live(mods, fn) {
  const box = h('div', { class: 'live-box' });
  const run = () => { try { const r = fn(); box.innerHTML = ''; if (typeof r === 'string') box.innerHTML = r; else if (r) box.append(r); }
    catch (e) { box.innerHTML = `<div class="empty">표시 중 오류: ${esc(e.message)}</div>`; console.error(e); } };
  run(); S.live.push({ mods: [].concat(mods), run, box }); box.refresh = run; return box;
}

/* ---------- demo cohort (room "demo") ---------- */
function buildDemo() {
  S.demo = [];
  for (let i = 0; i < 32; i++) {
    const rng = ST.rng(1000 + i * 17);
    const p = { i, name: NAMES[i], t: ST.norm(rng), u: ST.norm(rng) * 0.6, rng, id: 'demo-' + String(i).padStart(2, '0') };
    p.perfz = 0.55 * p.t + Math.sqrt(1 - 0.3) * ST.norm(rng);
    for (const m of MG.mods) if (m.demo) { const doc = m.demo(p, ST.rng(5000 + i * 31 + m.no)); if (doc) S.demo.push({ _m: m.id, doc: { ...doc, id: p.id, name: p.name, demo: true, ts: Date.now() - i * 60000, _a: Object.fromEntries((m.acts || []).map(a => [a.id, 1])) } }); }
  }
}
async function seedBackendDemo(n = 24) {
  buildDemo();
  for (const x of S.demo.slice(0)) { if (x.doc.id.slice(5) >= n) continue; const { id, ...d } = x.doc; await S.backend.put(x._m, id, d); }
  S.demo = [];
}
async function clearBackendDemo() {
  for (const m of MG.mods) for (const d of docsOf(m.id)) if (String(d.id).startsWith('demo-')) await S.backend.del(m.id, d.id);
}

/* ---------- UI helpers ---------- */
function stats(pairs) { return `<div class="stat">${pairs.map(([v, l, tone]) => `<div class="${tone || ''}"><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div>`; }
function empty(t = '아직 응답이 없습니다. 왼쪽에서 먼저 참여해 보세요.') { return `<div class="empty">${t}</div>`; }
function badge(t, tone = '') { return `<span class="badge ${tone}">${t}</span>`; }
function table(head, rows, cls = '') { return `<div class="tbl-wrap"><table class="tbl ${cls}"><thead><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
function note(t, tone = '') { return `<p class="note ${tone}">${t}</p>`; }
const nOf = m => docsOf(m).length;
function who(d) { return d.id === (S.me && S.me.id) ? `<b>${esc(d.name)}</b> (나)` : esc(d.name); }

function ctxFor(m, a) {
  const ctx = {
    mod: m.id, act: a,
    my: () => S.my[m.id] || {},
    docs: () => docsOf(m.id),
    save: (patch, done = true) => save(m.id, patch, done ? a.id : null),
    done: () => save(m.id, {}, a.id),
    refresh: () => ctx.box && ctx.box.refresh && ctx.box.refresh()
  };
  return ctx;
}
function actCard(m, a) {
  const ctx = ctxFor(m, a);
  const left = h('div', { class: 'act-in' });
  if (a.input) a.input(left, ctx);
  const out = live([m.id, ...(a.mods || [])], () => a.out(ctx));
  ctx.box = out;
  const card = h('section', { class: 'act', id: 'act-' + a.id },
    h('header', {}, h('h3', {}, a.title), a.src ? h('span', { class: 'src' }, a.src) : null),
    a.lead ? h('p', { class: 'lead' }, a.lead) : null,
    h('div', { class: 'act-grid' + (a.wide ? ' wide' : '') }, a.input ? left : null, h('div', { class: 'act-out' }, h('div', { class: 'out-head' }, h('span', { class: 'live-dot' }), '그룹 결과'), out)));
  return card;
}

/* generic quiz activity */
function quiz({ id, title, src, lead, items, opts, dist = false, mods = [] }) {
  return {
    id, title, src, lead, mods,
    input(el, ctx) {
      const done = ctx.my()[id];
      const form = h('form', { class: 'quiz' });
      items.forEach((it, i) => {
        const o = it.opts || opts;
        form.append(h('fieldset', {}, h('legend', {}, h('span', { class: 'qn' }, i + 1), it.q),
          h('div', { class: 'choices' }, o.map((t, j) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: `${id}-${i}`, value: j, checked: done && done.c && done.c[i] === j }), h('span', {}, t))))));
      });
      form.append(h('button', { class: 'btn', type: 'submit' }, done ? '다시 제출' : '제출하고 결과 보기'));
      form.addEventListener('submit', e => { e.preventDefault(); const c = items.map((_, i) => { const x = form.querySelector(`input[name="${id}-${i}"]:checked`); return x ? +x.value : -1; });
        if (c.includes(-1) && !confirm('답하지 않은 문항이 있습니다. 그대로 제출할까요?')) return; ctx.save({ [id]: { c } }); });
      el.append(form);
    },
    out(ctx) {
      const docs = ctx.docs().filter(d => d[id] && d[id].c); if (!docs.length) return empty();
      const me = ctx.my()[id];
      const o = i => items[i].opts || opts;
      let html = '';
      if (!dist) {
        const per = items.map((it, i) => { const k = docs.filter(d => d[id].c[i] === it.a).length; return k / docs.length; });
        const myScore = me ? items.filter((it, i) => me.c[i] === it.a).length : null;
        const avg = ST.mean(docs.map(d => items.filter((it, i) => d[id].c[i] === it.a).length));
        html += stats([[docs.length, '참여'], [myScore == null ? '–' : `${myScore}/${items.length}`, '내 점수'], [fx(avg, 1), '그룹 평균']]);
        html += `<div class="bars">${items.map((it, i) => {
          const pct = per[i], mine = me ? (me.c[i] === it.a ? '✓' : '✗') : '';
          return `<div class="bar-row"><div class="bar-lab"><span class="qn sm">${i + 1}</span>${esc(it.short || it.q.slice(0, 24))}</div><div class="bar-track"><i style="width:${pct * 100}%;background:var(--c1)"></i></div><div class="bar-val">${Math.round(pct * 100)}% <em class="${mine === '✓' ? 'ok' : mine === '✗' ? 'no' : ''}">${mine}</em></div></div>`;
        }).join('')}</div>`;
        if (me) html += `<details class="why"><summary>정답과 해설 보기</summary>${items.map((it, i) => `<p><b>${i + 1}.</b> 정답 <mark>${esc(o(i)[it.a])}</mark> — ${esc(it.why || '')}</p>`).join('')}</details>`;
      } else {
        html += stats([[docs.length, '참여']]);
        html += items.map((it, i) => { const oo = o(i); const cnt = oo.map((_, j) => docs.filter(d => d[id].c[i] === j).length);
          return `<div class="vote"><p class="vq"><span class="qn sm">${i + 1}</span>${esc(it.q)}</p>${stackBar(oo, cnt, me ? me.c[i] : -1, it.a)}${me && it.why ? `<p class="vwhy">${esc(it.why)}</p>` : ''}</div>`; }).join('');
      }
      return html;
    }
  };
}
function stackBar(labels, counts, mineIdx, recIdx) {
  const tot = ST.sum(counts) || 1;
  const cols = ['var(--c1)', 'var(--c3)', 'var(--c4)', 'var(--c2)', 'var(--muted)'];
  return `<div class="stack">${counts.map((c, j) => c ? `<i style="flex:${c};background:${cols[j % 5]}" title="${esc(labels[j])}: ${c}명 (${Math.round(c / tot * 100)}%)">${c / tot > .12 ? Math.round(c / tot * 100) + '%' : ''}</i>` : '').join('')}</div>
  <div class="legend">${labels.map((l, j) => `<span><s style="background:${cols[j % 5]}"></s>${esc(l)} ${counts[j]}${j === mineIdx ? ' <em>(나)</em>' : ''}${j === recIdx ? ' <em class="ok">권장</em>' : ''}</span>`).join('')}</div>`;
}

/* ---------- router & shell ---------- */
function progressOf(m) { const a = S.my[m.id] && S.my[m.id]._a || {}; return (m.acts || []).length ? Object.keys(a).length / m.acts.length : 0; }
function buildRuler() {
  const nav = $('#ruler'); nav.innerHTML = '';
  nav.append(h('a', { href: '#/', class: 'rk home', 'data-id': 'home' }, h('b', {}, 'MG'), h('span', {}, '홈')));
  MG.mods.forEach(m => nav.append(h('a', { href: '#/' + m.id, class: 'rk', 'data-id': m.id, title: m.title }, h('b', {}, m.no), h('span', {}, m.short || m.title), h('i', { class: 'fill' }))));
  updateRuler();
}
function updateRuler() {
  const cur = (location.hash.replace('#/', '') || 'home');
  $$('#ruler .rk').forEach(a => { const id = a.dataset.id; const m = modById(id);
    a.classList.toggle('on', id === cur); if (m) { const p = progressOf(m); a.style.setProperty('--p', p); a.classList.toggle('done', p >= 1); } });
  const cnt = new Set(); MG.mods.forEach(m => docsOf(m.id).forEach(d => cnt.add(d.id)));
  const n = $('#n-people'); if (n) n.textContent = cnt.size;
}
function route() {
  const id = location.hash.replace('#/', '') || 'home';
  S.live = [];
  const main = $('#main'); main.innerHTML = '';
  if (!S.me) { main.append(renderHome()); updateRuler(); return; }
  const m = modById(id);
  main.append(m ? renderModule(m) : renderHome());
  window.scrollTo(0, 0); updateRuler(); document.title = (m ? `${m.no}. ${m.title} · ` : '') + 'MindGauge';
}
function renderModule(m) {
  const idx = MG.mods.indexOf(m), prev = MG.mods[idx - 1], next = MG.mods[idx + 1];
  const wrap = h('article', { class: 'module' });
  wrap.append(h('header', { class: 'mhead' },
    h('div', { class: 'mno' }, m.no === 0 ? '준비' : String(m.no).padStart(2, '0')),
    h('div', {}, h('p', { class: 'chap' }, m.chap + ' · ' + m.pages), h('h2', {}, m.title), h('p', { class: 'sub' }, m.sub))));
  wrap.append(h('div', { class: 'recap' }, h('h4', {}, '교재에서 짚을 것'), h('ul', {}, m.recap.map(r => h('li', { html: r })))));
  (m.acts || []).forEach(a => wrap.append(actCard(m, a)));
  wrap.append(h('nav', { class: 'pager' }, prev ? h('a', { href: '#/' + prev.id }, '← ' + prev.title) : h('a', { href: '#/' }, '← 홈'), next ? h('a', { href: '#/' + next.id }, next.title + ' →') : h('a', { href: '#/' }, '홈으로')));
  return wrap;
}
function renderHome() {
  const w = h('div', { class: 'home' });
  w.append(h('section', { class: 'hero' },
    h('div', {}, h('p', { class: 'chap' }, 'HR을 위한 심리검사 설계·평가 워크숍'),
      h('h1', {}, '마음의 눈금'), h('p', { class: 'hero-en' }, 'MindGauge'),
      h('p', { class: 'hero-p' }, '사람을 숫자로 읽는다는 건 어떤 일일까요. 12개의 눈금(챕터)을 따라 직접 응답하고, 함께 모은 결과로 신뢰도·타당도·공정성을 눈으로 확인합니다.')),
    h('div', { class: 'hero-card' }, S.me ? h('div', {}, h('p', { class: 'muted' }, '입장 중'), h('h3', {}, `${S.me.name} · 방 ${S.room}`),
      h('p', { class: 'live' }, h('span', { class: 'live-dot' }), S.backend ? S.backend.label : ''),
      h('p', { class: 'muted' }, h('b', { id: 'n-people' }, '0'), '명이 참여 중'),
      h('div', { class: 'row' }, h('a', { class: 'btn', href: '#/inv' }, '준비 · TPI 응답하기'), h('button', { class: 'btn ghost', onclick: openEntry }, '이름·방 바꾸기')))
      : h('div', {}, h('h3', {}, '입장하기'), h('p', { class: 'muted' }, '별명과 진행자가 알려 준 방 코드를 입력하세요. 체험은 방 코드 demo.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: openEntry }, '입장'), h('button', { class: 'btn ghost', onclick: () => enter('체험자', 'demo') }, 'demo 방 체험'))))));
  w.append(h('section', { class: 'toc' }, h('h3', {}, '프로그램 구성'), h('div', { class: 'toc-grid' },
    MG.mods.map(m => h('a', { href: '#/' + m.id, class: 'toc-item' }, h('b', {}, m.no === 0 ? '준비' : m.no), h('div', {}, h('strong', {}, m.title), h('span', {}, m.tocline || m.sub)))))));
  if (S.me) w.append(facilitator());
  w.append(h('footer', { class: 'foot' }, '교재: Theresa J. B. Kline, Psychological Testing: A Practical Approach to Design and Evaluation (SAGE, 2005). 이 사이트의 요약·문항·차트는 교육용 재구성이며 개인 진단이나 채용 판단에 사용할 수 없습니다. 이름 대신 별명을 쓰고 민감한 개인정보는 입력하지 마세요.'));
  return w;
}
function facilitator() {
  const d = h('details', { class: 'fac' }, h('summary', {}, '진행자 도구'));
  const share = `${location.origin}${location.pathname}?room=${encodeURIComponent(S.room)}`;
  d.append(h('p', { class: 'muted' }, '수강생에게 이 주소를 공유하면 같은 방으로 입장합니다.'), h('input', { class: 'copy', readonly: true, value: share, onclick: e => e.target.select() }));
  d.append(h('div', { class: 'row' },
    S.room === 'demo' ? h('span', { class: 'muted' }, 'demo 방에는 가상 참가자 32명이 항상 포함됩니다.') : [
      h('button', { class: 'btn ghost', onclick: async e => { e.target.disabled = true; await seedBackendDemo(24); e.target.textContent = '추가했습니다'; } }, '가상 참가자 24명 추가'),
      h('button', { class: 'btn ghost', onclick: async e => { e.target.disabled = true; await clearBackendDemo(); e.target.textContent = '삭제했습니다'; } }, '가상 참가자 삭제')],
    h('button', { class: 'btn ghost', onclick: exportCsv }, '전체 응답 JSON 복사'),
    h('button', { class: 'btn ghost', onclick: () => { if (confirm('이 기기에 저장된 내 응답을 모두 지울까요?')) { MG.mods.forEach(m => { try { localStorage.removeItem(`mg:my:${S.room}:${S.me.id}:${m.id}`); } catch (e) { } if (S.backend) S.backend.del(m.id, S.me.id); }); S.my = {}; rebuild(); route(); } } }, '내 응답 지우기')));
  return d;
}
function exportCsv() {
  const out = {}; MG.mods.forEach(m => out[m.id] = docsOf(m.id));
  const txt = JSON.stringify(out, null, 1); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => alert('클립보드에 복사했습니다.')).catch(() => { const w = window.open('', '_blank'); if (w) w.document.write('<pre>' + esc(txt) + '</pre>'); });
}
function openEntry() { const d = $('#entry'); $('#en-name').value = S.me ? S.me.name : lsGet('mg:name') || ''; $('#en-room').value = S.room || new URLSearchParams(location.search).get('room') || lsGet('mg:lastroom') || ''; d.showModal(); }
async function enter(name, room) {
  name = name.trim().slice(0, 12); room = room.trim().toLowerCase().replace(/[^a-z0-9가-힣_-]/g, '').slice(0, 20);
  if (!name || !room) return;
  lsSet('mg:name', name); lsSet('mg:lastroom', room);
  let id = lsGet('mg:uid'); if (!id) { id = 'u' + Math.random().toString(36).slice(2, 10); lsSet('mg:uid', id); }
  if (S.stop) S.stop();
  S.room = room; S.me = { id, name }; loadMine();
  S.backend = MG.cfg.firebaseUrl ? fbBackend(MG.cfg.firebaseUrl) : localBackend();
  if (room === 'demo') buildDemo(); else S.demo = [];
  S.raw = {}; rebuild();
  S.stop = S.backend.watch(raw => { S.raw = raw; rebuild(); MG.mods.forEach(m => S.dirty.add(m.id)); flush(); });
  $('#mode').innerHTML = `<span class="live-dot ${S.backend.name === 'local' ? 'off' : ''}"></span>${esc(S.backend.label)} · 방 ${esc(room)}`;
  route();
}
function toggleTheme() {
  const r = document.documentElement; const cur = r.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  r.dataset.theme = cur === 'dark' ? 'light' : 'dark'; lsSet('mg:theme', r.dataset.theme); route();
}
function boot() {
  const th = lsGet('mg:theme'); if (th) document.documentElement.dataset.theme = th;
  buildRuler();
  $('#theme').addEventListener('click', toggleTheme);
  $('#entry-form').addEventListener('submit', e => { e.preventDefault(); $('#entry').close(); enter($('#en-name').value, $('#en-room').value); });
  $('#entry-cancel').addEventListener('click', () => $('#entry').close());
  window.addEventListener('hashchange', route);
  const q = new URLSearchParams(location.search).get('room'), nm = lsGet('mg:name'), lr = lsGet('mg:lastroom');
  if (nm && (q || lr)) enter(nm, q || lr); else { route(); if (q) openEntry(); }
}
