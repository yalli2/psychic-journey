/* 챕터 5–8 */
const thetaZ = () => { const t = INV.totals(); const m = ST.mean(t), s = ST.sd(t); return t.map(v => (v - m) / s); };
function irtFit() { const th = thetaZ(), rows = INV.rows(); return ITEMS.map((_, j) => { const f = ST.fit2pl(th, rows.map(r => r[j] >= 4 ? 1 : 0)); return { ...f, b: ST.clamp(f.b, -4, 4) }; }); }
let errSd = 3, selItem = 0, iccP = { m: 1, a: 1, b: 0, c: 0 }, sbK = 24;
const P3 = (th, a, b, c) => c + (1 - c) / (1 + Math.exp(-a * (th - b)));
const RELS = ['.60', '.70', '.80', '.90', '.95'];
const mkTh = () => { const out = []; for (let i = 0; i <= 60; i++) out.push(-3 + i * 0.1); return out; };

/* ================= 5. 고전검사이론 ================= */
MG.add({
  id: 'm5', no: 5, short: '고전검사이론', title: '고전검사이론과 문항분석', chap: 'Chapter 5', pages: '교재 p.91–105',
  sub: '관찰점수 = 참점수 + 오차. 이 단순한 식이 문항 난이도·변별도·문항-총점 상관의 출발점입니다.',
  tocline: 'X = T + E · 문항 난이도·변별도 · 문항 곡선',
  recap: ['<b>X = T + E</b>: 오차는 무선이고 참점수와 상관이 없다고 가정합니다 (p.91–94).', '문항 분석: 기술통계, <b>난이도 p</b>, <b>변별도 D</b>(상·하위 집단 차, Table 5.1), p 수준별 <b>문항 곡선</b>(Fig 5.1) (p.95–99).', '<b>문항-총점 상관</b>과 문항-준거 상관 (Table 5.2–5.3, p.99–104). 가중치 문제 (p.104).'],
  acts: [
    {
      id: 'xte', title: 'X = T + E 시뮬레이터', src: '교재 p.91–94', lead: '그룹 TPI 총점을 “참점수”로 보고 오차를 더해 관찰점수를 만듭니다. 오차가 커지면 신뢰도는 어떻게 될까요?', mods: ['inv'],
      input(el, ctx) { el.append(sliderField('오차의 표준편차 (SD_E)', 0, 8, 0.5, errSd, v => { errSd = v; ctx.done(); ctx.refresh(); }, v => fx(v, 1)),
        h('div', { class: 'field' }, h('label', {}, '선발 용도로 인정할 최소 신뢰도는?'), chips('rl', RELS, ctx.my().rl ? ctx.my().rl.v : null, j => ctx.save({ rl: { v: j } })))); },
      out(ctx) { let T = INV.totals(); if (T.length < 8) { const r = ST.rng(5); T = Array.from({ length: 40 }, () => 36 + 6 * ST.norm(r)); }
        const rng = ST.rng(31), X = T.map(t => t + errSd * ST.norm(rng)); const rel = ST.vari(T) / (ST.vari(T) + errSd ** 2);
        const pts = T.map((t, i) => ({ x: t, y: X[i], tip: `참 ${fx(t, 1)} → 관찰 ${fx(X[i], 1)}` })); const mn = Math.floor(Math.min(...T, ...X) - 1), mx = Math.ceil(Math.max(...T, ...X) + 1);
        const docs = ctx.docs().filter(d => d.rl);
        let html = stats([[fx(rel, 2), '신뢰도 = Var(T)/Var(X)', rel >= .8 ? 'good' : rel >= .7 ? 'warn' : 'bad'], [fx(Math.sqrt(rel), 2), 'r(T, X) = √신뢰도'], [fx(errSd, 1), '표준오차(SEM)']]) +
          CH.scatter(pts, { xmin: mn, xmax: mx, ymin: mn, ymax: mx, ident: true, xl: '참점수 T', yl: '관찰점수 X', label: '참점수 대 관찰점수' });
        if (docs.length) html += `<h4 class="sub-h">“선발용 최소 신뢰도” 투표 (${docs.length}명)</h4>` + stackBar(RELS, RELS.map((_, j) => docs.filter(d => d.rl.v === j).length), ctx.my().rl ? ctx.my().rl.v : -1);
        return html + note(T.length === 40 && INV.totals().length < 8 ? '응답자가 적어 가상의 정규 분포(평균 36, SD 6)로 그렸습니다.' : '그룹 총점을 참점수로 사용했습니다.'); }
    },
    {
      id: 'ia', title: '문항분석표', src: '교재 Table 5.1 · 5.2, p.95–104', lead: 'TPI 12문항을 난이도·변별도·문항-총점 상관으로 점검합니다. 문항-총점 상관이 낮은 문항은 개선·삭제 후보입니다.', wide: true, mods: ['inv'],
      out() { const n = INV.need(8); if (n) return n; const rows = INV.rows(), tot = rows.map(r => ST.sum(r)); const idx = tot.map((t, i) => i).sort((a, b) => tot[a] - tot[b]); const k = Math.max(2, Math.round(rows.length * .27)); const lo = idx.slice(0, k), hi = idx.slice(-k);
        const stat = ITEMS.map((it, j) => { const col = rows.map(r => r[j]); const m = ST.mean(col), sd = ST.sd(col); return { it, m, sd, p: (m - 1) / 4, D: ST.mean(hi.map(i => rows[i][j])) - ST.mean(lo.map(i => rows[i][j])), r: ST.itemRest(rows, j) }; });
        const bad = stat.filter(s => s.r < .3).length;
        return stats([[rows.length, '응답자'], [fx(ST.alpha(rows), 2), '전체 α'], [bad, 'r<.30 문항', bad ? 'warn' : 'good']]) +
          table(['문항', '평균', 'SD', '난이도 p', '변별도 D', '문항-총점 r'], stat.map(s => [esc(s.it.s), fx(s.m, 2), fx(s.sd, 2), fx(s.p, 2), fx(s.D, 2), `<span class="${s.r < .3 ? 'flag' : 'okc'}">${fx(s.r, 2)}</span>`]), 'sm') +
          `<h4 class="sub-h">문항-총점 상관 (기준선 .30)</h4>` + CH.hbars(stat.map(s => ({ label: s.it.s, v: Math.max(0, s.r), txt: fx(s.r, 2), color: s.r < .3 ? 'var(--c3)' : 'var(--c1)' })), { max: 1, d: 2, ref: .3, refLabel: '.30' }) +
          note('리커트 문항의 난이도 p는 (평균−1)/4로 환산했습니다. 변별도 D는 총점 상위 27%와 하위 27%의 평균 차입니다. 역문항은 역채점 후 계산했습니다.'); }
    },
    {
      id: 'icv', title: '문항 곡선 (p 수준별)', src: '교재 Fig 5.1, p.98–99', lead: '총점 순위를 네 구간으로 나눠 구간별 문항 평균을 이으면 문항 곡선이 됩니다. 잘 변별하는 문항일수록 오른쪽으로 가파르게 올라갑니다.', mods: ['inv'],
      input(el, ctx) { const sel = h('select', {}, ITEMS.map((it, j) => h('option', { value: j, selected: j === selItem }, it.s))); sel.addEventListener('change', () => { selItem = +sel.value; ctx.done(); ctx.refresh(); }); el.append(h('div', { class: 'field' }, h('label', {}, '문항 선택'), sel), h('p', { class: 'note' }, '파란 선은 선택 문항, 주황·청록 점선은 변별이 가장 낮은/높은 문항입니다.')); },
      out() { const n = INV.need(8); if (n) return n; const rows = INV.rows(); const tot = rows.map(r => ST.sum(r)); const ord = tot.map((t, i) => i).sort((a, b) => tot[a] - tot[b]); const q = [0, 1, 2, 3].map(g => ord.slice(Math.floor(g * ord.length / 4), Math.floor((g + 1) * ord.length / 4)));
        const rs = ITEMS.map((_, j) => ST.itemRest(rows, j)); const best = rs.indexOf(Math.max(...rs)), worst = rs.indexOf(Math.min(...rs));
        const line = (j, name, color, dash) => ({ name, color, dash, dots: true, pts: q.map((g, i) => [i + 1, ST.mean(g.map(r => rows[r][j]))]) });
        const series = [line(selItem, ITEMS[selItem].s + ' (선택)', 'var(--c1)')]; if (best !== selItem) series.push(line(best, ITEMS[best].s + ' (최고 변별)', 'var(--c4)', 1)); if (worst !== selItem && worst !== best) series.push(line(worst, ITEMS[worst].s + ' (최저 변별)', 'var(--c3)', 1));
        return stats([[fx(rs[selItem], 2), '선택 문항 문항-총점 r', rs[selItem] < .3 ? 'warn' : 'good'], [q[0].length + '명', '구간당 인원']]) + CH.lines(series, { xmin: 0.7, xmax: 4.3, ymin: 1, ymax: 5, nx: 3, ny: 4, xl: '총점 구간 (1=하위 25% … 4=상위 25%)', yl: '문항 평균', fx: v => Number.isInteger(v) ? v : '', direct: false, label: '문항 곡선' }); }
    }],
  demo(p, rng) { return { rl: { v: Math.min(4, Math.max(0, Math.round(2 + 0.9 * ST.norm(rng)))) } }; }
});

