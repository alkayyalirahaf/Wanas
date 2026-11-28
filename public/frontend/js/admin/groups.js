
import { api } from './api.js';

const content = document.getElementById('groups-content');

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
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

// Display group status.
function getStatusLabel(status, deleted = false) {
  const labels = {
    Active: 'نشطة',
    Archived: 'مؤرشفة',
  };

  const label = labels[status] || status;

  return deleted ? `${label} سابقًا` : label;
}

// Format deletion date.
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

// Load groups from the API.
export async function loadGroups(page = 1) {
  currentPage = page;
  confirmAction = null;
  showMessage('جاري تحميل المجموعات...');

  try {
    const response = await api.get('/groups', {
      params: {
        page: currentPage,
        search: currentSearch,
        status: currentStatus,
        deleted: showDeleted ? 1 : 0,
        per_page: perPage,
      },
    });

    const groups = response.data.data.data;
    const pagination = response.data.data;

    renderGroups(groups, pagination);
  } catch (error) {
    showMessage(
      error.response?.data?.message || 'حدث خطأ أثناء تحميل المجموعات.'
    );
  }
}

// Render groups table and filters.
function renderGroups(groups, pagination) {
  content.innerHTML = `
    <div class="verification-toolbar">
      <div class="search-box">
        <input
          type="search"
          id="group-search"
          placeholder="ابحث باسم المجموعة أو الموضوع أو الميسّر..."
          aria-label="البحث عن مجموعة"
          value="${escapeHTML(currentSearch)}"
        >
      </div>

      <select id="group-status-filter" aria-label="فلترة حسب الحالة"
        ${showDeleted ? 'disabled' : ''}>
        <option value="">جميع الحالات</option>
        <option value="Active" ${currentStatus === 'Active' ? 'selected' : ''}>نشطة</option>
        <option value="Archived" ${currentStatus === 'Archived' ? 'selected' : ''}>مؤرشفة</option>
      </select>

      <select id="group-deleted-filter" aria-label="فلترة المجموعات المحذوفة">
        <option value="0" ${!showDeleted ? 'selected' : ''}>المجموعات الحالية</option>
        <option value="1" ${showDeleted ? 'selected' : ''}>المجموعات المحذوفة</option>
      </select>

      <select id="groups-per-page" aria-label="عدد النتائج في الصفحة">
        <option value="10" ${perPage === 10 ? 'selected' : ''}>10 نتائج</option>
        <option value="25" ${perPage === 25 ? 'selected' : ''}>25 نتيجة</option>
        <option value="50" ${perPage === 50 ? 'selected' : ''}>50 نتيجة</option>
      </select>
    </div>

    <div class="table-responsive">
      ${groups.length
      ? `
            <table>
              <thead>
                <tr>
                  <th>اسم المجموعة</th>
                  <th>الموضوع</th>
                  <th>الميسّر</th>
                  <th>الخصوصية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${groups.map(renderGroupRow).join('')}
              </tbody>
            </table>
          `
      : '<p class="status-note">لا توجد مجموعات لعرضها.</p>'
    }
    </div>

    <div id="group-details"></div>
    <div id="group-confirmation"></div>

    <div class="pagination">
      <span class="pagination-info">
        عرض ${pagination.from ?? 0} إلى ${pagination.to ?? 0}
        من أصل ${pagination.total}
      </span>

      <div class="pagination-buttons">
        <button class="button button--secondary" data-page="${pagination.current_page - 1}"
          ${pagination.current_page <= 1 ? 'disabled' : ''}>
          السابق
        </button>

        <span>صفحة ${pagination.current_page} من ${pagination.last_page}</span>

        <button class="button button--secondary" data-page="${pagination.current_page + 1}"
          ${pagination.current_page >= pagination.last_page ? 'disabled' : ''}>
          التالي
        </button>
      </div>
    </div>
  `;

  attachEventListeners();
}

