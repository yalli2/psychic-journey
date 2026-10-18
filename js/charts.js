/* MindGauge charts: 의존성 없는 SVG/HTML 차트 */
const CH = {};
const C = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];
const sx = (v, a, b, x0, x1) => x0 + (v - a) / (b - a || 1) * (x1 - x0);
function ticks(a, b, n = 5) { const step = (b - a) / n; return Array.from({ length: n + 1 }, (_, i) => a + step * i); }
function svg(w, hgt, inner, label) { return `<svg class="chart" viewBox="0 0 ${w} ${hgt}" role="img" aria-label="${esc(label || '차트')}">${inner}</svg>`; }
function axisX(x0, x1, y, a, b, n, fmt, label) {
  return ticks(a, b, n).map(t => { const x = sx(t, a, b, x0, x1); return `<line x1="${x}" x2="${x}" y1="${y}" y2="${y + 4}" class="ax"/><text x="${x}" y="${y + 16}" class="tk" text-anchor="middle">${fmt ? fmt(t) : fx(t, 0)}</text>`; }).join('') +
    `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" class="ax"/>` + (label ? `<text x="${(x0 + x1) / 2}" y="${y + 32}" class="lb" text-anchor="middle">${esc(label)}</text>` : '');
}
function axisY(x, y0, y1, a, b, n, fmt, label) {
  return ticks(a, b, n).map(t => { const y = sx(t, a, b, y0, y1); return `<line x1="${x - 4}" x2="${x}" y1="${y}" y2="${y}" class="ax"/><text x="${x - 7}" y="${y + 4}" class="tk" text-anchor="end">${fmt ? fmt(t) : fx(t, 0)}</text>`; }).join('') +
    `<line x1="${x}" x2="${x}" y1="${y0}" y2="${y1}" class="ax"/>` + (label ? `<text transform="translate(12 ${(y0 + y1) / 2}) rotate(-90)" class="lb" text-anchor="middle">${esc(label)}</text>` : '');
}
/* 격자는 plot 영역으로만 제한 */
function grid(x0, x1, y0, y1, a, b, n) { return ticks(a, b, n).map(t => { const y = sx(t, a, b, y0, y1); return `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" class="gr"/>`; }).join(''); }

