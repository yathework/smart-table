import { cloneTemplate } from '../lib/utils.js';

export function initTable(settings, onAction) {
  const { tableTemplate, rowTemplate, before, after } = settings;
  
  const tableClone = cloneTemplate(tableTemplate);
  const form = tableClone.container;

  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';

  const outside = before.filter(tmpl => tmpl === 'search');
  const inside = before.filter(tmpl => tmpl === 'header' || tmpl === 'filter');

  outside.forEach(tmpl => {
    const el = cloneTemplate(tmpl);
    wrapper.appendChild(el.container);
  });

  inside.forEach(tmpl => {
    const el = cloneTemplate(tmpl);
    form.prepend(el.container);
  });

  wrapper.appendChild(form);

  if (after && after.length) {
    after.forEach(tmpl => {
      const el = cloneTemplate(tmpl);
      wrapper.appendChild(el.container);
    });
  }

  const elements = Array.from(wrapper.querySelectorAll('[data-name]')).reduce((acc, el) => {
    acc[el.dataset.name] = el;
    return acc;
  }, {});

  wrapper.addEventListener('click', (e) => {
    const target = e.target.closest('button[type="submit"]');
    if (target) {
      e.preventDefault();
      const action = {
        name: target.getAttribute('name'),
        value: target.value,
        field: target.dataset.field,
        order: target.dataset.value,
      };
      onAction(action);
    }
  });

  wrapper.addEventListener('input', (e) => {
    const target = e.target;
    if (target.closest('form')) {
      onAction({ name: 'input', target });
    }
  });

  wrapper.addEventListener('change', (e) => {
    const target = e.target;
    if (target.closest('form')) {
      onAction({ name: 'change', target });
    }
  });

  const render = (data) => {
    const rowTemplateEl = document.getElementById(rowTemplate);
    const nextRows = data.map(item => {
      const clone = rowTemplateEl.content.firstElementChild.cloneNode(true);
      const cells = clone.querySelectorAll('[data-name]');
      cells.forEach(cell => {
        const key = cell.dataset.name;
        if (key in item) {
          if (key === 'customer' || key === 'seller') {
            const obj = item[key];
            if (obj && typeof obj === 'object') {
              cell.textContent = `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
            } else {
              cell.textContent = obj || '';
            }
          } else {
            cell.textContent = item[key];
          }
        }
      });
      return clone;
    });
    const rowsContainer = elements.rows || form.querySelector('[data-name="rows"]');
    if (rowsContainer) {
      rowsContainer.replaceChildren(...nextRows);
    }
  };

  return { container: wrapper, elements, render };
}