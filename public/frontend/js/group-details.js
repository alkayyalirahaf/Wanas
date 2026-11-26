const groupId = new URLSearchParams(window.location.search).get('id');
const groupHero = document.querySelector('#group-hero');
const groupDetailLayout = document.querySelector('#group-detail-layout');
const groupMessage = document.querySelector('#group-message');
const groupEventsSection = document.querySelector('#group-events-section');
const groupEventsContainer = document.querySelector('#group-events');
const joinAction = document.querySelector('#join-action');

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function readCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return 'التاريخ غير محدد';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('ar-EG');
}

function renderGroup(group) {
  const title = group.title || group.name || 'مجموعة دعم';
  const topic = group.topic || 'مساحة آمنة للمشاركة والدعم';
  const city = group.city || 'المدينة غير محددة';
  groupHero.innerHTML = `
    <div class="person-avatar person-avatar--large" aria-hidden="true">${escapeHtml(title.trim().charAt(0) || 'م')}</div>
    <div>
      <span class="tag">مجموعة دعم</span>
      <h1>${escapeHtml(title)}</h1>
      <p class="lede">${escapeHtml(topic)}</p>
      <div class="inline-meta"><span>${escapeHtml(city)}</span></div>
    </div>`;
  document.title = `${title} | ونس`;
  document.querySelector('#group-description').textContent = group.description || topic;
  document.querySelector('#group-topic').textContent = `الموضوع: ${topic}`;
  document.querySelector('#group-city').textContent = `المدينة: ${city}`;
  groupDetailLayout.hidden = false;
  groupEventsSection.hidden = false;
  renderJoinState(group);
  renderGroupEvents(group);
}

function renderJoinState(group) {
  const currentUser = readCurrentUser();
  const groupMembers = readArray('groupMembers');
  const groupMembersForGroup = groupMembers.filter((member) => String(member.groupId) === String(group.id));
  document.querySelector('#group-member-count').textContent = `عدد الأعضاء: ${groupMembersForGroup.length.toLocaleString('ar-EG')}`;
  joinAction.replaceChildren();

  if (!currentUser) {
    const loginLink = document.createElement('a');
    loginLink.className = 'button';
    loginLink.href = 'login.html';
    loginLink.textContent = 'سجل دخول للانضمام';
    joinAction.append(loginLink);
    return;
  }

  const isMember = groupMembersForGroup.some((member) => String(member.userId) === String(currentUser.id));
  const joinButton = document.createElement('button');
  joinButton.className = 'button';
  joinButton.type = 'button';
  joinButton.textContent = isMember ? 'أنت عضو في هذه المجموعة' : 'انضم للمجموعة';
  joinButton.disabled = isMember;
  joinButton.addEventListener('click', () => {
    const members = readArray('groupMembers');
    const alreadyJoined = members.some((member) =>
      String(member.groupId) === String(group.id) && String(member.userId) === String(currentUser.id)
    );
    if (!alreadyJoined) {
      members.push({ groupId: group.id, userId: currentUser.id });
      localStorage.setItem('groupMembers', JSON.stringify(members));
    }
    renderJoinState(group);
  });
  joinAction.append(joinButton);
}

function renderGroupEvents(group) {
  const events = readArray('events').filter((event) =>
    String(event.groupId) === String(group.id) && event.status === 'Published'
  );
  groupEventsContainer.replaceChildren();

  if (!events.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'status-note';
    emptyMessage.textContent = 'لا توجد فعاليات قادمة لهذه المجموعة.';
    groupEventsContainer.append(emptyMessage);
    return;
  }

  events.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'card';
    const body = document.createElement('div');
    body.className = 'card-body';
    const title = document.createElement('h3');
    title.textContent = event.title || event.name || 'فعالية للمجموعة';
    const date = document.createElement('p');
    date.textContent = formatDate(event.date || event.startDate);
    body.append(title, date);
    if (event.description) {
      const description = document.createElement('p');
      description.textContent = event.description;
      body.append(description);
    }
    card.append(body);
    groupEventsContainer.append(card);
  });
}

const group = readArray('groups').find((item) => String(item.id) === String(groupId));
if (!group) {
  groupMessage.textContent = 'لم يتم العثور على هذه المجموعة.';
  groupHero.hidden = true;
} else {
  renderGroup(group);
}
