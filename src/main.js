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

const api = initData(sourceData);

const sampleTable = initTable({
    tableTemplate: 'table',
    rowTemplate: 'row',
    before: ['search', 'header', 'filter'],
    after: ['pagination']
}, render);

const applySearching = initSearching('search');
const { applyFiltering, updateIndexes } = initFiltering(sampleTable.elements);
const applySorting = initSorting(['date', 'total']);
const { applyPagination, updatePagination } = initPagination(
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
    if (sampleTable.elements.rowsPerPage) {
        state.rowsPerPage = parseInt(sampleTable.elements.rowsPerPage.value) || 10;
    } else {
        state.rowsPerPage = 10;
    }
    state.page = parseInt(state.page) || 1;
    return state;
}

async function render(action) {
    const state = collectState();
    let query = {};

    query = applySearching(query, state, action);
    query = applyFiltering(query, state, action);
    query = applySorting(query, state, action);
    query = applyPagination(query, state, action);

    const { total, items } = await api.getRecords(query);

    updatePagination(total, query);
    sampleTable.render(items);
}

async function init() {
    const indexes = await api.getIndexes();
    updateIndexes(sampleTable.filter.elements, {
        searchBySeller: Object.values(indexes.sellers)
    });
    render();
}

sampleTable.elements.search.addEventListener('input', () => {
    render({ name: 'search' });
});

sampleTable.elements.reset.addEventListener('click', () => {
    const form = sampleTable.container.querySelector('form');
    if (form) form.reset();
    const searchInput = sampleTable.elements.search;
    if (searchInput) searchInput.value = '';
    render({ name: 'reset' });
});

document.addEventListener('pagination-change', (e) => {
    render({ name: 'page', value: e.detail.page });
});

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

init();