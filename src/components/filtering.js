// components/filtering.js
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
            const button = action.target || action;
            if (button && button.parentElement) {
                const input = button.parentElement.querySelector('input');
                if (input) {
                    input.value = '';
                }
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
            let value;
            if (key === 'searchBySeller' && el.tagName === 'SELECT') {
                const selectedOption = el.options[el.selectedIndex];
                if (selectedOption && selectedOption.value !== '') {
                    value = selectedOption.textContent.trim();
                }
            } else {
                value = el.value.trim();
            }
            if (!value) return;

            filter[`filter[${fieldMapping[key]}]`] = value;
        });

        return Object.keys(filter).length ? Object.assign({}, query, filter) : query;
    };

    return { updateIndexes, applyFiltering };
}