import { mkdirSync, writeFileSync } from 'node:fs';
import { readInput } from './helpers/input.js';
import { integrand, exactIntegral, scalarRhs, systemRhs } from './helpers/equations.js';
import { quadrature, euler, eulerCorrected, rk3, rk4, rk3Tableau, adams3, adams4 } from './methods/index.js';
import { compareOde, oneStep } from './solve.js';
import { generateChart } from './generateChart.js';

const { data: input, grids, scalarProblem } = readInput();
const integration = grids.map((grid) => quadrature(integrand, grid, exactIntegral));
const eulerMethods = { euler: oneStep(euler), corrected: oneStep(eulerCorrected) };
const scalarMethods = { ...eulerMethods, rk3: oneStep(rk3), adams3, adams4 };
const systemMethods = { ...eulerMethods, adams3, rk4: oneStep(rk4) };
const scalar = compareOde(scalarRhs, scalarProblem, scalarMethods, input.reference);
const system = compareOde(systemRhs, input.system, systemMethods, input.reference);

scalar.grids.forEach(({ methods }, i) => {
  const values = methods.adams3.values.map(([y], j) => Math.abs(y - methods.rk3.values[j][0]));
  scalar.grids[i].adams3VsRk3 = { values, max: Math.max(...values), last: values.at(-1) };
});

const methods = {
  rectangles: { name: 'Прямоугольники' },
  trapezoids: { name: 'Трапеции' },
  simpson: { name: 'Симпсон' },
  euler: { name: 'Эйлер', color: '#dc2626' },
  corrected: { name: 'Эйлер с коррекцией', color: '#d97706', dash: '7 3' },
  rk3: { name: 'Рунге–Кутта 3', color: '#16a34a', dash: '8 3' },
  adams3: { name: 'Адамс 3', color: '#7c3aed', dash: '3 3' },
  adams4: { name: 'Адамс 4', color: '#0891b2', dash: '11 3' },
  rk4: { name: 'Рунге–Кутта 4', color: '#2563eb' },
  reference: { name: 'Опорное РК4', color: '#222' },
};

console.log('=== ИНТЕГРАЛ ===');
console.log('Точное значение:', exactIntegral);
console.table(integration.flatMap(({ step, intervals, methods: rows }) =>
  Object.entries(rows).map(([id, { value, absolute, relative }]) => ({
    метод: methods[id].name, h: step, N: intervals, значение: value, 'абс.': absolute, 'отн.': relative,
  }))));

function printOde(title, result, referenceIndex) {
  console.log(title);
  console.log('Опорное РК4:', result.referenceInfo);
  for (const { h, count, x, reference, methods: rows, adams3VsRk3 } of result.grids) {
    console.log(`h = ${h}, N = ${count}, опорное значение при x = ${x.at(referenceIndex)}:`,
      reference.at(referenceIndex));
    console.table(Object.entries(rows).map(([id, row]) => ({
      метод: methods[id].name,
      'правых частей': row.evaluations,
      'решение в конце': row.values.at(-1).map((y) => y.toFixed(9)).join(', '),
      'max абс.': row.maxAbsolute.toExponential(5),
      'max отн.': row.maxRelative?.toExponential(5) ?? '—',
      порядок: result.orders[id]?.toFixed(3) ?? '—',
    })));
    if (adams3VsRk3) console.log('Максимум |Адамс 3 − РК3|:', adams3VsRk3.max);
  }
}

printOde('=== СКАЛЯРНОЕ ДУ ===', scalar, 0);
printOde('=== СИСТЕМА ДУ ===', system, -1);

const output = new URL('../output/', import.meta.url);
mkdirSync(output, { recursive: true });

function write(name, data) {
  writeFileSync(new URL(name, output), data, 'utf-8');
}

function plotSeries(grid, values, style) {
  return { ...style, values: grid.x.map((x, i) => ({ x, y: values[i] })) };
}

function errors(grid, key) {
  return Object.entries(grid.methods).map(([id, row]) => plotSeries(grid, row[key], methods[id]));
}

function writeOdeCharts(scalarGrid, systemGrid, suffix = '') {
  const stepLabel = (h) => suffix ? ` при h = ${h.toLocaleString('ru-RU', { maximumSignificantDigits: 12 })}` : '';
  const scalarStep = stepLabel(scalarGrid.h);
  const systemStep = stepLabel(systemGrid.h);

  const scalarSeries = Object.entries(scalarGrid.methods).map(([id, row]) =>
    plotSeries(scalarGrid, row.values.map(([y]) => y), methods[id]));
  write(`scalar_solution${suffix}.svg`, generateChart(`Решение скалярного ДУ${scalarStep}`, 'y(x)', [
    plotSeries(scalarGrid, scalarGrid.reference.map(([y]) => y), methods.reference),
    ...scalarSeries,
  ]));
  write(`scalar_absolute${suffix}.svg`, generateChart(`Абсолютная погрешность скалярного ДУ${scalarStep}`,
    'Абс. погрешность', errors(scalarGrid, 'absolute'), true));
  write(`scalar_relative${suffix}.svg`, generateChart(`Относительная погрешность скалярного ДУ${scalarStep}`,
    'Отн. погрешность', errors(scalarGrid, 'relative'), true));

  const components = ['y₁', 'y₂', 'y₃'].map((name, i) =>
    plotSeries(systemGrid, systemGrid.methods.rk4.values.map((y) => y[i]), {
      name, color: ['#2563eb', '#dc2626', '#16a34a'][i], dash: ['', '7 3', '3 3'][i],
    }));
  write(`system_solution${suffix}.svg`, generateChart(`Компоненты решения системы методом РК4${systemStep}`,
    'yᵢ(x)', components));
  write(`system_absolute${suffix}.svg`, generateChart(`Погрешность решения системы${systemStep}`,
    '‖Y − Y<tspan baseline-shift="sub" font-size="11">оп</tspan>‖<tspan baseline-shift="sub" font-size="11">∞</tspan>',
    errors(systemGrid, 'absolute'), true));
}

writeOdeCharts(scalar.grids[0], system.grids[0]);
writeOdeCharts(scalar.grids[1], system.grids[1], '_fine');
write('results.json', JSON.stringify({ input, exactIntegral, integration, rk3Tableau, scalar, system }, null, 2) + '\n');
