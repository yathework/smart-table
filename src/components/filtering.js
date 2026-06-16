import { createComparison, defaultRules } from '../lib/compare.js';

export function initFiltering(elements, indexes) {
  const sellerSelect = elements.searchBySeller;
  if (sellerSelect) {
    sellerSelect.innerHTML = '<option value="">—</option>';
    const sellers = Object.values(indexes.sellers);
    sellers.forEach(seller => {
      const option = document.createElement('option');
      option.value = seller.id;
      option.textContent = seller.name;
      sellerSelect.appendChild(option);
    });
  }

  return (data, state, action) => {
    if (action && action.name === 'clear') {
      const field = action.field;
      const input = elements[`searchBy${field}`];
      if (input) input.value = '';
      return data;
    }

    const filters = {};
    if (state.date) filters.date = state.date;
    if (state.customer) filters.customer = state.customer;
    if (state.seller) filters.seller = state.seller;
    if (state.totalFrom || state.totalTo) {
      filters.total = [state.totalFrom || '', state.totalTo || ''];
    }

    if (Object.keys(filters).length === 0) return data;

    const compareFn = createComparison(defaultRules, [
      (key, sourceVal, targetVal) => {
        if (key === 'seller' && typeof sourceVal === 'object' && sourceVal !== null) {
          return { result: sourceVal.id === targetVal };
        }
        return { continue: true };
      }
    ]);

    return data.filter(item => compareFn(item, filters));
  };
}