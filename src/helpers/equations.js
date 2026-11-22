export function integrand(x) {
  return Math.sin(Math.cos(x) ** 2) * Math.cos(Math.sin(x) ** 2);
}

export const exactIntegral = Math.PI * Math.sin(1) / 4;

export function scalarRhs(x, [y]) {
  return [Math.cos(x) / (x + 1) - 0.5 * y ** 2];
}

export function systemRhs(x, [y1, y2, y3]) {
  return [
    x * Math.exp(-(y1 + y2)),
    y1 * y2 * y3,
    Math.sin(x / (y1 ** 2 + 1)) * y2,
  ];
}
