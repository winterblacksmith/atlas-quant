import {priceEuropeanOptions} from './options-engine.js?v=5a67011c12d5';

const $ = selector => document.querySelector(selector);
const dollars = value => value.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2});
const preciseDollars = value => value.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4});
const decimal = value => value.toFixed(4);

function cell(row, value) {
  const item = document.createElement('td');
  item.textContent = value;
  row.append(item);
}

function render(inputs, result) {
  $('#options-empty').hidden = true;
  $('#options-results').hidden = false;
  $('#call-price').textContent = dollars(result.call.price);
  $('#put-price').textContent = dollars(result.put.price);
  $('#parity').textContent = `Put–call parity residual: ${dollars(result.parityGap)}. Small differences come from the normal-CDF approximation.`;

  const measures = [
    ['Delta', value => decimal(value.delta)],
    ['Gamma', value => decimal(value.gamma)],
    ['Vega / 1 pp', value => preciseDollars(value.vega / 100)],
    ['Theta / day', value => preciseDollars(value.theta / 365)],
    ['Rho / 1 pp', value => preciseDollars(value.rho / 100)]
  ];
  $('#greeks').replaceChildren();
  for (const [name, format] of measures) {
    const row = document.createElement('tr');
    cell(row, name);
    cell(row, format(result.call));
    cell(row, format(result.put));
    $('#greeks').append(row);
  }

  $('#scenarios').replaceChildren();
  for (const change of [-0.2, -0.1, 0, 0.1, 0.2]) {
    const spot = inputs.spot * (1 + change);
    const scenario = priceEuropeanOptions({...inputs, spot});
    const row = document.createElement('tr');
    if (change === 0) row.className = 'base-scenario';
    cell(row, `${change > 0 ? '+' : ''}${Math.round(change * 100)}%${change === 0 ? ' · input' : ''}`);
    cell(row, dollars(spot));
    cell(row, dollars(scenario.call.price));
    cell(row, dollars(scenario.put.price));
    $('#scenarios').append(row);
  }
}

$('#options-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const inputs = {
      spot: Number($('#spot').value),
      strike: Number($('#strike').value),
      years: Number($('#years').value),
      rate: Number($('#rate').value) / 100,
      dividendYield: Number($('#dividend').value) / 100,
      volatility: Number($('#volatility').value) / 100
    };
    render(inputs, priceEuropeanOptions(inputs));
    $('#options-status').textContent = 'Calculated from the entered assumptions. No market quote was fetched.';
  } catch (error) {
    $('#options-status').textContent = error.message;
    $('#options-results').hidden = true;
    $('#options-empty').hidden = false;
  }
});

$('#options-form').requestSubmit();
