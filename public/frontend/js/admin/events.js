
import { api } from './api.js';

const content = document.getElementById('events-content');

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let currentLocationType = '';
let showDeleted = false;
let perPage = 10;
let searchTimer = null;
let confirmAction = null;

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

// Display event status.
function getStatusLabel(status) {
    const labels = {
        Draft: 'مسودة',
        Published: 'منشورة',
        Canceled: 'ملغاة',
    };

    return labels[status] || status || '—';
}

// Display event location type.
function getLocationLabel(locationType) {
    const labels = {
        online: 'أونلاين',
        indoor: 'داخلي',
        outdoor: 'خارجي',
    };

    return labels[locationType] || locationType || '—';
}

// Format dates.
function formatDate(date) {
    if (!date) return 'غير متوفر';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'غير متوفر';
    }

    return parsedDate.toLocaleString('ar-JO');
}

// Display loading and error messages.
function showMessage(message) {
    content.innerHTML = `<p class="status-note">${escapeHTML(message)}</p>`;
}

// Load events from the API.
export async function loadEvents(page = 1) {
    currentPage = page;
    confirmAction = null;
    showMessage('جاري تحميل الفعاليات...');

    try {
        const response = await api.get('/events', {
            params: {
                page: currentPage,
                search: currentSearch,
                status: currentStatus,
                locationType: currentLocationType,
                deleted: showDeleted ? 1 : 0,
                per_page: perPage,
            },
        });

        const events = response.data.data.data;
        const pagination = response.data.data;

        renderEvents(events, pagination);
    } catch (error) {
        showMessage(
            error.response?.data?.message || 'حدث خطأ أثناء تحميل الفعاليات.'
        );
    }
}

