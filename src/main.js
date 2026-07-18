// main.js
import './fonts/ys-display/fonts.css';
import './style.css';

import { initData } from './data.js';
import { processFormData } from './lib/utils.js';
import { initTable } from './components/table.js';
import { initSearching } from './components/searching.js';
import { initFiltering } from './components/filtering.js';
import { initSorting } from './components/sorting.js';
import { initPagination } from './components/pagination.js';

const api = initData();

const sampleTable = initTable({
    tableTemplate: 'table',
    rowTemplate: 'row',
    before: ['search', 'header', 'filter'],
    after: ['pagination']
}, render);

const applySearching = initSearching('search');
const { applyFiltering, updateIndexes } = initFiltering(sampleTable.filter.elements);
const applySorting = initSorting([
    sampleTable.header.elements.sortByDate,
    sampleTable.header.elements.sortByTotal
]);
const { applyPagination, updatePagination } = initPagination(
    sampleTable.pagination.elements,
    (el, page, isCurrent) => {
        const input = el.querySelector('input');
        const span = el.querySelector('span');
        if (input) {
            input.value = page;
            input.checked = isCurrent;
        }
        if (span) span.textContent = page;
        return el;
    }
);

function normalizeAction(action) {
    if (!action) return {};
    if (action instanceof HTMLElement) {
        return {
            name: action.getAttribute('name'),
            value: action.value,
            field: action.dataset.field,
            order: action.dataset.value,
            target: action,
        };
    }
    return action;
}

function collectState() {
    const form = sampleTable.container;
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

async function render(rawAction) {
    const action = normalizeAction(rawAction);
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

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.search.container);
appRoot.appendChild(sampleTable.container);

init();