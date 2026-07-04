import { sortMap } from '../lib/sort.js';

export function initSorting(columns) {
    return (query, state, action) => {
        let field = null;
        let order = null;

        if (action && action.name === 'sort') {
            const currentOrder = action.order;
            const newOrder = sortMap[currentOrder] || 'up';
            const buttons = document.querySelectorAll('button[name="sort"]');
            buttons.forEach(btn => {
                if (btn.dataset.field === action.field) {
                    btn.dataset.value = newOrder;
                } else {
                    btn.dataset.value = 'none';
                }
            });
            field = action.field;
            order = newOrder;
        } else {
            const activeBtn = document.querySelector('button[name="sort"][data-value="up"], button[name="sort"][data-value="down"]');
            if (activeBtn) {
                field = activeBtn.dataset.field;
                order = activeBtn.dataset.value;
            }
        }

        const sort = (field && order !== 'none') ? `${field}:${order}` : null;
        return sort ? Object.assign({}, query, { sort }) : query;
    };
}