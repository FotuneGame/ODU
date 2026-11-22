import { extent } from 'd3-array';
import { scaleLinear, scaleLog } from 'd3-scale';
import { line } from 'd3-shape';

export function generateChart(title, yLabel, series, logarithmic = false) {
  const width = 900;
  const plot = { left: 86, right: 878, top: 49, bottom: 226 };
  const legendRows = Math.ceil(series.length / 3);
  const height = 275 + legendRows * 22;
  const points = series.flatMap(({ values }) => values);
  const valid = ({ y }) => Number.isFinite(y) && (!logarithmic || y > 0);
  const x = scaleLinear(extent(points, (p) => p.x), [plot.left, plot.right]).nice();
  const [min, max] = extent(points.filter(valid), (p) => p.y);
  const [lo, hi] = min === undefined ? [0.1, 1] : [min, max];
  const y = (logarithmic ? scaleLog() : scaleLinear())
    .domain(lo === hi ? [lo - (Math.abs(lo) || 1) / 2, hi + (Math.abs(hi) || 1) / 2] : [lo, hi])
    .range([plot.bottom, plot.top]).nice();
  const curve = line().defined(valid).x((p) => x(p.x)).y((p) => y(p.y));

  const xt = x.tickFormat(6);
  const yt = y.tickFormat(5);
  const powers = (n) => Math.abs(Math.log10(n) - Math.round(Math.log10(n))) < 1e-8;
  const xGrid = x.ticks(6).map((tick) => {
    const px = x(tick);
    return `<path d="M${px} ${plot.top}V${plot.bottom}"/>
    <text x="${px}" y="246" text-anchor="middle">${xt(tick)}</text>`;
  });
  const yGrid = y.ticks(6).filter((tick) => !logarithmic || powers(tick)).map((tick) => {
    const py = y(tick);
    return `<path d="M${plot.left} ${py}H${plot.right}"/>
    <text x="77" y="${py + 5}" text-anchor="end">${logarithmic ? tick.toExponential(0) : yt(tick)}</text>`;
  });

  const dashAttr = (dash) => dash ? ` stroke-dasharray="${dash}"` : '';
  const curves = series.map(({ values, color, dash }) =>
    `<path d="${curve(values) ?? ''}" fill="none" stroke="${color}" stroke-width="2.6"${dashAttr(dash)}/>`);
  const legends = series.map(({ name, color, dash }, i) => {
    const left = 98 + (i % 3) * 258;
    const top = 283 + Math.floor(i / 3) * 22;
    return `<path d="M${left} ${top}h28" stroke="${color}" stroke-width="2.6"${dashAttr(dash)}/>
    <text x="${left + 37}" y="${top + 5}">${name}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/>
<g font-family="Arial, sans-serif" fill="#222" font-size="16">
<text x="450" y="28" text-anchor="middle" font-size="22" font-weight="bold">${title}</text>
<g stroke="#ddd"><style>text { stroke: none; }</style>
${xGrid.join('\n')}
${yGrid.join('\n')}
</g>
<path d="M${plot.left} ${plot.top}V${plot.bottom}H${plot.right}" fill="none" stroke="#444"/>
<text x="482" y="265" text-anchor="middle">x</text>
<text x="24" y="138" text-anchor="middle" transform="rotate(-90 24 138)">${yLabel}</text>
${curves.join('\n')}
${legends.join('\n')}
</g>
</svg>
`;
}
