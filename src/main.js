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
  if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records) ||
      data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
    throw new Error('Некорректные входные данные');
  }
  if (!options || typeof options !== 'object') {
    throw new Error('Опции не переданы');
  }
  const { calculateRevenue, calculateBonus } = options;
  if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
    throw new Error('Отсутствуют необходимые функции расчёта');
  }

  const sellerStats = data.sellers.map(s => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
  }));

  const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
  const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

  for (const record of data.purchase_records) {
    const seller = sellerIndex[record.seller_id];
    if (!seller) continue;
    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    for (const item of record.items) {
      const product = productIndex[item.sku];
      if (!product) continue;
      const cost = product.purchase_price * item.quantity;
      const revenueItem = calculateRevenue(item, product);
      seller.profit += revenueItem - cost;
      if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
      seller.products_sold[item.sku] += item.quantity;
    }
  }

  sellerStats.sort((a, b) => b.profit - a.profit);

  const total = sellerStats.length;
  for (let i = 0; i < total; i++) {
    const seller = sellerStats[i];
    seller.bonus = calculateBonus(i, total, seller);
    const products = Object.entries(seller.products_sold).map(([sku, qty]) => ({ sku, quantity: qty }));
    products.sort((a, b) => b.quantity - a.quantity);
    seller.top_products = products.slice(0, 10);
  }

  return sellerStats.map(s => ({
    seller_id: s.id,
    name: s.name,
    revenue: +s.revenue.toFixed(2),
    profit: +s.profit.toFixed(2),
    sales_count: s.sales_count,
    top_products: s.top_products,
    bonus: +s.bonus.toFixed(2)
  }));
}

const { data, ...indexes } = initData(sourceData);

const sampleTable = initTable({
  tableTemplate: 'table',
  rowTemplate: 'row',
  before: ['search', 'header', 'filter'],
  after: ['pagination']
}, render);

const searchFn = initSearching('search');
const filterFn = initFiltering(sampleTable.elements, indexes);
const sortFn = initSorting(['date', 'total']);
const paginateFn = initPagination({
  pages: sampleTable.elements.pages,
  fromRow: sampleTable.elements.fromRow,
  toRow: sampleTable.elements.toRow,
  totalRows: sampleTable.elements.totalRows
}, (page) => {});

function collectState() {
  const form = sampleTable.container.querySelector('form');
  if (!form) {
    console.error('Форма не найдена внутри контейнера');
    return {};
  }
  const state = processFormData(new FormData(form));
  return { ...state };
}

function render(action) {
  let state = collectState();
  let result = [...data];

  if (searchFn) result = searchFn(result, state, action);
  if (filterFn) result = filterFn(result, state, action);
  if (sortFn) result = sortFn(result, state, action);
  if (paginateFn) result = paginateFn(result, state, action);

  sampleTable.render(result);
}

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

const resetButton = sampleTable.elements.reset;
if (resetButton) {
  resetButton.addEventListener('click', (e) => {
    e.preventDefault();
    const form = sampleTable.container.querySelector('form');
    if (form) {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button') {
          input.value = '';
        }
      });
    }
    const searchInput = sampleTable.elements.search;
    if (searchInput) searchInput.value = '';
    render({ name: 'reset' });
  });
}

document.addEventListener('pagination-change', (e) => {
  render({ name: 'page', value: e.detail.page });
});

try {
  const analyticsResult = analyzeSalesData(sourceData, {
    calculateRevenue: calculateSimpleRevenue,
    calculateBonus: calculateBonusByProfit,
  });
  console.table(analyticsResult);
  console.log('Результат анализа продаж:', analyticsResult);
} catch (err) {
  console.error('Ошибка при анализе данных:', err.message);
}

render();