// Render one group row.
function renderGroupRow(group) {
  const deleted = showDeleted;

  let actions = `
    <button class="button button--secondary"
      data-action="details" data-id="${group.id}">
      التفاصيل
    </button>
  `;

  if (deleted) {
    actions += `
      <button class="button button--secondary"
        data-action="restore" data-id="${group.id}">
        استعادة
      </button>
    `;
  } else {
    if (group.status === 'Active') {
      actions += `
        <button class="button button--secondary"
          data-action="archive" data-id="${group.id}">
          أرشفة
        </button>
      `;
    } else {
      actions += `
        <button class="button button--secondary"
          data-action="activate" data-id="${group.id}">
          إعادة التفعيل
        </button>
      `;
    }

    actions += `
      <button class="button button--secondary"
        data-action="delete" data-id="${group.id}">
        حذف
      </button>
    `;
  }

  return `
    <tr>
      <td>${escapeHTML(group.title)}</td>
      <td>${escapeHTML(group.topic || '—')}</td>
      <td>${escapeHTML(group.owner?.name || '—')}</td>
      <td>${group.isPrivate ? 'خاصة' : 'عامة'}</td>
      <td>${escapeHTML(getStatusLabel(group.status, deleted))}</td>
      <td>${actions}</td>
    </tr>
  `;
}

// Attach listeners to filters and actions.
function attachEventListeners() {
  const searchInput = document.getElementById('group-search');

  searchInput?.addEventListener('input', (event) => {
    currentSearch = event.target.value;

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      loadGroups(1);
    }, 400);
  });

  document.getElementById('group-status-filter')
    ?.addEventListener('change', (event) => {
      currentStatus = event.target.value;
      loadGroups(1);
    });

  document.getElementById('group-deleted-filter')
    ?.addEventListener('change', (event) => {
      showDeleted = event.target.value === '1';
      currentStatus = '';
      loadGroups(1);
    });

  document.getElementById('groups-per-page')
    ?.addEventListener('change', (event) => {
      perPage = Number(event.target.value);
      loadGroups(1);
    });

  content.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      loadGroups(Number(button.dataset.page));
    });
  });

  content.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      handleGroupAction(button.dataset.action, Number(button.dataset.id));
    });
  });
}

// Handle group actions.
async function handleGroupAction(action, groupId) {
  if (action === 'details') {
    await showGroupDetails(groupId);
    return;
  }

  const actions = {
    archive: 'هل أنت متأكد من أرشفة هذه المجموعة؟',
    activate: 'هل تريد إعادة تفعيل هذه المجموعة؟',
    delete: 'هل أنت متأكد من حذف هذه المجموعة؟',
    restore: 'هل تريد استعادة هذه المجموعة؟',
  };

  const message = actions[action];

  if (!message) return;

  showConfirmation(action, groupId, message);
}

