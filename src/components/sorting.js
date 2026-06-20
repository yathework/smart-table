import { sortCollection, sortMap } from '../lib/sort.js';

export function initSorting(columns) {
  return (data, state, action) => {
    let field = null;
    let order = null;

    if (action && action.name === 'sort') {
      field = action.field;
      order = action.value;
      // Сбрасываем другие кнопки сортировки
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

    if (!field || order === 'none') return data;

    const sorted = [...data];
    sorted.sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      // Для даты преобразуем в объект Date
      if (field === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      // Для суммы приводим к числу
      else if (field === 'total') {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (valA < valB) return order === 'up' ? -1 : 1;
      if (valA > valB) return order === 'up' ? 1 : -1;
      return 0;
    });

    return sorted;
  };
}