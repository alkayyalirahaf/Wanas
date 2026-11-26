const groupsList = document.querySelector('#groups-list');
const groupSearch = document.querySelector('#group-search');
const groupsCount = document.querySelector('#groups-count');

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function addText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function ensureDemoGroups() {
  const groups = readArray('groups');
  if (groups.length) return groups;

  const demoGroups = [
    {
      id: 'demo-group-1',
      title: 'مساحة للتوازن النفسي',
      topic: 'إدارة التوتر والعناية بالنفس',
      description: 'لقاءات داعمة نتبادل فيها طرقاً عملية للتعامل مع الضغوط اليومية والاهتمام براحتنا.',
      facilitatorId: 'dummy-facilitator-id',
      city: 'عمّان',
    },
    {
      id: 'demo-group-2',
      title: 'خطوات نحو التعافي',
      topic: 'التغيير والنمو الشخصي',
      description: 'مجموعة آمنة لمشاركة التجارب والتشجيع على التقدم بخطوات صغيرة وبالوتيرة المناسبة.',
      facilitatorId: 'dummy-facilitator-id',
      city: 'إربد',
    },
    {
      id: 'demo-group-3',
      title: 'ونس للأهل ومقدمي الرعاية',
      topic: 'الدعم الأسري وتبادل الخبرات',
      description: 'نتشارك خبراتنا ونتعلم كيف نساند أنفسنا وأفراد عائلاتنا برفق وتفهّم.',
      facilitatorId: 'dummy-facilitator-id',
      city: 'الزرقاء',
    },
  ];

  localStorage.setItem('groups', JSON.stringify(demoGroups));
  return demoGroups;
}

function renderGroups() {
  const query = groupSearch.value.trim().toLocaleLowerCase('ar');
  const groups = ensureDemoGroups();
  const visibleGroups = groups.filter((group) => {
    const searchableText = `${group.title || group.name || ''} ${group.topic || ''} ${group.description || ''} ${group.city || ''}`;
    return searchableText.toLocaleLowerCase('ar').includes(query);
  });

  groupsList.replaceChildren();
  groupsCount.textContent = visibleGroups.length
    ? `عدد المجموعات: ${visibleGroups.length.toLocaleString('ar-EG')}`
    : '';

  if (!visibleGroups.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'status-note';
    emptyMessage.textContent = groups.length ? 'لا توجد مجموعات تطابق بحثك.' : 'لا توجد مجموعات حالياً.';
    groupsList.append(emptyMessage);
    return;
  }

  visibleGroups.forEach((group) => {
    const title = group.title || group.name || 'مجموعة دعم';
    const topic = group.topic || 'مساحة آمنة للمشاركة والدعم.';

    const card = document.createElement('article');
    card.className = 'catalog-card';

    const top = document.createElement('div');
    top.className = 'catalog-card__top';
    const avatar = addText(top, 'span', 'person-avatar', (title.trim().charAt(0) || 'م'));
    avatar.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('div');
    addText(heading, 'h2', '', title);
    addText(heading, 'p', 'status-note', `الموضوع: ${topic}`);
    top.append(heading);
    card.append(top);

    const meta = document.createElement('div');
    meta.className = 'catalog-card__meta';
    addText(meta, 'span', '', `المدينة: ${group.city || 'غير محددة'}`);
    card.append(meta);

    const actions = document.createElement('div');
    actions.className = 'catalog-card__actions';
    const viewLink = document.createElement('a');
    viewLink.className = 'button';
    viewLink.href = `group-details.html?id=${encodeURIComponent(group.id)}`;
    viewLink.textContent = 'عرض التفاصيل';
    actions.append(viewLink);
    card.append(actions);
    groupsList.append(card);
  });
}

groupSearch.addEventListener('input', renderGroups);
renderGroups();
