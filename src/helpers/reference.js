import { distanceInf } from './vector.js';
import { rk4 } from '../methods/rungeKutta.js';

function sampleRk4(f, x, initial, substeps) {
  const values = [initial];
  let y = initial;
  const h = (x.at(-1) - x[0]) / ((x.length - 1) * substeps);

  for (let i = 0; i < x.length - 1; i++) {
    for (let j = 0; j < substeps; j++) {
      y = rk4(f, x[i] + j * h, y, h);
    }
    values.push(y);
  }
  return values;
}

export function makeReference(rhs, x, initial, { tolerance, maxRefinements }) {
  let evaluations = 0;
  const f = (t, y) => {
    evaluations++;
    return rhs(t, y);
  };
  let previous = sampleRk4(f, x, initial, 1);

  for (let refinement = 1; refinement <= maxRefinements; refinement++) {
    const substeps = 2 ** refinement;
    const values = sampleRk4(f, x, initial, substeps);
    const difference = Math.max(...values.map((y, i) => distanceInf(y, previous[i])));
    const estimate = difference / 15;
    if (Number.isFinite(estimate) && estimate <= tolerance) {
      const steps = (x.length - 1) * substeps;
      return { step: (x.at(-1) - x[0]) / steps, steps, estimate, evaluations, values };
    }
    previous = values;
  }
  throw new Error('Не достигнута заданная точность опорного расчёта РК4');
}
