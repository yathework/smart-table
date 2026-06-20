import { getPages } from '../lib/utils.js';

export function initPagination({ pages, fromRow, toRow, totalRows }, createPage) {
  if (pages) pages.innerHTML = '';

  return (data, state, action) => {
    let rowsPerPage = parseInt(state.rowsPerPage) || 10;
    const total = data.length;
    const maxPage = Math.ceil(total / rowsPerPage) || 1;
    let currentPage = parseInt(state.page) || 1;

    // При изменении количества строк на странице сбрасываем на первую
    if (action && action.name === 'change' && action.target && action.target.name === 'rowsPerPage') {
      currentPage = 1;
    }

    if (currentPage < 1) currentPage = 1;
    if (currentPage > maxPage) currentPage = maxPage;

    // Обработка действий пагинации
    if (action && action.name) {
      if (action.name === 'first') currentPage = 1;
      else if (action.name === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (action.name === 'next') currentPage = Math.min(maxPage, currentPage + 1);
      else if (action.name === 'last') currentPage = maxPage;
      else if (action.name === 'page') currentPage = parseInt(action.value) || 1;

      // Обновляем состояние радиокнопок
      const radios = document.querySelectorAll('input[name="page"]');
      radios.forEach(r => r.checked = (parseInt(r.value) === currentPage));
    }

    // Отображение страниц (до 5)
    const visiblePages = getPages(currentPage, maxPage, 5);
    if (pages) {
      pages.innerHTML = '';
      visiblePages.forEach(p => {
        const label = document.createElement('label');
        label.className = 'pagination-button';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'page';
        radio.value = p;
        radio.checked = (p === currentPage);
        radio.addEventListener('change', () => {
          const event = new CustomEvent('pagination-change', { detail: { page: p } });
          document.dispatchEvent(event);
        });
        label.appendChild(radio);
        const span = document.createElement('span');
        span.textContent = p;
        label.appendChild(span);
        pages.appendChild(label);
      });
    }

    // Обновление статуса
    const from = (currentPage - 1) * rowsPerPage + 1;
    const to = Math.min(currentPage * rowsPerPage, total);
    if (fromRow) fromRow.textContent = total === 0 ? 0 : from;
    if (toRow) toRow.textContent = total === 0 ? 0 : to;
    if (totalRows) totalRows.textContent = total;

    return data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  };
}