/* MindGauge · 심리측정 계산 모듈 (교재 Ch.1–10의 공식들) */
const ST = {};
ST.sum = a => a.reduce((x, y) => x + y, 0);
ST.mean = a => a.length ? ST.sum(a) / a.length : NaN;
ST.vari = a => { if (a.length < 2) return NaN; const m = ST.mean(a); return ST.sum(a.map(x => (x - m) ** 2)) / (a.length - 1); };
ST.sd = a => Math.sqrt(ST.vari(a));
ST.corr = (x, y) => {
  const n = x.length; if (n < 3) return NaN;
  const mx = ST.mean(x), my = ST.mean(y); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx * syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
};
ST.erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
ST.cdf = z => 0.5 * (1 + ST.erf(z / Math.SQRT2));
ST.pdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
ST.stanine = z => Math.max(1, Math.min(9, Math.round(2 * z + 5)));
ST.rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
ST.norm = r => { let u = 0, v = 0; while (!u) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
ST.hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
ST.clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* Cronbach's alpha: rows = 응답자 × 문항 */
ST.alpha = rows => {
  const n = rows.length; if (n < 3) return NaN; const k = rows[0].length;
  const iv = ST.sum(Array.from({ length: k }, (_, j) => ST.vari(rows.map(r => r[j]))));
  const tv = ST.vari(rows.map(r => ST.sum(r)));
  return tv > 0 ? (k / (k - 1)) * (1 - iv / tv) : NaN;
};
ST.itemRest = (rows, j) => ST.corr(rows.map(r => r[j]), rows.map(r => ST.sum(r) - r[j]));
ST.alphaIfDeleted = (rows, j) => ST.alpha(rows.map(r => r.filter((_, i) => i !== j)));
ST.sb = (r, factor) => (factor * r) / (1 + (factor - 1) * r);
ST.sbItems = (rel, k, target) => Math.ceil(k * (target * (1 - rel)) / (rel * (1 - target)));

/* 대칭행렬 고유분해 (Jacobi) */
ST.eig = M => {
  const n = M.length; const A = M.map(r => r.slice()); const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2; if (off < 1e-12) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-14) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = [...Array(n).keys()].sort((a, b) => A[b][b] - A[a][a]);
  return { values: idx.map(i => A[i][i]), vectors: idx.map(i => V.map(r => r[i])) };
};
ST.corrMatrix = rows => { const k = rows[0].length; const cols = Array.from({ length: k }, (_, j) => rows.map(r => r[j]));
  return cols.map(a => cols.map(b => ST.corr(a, b))); };
ST.pca = rows => {
  const R = ST.corrMatrix(rows).map(r => r.map(v => isNaN(v) ? 0 : v));
  const { values, vectors } = ST.eig(R);
  const loadings = vectors.map((v, c) => { const l = v.map(x => x * Math.sqrt(Math.max(values[c], 0)));
    const s = ST.sum(l) < 0 ? -1 : 1; return l.map(x => x * s); });
  return { R, values, loadings };
};

/* 2PL 로지스틱 적합 (IRT 근사): P(θ)=1/(1+exp(-a(θ-b))) */
ST.fit2pl = (th, y) => {
  let a = 1, c = 0; const lam = 0.08;
  for (let it = 0; it < 40; it++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (let i = 0; i < th.length; i++) { const p = 1 / (1 + Math.exp(-(a * th[i] + c))); const w = p * (1 - p) + 1e-6, e = y[i] - p;
      g0 += e; g1 += e * th[i]; h00 += w; h01 += w * th[i]; h11 += w * th[i] * th[i]; }
    g0 -= lam * c; g1 -= lam * (a - 1); h00 += lam; h11 += lam;
    const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-9) break;
    const dc = (g0 * h11 - g1 * h01) / det, da = (g1 * h00 - g0 * h01) / det;
    c += dc; a += da; a = ST.clamp(a, 0.2, 3.5); c = ST.clamp(c, -8, 8); if (Math.abs(da) + Math.abs(dc) < 1e-6) break;
  }
  return { a, b: -c / a };
};
ST.icc = M => { /* M: 대상(행) × 평정자(열), 이원 확률효과 절대일치 */
  const n = M.length, k = M[0].length; const gm = ST.mean(M.flat());
  const rm = M.map(r => ST.mean(r)); const cm = Array.from({ length: k }, (_, j) => ST.mean(M.map(r => r[j])));
  const msr = k * ST.sum(rm.map(m => (m - gm) ** 2)) / (n - 1);
  const msc = n * ST.sum(cm.map(m => (m - gm) ** 2)) / (k - 1);
  let sse = 0; for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) sse += (M[i][j] - rm[i] - cm[j] + gm) ** 2;
  const mse = sse / ((n - 1) * (k - 1));
  return { single: (msr - mse) / (msr + (k - 1) * mse + k * (msc - mse) / n), avg: (msr - mse) / (msr + (msc - mse) / n) };
};
ST.ranks = a => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); let i = 0;
  while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const rk = (i + j) / 2 + 1; for (let t = i; t <= j; t++) r[idx[t][1]] = rk; i = j + 1; } return r; };
ST.kendallW = M => { /* M: 평정자(행) × 대상(열) */
  const m = M.length, n = M[0].length; const R = M.map(r => ST.ranks(r));
  const Rj = Array.from({ length: n }, (_, j) => ST.sum(R.map(r => r[j]))); const mr = ST.mean(Rj);
  const S = ST.sum(Rj.map(x => (x - mr) ** 2));
  let T = 0; for (const r of M) { const cnt = {}; r.forEach(v => cnt[v] = (cnt[v] || 0) + 1); T += ST.sum(Object.values(cnt).map(t => t ** 3 - t)); }
  const den = m * m * (n ** 3 - n) - m * T; return den > 0 ? 12 * S / den : NaN;
};
ST.kappa = (a, b) => { const n = a.length; let ag = 0, a1 = 0, b1 = 0; for (let i = 0; i < n; i++) { if (a[i] === b[i]) ag++; a1 += a[i]; b1 += b[i]; }
  const po = ag / n, pe = (a1 / n) * (b1 / n) + (1 - a1 / n) * (1 - b1 / n); return pe === 1 ? 1 : (po - pe) / (1 - pe); };
ST.rwg = (vals, A = 5) => { const v = ST.vari(vals); const e = (A * A - 1) / 12; return ST.clamp(1 - v / e, 0, 1); };
ST.fmt = (x, d = 2) => (x == null || isNaN(x)) ? '–' : (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
