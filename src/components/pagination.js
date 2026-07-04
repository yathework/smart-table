import { getPages } from '../lib/utils.js';

export function initPagination({ pages, fromRow, toRow, totalRows }, createPage) {
    if (pages) pages.innerHTML = '';
    let pageCount;

    const applyPagination = (query, state, action) => {
        const limit = parseInt(state.rowsPerPage) || 10;
        let page = parseInt(state.page) || 1;

        if (action && action.name === 'change' && action.target && action.target.name === 'rowsPerPage') {
            page = 1;
        }

        if (action && action.name) {
            if (action.name === 'first') page = 1;
            else if (action.name === 'prev') page = Math.max(1, page - 1);
            else if (action.name === 'next') page = Math.min(pageCount || 1, page + 1);
            else if (action.name === 'last') page = pageCount || 1;
            else if (action.name === 'page') page = parseInt(action.value) || 1;
        }

        page = Math.min(page, pageCount || 1);

        return Object.assign({}, query, { limit, page });
    };

    const updatePagination = (total, { page, limit }) => {
        pageCount = Math.ceil(total / limit) || 1;
        const currentPage = Math.min(page, pageCount);

        const visiblePages = getPages(currentPage, pageCount, 5);
        if (pages) {
            pages.innerHTML = '';
            visiblePages.forEach(p => {
                const label = document.createElement('label');
                label.className = 'pagination-button';
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'page';
                radio.value = p;
                radio.checked = (p === currentPage);
                radio.addEventListener('change', () => {
                    const event = new CustomEvent('pagination-change', { detail: { page: p } });
                    document.dispatchEvent(event);
                });
                label.appendChild(radio);
                const span = document.createElement('span');
                span.textContent = p;
                label.appendChild(span);
                pages.appendChild(label);
            });
        }

        const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
        const to = Math.min(currentPage * limit, total);
        if (fromRow) fromRow.textContent = from;
        if (toRow) toRow.textContent = to;
        if (totalRows) totalRows.textContent = total;
    };

    return { applyPagination, updatePagination };
}