/* ================= 6. 현대검사이론 ================= */
MG.add({
  id: 'm6', no: 6, short: '현대검사이론', title: '현대검사이론(IRT)', chap: 'Chapter 6', pages: '교재 p.107–165',
  sub: '문항 하나하나의 특성곡선을 그리면, 검사가 어느 능력 수준에서 가장 정확한지 알 수 있습니다.',
  tocline: '문항특성곡선 · 실제 데이터 곡선 · 검사정보함수',
  recap: ['1PL · 2PL · 3PL 로지스틱 모형: <b>난이도 b, 변별도 a, 추측도 c</b> (Fig 6.1–6.3, p.108–114).', '다분 반응 모형: 명목·단계(graded)·부분점수 모형 (Fig 6.7–6.24, p.114–157).', '모수 추정(최대우도·베이지안), 모형 적합, 가정 (p.157–162).', '<b>검사정보함수</b>(Fig 6.4–6.6): 어느 θ에서 정밀한가. 장점과 한계, 프로그램 (p.162–165).'],
  acts: [
    {
      id: 'icc', title: '문항특성곡선 설계 도전', src: '교재 Fig 6.1–6.3, p.108–114', lead: '도전: θ=+0.5~+1.5 구간에서 상위자를 가려내는 선발용 문항(변별도 a ≥ 1.5)을 설계하세요.',
      input(el, ctx) { const f = () => ctx.refresh(); const box = h('div', {});
        el.append(h('div', { class: 'field' }, h('label', {}, '모형'), chips('im', ['1PL (a=1 고정)', '2PL', '3PL (추측 포함)'], iccP.m, j => { iccP.m = j; f(); })),
          sliderField('변별도 a', 0.3, 3, 0.1, iccP.a, v => { iccP.a = v; f(); }, v => fx(v, 1)), sliderField('난이도 b', -3, 3, 0.1, iccP.b, v => { iccP.b = v; f(); }, v => fx(v, 1)), sliderField('추측도 c (3PL)', 0, 0.3, 0.02, iccP.c, v => { iccP.c = v; f(); }, v => fx(v, 2)),
          h('button', { class: 'btn', onclick: () => { const a = iccP.m === 0 ? 1 : iccP.a, c = iccP.m === 2 ? iccP.c : 0; ctx.save({ icc: { a, b: iccP.b, c, m: iccP.m } }); } }, '이 문항으로 제출')); },
      out(ctx) { const a = iccP.m === 0 ? 1 : iccP.a, c = iccP.m === 2 ? iccP.c : 0, b = iccP.b; const th = mkTh();
        const ok = (x, y) => x >= .5 && x <= 1.5 && y >= 1.5; const docs = ctx.docs().filter(d => d.icc);
        let html = stats([[fx(P3(b, a, b, c), 2), 'θ=b에서의 정답확률'], [fx(a * a / 4, 2), '최대 정보량(약 a²/4)'], [ok(b, a) ? '충족' : '미충족', '도전 조건', ok(b, a) ? 'good' : 'warn']]) +
          CH.lines([{ name: '내 문항', pts: th.map(t => [t, P3(t, a, b, c)]), color: 'var(--c1)' }], { xmin: -3, xmax: 3, ymin: 0, ymax: 1, xl: '능력 θ', yl: 'P(θ)', fx: v => fx(v, 0), fy: v => fx(v, 1), vlines: [{ x: b, label: 'b', color: 'var(--c3)' }], bands: [{ x0: .5, x1: 1.5, label: '목표 구간' }], label: '문항특성곡선' });
        if (docs.length) { const k = docs.filter(d => ok(d.icc.b, d.icc.a)).length; html += `<h4 class="sub-h">제출된 문항들 (녹색 띠 = 목표 b 구간, 위쪽일수록 변별도 높음)</h4>` + CH.scatter(docs.map(d => ({ x: d.icc.b, y: d.icc.a, me: d.id === S.me.id, tip: `${d.name}: a=${fx(d.icc.a, 1)}, b=${fx(d.icc.b, 1)}` })), { xmin: -3, xmax: 3, ymin: 0, ymax: 3, band: { x0: .5, x1: 1.5 }, xl: '난이도 b', yl: '변별도 a', fx: v => fx(v, 0), fy: v => fx(v, 1), label: '제출 문항의 a–b 분포' }) + `<p class="note">${docs.length}명 중 ${k}명(${pct(k, docs.length)}%)이 조건(0.5≤b≤1.5, a≥1.5)을 충족했습니다.</p>`; }
        return html; }
    },
    {
      id: 'eicc', title: '우리 데이터의 문항 곡선', src: '교재 Fig 6.8 · 6.15, p.128–137', lead: '각 문항에서 “동의(4–5점)” 비율을 총점(θ 대용)에 따라 그려 2PL 곡선을 맞춥니다. 응답자가 수십 명이면 근사치일 뿐입니다.', mods: ['inv'],
      input(el, ctx) { const sel = h('select', {}, ITEMS.map((it, j) => h('option', { value: j, selected: j === selItem }, it.s))); sel.addEventListener('change', () => { selItem = +sel.value; ctx.done(); ctx.refresh(); }); el.append(h('div', { class: 'field' }, h('label', {}, '문항 선택'), sel), h('p', { class: 'note' }, 'θ 대용: 총점의 z 점수. 점은 θ 구간별 실제 동의 비율, 선은 적합한 2PL 곡선.')); },
      out() { const n = INV.need(10); if (n) return n; const th = thetaZ(), rows = INV.rows(); const y = rows.map(r => r[selItem] >= 4 ? 1 : 0); const f = ST.fit2pl(th, y); const ord = th.map((t, i) => i).sort((a, b) => th[a] - th[b]); const bins = [0, 1, 2, 3, 4].map(g => ord.slice(Math.floor(g * ord.length / 5), Math.floor((g + 1) * ord.length / 5)));
        const dots = bins.map(g => [ST.mean(g.map(i => th[i])), ST.mean(g.map(i => y[i]))]); const me = INV.mine(); const mt = me ? (INV.tot(me.inv.r) - ST.mean(INV.totals())) / ST.sd(INV.totals()) : null;
        return stats([[fx(f.a, 2), '변별도 a'], [fx(ST.clamp(f.b, -4, 4), 2), '난이도 b'], [pct(y.reduce((s, v) => s + v, 0), y.length) + '%', '동의율']]) +
          CH.lines([{ name: '2PL 적합', pts: mkTh().map(t => [t, P3(t, f.a, f.b, 0)]), color: 'var(--c1)' }, { name: '구간별 실제 비율', pts: dots, color: 'var(--c3)', dots: true }].map((s, i) => i ? { ...s, dash: false } : s), { xmin: -3, xmax: 3, ymin: 0, ymax: 1, xl: 'θ (총점 z)', yl: '동의 확률', fx: v => fx(v, 0), fy: v => fx(v, 1), vlines: mt != null ? [{ x: ST.clamp(mt, -3, 3), label: '나', color: 'var(--c2)' }] : [], label: `${ITEMS[selItem].s} 문항 곡선` }) +
          note(ITEMS[selItem].R ? '역문항은 역채점한 값으로 계산했습니다.' : ''); }
    },
    {
      id: 'tif', title: '검사정보함수 — 어디에서 정밀한가', src: '교재 Fig 6.4–6.6 · 6.10, p.107–165', lead: '12문항의 정보를 합쳐 θ 수준별 정밀도를 봅니다. SE(θ) = 1 / √정보량. 아래 녹색 띠가 SE ≤ 0.5인 구간입니다.', wide: true, mods: ['inv'],
      out() { const n = INV.need(10); if (n) return n; const fits = irtFit(); const th = mkTh(); const I = th.map(t => ST.sum(fits.map(f => { const p = P3(t, f.a, f.b, 0); return f.a * f.a * p * (1 - p); })));
        const se = I.map(v => 1 / Math.sqrt(Math.max(v, 1e-6))); const good = th.filter((t, i) => se[i] <= .5); const peak = th[I.indexOf(Math.max(...I))];
        const band = good.length ? [{ x0: good[0], x1: good[good.length - 1], label: 'SE ≤ 0.5' }] : [];
        return stats([[fx(Math.max(...I), 1), '최대 정보량'], [fx(peak, 1), '가장 정밀한 θ'], [good.length ? `${fx(good[0], 1)} ~ ${fx(good[good.length - 1], 1)}` : '없음', 'SE ≤ 0.5 구간']]) +
          `<div class="cardrow"><div><h4 class="sub-h">검사정보함수 I(θ)</h4>${CH.lines([{ name: 'I(θ)', pts: th.map((t, i) => [t, I[i]]), color: 'var(--c1)' }], { xmin: -3, xmax: 3, ymin: 0, ymax: Math.ceil(Math.max(...I) * 1.1), ny: 4, xl: 'θ', yl: '정보량', fx: v => fx(v, 0), bands: band, label: '검사정보함수' })}</div>
          <div><h4 class="sub-h">측정의 표준오차 SE(θ)</h4>${CH.lines([{ name: 'SE', pts: th.map((t, i) => [t, Math.min(se[i], 3)]), color: 'var(--c3)' }], { xmin: -3, xmax: 3, ymin: 0, ymax: 3, ny: 3, xl: 'θ', yl: 'SE', fx: v => fx(v, 0), hlines: [{ y: .5, label: '0.5' }], label: '표준오차 곡선' })}</div></div>` +
          table(['문항', 'a', 'b'], fits.map((f, j) => [esc(ITEMS[j].s), fx(f.a, 2), fx(f.b, 2)]), 'sm') + note('12문항·소표본의 근사 추정이므로 모양을 이해하는 용도입니다. 실제 IRT 추정에는 수백 명 이상의 자료와 전용 프로그램이 필요합니다(교재 p.163–165).'); }
    }],
  demo(p, rng) { const m = Math.floor(rng() * 3); const a = ST.clamp(1.4 + 0.8 * ST.norm(rng), 0.4, 3), b = ST.clamp(0.6 + 1.1 * ST.norm(rng), -3, 3); return { icc: { m, a: m === 0 ? 1 : Math.round(a * 10) / 10, b: Math.round(b * 10) / 10, c: m === 2 ? 0.1 : 0 } }; }
});

