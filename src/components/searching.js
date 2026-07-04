import { createComparison } from '../lib/compare.js';

export function initSearching(searchField) {
    return (data, state, action) => {
        const searchTerm = state.search ? state.search.trim() : '';
        if (!searchTerm) return data;

        return data.filter(item => {
            const customerName = item.customer ? item.customer.name : '';
            const sellerName = item.seller ? item.seller.name : '';
            const fields = [
                item.date,
                customerName,
                sellerName,
                String(item.total)
            ];
            return fields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
        });
    };
}