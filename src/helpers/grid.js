export function makeGrid([a, b], step) {
  const count = Math.round((b - a) / step);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(step) ||
      b <= a || step <= 0 || !Number.isSafeInteger(count) || count < 1 ||
      Math.abs(count * step - (b - a)) > 1e-12 * (b - a)) {
    throw new Error('Шаг должен делить длину отрезка на целое число частей');
  }
  return { a, b, count, step: (b - a) / count };
}

export function gridPoints({ a, b, count, step }) {
  return Array.from({ length: count + 1 }, (_, i) => i === count ? b : a + i * step);
}
