import { createComparison } from '../lib/compare.js';

export function initSearching(searchField) {
  return (data, state, action) => {
    const searchTerm = state.search ? state.search.trim() : '';
    if (!searchTerm) return data;

    return data.filter(item => {
      const customerName = item.customer ? `${item.customer.first_name} ${item.customer.last_name}` : '';
      const sellerName = item.seller ? `${item.seller.first_name} ${item.seller.last_name}` : '';
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