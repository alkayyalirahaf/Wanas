import { api } from './admin/api.js';
import { loadFacilitatorApplications } from './admin/facilitators.js';
import { renderPendingUsers } from './admin/specialists.js';
import { loadReports } from './admin/reports.js';
import { loadAllUsers } from './admin/all-users.js';
import { loadGroups } from './admin/groups.js';
import { loadEvents } from './admin/events.js';
import { loadPayments } from './admin/payments.js';

// Admin information and navigation elements
const adminName = document.querySelector('#admin-name');
const logoutButton = document.querySelector('#logout-button');
const navLinks = document.querySelectorAll('[data-section-link]');
const sections = document.querySelectorAll('.admin-section');

// Dashboard statistics elements
const statisticElements = {
  totalUsers: document.querySelector('#total-users'),
  activeSpecialists: document.querySelector('#active-specialists'),
  pendingSpecialists: document.querySelector('#pending-specialists'),
  pendingFacilitators: document.querySelector('#pending-facilitators'),
  openReports: document.querySelector('#open-reports'),
  totalGroups: document.querySelector('#total-groups'),
  totalEvents: document.querySelector('#total-events'),
};

// Dashboard chart elements
const usersChartCanvas = document.querySelector('#users-chart');
const eventsChartCanvas = document.querySelector('#events-chart');

let usersChart = null;
let eventsChart = null;

// Update a dashboard statistic
function setStatistic(element, value) {
  if (element) {
    element.textContent = value ?? 0;
  }
}

// Load administrator information
async function loadAdminInfo() {
  const response = await api.get('/me');
  const admin = response.data.admin;

  if (!admin || admin.role !== 'admin') {
    throw new Error('Unauthorized administrator');
  }

  if (adminName) {
    adminName.textContent = admin.name || 'المدير';
  }
}

// Translate user roles into Arabic
function getRoleLabel(role) {
  const labels = {
    member: 'الأعضاء',
    specialist: 'الأخصائيون',
    facilitator: 'الميسّرون',
    admin: 'الإدارة',
  };

  return labels[role] || role;
}

// Translate event statuses into Arabic
function getEventStatusLabel(status) {
  const labels = {
    Published: 'منشورة',
    Draft: 'مسودة',
    Canceled: 'ملغاة',
    Cancelled: 'ملغاة',
  };

  return labels[status] || status || 'غير محددة';
}

// Render users distribution chart
function renderUsersChart(usersData) {
  if (!usersChartCanvas || typeof Chart === 'undefined') {
    console.error('Users chart canvas or Chart.js was not found.');
    return;
  }

  if (usersChart) {
    usersChart.destroy();
  }

  usersChart = new Chart(usersChartCanvas, {
    type: 'doughnut',
    data: {
      labels: usersData.map((item) => getRoleLabel(item.role)),
      datasets: [{
        label: 'عدد المستخدمين',
        data: usersData.map((item) => item.count),
        backgroundColor: [
          '#6C8EBF',
          '#8CBF9F',
          '#E6B566',
          '#B49AD6',
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });
}

// Render events status chart
function renderEventsChart(eventsData) {
  if (!eventsChartCanvas || typeof Chart === 'undefined') {
    console.error('Events chart canvas or Chart.js was not found.');
    return;
  }

  if (eventsChart) {
    eventsChart.destroy();
  }

  eventsChart = new Chart(eventsChartCanvas, {
    type: 'bar',
    data: {
      labels: eventsData.map((item) => getEventStatusLabel(item.status)),
      datasets: [{
        label: 'عدد الفعاليات',
        data: eventsData.map((item) => item.count),
        backgroundColor: '#8CBF9F',
        borderRadius: 6,
        maxBarThickness: 55,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

// Load dashboard statistics and charts
async function loadDashboardStats() {
  Object.values(statisticElements).forEach((element) => {
    setStatistic(element, '...');
  });

  try {
    const response = await api.get('/stats');
    const { stats, charts } = response.data.data;

    // Update statistic cards
    setStatistic(statisticElements.totalUsers, stats.total_users);
    setStatistic(statisticElements.activeSpecialists, stats.active_specialists);
    setStatistic(statisticElements.pendingSpecialists, stats.pending_specialists);
    setStatistic(statisticElements.pendingFacilitators, stats.pending_facilitators);
    setStatistic(statisticElements.openReports, stats.open_reports);
    setStatistic(statisticElements.totalGroups, stats.total_groups);
    setStatistic(statisticElements.totalEvents, stats.total_events);

    // Update charts
    renderUsersChart(charts.users_by_role || []);
    renderEventsChart(charts.events_by_status || []);
  } catch (error) {
    console.error('Failed to load dashboard statistics:', error);

    Object.values(statisticElements).forEach((element) => {
      setStatistic(element, '—');
    });
  }
}

// Switch between dashboard sections
function showSection(sectionName) {
  window.location.hash = sectionName;

  sections.forEach((section) => {
    section.hidden = section.id !== `section-${sectionName}`;
  });

  navLinks.forEach((link) => {
    const isActive = link.dataset.sectionLink === sectionName;

    link.classList.toggle('dash-link--active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  switch (sectionName) {
    case 'overview':
      loadDashboardStats();
      break;

    case 'users':
      renderPendingUsers();
      break;

    case 'facilitators':
      loadFacilitatorApplications();
      break;

    case 'all-users':
      loadAllUsers(1);
      break;

    case 'groups':
      loadGroups(1);
      break;

    case 'events':
      loadEvents(1);
      break;

    case 'reports':
      loadReports(1);
      break;

    case 'payments':
      loadPayments(1);
      break;
  }
}

// Handle sidebar navigation
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(link.dataset.sectionLink);
  });
});

// Logout administrator
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;

    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('currentUser');

      window.location.replace('admin-login.html');
    }
  });
}

// Initialize dashboard
async function initializeDashboard() {
  if (!sessionStorage.getItem('adminToken')) {
    window.location.replace('admin-login.html');
    return;
  }

  try {
    await loadAdminInfo();

    const allowedSections = [
      'overview',
      'users',
      'facilitators',
      'reports',
      'all-users',
      'groups',
      'events',
      'payments',
    ];

    const sectionFromUrl = window.location.hash.slice(1);
    const initialSection = allowedSections.includes(sectionFromUrl)
      ? sectionFromUrl
      : 'overview';

    showSection(initialSection);
  } catch (error) {
    console.error('Admin authentication failed:', error);

    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('currentUser');

    window.location.replace('admin-login.html');
  }
}

// Start dashboard
initializeDashboard();
