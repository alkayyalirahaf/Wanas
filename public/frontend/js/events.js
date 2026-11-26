const eventsList = document.querySelector('#events-list');
const eventSearch = document.querySelector('#event-search');
const eventsCount = document.querySelector('#events-count');

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function ensureDemoEvents() {
  const events = readArray('events');
  if (events.length) return events;

  const demoEvents = [
    {
      id: 'demo-event-1',
      title: 'مساحة هادئة للتعامل مع التوتر',
      description: 'لقاء تشاركي نتعرف فيه على خطوات بسيطة تساعدنا على التعامل مع ضغوط الحياة اليومية.',
      groupId: 'demo-group-1',
      spaceId: 'demo-space-1',
      date: '2026-11-04',
      time: '17:00',
      status: 'Published',
      facilitatorId: 'dummy-id',
    },
    {
      id: 'demo-event-2',
      title: 'لقاء عن العناية بالنفس',
      description: 'نتبادل أفكاراً عملية لبناء عادات صغيرة تمنحنا مزيداً من التوازن والراحة.',
      groupId: 'demo-group-2',
      spaceId: 'demo-space-2',
      date: '2026-11-11',
      time: '18:30',
      status: 'Published',
      facilitatorId: 'dummy-id',
    },
    {
      id: 'demo-event-3',
      title: 'حوار مفتوح حول الدعم الأسري',
      description: 'جلسة حوار آمنة لمشاركة التجارب والتعرف على طرق مساندة أفراد العائلة.',
      groupId: 'demo-group-3',
      spaceId: 'demo-space-3',
      date: '2026-11-18',
      time: '16:00',
      status: 'Published',
      facilitatorId: 'dummy-id',
    },
  ];

  localStorage.setItem('events', JSON.stringify(demoEvents));
  return demoEvents;
}

function formatDate(value) {
  if (!value) return 'التاريخ غير محدد';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('ar-EG');
}

function renderEvents() {
  const query = eventSearch.value.trim().toLocaleLowerCase('ar');
  const events = ensureDemoEvents().filter((event) => event.status === 'Published');
  const visibleEvents = events.filter((event) =>
    `${event.title || ''} ${event.description || ''}`.toLocaleLowerCase('ar').includes(query)
  );

  eventsList.replaceChildren();
  eventsCount.textContent = visibleEvents.length
    ? `عدد الفعاليات: ${visibleEvents.length.toLocaleString('ar-EG')}`
    : '';

  if (!visibleEvents.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'status-note';
    emptyMessage.textContent = events.length ? 'لا توجد فعاليات تطابق بحثك.' : 'لا توجد فعاليات منشورة حالياً.';
    eventsList.append(emptyMessage);
    return;
  }

  visibleEvents.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    const top = document.createElement('div');
    top.className = 'catalog-card__top';
    const dateBlock = document.createElement('div');
    dateBlock.className = 'date-block';
    const day = document.createElement('strong');
    day.textContent = event.date ? event.date.slice(-2) : '—';
    const month = document.createElement('span');
    month.textContent = event.date ? event.date.slice(5, 7) : '';
    dateBlock.append(day, month);
    top.append(dateBlock);
    const heading = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = event.title || 'فعالية ونس';
    const dateTime = document.createElement('p');
    dateTime.className = 'status-note';
    dateTime.textContent = `${formatDate(event.date)} • ${event.time || 'الوقت غير محدد'}`;
    heading.append(title, dateTime);
    top.append(heading);
    card.append(top);

    const description = document.createElement('p');
    description.textContent = event.description || 'تفاصيل الفعالية متاحة في صفحة الفعالية.';
    card.append(description);

    const actions = document.createElement('div');
    actions.className = 'catalog-card__actions';
    const detailsLink = document.createElement('a');
    detailsLink.className = 'button';
    detailsLink.href = `event-details.html?id=${encodeURIComponent(event.id)}`;
    detailsLink.textContent = 'التفاصيل';
    actions.append(detailsLink);
    card.append(actions);
    eventsList.append(card);
  });
}

eventSearch.addEventListener('input', renderEvents);
renderEvents();
