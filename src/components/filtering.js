export function initFiltering(elements) {
    const updateIndexes = (elements, indexes) => {
        const sellerSelect = elements.searchBySeller;
        if (sellerSelect) {
            sellerSelect.innerHTML = '<option value="">—</option>';
            const sellers = indexes.searchBySeller || [];
            sellers.forEach(sellerName => {
                const option = document.createElement('option');
                option.value = sellerName;
                option.textContent = sellerName;
                sellerSelect.appendChild(option);
            });
        }
    };

    const applyFiltering = (query, state, action) => {
        if (action && action.name === 'clear' && action.parentElement) {
            const input = action.parentElement.querySelector('input');
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

            if (key === 'searchByDate' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return;
            }

            filter[`filter[${fieldMapping[key]}]`] = value;
        });

        return Object.keys(filter).length ? Object.assign({}, query, filter) : query;
    };

    return { updateIndexes, applyFiltering };
}