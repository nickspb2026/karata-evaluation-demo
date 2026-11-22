'use strict';

const form = document.getElementById('estimate');
const categories = ['Золото', 'Серебро', 'Платина', 'Бриллианты', 'Монеты', 'Часы', 'Антиквариат', 'Янтарь', 'Кожа и мех'];
const purityByMetal = {
  'Золото': ['375', '500', '583 / 585', '750', '850', '900', '999', 'Не знаю'],
  'Серебро': ['800', '875', '925', '960', '999', 'Не знаю'],
  'Платина': ['850', '900', '950', 'Не знаю']
};
const placeholders = {
  'Золото': 'Например, цепочка с застёжкой',
  'Серебро': 'Например, серебряные столовые приборы',
  'Платина': 'Например, кольцо с клеймом',
  'Бриллианты': 'Камень или украшение, масса и сертификат, если известны',
  'Монеты': 'Название, год, металл, состояние',
  'Часы': 'Бренд, модель, комплект и документы',
  'Антиквариат': 'Что за предмет, возраст, автор или клеймо',
  'Янтарь': 'Тип изделия, размер и вес',
  'Кожа и мех': 'Бренд, размер, состояние'
};

function makeChoices(container, name, values, checkedValue) {
  container.replaceChildren();
  values.forEach(value => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = value === checkedValue;
    input.required = true;
    const span = document.createElement('span');
    span.textContent = value;
    label.append(input, span);
    container.append(label);
  });
}

function updateCategory() {
  const categoryInput = form.querySelector('input[name="category"]:checked');
  const category = categoryInput?.value || '';
  const purities = purityByMetal[category];
  document.getElementById('metal-fields').hidden = !purities;
  form.elements.weight.disabled = !purities;
  makeChoices(document.getElementById('purity-choices'), 'purity', purities || [], 'Не знаю');
  document.getElementById('description').placeholder = placeholders[category] || 'Опишите предмет, его состояние и особенности';
  document.getElementById('description-label').classList.toggle('is-inactive', !category);
}

makeChoices(document.getElementById('category-choices'), 'category', categories, '');
updateCategory();
form.addEventListener('change', event => {
  if (event.target.name === 'category') {
    event.target.setCustomValidity('');
    updateCategory();
  }
});
document.querySelectorAll('[data-category]').forEach(button => {
  button.addEventListener('click', () => {
    const option = [...form.querySelectorAll('input[name="category"]')].find(input => input.value === button.dataset.category);
    if (option) option.checked = true;
    updateCategory();
    document.getElementById('receipt').hidden = true;
    form.hidden = false;
    document.getElementById('quote').scrollIntoView({behavior: 'smooth', block: 'start'});
  });
});

let photoUrls = [];
let photoNames = [];
document.getElementById('photos').addEventListener('change', event => {
  const files = Array.from(event.target.files);
  const status = document.getElementById('photo-status');
  if (files.length > 4 || files.some(file => file.size > 10 * 1024 * 1024 || !file.type.startsWith('image/'))) {
    status.textContent = 'Добавьте не более 4 изображений в формате JPG, PNG или HEIC, до 10 МБ каждое.';
    event.target.value = '';
    photoUrls.forEach(url => URL.revokeObjectURL(url));
    photoUrls = [];
    photoNames = [];
    document.getElementById('previews').replaceChildren();
    return;
  }
  photoUrls.forEach(url => URL.revokeObjectURL(url));
  photoUrls = [];
  photoNames = files.map(file => file.name);
  const previews = document.getElementById('previews');
  previews.replaceChildren();
  files.forEach(file => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    photoUrls.push(url);
    img.src = url;
    img.alt = file.name;
    previews.append(img);
  });
  status.textContent = files.length ? `Добавлено фотографий: ${files.length}. Они останутся на устройстве и не прикрепятся к тексту обращения.` : '';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const category = form.querySelector('input[name="category"]:checked');
  if (!category) {
    const firstChoice = form.querySelector('input[name="category"]');
    firstChoice.setCustomValidity('Выберите категорию изделия');
    firstChoice.reportValidity();
    return;
  }
  const description = document.getElementById('description');
  if (!description.value.trim()) {
    description.setCustomValidity('Опишите изделие');
    description.reportValidity();
    return;
  }
  const data = new FormData(form);
  const lines = ['Обращение в «3 Карата»', 'Категория: ' + data.get('category'), 'Изделие: ' + data.get('description').trim()];
  if (data.get('purity')) lines.push('Проба: ' + data.get('purity'));
  if (data.get('weight')) lines.push('Вес: ' + data.get('weight') + ' г');
  if (data.get('details').trim()) lines.push('Сведения: ' + data.get('details').trim());
  if (data.get('contact').trim()) lines.push('Контакт: ' + data.get('contact').trim());
  if (photoNames.length) lines.push('Фотографии для отдельного приложения: ' + photoNames.join(', '));
  document.getElementById('summary').textContent = lines.join('\n');
  form.hidden = true;
  document.getElementById('receipt').hidden = false;
  document.getElementById('copy-status').textContent = '';
  document.getElementById('copy').focus({preventScroll:true});
  document.getElementById('receipt').scrollIntoView({block:'center'});
});
document.getElementById('description').addEventListener('input', event => event.target.setCustomValidity(''));
document.getElementById('edit').addEventListener('click', () => {
  document.getElementById('receipt').hidden = true;
  form.hidden = false;
  document.getElementById('description').focus();
});
document.getElementById('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('summary').textContent);
    document.getElementById('copy-status').textContent = 'Текст скопирован.';
  } catch {
    document.getElementById('copy-status').textContent = 'Выделите текст и скопируйте вручную.';
  }
});

document.querySelectorAll('[data-item]').forEach(button => {
  button.addEventListener('click', () => {
    form.querySelector('input[name="category"][value="Золото"]').checked = true;
    updateCategory();
    document.getElementById('description').value = button.dataset.item;
    document.getElementById('description').setCustomValidity('');
    form.hidden = false;
    document.getElementById('receipt').hidden = true;
    document.getElementById('quote').scrollIntoView({behavior:'smooth',block:'start'});
  });
});
