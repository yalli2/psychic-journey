/* 챕터 1–4 */
function sliderField(label, min, max, step, val, cb, fmt = v => v, hint) {
  const out = h('span', { class: 'val' }, fmt(val));
  const inp = h('input', { type: 'range', min, max, step, value: val, 'aria-label': label });
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); cb(+inp.value); });
  return h('div', { class: 'field' }, h('label', {}, label, ' ', out), inp, hint ? h('span', { class: 'hint' }, hint) : null);
}
function chips(name, labels, cur, cb) {
  return h('div', { class: 'choices' }, labels.map((t, j) => { const inp = h('input', { type: 'radio', name, value: j, checked: cur === j }); inp.addEventListener('change', () => cb(j)); return h('label', { class: 'chip' }, inp, h('span', {}, t)); }));
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/* ================= 1. 측정의 기초 ================= */
const LEVELS = ['명명', '서열', '등간', '비율'];
let normRef = { mode: 'group', m: 36, sd: 6 };
const CORR_R = [0.2, 0.55, -0.7, 0.9];
const corrData = k => { const rng = ST.rng(777 + k * 13); const rho = CORR_R[k]; const pts = [];
  for (let i = 0; i < 40; i++) { const a = ST.norm(rng), b = ST.norm(rng); pts.push({ x: a, y: rho * a + Math.sqrt(1 - rho * rho) * b }); }
  return { pts, r: ST.corr(pts.map(p => p.x), pts.map(p => p.y)) }; };
const ASPECTS = [['직장 업무 사례', 1], ['학교 프로젝트 경험', 1], ['과거의 팀 경험', 1], ['팀 활동의 결과(성과)', 1], ['목표를 향한 진전', 1], ['투입한 노력', 1], ['결과에 대한 평가', 1],
  ['스포츠 팀 경험', 0], ['개인적 인간관계', 0], ['현재의 개인 상황', 0], ['성격 충돌', 0], ['비서구 문화권의 팀워크', 0]];

MG.add({
  id: 'm1', no: 1, short: '측정의 기초', title: '측정의 기초', chap: 'Chapter 1', pages: '교재 p.1–28',
  sub: '사람의 마음을 재는 첫걸음은 무엇을, 어떤 눈금으로 잴지 정하는 일입니다.',
  tocline: '척도 수준 · 정규분포와 T점수 · 상관 · 구성개념의 경계',
  recap: ['사회과학의 측정은 <b>개념적 정의 → 조작적 정의(문항)</b> 순서로 진행합니다 (p.2).', '측정 수준: <b>명명 · 서열 · 등간 · 비율</b>. 수준에 따라 쓸 수 있는 통계가 달라집니다 (p.4–5).',
    '정규분포(Fig 1.1)와 <b>z·T 점수</b> 변환(Fig 1.3), 상관과 회귀(Fig 1.2 급여~GPA)를 복습합니다 (p.5–23).', '구성개념의 경계: 팀 플레이어에 <b>포함/제외</b>할 영역을 정해야 합니다 (Table 1.5, p.24–27).'],
  acts: [
    quiz({ id: 'lv', title: '이 숫자는 어떤 눈금일까', src: '교재 p.4–5', lead: '8개 측정값의 수준을 고르세요. 0이 “없음”을 뜻하는지, 간격이 같은지가 핵심입니다.', opts: LEVELS, items: [
      { q: '사원번호 (1042, 1043 …)', short: '사원번호', a: 0, why: '번호는 이름표일 뿐 크기를 뜻하지 않습니다.' },
      { q: '직급 (사원 < 대리 < 과장 < 차장)', short: '직급', a: 1, why: '순서는 있으나 직급 간 간격이 같다고 할 수 없습니다.' },
      { q: '섭씨 온도 (20℃, 25℃, 30℃)', short: '섭씨 온도', a: 2, why: '간격은 같지만 0℃가 “온도 없음”이 아닙니다.' },
      { q: '월 매출액 (원)', short: '월 매출액', a: 3, why: '0원은 진짜 없음이므로 “두 배”를 말할 수 있습니다.' },
      { q: '인사평가 등급 (S, A, B, C)', short: '평가 등급', a: 1, why: '등급 간 거리는 알 수 없는 순위 정보입니다.' },
      { q: '부서 코드 (1=영업, 2=개발, 3=인사)', short: '부서 코드', a: 0, why: '범주를 숫자로 부호화한 것입니다 (교재의 전공 코드 예).' },
      { q: '근속 연수', short: '근속 연수', a: 3, why: '0년이 “근무 없음”이며 비율 비교가 가능합니다.' },
      { q: '토익 점수', short: '토익 점수', a: 2, why: '점수 간격은 같게 해석하지만 “토익 0점”은 영어 능력 없음이 아닙니다.' }] }),
    {
      id: 'norm', title: '정규분포 위의 내 위치', src: '교재 Fig 1.1 · 1.3, p.21–24', lead: '내 TPI 총점이 정규분포의 어디에 놓이는지 z · T · 백분위로 바꿔 봅니다. 아래 줄의 점이 그룹 구성원입니다.', mods: ['inv'],
      input(el, ctx) {
        const f = h('div', {});
        f.append(h('div', { class: 'field' }, h('label', {}, '기준 집단'), chips('nref', ['그룹 응답자', '직접 입력(평균·SD)'], normRef.mode === 'group' ? 0 : 1, j => { normRef.mode = j ? 'manual' : 'group'; man.hidden = !j; ctx.done(); ctx.refresh(); })));
        const man = h('div', { class: 'row', hidden: normRef.mode === 'group' }, h('label', {}, '평균', h('input', { type: 'number', value: normRef.m, oninput: e => { normRef.m = +e.target.value; ctx.refresh(); } })), h('label', {}, 'SD', h('input', { type: 'number', value: normRef.sd, min: 1, oninput: e => { normRef.sd = +e.target.value; ctx.refresh(); } })));
        f.append(man, h('p', { class: 'note' }, 'z = (X − 평균) / SD, T = 50 + 10z, 스태나인 = 2z + 5(1–9로 절단). 정규분포를 가정한 백분위입니다.'));
        el.append(f);
      },
      out(ctx) {
        const me = INV.mine(); const ppl = INV.people(); const st = INV.stat();
        const m = normRef.mode === 'group' ? st.m : normRef.m, sd = normRef.mode === 'group' ? st.sd : normRef.sd;
        if (!me) return CH.normal() + empty('먼저 <a href="#/inv">준비 단계</a>에서 TPI에 응답하세요.');
        if (!(sd > 0)) return empty('기준 집단의 SD를 계산하려면 응답자가 더 필요합니다.');
        const x = INV.tot(me.inv.r), z = (x - m) / sd; const cnt = {};
        const dots = ppl.map(d => { const zz = (INV.tot(d.inv.r) - m) / sd; const k = Math.round(zz * 6); cnt[k] = (cnt[k] || 0) + 1; return { z: zz, row: cnt[k] - 1, me: d.id === S.me.id, tip: `${d.name}: ${INV.tot(d.inv.r)}점` }; });
        const emp = pct(INV.totals().filter(v => v < x).length + INV.totals().filter(v => v === x).length / 2, ppl.length);
        return stats([[x, '내 원점수'], [fx(z, 2), 'z'], [fx(50 + 10 * z, 0), 'T 점수'], [fx(ST.cdf(z) * 100, 0) + '%', '정규 백분위'], [ST.stanine(z), '스태나인'], [emp + '%', '그룹 내 실제 순위']]) +
          CH.normal({ mark: z, markLabel: `나 (z=${fx(z, 2)})`, dots }) + note(`그룹 평균 ${fx(m, 1)}, SD ${fx(sd, 1)} 기준입니다. 응답자가 적으면 분포가 정규곡선과 다르게 보이는 것이 정상입니다.`);
      }
    },
    {
      id: 'corr', title: '상관계수 눈대중 맞히기', src: '교재 p.7–11 · Fig 1.2', lead: '점 40개의 산점도를 보고 상관계수 r을 맞혀 보세요. 모두에게 같은 그림이 나옵니다.',
      input(el, ctx) {
        const g = (ctx.my().corr && ctx.my().corr.g) || [0, 0, 0, 0]; const cur = g.slice();
        for (let k = 0; k < 4; k++) { const d = corrData(k); el.append(h('div', { html: CH.scatter(d.pts, { xmin: -3, xmax: 3, ymin: -3, ymax: 3, fx: v => v, fy: v => v, label: `산점도 ${k + 1}` }) }), sliderField(`그림 ${k + 1}의 r 추정`, -1, 1, 0.05, cur[k], v => cur[k] = v, v => fx(v, 2))); }
        el.append(h('button', { class: 'btn', onclick: () => ctx.save({ corr: { g: cur } }) }, '내 추정 제출'));
      },
      out(ctx) {
        const docs = ctx.docs().filter(d => d.corr && d.corr.g); if (!docs.length) return empty(); const me = ctx.my().corr;
        let html = `<p class="note">제출한 뒤에는 실제 표본 r이 표시됩니다. 점 하나가 한 사람의 추정치입니다.</p>`;
        const errs = [];
        for (let k = 0; k < 4; k++) { const t = corrData(k).r; const vals = docs.map(d => ({ v: d.corr.g[k], me: d.id === S.me.id, tip: `${d.name}: ${fx(d.corr.g[k], 2)}` }));
          html += `<h4 class="sub-h">그림 ${k + 1} · ${me ? '실제 r = ' + fx(t, 2) : '실제 r은 제출 후 공개'}</h4>` + CH.strip(vals, { min: -1, max: 1, n: 4, h: 84, marks: me ? [{ x: t, label: 'r ' + fx(t, 2), color: 'var(--c3)' }] : [], label: `그림 ${k + 1} 추정 분포` }); }
        const mae = d => ST.mean([0, 1, 2, 3].map(k => Math.abs(d.corr.g[k] - corrData(k).r)));
        return stats([[docs.length, '참여'], me ? [fx(mae({ corr: me }), 2), '내 평균 오차'] : ['–', '내 평균 오차'], [fx(ST.mean(docs.map(mae)), 2), '그룹 평균 오차']]) + html;
      }
    },
    {
      id: 'bound', title: '“팀 플레이어”의 경계 정하기', src: '교재 Table 1.5, p.24–27', lead: '구성개념을 측정하려면 무엇을 포함하고 무엇을 뺄지 먼저 합의해야 합니다. 12개 영역을 문항에 넣을지 고르세요.',
      input(el, ctx) { const cur = (ctx.my().bound && ctx.my().bound.c) || Array(12).fill(-1); const c = cur.slice();
        ASPECTS.forEach(([t], i) => el.append(h('div', { class: 'field' }, h('label', {}, t), chips('b' + i, ['포함', '제외'], c[i] === -1 ? null : c[i] === 1 ? 0 : 1, j => c[i] = j === 0 ? 1 : 0))));
        el.append(h('button', { class: 'btn', onclick: () => { if (c.includes(-1)) { alert('12개 영역 모두 선택해 주세요.'); return; } ctx.save({ bound: { c } }); } }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.bound && d.bound.c); if (!docs.length) return empty(); const me = ctx.my().bound;
        const items = ASPECTS.map(([t, book], i) => { const k = docs.filter(d => d.bound.c[i] === 1).length / docs.length; return { label: t, v: k * 100, txt: Math.round(k * 100) + '%', color: book ? 'var(--c1)' : 'var(--c3)', mark: me ? (me.c[i] === 1 ? '나:포함' : '나:제외') : '', tip: `${t}: 포함 ${Math.round(k * 100)}%` }; });
        const agree = ST.mean(items.map(i => Math.abs(i.v - 50) * 2));
        return stats([[docs.length, '참여'], [Math.round(agree) + '%', '평균 합의도 (50%=의견 갈림)']]) + CH.hbars(items, { max: 100, d: 0, ref: 50, refLabel: '50%' }) + CH.legend([['교재가 포함으로 분류', 'var(--c1)'], ['교재가 제외로 분류', 'var(--c3)']]) + note('막대가 50% 근처인 영역일수록 사람마다 정의가 다르다는 뜻입니다. 이런 영역은 측정 전에 정의부터 합의해야 합니다.'); }
    }],
  demo(p, rng) { return {
    lv: { c: [0, 1, 2, 3, 1, 0, 3, 2].map((a, i) => rng() < 0.75 ? a : Math.floor(rng() * 4)) },
    corr: { g: [0, 1, 2, 3].map(k => ST.clamp(Math.round((corrData(k).r + ST.norm(rng) * 0.16) * 20) / 20, -1, 1)) },
    bound: { c: ASPECTS.map(([, b], i) => rng() < (b ? 0.82 : 0.3) ? 1 : 0) } }; }
});

/* ================= 2. 문항 만들기 ================= */
const FLAWS = ['이중질문', '이중부정', '유도질문', '모호한 빈도어', '전문용어', '극단적 표현', '결함 없음'];
const VALUES = ['보상', '성장', '안정', '인정', '자율'];
const PAIRS = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) PAIRS.push([i, j]);
const GUT = ['나는 팀 회의에 참석한다.', '나는 회의에서 내 의견을 말한다.', '나는 동료의 일을 대신 맡아 준 적이 있다.', '나는 팀 목표를 위해 내 성과 인정을 양보한 적이 있다.'];
const CONSTRUCTS = ['리더십', '심리적 안전감', '직무 만족', '창의성', '회복탄력성'];
const lintItem = t => { const w = []; if (/그리고|및|하며|하고|이면서/.test(t)) w.push('두 가지를 한 번에 묻고 있진 않나요? (이중질문)'); if (/않지 않|못하지 않|아니지 않/.test(t)) w.push('이중부정은 혼란을 줍니다.'); if (/항상|절대|전혀|모든|언제나/.test(t)) w.push('극단적 표현은 거의 모두가 같은 쪽으로 답하게 만듭니다.'); if (/자주|가끔|종종|많이|거의/.test(t)) w.push('“자주” 같은 빈도어는 사람마다 기준이 다릅니다. 기간·횟수로 바꿔 보세요.'); if (t.length > 45) w.push('문장이 깁니다. 하나의 생각만 담으세요.'); return w; };
const WALL_DEMO = [['리더십', '구성원이 스스로 결정하도록 권한을 나누는 능력', '나는 팀원이 결정할 일은 팀원에게 맡긴다.'], ['심리적 안전감', '실수나 반대 의견을 말해도 불이익이 없다고 믿는 정도', '우리 팀에서는 실수를 공개해도 비난받지 않는다.'], ['직무 만족', '현재 업무에서 느끼는 전반적인 긍정 정서', '지난 한 달 동안 내 일에 만족하는 날이 더 많았다.'], ['창의성', '새롭고 쓸모 있는 해결책을 내놓는 정도', '나는 업무 문제를 기존과 다른 방식으로 푼 적이 있다.'], ['회복탄력성', '좌절 후 업무 기능을 회복하는 속도', '큰 실수 후에도 일주일 안에 평소 업무 리듬을 되찾는다.']];

MG.add({
  id: 'm2', no: 2, short: '문항 만들기', title: '문항 설계와 작성', chap: 'Chapter 2', pages: '교재 p.29–48',
  sub: '좋은 검사는 좋은 문장에서 시작합니다. 문항 결함을 찾고, 직접 쓰고, 척도화의 고전 기법을 체험합니다.',
  tocline: '문항 결함 진단 · 쌍비교 · 문항 쓰기 · 거트만 척도',
  recap: ['문항 개발의 세 접근: <b>경험적 · 이론적 · 합리적</b>. 문헌 조사와 주제 전문가(SME)의 도움이 필요합니다 (p.29–32).', '문항 작성 규칙(이중질문 피하기, 명확한 언어 등)과 적정 문항 수 (p.32–35).',
    '태도 척도의 초기 기법: <b>쌍비교</b>(Table 2.1–2.2), 순위 범주(Table 2.3–2.4), 서스톤 등간 범주(Table 2.5–2.7), <b>거트만 척도</b>(Table 2.9–2.10) (p.35–45).', '행동 평가를 위한 <b>결정적 사건 기법</b>과 <b>파일럿 테스트</b> (p.45–46).'],
  acts: [
    quiz({ id: 'flaw', title: '문항 결함 진단', src: '교재 p.32–35', lead: '아래 문항은 무엇이 문제일까요? 하나만 고르세요.', opts: FLAWS, items: [
      { q: '“나는 팀원들과 소통을 잘하고 업무 속도도 빠르다.”', short: '소통+속도', a: 0, why: '소통과 속도는 별개 — 한 문항에 둘을 묻습니다.' },
      { q: '“나는 팀 회의에 참석하지 않는 것이 바람직하지 않다는 말에 동의하지 않는다.”', short: '회의 참석', a: 1, why: '부정이 겹쳐 동의/비동의의 방향이 헷갈립니다.' },
      { q: '“훌륭한 리더라면 당연히 팀원 의견을 경청해야 하지 않습니까?”', short: '경청 리더', a: 2, why: '정답을 유도하는 문장입니다.' },
      { q: '“나는 자주 야근을 한다.”', short: '자주 야근', a: 3, why: '‘자주’의 기준이 사람마다 다릅니다.' },
      { q: '“우리 팀은 KPI 캐스케이딩과 OKR 얼라인먼트가 되어 있다.”', short: 'KPI/OKR', a: 4, why: '응답자가 모르는 용어는 측정 오염을 만듭니다.' },
      { q: '“나는 항상 모든 동료를 신뢰한다.”', short: '항상 신뢰', a: 5, why: '‘항상·모든’은 거의 아무도 동의할 수 없어 변별력이 없습니다.' },
      { q: '“나는 지난 한 달 동안 주 1회 이상 동료의 일을 도왔다.”', short: '주1회 도움', a: 6, why: '기간·빈도가 구체적이고 하나만 묻습니다.' },
      { q: '“나는 팀워크가 좋고 신뢰할 만한 상사 밑에서 일한다.”', short: '팀워크+상사', a: 0, why: '팀워크와 상사 신뢰는 따로 물어야 합니다.' }] }),
    {
      id: 'pair', title: '일의 가치 쌍비교', src: '교재 Table 2.1–2.2, p.35–37', lead: '다섯 가지 일의 가치를 둘씩 맞붙여 더 중요한 쪽을 고르세요. 10번의 선택이 순위 척도가 됩니다.',
      input(el, ctx) { const cur = (ctx.my().pc && ctx.my().pc.c) || Array(10).fill(-1); const c = cur.slice();
        PAIRS.forEach(([a, b], i) => el.append(h('div', { class: 'pair' }, chips('p' + i, [VALUES[a], VALUES[b]], c[i] === -1 ? null : c[i], j => c[i] = j))));
        el.append(h('button', { class: 'btn', onclick: () => { if (c.includes(-1)) { alert('10쌍 모두 골라 주세요.'); return; } ctx.save({ pc: { c } }); } }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.pc && d.pc.c); if (!docs.length) return empty();
        const P = VALUES.map(() => VALUES.map(() => NaN)); PAIRS.forEach(([a, b], i) => { const k = docs.filter(d => d.pc.c[i] === 0).length / docs.length; P[a][b] = k; P[b][a] = 1 - k; });
        const win = VALUES.map((_, v) => ST.mean(docs.map(d => PAIRS.reduce((s, [a, b], i) => s + ((a === v && d.pc.c[i] === 0) || (b === v && d.pc.c[i] === 1) ? 1 : 0), 0))));
        const me = ctx.my().pc;
        return `<h4 class="sub-h">선택 비율표 (행이 열을 이긴 비율, 교재 Table 2.1 형식)</h4>` + CH.heat(P, VALUES, VALUES, { cs: 52, L: 52, dec: 2, scale: 1, label: '쌍비교 비율표' }) +
          `<h4 class="sub-h">가치별 평균 승수 (최대 4)</h4>` + CH.hbars(VALUES.map((v, i) => ({ label: v, v: win[i], color: C[i % 4], mark: me ? '' : '' })), { max: 4, d: 2 }) + note(`${docs.length}명의 응답 기준. 서스톤 방식은 이 비율을 정규 z값으로 바꿔 등간 척도를 만듭니다.`); }
    },
    {
      id: 'wall', title: '내 문항 써 보기', src: '교재 p.30–35', lead: '구성개념 하나를 고르고 정의와 문항 하나를 쓰세요. 쓰는 동안 흔한 결함을 점검해 드립니다.',
      input(el, ctx) { const my = ctx.my().wall || {}; const sel = h('select', {}, CONSTRUCTS.map(c => h('option', { selected: my.c === c }, c)));
        const def = h('textarea', { maxlength: 70, placeholder: '개념적 정의 (70자 이내)' }, my.d || ''); const it = h('input', { maxlength: 60, placeholder: '문항 한 개 (60자 이내)', value: my.i || '' }); const lint = h('div', { class: 'note warn' });
        const upd = () => { const w = lintItem(it.value); lint.innerHTML = w.length ? w.map(x => '⚠ ' + esc(x)).join('<br>') : (it.value ? '<span class="ok">✓ 흔한 결함이 보이지 않습니다.</span>' : ''); }; it.addEventListener('input', upd); upd();
        el.append(h('div', { class: 'field' }, h('label', {}, '구성개념'), sel), h('div', { class: 'field' }, h('label', {}, '개념적 정의'), def), h('div', { class: 'field' }, h('label', {}, '조작적 정의 = 문항'), it), lint,
          h('button', { class: 'btn', onclick: () => { if (!def.value.trim() || !it.value.trim()) return alert('정의와 문항을 모두 쓰세요.'); ctx.save({ wall: { c: sel.value, d: def.value.trim(), i: it.value.trim() } }); } }, '벽에 붙이기')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.wall).sort((a, b) => b.ts - a.ts); if (!docs.length) return empty();
        const cnt = CONSTRUCTS.map(c => ({ label: c, v: docs.filter(d => d.wall.c === c).length, color: 'var(--c1)' }));
        const flaw = docs.filter(d => lintItem(d.wall.i).length).length;
        return stats([[docs.length, '붙은 문항'], [pct(flaw, docs.length) + '%', '점검 경고가 있는 문항']]) + CH.hbars(cnt, { d: 0 }) + `<div class="wall" style="margin-top:12px">${docs.slice(0, 30).map(d => `<div class="it ${d.id === S.me.id ? 'me' : ''}"><small>${esc(d.wall.c)} · ${esc(d.name)} — ${esc(d.wall.d)}</small>${esc(d.wall.i)}</div>`).join('')}</div>`; }
    },
    {
      id: 'gut', title: '거트만 척도 — 누적되는 행동', src: '교재 Table 2.9–2.10, p.42–45', lead: '네 문장 중 해당하는 것을 모두 체크하세요. 쉬운 행동을 못 하면서 어려운 행동을 하는 “오류” 응답이 얼마나 되는지 봅니다.',
      input(el, ctx) { const cur = ((ctx.my().gut && ctx.my().gut.g) || [0, 0, 0, 0]).slice(); GUT.forEach((t, i) => { const cb = h('input', { type: 'checkbox', checked: !!cur[i] }); cb.addEventListener('change', () => cur[i] = cb.checked ? 1 : 0); el.append(h('label', { class: 'rater' }, cb, ' ' + t)); });
        el.append(h('button', { class: 'btn', onclick: () => ctx.save({ gut: { g: cur } }) }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.gut && d.gut.g); if (!docs.length) return empty();
        const rows = docs.map(d => { const g = d.gut.g, t = ST.sum(g); const err = g.reduce((s, v, i) => s + (v !== (i < t ? 1 : 0) ? 1 : 0), 0); return { d, g, t, err }; }).sort((a, b) => b.t - a.t || a.err - b.err);
        const errs = ST.sum(rows.map(r => r.err)); const CR = 1 - errs / (rows.length * 4);
        const t = table(['응답자', '문장 1', '문장 2', '문장 3', '문장 4', '합'], rows.slice(0, 26).map(r => [who(r.d), ...r.g.map((v, i) => `<span class="${v !== (i < r.t ? 1 : 0) ? 'hl' : ''}">${v ? '✓' : '·'}</span>`), r.t]), 'sm');
        return stats([[rows.length, '응답자'], [fx(CR, 2), '재생산 계수 (≥.90이면 거트만 척도)', CR >= .9 ? 'good' : 'warn'], [errs, '오류 칸 수']]) + t +
          CH.hbars(GUT.map((g, i) => ({ label: `문장 ${i + 1}`, v: pct(rows.filter(r => r.g[i]).length, rows.length), txt: pct(rows.filter(r => r.g[i]).length, rows.length) + '%' })), { max: 100, d: 0 }) + note('음영 칸은 “합계가 주어졌을 때 기대되는 누적 패턴”과 다른 칸입니다. 문장 1 → 4로 갈수록 어려운 행동이어야 척도가 성립합니다.'); }
    }],
  demo(p, rng) {
    const thr = [-1.2, -0.3, 0.4, 1.2]; const g = thr.map(t => (p.t + 0.45 * ST.norm(rng) > t) ? 1 : 0);
    const v = [p.i % 5, 0, 0, 0]; const c = PAIRS.map(([a, b]) => { const u = [0.6, 1.1, 0.2, 0.5, 0.9]; return (u[a] + 0.9 * ST.norm(rng) > u[b] + 0.9 * ST.norm(rng)) ? 0 : 1; });
    const w = WALL_DEMO[p.i % 5];
    return { flaw: { c: [0, 1, 2, 3, 4, 5, 6, 0].map(a => rng() < 0.7 ? a : Math.floor(rng() * 7)) }, pc: { c }, wall: { c: w[0], d: w[1], i: w[2] }, gut: { g } };
  }
});

/* ================= 3. 응답 설계 ================= */
const WV = ['자율', '성장', '보상', '안정']; let gc = { R: 18, W: 6, k: 4, N: 30 };
MG.add({
  id: 'm3', no: 3, short: '응답 설계', title: '응답 형식과 채점', chap: 'Chapter 3', pages: '교재 p.49–75',
  sub: '같은 질문도 응답 형식에 따라 얻는 정보가 달라집니다. 형식을 바꿔 보고, 역채점과 규준·이상 척도의 함정을 확인합니다.',
  tocline: '응답 형식 비교 · 역채점 · ipsative 척도 · 추측 보정',
  recap: ['개방형 vs 폐쇄형, <b>이분형</b> · 다지선다(오답지, 추측, 속도/역량 검사) · <b>연속형</b> 응답 (p.49–61).', '합산 평정(<b>리커트</b>), 시각적 아날로그 척도(Fig 3.2), 표정 척도(Fig 3.3) (p.61–69).', '<b>ipsative vs normative</b> 척도 — 총합이 고정되면 점수끼리 음의 상관이 강제됩니다 (p.69–72).', '차이 점수와 변화 점수의 문제 (p.72–74).'],
  acts: [
    {
      id: 'fmt', title: '같은 질문, 네 가지 응답 형식', src: '교재 p.55–69 · Fig 3.2', lead: '“팀으로 일하는 것이 내 성과를 높여 준다.” 이 문장에 네 가지 형식으로 답해 보세요.',
      input(el, ctx) { const m = ctx.my().fmt || {}; const c = { d: m.d ?? -1, l5: m.l5 ?? -1, l4: m.l4 ?? -1, v: m.v ?? 50 };
        el.append(h('div', { class: 'field' }, h('label', {}, '① 이분형'), chips('f1', ['비동의', '동의'], c.d === -1 ? null : c.d, j => c.d = j)),
          h('div', { class: 'field' }, h('label', {}, '② 5점 리커트'), chips('f2', LIK, c.l5 === -1 ? null : c.l5 - 1, j => c.l5 = j + 1)),
          h('div', { class: 'field' }, h('label', {}, '③ 4점 (중립 없음)'), chips('f3', ['전혀', '아니다', '그렇다', '매우'], c.l4 === -1 ? null : c.l4 - 1, j => c.l4 = j + 1)),
          sliderField('④ 시각적 아날로그(0–100)', 0, 100, 1, c.v, v => c.v = v),
          h('button', { class: 'btn', onclick: () => { if (c.d < 0 || c.l5 < 0 || c.l4 < 0) return alert('①②③에 모두 답해 주세요.'); ctx.save({ fmt: c }); } }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.fmt); if (!docs.length) return empty(); const n = docs.length;
        const l5 = [1, 2, 3, 4, 5].map(v => docs.filter(d => d.fmt.l5 === v).length), l4 = [1, 2, 3, 4].map(v => docs.filter(d => d.fmt.l4 === v).length);
        const agD = pct(docs.filter(d => d.fmt.d === 1).length, n), ag5 = pct(l5[3] + l5[4], n), ag4 = pct(l4[2] + l4[3], n);
        return stats([[n, '응답'], [agD + '%', '이분형 동의율'], [ag5 + '%', '5점 동의율(4–5)'], [ag4 + '%', '4점 동의율(3–4)'], [pct(l5[2], n) + '%', '5점의 “보통” 비율']]) +
          `<h4 class="sub-h">② 5점 리커트</h4>` + CH.hbars(l5.map((c, i) => ({ label: `${i + 1} ${LIK[i]}`, v: c, color: 'var(--c1)' })), { d: 0 }) + `<h4 class="sub-h">③ 4점</h4>` + CH.hbars(l4.map((c, i) => ({ label: ['전혀', '아니다', '그렇다', '매우'][i], v: c, color: 'var(--c4)' })), { d: 0 }) +
          `<h4 class="sub-h">④ 아날로그 0–100</h4>` + CH.hist(docs.map(d => d.fmt.v), { min: 0, max: 100, bins: 10, color: 'var(--c3)', xl: '점수', label: '아날로그 응답 분포' }) + note('이분형은 정보가 가장 적고, 5점은 “보통” 쪽으로 몰리는 경향이 있습니다. 중립을 없앤 4점은 입장을 강제합니다.'); }
    },
    {
      id: 'rev', title: '역채점을 빼먹으면 생기는 일', src: '교재 p.61–66', lead: 'TPI 12문항 중 6문항은 역문항입니다. 그룹 데이터로 역채점 전·후의 신뢰도를 비교합니다.', mods: ['inv'],
      out() { const n = INV.need(6); if (n) return n; const raw = INV.raw(), sc = INV.rows(); const a0 = ST.alpha(raw), a1 = ST.alpha(sc); const me = INV.mine();
        const rows = ITEMS.map((it, j) => [esc(it.s), it.R ? '역' : '', fx(ST.itemRest(raw, j), 2), fx(ST.itemRest(sc, j), 2)]);
        return stats([[fx(a0, 2), '역채점 없이 α', 'bad'], [fx(a1, 2), '역채점 후 α', a1 >= .7 ? 'good' : 'warn'], me ? [INV.sub(me.inv.r).T, '내 점수(역채점 후)'] : ['–', '내 점수'], me ? [ST.sum(me.inv.r), '역채점 안 한 합(오류)', 'bad'] : ['–', '']]) +
          table(['문항', '역', '문항-나머지 상관 (전)', '(후)'], rows.map(r => r.map((c, i) => i === 2 && +c < 0 ? `<span class="flag">${c}</span>` : c)), 'sm') + note('역문항을 뒤집지 않으면 긍정 문항과 상관이 음수가 되어 α가 급락합니다. 점수 해석도 완전히 달라집니다.'); }
    },
    {
      id: 'ips', title: '배분형(ipsative) vs 평정형(normative)', src: '교재 p.69–72', lead: '네 가지 일의 가치를 ① 100점으로 나눠 배분하고 ② 각각 1–5점으로 평정하세요.',
      input(el, ctx) { const m = ctx.my().ip || {}; const al = (m.al || [25, 25, 25, 25]).slice(), rt = (m.rt || [3, 3, 3, 3]).slice(); const left = h('b', {}, ''); const upd = () => { left.textContent = 100 - ST.sum(al); left.className = 100 - ST.sum(al) === 0 ? 'ok' : 'no'; }; upd();
        el.append(h('p', { class: 'sub-h' }, '① 100점 배분 (남은 점수: ', left, ')'), ...WV.map((v, i) => h('div', { class: 'field' }, h('label', {}, v, h('input', { type: 'number', min: 0, max: 100, value: al[i], oninput: e => { al[i] = +e.target.value || 0; upd(); } })))),
          h('p', { class: 'sub-h' }, '② 각 가치의 중요도 (1–5)'), ...WV.map((v, i) => h('div', { class: 'field' }, h('label', {}, v), chips('r' + i, ['1', '2', '3', '4', '5'], rt[i] - 1, j => rt[i] = j + 1))),
          h('button', { class: 'btn', onclick: () => { if (ST.sum(al) !== 100) return alert('배분 합계가 100이어야 합니다.'); ctx.save({ ip: { al, rt } }); } }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.ip); if (docs.length < 6) return docs.length ? stats([[docs.length, '응답']]) + empty('상관을 계산하려면 6명 이상이 필요합니다.') : empty();
        const mr = key => { const r = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) r.push(ST.corr(docs.map(d => d.ip[key][i]), docs.map(d => d.ip[key][j]))); return ST.mean(r.filter(x => !isNaN(x))); };
        const ri = mr('al'), rn = mr('rt');
        return stats([[docs.length, '응답'], [fx(ri, 2), 'ipsative 가치 간 평균 r', 'bad'], [fx(rn, 2), 'normative 가치 간 평균 r'], ['−0.33', '이론적 강제 상관(k=4)']]) +
          `<h4 class="sub-h">평균 배분 점수</h4>` + CH.hbars(WV.map((v, i) => ({ label: v, v: ST.mean(docs.map(d => d.ip.al[i])), color: 'var(--c3)' })), { max: 50, d: 1 }) + `<h4 class="sub-h">평균 평정 (1–5)</h4>` + CH.hbars(WV.map((v, i) => ({ label: v, v: ST.mean(docs.map(d => d.ip.rt[i])), color: 'var(--c1)' })), { max: 5, d: 2 }) +
          note('배분형은 한 가치를 올리면 다른 가치가 내려가야 하므로 상관이 인위적으로 음수가 됩니다. 요인분석·신뢰도 계산에는 부적합합니다.'); }
    },
    {
      id: 'guess', title: '추측 보정 점수 계산기', src: '교재 p.58–61', lead: '객관식 시험에서 추측을 보정한 점수 = 정답 수 − 오답 수 ÷ (선택지 수 − 1). 숫자를 바꿔 보고 오답 감점제에 대한 의견도 남기세요.',
      input(el, ctx) { const f = () => ctx.refresh(); el.append(sliderField('문항 수', 10, 100, 1, gc.N, v => { gc.N = v; f(); }), sliderField('정답 수 (R)', 0, 100, 1, gc.R, v => { gc.R = v; f(); }), sliderField('오답 수 (W)', 0, 100, 1, gc.W, v => { gc.W = v; f(); }), sliderField('선택지 수 (k)', 2, 6, 1, gc.k, v => { gc.k = v; f(); }),
        h('div', { class: 'field' }, h('label', {}, '오답 감점제 도입에 대한 내 입장'), chips('gp', ['찬성', '조건부', '반대'], ctx.my().gp ? ctx.my().gp.v : null, j => ctx.save({ gp: { v: j } })))); },
      out(ctx) { const N = gc.N, R = Math.min(gc.R, N), W = Math.min(gc.W, N - R), k = gc.k; const fs = R - W / (k - 1); const docs = ctx.docs().filter(d => d.gp);
        let html = stats([[fx(fs, 2), '보정 점수'], [N - R - W, '미응답 문항'], [fx(N / k, 1), '무작위 추측 기대 정답 수'], [fx(N / k - (N - N / k) / (k - 1) / 1, 1), '보정 후 기대 점수(=0)']]);
        if (docs.length) html += `<h4 class="sub-h">오답 감점제 입장 (${docs.length}명)</h4>` + stackBar(['찬성', '조건부', '반대'], [0, 1, 2].map(j => docs.filter(d => d.gp.v === j).length), ctx.my().gp ? ctx.my().gp.v : -1);
        return html + note('모르는 문항을 찍는 사람이 이득을 보는 문제를 줄이지만, 위험 회피 성향에 따라 점수가 달라지는 새로운 문제도 생깁니다.'); }
    }],
  demo(p, rng) { const x = 0.9 * p.t + 0.6 * ST.norm(rng); const a = ST.norm(rng); const w = [1, 1.2, 1, 1.1].map(b => Math.exp(0.45 * ST.norm(rng)) * b); const s = ST.sum(w); let al = w.map(v => Math.round(100 * v / s)); al[0] += 100 - ST.sum(al);
    return { fmt: { d: x > 0 ? 1 : 0, l5: ST.clamp(Math.round(3 + x), 1, 5), l4: ST.clamp(Math.round(2.5 + 0.9 * x), 1, 4), v: ST.clamp(Math.round(50 + 22 * x), 0, 100) }, ip: { al, rt: [0, 1, 2, 3].map(() => ST.clamp(Math.round(3.2 + 0.8 * a + 0.6 * ST.norm(rng)), 1, 5)) }, gp: { v: Math.floor(rng() * 3) } }; }
});

/* ================= 4. 표집 ================= */
const SAMP = ['단순무선', '층화', '군집', '편의', '할당', '눈덩이'];
let sampSeed = 1;
MG.add({
  id: 'm4', no: 4, short: '표집', title: '자료 수집: 표집과 선별', chap: 'Chapter 4', pages: '교재 p.77–90',
  sub: '검사 점수는 누구에게서 얻었느냐에 따라 달라집니다. 표본의 종류, 크기, 응답률과 결측을 다룹니다.',
  tocline: '표집 유형 · 표집분포 · 필요 표본 수 · 응답률과 결측',
  recap: ['<b>확률 표집</b>(단순무선·층화·군집)과 <b>비확률 표집</b>(편의·할당·눈덩이) (p.77–81, Table 4.1).', '표본 크기는 효과크기와 검정력에 따라 정해집니다 (Table 4.2–4.3, p.81–83).', '응답률이 낮거나 결측이 많으면 결과가 치우칩니다 (p.83–88).', '분석 전 자료 점검 (p.88–89).'],
  acts: [
    quiz({ id: 'samp', title: '이 표집은 어떤 방식일까', src: '교재 p.77–81', lead: '시나리오별 표집 방식을 고르세요.', opts: SAMP, items: [
      { q: '전 직원 명부에서 난수로 200명을 뽑았다.', short: '난수 200명', a: 0, why: '모든 사람이 같은 확률로 뽑힙니다.' },
      { q: '직급별 인원 비율에 맞춰 각 직급에서 무작위로 뽑았다.', short: '직급 비례', a: 1, why: '하위집단(층)별로 따로 뽑았습니다.' },
      { q: '전국 지점 중 5개 지점을 무작위로 골라 그 지점 직원 전원을 조사했다.', short: '지점 전수', a: 2, why: '집단 단위로 뽑았습니다.' },
      { q: '점심시간 식당 앞에서 만나는 사람들에게 설문을 부탁했다.', short: '식당 앞', a: 3, why: '접근하기 쉬운 사람만 대상이 됩니다.' },
      { q: '성별·연령 칸을 채울 때까지 비무작위로 모집했다.', short: '쿼터 채움', a: 4, why: '비율은 맞추지만 선택은 무작위가 아닙니다.' },
      { q: '응답자가 자기 동료를 소개해 표본이 늘어났다.', short: '동료 소개', a: 5, why: '소개를 따라 표본이 불어납니다.' }] }),
    {
      id: 'sdist', title: '표본이 작으면 얼마나 흔들릴까', src: '교재 p.6–7 · p.81–83', lead: '그룹의 TPI 총점을 모집단이라고 가정하고, 표본 크기 5·15·30으로 각 500번 뽑았을 때 표본평균의 분포를 봅니다.', mods: ['inv'],
      input(el, ctx) { el.append(h('p', { class: 'note' }, '표본평균의 표준편차(표준오차) ≈ 모집단 SD ÷ √n. 표본이 클수록 분포가 좁아집니다.'), h('button', { class: 'btn', onclick: () => { sampSeed++; ctx.done(); ctx.refresh(); } }, '다시 뽑기')); },
      out() { const n = INV.need(8); if (n) return n; const pop = INV.totals(); const mu = ST.mean(pop), sd = ST.sd(pop); let html = stats([[fx(mu, 1), '모집단 평균'], [fx(sd, 1), '모집단 SD']]);
        [5, 15, 30].forEach(k => { const rng = ST.rng(900 + k + sampSeed * 101); const ms = []; for (let t = 0; t < 500; t++) { let s = 0; for (let i = 0; i < k; i++) s += pop[Math.floor(rng() * pop.length)]; ms.push(s / k); }
          html += `<h4 class="sub-h">표본 크기 ${k} · 실제 SE ${fx(ST.sd(ms), 2)} (이론 ${fx(sd / Math.sqrt(k), 2)})</h4>` + CH.hist(ms, { min: Math.floor(mu - 2.5 * sd), max: Math.ceil(mu + 2.5 * sd), bins: 20, marks: [{ x: mu, label: '모집단 평균', dash: true }], xl: '표본평균', label: `표본 ${k}의 표본평균 분포` }); });
        return html; }
    },
    {
      id: 'ssz', title: '필요한 표본 수 맞히기', src: '교재 p.81–83 · Table 4.3', lead: '직원 3,000명 조직의 몰입도를 조사합니다. 95% 신뢰수준, 오차범위 ±5%p라면 최소 몇 명에게 응답받아야 할까요?',
      input(el, ctx) { const cur = ctx.my().ssz ? ctx.my().ssz.g : 300; let v = cur; el.append(sliderField('내 추정 인원', 20, 3000, 10, v, x => v = x, x => x + '명'), h('button', { class: 'btn', onclick: () => ctx.save({ ssz: { g: v } }) }, '제출')); },
      out(ctx) { const docs = ctx.docs().filter(d => d.ssz); if (!docs.length) return empty(); const n0 = 1.96 ** 2 * .25 / .05 ** 2, truth = Math.ceil(n0 / (1 + (n0 - 1) / 3000)); const me = ctx.my().ssz; const L = v => Math.log10(v);
        const near = docs.filter(d => Math.abs(d.ssz.g - truth) / truth <= .25).length;
        return stats([[docs.length, '응답'], [truth + '명', '정답 (유한모집단 보정)'], [pct(near, docs.length) + '%', '정답 ±25% 이내']]) + CH.strip(docs.map(d => ({ v: L(d.ssz.g), me: d.id === S.me.id, tip: `${d.name}: ${d.ssz.g}명` })), { min: L(20), max: L(3000), n: 3, fmt: t => Math.round(10 ** t).toLocaleString(), marks: [{ x: L(truth), label: '정답 ' + truth }], label: '표본 크기 추정 분포(로그 눈금)' }) +
          note(`n = 1.96² × 0.25 / 0.05² ≈ ${Math.round(n0)}, 모집단이 유한하므로 보정해 ${truth}명입니다. 상관 r=.30을 검정력 .80으로 잡아내려면 약 85명이 필요합니다(교재 Table 4.3 유형).`); }
    },
    {
      id: 'miss', title: '응답률과 결측 — 지금 우리 방은?', src: '교재 p.83–88', lead: '챕터별 응답 현황과, 응답이 빠졌을 때 처리 방법에 따라 결과가 어떻게 달라지는지 비교합니다.', wide: true, mods: ['inv', 'm1', 'm2', 'm3', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'],
      out() { const ids = new Set(); MG.mods.forEach(m => docsOf(m.id).forEach(d => ids.add(d.id))); const total = ids.size || 1;
        let html = `<h4 class="sub-h">챕터별 응답자 수 (방 전체 ${ids.size}명 기준)</h4>` + CH.hbars(MG.mods.filter(m => m.acts && m.acts.length).map(m => ({ label: `${m.no}. ${m.short}`, v: docsOf(m.id).length, txt: `${docsOf(m.id).length}명 · ${pct(docsOf(m.id).length, total)}%`, color: 'var(--c4)' })), { max: total, d: 0 });
        const n = INV.need(10); if (n) return html + n;
        const rows = INV.rows(); const rng = ST.rng(4242); const miss = rows.map(r => r.map(v => rng() < 0.2 ? null : v));
        const complete = miss.filter(r => !r.includes(null)); const colM = Array.from({ length: 12 }, (_, j) => ST.mean(miss.map(r => r[j]).filter(v => v != null)));
        const imp = miss.map(r => r.map((v, j) => v == null ? colM[j] : v)); const tot = rs => ST.mean(rs.map(r => ST.sum(r)));
        html += `<h4 class="sub-h">결측 20%(무작위)를 만들었을 때</h4>` + table(['처리 방법', '사용 인원', '평균 총점', 'α'], [['원자료(결측 없음)', rows.length, fx(tot(rows), 1), fx(ST.alpha(rows), 2)], ['목록삭제(결측 있는 사람 제외)', complete.length, complete.length ? fx(tot(complete), 1) : '–', complete.length > 3 ? fx(ST.alpha(complete), 2) : '–'], ['평균 대체', imp.length, fx(tot(imp), 1), fx(ST.alpha(imp), 2)]], 'sm');
        return html + note('목록삭제는 표본을 크게 줄이고, 평균 대체는 변산을 줄여 α를 부풀리거나 왜곡합니다. 결측이 무작위가 아니면(응답 거부가 특정 집단에 몰리면) 어떤 방법도 편향을 없애지 못합니다.'); }
    }],
  demo(p, rng) { const g = Math.round(ST.clamp(Math.exp(5.6 + 0.7 * ST.norm(rng)), 40, 3000)); return { samp: { c: [0, 1, 2, 3, 4, 5].map(a => rng() < 0.75 ? a : Math.floor(rng() * 6)) }, ssz: { g } }; }
});
