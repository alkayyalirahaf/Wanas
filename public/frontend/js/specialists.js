const specialistsList = document.querySelector('#specialists-list');
const specialistSearch = document.querySelector('#specialist-search');
const resultsCount = document.querySelector('#results-count');

function getActiveSpecialists() {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return Array.isArray(users)
      ? users.filter((user) => user.role === 'specialist' && user.status === 'Active')
      : [];
  } catch {
    return [];
  }
}

function appendText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function formatPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0
    ? `${price.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} د.أ`
    : 'يُحدد السعر عند الحجز';
}

function renderSpecialists() {
  const query = specialistSearch.value.trim().toLocaleLowerCase('ar');
  const specialists = getActiveSpecialists().filter((specialist) => {
    const specialty = specialist.specialty || specialist.specialization || '';
    return `${specialist.name || ''} ${specialty}`.toLocaleLowerCase('ar').includes(query);
  });

  specialistsList.replaceChildren();
  resultsCount.textContent = specialists.length
    ? `عدد الأخصائيين: ${specialists.length.toLocaleString('ar-EG')}`
    : '';

  if (!specialists.length) {
    const empty = document.createElement('p');
    empty.className = 'status-note';
    empty.textContent = query ? 'لا توجد نتائج تطابق بحثك.' : 'لا يوجد أخصائيون متاحون حالياً.';
    specialistsList.append(empty);
    return;
  }

  specialists.forEach((specialist) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';

    const top = document.createElement('div');
    top.className = 'catalog-card__top';
    const avatar = appendText(top, 'span', 'person-avatar', (specialist.name || 'أ').trim().charAt(0) || 'أ');
    avatar.setAttribute('aria-hidden', 'true');
    const identity = document.createElement('div');
    appendText(identity, 'h2', '', specialist.name || 'أخصائي');
    appendText(identity, 'p', 'status-note', specialist.specialty || specialist.specialization || 'أخصائي دعم نفسي');
    top.append(identity);
    card.append(top);

    const meta = document.createElement('div');
    meta.className = 'catalog-card__meta';
    appendText(meta, 'span', '', `السعر: ${formatPrice(specialist.price)}`);
    card.append(meta);

    const actions = document.createElement('div');
    actions.className = 'catalog-card__actions';
    const profileLink = document.createElement('a');
    profileLink.className = 'button';
    profileLink.href = `specialist-details.html?id=${encodeURIComponent(specialist.id)}`;
    profileLink.textContent = 'عرض الملف';
    actions.append(profileLink);
    card.append(actions);
    specialistsList.append(card);
  });
}

specialistSearch.addEventListener('input', renderSpecialists);
renderSpecialists();
