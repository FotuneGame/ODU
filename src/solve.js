import { makeGrid, gridPoints } from './helpers/grid.js';
import { distanceInf, normInf } from './helpers/vector.js';
import { makeReference } from './helpers/reference.js';

export function oneStep(step) {
  return (f, x, initial, h) => {
    const values = [initial];
    for (let i = 0; i < x.length - 1; i++) {
      values.push(step(f, x[i], values[i], h));
    }
    return values;
  };
}

function solveOnGrid(rhs, x, h, initial, reference, methods) {
  return Object.fromEntries(Object.entries(methods).map(([name, method]) => {
    let evaluations = 0;
    const f = (t, y) => {
      evaluations++;
      return rhs(t, y);
    };
    const values = method(f, x, initial, h);
    if (!values.every((row) => row.every(Number.isFinite))) {
      throw new Error(`Метод ${name} дал неконечное решение при h = ${h}`);
    }
    const absolute = values.map((y, i) => distanceInf(y, reference[i]));
    const relative = absolute.map((error, i) => {
      const norm = normInf(reference[i]);
      return norm === 0 ? null : error / norm;
    });
    const relativeValues = relative.filter((error) => error !== null);
    return [name, {
      evaluations, values, absolute, relative,
      maxAbsolute: Math.max(...absolute),
      maxRelative: relativeValues.length ? Math.max(...relativeValues) : null,
    }];
  }));
}

export function compareOde(rhs, { interval, initial, step }, methods, referenceOptions) {
  const coarse = makeGrid(interval, step);
  const fine = { ...coarse, step: coarse.step / 2, count: coarse.count * 2 };
  const xFine = gridPoints(fine);
  const reference = makeReference(rhs, xFine, initial, referenceOptions);
  const { values, ...referenceInfo } = reference;
  const grids = [coarse, fine].map(({ step: h, count }, index) => {
    const stride = index === 0 ? 2 : 1;
    const x = xFine.filter((_, i) => i % stride === 0);
    const yRef = values.filter((_, i) => i % stride === 0);
    return { h, count, x, reference: yRef, methods: solveOnGrid(rhs, x, h, initial, yRef, methods) };
  });

  const orders = Object.fromEntries(Object.keys(methods).map((id) => {
    const [coarseError, fineError] = grids.map((grid) => grid.methods[id].maxAbsolute);
    return [id, coarseError > 0 && fineError > 0 ? Math.log2(coarseError / fineError) : null];
  }));
  return { referenceInfo, grids, orders };
}
