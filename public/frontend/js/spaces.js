const spacesList = document.querySelector('#spaces-list');
const spaceSearch = document.querySelector('#space-search');
const spacesCount = document.querySelector('#spaces-count');

function readSpaces() {
  try {
    const spaces = JSON.parse(localStorage.getItem('spaces') || '[]');
    return Array.isArray(spaces) ? spaces : [];
  } catch {
    return [];
  }
}

function ensureDemoSpaces() {
  const spaces = readSpaces();
  if (spaces.length) return spaces;

  const demoSpaces = [
    {
      id: 'demo-space-1',
      title: 'بيت ونس للقاءات',
      city: 'عمّان',
      capacity: 18,
      pricePerHour: 25,
      ownerId: 'dummy-owner',
      status: 'Active',
      description: 'مساحة هادئة ومريحة مناسبة لمجموعات الدعم واللقاءات الصغيرة.',
    },
    {
      id: 'demo-space-2',
      title: 'مساحة خطوة',
      city: 'إربد',
      capacity: 12,
      pricePerHour: 18,
      ownerId: 'dummy-owner',
      status: 'Active',
      description: 'مكان مهيأ للحوارات والأنشطة المجتمعية ضمن أجواء ودودة.',
    },
    {
      id: 'demo-space-3',
      title: 'حديقة السكينة',
      city: 'الزرقاء',
      capacity: 24,
      pricePerHour: 30,
      ownerId: 'dummy-owner',
      status: 'Active',
      description: 'مساحة رحبة للقاءات والأنشطة التي تشجع على التواصل والراحة.',
    },
  ];

  localStorage.setItem('spaces', JSON.stringify(demoSpaces));
  return demoSpaces;
}

function getSpaceTitle(space) {
  return space.title || space.name || 'مساحة ونس';
}

function getSpacePrice(space) {
  return Number(space.pricePerHour ?? space.price) || 0;
}

function formatMoney(value) {
  return `${Number(value).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} د.أ / ساعة`;
}

function renderSpaces() {
  const query = spaceSearch.value.trim().toLocaleLowerCase('ar');
  const spaces = ensureDemoSpaces();
  const visibleSpaces = spaces.filter((space) =>
    `${getSpaceTitle(space)} ${space.city || ''}`.toLocaleLowerCase('ar').includes(query)
  );

  spacesList.replaceChildren();
  spacesCount.textContent = visibleSpaces.length
    ? `عدد المساحات: ${visibleSpaces.length.toLocaleString('ar-EG')}`
    : '';

  if (!visibleSpaces.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'status-note';
    emptyMessage.textContent = spaces.length ? 'لا توجد مساحات تطابق بحثك.' : 'لا توجد مساحات متاحة حالياً.';
    spacesList.append(emptyMessage);
    return;
  }

  visibleSpaces.forEach((space) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    const top = document.createElement('div');
    top.className = 'catalog-card__top';
    const avatar = document.createElement('span');
    avatar.className = 'person-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = getSpaceTitle(space).trim().charAt(0) || 'م';
    const identity = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = getSpaceTitle(space);
    const city = document.createElement('p');
    city.className = 'status-note';
    city.textContent = space.city || 'المدينة غير محددة';
    identity.append(title, city);
    top.append(avatar, identity);
    card.append(top);

    const meta = document.createElement('div');
    meta.className = 'catalog-card__meta';
    const capacity = document.createElement('span');
    capacity.textContent = `السعة: ${Number(space.capacity) || 0} شخص`;
    const price = document.createElement('span');
    price.textContent = `السعر: ${formatMoney(getSpacePrice(space))}`;
    meta.append(capacity, price);
    card.append(meta);

    const actions = document.createElement('div');
    actions.className = 'catalog-card__actions';
    const details = document.createElement('a');
    details.className = 'button';
    details.href = `space-details.html?id=${encodeURIComponent(space.id)}`;
    details.textContent = 'عرض التفاصيل';
    actions.append(details);
    card.append(actions);
    spacesList.append(card);
  });
}

spaceSearch.addEventListener('input', renderSpaces);
renderSpaces();
