
import { api } from './api.js';

// HTML container
const allUsersContent = document.querySelector('#all-users-content');

// Current page and filters
let currentPage = 1;
let currentSearch = '';
let currentRole = '';
let currentStatus = '';
let showDeleted = false;
let perPage = 10;
let searchTimeout = null;

// Current users and selected user
let currentUsers = [];
let selectedUserId = null;
let pendingUserAction = null;

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

// Translate user roles.
function getRoleLabel(role) {
    const labels = {
        member: 'عضو',
        specialist: 'أخصائي',
        facilitator: 'ميسّر',
    };

    return labels[role] || role;
}

// Translate account statuses.
function getStatusLabel(status, deleted = false) {
    const labels = {
        Pending: 'قيد الانتظار',
        Active: 'نشط',
        Blocked: 'محظور',
        Rejected: 'مرفوض',
    };

    const label = labels[status] || status || 'غير محدد';

    return deleted ? `${label} سابقًا` : label;
}

// Display a message.
function showMessage(message) {
    allUsersContent.innerHTML = `
        <p class="status-note" style="padding: 2rem 1rem; text-align: center;">
            ${escapeHTML(message)}
        </p>
    `;
}

// Load users from the API.
export async function loadAllUsers(page = 1) {
    currentPage = page;

    showMessage('جاري تحميل المستخدمين...');

    try {
        const params = {
            page: currentPage,
            per_page: perPage,
        };

        if (currentSearch) params.search = currentSearch;
        if (currentRole) params.role = currentRole;
        if (currentStatus) params.status = currentStatus;
        if (showDeleted) params.deleted = 1;

        const response = await api.get('/users', { params });

        const pagination = response.data.data;

        currentUsers = pagination.data || [];

        renderUsers(pagination);

    } catch (error) {
        console.error('Failed to load users:', error);

        showMessage(
            error.response?.data?.message ||
            'حدث خطأ أثناء تحميل المستخدمين.'
        );
    }
}

