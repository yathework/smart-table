// src/components/filtering.js
export function initFiltering(elements) {

    const updateIndexes = (elements, indexes) => {
        Object.keys(indexes).forEach((elementName) => {
            const target = elements[elementName];
            if (!target) return;

            const values = Object.values(indexes[elementName]);
            target.append(...values.map(value => {
                const name = typeof value === 'string'
                    ? value
                    : value.name || `${value.first_name || ''} ${value.last_name || ''}`.trim();
                const el = document.createElement('option');
                el.textContent = name;
                el.value = name;
                return el;
            }));
        });
    };

    const applyFiltering = (query, state, action) => {
        if (action && action.name === 'clear' && action.target && action.target.parentElement) {
            const input = action.target.parentElement.querySelector('input');
            if (input) {
                input.value = '';
            }
        }

        const filter = {};
        const fieldMapping = {
            searchByDate: 'date',
            searchByCustomer: 'customer',
            searchBySeller: 'seller',
            totalFrom: 'totalFrom',
            totalTo: 'totalTo'
        };

        Object.keys(fieldMapping).forEach(key => {
            const el = elements[key];
            if (!el) return;
            const value = el.value.trim();
            if (!value) return;
            filter[`filter[${fieldMapping[key]}]`] = value;
        });

        return Object.keys(filter).length ? Object.assign({}, query, filter) : query;
    };

    return { updateIndexes, applyFiltering };
}