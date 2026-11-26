// Verify the administrator session before initializing any dashboard content.
let currentUser = null;
try {
  currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
} catch {
  currentUser = null;
}

if (!currentUser || currentUser.role !== 'admin') {
  window.location.replace('admin-login.html');
} else {
  const adminName = document.querySelector('#admin-name');
  const logoutButton = document.querySelector('#logout-button');
  const pendingContent = document.querySelector('#pending-content');
  const facilitatorApplicationsContent = document.querySelector('#facilitator-applications-content');
  const eventsContent = document.querySelector('#events-content');
  const allUsersContent = document.querySelector('#all-users-content');
  const reportsContent = document.querySelector('#reports-content');
  const navLinks = document.querySelectorAll('[data-section-link]');
  const sections = document.querySelectorAll('.admin-section');

  adminName.textContent = currentUser.name || 'المدير';

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

  function formatDate(value) {
    if (!value) return 'غير محدد';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('ar-EG');
  }

  function formatSubmissionDate(value) {
    if (!value) return 'غير محدد';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'غير محدد' : date.toLocaleDateString('ar-EG');
  }

  function renderOverview() {
    const users = readArray('users');
    const events = readArray('events');
    const bookings = readArray('bookings');
    const publishedEvents = events.filter((event) =>
      event.published === true || ['Published', 'منشورة'].includes(event.status)
    ).length;

    document.querySelector('#total-users').textContent = users.length.toLocaleString('ar-EG');
    document.querySelector('#published-events').textContent = publishedEvents.toLocaleString('ar-EG');
    document.querySelector('#total-bookings').textContent = bookings.length.toLocaleString('ar-EG');
  }

  function renderPendingUsers() {
    const pendingUsers = readArray('users').filter((user) =>
      ['specialist', 'owner'].includes(user.role) && user.status === 'Pending'
    );

    if (pendingUsers.length === 0) {
      pendingContent.innerHTML = '<p class="status-note" style="padding: 2rem 1rem; text-align: center;">لا يوجد طلبات توثيق معلقة حالياً.</p>';
      return;
    }

    const rows = pendingUsers.map((user) => `
      <tr>
        <td>${escapeHtml(user.name || '—')}</td>
        <td>${escapeHtml(user.email || '—')}</td>
        <td><span class="badge badge--pending">${user.role === 'specialist' ? 'أخصائي' : 'مالك مساحة'}</span></td>
        <td>${escapeHtml(formatSubmissionDate(user.submittedAt))}</td>
        <td class="actions">
          <button class="button button--small" type="button" data-action="approve" data-user-id="${escapeHtml(user.id)}">قبول</button>
          <button class="button button--small button--secondary" type="button" data-action="reject" data-user-id="${escapeHtml(user.id)}">رفض</button>
        </td>
      </tr>
    `).join('');

    pendingContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">الاسم</th><th scope="col">البريد الإلكتروني</th><th scope="col">الدور</th><th scope="col">تاريخ التقديم</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderFacilitatorApplications() {
    const applications = readArray('facilitatorApplications');
    const pendingApplications = applications
      .map((application, index) => ({ application, index }))
      .filter(({ application }) => application.status === 'Pending');

    if (pendingApplications.length === 0) {
      facilitatorApplicationsContent.innerHTML = '<p class="status-note" style="padding: 2rem 1rem; text-align: center;">لا توجد طلبات ميسرين معلقة حالياً.</p>';
      return;
    }

    const users = readArray('users');
    const rows = pendingApplications.map(({ application, index }) => {
      const applicant = users.find((user) => String(user.id) === String(application.userId));
      return `
        <tr>
          <td>${escapeHtml(application.applicantName || applicant?.name || '—')}</td>
          <td>${escapeHtml(applicant?.email || application.email || '—')}</td>
          <td>${escapeHtml(formatSubmissionDate(application.submittedAt))}</td>
          <td class="actions">
            <button class="button button--small" type="button" data-action="approve-facilitator" data-application-index="${index}">قبول</button>
            <button class="button button--small button--secondary" type="button" data-action="reject-facilitator" data-application-index="${index}">رفض</button>
          </td>
        </tr>`;
    }).join('');

    facilitatorApplicationsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">اسم المتقدم</th><th scope="col">البريد الإلكتروني</th><th scope="col">تاريخ التقديم</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function getOrganizer(event) {
    const directName = event.organizerName || event.organizer || event.ownerName || event.providerName;
    if (directName && typeof directName === 'object') {
      return directName.name || directName.email || 'غير محدد';
    }
    if (directName) return directName;

    const organizerId = event.organizerId || event.ownerId || event.providerId || event.userId;
    const organizer = readArray('users').find((user) => String(user.id) === String(organizerId));
    return organizer?.name || 'غير محدد';
  }

  function renderEvents() {
    const events = readArray('events');
    if (events.length === 0) {
      eventsContent.innerHTML = '<p class="status-note" style="padding: 2rem 1rem; text-align: center;">لا توجد فعاليات حالياً.</p>';
      return;
    }

    const rows = events.map((event, index) => `
      <tr>
        <td>${escapeHtml(event.title || event.name || '—')}</td>
        <td>${escapeHtml(getOrganizer(event))}</td>
        <td>${escapeHtml(formatDate(event.date || event.startDate))}</td>
        <td><span class="badge ${event.status === 'Published' || event.status === 'منشورة' ? '' : 'badge--pending'}">${escapeHtml(event.status || 'غير محددة')}</span></td>
        <td class="actions"><button class="button button--small button--secondary" type="button" data-action="delete-event" data-event-index="${index}">حذف</button></td>
      </tr>
    `).join('');

    eventsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">عنوان الفعالية</th><th scope="col">المنظم</th><th scope="col">التاريخ</th><th scope="col">الحالة</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function displayRole(role) {
    const labels = { member: 'عضو', facilitator: 'ميسّر', specialist: 'أخصائي', owner: 'مالك مساحة', admin: 'مدير' };
    return labels[role] || role || 'غير محدد';
  }

  function displayStatus(status) {
    const labels = { Active: 'نشط', Pending: 'قيد المراجعة', Rejected: 'مرفوض', Blocked: 'محظور' };
    return labels[status] || status || 'غير محدد';
  }

  function renderAllUsers() {
    const users = readArray('users');
    if (!users.length) {
      allUsersContent.innerHTML = '<p class="status-note" style="padding: 2rem 1rem; text-align: center;">لا يوجد مستخدمون حالياً.</p>';
      return;
    }

    const rows = users.map((user, index) => `
      <tr>
        <td>${escapeHtml(user.name || '—')}</td>
        <td>${escapeHtml(user.email || '—')}</td>
        <td>${escapeHtml(displayRole(user.role))}</td>
        <td><span class="badge ${user.status === 'Blocked' ? 'badge--declined' : user.status === 'Pending' ? 'badge--pending' : ''}">${escapeHtml(displayStatus(user.status))}</span></td>
        <td class="actions"><button class="button button--small button--secondary" type="button" data-action="block-user" data-user-index="${index}" ${user.status === 'Blocked' ? 'disabled' : ''}>${user.status === 'Blocked' ? 'محظور' : 'حظر'}</button></td>
      </tr>
    `).join('');

    allUsersContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">الاسم</th><th scope="col">البريد الإلكتروني</th><th scope="col">الدور</th><th scope="col">الحالة</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function renderReports() {
    const reports = readArray('reports');
    if (!reports.length) {
      reportsContent.innerHTML = '<p class="status-note" style="padding: 2rem 1rem; text-align: center;">لا توجد بلاغات حالياً</p>';
      return;
    }

    const users = readArray('users');
    const rows = reports.map((report, index) => {
      const reporterId = report.reporterId || report.userId;
      const reporter = report.reporterName || report.reporter || report.userName || users.find((user) => String(user.id) === String(reporterId))?.name || 'غير محدد';
      const reporterName = typeof reporter === 'object' ? reporter.name || reporter.email || 'غير محدد' : reporter;
      return `
        <tr>
          <td>${escapeHtml(reporterName)}</td>
          <td>${escapeHtml(report.type || report.reportType || 'غير محدد')}</td>
          <td>${escapeHtml(report.details || report.description || '—')}</td>
          <td><span class="badge ${report.status === 'Resolved' ? '' : 'badge--pending'}">${escapeHtml(report.status === 'Resolved' ? 'تم الحل' : report.status || 'قيد المراجعة')}</span></td>
          <td class="actions">
            <button class="button button--small" type="button" data-action="resolve-report" data-report-index="${index}" ${report.status === 'Resolved' ? 'disabled' : ''}>تم الحل</button>
            <button class="button button--small button--secondary" type="button" data-action="delete-report" data-report-index="${index}">حذف</button>
          </td>
        </tr>`;
    }).join('');

    reportsContent.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th scope="col">المُبلغ</th><th scope="col">نوع البلاغ</th><th scope="col">التفاصيل</th><th scope="col">الحالة</th><th scope="col">الإجراءات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function showSection(sectionName) {
    sections.forEach((section) => {
      section.hidden = section.id !== `section-${sectionName}`;
    });
    navLinks.forEach((link) => {
      const isActive = link.dataset.sectionLink === sectionName;
      link.classList.toggle('dash-link--active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (sectionName === 'overview') renderOverview();
    if (sectionName === 'users') renderPendingUsers();
    if (sectionName === 'facilitators') renderFacilitatorApplications();
    if (sectionName === 'all-users') renderAllUsers();
    if (sectionName === 'events') renderEvents();
    if (sectionName === 'reports') renderReports();
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showSection(link.dataset.sectionLink);
    });
  });

  pendingContent.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action][data-user-id]');
    if (!button) return;

    const users = readArray('users');
    const index = users.findIndex((user) => String(user.id) === button.dataset.userId);
    if (index === -1) {
      renderPendingUsers();
      return;
    }

    users[index] = { ...users[index], status: button.dataset.action === 'approve' ? 'Active' : 'Rejected' };
    localStorage.setItem('users', JSON.stringify(users));
    renderPendingUsers();
  });

  facilitatorApplicationsContent.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action][data-application-index]');
    if (!button) return;

    const applications = readArray('facilitatorApplications');
    const applicationIndex = Number(button.dataset.applicationIndex);
    const application = applications[applicationIndex];
    if (!application || application.status !== 'Pending') {
      renderFacilitatorApplications();
      return;
    }

    const users = readArray('users');
    if (button.dataset.action === 'approve-facilitator') {
      applications[applicationIndex] = { ...application, status: 'Approved' };
      const userIndex = users.findIndex((user) => String(user.id) === String(application.userId));
      if (userIndex !== -1 && users[userIndex].role === 'member') {
        users[userIndex] = { ...users[userIndex], role: 'facilitator' };
      }
      localStorage.setItem('users', JSON.stringify(users));
      // Refresh this tab's session only when it belongs to the approved user.
      // In normal admin use this remains the administrator's own session.
      const sessionUser = (() => {
        try {
          return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        } catch {
          return null;
        }
      })();
      if (userIndex !== -1 && String(sessionUser?.id) === String(users[userIndex].id)) {
        sessionStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
      }
      renderAllUsers();
    } else if (button.dataset.action === 'reject-facilitator') {
      applications[applicationIndex] = { ...application, status: 'Rejected' };
    } else {
      return;
    }

    localStorage.setItem('facilitatorApplications', JSON.stringify(applications));
    renderFacilitatorApplications();
  });

  allUsersContent.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="block-user"]');
    if (!button) return;
    const users = readArray('users');
    const userIndex = Number(button.dataset.userIndex);
    if (!users[userIndex]) return;
    users[userIndex] = { ...users[userIndex], status: 'Blocked' };
    localStorage.setItem('users', JSON.stringify(users));
    renderAllUsers();
    renderOverview();
  });

  reportsContent.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action][data-report-index]');
    if (!button) return;
    const reports = readArray('reports');
    const reportIndex = Number(button.dataset.reportIndex);
    if (!reports[reportIndex]) return;

    if (button.dataset.action === 'resolve-report') {
      reports[reportIndex] = { ...reports[reportIndex], status: 'Resolved' };
    } else if (button.dataset.action === 'delete-report') {
      if (!window.confirm('هل تريد حذف هذا البلاغ؟')) return;
      reports.splice(reportIndex, 1);
    } else {
      return;
    }

    localStorage.setItem('reports', JSON.stringify(reports));
    renderReports();
  });

  eventsContent.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="delete-event"]');
    if (!button) return;
    if (!window.confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;

    const events = readArray('events');
    events.splice(Number(button.dataset.eventIndex), 1);
    localStorage.setItem('events', JSON.stringify(events));
    renderEvents();
    renderOverview();
  });



  //logout
  logoutButton.addEventListener('click', async () => {
    const token = sessionStorage.getItem('adminToken');

    try {
      await axios.post('/api/admin/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

    } catch (error) {
      console.error('Logout failed:', error);

    } finally {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('currentUser');

      window.location.assign('admin-login.html');
    }
  });

  // The overview is the default section whenever the dashboard is opened.
  renderOverview();
  showSection('overview');
}
