/* 준비: 팀 플레이어 인벤토리(TPI) — 교재 전반에서 쓰는 예시 척도를 한국어 12문항으로 재구성 */
const ITEMS = [
  { s: '팀 아이디어', t: '팀으로 일하면 혼자 할 때보다 더 좋은 아이디어가 나온다.', R: false, f: 'P' },
  { s: '동료 의견', t: '동료의 의견을 들으면 내 일의 질이 높아진다.', R: false, f: 'P' },
  { s: '팀 프로젝트 즐거움', t: '팀 프로젝트에 참여하는 것이 즐겁다.', R: false, f: 'P' },
  { s: '내 기여', t: '내가 낸 의견은 팀에 도움이 된다고 생각한다.', R: false, f: 'P' },
  { s: '함께 이룬 보람', t: '팀이 함께 목표를 이루면 혼자 해냈을 때보다 더 큰 보람을 느낀다.', R: false, f: 'P' },
  { s: '긍정적 경험', t: '지금까지의 팀 경험은 대체로 긍정적이었다.', R: false, f: 'P' },
  { s: '무임승차(R)', t: '팀 업무에서는 일부 구성원이 무임승차하기 쉽다.', R: true, f: 'N' },
  { s: '속도 저하(R)', t: '팀으로 일하면 내 업무 속도가 느려진다.', R: true, f: 'N' },
  { s: '혼자 다 함(R)', t: '팀 프로젝트에서 일은 내가 다 하고 공은 나누게 되는 일이 많다.', R: true, f: 'N' },
  { s: '혼자가 성과(R)', t: '나는 혼자 일할 때 가장 좋은 성과를 낸다.', R: true, f: 'N' },
  { s: '조율 비용(R)', t: '회의와 조율에 드는 시간이 결과보다 더 크다고 느낀다.', R: true, f: 'N' },
  { s: '팀 남용(R)', t: '우리 조직은 팀 단위 업무를 지나치게 많이 쓴다.', R: true, f: 'N' }
];
const ORDER = [0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11];
const LIK = ['전혀 아니다', '아니다', '보통', '그렇다', '매우 그렇다'];
const INV = {
  valid: d => d && d.inv && Array.isArray(d.inv.r) && d.inv.r.length === 12 && d.inv.r.every(v => v >= 1 && v <= 5),
  scored: r => r.map((v, i) => ITEMS[i].R ? 6 - v : v),
  people: () => docsOf('inv').filter(INV.valid),
  rows: () => INV.people().map(d => INV.scored(d.inv.r)),
  raw: () => INV.people().map(d => d.inv.r),
  sub: r => { const s = INV.scored(r); return { P: ST.sum(s.slice(0, 6)), N: ST.sum(s.slice(6)), T: ST.sum(s) }; },
  tot: r => ST.sum(INV.scored(r)),
  totals: () => INV.people().map(d => INV.tot(d.inv.r)),
  mine: () => { const d = S.my.inv; return INV.valid(d) ? d : null; },
  stat() { const t = INV.totals(); return { n: t.length, m: ST.mean(t), sd: ST.sd(t) }; },
  need: (min = 6) => INV.people().length < min ? `<div class="empty">그룹 응답이 ${min}명 이상 모이면 계산됩니다. (현재 ${INV.people().length}명) · <a href="#/inv">TPI 응답하기</a> 또는 방 코드 <b>demo</b>를 써 보세요.</div>` : ''
};
const TPI_NOTE = '⚠ 교육용 12문항 척도입니다. 임상·채용·평가 판단에 쓸 수 없습니다.';