// Display confirmation modal.
function showConfirmation(action, groupId, message) {
  document.getElementById('group-confirmation-modal')?.remove();

  confirmAction = { action, groupId };

  const modal = document.createElement('div');

  modal.id = 'group-confirmation-modal';
  modal.className = 'admin-modal-overlay';

  modal.innerHTML = `
    <div class="admin-modal" role="dialog" aria-modal="true"
      aria-labelledby="group-modal-title">

      <h2 id="group-modal-title">
        ${action === 'delete' ? 'تأكيد حذف المجموعة' : 'تأكيد العملية'}
      </h2>

      <p>${escapeHTML(message)}</p>

      ${action === 'delete' ? `
        <div style="margin-top: 1rem; text-align: right;">
          <label for="group-deletion-reason">
            سبب الحذف <span aria-hidden="true">*</span>
          </label>

          <textarea
            id="group-deletion-reason"
            rows="4"
            maxlength="1000"
            placeholder="اكتب سبب حذف المجموعة..."
            required
            style="width: 100%; margin-top: 0.5rem; padding: 0.75rem;"
          ></textarea>

          <small>يجب إدخال سبب من 5 إلى 1000 حرف.</small>
        </div>
      ` : ''}

      <div class="admin-modal-actions">
        <button class="button button--secondary"
          type="button" id="confirm-group-action">
          تأكيد
        </button>

        <button class="button button--secondary"
          type="button" id="cancel-group-action">
          إلغاء
        </button>
      </div>

      <div id="group-modal-message" aria-live="polite"></div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('confirm-group-action')
    .addEventListener('click', executeConfirmedAction);

  document.getElementById('cancel-group-action')
    .addEventListener('click', closeGroupModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeGroupModal();
    }
  });
}

// Close the confirmation modal.
function closeGroupModal() {
  confirmAction = null;
  document.getElementById('group-confirmation-modal')?.remove();
}

// Execute the confirmed action.
async function executeConfirmedAction() {
  if (!confirmAction) return;

  const { action, groupId } = confirmAction;

  const confirmButton = document.getElementById('confirm-group-action');
  const messageContainer = document.getElementById('group-modal-message');

  let deletionReason = '';

  if (action === 'delete') {
    deletionReason = document
      .getElementById('group-deletion-reason')
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
    if (action === 'archive') {
      await api.patch(`/groups/${groupId}/archive`);
    } else if (action === 'activate') {
      await api.patch(`/groups/${groupId}/activate`);
    } else if (action === 'delete') {
      await api.delete(`/groups/${groupId}`, {
        data: {
          deletionReason,
        },
      });
    } else if (action === 'restore') {
      await api.patch(`/groups/${groupId}/restore`);
    }

    confirmAction = null;
    document.getElementById('group-confirmation-modal')?.remove();

    await loadGroups(currentPage);
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


// Display group details inside a modal.
async function showGroupDetails(groupId) {
  document.getElementById('group-details-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'group-details-modal';
  modal.className = 'admin-modal-overlay';

  modal.innerHTML = `
    <div class="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-details-title"
      style="max-width: 650px; max-height: 90vh; overflow-y: auto;">

      <p class="status-note">جاري تحميل التفاصيل...</p>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeGroupDetailsModal();
    }
  });

  try {
    const response = await api.get(`/groups/${groupId}`);
    const group = response.data.data;

    const isDeleted = Boolean(group.deleted_at);

    const deletionDetails = isDeleted ? `
      <div style="margin-top: 20px; padding: 16px; background: #f8f3f3; border-radius: 8px; text-align: right;">
        <h3>تفاصيل الحذف</h3>

        <p>
          <strong>سبب الحذف:</strong>
          ${escapeHTML(group.deletionReason || 'غير متوفر')}
        </p>

        <p>
          <strong>تاريخ الحذف:</strong>
          ${escapeHTML(formatDate(group.deleted_at))}
        </p>

        <p>
          <strong>حذف بواسطة:</strong>
          ${escapeHTML(group.deleted_by_admin?.name || 'غير متوفر')}
        </p>
      </div>
    ` : '';

    const modalContent = modal.querySelector('.admin-modal');

    modalContent.innerHTML = `
      <h2 id="group-details-title">تفاصيل المجموعة</h2>

      <div style="text-align: right; line-height: 2; margin-top: 20px;">

        <p>
          <strong>اسم المجموعة:</strong>
          ${escapeHTML(group.title)}
        </p>

        <p>
          <strong>الموضوع:</strong>
          ${escapeHTML(group.topic || '—')}
        </p>

        <p>
          <strong>الوصف:</strong>
          ${escapeHTML(group.description || '—')}
        </p>

        <p>
          <strong>الميسّر:</strong>
          ${escapeHTML(group.owner?.name || '—')}
        </p>

        <p>
          <strong>البريد الإلكتروني للميسّر:</strong>
          ${escapeHTML(group.owner?.email || '—')}
        </p>

        <p>
          <strong>الخصوصية:</strong>
          ${group.isPrivate ? 'خاصة' : 'عامة'}
        </p>

        <p>
          <strong>الحالة:</strong>
          ${escapeHTML(isDeleted ? 'محذوفة' : getStatusLabel(group.status))}
        </p>

        <p>
          <strong>تاريخ الإنشاء:</strong>
          ${escapeHTML(formatDate(group.created_at))}
        </p>

        <p>
          <strong>آخر تحديث:</strong>
          ${escapeHTML(formatDate(group.updated_at))}
        </p>

        ${deletionDetails}

      </div>

      <div class="admin-modal-actions">
        <button
          class="button button--secondary"
          type="button"
          id="close-group-details">
          إغلاق
        </button>
      </div>
    `;

    modal.querySelector('#close-group-details')
      .addEventListener('click', closeGroupDetailsModal);

  } catch (error) {
    modal.querySelector('.admin-modal').innerHTML = `
      <h2>تعذر تحميل التفاصيل</h2>

      <p class="status-note">
        ${escapeHTML(
      error.response?.data?.message ||
      'حدث خطأ أثناء تحميل تفاصيل المجموعة.'
    )}
      </p>

      <div class="admin-modal-actions">
        <button
          class="button button--secondary"
          type="button"
          id="close-group-details">
          إغلاق
        </button>
      </div>
    `;

    modal.querySelector('#close-group-details')
      .addEventListener('click', closeGroupDetailsModal);
  }
}

// Close group details modal.
function closeGroupDetailsModal() {
  document.getElementById('group-details-modal')?.remove();
}
