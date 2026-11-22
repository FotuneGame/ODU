export function advance(y, h, weights, slopes) {
  return y.map((value, j) => {
    let increment = 0;
    for (let i = 0; i < weights.length; i++) increment += weights[i] * slopes[i][j];
    return value + h * increment;
  });
}

export function normInf(values) {
  return Math.max(...values.map(Math.abs));
}

export function distanceInf(left, right) {
  return normInf(left.map((value, i) => value - right[i]));
}
