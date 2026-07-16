// components/pagination.js
import { getPages } from '../lib/utils.js';

export function initPagination({ pages, fromRow, toRow, totalRows }, createPage) {
    const pageTemplate = pages.firstElementChild.cloneNode(true);
    pages.innerHTML = '';
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
            else if (action.name === 'next') page = page + 1;
            else if (action.name === 'last') page = pageCount || 99999;
            else if (action.name === 'page') page = parseInt(action.value) || 1;
        }

        return Object.assign({}, query, { limit, page });
    };

    const updatePagination = (total, { page, limit }) => {
        pageCount = Math.ceil(total / limit) || 1;
        const currentPage = Math.min(page, pageCount);

        const visiblePages = getPages(currentPage, pageCount, 5);
        if (pages) {
            pages.replaceChildren(...visiblePages.map(p => {
                const el = pageTemplate.cloneNode(true);
                return createPage(el, p, p === currentPage);
            }));
        }

        const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
        const to = Math.min(currentPage * limit, total);
        if (fromRow) fromRow.textContent = from;
        if (toRow) toRow.textContent = to;
        if (totalRows) totalRows.textContent = total;
    };

    return { applyPagination, updatePagination };
}