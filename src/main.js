import './fonts/ys-display/fonts.css';
import './style.css';

import { data as sourceData } from './data/dataset_1.js';
import { initData } from './data.js';
import { processFormData } from './lib/utils.js';
import { initTable } from './components/table.js';
import { initSearching } from './components/searching.js';
import { initFiltering } from './components/filtering.js';
import { initSorting } from './components/sorting.js';
import { initPagination } from './components/pagination.js';

function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
}

function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) return profit * 0.15;
  if (index === 1 || index === 2) return profit * 0.10;
  if (index === total - 1) return 0;
  return profit * 0.05;
}

function analyzeSalesData(data, options) {
  // ... 
}

const { data, ...indexes } = initData(sourceData);

const sampleTable = initTable({
  tableTemplate: 'table',
  rowTemplate: 'row',
  before: ['search', 'header', 'filter'],
  after: ['pagination']
}, render);

const applySearching = initSearching('search');
const applyFiltering = initFiltering(sampleTable.elements, indexes);
const applySorting = initSorting(['date', 'total']);
const applyPagination = initPagination(
  sampleTable.pagination.elements,
  (el, page, isCurrent) => {
    const input = el.querySelector('input');
    const span = el.querySelector('span');
    input.value = page;
    input.checked = isCurrent;
    span.textContent = page;
    return el;
  }
);

function collectState() {
  const form = sampleTable.container.querySelector('form');
  if (!form) {
    console.error('Форма не найдена');
    return {};
  }
  const state = processFormData(new FormData(form));
  const searchInput = sampleTable.elements.search;
  if (searchInput) {
    state.search = searchInput.value;
  }
  state.rowsPerPage = parseInt(state.rowsPerPage) || 10;
  state.page = parseInt(state.page) || 1;
  return state;
}

function render(action) {
  let state = collectState();
  let result = [...data];

  result = applySearching(result, state, action);
  result = applyFiltering(result, state, action);
  result = applySorting(result, state, action);
  result = applyPagination(result, state, action);

  sampleTable.render(result);
}

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

try {
  const analyticsResult = analyzeSalesData(sourceData, {
    calculateRevenue: calculateSimpleRevenue,
    calculateBonus: calculateBonusByProfit,
  });
  console.table(analyticsResult);
  console.log('Результат анализа продаж:', analyticsResult);
} catch (err) {
  console.error(err.message);
}

document.addEventListener('pagination-change', (e) => {
  render({ name: 'page', value: e.detail.page });
});

render();