// Render events table and filters.
function renderEvents(events, pagination) {
    content.innerHTML = `
    <div class="verification-toolbar">
      <div class="search-box">
        <input
          type="search"
          id="event-search"
          placeholder="ابحث باسم الفعالية أو المضيف أو المجموعة..."
          aria-label="البحث عن فعالية"
          value="${escapeHTML(currentSearch)}"
        >
      </div>

      <select id="event-status-filter"
        aria-label="فلترة حسب الحالة"
        ${showDeleted ? 'disabled' : ''}>
        <option value="">جميع الحالات</option>
        <option value="Draft" ${currentStatus === 'Draft' ? 'selected' : ''}>مسودة</option>
        <option value="Published" ${currentStatus === 'Published' ? 'selected' : ''}>منشورة</option>
        <option value="Canceled" ${currentStatus === 'Canceled' ? 'selected' : ''}>ملغاة</option>
      </select>

      <select id="event-location-filter"
        aria-label="فلترة حسب نوع الموقع">
        <option value="">جميع المواقع</option>
        <option value="online" ${currentLocationType === 'online' ? 'selected' : ''}>أونلاين</option>
        <option value="indoor" ${currentLocationType === 'indoor' ? 'selected' : ''}>داخلي</option>
        <option value="outdoor" ${currentLocationType === 'outdoor' ? 'selected' : ''}>خارجي</option>
      </select>

      <select id="event-deleted-filter"
        aria-label="فلترة الفعاليات المحذوفة">
        <option value="0" ${!showDeleted ? 'selected' : ''}>الفعاليات الحالية</option>
        <option value="1" ${showDeleted ? 'selected' : ''}>الفعاليات المحذوفة</option>
      </select>

      <select id="events-per-page"
        aria-label="عدد النتائج في الصفحة">
        <option value="10" ${perPage === 10 ? 'selected' : ''}>10 نتائج</option>
        <option value="25" ${perPage === 25 ? 'selected' : ''}>25 نتيجة</option>
        <option value="50" ${perPage === 50 ? 'selected' : ''}>50 نتيجة</option>
      </select>
    </div>

    <div class="table-responsive">
      ${events.length
            ? `
          <table style="width: 100%; min-width: 950px; border-collapse: separate; border-spacing: 0;">
            <thead>
            <tr>
  <th style="min-width: 170px;">اسم الفعالية</th>
  <th style="min-width: 140px;">المضيف</th>
  <th style="min-width: 140px;">المجموعة</th>
  <th style="min-width: 110px;">نوع الموقع</th>
  <th style="min-width: 160px;">تاريخ الفعالية</th>
  <th style="min-width: 90px;">الحالة</th>
  <th style="min-width: 170px;">الإجراءات</th>
</tr>
            </thead>

            <tbody>
              ${events.map(renderEventRow).join('')}
            </tbody>
          </table>
        `
            : '<p class="status-note">لا توجد فعاليات لعرضها.</p>'
        }
    </div>

    <div class="pagination">
      <span class="pagination-info">
        عرض ${pagination.from ?? 0} إلى ${pagination.to ?? 0}
        من أصل ${pagination.total}
      </span>

      <div class="pagination-buttons">
        <button class="button button--secondary"
          data-page="${pagination.current_page - 1}"
          ${pagination.current_page <= 1 ? 'disabled' : ''}>
          السابق
        </button>

        <span>صفحة ${pagination.current_page} من ${pagination.last_page}</span>

        <button class="button button--secondary"
          data-page="${pagination.current_page + 1}"
          ${pagination.current_page >= pagination.last_page ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

    attachEventListeners();
}

// Render one event row.
function renderEventRow(event) {
    let actions = `
    <button class="button button--secondary"
      data-action="details" data-id="${event.id}">
      التفاصيل
    </button>
  `;

    if (showDeleted) {
        actions += `
      <button class="button button--secondary"
        data-action="restore" data-id="${event.id}">
        استعادة
      </button>
    `;
    } else {
        actions += `
      <button class="button button--secondary"
        data-action="delete" data-id="${event.id}">
        حذف
      </button>
    `;
    }

    return `
    <tr>
      <td>${escapeHTML(event.title)}</td>
      <td>${escapeHTML(event.host?.name || '—')}</td>
      <td>${escapeHTML(event.group?.title || 'فعالية مستقلة')}</td>
      <td>${escapeHTML(getLocationLabel(event.locationType))}</td>
      <td>${escapeHTML(formatDate(event.startsAt))}</td>
      <td>${escapeHTML(getStatusLabel(event.status))}</td>
      <td>
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: nowrap;">
    ${actions}
  </div>
</td>
  </tr>
  `;
}

// Attach listeners to filters and actions.
function attachEventListeners() {
    document.getElementById('event-search')
        ?.addEventListener('input', (event) => {
            currentSearch = event.target.value;

            clearTimeout(searchTimer);

            searchTimer = setTimeout(() => {
                loadEvents(1);
            }, 400);
        });

    document.getElementById('event-status-filter')
        ?.addEventListener('change', (event) => {
            currentStatus = event.target.value;
            loadEvents(1);
        });

    document.getElementById('event-location-filter')
        ?.addEventListener('change', (event) => {
            currentLocationType = event.target.value;
            loadEvents(1);
        });

    document.getElementById('event-deleted-filter')
        ?.addEventListener('change', (event) => {
            showDeleted = event.target.value === '1';
            currentStatus = '';
            loadEvents(1);
        });

    document.getElementById('events-per-page')
        ?.addEventListener('change', (event) => {
            perPage = Number(event.target.value);
            loadEvents(1);
        });

    content.querySelectorAll('[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
            loadEvents(Number(button.dataset.page));
        });
    });

    content.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
            handleEventAction(button.dataset.action, Number(button.dataset.id));
        });
    });
}

// Handle event actions.
async function handleEventAction(action, eventId) {
    if (action === 'details') {
        await showEventDetails(eventId);
        return;
    }

    const actions = {
        delete: 'هل أنت متأكد من حذف هذه الفعالية؟',
        restore: 'هل تريد استعادة هذه الفعالية؟',
    };

    const message = actions[action];

    if (!message) return;

    showConfirmation(action, eventId, message);
}

// Display confirmation modal.
function showConfirmation(action, eventId, message) {
    document.getElementById('event-confirmation-modal')?.remove();

    confirmAction = { action, eventId };

    const modal = document.createElement('div');

    modal.id = 'event-confirmation-modal';
    modal.className = 'admin-modal-overlay';

    modal.innerHTML = `
    <div class="admin-modal" role="dialog" aria-modal="true"
      aria-labelledby="event-modal-title">

      <h2 id="event-modal-title">
        ${action === 'delete' ? 'تأكيد حذف الفعالية' : 'تأكيد استعادة الفعالية'}
      </h2>

      <p>${escapeHTML(message)}</p>

      ${action === 'delete' ? `
        <div style="margin-top: 1rem; text-align: right;">
          <label for="event-deletion-reason">
            سبب الحذف <span aria-hidden="true">*</span>
          </label>

          <textarea
            id="event-deletion-reason"
            rows="4"
            maxlength="1000"
            placeholder="اكتب سبب حذف الفعالية..."
            required
            style="width: 100%; margin-top: 0.5rem; padding: 0.75rem;"
          ></textarea>

          <small>يجب إدخال سبب من 5 إلى 1000 حرف.</small>
        </div>
      ` : ''}

      <div class="admin-modal-actions">
        <button class="button button--secondary"
          type="button" id="confirm-event-action">
          تأكيد
        </button>

        <button class="button button--secondary"
          type="button" id="cancel-event-action">
          إلغاء
        </button>
      </div>

      <div id="event-modal-message" aria-live="polite"></div>
    </div>
  `;

    document.body.appendChild(modal);

    document.getElementById('confirm-event-action')
        .addEventListener('click', executeConfirmedAction);

    document.getElementById('cancel-event-action')
        .addEventListener('click', closeEventModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeEventModal();
        }
    });
}

// Close confirmation modal.
function closeEventModal() {
    confirmAction = null;
    document.getElementById('event-confirmation-modal')?.remove();
}

// Execute the confirmed action.
async function executeConfirmedAction() {
    if (!confirmAction) return;

    const { action, eventId } = confirmAction;

    const confirmButton = document.getElementById('confirm-event-action');
    const messageContainer = document.getElementById('event-modal-message');

    let deletionReason = '';

    if (action === 'delete') {
        deletionReason = document
            .getElementById('event-deletion-reason')
            ?.value.trim() || '';

        if (deletionReason.length < 5 || deletionReason.length > 1000) {
            messageContainer.innerHTML = `
        <p class="status-note">
          يرجى إدخال سبب حذف من 5 إلى 1000 حرف.
        </p>
      `;
            return;
        }
    }

    confirmButton.disabled = true;
    confirmButton.textContent = 'جاري التنفيذ...';

    try {
        if (action === 'delete') {
            await api.delete(`/events/${eventId}`, {
                data: {
                    deletionReason,
                },
            });
        } else if (action === 'restore') {
            await api.patch(`/events/${eventId}/restore`);
        }

        confirmAction = null;
        document.getElementById('event-confirmation-modal')?.remove();

        await loadEvents(currentPage);
    } catch (error) {
        messageContainer.innerHTML = `
      <p class="status-note">
        ${escapeHTML(error.response?.data?.message || 'تعذر تنفيذ العملية.')}
      </p>
    `;

        confirmButton.disabled = false;
        confirmButton.textContent = 'إعادة المحاولة';
    }
}

// Display event details inside a modal.
async function showEventDetails(eventId) {
    document.getElementById('event-details-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'event-details-modal';
    modal.className = 'admin-modal-overlay';

    modal.innerHTML = `
    <div class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
      style="max-width: 650px; max-height: 90vh; overflow-y: auto;">

      <p class="status-note">جاري تحميل التفاصيل...</p>
    </div>
  `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeEventDetailsModal();
        }
    });

    try {
        const response = await api.get(`/events/${eventId}`);
        const event = response.data.data;

        const isDeleted = Boolean(event.deleted_at);

        const deletionDetails = isDeleted ? `
      <div style="margin-top: 20px; padding: 16px; background: #f8f3f3; border-radius: 8px; text-align: right;">
        <h3>تفاصيل الحذف</h3>

        <p>
          <strong>سبب الحذف:</strong>
          ${escapeHTML(event.deletionReason || 'غير متوفر')}
        </p>

        <p>
          <strong>تاريخ الحذف:</strong>
          ${escapeHTML(formatDate(event.deleted_at))}
        </p>

        <p>
          <strong>حذف بواسطة:</strong>
          ${escapeHTML(event.deleted_by_admin?.name || 'غير متوفر')}
        </p>
      </div>
    ` : '';

        const modalContent = modal.querySelector('.admin-modal');

        modalContent.innerHTML = `
      <h2 id="event-details-title">تفاصيل الفعالية</h2>

      <div style="text-align: right; line-height: 2; margin-top: 20px;">

        <p>
          <strong>اسم الفعالية:</strong>
          ${escapeHTML(event.title)}
        </p>

        <p>
          <strong>الوصف:</strong>
          ${escapeHTML(event.description || '—')}
        </p>

        <p>
          <strong>المضيف:</strong>
          ${escapeHTML(event.host?.name || '—')}
        </p>

        <p>
          <strong>البريد الإلكتروني للمضيف:</strong>
          ${escapeHTML(event.host?.email || '—')}
        </p>

        <p>
          <strong>نوع حساب المضيف:</strong>
          ${escapeHTML(event.host?.role || '—')}
        </p>

        <p>
          <strong>المجموعة:</strong>
          ${escapeHTML(event.group?.title || 'فعالية مستقلة')}
        </p>

        <p>
          <strong>نوع الموقع:</strong>
          ${escapeHTML(getLocationLabel(event.locationType))}
        </p>

        <p>
          <strong>تفاصيل الموقع:</strong>
          ${escapeHTML(event.locationDetails || '—')}
        </p>

        <p>
          <strong>السعة:</strong>
          ${escapeHTML(event.capacity ?? 'غير محددة')}
        </p>

        <p>
          <strong>تاريخ البداية:</strong>
          ${escapeHTML(formatDate(event.startsAt))}
        </p>

        <p>
          <strong>تاريخ النهاية:</strong>
          ${escapeHTML(formatDate(event.endsAt))}
        </p>

        <p>
          <strong>الحالة:</strong>
          ${escapeHTML(isDeleted ? 'محذوفة' : getStatusLabel(event.status))}
        </p>

        <p>
          <strong>تاريخ الإنشاء:</strong>
          ${escapeHTML(formatDate(event.created_at))}
        </p>

        <p>
          <strong>آخر تحديث:</strong>
          ${escapeHTML(formatDate(event.updated_at))}
        </p>

        ${deletionDetails}

      </div>

      <div class="admin-modal-actions">
        <button
          class="button button--secondary"
          type="button"
          id="close-event-details">
          إغلاق
        </button>
      </div>
    `;

        modalContent.querySelector('#close-event-details')
            .addEventListener('click', closeEventDetailsModal);

    } catch (error) {
        modal.querySelector('.admin-modal').innerHTML = `
      <h2>تعذر تحميل التفاصيل</h2>

      <p class="status-note">
        ${escapeHTML(
            error.response?.data?.message ||
            'حدث خطأ أثناء تحميل تفاصيل الفعالية.'
        )}
      </p>

      <div class="admin-modal-actions">
        <button
          class="button button--secondary"
          type="button"
          id="close-event-details">
          إغلاق
        </button>
      </div>
    `;

        modal.querySelector('#close-event-details')
            .addEventListener('click', closeEventDetailsModal);
    }
}

// Close event details modal.
function closeEventDetailsModal() {
    document.getElementById('event-details-modal')?.remove();
}