/* ================= 7. 신뢰도 ================= */
MG.add({
  id: 'm7', no: 7, short: '신뢰도', title: '검사 점수의 신뢰도', chap: 'Chapter 7', pages: '교재 p.167–183',
  sub: '같은 사람을 다시 재면 같은 값이 나올까? 신뢰도는 점수를 믿어도 되는 정도입니다.',
  tocline: '내부일관성 · 재검사 · 스피어만-브라운 예측',
  recap: ['<b>검사-재검사</b>(Table 7.1), 동형검사, <b>내부일관성</b>: 반분(Table 7.2) · <b>Cronbach α</b> · θ · KR-21(Table 7.3) (p.168–177).', '<b>표준오차</b>와 신뢰구간으로 점수를 구간으로 해석합니다 (p.177–179).', '합성 점수의 신뢰도, 차이 점수의 신뢰도 문제 (p.179–182).'],
  acts: [
    {
      id: 'ic', title: '내부일관성 대시보드', src: '교재 p.171–179 · Table 7.2', lead: 'TPI의 α, 반분신뢰도, 표준오차와 내 점수의 95% 신뢰구간을 그룹 데이터로 계산합니다.', wide: true, mods: ['inv'],
      out() { const n = INV.need(8); if (n) return n; const rows = INV.rows(); const a = ST.alpha(rows), aP = ST.alpha(rows.map(r => r.slice(0, 6))), aN = ST.alpha(rows.map(r => r.slice(6)));
        const odd = rows.map(r => ST.sum(r.filter((_, i) => i % 2 === 0))), even = rows.map(r => ST.sum(r.filter((_, i) => i % 2 === 1))); const rh = ST.corr(odd, even), sb = ST.sb(rh, 2);
        const tot = rows.map(r => ST.sum(r)); const sd = ST.sd(tot), sem = sd * Math.sqrt(1 - Math.max(0, a)); const me = INV.mine(); const x = me ? INV.tot(me.inv.r) : null; const tone = v => v >= .8 ? 'good' : v >= .7 ? 'warn' : 'bad';
        const del = ITEMS.map((it, j) => ({ label: it.s, v: ST.alphaIfDeleted(rows, j), color: 'var(--c1)' }));
        return stats([[fx(a, 2), 'α (12문항)', tone(a)], [fx(aP, 2), 'α 팀 효능 6문항', tone(aP)], [fx(aN, 2), 'α 팀 부담 6문항', tone(aN)], [fx(rh, 2), '반분 r (홀/짝)'], [fx(sb, 2), '스피어만-브라운 보정', tone(sb)], [fx(sem, 2), '측정표준오차 SEM']]) +
          (x != null ? `<h4 class="sub-h">내 점수 ${x}점과 95% 신뢰구간 (±${fx(1.96 * sem, 1)}점)</h4>` + CH.gauge(x, 12, 60, { ci: [x - 1.96 * sem, x + 1.96 * sem], marks: [{ x: ST.mean(tot), label: '그룹 평균', color: 'var(--c3)' }] }) : empty('TPI에 응답하면 내 신뢰구간이 표시됩니다.')) +
          `<h4 class="sub-h">문항을 삭제하면 α는? (기준 ${fx(a, 2)})</h4>` + CH.hbars(del, { max: 1, d: 2, ref: a, refLabel: '현재 α' }) + note('삭제했을 때 α가 오르는 문항은 척도와 결이 다른 문항입니다. SEM = SD × √(1−α). 신뢰구간은 “내 점수의 참값이 이 안에 있을 것”이라는 추정입니다.'); }
    },
    {
      id: 'rt', title: '다시 응답하기 — 검사-재검사', src: '교재 Table 7.1, p.168–171', lead: '다른 챕터를 마친 뒤 TPI에 한 번 더 응답하세요(같은 날도 괜찮습니다). 두 번의 점수가 얼마나 일치하는지 봅니다.', mods: ['inv'],
      input(el, ctx) { const d = ctx.my().rt; const f = h('form', { class: 'likert' }); ORDER.forEach((i, n) => f.append(h('fieldset', {}, h('legend', {}, h('span', { class: 'qn' }, n + 1), ITEMS[i].t), h('div', { class: 'choices' }, [1, 2, 3, 4, 5].map(v => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'rt' + i, value: v, checked: d && d.r[i] === v }), h('span', {}, v)))))));
        f.append(h('button', { class: 'btn', type: 'submit' }, '재응답 제출')); f.addEventListener('submit', e => { e.preventDefault(); const r = ITEMS.map((_, i) => { const x = f.querySelector(`input[name=rt${i}]:checked`); return x ? +x.value : 0; }); if (r.includes(0)) return alert('모든 문항에 응답해 주세요.'); ctx.save({ rt: { r } }); }); el.append(f); },
      out(ctx) { const ppl = ctx.docs().filter(d => d.rt && INV.valid(d)); if (ppl.length < 4) return ppl.length ? stats([[ppl.length, '재응답']]) + empty('4명 이상이 재응답하면 계산됩니다.') : empty();
        const t1 = ppl.map(d => INV.tot(d.inv.r)), t2 = ppl.map(d => INV.tot(d.rt.r)); const r = ST.corr(t1, t2); const a = ST.alpha(INV.rows()); const sem = ST.sd(INV.totals()) * Math.sqrt(1 - Math.max(0, a)); const thr = 1.96 * Math.SQRT2 * sem;
        const chg = ppl.filter((d, i) => Math.abs(t2[i] - t1[i]) > thr).length; const lo = Math.floor(Math.min(...t1, ...t2) - 2), hi = Math.ceil(Math.max(...t1, ...t2) + 2);
        return stats([[ppl.length, '재응답 인원'], [fx(r, 2), '재검사 신뢰도 r', r >= .8 ? 'good' : 'warn'], [fx(ST.mean(t2) - ST.mean(t1), 1), '평균 변화'], [chg, `신뢰할 만한 변화 (±${fx(thr, 1)}점 초과)`]]) +
          CH.scatter(ppl.map((d, i) => ({ x: t1[i], y: t2[i], me: d.id === S.me.id, name: d.name })), { xmin: lo, xmax: hi, ymin: lo, ymax: hi, ident: true, xl: '1차 총점', yl: '2차 총점', label: '검사-재검사 산점도' }) + note('점이 점선(완전 일치) 가까이 모일수록 재검사 신뢰도가 높습니다. 간격이 짧으면 기억 효과로 과대 추정될 수 있습니다.'); }
    },
    {
      id: 'sbp', title: '문항을 늘리면 신뢰도가 오를까', src: '교재 p.172–174', lead: '스피어만-브라운 예측: 문항 수를 늘렸을 때 신뢰도가 어떻게 변하는지 그룹의 α로 계산합니다.', mods: ['inv'],
      input(el, ctx) { el.append(sliderField('문항 수', 6, 60, 1, sbK, v => { sbK = v; ctx.done(); ctx.refresh(); }, v => v + '문항')); },
      out() { let a = INV.people().length >= 6 ? ST.alpha(INV.rows()) : NaN; const base = isNaN(a) || a <= 0 ? .8 : a; const ks = Array.from({ length: 55 }, (_, i) => 6 + i); const pr = k => ST.sb(base, k / 12);
        return stats([[fx(base, 2), '현재 α (12문항)'], [fx(pr(sbK), 2), `${sbK}문항 예측`, pr(sbK) >= .9 ? 'good' : 'warn'], [Math.ceil(12 * 0 + ST.sbItems(base, 12, .9) / 12 * 12) + '문항', 'α=.90에 필요'], [ST.sbItems(base, 12, .95) + '문항', 'α=.95에 필요']]) +
          CH.lines([{ name: '예측 신뢰도', pts: ks.map(k => [k, pr(k)]), color: 'var(--c1)' }], { xmin: 6, xmax: 60, ymin: Math.floor(Math.min(base, pr(6)) * 10 - 1) / 10, ymax: 1, ny: 4, xl: '문항 수', yl: '신뢰도', fx: v => fx(v, 0), fy: v => fx(v, 2), vlines: [{ x: 12, label: '현재', color: 'var(--c3)' }, { x: sbK, label: '선택', color: 'var(--c2)' }], hlines: [{ y: .9, label: '.90' }], label: '문항 수와 신뢰도' }) + note('문항을 계속 늘려도 수확은 체감됩니다. 응답자 피로와 비용을 함께 따져야 합니다.' + (isNaN(a) ? ' (응답자 부족으로 α=.80을 가정했습니다.)' : '')); }
    }],
  demo(p, rng) { if (rng() > .7) return null; return { rt: { r: p.inv.map(v => ST.clamp(Math.round(v + 0.65 * ST.norm(rng)), 1, 5)) } }; }
});