// Render users section.
function renderUsers(pagination) {
    const rows = currentUsers.length
        ? currentUsers.map((user) => `
            <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${escapeHTML(user.phoneNumber || '—')}</td>
                <td>${escapeHTML(getRoleLabel(user.role))}</td>
                <td>${escapeHTML(getStatusLabel(user.status, showDeleted))}</td>
                <td>
                    <button
                        class="button button--secondary"
                        type="button"
                        data-action="details"
                        data-id="${user.id}">
                        التفاصيل
                    </button>
                </td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    لا يوجد مستخدمون لعرضهم.
                </td>
            </tr>
        `;

    allUsersContent.innerHTML = `
        <div class="verification-toolbar">
            <div class="search-box">
                <input
                    type="search"
                    id="all-users-search"
                    placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                    aria-label="البحث عن مستخدم"
                    value="${escapeHTML(currentSearch)}">
            </div>

            <select id="all-users-role" aria-label="فلترة حسب الدور">
                <option value="">جميع الأدوار</option>
                <option value="member" ${currentRole === 'member' ? 'selected' : ''}>الأعضاء</option>
                <option value="specialist" ${currentRole === 'specialist' ? 'selected' : ''}>الأخصائيون</option>
                <option value="facilitator" ${currentRole === 'facilitator' ? 'selected' : ''}>الميسّرون</option>
            </select>

            <select id="all-users-status" aria-label="فلترة حسب الحالة">
                <option value="">جميع الحالات</option>
                <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>قيد الانتظار</option>
                <option value="Active" ${currentStatus === 'Active' ? 'selected' : ''}>نشط</option>
                <option value="Blocked" ${currentStatus === 'Blocked' ? 'selected' : ''}>محظور</option>
                <option value="Rejected" ${currentStatus === 'Rejected' ? 'selected' : ''}>مرفوض</option>
            </select>

            <select id="all-users-deleted" aria-label="حالة الحذف">
                <option value="0" ${!showDeleted ? 'selected' : ''}>المستخدمون الحاليون</option>
                <option value="1" ${showDeleted ? 'selected' : ''}>المستخدمون المحذوفون</option>
            </select>

            <select id="all-users-per-page" aria-label="عدد النتائج في الصفحة">
                <option value="10" ${perPage === 10 ? 'selected' : ''}>10 نتائج</option>
                <option value="25" ${perPage === 25 ? 'selected' : ''}>25 نتيجة</option>
                <option value="50" ${perPage === 50 ? 'selected' : ''}>50 نتيجة</option>
            </select>
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>رقم الهاتف</th>
                        <th>الدور</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>

                <tbody>${rows}</tbody>
            </table>
        </div>

        <div class="pagination">
            <div class="pagination-info">
                عرض ${pagination.from ?? 0} إلى ${pagination.to ?? 0}
                من أصل ${pagination.total} مستخدم
            </div>

            <div class="pagination-buttons">
                <button
                    class="button button--secondary"
                    type="button"
                    data-action="page"
                    data-page="${pagination.current_page - 1}"
                    ${pagination.current_page <= 1 ? 'disabled' : ''}>
                    السابق
                </button>

                <span>صفحة ${pagination.current_page} من ${pagination.last_page}</span>

                <button
                    class="button button--secondary"
                    type="button"
                    data-action="page"
                    data-page="${pagination.current_page + 1}"
                    ${pagination.current_page >= pagination.last_page ? 'disabled' : ''}>
                    التالي
                </button>
            </div>
        </div>
    `;

    if (selectedUserId) {
        renderUserDetails();
    }
}


// Display selected user details in a modal.
function renderUserDetails() {
    const user = currentUsers.find(
        (item) => item.id === Number(selectedUserId)
    );

    if (!user) return;

    let actionButtons = '';

    if (showDeleted) {
        actionButtons = `
            <button class="button" type="button"
                data-action="restore" data-id="${user.id}">
                استعادة المستخدم
            </button>
        `;
    } else {
        if (user.status === 'Active') {
            actionButtons += `
                <button class="button button--secondary" type="button"
                    data-action="block" data-id="${user.id}">
                    حظر المستخدم
                </button>
            `;
        }

        if (user.status === 'Blocked') {
            actionButtons += `
                <button class="button" type="button"
                    data-action="unblock" data-id="${user.id}">
                    فك الحظر
                </button>
            `;
        }

        actionButtons += `
            <button class="button button--secondary" type="button"
                data-action="delete" data-id="${user.id}">
                حذف المستخدم
            </button>
        `;
    }

    // Display block information only for blocked users.
    const blockDetails = user.status === 'Blocked' ? `
        <div class="user-block-details" style="margin-top: 1.5rem; padding: 1rem; background: #f8f3f3; border-radius: 8px;">
            <h3>تفاصيل الحظر</h3>

            <p>
                <strong>سبب الحظر:</strong>
                ${escapeHTML(user.blockReason || 'غير متوفر')}
            </p>

            <p>
                <strong>تاريخ الحظر:</strong>
                ${user.blockedAt
            ? escapeHTML(new Date(user.blockedAt).toLocaleString('ar-JO'))
            : 'غير متوفر'}
            </p>

            <p>
                <strong>بواسطة:</strong>
                ${escapeHTML(user.blocked_by_admin?.name || 'غير متوفر')}
            </p>
        </div>
    ` : '';

    document.getElementById('user-details-modal')?.remove();

    const modal = document.createElement('div');

    modal.id = 'user-details-modal';
    modal.className = 'admin-modal-overlay';

    modal.innerHTML = `
        <div class="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title">

            <h2 id="user-details-title">تفاصيل المستخدم</h2>

            <p><strong>الاسم:</strong> ${escapeHTML(user.name)}</p>
            <p><strong>البريد الإلكتروني:</strong> ${escapeHTML(user.email)}</p>
            <p><strong>رقم الهاتف:</strong> ${escapeHTML(user.phoneNumber || 'غير متوفر')}</p>
            <p><strong>الدور:</strong> ${escapeHTML(getRoleLabel(user.role))}</p>
            <p><strong>الحالة:</strong> ${escapeHTML(getStatusLabel(user.status, showDeleted))}</p>
            <p><strong>نبذة:</strong> ${escapeHTML(user.bio || 'لا توجد نبذة')}</p>

            ${blockDetails}

            <div class="admin-modal-actions">
                ${actionButtons}

                <button class="button button--secondary"
                    type="button" data-action="close-details">
                    إغلاق
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            selectedUserId = null;
            modal.remove();
        }
    });
}





// Display confirmation modal for user actions.
function showUserConfirmation(action, userId) {
    document.getElementById('user-confirmation-modal')?.remove();

    const messages = {
        block: {
            title: 'تأكيد حظر المستخدم',
            message: 'هل أنت متأكد من حظر هذا المستخدم؟',
            button: 'تأكيد الحظر',
        },
        unblock: {
            title: 'تأكيد فك الحظر',
            message: 'هل تريد فك الحظر عن هذا المستخدم؟',
            button: 'فك الحظر',
        },
        delete: {
            title: 'تأكيد حذف المستخدم',
            message: 'هل أنت متأكد من حذف هذا المستخدم؟',
            button: 'حذف المستخدم',
        },
        restore: {
            title: 'تأكيد استعادة المستخدم',
            message: 'هل تريد استعادة هذا المستخدم؟',
            button: 'استعادة المستخدم',
        },
    };

    const config = messages[action];

    if (!config) return;

    pendingUserAction = { action, userId };

    const modal = document.createElement('div');

    modal.id = 'user-confirmation-modal';
    modal.className = 'admin-modal-overlay';

    modal.innerHTML = `
        <div class="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirmation-title">

            <h2 id="user-confirmation-title">
                ${config.title}
            </h2>

            <p>${config.message}</p>

            ${action === 'block' ? `
                <div style="margin-top: 1rem; text-align: right;">
                    <label for="user-block-reason">
                        سبب الحظر <span aria-hidden="true">*</span>
                    </label>

                    <textarea
                        id="user-block-reason"
                        rows="4"
                        maxlength="1000"
                        placeholder="اكتب سبب حظر المستخدم..."
                        required
                        style="width: 100%; margin-top: 0.5rem; padding: 0.75rem;">
                    </textarea>

                    <small>يجب إدخال سبب من 5 إلى 1000 حرف.</small>
                </div>
            ` : ''}

            <div class="admin-modal-actions">
                <button
                    class="button button--secondary"
                    type="button"
                    id="confirm-user-action">
                    ${config.button}
                </button>

                <button
                    class="button button--secondary"
                    type="button"
                    id="cancel-user-action">
                    إغلاق
                </button>
            </div>

            <div id="user-modal-message" aria-live="polite"></div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirm-user-action')
        .addEventListener('click', executeUserAction);

    document.getElementById('cancel-user-action')
        .addEventListener('click', closeUserModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeUserModal();
        }
    });
}



