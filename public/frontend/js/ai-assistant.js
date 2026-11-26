const assistantForm = document.querySelector('#assistant-form');
const assistantLoading = document.querySelector('#assistant-loading');
const assistantResults = document.querySelector('#assistant-results');
const assistantMessage = document.querySelector('#assistant-message');
const planSummary = document.querySelector('#plan-summary');
const planSteps = document.querySelector('#plan-steps');
const recommendations = document.querySelector('#recommendations');

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return String(value || '').toLocaleLowerCase('ar').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[\sـ]/g, '');
}

function createText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function ensureDummySpecialists(city, amount) {
  const users = readArray('users');
  const demoSpecialists = [];

  for (let index = 1; index <= amount; index += 1) {
    const id = `demo-ai-${normalizeText(city)}-${index}`;
    let specialist = users.find((user) => String(user.id) === id);
    if (!specialist) {
      specialist = {
        id,
        name: index === 1 ? 'ليان الحسن' : 'عمر خليل',
        email: `recommendation-${normalizeText(city)}-${index}@wanas.demo`,
        role: 'specialist',
        status: 'Active',
        specialty: index === 1 ? 'الدعم النفسي وإدارة القلق' : 'الإرشاد النفسي والعلاقات',
        price: index === 1 ? 35 : 40,
        city,
        demoRecommendation: true,
      };
      users.push(specialist);
    }
    demoSpecialists.push(specialist);
  }

  localStorage.setItem('users', JSON.stringify(users));
  return demoSpecialists;
}

function getSpecialistRecommendations(city) {
  let specialists = readArray('users').filter((user) => user.role === 'specialist' && user.status === 'Active');
  if (city !== 'أي مدينة') {
    const cityMatches = specialists.filter((user) => normalizeText(user.city) === normalizeText(city));
    specialists = cityMatches;
  }

  if (specialists.length < 2) {
    const missing = 2 - specialists.length;
    const fallback = ensureDummySpecialists(city === 'أي مدينة' ? 'عمان' : city, missing);
    specialists = [...specialists, ...fallback.filter((demo) => !specialists.some((user) => String(user.id) === String(demo.id)))];
  }
  return specialists.slice(0, 2);
}

function ensureDemoGroup() {
  const groups = readArray('groups');
  if (groups.length) return groups[0];
  const group = {
    id: 'demo-ai-group',
    title: 'مساحة للتوازن النفسي',
    topic: 'العناية بالنفس وإدارة التوتر',
    description: 'مجموعة داعمة لمشاركة الخبرات والتعرف على خطوات يومية بسيطة للعناية بالنفس.',
    facilitatorId: 'dummy-facilitator-id',
    city: 'عمّان',
  };
  localStorage.setItem('groups', JSON.stringify([group]));
  return group;
}

function ensureDemoEvent() {
  const events = readArray('events');
  const published = events.find((event) => event.status === 'Published');
  if (published) return published;
  const event = {
    id: 'demo-ai-event',
    title: 'لقاء ونس للعناية بالنفس',
    description: 'لقاء تشاركي حول أدوات بسيطة للتواصل والدعم النفسي.',
    groupId: 'demo-ai-group',
    spaceId: 'demo-space-1',
    date: '2026-11-25',
    time: '17:00',
    status: 'Published',
    facilitatorId: 'dummy-id',
  };
  localStorage.setItem('events', JSON.stringify([...events, event]));
  return event;
}

function buildPlan(feeling, helpType) {
  const opening = {
    'قلق وتوتر': 'ابدأ بخطوة بسيطة تمنحك مساحة لتهدئة التوتر وملاحظة ما تحتاجه الآن.',
    'حزن': 'امنح مشاعرك وقتاً ومساحة، واختر تواصلاً آمناً يساعدك على عدم البقاء وحدك.',
    'ضغط نفسي': 'خفف الضغط بتقسيم ما يشغلك إلى خطوات صغيرة وطلب المساندة المناسبة.',
    'أزمات علاقات': 'ابدأ بتحديد ما تحتاجه من العلاقة، وابحث عن مساحة هادئة للاستماع والدعم.',
  }[feeling] || 'ابدأ بخطوة صغيرة تناسب احتياجك الحالي.';
  const nextStep = {
    'التحدث مع مختص': 'تعرّف على أخصائي مناسب واحجز وقتاً أولياً للحديث عن احتياجك.',
    'الانضمام لمجموعة دعم': 'استكشف مجموعة دعم قريبة وشارك بالقدر الذي تشعر معه بالراحة.',
    'حضور فعالية': 'اختر فعالية قادمة وامنح نفسك فرصة للتواصل والتعلم ضمن مساحة آمنة.',
  }[helpType] || 'اختر أحد خيارات الدعم المتاحة وابدأ بالوتيرة المناسبة لك.';
  return { opening, nextStep };
}

