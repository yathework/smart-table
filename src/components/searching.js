import { createComparison } from '../lib/compare.js';

export function initSearching(searchField) {
  const compareFn = createComparison(
    ['skipNonExistentSourceFields', 'skipEmptyTargetValues', 'caseInsensitiveStringIncludes'],
    []
  );

  return (data, state, action) => {
    if (!state.search) return data;
    const searchTerm = state.search.trim();
    if (!searchTerm) return data;

    return data.filter(item => {
      const customerName = item.customer ? `${item.customer.first_name} ${item.customer.last_name}` : '';
      const sellerName = item.seller ? `${item.seller.first_name} ${item.seller.last_name}` : '';
      const searchable = {
        date: item.date || '',
        customer: customerName,
        seller: sellerName,
        total: String(item.total || '')
      };
      return compareFn(searchable, { search: searchTerm });
    });
  };
}