// Close confirmation modal.
function closeUserModal() {
    pendingUserAction = null;

    document.getElementById('user-confirmation-modal')?.remove();
}

// Execute confirmed user action.
async function executeUserAction() {
    if (!pendingUserAction) return;

    const { action, userId } = pendingUserAction;

    const confirmButton = document.getElementById('confirm-user-action');
    const messageContainer = document.getElementById('user-modal-message');

    // Validate and send the blocking reason.
    if (action === 'block') {
        const reasonInput = document.getElementById('user-block-reason');
        const blockReason = reasonInput?.value.trim() || '';

        if (blockReason.length < 5 || blockReason.length > 1000) {
            messageContainer.innerHTML = `
                <p class="status-note">
                    يرجى إدخال سبب حظر يتراوح بين 5 و1000 حرف.
                </p>
            `;

            return;
        }

        confirmButton.disabled = true;
        confirmButton.textContent = 'جاري التنفيذ...';

        try {
            await api.patch(`/users/${userId}/block`, {
                blockReason: blockReason,
            });

            pendingUserAction = null;

            document.getElementById('user-confirmation-modal')?.remove();

            await loadAllUsers(currentPage);

        } catch (error) {
            console.error('User action failed:', error);

            messageContainer.innerHTML = `
                <p class="status-note">
                    ${escapeHTML(
                error.response?.data?.message ||
                'حدث خطأ أثناء تنفيذ العملية.'
            )}
                </p>
            `;

            confirmButton.disabled = false;
            confirmButton.textContent = 'إعادة المحاولة';
        }

        return;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = 'جاري التنفيذ...';

    try {
        if (action === 'unblock') {
            await api.patch(`/users/${userId}/unblock`);
        } else if (action === 'delete') {
            await api.delete(`/users/${userId}`);
            selectedUserId = null;
        } else if (action === 'restore') {
            await api.patch(`/users/${userId}/restore`);
            selectedUserId = null;
        }

        pendingUserAction = null;

        document.getElementById('user-confirmation-modal')?.remove();

        await loadAllUsers(currentPage);

    } catch (error) {
        console.error('User action failed:', error);

        messageContainer.innerHTML = `
            <p class="status-note">
                ${escapeHTML(
            error.response?.data?.message ||
            'حدث خطأ أثناء تنفيذ العملية.'
        )}
            </p>
        `;

        confirmButton.disabled = false;
        confirmButton.textContent = 'إعادة المحاولة';
    }
}

// Handle search.
allUsersContent.addEventListener('input', (event) => {
    if (event.target.id !== 'all-users-search') return;

    currentSearch = event.target.value.trim();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        selectedUserId = null;
        loadAllUsers(1);
    }, 400);
});

// Handle filters.
allUsersContent.addEventListener('change', (event) => {
    const target = event.target;

    if (target.id === 'all-users-role') {
        currentRole = target.value;
    } else if (target.id === 'all-users-status') {
        currentStatus = target.value;
    } else if (target.id === 'all-users-deleted') {
        showDeleted = target.value === '1';
    } else if (target.id === 'all-users-per-page') {
        perPage = Number(target.value);
    } else {
        return;
    }

    selectedUserId = null;
    loadAllUsers(1);
});

// Handle buttons and user actions.
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');

    if (!button || button.disabled) return;

    // Handle actions only inside the users section or user details modal.
    if (!button.closest('#all-users-content, #user-details-modal')) {
        return;
    }

    const action = button.dataset.action;
    const userId = button.dataset.id;

    if (action === 'page') {
        selectedUserId = null;
        loadAllUsers(Number(button.dataset.page));
        return;
    }

    if (action === 'details') {
        selectedUserId = Number(userId);
        renderUserDetails();
        return;
    }

    if (action === 'close-details') {
        selectedUserId = null;
        document.getElementById('user-details-modal')?.remove();
        return;
    }

    if (['block', 'unblock', 'delete', 'restore'].includes(action)) {
        showUserConfirmation(action, Number(userId));
    }
});