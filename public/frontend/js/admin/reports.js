import { api } from './api.js';

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTargetType = '';
let perPage = 10;
let searchTimeout = null;
let currentReports = [];
let selectedReportId = null;

const reportsContent = document.querySelector('#reports-content');

const statusLabels = {
    Open: 'مفتوح',
    Resolved: 'تمت المعالجة',
    Dismissed: 'مرفوض',
};

const targetTypeLabels = {
    user: 'مستخدم',
    event: 'فعالية',
    group: 'مجموعة',
};

// Escape database values before displaying them in HTML.
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };

        return entities[character];
    });
}

// Display a message inside the reports section.
function showMessage(message) {
    reportsContent.innerHTML = `
    <p class="status-note" style="padding: 2rem 1rem; text-align: center;">
      ${escapeHTML(message)}
    </p>
  `;
}

// Format report creation date.
function formatDate(date) {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('ar-JO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Load reports from the API.
export async function loadReports(page = currentPage) {
    if (!reportsContent) return;

    currentPage = page;
    showMessage('جاري تحميل البلاغات...');

    try {
        const response = await api.get('/reports', {
            params: {
                page: currentPage,
                per_page: perPage,
                search: currentSearch,
                status: currentStatus,
                target_type: currentTargetType,
            },
        });

        const result = response.data.data;

        currentReports = result.data || [];

        renderReports(result);

    } catch (error) {
        console.error('Failed to load reports:', error);

        showMessage(
            error.response?.data?.message || 'تعذر تحميل البلاغات. حاول مرة أخرى.'
        );
    }
}

// Render reports toolbar, table, details, and pagination.
function renderReports(paginationData) {
    const reportsRows = currentReports.map((report) => {
        const reporterName = report.reporter?.name || 'مستخدم محذوف';
        const targetName = report.target_details?.name || 'غير معروف';

        return `
      <tr>
        <td>${escapeHTML(reporterName)}</td>
        <td>${escapeHTML(targetTypeLabels[report.targetType] || report.targetType)}</td>
        <td>${escapeHTML(targetName)}</td>
        <td>${escapeHTML(report.category || '—')}</td>
        <td>${escapeHTML(statusLabels[report.status] || report.status)}</td>
        <td>${escapeHTML(formatDate(report.created_at))}</td>
        <td>
          <div class="table-actions">
            <button
              type="button"
              class="button button--secondary"
              data-report-details="${report.id}">
              التفاصيل
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');

    reportsContent.innerHTML = `
    <div class="verification-toolbar">
      <div class="search-box">
        <input
          type="search"
          id="report-search"
          placeholder="ابحث باسم المبلّغ أو البريد أو الوصف..."
          aria-label="البحث في البلاغات"
          value="${escapeHTML(currentSearch)}">
      </div>

      <select id="report-status-filter" aria-label="فلترة حسب الحالة">
        <option value="">جميع الحالات</option>
        <option value="Open" ${currentStatus === 'Open' ? 'selected' : ''}>مفتوح</option>
        <option value="Resolved" ${currentStatus === 'Resolved' ? 'selected' : ''}>تمت المعالجة</option>
        <option value="Dismissed" ${currentStatus === 'Dismissed' ? 'selected' : ''}>مرفوض</option>
      </select>

      <select id="report-type-filter" aria-label="فلترة حسب نوع البلاغ">
        <option value="">جميع الأنواع</option>
        <option value="user" ${currentTargetType === 'user' ? 'selected' : ''}>مستخدم</option>
        <option value="event" ${currentTargetType === 'event' ? 'selected' : ''}>فعالية</option>
        <option value="group" ${currentTargetType === 'group' ? 'selected' : ''}>مجموعة</option>
      </select>

      <select id="report-per-page" aria-label="عدد النتائج في الصفحة">
        <option value="10" ${perPage === 10 ? 'selected' : ''}>10 نتائج</option>
        <option value="25" ${perPage === 25 ? 'selected' : ''}>25 نتيجة</option>
        <option value="50" ${perPage === 50 ? 'selected' : ''}>50 نتيجة</option>
      </select>
    </div>

    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>المبلّغ</th>
            <th>نوع الهدف</th>
            <th>العنصر المبلّغ عنه</th>
            <th>التصنيف</th>
            <th>الحالة</th>
            <th>تاريخ البلاغ</th>
            <th>الإجراء</th>
          </tr>
        </thead>

        <tbody>
          ${reportsRows || `
            <tr>
              <td colspan="7" class="empty-state">
                لا توجد بلاغات لعرضها.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <div id="report-details-container"></div>

    <div class="pagination">
      <div class="pagination-info">
        عرض ${paginationData.from || 0} إلى ${paginationData.to || 0}
        من أصل ${paginationData.total || 0} بلاغ
      </div>

      <div class="pagination-buttons">
        <button
          type="button"
          class="button button--secondary"
          data-report-page="${paginationData.current_page - 1}"
          ${paginationData.current_page <= 1 ? 'disabled' : ''}>
          السابق
        </button>

        <span>
          الصفحة ${paginationData.current_page || 1}
          من ${paginationData.last_page || 1}
        </span>

        <button
          type="button"
          class="button button--secondary"
          data-report-page="${paginationData.current_page + 1}"
          ${paginationData.current_page >= paginationData.last_page ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

    attachReportEvents();

    if (selectedReportId) {
        const selectedReport = currentReports.find(
            (report) => report.id === selectedReportId
        );

        if (selectedReport) {
            renderReportDetails(selectedReport);
        } else {
            selectedReportId = null;
        }
    }
}

// Display report details and status update controls.
function renderReportDetails(report) {
    const detailsContainer = document.querySelector('#report-details-container');

    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
    <div class="panel" style="margin-top: 1.5rem; padding: 1.5rem;">
      <h3>تفاصيل البلاغ #${report.id}</h3>

      <p><strong>اسم المبلّغ:</strong>
        ${escapeHTML(report.reporter?.name || 'مستخدم محذوف')}
      </p>

      <p><strong>البريد الإلكتروني:</strong>
        ${escapeHTML(report.reporter?.email || '—')}
      </p>

      <p><strong>نوع الهدف:</strong>
        ${escapeHTML(targetTypeLabels[report.targetType] || report.targetType)}
      </p>

      <p><strong>العنصر المبلّغ عنه:</strong>
        ${escapeHTML(report.target_details?.name || 'غير معروف')}
      </p>

      <p><strong>التصنيف:</strong>
        ${escapeHTML(report.category || '—')}
      </p>

      <p><strong>الوصف:</strong></p>
      <p>${escapeHTML(report.description || 'لا يوجد وصف.')}</p>

      <p><strong>الحالة الحالية:</strong>
        ${escapeHTML(statusLabels[report.status] || report.status)}
      </p>

      <div class="verification-toolbar">
        <select id="report-new-status" aria-label="الحالة الجديدة">
          <option value="Open" ${report.status === 'Open' ? 'selected' : ''}>مفتوح</option>
          <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>تمت المعالجة</option>
          <option value="Dismissed" ${report.status === 'Dismissed' ? 'selected' : ''}>مرفوض</option>
        </select>

        <button
          type="button"
          class="button button--primary"
          id="update-report-status"
          data-report-id="${report.id}">
          حفظ الحالة
        </button>

        <button
          type="button"
          class="button button--secondary"
          id="close-report-details">
          إغلاق التفاصيل
        </button>
      </div>

      <p id="report-update-message" class="status-note" aria-live="polite"></p>
    </div>
  `;

    document.querySelector('#update-report-status')
        ?.addEventListener('click', updateReportStatus);

    document.querySelector('#close-report-details')
        ?.addEventListener('click', () => {
            selectedReportId = null;
            detailsContainer.innerHTML = '';
        });
}

// Update report status.
async function updateReportStatus() {
    const button = document.querySelector('#update-report-status');
    const statusSelect = document.querySelector('#report-new-status');
    const message = document.querySelector('#report-update-message');

    if (!button || !statusSelect || !message) return;

    const reportId = button.dataset.reportId;
    const newStatus = statusSelect.value;

    button.disabled = true;
    message.textContent = 'جاري حفظ التغيير...';

    try {
        await api.patch(`/reports/${reportId}/status`, {
            status: newStatus,
        });

        message.textContent = 'تم تحديث حالة البلاغ بنجاح.';
        selectedReportId = Number(reportId);

        await loadReports(currentPage);

    } catch (error) {
        console.error('Failed to update report status:', error);

        message.textContent =
            error.response?.data?.message || 'تعذر تحديث حالة البلاغ.';

        button.disabled = false;
    }
}

// Attach search, filters, pagination, and details events.
function attachReportEvents() {
    const searchInput = document.querySelector('#report-search');
    const statusFilter = document.querySelector('#report-status-filter');
    const typeFilter = document.querySelector('#report-type-filter');
    const perPageSelect = document.querySelector('#report-per-page');

    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            loadReports(1);
        }, 400);
    });

    statusFilter?.addEventListener('change', () => {
        currentStatus = statusFilter.value;
        loadReports(1);
    });

    typeFilter?.addEventListener('change', () => {
        currentTargetType = typeFilter.value;
        loadReports(1);
    });

    perPageSelect?.addEventListener('change', () => {
        perPage = Number(perPageSelect.value);
        loadReports(1);
    });

    reportsContent.querySelectorAll('[data-report-page]').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.disabled) return;

            loadReports(Number(button.dataset.reportPage));
        });
    });

    reportsContent.querySelectorAll('[data-report-details]').forEach((button) => {
        button.addEventListener('click', () => {
            const reportId = Number(button.dataset.reportDetails);

            const report = currentReports.find(
                (item) => item.id === reportId
            );

            if (!report) return;

            selectedReportId = reportId;
            renderReportDetails(report);
        });
    });
}