MG.add({
  id: 'inv', no: 0, short: '준비', title: '팀 플레이어 인벤토리 응답', chap: '준비 단계', pages: '교재 전반의 공통 예시',
  sub: '이후 모든 챕터에서 계산에 쓰일 12문항입니다. 솔직하게, 한 번만 응답하세요.',
  tocline: '12문항에 응답 — 이후 모든 분석의 재료',
  recap: ['교재는 챕터마다 <b>팀 플레이어 인벤토리(TPI)</b>를 예시로 씁니다(Table 9.1 등). 이 사이트는 같은 구상으로 한국어 12문항을 새로 만들었습니다.',
    '12문항 중 6문항은 긍정 문장, 6문항은 <b>역문항(R)</b>입니다. 역채점이 필요한 혼합 형식도 교재와 같습니다 (Ch.3).',
    '여러분의 응답이 모여 점수 변환(Ch.1), 문항분석(Ch.5), 신뢰도(Ch.7), 요인구조(Ch.10)를 <b>실제 데이터로</b> 계산합니다.'],
  acts: [{
    id: 'form', title: 'TPI 12문항 응답', src: '교재 Table 1.5 · 9.1 재구성', lead: '“팀/그룹으로 일하는 상황”을 떠올리고 각 문장에 얼마나 동의하는지 고르세요.', mods: [],
    input(el, ctx) {
      const d = INV.mine(); const f = h('form', { class: 'likert' });
      ORDER.forEach((i, n) => f.append(h('fieldset', {}, h('legend', {}, h('span', { class: 'qn' }, n + 1), ITEMS[i].t),
        h('div', { class: 'choices' }, LIK.map((t, v) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'q' + i, value: v + 1, checked: d && d.inv.r[i] === v + 1 }), h('span', {}, `${v + 1} ${t}`)))))));
      f.append(h('p', { class: 'note' }, TPI_NOTE), h('button', { class: 'btn', type: 'submit' }, d ? '응답 수정' : '제출하고 결과 보기'));
      f.addEventListener('submit', e => { e.preventDefault(); const r = ITEMS.map((_, i) => { const x = f.querySelector(`input[name=q${i}]:checked`); return x ? +x.value : 0; });
        if (r.includes(0)) { alert('모든 문항에 응답해 주세요.'); return; } ctx.save({ inv: { r } }); });
      el.append(f);
    },
    out() {
      const me = INV.mine(), ppl = INV.people(); let html = '';
      if (me) { const s = INV.sub(me.inv.r); const st = INV.stat();
        html += stats([[s.T, '내 TPI 총점 (12–60)'], [s.P, '팀 효능 소계 (6–30)'], [s.N, '팀 부담 소계·역채점 후 (6–30)'], [st.n >= 4 ? fx(st.m, 1) : '–', '그룹 평균']]); }
      if (!ppl.length) return html + empty();
      const m = i => ST.mean(ppl.map(d => d.inv.r[i]));
      html += `<h4 class="sub-h">문항별 평균 응답 (역채점 전, 1–5)</h4>` + CH.hbars(ORDER.map(i => ({ label: ITEMS[i].s, v: m(i), color: ITEMS[i].R ? 'var(--c3)' : 'var(--c1)', mark: me ? `나 ${me.inv.r[i]}` : '' })), { max: 5, d: 2 }) +
        CH.legend([['긍정 문항', 'var(--c1)'], ['역문항(R)', 'var(--c3)']]);
      const t = INV.totals();
      if (t.length >= 4) html += `<h4 class="sub-h">총점 분포 (n=${t.length})</h4>` + CH.hist(t, { min: 12, max: 60, bins: 12, curve: { mean: ST.mean(t), sd: ST.sd(t) }, marks: me ? [{ x: INV.tot(me.inv.r), label: '나', color: 'var(--c2)' }] : [], xl: 'TPI 총점', label: 'TPI 총점 분포' });
      return html;
    }
  }],
  demo(p, rng) {
    const r = []; const g = () => ST.norm(rng);
    for (let i = 0; i < 12; i++) {
      let s = ITEMS[i].f === 'P' ? 3.6 + 0.75 * p.t + 0.7 * g() : 3.3 + 0.7 * p.t + 0.35 * p.u + 0.7 * g();
      s = ST.clamp(Math.round(s), 1, 5); r.push(ITEMS[i].R ? 6 - s : s);
    }
    p.inv = r;
    return { inv: { r } };
  }
});
