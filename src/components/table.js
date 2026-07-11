// components/table.js
import { cloneTemplate } from '../lib/utils.js';

export function initTable(settings, onAction) {
    const { tableTemplate, rowTemplate, before, after } = settings;

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
        allElements.search.addEventListener('input', () => {
            onAction({ name: 'search' });
        });
    }

    if (allElements.reset) {
        allElements.reset.addEventListener('click', () => {
            form.reset();
            if (allElements.search) allElements.search.value = '';
        });
    }

    form.addEventListener('change', (e) => {
        onAction({ name: 'change', target: e.target });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        onAction(e.submitter);
    });

    form.addEventListener('reset', () => {
        setTimeout(() => onAction({ name: 'reset' }), 0);
    });

    document.addEventListener('pagination-change', (e) => {
        onAction({ name: 'page', value: e.detail.page });
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