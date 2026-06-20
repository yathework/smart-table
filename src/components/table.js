import { cloneTemplate } from '../lib/utils.js';

export function initTable(settings, onAction) {
  const { tableTemplate, rowTemplate, before, after } = settings;

  const root = cloneTemplate(tableTemplate);
  const form = root.container;

  const wrapper = document.createElement('div');

  const outside = before.filter(name => name === 'search');
  const inside = before.filter(name => name === 'header' || name === 'filter');

  outside.forEach(name => {
    const tmpl = cloneTemplate(name);
    wrapper.appendChild(tmpl.container);
    root[name] = tmpl;
  });

  inside.forEach(name => {
    const tmpl = cloneTemplate(name);
    form.prepend(tmpl.container);
    root[name] = tmpl;
  });

  wrapper.appendChild(form);

  after.forEach(name => {
    const tmpl = cloneTemplate(name);
    wrapper.appendChild(tmpl.container);
    root[name] = tmpl;
  });

  root.container = wrapper;

  const allElements = Array.from(wrapper.querySelectorAll('[data-name]')).reduce((acc, el) => {
    acc[el.dataset.name] = el;
    return acc;
  }, {});
  root.elements = allElements;

  wrapper.addEventListener('click', (e) => {
    const target = e.target.closest('button[type="submit"]');
    if (target) {
      e.preventDefault();
      const action = {
        name: target.getAttribute('name'),
        value: target.value,
        field: target.dataset.field,
        order: target.dataset.value,
        target: target,
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
      const row = cloneTemplate(rowTemplate);
      Object.keys(item).forEach(key => {
        if (row.elements[key]) {
          const element = row.elements[key];
          if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            element.value = item[key];
          } else {
            if (key === 'customer' || key === 'seller') {
              const obj = item[key];
              if (obj && typeof obj === 'object') {
                element.textContent = `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
              } else {
                element.textContent = obj || '';
              }
            } else {
              element.textContent = item[key];
            }
          }
        }
      });
      return row.container;
    });
    const rowsContainer = root.elements.rows || form.querySelector('[data-name="rows"]');
    if (rowsContainer) {
      rowsContainer.replaceChildren(...nextRows);
    }
  };

  root.render = render;
  return root;
}