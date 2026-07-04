export function initFiltering(elements) {
    const updateIndexes = (elements, indexes) => {
        const sellerSelect = elements.searchBySeller;
        if (sellerSelect) {
            sellerSelect.innerHTML = '<option value="">—</option>';
            const sellers = indexes.searchBySeller || [];
            sellers.forEach(seller => {
                const option = document.createElement('option');
                option.value = seller.id;
                option.textContent = seller.name;
                sellerSelect.appendChild(option);
            });
        }
    };

    const applyFiltering = (query, state, action) => {
        if (action && action.name === 'clear') {
            const field = action.field;
            const input = elements[`searchBy${field}`];
            if (input) input.value = '';
        }

        const filter = {};
        const filterFields = ['searchByDate', 'searchByCustomer', 'searchBySeller', 'totalFrom', 'totalTo'];

        filterFields.forEach(key => {
            const el = elements[key];
            if (el && el.value) {
                filter[`filter[${el.name}]`] = el.value;
            }
        });

        return Object.keys(filter).length ? Object.assign({}, query, filter) : query;
    };

    return { updateIndexes, applyFiltering };
}