function renderRecommendations(city, helpType) {
  recommendations.replaceChildren();
  const specialists = getSpecialistRecommendations(city);

  specialists.forEach((specialist) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    const top = document.createElement('div');
    top.className = 'catalog-card__top';
    createText(top, 'span', 'person-avatar', specialist.name?.trim().charAt(0) || 'أ');
    const identity = document.createElement('div');
    createText(identity, 'h3', '', specialist.name || 'أخصائي');
    createText(identity, 'p', 'status-note', specialist.specialty || specialist.specialization || 'أخصائي دعم نفسي');
    top.append(identity);
    card.append(top);
    createText(card, 'p', 'status-note', `${specialist.city || city} • ${Number(specialist.price) || 0} دينار للجلسة`);
    const actions = document.createElement('div');
    actions.className = 'catalog-card__actions';
    const link = document.createElement('a');
    link.className = 'button';
    link.href = `specialist-details.html?id=${encodeURIComponent(specialist.id)}`;
    link.textContent = 'عرض ملف الأخصائي';
    actions.append(link);
    card.append(actions);
    recommendations.append(card);
  });

  let supportItem;
  let supportType;
  if (helpType === 'حضور فعالية') {
    supportItem = ensureDemoEvent();
    supportType = 'فعالية';
  } else {
    supportItem = ensureDemoGroup();
    supportType = 'مجموعة دعم';
  }

  const supportCard = document.createElement('article');
  supportCard.className = 'catalog-card';
  createText(supportCard, 'span', 'tag', supportType);
  createText(supportCard, 'h3', '', supportItem.title || supportItem.name || supportType);
  createText(supportCard, 'p', 'status-note', supportItem.topic || supportItem.description || 'مساحة آمنة للتواصل والدعم.');
  const supportActions = document.createElement('div');
  supportActions.className = 'catalog-card__actions';
  const supportLink = document.createElement('a');
  supportLink.className = 'button button--secondary';
  supportLink.href = helpType === 'حضور فعالية'
    ? `event-details.html?id=${encodeURIComponent(supportItem.id)}`
    : `group-details.html?id=${encodeURIComponent(supportItem.id)}`;
  supportLink.textContent = helpType === 'حضور فعالية' ? 'عرض الفعالية' : 'عرض المجموعة';
  supportActions.append(supportLink);
  supportCard.append(supportActions);
  recommendations.append(supportCard);
}

assistantForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!assistantForm.reportValidity()) return;

  const formData = new FormData(assistantForm);
  const feeling = String(formData.get('feeling'));
  const city = String(formData.get('city'));
  const helpType = String(formData.get('helpType'));
  assistantMessage.textContent = '';
  assistantForm.hidden = true;
  assistantLoading.hidden = false;

  window.setTimeout(() => {
    const plan = buildPlan(feeling, helpType);
    planSummary.textContent = `${plan.opening} وبما أنك اخترت ${helpType} في ${city}، فهذه بعض الخيارات التي قد تناسبك.`;
    planSteps.replaceChildren();
    createText(planSteps, 'li', '', 'خذ لحظة للتنفس واكتب ما الذي تحتاجه اليوم.');
    createText(planSteps, 'li', '', plan.nextStep);
    createText(planSteps, 'li', '', 'اختر خطوة واحدة فقط، وارجع إلى خطتك متى احتجت إلى ذلك.');
    renderRecommendations(city, helpType);
    assistantLoading.hidden = true;
    assistantResults.hidden = false;
  }, 2000);
});

document.querySelector('#restart-assistant').addEventListener('click', () => {
  assistantResults.hidden = true;
  assistantForm.reset();
  assistantForm.hidden = false;
});
