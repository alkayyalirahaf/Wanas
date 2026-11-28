
import { api } from './api.js';

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentTargetType = '';
let perPage = 10;
let searchTimeout = null;
let currentReports = [];
let selectedReportId = null;
let updateMessage = '';

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

// Add modal styles once.
function addModalStyles() {
    if (document.querySelector('#report-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'report-modal-styles';

    style.textContent = `
        .report-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.55);
        }

        .report-modal {
            width: 100%;
            max-width: 650px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
            background: var(--card-bg, #fff);
            color: var(--text-color, #222);
            border-radius: 14px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .report-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 20px;
        }

        .report-modal-header h3 {
            margin: 0;
        }

        .report-modal-close {
            border: none;
            background: transparent;
            font-size: 26px;
            cursor: pointer;
            color: inherit;
            line-height: 1;
        }

        .report-modal-details {
            display: grid;
            gap: 14px;
        }

        .report-modal-details p {
            margin: 0;
            line-height: 1.7;
            overflow-wrap: anywhere;
        }

        .report-modal-description {
            padding: 12px;
            border-radius: 8px;
            background: rgba(128, 128, 128, 0.08);
            white-space: pre-wrap;
        }

        .report-modal-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
        }

        .report-modal-actions select {
            min-width: 150px;
        }

        .report-modal-message {
            margin-top: 14px;
        }

        @media (max-width: 600px) {
            .report-modal {
                padding: 18px;
            }

            .report-modal-actions {
                flex-direction: column;
                align-items: stretch;
            }
        }
    `;

    document.head.appendChild(style);
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

// Render reports toolbar, table, and pagination.
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

    // Reopen the selected report after updating its status.
    if (selectedReportId) {
        const selectedReport = currentReports.find(
            (report) => Number(report.id) === selectedReportId
        );

        if (selectedReport) {
            renderReportDetails(selectedReport);
        } else {
            closeReportModal();
        }
    }
}

// Open report details in a modal.
function renderReportDetails(report) {
    closeReportModal();
    addModalStyles();

    const modal = document.createElement('div');
    modal.id = 'report-details-modal';
    modal.className = 'report-modal-overlay';

    modal.innerHTML = `
        <div
            class="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title">

            <div class="report-modal-header">
                <h3 id="report-modal-title">تفاصيل البلاغ #${report.id}</h3>

                <button
                    type="button"
                    class="report-modal-close"
                    id="close-report-details"
                    aria-label="إغلاق">
                    &times;
                </button>
            </div>

            <div class="report-modal-details">
                <p>
                    <strong>اسم المبلّغ:</strong>
                    ${escapeHTML(report.reporter?.name || 'مستخدم محذوف')}
                </p>

                <p>
                    <strong>البريد الإلكتروني:</strong>
                    ${escapeHTML(report.reporter?.email || '—')}
                </p>

                <p>
                    <strong>نوع الهدف:</strong>
                    ${escapeHTML(targetTypeLabels[report.targetType] || report.targetType)}
                </p>

                <p>
                    <strong>العنصر المبلّغ عنه:</strong>
                    ${escapeHTML(report.target_details?.name || 'غير معروف')}
                </p>

                <p>
                    <strong>التصنيف:</strong>
                    ${escapeHTML(report.category || '—')}
                </p>

                <div>
                    <strong>الوصف:</strong>
                    <p class="report-modal-description">
                        ${escapeHTML(report.description || 'لا يوجد وصف.')}
                    </p>
                </div>

                <p>
                    <strong>تاريخ البلاغ:</strong>
                    ${escapeHTML(formatDate(report.created_at))}
                </p>

                <p>
                    <strong>الحالة الحالية:</strong>
                    ${escapeHTML(statusLabels[report.status] || report.status)}
                </p>
            </div>

            <div class="report-modal-actions">
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
                    id="close-report-modal">
                    إغلاق
                </button>
            </div>

            <p class="status-note report-modal-message" id="report-update-message" aria-live="polite">
                ${escapeHTML(updateMessage)}
            </p>
        </div>
    `;

    document.body.appendChild(modal);

    document.querySelector('#update-report-status')
        ?.addEventListener('click', updateReportStatus);

    document.querySelector('#close-report-details')
        ?.addEventListener('click', closeReportModal);

    document.querySelector('#close-report-modal')
        ?.addEventListener('click', closeReportModal);

    // Close when clicking outside the modal content.
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeReportModal();
        }
    });

    // Close when pressing Escape.
    document.addEventListener('keydown', handleModalEscape);
}

// Handle Escape key.
function handleModalEscape(event) {
    if (event.key === 'Escape') {
        closeReportModal();
    }
}

// Close and remove the report modal.
function closeReportModal() {
    document.querySelector('#report-details-modal')?.remove();
    document.removeEventListener('keydown', handleModalEscape);

    selectedReportId = null;
    updateMessage = '';
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

        selectedReportId = Number(reportId);
        updateMessage = 'تم تحديث حالة البلاغ بنجاح.';

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
            closeReportModal();
            loadReports(1);
        }, 400);
    });

    statusFilter?.addEventListener('change', () => {
        currentStatus = statusFilter.value;
        closeReportModal();
        loadReports(1);
    });

    typeFilter?.addEventListener('change', () => {
        currentTargetType = typeFilter.value;
        closeReportModal();
        loadReports(1);
    });

    perPageSelect?.addEventListener('change', () => {
        perPage = Number(perPageSelect.value);
        closeReportModal();
        loadReports(1);
    });

    reportsContent.querySelectorAll('[data-report-page]').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.disabled) return;

            closeReportModal();
            loadReports(Number(button.dataset.reportPage));
        });
    });

    reportsContent.querySelectorAll('[data-report-details]').forEach((button) => {
        button.addEventListener('click', () => {
            const reportId = Number(button.dataset.reportDetails);

            const report = currentReports.find(
                (item) => Number(item.id) === reportId
            );

            if (!report) return;

            selectedReportId = reportId;
            updateMessage = '';
            renderReportDetails(report);
        });
    });
}
