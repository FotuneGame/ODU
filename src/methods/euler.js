import { advance } from '../helpers/vector.js';

export function euler(f, x, y, h) {
  return advance(y, h, [1], [f(x, y)]);
}

export function eulerCorrected(f, x, y, h) {
  const k1 = f(x, y);
  const predictor = advance(y, h, [1], [k1]);
  const k2 = f(x + h, predictor);
  return advance(y, h, [1 / 2, 1 / 2], [k1, k2]);
}
