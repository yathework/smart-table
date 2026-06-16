import { sortCollection, sortMap } from '../lib/sort.js';

export function initSorting(columns) {
  return (data, state, action) => {
    let field = null;
    let order = null;

    if (action && action.name === 'sort') {
      field = action.field;
      order = action.value;
      const buttons = document.querySelectorAll('button[name="sort"]');
      buttons.forEach(btn => {
        if (btn.dataset.field !== field) {
          btn.dataset.value = 'none';
        }
      });
    } else {
      const activeBtn = document.querySelector('button[name="sort"][data-value="up"], button[name="sort"][data-value="down"]');
      if (activeBtn) {
        field = activeBtn.dataset.field;
        order = activeBtn.dataset.value;
      }
    }

    return sortCollection(data, field, order);
  };
}