// components/table.js
import { cloneTemplate } from '../lib/utils.js';

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function initTable(settings, onAction) {
    const { tableTemplate, rowTemplate } = settings;

    const root = cloneTemplate(tableTemplate);
    const form = root.container;

    const searchRoot = cloneTemplate('search');
    const headerRoot = cloneTemplate('header');
    const filterRoot = cloneTemplate('filter');
    const paginationRoot = cloneTemplate('pagination');

    form.prepend(headerRoot.container, filterRoot.container);
    form.appendChild(paginationRoot.container);

    root.search = searchRoot;
    root.header = headerRoot;
    root.filter = filterRoot;
    root.pagination = paginationRoot;
    root.container = form;

    const formElements = Array.from(form.querySelectorAll('[data-name]'));
    const searchElements = Array.from(searchRoot.container.querySelectorAll('[data-name]'));
    const allElements = [...formElements, ...searchElements].reduce((acc, el) => {
        acc[el.dataset.name] = el;
        return acc;
    }, {});
    root.elements = allElements;

    if (allElements.search) {
        const debouncedSearch = debounce(() => {
            onAction({ name: 'search' }).catch(e => console.error('Search error:', e));
        }, 300);
        allElements.search.addEventListener('input', debouncedSearch);
    }

    if (allElements.reset) {
        allElements.reset.addEventListener('click', () => {
            form.reset();
        });
    }

    form.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button && button.name === 'clear') {
            onAction(button).catch(e => console.error('Clear error:', e));
        }
    });

    form.addEventListener('input', (e) => {
        if (e.target.name !== 'search') {
            onAction().catch(e => console.error('Input error:', e));
        }
    });

    form.addEventListener('change', () => {
        onAction().catch(e => console.error('Change error:', e));
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        onAction(e.submitter).catch(e => console.error('Submit error:', e));
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            const searchInput = root.elements.search;
            if (searchInput) searchInput.value = '';
            onAction().catch(e => console.error('Reset error:', e));
        });
    });

    const paginationContainer = paginationRoot.container;
    paginationContainer.addEventListener('change', (e) => {
        const radio = e.target;
        if (radio.name === 'page') {
            onAction({ name: 'page', value: radio.value }).catch(e => console.error('Page error:', e));
        }
    });

    const render = (data) => {
        if (!data || !Array.isArray(data)) return;
        const nextRows = data.map(item => {
            const row = cloneTemplate(rowTemplate);
            Object.keys(item).forEach(key => {
                if (row.elements[key]) {
                    const element = row.elements[key];
                    if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                        element.value = item[key];
                    } else {
                        if (key === 'customer' || key === 'seller') {
                            const obj = item[key];
                            if (obj && typeof obj === 'object') {
                                element.textContent = obj.name || `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
                            } else {
                                element.textContent = obj || '';
                            }
                        } else {
                            element.textContent = item[key];
                        }
                    }
                }
            });
            return row.container;
        });
        const rowsContainer = root.elements.rows || form.querySelector('[data-name="rows"]');
        if (rowsContainer) {
            rowsContainer.replaceChildren(...nextRows);
        }
    };

    root.render = render;
    return root;
}