/* ================= 8. 평정자 신뢰도 ================= */
const CANDS = ['저는 팀 목표가 흔들릴 때 먼저 회의를 열어 역할을 다시 나눕니다. 지난 프로젝트에서 갈등이 있던 두 동료의 의견을 정리해 절충안을 냈고, 일정을 지켰습니다.',
  '팀에서는 제 몫만 확실히 하면 된다고 생각합니다. 다른 사람 일에 관여하면 오히려 방해가 될 수 있습니다.',
  '동료가 어려워하면 도와주는 편이지만 먼저 나서지는 않습니다. 요청받으면 최선을 다합니다.',
  '저는 팀 프로젝트가 늘 좋았습니다. 사람들과 있으면 즐겁고 분위기를 잘 만듭니다. 구체적인 성과는 기억나지 않지만 다들 저를 좋아했습니다.',
  '마감이 촉박할 때 제 일을 먼저 끝내고 남는 시간에 동료의 데이터 정리를 대신 맡았습니다. 공은 팀 전체에 돌렸고, 다음 프로젝트에서 제안자가 되었습니다.',
  '의견이 다르면 끝까지 설득합니다. 팀이 따르지 않으면 제가 직접 처리해 버립니다. 결과는 늘 좋았습니다.'];
const ICC_TXT = v => v >= .9 ? '매우 높음' : v >= .75 ? '높음' : v >= .5 ? '보통' : '낮음';
MG.add({
  id: 'm8', no: 8, short: '평정자 신뢰도', title: '평정자 신뢰도', chap: 'Chapter 8', pages: '교재 p.185–200',
  sub: '면접관마다 점수가 다르다면, 점수는 지원자의 것일까 면접관의 것일까.',
  tocline: '면접 평정 실험 · 일치도 지수 · 평정 오류 퀴즈',
  recap: ['평정자 일치 지수: <b>관찰자 일치율</b>, 상관, <b>Kendall의 W</b>(Table 8.1), <b>Cohen의 κ</b>(Table 8.2), <b>r_wg</b>(Table 8.3), 평균편차지수 (p.185–193).', '<b>급내상관계수 ICC</b>와 일반화가능도 이론 (Table 8.4–8.6, p.193–198).', '신뢰도 일반화와 현대검사이론적 접근 (p.198–200).'],
  acts: [
    {
      id: 'iv', title: '모의 면접 평정', src: '교재 Table 8.1 · 8.4', lead: '지원자 6명의 답변을 읽고 “팀 협업 역량”을 1–5점으로 평정하고 채용 여부를 정하세요. 평정자 사이에 얼마나 일치하는지 계산합니다.',
      input(el, ctx) { const m = ctx.my().iv || {}; const r = (m.r || Array(6).fill(0)).slice(), dd = (m.d || Array(6).fill(-1)).slice();
        CANDS.forEach((t, i) => el.append(h('div', { class: 'rater' }, h('div', { class: 't' }, `지원자 ${'ABCDEF'[i]}`), h('p', { class: 'small' }, t), h('div', { class: 'minirow' }, h('span', { class: 'small' }, '평정'), chips('ir' + i, ['1', '2', '3', '4', '5'], r[i] ? r[i] - 1 : null, j => r[i] = j + 1), h('span', { class: 'small' }, '채용'), chips('id' + i, ['보류', '채용'], dd[i] === -1 ? null : dd[i], j => dd[i] = j)))));
        el.append(h('button', { class: 'btn', onclick: () => { if (r.includes(0) || dd.includes(-1)) return alert('6명 모두 평정과 채용 여부를 선택해 주세요.'); ctx.save({ iv: { r, d: dd } }); } }, '평정 제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.iv && d.iv.r); if (docs.length < 3) return docs.length ? stats([[docs.length, '평정자']]) + empty('3명 이상이 평정하면 일치도가 계산됩니다.') : empty();
        const M = [0, 1, 2, 3, 4, 5].map(i => docs.map(d => d.iv.r[i])); const icc = ST.icc(M); const W = ST.kendallW(docs.map(d => d.iv.r));
        const pairs = []; for (let a = 0; a < docs.length; a++) for (let b = a + 1; b < docs.length; b++) pairs.push([a, b]); const ex = i => pct(pairs.filter(([a, b]) => docs[a].iv.r[i] === docs[b].iv.r[i]).length, pairs.length);
        const kap = (a, b) => ST.kappa(docs[a].iv.d, docs[b].iv.d); const mk = ST.mean(pairs.map(([a, b]) => kap(a, b)).filter(x => !isNaN(x))); const mi = docs.findIndex(d => d.id === S.me.id);
        const myk = mi >= 0 ? ST.mean(docs.map((_, j) => j === mi ? NaN : kap(mi, j)).filter(x => !isNaN(x))) : NaN; const rw = [0, 1, 2, 3, 4, 5].map(i => ST.rwg(M[i]));
        let html = stats([[docs.length, '평정자'], [fx(icc.single, 2), `ICC(2,1) · ${ICC_TXT(icc.single)}`, icc.single >= .75 ? 'good' : icc.single >= .5 ? 'warn' : 'bad'], [fx(icc.avg, 2), `ICC(2,k) 평균평정`], [fx(W, 2), 'Kendall W'], [fx(mk, 2), '채용 판단 평균 κ'], [fx(ST.mean(rw), 2), '평균 r_wg']]);
        if (!isNaN(myk)) html += note(`나와 다른 평정자의 채용 판단 평균 κ = ${fx(myk, 2)} (전체 평균 ${fx(mk, 2)}).`);
        html += CANDS.map((_, i) => `<h4 class="sub-h">지원자 ${'ABCDEF'[i]} · 평균 ${fx(ST.mean(M[i]), 2)} · SD ${fx(ST.sd(M[i]), 2)} · r_wg ${fx(rw[i], 2)} · 정확 일치 ${ex(i)}% · 채용 ${pct(docs.filter(d => d.iv.d[i] === 1).length, docs.length)}%</h4>` +
          CH.strip(docs.map(d => ({ v: d.iv.r[i], me: d.id === S.me.id, tip: `${d.name}: ${d.iv.r[i]}점` })), { min: 1, max: 5, n: 4, h: 70, fmt: t => fx(t, 0), marks: [{ x: ST.mean(M[i]), label: '평균', color: 'var(--c3)' }], label: `지원자 ${'ABCDEF'[i]} 평정 분포` })).join('');
        return html + note('r_wg는 균등분포 귀무분산(5점 척도에서 2.0) 대비 일치 정도입니다. 지원자 F처럼 평정이 갈리는 대상이 있으면 평정 기준을 다시 합의해야 합니다.'); }
    },
    quiz({ id: 'err', title: '평정 오류의 이름 붙이기', src: '교재 Ch.8 평정 일치도의 배경 확장', lead: '면접·인사평가에서 흔한 평정 오류입니다. 알맞은 이름을 고르세요.', opts: ['후광 효과', '관대화 경향', '중심화 경향', '대비 효과', '유사성 오류', '최근 효과'], items: [
      { q: '발표를 잘한 직원에게 협업·성실성 점수까지 모두 높게 주었다.', short: '발표→전부 높게', a: 0, why: '한 가지 인상이 다른 특성 평가로 번집니다.' },
      { q: '모든 직원에게 5점 만점에 4–5점만 주었다.', short: '모두 후하게', a: 1, why: '평정자 전체가 후한 쪽으로 치우친 경우입니다.' },
      { q: '구분이 어려워 모두에게 3점만 주었다.', short: '모두 3점', a: 2, why: '척도의 가운데만 쓰면 변별이 사라집니다.' },
      { q: '앞 지원자가 뛰어나서 다음 지원자가 평범해 보여 낮게 주었다.', short: '앞사람 비교', a: 3, why: '직전 대상과의 비교가 평가를 바꿉니다.' },
      { q: '나와 출신 학교가 같은 지원자에게 점수를 후하게 주었다.', short: '같은 학교', a: 4, why: '나와 닮은 사람을 높게 평가하는 경향입니다.' },
      { q: '연말 평가에서 지난 한 달의 실수만 크게 반영했다.', short: '최근 한 달', a: 5, why: '최근 사건이 전체 기간을 대표하는 것처럼 반영됩니다.' }] })],
  demo(p, rng) { const q = [4.4, 1.8, 3.1, 3.0, 4.6, 3.0]; const L = 0.5 * ST.norm(rng); const r = q.map((v, i) => ST.clamp(Math.round(v + L + (i === 5 ? 1.4 : 0.7) * ST.norm(rng)), 1, 5)); const d = r.map(v => v >= 4 ? 1 : v === 3 ? (rng() < .4 ? 1 : 0) : 0);
    return { iv: { r, d }, err: { c: [0, 1, 2, 3, 4, 5].map(a => rng() < 0.72 ? a : Math.floor(rng() * 6)) } }; }
});
