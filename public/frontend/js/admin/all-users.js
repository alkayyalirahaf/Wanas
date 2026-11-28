
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
let confirmDeleteUserId = null;

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

        <div id="user-details"></div>

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

// Display selected user details.
function renderUserDetails() {
    const user = currentUsers.find(
        (item) => item.id === Number(selectedUserId)
    );

    const detailsContainer = document.querySelector('#user-details');

    if (!user || !detailsContainer) return;

    let actionButtons = '';

    if (showDeleted) {
        actionButtons = `
            <button
                class="button"
                type="button"
                data-action="restore"
                data-id="${user.id}">
                استعادة المستخدم
            </button>
        `;
    } else {
        if (user.status === 'Active') {
            actionButtons += `
                <button
                    class="button button--secondary"
                    type="button"
                    data-action="block"
                    data-id="${user.id}">
                    حظر المستخدم
                </button>
            `;
        }

        if (user.status === 'Blocked') {
            actionButtons += `
                <button
                    class="button"
                    type="button"
                    data-action="unblock"
                    data-id="${user.id}">
                    فك الحظر
                </button>
            `;
        }

        actionButtons += `
            <button
                class="button button--secondary"
                type="button"
                data-action="delete"
                data-id="${user.id}">
                حذف المستخدم
            </button>
        `;
    }

    const deleteConfirmation = confirmDeleteUserId === user.id
        ? `
            <div class="status-note" style="margin-top: 1rem; padding: 1rem;">
                <p>هل أنت متأكد من حذف هذا المستخدم؟</p>

                <button
                    class="button"
                    type="button"
                    data-action="confirm-delete"
                    data-id="${user.id}">
                    نعم، احذف المستخدم
                </button>

                <button
                    class="button button--secondary"
                    type="button"
                    data-action="cancel-delete">
                    إلغاء
                </button>
            </div>
        `
        : '';

    detailsContainer.innerHTML = `
        <div class="panel" style="margin-top: 1.5rem; padding: 1.5rem;">
            <h3>تفاصيل المستخدم</h3>

            <p><strong>الاسم:</strong> ${escapeHTML(user.name)}</p>
            <p><strong>البريد الإلكتروني:</strong> ${escapeHTML(user.email)}</p>
            <p><strong>رقم الهاتف:</strong> ${escapeHTML(user.phoneNumber || 'غير متوفر')}</p>
            <p><strong>الدور:</strong> ${escapeHTML(getRoleLabel(user.role))}</p>
            <p><strong>الحالة:</strong> ${escapeHTML(getStatusLabel(user.status, showDeleted))}</p>
            <p><strong>نبذة:</strong> ${escapeHTML(user.bio || 'لا توجد نبذة')}</p>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
                ${actionButtons}

                <button
                    class="button button--secondary"
                    type="button"
                    data-action="close-details">
                    إغلاق التفاصيل
                </button>
            </div>

            ${deleteConfirmation}
        </div>
    `;
}

// Handle search.
allUsersContent.addEventListener('input', (event) => {
    if (event.target.id !== 'all-users-search') return;

    currentSearch = event.target.value.trim();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        selectedUserId = null;
        confirmDeleteUserId = null;
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
    confirmDeleteUserId = null;
    loadAllUsers(1);
});

// Handle buttons and user actions.
allUsersContent.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');

    if (!button || button.disabled) return;

    const action = button.dataset.action;
    const userId = button.dataset.id;

    if (action === 'page') {
        selectedUserId = null;
        confirmDeleteUserId = null;
        loadAllUsers(Number(button.dataset.page));
        return;
    }

    if (action === 'details') {
        selectedUserId = Number(userId);
        confirmDeleteUserId = null;
        renderUserDetails();
        return;
    }

    if (action === 'close-details') {
        selectedUserId = null;
        confirmDeleteUserId = null;

        const detailsContainer = document.querySelector('#user-details');

        if (detailsContainer) {
            detailsContainer.innerHTML = '';
        }

        return;
    }

    if (action === 'delete') {
        confirmDeleteUserId = Number(userId);
        renderUserDetails();
        return;
    }

    if (action === 'cancel-delete') {
        confirmDeleteUserId = null;
        renderUserDetails();
        return;
    }

    if (!userId) return;

    button.disabled = true;

    try {
        if (action === 'block') {
            await api.patch(`/users/${userId}/block`);
        } else if (action === 'unblock') {
            await api.patch(`/users/${userId}/unblock`);
        } else if (action === 'confirm-delete') {
            await api.delete(`/users/${userId}`);
            selectedUserId = null;
            confirmDeleteUserId = null;
        } else if (action === 'restore') {
            await api.patch(`/users/${userId}/restore`);
            selectedUserId = null;
            confirmDeleteUserId = null;
        }

        await loadAllUsers(currentPage);

    } catch (error) {
        console.error('User action failed:', error);

        showMessage(
            error.response?.data?.message ||
            'حدث خطأ أثناء تنفيذ العملية.'
        );
    }
});
