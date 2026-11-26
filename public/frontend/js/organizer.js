// Protect the facilitator dashboard before reading or rendering private data.
let currentUser = null;
try {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
} catch {
  currentUser = null;
}

if (!currentUser || currentUser.role !== 'facilitator') {
  window.location.replace('login.html');
} else {
  const organizerName = document.querySelector('#organizer-name');
  const navLinks = document.querySelectorAll('[data-section-link]');
  const sections = document.querySelectorAll('.organizer-section');
  const groupsContent = document.querySelector('#groups-content');
  const eventsContent = document.querySelector('#events-content');
  const groupForm = document.querySelector('#group-form');
  const groupMessage = document.querySelector('#group-message');
  const eventForm = document.querySelector('#event-form');
  const eventSpace = document.querySelector('#event-space');
  const eventGroup = document.querySelector('#event-group');
  const eventMessage = document.querySelector('#event-message');
  const createEventButton = document.querySelector('#create-event-button');

  organizerName.textContent = currentUser.name || 'الميسّر';

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

  function facilitatorGroups() {
    return readArray('groups').filter((group) => String(group.facilitatorId) === String(currentUser.id));
  }

  function facilitatorEvents() {
    return readArray('events').filter((event) => String(event.facilitatorId) === String(currentUser.id));
  }

  function statusLabel(status) {
    return ({
      Draft: 'مسودة',
      'Pending Space Approval': 'بانتظار موافقة صاحب المساحة',
      Published: 'منشورة',
    })[status] || status || 'غير محددة';
  }

  function formatDate(value) {
    if (!value) return 'غير محدد';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('ar-EG');
  }

  function renderOverview() {
    const events = facilitatorEvents();
    document.querySelector('#groups-count').textContent = facilitatorGroups().length.toLocaleString('ar-EG');
    document.querySelector('#published-events-count').textContent = events.filter((event) => event.status === 'Published').length.toLocaleString('ar-EG');
    document.querySelector('#pending-events-count').textContent = events.filter((event) => event.status === 'Pending Space Approval').length.toLocaleString('ar-EG');
  }

  function emptyMessage(message) {
    return `<p class="status-note" style="padding: 2rem 1rem; text-align: center;">${message}</p>`;
  }

  function renderGroups() {
    const groups = facilitatorGroups();
    if (!groups.length) {
      groupsContent.innerHTML = emptyMessage('لم تنشئ أي مجموعات بعد.');
      return;
    }

    const rows = groups.map((group) => `
      <tr>
        <td>${escapeHtml(group.title || '—')}</td>
        <td>${escapeHtml(group.topic || '—')}</td>
        <td>${escapeHtml(group.city || '—')}</td>
      </tr>`).join('');
    groupsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">اسم المجموعة</th><th scope="col">الموضوع</th><th scope="col">المدينة</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderGroupOptions() {
    const groups = facilitatorGroups();
    const placeholder = groups.length ? 'اختر المجموعة' : 'لا توجد مجموعات، أنشئ مجموعة أولاً';
    eventGroup.innerHTML = `<option value="">${placeholder}</option>` + groups.map((group) => `
      <option value="${escapeHtml(group.id)}">${escapeHtml(group.title || 'مجموعة')}</option>
    `).join('');
  }

  function renderEvents() {
    const events = facilitatorEvents();
    if (!events.length) {
      eventsContent.innerHTML = emptyMessage('لم تنشئ أي فعاليات بعد.');
      return;
    }

    const rows = events.map((event) => `
      <tr>
        <td>${escapeHtml(event.title || '—')}</td>
        <td>${escapeHtml(formatDate(event.date))}${event.time ? ` — ${escapeHtml(event.time)}` : ''}</td>
        <td><span class="badge ${event.status === 'Pending Space Approval' ? 'badge--pending' : ''}">${escapeHtml(statusLabel(event.status))}</span></td>
        <td>—</td>
      </tr>`).join('');
    eventsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">عنوان الفعالية</th><th scope="col">التاريخ</th><th scope="col">الحالة</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderSpaceOptions() {
    const spaces = readArray('spaces').filter((space) => !space.status || space.status === 'Active');
    eventSpace.innerHTML = '<option value="">اختر المساحة</option>' + spaces.map((space) => {
      const price = Number(space.pricePerHour ?? space.price);
      const priceLabel = Number.isFinite(price) ? `${price.toLocaleString('ar-EG')} د.أ / ساعة` : 'السعر غير محدد';
      return `<option value="${escapeHtml(space.id)}">${escapeHtml(space.title || space.name || 'مساحة')} — ${escapeHtml(priceLabel)}</option>`;
    }).join('');
    renderGroupOptions();
    const hasGroups = facilitatorGroups().length > 0;
    createEventButton.disabled = spaces.length === 0 || !hasGroups;
    if (!spaces.length) {
      eventMessage.textContent = 'لا توجد مساحات متاحة حالياً. يرجى التواصل مع الإدارة.';
    } else if (!hasGroups) {
      eventMessage.textContent = 'أنشئ مجموعة أولاً لتتمكن من ربطها بالفعالية.';
    } else {
      eventMessage.textContent = '';
    }
  }

  function showSection(name) {
    sections.forEach((section) => { section.hidden = section.id !== `section-${name}`; });
    navLinks.forEach((link) => {
      const active = link.dataset.sectionLink === name;
      link.classList.toggle('dash-link--active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (name === 'overview') renderOverview();
    if (name === 'groups') renderGroups();
    if (name === 'events') renderEvents();
    if (name === 'create-event') renderSpaceOptions();
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(link.dataset.sectionLink);
    });
  });

  document.querySelector('#show-group-form').addEventListener('click', () => {
    groupForm.hidden = false;
    groupForm.elements.title.focus();
  });

  document.querySelector('#cancel-group-form').addEventListener('click', () => {
    groupForm.reset();
    groupForm.hidden = true;
    groupMessage.textContent = '';
    groupMessage.classList.remove('form-message--ok');
  });

  groupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!groupForm.reportValidity()) return;

    const formData = new FormData(groupForm);
    const groups = readArray('groups');
    groups.push({
      id: globalThis.crypto?.randomUUID?.() || `group-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: String(formData.get('title') || '').trim(),
      topic: String(formData.get('topic') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      facilitatorId: currentUser.id,
      status: 'Active',
    });
    localStorage.setItem('groups', JSON.stringify(groups));
    groupForm.reset();
    groupForm.hidden = true;
    groupMessage.textContent = 'تم إنشاء المجموعة بنجاح.';
    groupMessage.classList.add('form-message--ok');
    renderGroups();
    renderGroupOptions();
    renderOverview();
  });

  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!eventForm.reportValidity()) return;

    const formData = new FormData(eventForm);
    const spaceId = String(formData.get('spaceId') || '');
    const groupId = String(formData.get('groupId') || '');
    const spaces = readArray('spaces').filter((item) => !item.status || item.status === 'Active');
    const space = spaces.find((item) => String(item.id) === spaceId);
    const group = facilitatorGroups().find((item) => String(item.id) === groupId);
    if (!space || !group) {
      eventMessage.textContent = !space
        ? 'تعذر العثور على المساحة المختارة. حدّث القائمة وحاول مجدداً.'
        : 'اختر مجموعة تابعة لك لهذه الفعالية.';
      eventMessage.classList.remove('form-message--ok');
      return;
    }

    const id = globalThis.crypto?.randomUUID?.() || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const date = String(formData.get('date'));
    const time = String(formData.get('time'));
    const events = readArray('events');
    events.push({
      id,
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      facilitatorId: currentUser.id,
      groupId: group.id,
      spaceId: space.id,
      date,
      time,
      status: 'Pending Space Approval',
    });

    const bookings = readArray('bookings');
    bookings.push({
      id: globalThis.crypto?.randomUUID?.() || `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: currentUser.id,
      providerId: space.ownerId,
      spaceId: space.id,
      type: 'event',
      status: 'Pending',
      date,
      time,
      eventId: id,
    });

    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('bookings', JSON.stringify(bookings));
    eventForm.reset();
    eventMessage.textContent = 'تم إنشاء الفعالية وإرسال طلب حجز المساحة. بانتظار موافقة صاحب المساحة.';
    eventMessage.classList.add('form-message--ok');
    renderEvents();
    renderOverview();
  });

  document.querySelector('#logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.assign('login.html');
  });

  renderOverview();
  showSection('overview');
}
