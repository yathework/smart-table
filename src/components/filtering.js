import { createComparison, defaultRules } from '../lib/compare.js';

export function initFiltering(elements, indexes) {
  const sellerSelect = elements.searchBySeller;
  if (sellerSelect) {
    sellerSelect.innerHTML = '<option value="">—</option>';
    const sellers = Object.values(indexes.sellers);
    sellers.forEach(seller => {
      const option = document.createElement('option');
      option.value = seller.id;
      option.textContent = seller;
      sellerSelect.appendChild(option);
    });
  }

  return (data, state, action) => {
    if (action && action.name === 'clear') {
      const field = action.field;
      const input = elements[`searchBy${field}`];
      if (input) input.value = '';
    }

    return data.filter(item => {
      if (state.date && !item.date.includes(state.date)) return false;

      if (state.customer) {
        const customerName = `${item.customer.first_name} ${item.customer.last_name}`;
        if (!customerName.toLowerCase().includes(state.customer.toLowerCase())) return false;
      }

      if (state.seller) {
        if (item.seller.id !== state.seller) return false;
      }

      if (state.totalFrom || state.totalTo) {
        const total = item.total;
        if (state.totalFrom && total < parseFloat(state.totalFrom)) return false;
        if (state.totalTo && total > parseFloat(state.totalTo)) return false;
      }

      return true;
    });
  };
}