import { advance } from '../helpers/vector.js';
import { rk3, rk4 } from './rungeKutta.js';

function adamsBashforth(weights, start) {
  return (f, x, initial, h) => {
    const values = [initial];
    const slopes = [];

    for (let i = 0; i < x.length - 1; i++) {
      const y = values[i];
      const k1 = f(x[i], y);
      slopes.unshift(k1);
      if (slopes.length > weights.length) slopes.pop();
      const next = slopes.length < weights.length
        ? start(f, x[i], y, h, k1)
        : advance(y, h, weights, slopes);
      values.push(next);
    }
    return values;
  };
}

export const adams3 = adamsBashforth([23 / 12, -16 / 12, 5 / 12], rk3);
export const adams4 = adamsBashforth([55 / 24, -59 / 24, 37 / 24, -9 / 24], rk4);
