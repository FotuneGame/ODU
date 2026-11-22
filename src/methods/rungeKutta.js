import { advance } from '../helpers/vector.js';

export const rk3Tableau = {
  c: [0, 1 / 2, 1],
  a: [[], [1 / 2], [-1, 2]],
  b: [1 / 6, 2 / 3, 1 / 6],
};

const rk4Tableau = {
  c: [0, 1 / 2, 1 / 2, 1],
  a: [[], [1 / 2], [0, 1 / 2], [0, 0, 1]],
  b: [1 / 6, 1 / 3, 1 / 3, 1 / 6],
};

function rungeKutta({ c, a, b }) {
  return (f, x, y, h, firstSlope = f(x, y)) => {
    const slopes = [firstSlope];
    for (let i = 1; i < c.length; i++) {
      slopes.push(f(x + c[i] * h, advance(y, h, a[i], slopes)));
    }
    return advance(y, h, b, slopes);
  };
}

export const rk3 = rungeKutta(rk3Tableau);
export const rk4 = rungeKutta(rk4Tableau);
