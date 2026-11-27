
import { api } from './api.js';
import {
  openSpecialistReview,
  openVerificationDocument,
  renderSpecialistDocuments,
} from './specialist-review.js';

// Specialist verification page elements.
const pendingContent = document.querySelector('#pending-content');
const specialistSearch = document.querySelector('#specialist-search');
const specialtyFilter = document.querySelector('#specialty-filter');
const verificationPerPage = document.querySelector('#verification-per-page');
const verificationPagination = document.querySelector('#verification-pagination');

// Specialist verification state.
let verificationCurrentPage = 1;
let verificationSearchTimer = null;
let currentSpecialists = [];

// Display a message without using alert().
function showSpecialistMessage(container, message, isError = true) {
  if (!container) return;

  container.innerHTML = '';

  const note = document.createElement('p');
  note.className = 'status-note';
  note.textContent = message;
  note.setAttribute('role', 'status');
  note.setAttribute('aria-live', 'polite');

  if (isError) {
    note.style.color = '#dc2626';
  }

  container.appendChild(note);
}

// Render specialist verification table.
function renderSpecialistsTable(specialists) {
  if (!pendingContent) return;

  if (!specialists.length) {
    showSpecialistMessage(
      pendingContent,
      'لا توجد طلبات توثيق مطابقة للبحث أو الفلاتر المحددة.',
      false
    );
    return;
  }

  const rows = specialists.map((specialist) => {
    const user = specialist.user || {};

    return `
      <tr>
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${escapeHTML(user.phoneNumber || '—')}</td>
        <td>${escapeHTML(specialist.specialty || '—')}</td>
        <td>${renderSpecialistDocuments(user.verification_documents || [])}</td>
        <td>
          <button
            type="button"
            class="button button--secondary"
            data-specialist-id="${Number(specialist.id)}">
            مراجعة الطلب
          </button>
        </td>
      </tr>
    `;
  }).join('');

  pendingContent.innerHTML = `
    <div class="table-responsive">
      <table class="admin-table">
        <thead>
          <tr>
            <th>اسم الأخصائي</th>
            <th>البريد الإلكتروني</th>
            <th>رقم الهاتف</th>
            <th>التخصص</th>
            <th>المستندات</th>
            <th>الإجراء</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Escape values before inserting database content into HTML.
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

// Populate the specialty filter while preserving its selected value.
function populateSpecialtyFilter(specialties) {
  if (!specialtyFilter) return;

  const selectedValue = specialtyFilter.value;

  specialtyFilter.innerHTML = `
    <option value="">جميع التخصصات</option>
    ${specialties.map((specialty) => `
      <option value="${escapeHTML(specialty)}">
        ${escapeHTML(specialty)}
      </option>
    `).join('')}
  `;

  specialtyFilter.value = selectedValue;
}


function renderVerificationPagination(pagination) {
  if (!verificationPagination) return;

  const currentPage = pagination.current_page;
  const lastPage = pagination.last_page;

  verificationPagination.innerHTML = `
    <div class="pagination-info">
      الصفحة ${currentPage} من ${lastPage}
      — إجمالي الطلبات: ${pagination.total}
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
  `;
}

// Load specialist verification requests.
async function loadPendingSpecialists(page = 1) {
  if (!pendingContent) return;

  verificationCurrentPage = page;

  pendingContent.innerHTML = `
    <p class="status-note">جاري تحميل طلبات التوثيق...</p>
  `;

  try {
    const response = await api.get('/specialist-verifications', {
      params: {
        page,
        search: specialistSearch?.value.trim() || '',
        specialty: specialtyFilter?.value || '',
        per_page: verificationPerPage?.value || 10,
      },
    });

    const pagination = response.data.data;
    currentSpecialists = pagination.data || [];

    populateSpecialtyFilter(response.data.specialties || []);
    renderSpecialistsTable(currentSpecialists);
    renderVerificationPagination(pagination);

  } catch (error) {
    console.error('Failed to load specialist requests:', error);

    showSpecialistMessage(
      pendingContent,
      'حدث خطأ أثناء تحميل طلبات التوثيق. حاولي مرة أخرى.'
    );
  }
}

// Load verification requests when opening the section.
export function renderPendingUsers() {
  loadPendingSpecialists(1);
}

// Search with debounce.
specialistSearch?.addEventListener('input', () => {
  clearTimeout(verificationSearchTimer);

  verificationSearchTimer = setTimeout(() => {
    loadPendingSpecialists(1);
  }, 400);
});

// Specialty filter.
specialtyFilter?.addEventListener('change', () => {
  loadPendingSpecialists(1);
});

// Results per page.
verificationPerPage?.addEventListener('change', () => {
  loadPendingSpecialists(1);
});

// Pagination navigation.
verificationPagination?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-page]');

  if (!button || button.disabled) return;

  loadPendingSpecialists(Number(button.dataset.page));
});

// Handle clicks inside the specialist verification section.
pendingContent?.addEventListener('click', (event) => {
  const reviewButton = event.target.closest('button[data-specialist-id]');

  if (reviewButton) {
    const specialist = currentSpecialists.find(
      (item) => item.id === Number(reviewButton.dataset.specialistId)
    );

    if (specialist) {
      openSpecialistReview(specialist, () => {
        loadPendingSpecialists(verificationCurrentPage);
      });
    }

    return;
  }

  const documentButton = event.target.closest('button[data-document-id]');

  if (documentButton) {
    openVerificationDocument(
      documentButton.dataset.documentId,
      pendingContent
    );
  }
});
