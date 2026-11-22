import { readFileSync } from 'node:fs';
import { makeGrid } from './grid.js';

export function readInput() {
  const data = JSON.parse(readFileSync(new URL('../../input/data.json', import.meta.url), 'utf-8'));
  const { variant, K, quadrature, scalar, system, reference } = data;

  if (variant !== 3 || !Number.isInteger(K) || K % 5 !== 0) {
    throw new Error('Реализован вариант 3 со схемой K mod 5 = 0');
  }
  if (quadrature.interval[0] !== 0 || quadrature.interval[1] !== Math.PI / 2 ||
      quadrature.steps.length === 0) {
    throw new Error('Для вычисления точного интеграла нужен отрезок [0, π/2]');
  }
  const grids = quadrature.steps.map((step) => makeGrid(quadrature.interval, step));
  const scalarProblem = { interval: [0, scalar.end], initial: scalar.initial, step: scalar.step };
  const problems = [[scalarProblem, 1, 4], [system, 3, 3]];
  for (const [{ interval, step, initial }, size, minCount] of problems) {
    if (makeGrid(interval, step).count < minCount || initial.length !== size ||
        !initial.every(Number.isFinite)) {
      throw new Error('Недопустимые начальные данные задачи Коши');
    }
  }
  if (!Number.isFinite(reference.tolerance) || reference.tolerance <= 0 ||
      !Number.isInteger(reference.maxRefinements) ||
      reference.maxRefinements < 1) {
    throw new Error('Недопустимые параметры опорного расчёта');
  }
  return { data, grids, scalarProblem };
}