/* 가로 막대 */
CH.hbars = (items, o = {}) => {
  const max = o.max ?? Math.max(...items.map(i => i.v), 1e-9);
  return `<div class="bars">${items.map(i => `<div class="bar-row" title="${esc(i.tip || i.label + ': ' + fx(i.v, o.d ?? 1))}"><div class="bar-lab">${esc(i.label)}</div><div class="bar-track">${o.ref != null ? `<u style="left:${o.ref / max * 100}%" title="${esc(o.refLabel || '')}"></u>` : ''}<i style="width:${Math.max(0, i.v) / max * 100}%;background:${i.color || 'var(--c1)'}"></i></div><div class="bar-val">${i.txt ?? fx(i.v, o.d ?? 1)}${i.mark ? ` <em>${i.mark}</em>` : ''}</div></div>`).join('')}</div>`;
};
/* 히스토그램 (+정규곡선, 내 위치) */
CH.hist = (vals, o = {}) => {
  const W = 560, H = 230, L = 40, R = 14, T = 14, B = 44; const min = o.min, max = o.max, bins = o.bins || 10;
  const bw = (max - min) / bins; const cnt = Array(bins).fill(0); vals.forEach(v => { const k = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / bw))); cnt[k]++; });
  const ymax = Math.max(...cnt, 3) * 1.15; let s = grid(L, W - R, H - B, T, 0, ymax, 4);
  cnt.forEach((c, i) => { const x = sx(min + i * bw, min, max, L, W - R), x2 = sx(min + (i + 1) * bw, min, max, L, W - R); const y = sx(c, 0, ymax, H - B, T);
    s += `<rect x="${x + 1}" y="${y}" width="${Math.max(1, x2 - x - 2)}" height="${H - B - y}" rx="3" fill="${o.color || 'var(--c1)'}" opacity=".85"><title>${fx(min + i * bw, 0)}–${fx(min + (i + 1) * bw, 0)}: ${c}명</title></rect>`; });
  if (o.curve && o.curve.sd > 0) { const pts = []; for (let i = 0; i <= 80; i++) { const v = min + (max - min) * i / 80; const y = vals.length * bw * ST.pdf((v - o.curve.mean) / o.curve.sd) / o.curve.sd; pts.push(`${sx(v, min, max, L, W - R)},${sx(y, 0, ymax, H - B, T)}`); }
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--c3)" stroke-width="2"/>`; }
  (o.marks || []).forEach(m => { const x = sx(m.x, min, max, L, W - R); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="${m.color || 'var(--ink)'}" stroke-width="2" ${m.dash ? 'stroke-dasharray="5 4"' : ''}/><text x="${x}" y="${T + 10}" class="tk" text-anchor="${x > W - 80 ? 'end' : 'start'}" dx="${x > W - 80 ? -4 : 4}" font-weight="600">${esc(m.label)}</text>`; });
  s += axisY(L, H - B, T, 0, ymax, 4, v => fx(v, 0), '인원') + axisX(L, W - R, H - B, min, max, Math.min(bins, 8), o.fmt, o.xl);
  return svg(W, H, s, o.label || '히스토그램');
};
/* 산점도 */
CH.scatter = (pts, o = {}) => {
  const W = 560, H = 320, L = 44, R = 16, T = 14, B = 44; const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xmin = o.xmin ?? Math.floor(Math.min(...xs)), xmax = o.xmax ?? Math.ceil(Math.max(...xs)), ymin = o.ymin ?? Math.floor(Math.min(...ys)), ymax = o.ymax ?? Math.ceil(Math.max(...ys));
  let s = grid(L, W - R, H - B, T, ymin, ymax, 5);
  if (o.band) s += `<rect x="${sx(o.band.x0, xmin, xmax, L, W - R)}" y="${T}" width="${sx(o.band.x1, xmin, xmax, L, W - R) - sx(o.band.x0, xmin, xmax, L, W - R)}" height="${H - B - T}" fill="var(--c4)" opacity=".13"/>`;
  (o.vlines || []).forEach(v => { const x = sx(v.x, xmin, xmax, L, W - R); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="var(--ink)" stroke-dasharray="5 4"/><text x="${x + 4}" y="${T + 10}" class="tk">${esc(v.label)}</text>`; });
  if (o.fit && pts.length > 3) { const mx = ST.mean(xs), my = ST.mean(ys); let sxy = 0, sxx = 0; pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }); const b = sxy / sxx, a = my - b * mx;
    s += `<line x1="${sx(xmin, xmin, xmax, L, W - R)}" y1="${sx(a + b * xmin, ymin, ymax, H - B, T)}" x2="${sx(xmax, xmin, xmax, L, W - R)}" y2="${sx(a + b * xmax, ymin, ymax, H - B, T)}" stroke="var(--c3)" stroke-width="2"/>`; }
  if (o.ident) s += `<line x1="${sx(xmin, xmin, xmax, L, W - R)}" y1="${sx(xmin, ymin, ymax, H - B, T)}" x2="${sx(xmax, xmin, xmax, L, W - R)}" y2="${sx(xmax, ymin, ymax, H - B, T)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
  pts.forEach(p => { const me = p.me; s += `<circle cx="${sx(p.x, xmin, xmax, L, W - R)}" cy="${sx(p.y, ymin, ymax, H - B, T)}" r="${me ? 7 : 4.5}" fill="${p.color || (me ? 'var(--c2)' : 'var(--c1)')}" fill-opacity="${me ? 1 : .62}" stroke="var(--surface)" stroke-width="${me ? 2 : 1.2}"><title>${esc(p.tip || (p.name ? p.name + ': ' : '') + fx(p.x, 1) + ', ' + fx(p.y, 1))}</title></circle>`; });
  s += axisY(L, H - B, T, ymin, ymax, 5, o.fy, o.yl) + axisX(L, W - R, H - B, xmin, xmax, 6, o.fx, o.xl);
  return svg(W, H, s, o.label || '산점도');
};
/* 꺾은선 */
CH.lines = (series, o = {}) => {
  const W = 560, H = o.h || 280, L = 46, R = 16, T = 14, B = 44; const { xmin, xmax, ymin, ymax } = o;
  let s = grid(L, W - R, H - B, T, ymin, ymax, o.ny || 4);
  (o.bands || []).forEach(b => { s += `<rect x="${sx(b.x0, xmin, xmax, L, W - R)}" y="${T}" width="${sx(b.x1, xmin, xmax, L, W - R) - sx(b.x0, xmin, xmax, L, W - R)}" height="${H - B - T}" fill="var(--c4)" opacity=".14"><title>${esc(b.label || '')}</title></rect>`; });
  (o.hlines || []).forEach(l => { const y = sx(l.y, ymin, ymax, H - B, T); s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--muted)" stroke-dasharray="5 4"/><text x="${W - R - 2}" y="${y - 4}" class="tk" text-anchor="end">${esc(l.label)}</text>`; });
  (o.vlines || []).forEach(l => { const x = sx(l.x, xmin, xmax, L, W - R); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="${l.color || 'var(--ink)'}" stroke-dasharray="5 4"/><text x="${x + 4}" y="${T + 10}" class="tk">${esc(l.label)}</text>`; });
  series.forEach((se, i) => { const col = se.color || C[i % 4]; const pts = se.pts.filter(p => p[1] != null && !isNaN(p[1]));
    s += `<polyline fill="none" stroke="${col}" stroke-width="2.4" ${se.dash ? 'stroke-dasharray="6 4"' : ''} stroke-linejoin="round" points="${pts.map(p => `${sx(p[0], xmin, xmax, L, W - R)},${sx(p[1], ymin, ymax, H - B, T)}`).join(' ')}"/>`;
    if (se.dots) pts.forEach(p => s += `<circle cx="${sx(p[0], xmin, xmax, L, W - R)}" cy="${sx(p[1], ymin, ymax, H - B, T)}" r="4.5" fill="${col}" stroke="var(--surface)" stroke-width="1.5"><title>${esc(se.name)}: ${fx(p[0], 1)}, ${fx(p[1], 2)}</title></circle>`);
    const last = pts[pts.length - 1]; if (last && series.length > 1 && o.direct !== false) s += `<text x="${Math.min(W - R - 4, sx(last[0], xmin, xmax, L, W - R) + 6)}" y="${sx(last[1], ymin, ymax, H - B, T) + 4}" class="tk" text-anchor="${sx(last[0], xmin, xmax, L, W - R) > W - 90 ? 'end' : 'start'}" font-weight="600">${esc(se.name)}</text>`; });
  s += axisY(L, H - B, T, ymin, ymax, o.ny || 4, o.fy, o.yl) + axisX(L, W - R, H - B, xmin, xmax, o.nx || 6, o.fx, o.xl);
  return svg(W, H, s, o.label || '선 그래프') + (series.length > 1 ? CH.legend(series.map((x, i) => [x.name, x.color || C[i % 4], x.dash])) : '');
};
CH.legend = items => `<div class="legend">${items.map(([n, c, d]) => `<span><s style="background:${d ? 'transparent' : c};${d ? `border-top:3px dashed ${c};height:0` : ''}"></s>${esc(n)}</span>`).join('')}</div>`;
/* 스트립(점) 플롯: 한 줄에 값 분포 */
CH.strip = (vals, o = {}) => {
  const W = 560, H = o.h || 96, L = 14, R = 14; const { min, max } = o; const mid = H / 2 - 6; let s = '';
  s += `<line x1="${L}" x2="${W - R}" y1="${H - 26}" y2="${H - 26}" class="ax"/>` + ticks(min, max, o.n || 4).map(t => `<line x1="${sx(t, min, max, L, W - R)}" x2="${sx(t, min, max, L, W - R)}" y1="${H - 26}" y2="${H - 21}" class="ax"/><text x="${sx(t, min, max, L, W - R)}" y="${H - 8}" class="tk" text-anchor="middle">${o.fmt ? o.fmt(t) : fx(t, 1)}</text>`).join('');
  const buckets = {}; vals.forEach((v, i) => { const x = sx(v.v ?? v, min, max, L, W - R); const k = Math.round(x / 9); const c = buckets[k] = (buckets[k] || 0) + 1;
    s += `<circle cx="${x}" cy="${H - 36 - (c - 1) * 9}" r="4.2" fill="${v.me ? 'var(--c2)' : 'var(--c1)'}" fill-opacity="${v.me ? 1 : .6}" stroke="var(--surface)" stroke-width="1"><title>${esc(v.tip || fx(v.v ?? v, 2))}</title></circle>`; });
  (o.marks || []).forEach(m => { const x = sx(m.x, min, max, L, W - R); s += `<line x1="${x}" x2="${x}" y1="6" y2="${H - 26}" stroke="${m.color || 'var(--c3)'}" stroke-width="2.2"/><text x="${x}" y="14" class="tk" font-weight="600" text-anchor="${x > W - 70 ? 'end' : 'start'}" dx="${x > W - 70 ? -4 : 4}">${esc(m.label)}</text>`; });
  return svg(W, H, s, o.label || '점 분포');
};
/* 히트맵 */
CH.heat = (M, rl, cl, o = {}) => {
  const n = M.length, m = M[0].length, cs = o.cs || 36, L = o.L || 56, T = 40, W = L + m * cs + 10, H = T + n * cs + 10; let s = '';
  cl.forEach((c, j) => s += `<text x="${L + j * cs + cs / 2}" y="${T - 8}" class="tk" text-anchor="middle" font-weight="600">${esc(c)}</text>`);
  M.forEach((r, i) => { s += `<text x="${L - 8}" y="${T + i * cs + cs / 2 + 4}" class="tk" text-anchor="end" font-weight="600">${esc(rl[i])}</text>`;
    r.forEach((v, j) => { const a = isNaN(v) ? 0 : Math.min(1, Math.abs(v) / (o.scale || 1)); const col = v >= 0 ? 'var(--c1)' : 'var(--c3)';
      s += `<rect x="${L + j * cs + 1}" y="${T + i * cs + 1}" width="${cs - 2}" height="${cs - 2}" rx="4" fill="${col}" fill-opacity="${(a * .9).toFixed(2)}" ${o.box && o.box(i, j) ? 'stroke="var(--ink)" stroke-width="2.4"' : ''}><title>${esc(rl[i])} × ${esc(cl[j])}: ${fx(v, 2)}</title></rect>` +
        (cs >= 30 ? `<text x="${L + j * cs + cs / 2}" y="${T + i * cs + cs / 2 + 4}" class="cell" text-anchor="middle" style="fill:${a > .55 ? '#fff' : 'var(--ink)'}">${isNaN(v) ? '–' : (o.dec === 0 ? Math.round(v) : fx(v, 2).replace('0.', '.').replace('-0.', '-.'))}</text>` : ''); }); });
  return svg(W, H, s, o.label || '상관 히트맵');
};
/* 레이더 */
CH.radar = (axes, series, max = 5, size = 340) => {
  const c = size / 2, Rr = size * 0.34, n = axes.length; const pt = (i, v) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; const r = Rr * v / max; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  let s = [1, 2, 3, 4, 5].map(k => `<polygon points="${axes.map((_, i) => pt(i, max * k / 5).join(',')).join(' ')}" fill="none" class="gr"/>`).join('');
  axes.forEach((a, i) => { const [x, y] = pt(i, max * 1.13); s += `<line x1="${c}" y1="${c}" x2="${pt(i, max)[0]}" y2="${pt(i, max)[1]}" class="gr"/><text x="${x}" y="${y + 4}" class="tk" text-anchor="${Math.abs(x - c) < 6 ? 'middle' : x > c ? 'start' : 'end'}" font-weight="600">${esc(a)}</text>`; });
  series.forEach((se, k) => { const col = se.color || C[k % 4]; s += `<polygon points="${se.v.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="${col}" fill-opacity=".14" stroke="${col}" stroke-width="2.2" ${se.dash ? 'stroke-dasharray="6 4"' : ''}/>` + se.v.map((v, i) => `<circle cx="${pt(i, v)[0]}" cy="${pt(i, v)[1]}" r="3.5" fill="${col}"><title>${esc(se.name)} · ${esc(axes[i])}: ${fx(v, 2)}</title></circle>`).join(''); });
  return svg(size + 80, size, `<g transform="translate(40 0)">${s}</g>`, '레이더 차트') + CH.legend(series.map((x, i) => [x.name, x.color || C[i % 4], x.dash]));
};
/* 정규분포 곡선 (교재 Fig 1.1/1.3) */
CH.normal = (o = {}) => {
  const W = 560, H = 250, L = 20, R = 20, T = 20, B = 62; const zmin = -3.5, zmax = 3.5; const ymax = 0.42;
  const X = z => sx(z, zmin, zmax, L, W - R), Y = y => sx(y, 0, ymax, H - B, T);
  const pts = []; for (let i = 0; i <= 140; i++) { const z = zmin + (zmax - zmin) * i / 140; pts.push([X(z), Y(ST.pdf(z))]); }
  let s = `<polygon points="${X(zmin)},${H - B} ${pts.map(p => p.join(',')).join(' ')} ${X(zmax)},${H - B}" fill="var(--c1)" fill-opacity=".1"/><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--c1)" stroke-width="2.4"/>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="ax"/>`;
  [-3, -2, -1, 0, 1, 2, 3].forEach(z => { const x = X(z); s += `<line x1="${x}" x2="${x}" y1="${Y(ST.pdf(z))}" y2="${H - B}" class="gr"/><text x="${x}" y="${H - B + 15}" class="tk" text-anchor="middle">${z}</text><text x="${x}" y="${H - B + 30}" class="tk" text-anchor="middle" fill="var(--muted)">${50 + 10 * z}</text><text x="${x}" y="${H - B + 45}" class="tk" text-anchor="middle" fill="var(--muted)">${fx(ST.cdf(z) * 100, 0)}%</text>`; });
  s += `<text x="${L}" y="${H - B + 15}" class="lb">z</text><text x="${L}" y="${H - B + 30}" class="lb">T</text><text x="${L}" y="${H - B + 45}" class="lb">%ile</text>`;
  (o.dots || []).forEach((d, i) => { const z = ST.clamp(d.z, zmin + .1, zmax - .1); const x = X(z); const y = H - B - 8 - (d.row || 0) * 9;
    s += `<circle cx="${x}" cy="${y}" r="${d.me ? 6.5 : 3.6}" fill="${d.me ? 'var(--c2)' : 'var(--c1)'}" fill-opacity="${d.me ? 1 : .55}" stroke="var(--surface)" stroke-width="1.2"><title>${esc(d.tip || '')}</title></circle>`; });
  if (o.mark != null) { const x = X(ST.clamp(o.mark, zmin, zmax)); s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" stroke="var(--c2)" stroke-width="2.2"/><text x="${x}" y="${T + 4}" class="tk" font-weight="700" text-anchor="${x > W - 90 ? 'end' : 'start'}" dx="${x > W - 90 ? -5 : 5}">${esc(o.markLabel || '나')}</text>`; }
  return svg(W, H, s, '정규분포');
};
CH.gauge = (v, min, max, o = {}) => { /* 가로 눈금자 위 값+구간 */
  const W = 560, H = 78, L = 16, R = 16; const X = t => sx(t, min, max, L, W - R); let s = `<rect x="${L}" y="30" width="${W - L - R}" height="14" rx="7" fill="var(--line)"/>`;
  if (o.ci) s += `<rect x="${X(o.ci[0])}" y="26" width="${Math.max(2, X(o.ci[1]) - X(o.ci[0]))}" height="22" rx="6" fill="var(--c1)" fill-opacity=".28"><title>95% 신뢰구간 ${fx(o.ci[0], 1)}–${fx(o.ci[1], 1)}</title></rect>`;
  s += ticks(min, max, o.n || 6).map(t => `<line x1="${X(t)}" x2="${X(t)}" y1="44" y2="52" class="ax"/><text x="${X(t)}" y="66" class="tk" text-anchor="middle">${fx(t, 0)}</text>`).join('');
  (o.marks || []).forEach(m => s += `<line x1="${X(m.x)}" x2="${X(m.x)}" y1="18" y2="48" stroke="${m.color}" stroke-width="2.4"/><text x="${X(m.x)}" y="12" class="tk" font-weight="700" text-anchor="middle">${esc(m.label)}</text>`);
  s += `<circle cx="${X(v)}" cy="37" r="8" fill="var(--c2)" stroke="var(--surface)" stroke-width="2.4"/>`;
  return svg(W, H, s, '눈금자');
};
