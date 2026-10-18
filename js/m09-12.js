/* 챕터 9–12 */
const CV_ITEMS = [...ITEMS.map(i => i.t), '나는 우리 회사의 인사 규정을 잘 알고 있다.', '나는 엑셀 함수를 능숙하게 다룬다.'];
const CV_SHORT = [...ITEMS.map(i => i.s), '인사 규정 지식 (오염 문항)', '엑셀 능숙도 (오염 문항)'];
let cutoff = 36, restrictTop = 100, ryy = 0.8, cutPlan = { c: 0.1, d: 0.5 };
const critDocs = () => docsOf('m9').filter(d => d.crit && INV.valid(docsOf('inv').find(x => x.id === d.id)));
const critPts = () => critDocs().map(d => { const iv = docsOf('inv').find(x => x.id === d.id); return { d, t: INV.tot(iv.inv.r), teams: d.crit.teams, perf: d.crit.perf }; });
const rOf = (a, b) => ST.corr(a, b);

/* ================= 9. 내용·준거 타당도 ================= */
MG.add({
  id: 'm9', no: 9, short: '내용·준거 타당도', title: '내용·준거 타당도', chap: 'Chapter 9', pages: '교재 p.201–238',
  sub: '이 점수는 정말 재려던 것을 재고 있을까? 전문가의 눈, 그리고 외부 기준과의 관계로 확인합니다.',
  tocline: '내용타당도(CVI) · 준거타당도 · 컷오프 · 범위 제한',
  recap: ['<b>내용타당도</b>: 응답자·주제전문가(SME)에게 묻기 (p.202). 관련 없는 내용이 섞이면 측정이 <b>오염</b>됩니다 (p.2).', '<b>준거타당도</b>: 상관·회귀로 예측 정확도 확인 — 교재는 TPI 점수와 참여한 팀 수 r=.75 사례(Table 9.2–9.3), 표준오차 (p.203–219).', '신뢰도에 의한 타당도 상한과 <b>감쇠 보정</b>, <b>범위 제한</b>(Fig 9.1–9.2), 표본 크기 (p.212–217).', '분류 접근: 예측 정확도(Table 9.6), Taylor-Russell(Table 9.7), 판별분석, 집단 차이와 검사 편향(Fig 9.5–9.6), 메타분석 (p.220–238).'],
  acts: [
    {
      id: 'cv', title: '내용타당도 — 전문가 평정(CVI)', src: '교재 p.202 · p.2', lead: '당신은 “팀 업무에 대한 태도” 척도의 전문가입니다. 14개 문장이 이 개념과 얼마나 관련 있는지 1–4점으로 평가하세요. 가짜 문항 2개가 섞여 있습니다.',
      input(el, ctx) { const m = (ctx.my().cv && ctx.my().cv.r) || Array(14).fill(0); const r = m.slice();
        CV_ITEMS.forEach((t, i) => el.append(h('div', { class: 'field' }, h('label', {}, `${i + 1}. ${t}`), chips('cv' + i, ['1 무관', '2', '3', '4 매우 관련'], r[i] ? r[i] - 1 : null, j => r[i] = j + 1))));
        el.append(h('button', { class: 'btn', onclick: () => { if (r.includes(0)) return alert('14개 모두 평가해 주세요.'); ctx.save({ cv: { r } }); } }, '평가 제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.cv && d.cv.r); if (!docs.length) return empty(); const icvi = CV_ITEMS.map((_, i) => docs.filter(d => d.cv.r[i] >= 3).length / docs.length); const real = icvi.slice(0, 12);
        const flagged = icvi.map((v, i) => v < .78 ? i : -1).filter(i => i >= 0); const caught = [12, 13].filter(i => icvi[i] < .78).length;
        return stats([[docs.length, '평정 전문가'], [fx(ST.mean(real), 2), 'S-CVI/Ave (진짜 12문항)', ST.mean(real) >= .9 ? 'good' : 'warn'], [flagged.length, '기준(.78) 미달 문항'], [`${caught}/2`, '오염 문항 적발']]) +
          CH.hbars(CV_ITEMS.map((_, i) => ({ label: CV_SHORT[i], v: icvi[i], txt: fx(icvi[i], 2), color: i >= 12 ? 'var(--c3)' : icvi[i] < .78 ? 'var(--c2)' : 'var(--c1)' })), { max: 1, d: 2, ref: .78, refLabel: '.78' }) + CH.legend([['적합', 'var(--c1)'], ['미달', 'var(--c2)'], ['오염 문항(가짜)', 'var(--c3)']]) +
          note('I-CVI = 3·4점을 준 전문가의 비율. 전문가가 6명 이상일 때 .78 이상을 허용하는 것이 관례입니다. 교재(p.2)의 “조직 규정 지식 문항이 섞인 직무만족 척도” 예와 같은 오염 문항을 찾아내는 연습입니다.'); }
    },
    {
      id: 'crit', title: '준거타당도 — TPI와 현실의 연결', src: '교재 Table 9.2–9.3 · p.203–214', lead: '최근 2년간 참여한 팀 수와 팀 성과 자기평가(1–10)를 입력하세요. TPI 점수가 이를 얼마나 예측하는지 상관으로 봅니다.', mods: ['inv'],
      input(el, ctx) { const m = ctx.my().crit || { teams: 3, perf: 6 }; const v = { ...m }; el.append(sliderField('최근 2년간 참여한 팀(프로젝트) 수', 0, 15, 1, v.teams, x => v.teams = x), sliderField('팀 성과 자기평가', 1, 10, 1, v.perf, x => v.perf = x),
        h('p', { class: 'note' }, '자기평가는 편향될 수 있다는 점도 함께 생각해 보세요.'), h('button', { class: 'btn', onclick: () => ctx.save({ crit: v }) }, '제출')); },
      out(ctx) { const pts = critPts(); if (pts.length < 6) return INV.need(6) || (pts.length ? stats([[pts.length, '응답']]) + empty('TPI와 준거를 모두 응답한 사람이 6명 이상 필요합니다.') : empty()); const t = pts.map(p => p.t), tm = pts.map(p => p.teams), pf = pts.map(p => p.perf);
        const r1 = rOf(t, tm), r2 = rOf(t, pf); const rxx = Math.max(.3, ST.alpha(INV.rows()) || .8); const rc = Math.min(1, r1 / Math.sqrt(rxx * ryy)); const lo = Math.floor(Math.min(...t) - 2), hi = Math.ceil(Math.max(...t) + 2);
        return stats([[pts.length, '분석 인원'], [fx(r1, 2), 'r (TPI, 팀 수)', Math.abs(r1) >= .3 ? 'good' : 'warn'], [fx(r1 * r1, 2), 'r² (설명 분산)'], [fx(r2, 2), 'r (TPI, 성과 자기평가)'], [fx(rc, 2), `감쇠 보정 r (준거 신뢰도 ${fx(ryy, 2)})`]]) +
          `<h4 class="sub-h">TPI 총점 → 참여한 팀 수 (선 = 회귀선)</h4>` + CH.scatter(pts.map(p => ({ x: p.t, y: p.teams, me: p.d.id === S.me.id, name: p.d.name })), { xmin: lo, xmax: hi, ymin: 0, ymax: 15, fit: true, xl: 'TPI 총점', yl: '팀 수', label: 'TPI와 팀 수' }) +
          `<h4 class="sub-h">TPI 총점 → 성과 자기평가</h4>` + CH.scatter(pts.map(p => ({ x: p.t, y: p.perf, me: p.d.id === S.me.id, name: p.d.name })), { xmin: lo, xmax: hi, ymin: 1, ymax: 10, fit: true, xl: 'TPI 총점', yl: '성과', label: 'TPI와 성과' }) +
          note('교재의 예에서는 r=.75(공유 분산 56%)가 나왔습니다. 감쇠 보정 r = r ÷ √(r_xx · r_yy) 는 두 측정의 오차가 없었다면 나왔을 관계의 상한입니다.'); }
    },
    {
      id: 'cut', title: '컷오프를 정하면 누가 걸러질까', src: '교재 Table 9.6–9.7, p.220–222', lead: '성과 자기평가 7점 이상을 “성공”으로 보고, TPI 컷오프를 움직여 4칸 분류표를 확인합니다.', mods: ['inv', 'm9'],
      input(el, ctx) { el.append(sliderField('TPI 컷오프 (이 점수 이상 선발)', 12, 60, 1, cutoff, v => { cutoff = v; ctx.refresh(); }, v => v + '점'), h('button', { class: 'btn', onclick: () => ctx.save({ cut: { v: cutoff } }) }, '내 컷오프 제출')); },
      out(ctx) { const pts = critPts(); if (pts.length < 8) return INV.need(8) || empty('TPI와 성과 자기평가를 입력한 사람이 8명 이상 필요합니다.'); const succ = p => p.perf >= 7; const tp = pts.filter(p => p.t >= cutoff && succ(p)).length, fp = pts.filter(p => p.t >= cutoff && !succ(p)).length, fn = pts.filter(p => p.t < cutoff && succ(p)).length, tn = pts.filter(p => p.t < cutoff && !succ(p)).length;
        const sens = tp / (tp + fn || 1), spec = tn / (tn + fp || 1), ppv = tp / (tp + fp || 1); const base = (tp + fn) / pts.length; const docs = ctx.docs().filter(d => d.cut);
        let html = stats([[pct(base * 100, 100) + '%', '기저율(성공 비율)'], [fx(sens, 2), '민감도'], [fx(spec, 2), '특이도'], [fx(ppv, 2), '선발자 중 성공 비율'], [fx((tp + tn) / pts.length, 2), '정확도']]) +
          table(['', '성공(성과≥7)', '비성공'], [['선발(≥ ' + cutoff + ')', `<b>${tp}</b> 정분류`, `${fp} 오선발`], ['탈락', `${fn} 오탈락`, `<b>${tn}</b> 정분류`]], 'sm');
        if (docs.length) html += `<h4 class="sub-h">참가자들이 고른 컷오프 (${docs.length}명)</h4>` + CH.hist(docs.map(d => d.cut.v), { min: 12, max: 60, bins: 12, xl: '컷오프', marks: [{ x: cutoff, label: '지금 슬라이더', dash: true }], label: '컷오프 분포' });
        return html + note('컷오프를 올리면 선발자의 성공률(PPV)은 오르지만 좋은 사람을 놓치는 오탈락도 늘어납니다. 어떤 오류가 더 비싼지는 조직이 정해야 합니다.'); }
    },
    {
      id: 'rr', title: '범위 제한 — 뽑힌 사람만 보면', src: '교재 Fig 9.1–9.2, p.214–217', lead: '이미 TPI 상위자만 입사시킨 조직이라면 상관이 어떻게 보일까요? 상위 몇 %만 분석에 남겨 봅니다.', mods: ['inv', 'm9'],
      input(el, ctx) { el.append(sliderField('분석에 남기는 상위 비율', 20, 100, 5, restrictTop, v => { restrictTop = v; ctx.done(); ctx.refresh(); }, v => v + '%')); },
      out() { const pts = critPts(); if (pts.length < 10) return INV.need(10) || empty('TPI와 준거를 모두 응답한 사람이 10명 이상 필요합니다.'); const sorted = pts.slice().sort((a, b) => b.t - a.t); const keep = sorted.slice(0, Math.max(4, Math.round(pts.length * restrictTop / 100))); const lo = Math.floor(Math.min(...pts.map(p => p.t)) - 2), hi = Math.ceil(Math.max(...pts.map(p => p.t)) + 2);
        const rf = rOf(pts.map(p => p.t), pts.map(p => p.teams)), rk = rOf(keep.map(p => p.t), keep.map(p => p.teams)); const set = new Set(keep.map(p => p.d.id));
        return stats([[fx(rf, 2), '전체 r'], [fx(rk, 2), `상위 ${restrictTop}% r`, rk < rf ? 'warn' : ''], [keep.length, '남은 인원']]) + CH.scatter(pts.map(p => ({ x: p.t, y: p.teams, color: set.has(p.d.id) ? 'var(--c1)' : 'var(--line)', name: p.d.name })), { xmin: lo, xmax: hi, ymin: 0, ymax: 15, xl: 'TPI 총점', yl: '팀 수', label: '범위 제한 산점도' }) + note('선발된 집단만 보면 점수의 변산이 줄어 상관이 낮아집니다. 검사가 쓸모없어서가 아니라 범위가 제한되었기 때문입니다.'); }
    }],
  demo(p, rng) { const rel = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => rng() < .93 ? (3 + (rng() < .8 ? 1 : 0)) : 2); const r = [...rel, rng() < .15 ? 3 : 1 + (rng() < .3 ? 1 : 0), rng() < .1 ? 3 : 1 + (rng() < .3 ? 1 : 0)];
    const T = INV.tot(p.inv); const teams = ST.clamp(Math.round(4.2 + (T - 36) * 0.28 + 1.6 * ST.norm(rng)), 0, 15); const perf = ST.clamp(Math.round(5.6 + 0.2 * (T - 36) / 1 * 0.5 + 1.3 * ST.norm(rng)), 1, 10);
    return { cv: { r }, crit: { teams, perf }, cut: { v: ST.clamp(Math.round(34 + 4 * ST.norm(rng)), 12, 60) } }; }
});

/* ================= 10. 구조 타당도 ================= */
let pcaRev = true;
const MT = { a: ['팀 일이 즐겁다', '팀에서 성과가 난다', '팀에 기여한다'], b: ['혼자 일이 편하다', '독립적으로 결정한다', '혼자 성과를 낸다'] };
MG.add({
  id: 'm10', no: 10, short: '구조 타당도', title: '문항 구조를 통한 타당도', chap: 'Chapter 10', pages: '교재 p.241–288',
  sub: '문항들이 서로 어떻게 묶이는지 보면, 우리가 몇 개의 차원을 재고 있는지 알 수 있습니다.',
  tocline: '상관행렬과 요인 · 스크리 도표 · 다특성-다방법',
  recap: ['<b>주성분분석(PCA)</b>: 스크리 도표(Fig 10.1), 적재량·회전(Fig 10.2–10.5, Table 10.2–10.16) (p.241–258).', '<b>공통요인분석</b>과 확인적 요인분석(공분산구조): 적합도 지수 (Fig 10.6–10.7, Table 10.17–10.44, p.258–282).', '교재의 TPI는 긍정·부정 문항에서 <b>두 개의 요인</b>이 나타나는 예를 다룹니다 (Table 10.29–10.31).', '타당도 위협과 <b>다특성-다방법(MTMM)</b> 평가 (p.285–287).'],
  acts: [
    {
      id: 'pca', title: '상관행렬과 주성분 — 우리 TPI는 몇 개의 차원?', src: '교재 Fig 10.1–10.4 · Table 10.4–10.8', lead: '역채점 전·후를 비교해 보세요. 역문항을 뒤집지 않으면 구조가 어떻게 보이는지, 뒤집어도 남는 두 번째 차원은 무엇인지 봅니다.', wide: true, mods: ['inv'],
      input(el, ctx) { el.append(h('div', { class: 'field' }, h('label', {}, '분석 자료'), chips('pr', ['역채점 후', '역채점 전(원응답)'], pcaRev ? 0 : 1, j => { pcaRev = j === 0; ctx.done(); ctx.refresh(); }))); el.classList.add('inline-in'); },
      out() { const n = INV.need(10); if (n) return n; const rows = pcaRev ? INV.rows() : INV.raw(); const R = ST.pca(rows); const lab = ITEMS.map((it, i) => (it.f === 'P' ? 'P' : 'N') + ((i % 6) + 1)); const ev = R.values; const cum = ev.reduce((a, v, i) => (a.push((a[i - 1] || 0) + v / 12), a), []);
        const sc = CH.lines([{ name: '고유값', pts: ev.map((v, i) => [i + 1, v]), color: 'var(--c1)', dots: true }], { xmin: 1, xmax: 12, ymin: 0, ymax: Math.ceil(ev[0] + .5), ny: 4, xl: '성분 번호', yl: '고유값', fx: v => fx(v, 0), hlines: [{ y: 1, label: 'Kaiser 기준 1' }], direct: false, label: '스크리 도표' });
        const L1 = R.loadings[0], L2 = R.loadings[1]; const ld = CH.scatter(ITEMS.map((it, i) => ({ x: L1[i], y: L2[i], color: it.f === 'P' ? 'var(--c1)' : 'var(--c3)', tip: `${it.s}: 성분1 ${fx(L1[i], 2)}, 성분2 ${fx(L2[i], 2)}` })), { xmin: -1, xmax: 1, ymin: -1, ymax: 1, xl: '성분 1 적재량', yl: '성분 2 적재량', fx: v => fx(v, 1), fy: v => fx(v, 1), label: '적재량 도표' });
        return stats([[fx(ev[0], 2), '성분1 고유값'], [fx(ev[1], 2), '성분2 고유값'], [ev.filter(v => v > 1).length, 'Kaiser(>1) 성분 수'], [Math.round(cum[1] * 100) + '%', '2개 성분의 설명 분산']]) +
          `<div class="cardrow"><div><h4 class="sub-h">스크리 도표 (Fig 10.1 형식)</h4>${sc}</div><div><h4 class="sub-h">적재량 도표 (Fig 10.2 형식) ${CH.legend([['긍정 문항(P)', 'var(--c1)'], ['역문항(N)', 'var(--c3)']])}</h4>${ld}</div></div>` +
          `<h4 class="sub-h">상관행렬 (${pcaRev ? '역채점 후' : '역채점 전'})</h4>` + CH.heat(R.R, lab, lab, { cs: 32, L: 34 }) +
          table(['문항', '성분1', '성분2', '공통성'], ITEMS.map((it, i) => [esc(it.s), fx(L1[i], 2), fx(L2[i], 2), fx(L1[i] ** 2 + L2[i] ** 2, 2)]), 'sm') +
          note(pcaRev ? '역채점 후에는 성분1이 “팀 선호의 일반 요인”이고, 성분2는 긍정 문장 대 부정 문장으로 갈립니다. 문장 방향(방법) 때문에 생긴 요인일 수 있어, 교재의 TPI 두 요인 예와 같은 쟁점입니다.' : '역채점 전에는 성분1이 긍정 문항(+)과 역문항(−)을 가르는 대립 축으로 나타납니다.'); }
    },
    {
      id: 'mtmm', title: '다특성-다방법 행렬', src: '교재 p.286 (Campbell & Fiske 접근)', lead: '두 특성(팀 선호·독립 선호)을 두 방법(3문항 척도, 단일 문항 0–10)으로 잰 4×4 상관행렬을 만듭니다.',
      input(el, ctx) { const m = ctx.my().mt || {}; const a = (m.a || [3, 3, 3]).slice(), b = (m.b || [3, 3, 3]).slice(); const s = { sa: m.sa ?? 5, sb: m.sb ?? 5 };
        el.append(h('p', { class: 'sub-h' }, '방법 1 · 문장에 얼마나 동의합니까? (1–5)'), ...[...MT.a.map((t, i) => [t, a, i]), ...MT.b.map((t, i) => [t, b, i])].map(([t, arr, i]) => h('div', { class: 'field' }, h('label', {}, t), chips('mt' + t, ['1', '2', '3', '4', '5'], arr[i] - 1, j => arr[i] = j + 1))),
          h('p', { class: 'sub-h' }, '방법 2 · 단일 문항 (0–10)'), sliderField('나는 팀으로 일하는 것을 선호한다', 0, 10, 1, s.sa, v => s.sa = v), sliderField('나는 혼자 일하는 것을 선호한다', 0, 10, 1, s.sb, v => s.sb = v),
          h('button', { class: 'btn', onclick: () => ctx.save({ mt: { a, b, sa: s.sa, sb: s.sb } }) }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.mt); if (docs.length < 8) return docs.length ? stats([[docs.length, '응답']]) + empty('8명 이상이면 행렬이 계산됩니다.') : empty(); const col = [d => ST.sum(d.mt.a), d => ST.sum(d.mt.b), d => d.mt.sa, d => d.mt.sb].map(f => docs.map(f));
        const M = col.map(x => col.map(y => ST.corr(x, y))); const aA = ST.alpha(docs.map(d => d.mt.a)), aB = ST.alpha(docs.map(d => d.mt.b)); M[0][0] = aA; M[1][1] = aB; M[2][2] = NaN; M[3][3] = NaN; const lab = ['팀·척도', '독립·척도', '팀·단일', '독립·단일'];
        const conv = [M[0][2], M[1][3]], het = [M[0][1], M[2][3], M[0][3], M[1][2]]; const ok = Math.min(...conv.map(Math.abs)) > Math.max(...het.map(Math.abs));
        return stats([[docs.length, '응답'], [fx(ST.mean(conv), 2), '수렴(같은 특성-다른 방법) 평균 r', 'good'], [fx(ST.mean(het.map(Math.abs)), 2), '변별(다른 특성) 평균 |r|'], [ok ? '충족' : '부분 충족', '수렴 > 변별', ok ? 'good' : 'warn']]) + CH.heat(M, lab, lab, { cs: 62, L: 62, box: (i, j) => (i === 0 && j === 2) || (i === 2 && j === 0) || (i === 1 && j === 3) || (i === 3 && j === 1), label: 'MTMM 행렬' }) +
          note('굵은 테두리 = 수렴타당도 계수(같은 특성을 다른 방법으로 잰 상관). 대각선의 척도 칸에는 α(신뢰도)를 넣었습니다. 수렴 계수가 다른 특성 간 상관보다 커야 합니다. 팀 선호와 독립 선호는 개념상 음의 관계가 있어 0일 필요는 없습니다.'); }
    },
    quiz({ id: 'fa', title: '요인분석 용어 점검', src: '교재 p.241–284', lead: '핵심 개념을 확인하세요.', opts: [], items: [
      { q: '스크리 도표에서 곡선이 급격히 꺾이는 지점 바로 앞까지를 요인 수로 정하는 방법은?', short: '스크리 팔꿈치', opts: ['스크리 테스트', 'Kaiser 기준', '분산 100% 기준', '역채점'], a: 0, why: '고유값이 완만해지는 지점(팔꿈치)을 기준으로 삼습니다.' },
      { q: '요인들이 서로 무관하다고 가정하고 축을 회전하는 방식은?', short: '회전 방식', opts: ['사각 회전', '직교 회전(예: 베리맥스)', '비례 회전', '무회전'], a: 1, why: '직교 회전은 요인 간 상관을 0으로 고정합니다. 상관을 허용하면 사각(oblique) 회전입니다.' },
      { q: '한 문항의 분산 중 공통요인이 설명하는 비율은?', short: '공통성', opts: ['신뢰도', '공통성(communality)', '난이도', '변별도'], a: 1, why: '공통성이 낮은 문항은 요인 구조와 잘 맞지 않습니다.' },
      { q: '요인 구조를 미리 가설로 세우고 자료와 맞는지 검증하는 분석은?', short: '확인적 분석', opts: ['탐색적 요인분석', '확인적 요인분석(CFA)', '군집분석', '회귀분석'], a: 1, why: '교재 Ch.10 후반의 공분산구조 모형이 이에 해당하며 적합도 지수로 평가합니다.' }] })],
  demo(p, rng) { const a = [0, 1, 2].map(() => ST.clamp(Math.round(3.2 + 0.9 * p.t + 0.7 * ST.norm(rng)), 1, 5)); const ind = -0.35 * p.t + 0.94 * ST.norm(rng); const b = [0, 1, 2].map(() => ST.clamp(Math.round(3 + 0.9 * ind + 0.7 * ST.norm(rng)), 1, 5));
    return { mt: { a, b, sa: ST.clamp(Math.round(5.5 + 1.7 * (ST.sum(a) - 9.6) / 3 + 1.2 * ST.norm(rng)), 0, 10), sb: ST.clamp(Math.round(5 + 1.8 * ind + 1.2 * ST.norm(rng)), 0, 10) }, fa: { c: [0, 1, 1, 1].map(x => rng() < .72 ? x : Math.floor(rng() * 4)) } }; }
});

/* ================= 11. 윤리·공정성 ================= */
let ai = { c: 0.4, d: 0.5 };
MG.add({
  id: 'm11', no: 11, short: '윤리·공정성', title: '검사의 윤리와 공정성', chap: 'Chapter 11', pages: '교재 p.289–316',
  sub: '검사는 사람의 기회를 바꿉니다. 사용 윤리, 법적 기준, 집단 간 불공정을 다룹니다.',
  tocline: '윤리 시나리오 투표 · 4/5 규칙 · 번역 점검',
  recap: ['전문 표준·윤리 절차, 검사 시행, 진실성 검사, 컴퓨터 기반 검사, 코칭·재응시 (p.289–294).', '검사 관련 입법, <b>항목 편향과 불리한 영향(adverse impact)</b>: χ² 접근, IRT 기반 편향 탐지 (p.294–306).', '<b>번역 문제</b>(역번역 · 문화 동등성)와 전자 제시·기록 (p.306–312).'],
  acts: [
    quiz({ id: 'eth', title: '이 사용은 허용될까', src: '교재 p.289–296', lead: '시나리오마다 가장 적절한 대응을 고르세요. 정답이 하나로 갈리지 않는 문제도 있습니다 — 다른 사람의 선택을 함께 보세요.', dist: true, opts: ['허용', '조건부 허용', '금지'], items: [
      { q: '응시자 동의 없이 채용 검사 결과를 다른 부서 채용에도 재사용한다.', a: 2, why: '권장: 금지 — 수집 목적 밖의 사용에는 별도 동의가 필요합니다.' },
      { q: '검사 결과를 응시자에게 알려주지 않고 인사팀만 보관한다.', a: 1, why: '권장: 조건부 — 피드백 제공과 열람 절차가 있어야 합니다.' },
      { q: '동일 검사를 한 사람이 세 번까지 재응시할 수 있게 한다.', a: 1, why: '권장: 조건부 — 연습 효과를 반영한 재응시 간격·대체 형식이 필요합니다.' },
      { q: '감독 없는 온라인 검사 점수만으로 합격을 결정한다.', a: 2, why: '권장: 금지 — 진실성·대리응시 위험이 있어 다른 증거와 함께 써야 합니다.' },
      { q: '영어 검사를 번역만 해서 동등성 검증 없이 한국 지원자에게 쓴다.', a: 2, why: '권장: 금지 — 역번역과 문화적 동등성 확인이 필요합니다(p.306–312).' }] }),
    {
      id: 'ai', title: '4/5 규칙 — 컷오프가 만드는 불리한 영향', src: '교재 p.294–300', lead: '두 집단의 점수 평균 차이가 d일 때, 컷오프를 어디에 두면 선발률 비율이 80%를 넘을까요? 컷오프와 집단 차이를 정해 시뮬레이션하세요.',
      input(el, ctx) { el.append(sliderField('컷오프 z (높을수록 엄격)', -1, 2.5, 0.05, ai.c, v => { ai.c = v; ctx.refresh(); }, v => fx(v, 2)), sliderField('집단 평균 차이 d (표준편차 단위)', 0, 1.2, 0.05, ai.d, v => { ai.d = v; ctx.refresh(); }, v => fx(v, 2)), h('button', { class: 'btn', onclick: () => ctx.save({ ai: { c: ai.c, d: ai.d, ir: (1 - ST.cdf(ai.c + ai.d)) / (1 - ST.cdf(ai.c)) } }) }, '내 설정 제출')); },
      out(ctx) { const ra = 1 - ST.cdf(ai.c), rb = 1 - ST.cdf(ai.c + ai.d), ir = rb / ra; const X = z => z, th = Array.from({ length: 71 }, (_, i) => -3 + i * 0.1); const docs = ctx.docs().filter(d => d.ai);
        let html = stats([[fx(ra * 100, 1) + '%', 'A집단 선발률'], [fx(rb * 100, 1) + '%', 'B집단 선발률'], [fx(ir, 2), '영향 비율 (B÷A)', ir >= .8 ? 'good' : 'bad'], [ir >= .8 ? '통과' : '불리한 영향 의심', '4/5 규칙']]) +
          CH.lines([{ name: 'A 집단', pts: th.map(t => [t, ST.pdf(t)]), color: 'var(--c1)' }, { name: 'B 집단', pts: th.map(t => [t, ST.pdf(t + ai.d)]), color: 'var(--c3)' }], { xmin: -3, xmax: 3, ymin: 0, ymax: .45, ny: 3, xl: '표준화 점수 (A집단 기준)', yl: '밀도', fx: v => fx(v, 0), fy: v => fx(v, 1), vlines: [{ x: ai.c, label: '컷오프', color: 'var(--c2)' }], label: '두 집단의 점수 분포' });
        if (docs.length) { const pass = docs.filter(d => d.ai.ir >= .8).length; html += `<h4 class="sub-h">참가자들이 만든 영향 비율 (${docs.length}명, 4/5 통과 ${pct(pass, docs.length)}%)</h4>` + CH.hist(docs.map(d => Math.min(1.5, d.ai.ir)), { min: 0, max: 1.5, bins: 15, marks: [{ x: .8, label: '0.8', dash: true, color: 'var(--c2)' }], fmt: v => fx(v, 1), xl: '영향 비율', label: '영향 비율 분포' }); }
        return html + note('두 집단 평균이 같더라도 컷오프가 높아질수록 선발률 비율은 더 벌어집니다. 4/5(80%) 규칙은 불리한 영향의 “신호”이며, 이후 직무 관련성 증명이 필요합니다.'); }
    },
    quiz({ id: 'tr', title: '번역·문화 동등성 점검', src: '교재 p.306–312', lead: '검사를 다른 언어로 쓸 때 확인할 것들입니다.', opts: [], items: [
      { q: '번역본의 의미가 원문과 같은지 확인하기 위해 다른 번역가가 원어로 다시 옮겨 비교하는 절차는?', short: '역번역', opts: ['역번역', '반분', '재검사', '스크리 테스트'], a: 0, why: '역번역은 의미 이탈을 찾는 기본 절차입니다.' },
      { q: '“I feel blue.”를 “나는 파란색을 느낀다.”로 옮겼다. 무엇이 문제일까?', short: '직역 문제', opts: ['관용 표현의 직역', '역문항 미처리', '표본 크기', '과대추정'], a: 0, why: '관용구는 의미를 번역해야 합니다.' },
      { q: '번역 문항이 두 집단에서 같은 능력 수준인데도 정답·동의율이 다르게 나타나는 현상은?', short: '문항 기능 차이', opts: ['문항 기능 차이(DIF)', '추측 효과', '범위 제한', '천장 효과'], a: 0, why: 'DIF는 χ²나 IRT로 탐지합니다(p.300–306).' },
      { q: '번역된 검사를 새 집단에 쓸 때 반드시 새로 해야 하는 것은?', short: '새 증거', opts: ['신뢰도·타당도 증거 확인', '문항 수 줄이기', '점수 환산 생략', '아무것도 안 해도 됨'], a: 0, why: '원본의 증거가 번역본에 그대로 이전되지 않습니다.' }] })],
  demo(p, rng) { const c = ST.clamp(0.5 + 0.7 * ST.norm(rng), -1, 2.5), d = ST.clamp(0.5 + 0.25 * ST.norm(rng), 0, 1.2); return { eth: { c: [2, 1, 1, 2, 2].map(a => rng() < .62 ? a : Math.floor(rng() * 3)) }, ai: { c, d, ir: (1 - ST.cdf(c + d)) / (1 - ST.cdf(c)) }, tr: { c: [0, 0, 0, 0].map(x => rng() < .75 ? x : Math.floor(rng() * 4)) } }; }
});

/* ================= 12. 종합 ================= */
const TESTS = [['Stanford-Binet 지능검사', 0], ['Wechsler 지능검사', 0], ['SAT (Scholastic Assessment Test)', 1], ['GRE (Graduate Record Examination)', 1], ['CPI (California Psychological Inventory)', 2], ['NEO 성격검사', 2], ['Strong 흥미검사', 3], ['Self-Directed Search', 3]];
const CRIT = ['구성개념 정의', '문항 품질', '신뢰도 증거', '타당도 증거', '규준·표본', '공정성', '윤리·사용', '실용성'];
const DESIGN_Q = [['구성개념', '예: 심리적 안전감'], ['대상', '예: 신입 팀원'], ['문항·응답 형식', '예: 10문항 5점 리커트'], ['목표 신뢰도', '예: α ≥ .80'], ['타당도 증거 계획', '예: 팀 이직률과 상관'], ['윤리적 유의점', '예: 채용 단독 사용 금지']];
MG.add({
  id: 'm12', no: 12, short: '종합', title: '대표 검사 리뷰와 종합', chap: 'Chapter 12', pages: '교재 p.317–332',
  sub: '배운 눈으로 검사를 평가하고, 나만의 검사를 설계하며 마무리합니다.',
  tocline: '대표 검사 매칭 · 검사 평가표 · 내 결과 리포트 · 설계서',
  recap: ['검사 정보를 찾는 곳과 대표 검사: 지능(Stanford-Binet, Wechsler), 성취(SAT, GRE), 구조화된 성격(CPI, NEO), 진로 흥미(Strong, Self-Directed Search) (p.317–330).', '책의 핵심 정리 — “Quick Book Review” (p.331).', '이 책의 두 목표: 검사를 <b>평가</b>하고 <b>설계</b>할 수 있는 것 (Preface).'],
  acts: [
    quiz({ id: 'tm', title: '대표 검사 매칭', src: '교재 p.317–330', lead: '각 검사가 속한 영역을 고르세요.', opts: ['지능', '학업 성취·적성', '성격', '진로 흥미'], items: TESTS.map(([q, a]) => ({ q, short: q.split(' ')[0], a, why: ['지능 검사', '학업 성취·적성 검사', '구조화된 성격 검사', '진로 흥미 검사'][a] + '입니다.' })) }),
    {
      id: 'sc', title: 'TPI 평가표 — 이 검사를 써도 될까', src: '교재 Preface 학습 목표', lead: '우리가 쓴 TPI를 8가지 기준으로 1–5점 평가하세요. 이번 워크숍에서 본 증거를 근거로 삼으세요.',
      input(el, ctx) { const r = ((ctx.my().sc && ctx.my().sc.r) || Array(8).fill(3)).slice(); CRIT.forEach((c, i) => el.append(sliderField(c, 1, 5, 1, r[i], v => r[i] = v))); el.append(h('button', { class: 'btn', onclick: () => ctx.save({ sc: { r } }) }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.sc); if (!docs.length) return empty(); const mean = CRIT.map((_, i) => ST.mean(docs.map(d => d.sc.r[i]))); const me = ctx.my().sc;
        const series = [{ name: '그룹 평균', v: mean, color: 'var(--c1)' }]; if (me) series.push({ name: '나', v: me.r, color: 'var(--c2)', dash: true });
        const low = CRIT[mean.indexOf(Math.min(...mean))];
        return stats([[docs.length, '평가자'], [fx(ST.mean(mean), 2), '전체 평균'], [low, '가장 낮은 평가 영역']]) + CH.radar(CRIT, series, 5, 360); }
    },
    {
      id: 'rep', title: '내 결과 리포트', src: '종합', lead: '이 워크숍에서 얻은 나의 TPI 결과를 한 장으로 모았습니다. 점수는 구간으로 읽으세요.', wide: true, mods: ['inv', 'm7'],
      out() { const me = INV.mine(); if (!me) return empty('<a href="#/inv">준비 단계</a>에서 TPI에 응답하면 리포트가 만들어집니다.'); const st = INV.stat(); const s = INV.sub(me.inv.r); const n = st.n;
        const a = n >= 6 ? ST.alpha(INV.rows()) : NaN; const sem = !isNaN(a) ? st.sd * Math.sqrt(1 - Math.max(0, a)) : NaN; const z = st.sd > 0 ? (s.T - st.m) / st.sd : NaN;
        const rowsP = INV.rows(); const zs = sub => { const v = rowsP.map(r => sub(r)); return (sub(INV.scored(me.inv.r)) - ST.mean(v)) / ST.sd(v); };
        const zP = n >= 6 ? zs(r => ST.sum(r.slice(0, 6))) : NaN, zN = n >= 6 ? zs(r => ST.sum(r.slice(6))) : NaN;
        return `<div class="cardrow"><div>${stats([[s.T, 'TPI 총점 (12–60)'], [isNaN(z) ? '–' : fx(50 + 10 * z, 0), 'T 점수'], [isNaN(z) ? '–' : fx(ST.cdf(z) * 100, 0) + '%', '백분위(정규 가정)'], [n, '비교 집단 n']])}
          ${!isNaN(sem) ? `<h4 class="sub-h">내 점수와 95% 신뢰구간 (SEM ${fx(sem, 1)}, α ${fx(a, 2)})</h4>` + CH.gauge(s.T, 12, 60, { ci: [s.T - 1.96 * sem, s.T + 1.96 * sem], marks: [{ x: st.m, label: '그룹 평균', color: 'var(--c3)' }] }) : empty('그룹 응답이 6명 이상이면 신뢰구간이 표시됩니다.')}</div>
          <div><h4 class="sub-h">하위 영역 T 점수</h4>${!isNaN(zP) ? CH.hbars([{ label: '팀 효능(긍정 6문항)', v: 50 + 10 * zP, txt: fx(50 + 10 * zP, 0), color: 'var(--c1)' }, { label: '팀 부담 해소(역채점 6문항)', v: 50 + 10 * zN, txt: fx(50 + 10 * zN, 0), color: 'var(--c4)' }], { max: 80, d: 0, ref: 50, refLabel: '평균 50' }) : empty()}${note('T=50이 그룹 평균입니다. 소규모 집단과 12문항 척도의 점수는 개인 평가용이 아닙니다.')}</div></div>
          <p style="margin-top:12px"><button class="btn ghost" onclick="window.print()">리포트 인쇄 · PDF 저장</button></p>`; }
    },
    {
      id: 'ds', title: '내가 만들 검사 설계서', src: '교재 전체', lead: '여러분의 HR 현장에서 직접 만들 검사를 한 줄씩 설계해 보세요. 모인 설계서는 서로의 아이디어가 됩니다.',
      input(el, ctx) { const m = (ctx.my().ds && ctx.my().ds.f) || Array(6).fill(''); const f = m.slice(); DESIGN_Q.forEach(([q, ph], i) => el.append(h('div', { class: 'field' }, h('label', {}, q), h('input', { maxlength: 60, placeholder: ph, value: f[i], oninput: e => f[i] = e.target.value }))));
        el.append(h('button', { class: 'btn', onclick: () => { if (f.some(x => !x.trim())) return alert('6칸을 모두 채워 주세요.'); ctx.save({ ds: { f: f.map(x => x.trim()) } }); } }, '설계서 올리기')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.ds).sort((a, b) => b.ts - a.ts); if (!docs.length) return empty(); return stats([[docs.length, '올라온 설계서']]) + `<div class="wall">${docs.slice(0, 24).map(d => `<div class="it ${d.id === S.me.id ? 'me' : ''}"><small>${esc(d.name)}</small><b>${esc(d.ds.f[0])}</b> · ${esc(d.ds.f[1])}<br>${esc(d.ds.f[2])} · ${esc(d.ds.f[3])}<br><small>타당도: ${esc(d.ds.f[4])} / 윤리: ${esc(d.ds.f[5])}</small></div>`).join('')}</div>`; }
    }],
  demo(p, rng) { const dz = [['심리적 안전감', '신입 팀원', '10문항 5점 리커트', 'α ≥ .80', '팀 이직률과의 상관', '채용 단독 사용 금지'], ['리더십 역량', '팀장 후보', '360도 평정 12문항', 'ICC ≥ .75', '승진 후 팀 성과', '평정자 교육 필수'], ['직무 몰입', '전 직원', '9문항 7점 척도', 'α ≥ .85', '결근율·이직의도', '익명 응답 보장'], ['고객 응대 상황판단', '콜센터 지원자', '시나리오 15문항', 'α ≥ .70', '입사 6개월 고객평점', '집단 간 4/5 규칙 점검'], ['학습 민첩성', '경력 지원자', '8문항 5점', 'α ≥ .80', '교육 후 성과 향상', '재응시 간격 설정']][p.i % 5];
    return { tm: { c: TESTS.map(([, a]) => rng() < .8 ? a : Math.floor(rng() * 4)) }, sc: { r: CRIT.map((_, i) => ST.clamp(Math.round([3.4, 3.6, 3.8, 3.0, 2.6, 3.2, 3.4, 4.1][i] + 0.8 * ST.norm(rng)), 1, 5)) }, ds: { f: dz } }; }
});
