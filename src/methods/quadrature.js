import { gridPoints } from '../helpers/grid.js';

function sum(values) {
  let total = 0;
  let correction = 0;
  for (const value of values) {
    const term = value - correction;
    const next = total + term;
    correction = (next - total) - term;
    total = next;
  }
  return total;
}

export function quadrature(f, grid, exact) {
  const { step: h, count } = grid;
  const x = gridPoints(grid);
  const nodes = x.map(f);
  const middle = x.slice(0, -1).map((value) => f(value + h / 2));
  const rectangles = h * sum(middle);
  const trapezoids = h * sum(nodes.slice(1).map((right, i) => (nodes[i] + right) / 2));
  const simpson = h / 6 * sum(nodes.slice(1).map((right, i) => nodes[i] + 4 * middle[i] + right));

  return {
    step: h,
    intervals: count,
    methods: Object.fromEntries(Object.entries({ rectangles, trapezoids, simpson })
      .map(([id, value]) => {
        const absolute = Math.abs(value - exact);
        return [id, { value, absolute, relative: absolute / Math.abs(exact) }];
      })),
  };
}
