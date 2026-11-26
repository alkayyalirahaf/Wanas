// Check the provider session before rendering private dashboard data.
let currentUser = null;
try {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
} catch {
  currentUser = null;
}

if (!currentUser || !['specialist', 'owner'].includes(currentUser.role)) {
  window.location.replace('login.html');
} else if (currentUser.status !== 'Active') {
  window.location.replace('complete-profile.html');
} else {
  const isOwner = currentUser.role === 'owner';
  const providerName = document.querySelector('#provider-name');
  const providerRole = document.querySelector('#provider-role');
  const sections = document.querySelectorAll('.provider-section');
  const navLinks = document.querySelectorAll('[data-section-link]');
  const requestsContent = document.querySelector('#requests-content');
  const appointmentsContent = document.querySelector('#appointments-content');
  const spacesContent = document.querySelector('#spaces-content');
  const availabilityContent = document.querySelector('#availability-content');
  const availabilityForm = document.querySelector('#availability-form');
  const availabilityMessage = document.querySelector('#availability-message');
  const spaceForm = document.querySelector('#space-form');
  const spaceMessage = document.querySelector('#space-message');
  const profileForm = document.querySelector('#profile-form');
  const profileMessage = document.querySelector('#profile-message');

  providerName.textContent = currentUser.name || 'مقدم الخدمة';
  providerRole.textContent = isOwner ? 'مالك مساحة' : 'أخصائي';
  document.querySelectorAll('[data-owner-only]').forEach((element) => {
    element.hidden = !isOwner;
  });
  document.querySelectorAll('[data-specialist-only]').forEach((element) => {
    element.hidden = isOwner;
  });
  document.querySelector('#pending-stat-card').hidden = !isOwner;
  document.querySelector('#availability-stat-card').hidden = isOwner;
  document.querySelector('#specialty-field').hidden = isOwner;
  document.querySelector('#price-field').hidden = isOwner;
  document.querySelector('#profile-specialty').required = !isOwner;
  document.querySelector('#profile-price').required = !isOwner;
  if (isOwner) {
    document.querySelector('#appointments-link').textContent = 'حجوزات المساحة';
    document.querySelector('#appointments-title').textContent = 'حجوزات المساحة';
    document.querySelector('#confirmed-stat-label').textContent = 'إجمالي الحجوزات المؤكدة';
    document.querySelector('#section-appointments .table-card h2').textContent = 'الحجوزات المؤكدة للمساحة';
    document.querySelector('#section-appointments .dash-top .eyebrow').textContent = 'حجوزاتك';
  }

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

  function formatMoney(value) {
    const amount = Number(value) || 0;
    return `${amount.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} د.أ`;
  }

  function formatDate(value) {
    if (!value) return 'غير محدد';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('ar-EG');
  }

  function customerName(booking) {
    if (booking.userName || booking.customerName || booking.clientName) {
      return booking.userName || booking.customerName || booking.clientName;
    }
    const user = readArray('users').find((candidate) => String(candidate.id) === String(booking.userId));
    return user?.name || 'غير محدد';
  }

  function providerBookings() {
    return readArray('bookings').filter((booking) => String(booking.providerId) === String(currentUser.id));
  }

  function renderOverview() {
    const bookings = providerBookings();
    const confirmed = bookings.filter((booking) => booking.status === 'Confirmed');
    const pendingCount = bookings.filter((booking) => booking.status === 'Pending').length;
    const gross = confirmed.reduce((sum, booking) => sum + (Number(booking.amount) || 0), 0);
    const net = gross * 0.92;

    document.querySelector('#confirmed-count').textContent = confirmed.length.toLocaleString('ar-EG');
    document.querySelector('#pending-count').textContent = pendingCount.toLocaleString('ar-EG');
    document.querySelector('#net-earnings').textContent = formatMoney(net);
    if (!isOwner) {
      const availableCount = readArray('slots').filter((slot) =>
        String(slot.specialistId) === String(currentUser.id) && slot.status === 'Available'
      ).length;
      document.querySelector('#availability-count').textContent = availableCount.toLocaleString('ar-EG');
    }
  }

  function emptyMessage(text) {
    return `<p class="status-note" style="padding: 2rem 1rem; text-align: center;">${text}</p>`;
  }

  function renderRequests() {
    if (!isOwner) return;
    const requests = providerBookings().filter((booking) => booking.status === 'Pending');
    if (requests.length === 0) {
      requestsContent.innerHTML = emptyMessage('لا توجد طلبات حجز معلقة حالياً.');
      return;
    }

    const rows = requests.map((booking) => `
      <tr>
        <td>${escapeHtml(customerName(booking))}</td>
        <td>${escapeHtml(formatDate(booking.date))}</td>
        <td class="actions">
          <button class="button button--small" type="button" data-booking-action="approve" data-booking-id="${escapeHtml(booking.id)}">قبول</button>
          <button class="button button--small button--secondary" type="button" data-booking-action="reject" data-booking-id="${escapeHtml(booking.id)}">رفض</button>
        </td>
      </tr>`).join('');

    requestsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">اسم العميل</th><th scope="col">التاريخ</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderAppointments() {
    const appointments = providerBookings().filter((booking) => booking.status === 'Confirmed');
    if (appointments.length === 0) {
      appointmentsContent.innerHTML = emptyMessage('لا توجد مواعيد مؤكدة حالياً.');
      return;
    }

    const rows = appointments.map((booking) => {
      const gross = Number(booking.amount) || 0;
      const net = gross * 0.92;
      return `
        <tr>
          <td>${escapeHtml(customerName(booking))}</td>
          <td>${escapeHtml(formatDate(booking.date))}</td>
          <td>${escapeHtml(formatMoney(gross))}</td>
          <td>${escapeHtml(formatMoney(net))}</td>
          <td class="actions"><button class="button button--small button--secondary" type="button" data-booking-action="cancel" data-booking-id="${escapeHtml(booking.id)}">إلغاء</button></td>
        </tr>`;
    }).join('');

    appointmentsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">${isOwner ? 'اسم المستخدم' : 'اسم العميل'}</th><th scope="col">التاريخ</th><th scope="col">${isOwner ? 'المبلغ' : 'المبلغ الإجمالي'}</th><th scope="col">صافي الربح</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderSpaces() {
    if (!isOwner) return;
    const spaces = readArray('spaces').filter((space) => String(space.ownerId) === String(currentUser.id));
    if (spaces.length === 0) {
      spacesContent.innerHTML = emptyMessage('لم تضف أي مساحة بعد.');
      return;
    }

    const rows = spaces.map((space) => `
      <tr>
        <td>${escapeHtml(space.name || '—')}</td>
        <td>${escapeHtml(space.capacity ?? '—')}</td>
        <td>${escapeHtml(formatMoney(space.price))}</td>
        <td class="actions"><button class="button button--small button--secondary" type="button" data-space-action="delete" data-space-id="${escapeHtml(space.id)}">حذف</button></td>
      </tr>`).join('');

    spacesContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">اسم المساحة</th><th scope="col">السعة</th><th scope="col">السعر</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderAvailability() {
    if (isOwner) return;
    const slots = readArray('slots').filter((slot) => String(slot.specialistId) === String(currentUser.id));
    if (!slots.length) {
      availabilityContent.innerHTML = emptyMessage('لم تضف أوقاتاً متاحة بعد.');
      return;
    }

    const rows = slots.map((slot) => `
      <tr>
        <td>${escapeHtml(formatDate(slot.date))}</td>
        <td>${escapeHtml(slot.time || 'غير محدد')}</td>
        <td><span class="badge">${escapeHtml(slot.status || 'Available') === 'Available' ? 'متاح' : escapeHtml(slot.status)}</span></td>
        <td class="actions"><button class="button button--small button--secondary" type="button" data-slot-action="delete" data-slot-id="${escapeHtml(slot.id)}">حذف</button></td>
      </tr>`).join('');

    availabilityContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">التاريخ</th><th scope="col">الوقت</th><th scope="col">الحالة</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
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
    if (name === 'requests') renderRequests();
    if (name === 'appointments') renderAppointments();
    if (name === 'spaces') renderSpaces();
    if (name === 'availability') renderAvailability();
    if (name === 'profile') renderProfile();
  }

  function renderProfile() {
    const users = readArray('users');
    const savedUser = users.find((user) => String(user.id) === String(currentUser.id)) || currentUser;
    document.querySelector('#profile-name').value = savedUser.name || '';
    if (!isOwner) {
      document.querySelector('#profile-specialty').value = savedUser.specialty || savedUser.specialization || '';
      document.querySelector('#profile-price').value = savedUser.price ?? '';
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.hidden) return;
      showSection(link.dataset.sectionLink);
    });
  });

  function updateBookingStatus(bookingId, status) {
    const bookings = readArray('bookings');
    const booking = bookings.find((item) => String(item.id) === String(bookingId) && String(item.providerId) === String(currentUser.id));
    if (!booking) return;
    booking.status = status;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    renderOverview();
    renderRequests();
    renderAppointments();
  }

  requestsContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-booking-action][data-booking-id]');
    if (!button) return;
    updateBookingStatus(button.dataset.bookingId, button.dataset.bookingAction === 'approve' ? 'Confirmed' : 'Refunded');
  });

  appointmentsContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-booking-action="cancel"][data-booking-id]');
    if (!button) return;
    updateBookingStatus(button.dataset.bookingId, 'Refunded');
  });

  document.querySelector('#add-space-button').addEventListener('click', () => {
    spaceForm.hidden = false;
    spaceForm.elements.name.focus();
  });

  document.querySelector('#cancel-space-button').addEventListener('click', () => {
    spaceForm.reset();
    spaceForm.hidden = true;
    spaceMessage.textContent = '';
  });

  spaceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isOwner || !spaceForm.reportValidity()) return;
    const formData = new FormData(spaceForm);
    const spaces = readArray('spaces');
    spaces.push({
      id: globalThis.crypto?.randomUUID?.() || `space-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ownerId: currentUser.id,
      name: String(formData.get('name')).trim(),
      capacity: Number(formData.get('capacity')),
      price: Number(formData.get('price')),
    });
    localStorage.setItem('spaces', JSON.stringify(spaces));
    spaceForm.reset();
    spaceForm.hidden = true;
    spaceMessage.textContent = '';
    renderSpaces();
  });

  spacesContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-space-action="delete"][data-space-id]');
    if (!button) return;
    const spaces = readArray('spaces').filter((space) => !(String(space.id) === button.dataset.spaceId && String(space.ownerId) === String(currentUser.id)));
    localStorage.setItem('spaces', JSON.stringify(spaces));
    renderSpaces();
  });

  availabilityForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isOwner || !availabilityForm.reportValidity()) return;
    const formData = new FormData(availabilityForm);
    const slots = readArray('slots');
    slots.push({
      id: globalThis.crypto?.randomUUID?.() || `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      specialistId: currentUser.id,
      date: String(formData.get('date')),
      time: String(formData.get('time')),
      status: 'Available',
    });
    localStorage.setItem('slots', JSON.stringify(slots));
    availabilityForm.reset();
    availabilityMessage.textContent = 'تمت إضافة الوقت المتاح.';
    availabilityMessage.classList.add('form-message--ok');
    renderAvailability();
    renderOverview();
  });

  availabilityContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slot-action="delete"][data-slot-id]');
    if (!button) return;
    const slots = readArray('slots').filter((slot) =>
      !(String(slot.id) === button.dataset.slotId && String(slot.specialistId) === String(currentUser.id))
    );
    localStorage.setItem('slots', JSON.stringify(slots));
    renderAvailability();
    renderOverview();
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;

    const users = readArray('users');
    const index = users.findIndex((user) => String(user.id) === String(currentUser.id));
    if (index === -1) {
      profileMessage.textContent = 'تعذر العثور على حسابك. سجّل الدخول مجدداً.';
      return;
    }

    const updatedUser = {
      ...users[index],
      name: document.querySelector('#profile-name').value.trim(),
    };
    if (!isOwner) {
      updatedUser.specialty = String(document.querySelector('#profile-specialty').value).trim();
      updatedUser.price = Number(document.querySelector('#profile-price').value);
    }
    users[index] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = updatedUser;
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    providerName.textContent = updatedUser.name;
    profileMessage.textContent = 'تم حفظ بيانات ملفك الشخصي.';
    profileMessage.classList.add('form-message--ok');
  });

  document.querySelector('#logout-button').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.assign('login.html');
  });

  // Overview is the default section for provider accounts.
  renderProfile();
  renderOverview();
  showSection('overview');
}
