
import { api } from './api.js';
import { openFacilitatorReview } from './facilitator-review.js';

// Facilitator applications container.
const facilitatorApplicationsContent = document.querySelector(
  '#facilitator-applications-content'
);

// Facilitator applications state.
let currentFacilitatorApplications = [];
let facilitatorCurrentPage = 1;

// Search, filter, and pagination state.
let facilitatorSearch = '';
let facilitatorTopicFilter = '';
let facilitatorPerPage = 10;
let facilitatorPagination = null;
let facilitatorSearchTimeout = null;

// Escape HTML to safely display database values.
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return entities[character];
  });
}

// Display a message inside the applications container.
function showApplicationsMessage(message) {
  if (!facilitatorApplicationsContent) return;

  facilitatorApplicationsContent.innerHTML = `
    <p class="status-note">${escapeHTML(message)}</p>
  `;
}

// Load facilitator applications with search, filter, and pagination.
export async function loadFacilitatorApplications(page = 1) {
  if (!facilitatorApplicationsContent) return;

  facilitatorCurrentPage = page;

  showApplicationsMessage('جاري تحميل طلبات الميسّرين...');

  try {
    const response = await api.get('/facilitator-applications', {
      params: {
        page: facilitatorCurrentPage,
        per_page: facilitatorPerPage,
        search: facilitatorSearch,
        topic: facilitatorTopicFilter,
      },
    });

    facilitatorPagination = response.data.data;

    currentFacilitatorApplications =
      facilitatorPagination.data || [];

    renderFacilitatorApplicationsTable(
      currentFacilitatorApplications
    );

  } catch (error) {
    console.error('Failed to load facilitator applications:', error);

    showApplicationsMessage(
      'حدث خطأ أثناء تحميل طلبات الميسّرين. حاولي مرة أخرى.'
    );
  }
}


function renderFacilitatorApplicationsTable(applications) {
  const pagination = facilitatorPagination || {};
  const currentPage = pagination.current_page || 1;
  const lastPage = pagination.last_page || 1;
  const total = pagination.total || 0;

  facilitatorApplicationsContent.innerHTML = `
    <div class="verification-toolbar">

      <div class="search-box">
        <input
          type="search"
          id="facilitator-search"
          placeholder="ابحث بالاسم أو البريد أو الهاتف..."
          aria-label="البحث عن ميسّر"
          value="${escapeHTML(facilitatorSearch)}"
        >
      </div>

      <div class="search-box">
        <input
          type="text"
          id="facilitator-topic-filter"
          placeholder="فلترة حسب الموضوع..."
          aria-label="الفلترة حسب الموضوع"
          value="${escapeHTML(facilitatorTopicFilter)}"
        >
      </div>

      <select id="facilitator-per-page" aria-label="عدد النتائج في الصفحة">
        <option value="10" ${facilitatorPerPage === 10 ? 'selected' : ''}>10 نتائج</option>
        <option value="25" ${facilitatorPerPage === 25 ? 'selected' : ''}>25 نتيجة</option>
        <option value="50" ${facilitatorPerPage === 50 ? 'selected' : ''}>50 نتيجة</option>
      </select>

    </div>

    ${
      applications.length
        ? `
          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>رقم الهاتف</th>
                  <th>الموضوع المقترح</th>
                  <th>تاريخ التقديم</th>
                  <th>الإجراء</th>
                </tr>
              </thead>

              <tbody>
                ${applications.map((application) => `
                  <tr>
                    <td>${escapeHTML(application.applicant?.name || '-')}</td>
                    <td>${escapeHTML(application.applicant?.email || '-')}</td>
                    <td>${escapeHTML(application.applicant?.phoneNumber || '-')}</td>
                    <td>${escapeHTML(application.proposedTopic || '-')}</td>
                    <td>${new Date(application.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button
                        type="button"
                        class="button button--secondary"
                        data-facilitator-application-id="${Number(application.id)}"
                      >
                        مراجعة الطلب
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `
        : `
          <p class="status-note">
            لا توجد طلبات تطابق البحث أو الفلترة.
          </p>
        `
    }

    <div class="pagination">

      <div class="pagination-info">
        الصفحة ${currentPage} من ${lastPage}
        — إجمالي الطلبات: ${total}
      </div>

      <div class="pagination-buttons">
        <button
          type="button"
          class="button button--secondary"
          data-page="${currentPage - 1}"
          ${currentPage <= 1 ? 'disabled' : ''}
        >
          السابق
        </button>

        <button
          type="button"
          class="button button--secondary"
          data-page="${currentPage + 1}"
          ${currentPage >= lastPage ? 'disabled' : ''}
        >
          التالي
        </button>
      </div>

    </div>
  `;
}


// Handle search with debounce.
facilitatorApplicationsContent.addEventListener('input', (event) => {
  if (event.target.id !== 'facilitator-search') return;

  clearTimeout(facilitatorSearchTimeout);

  facilitatorSearch = event.target.value.trim();

  facilitatorSearchTimeout = setTimeout(() => {
    loadFacilitatorApplications(1);
  }, 400);
});

// Handle filter and results-per-page changes.
facilitatorApplicationsContent.addEventListener('change', (event) => {
  if (event.target.id === 'facilitator-topic-filter') {
    facilitatorTopicFilter = event.target.value.trim();
    loadFacilitatorApplications(1);
  }

  if (event.target.id === 'facilitator-per-page') {
    facilitatorPerPage = Number(event.target.value);
    loadFacilitatorApplications(1);
  }
});

// Handle pagination and review button clicks.
facilitatorApplicationsContent.addEventListener('click', (event) => {
  const pageButton = event.target.closest('button[data-page]');

  if (pageButton) {
    if (pageButton.disabled) return;

    loadFacilitatorApplications(Number(pageButton.dataset.page));
    return;
  }

  const reviewButton = event.target.closest(
    'button[data-facilitator-application-id]'
  );

  if (!reviewButton) return;

  const applicationId = Number(
    reviewButton.dataset.facilitatorApplicationId
  );

  const application = currentFacilitatorApplications.find(
    (item) => item.id === applicationId
  );

  if (!application) return;

  openFacilitatorReview(application, () => {
    loadFacilitatorApplications(facilitatorCurrentPage);
  });
});
