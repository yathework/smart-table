// main.js
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
        if (input) {
            input.value = page;
            input.checked = isCurrent;
            input.addEventListener('change', () => {
                document.dispatchEvent(new CustomEvent('pagination-change', { detail: { page } }));
            });
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

    try {
        const { total, items } = await api.getRecords(query);
        updatePagination(total, query);
        sampleTable.render(items);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function initLocal() {
    if (!sourceData) return;
    const { sellers } = api.buildLocalIndexes();
    updateIndexes(sampleTable.filter.elements, {
        searchBySeller: Object.values(sellers).map(s => s.name)
    });
    const { total, items } = api.getLocalRecords({ limit: 10, page: 1 });
    updatePagination(total, { limit: 10, page: 1 });
    sampleTable.render(items);
}

initLocal();

async function initServer() {
    try {
        const indexes = await api.getIndexes();
        updateIndexes(sampleTable.filter.elements, {
            searchBySeller: Object.values(indexes.sellers).map(s =>
                typeof s === 'string' ? s : s.name
            )
        });
        await render();
    } catch (e) {
        console.warn('Сервер недоступен, остаёмся на локальных данных');
    }
}

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.search.container);
appRoot.appendChild(sampleTable.container);

initServer();