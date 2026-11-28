
import { api } from './api.js';

const content = document.getElementById('payments-content');

let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let perPage = 10;
let searchTimer = null;

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

// Translate payment status into Arabic.
function getStatusLabel(status) {
    const labels = {
        succeeded: 'ناجحة',
        failed: 'فاشلة',
        refunded: 'مستردة',
    };

    return labels[status] || status || '—';
}

// Format monetary values.
function formatAmount(amount) {
    if (amount === null || amount === undefined) {
        return 'غير متوفر';
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
        return 'غير متوفر';
    }

    return number.toFixed(2);
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

// Display messages.
function showMessage(message) {
    if (!content) return;

    content.innerHTML = `
        <p class="status-note">${escapeHTML(message)}</p>
    `;
}

// Load payments from the API.
export async function loadPayments(page = 1) {
    if (!content) return;

    currentPage = page;
    showMessage('جاري تحميل المدفوعات...');

    try {
        const response = await api.get('/payments', {
            params: {
                page: currentPage,
                search: currentSearch,
                status: currentStatus,
                per_page: perPage,
            },
        });

        const pagination = response.data.data;
        const payments = pagination.data;

        renderPayments(payments, pagination);

    } catch (error) {
        console.error('Failed to load payments:', error);

        showMessage(
            error.response?.data?.message ||
            'حدث خطأ أثناء تحميل المدفوعات.'
        );
    }
}

// Render payments table and filters.
function renderPayments(payments, pagination) {
    content.innerHTML = `
        <div class="verification-toolbar">

            <div class="search-box">
                <input
                    type="search"
                    id="payment-search"
                    placeholder="ابحث برقم العملية أو اسم العضو أو الأخصائي..."
                    aria-label="البحث عن مدفوعات"
                    value="${escapeHTML(currentSearch)}"
                >
            </div>

            <select id="payment-status-filter"
                aria-label="فلترة حسب حالة الدفع">

                <option value="">جميع الحالات</option>

                <option value="succeeded"
                    ${currentStatus === 'succeeded' ? 'selected' : ''}>
                    ناجحة
                </option>

                <option value="failed"
                    ${currentStatus === 'failed' ? 'selected' : ''}>
                    فاشلة
                </option>

                <option value="refunded"
                    ${currentStatus === 'refunded' ? 'selected' : ''}>
                    مستردة
                </option>
            </select>

            <select id="payments-per-page"
                aria-label="عدد النتائج في الصفحة">

                <option value="10" ${perPage === 10 ? 'selected' : ''}>
                    10 نتائج
                </option>

                <option value="25" ${perPage === 25 ? 'selected' : ''}>
                    25 نتيجة
                </option>

                <option value="50" ${perPage === 50 ? 'selected' : ''}>
                    50 نتيجة
                </option>
            </select>

        </div>

        <div class="table-responsive">

            ${payments.length ? `
                <table style="width: 100%; min-width: 850px; border-collapse: separate; border-spacing: 0;">

                    <thead>
                        <tr>
                            <th>رقم الدفع</th>
                            <th>العضو</th>
                            <th>الأخصائي</th>
                            <th>المبلغ</th>
                            <th>عمولة المنصة</th>
                            <th>الحالة</th>
                            <th>تاريخ الدفع</th>
                            <th>التفاصيل</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${payments.map(renderPaymentRow).join('')}
                    </tbody>

                </table>
            ` : `
                <p class="status-note">
                    لا توجد مدفوعات لعرضها.
                </p>
            `}

        </div>

        <div class="pagination">

            <span class="pagination-info">
                عرض ${pagination.from ?? 0} إلى ${pagination.to ?? 0}
                من أصل ${pagination.total}
            </span>

            <div class="pagination-buttons">

                <button
                    class="button button--secondary"
                    data-page="${pagination.current_page - 1}"
                    ${pagination.current_page <= 1 ? 'disabled' : ''}>
                    السابق
                </button>

                <span>
                    صفحة ${pagination.current_page} من ${pagination.last_page}
                </span>

                <button
                    class="button button--secondary"
                    data-page="${pagination.current_page + 1}"
                    ${pagination.current_page >= pagination.last_page ? 'disabled' : ''}>
                    التالي
                </button>

            </div>

        </div>
    `;

    attachEventListeners();
}

// Render one payment row.
function renderPaymentRow(payment) {
    const booking = payment.booking;
    const member = booking?.user;
    const specialist = booking?.specialist?.user;

    const platformFee =
        payment.platformFee ?? booking?.platformCommission;

    return `
        <tr>

            <td>${escapeHTML(payment.id)}</td>

            <td>${escapeHTML(member?.name || '—')}</td>

            <td>${escapeHTML(specialist?.name || '—')}</td>

            <td>${escapeHTML(formatAmount(payment.amount))}</td>

            <td>${escapeHTML(formatAmount(platformFee))}</td>

            <td>${escapeHTML(getStatusLabel(payment.status))}</td>

            <td>${escapeHTML(formatDate(payment.created_at))}</td>

            <td>
                <button
                    class="button button--secondary"
                    data-action="details"
                    data-id="${escapeHTML(payment.id)}">
                    التفاصيل
                </button>
            </td>

        </tr>
    `;
}

// Attach listeners to filters and actions.
function attachEventListeners() {
    document.getElementById('payment-search')
        ?.addEventListener('input', (event) => {
            currentSearch = event.target.value;

            clearTimeout(searchTimer);

            searchTimer = setTimeout(() => {
                loadPayments(1);
            }, 400);
        });

    document.getElementById('payment-status-filter')
        ?.addEventListener('change', (event) => {
            currentStatus = event.target.value;
            loadPayments(1);
        });

    document.getElementById('payments-per-page')
        ?.addEventListener('change', (event) => {
            perPage = Number(event.target.value);
            loadPayments(1);
        });

    content.querySelectorAll('[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
            loadPayments(Number(button.dataset.page));
        });
    });

    content.querySelectorAll('[data-action="details"]').forEach((button) => {
        button.addEventListener('click', () => {
            showPaymentDetails(Number(button.dataset.id));
        });
    });
}

// Display payment details inside a modal.
async function showPaymentDetails(paymentId) {
    document.getElementById('payment-details-modal')?.remove();

    const modal = document.createElement('div');

    modal.id = 'payment-details-modal';
    modal.className = 'admin-modal-overlay';

    modal.innerHTML = `
        <div class="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-details-title"
            style="max-width: 650px; max-height: 90vh; overflow-y: auto;">

            <p class="status-note">جاري تحميل التفاصيل...</p>

        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closePaymentDetailsModal();
        }
    });

    try {
        const response = await api.get(`/payments/${paymentId}`);

        const payment = response.data.data;

        const booking = payment.booking;
        const member = booking?.user;
        const specialist = booking?.specialist;
        const specialistUser = specialist?.user;
        const slot = booking?.slot;

        const platformFee =
            payment.platformFee ?? booking?.platformCommission;

        const modalContent = modal.querySelector('.admin-modal');

        modalContent.innerHTML = `
            <h2 id="payment-details-title">
                تفاصيل عملية الدفع
            </h2>

            <div style="text-align: right; line-height: 2; margin-top: 20px;">

                <h3>معلومات الدفع</h3>

                <p>
                    <strong>رقم عملية الدفع:</strong>
                    ${escapeHTML(payment.id)}
                </p>

                <p>
                    <strong>حالة الدفع:</strong>
                    ${escapeHTML(getStatusLabel(payment.status))}
                </p>

                <p>
                    <strong>المبلغ:</strong>
                    ${escapeHTML(formatAmount(payment.amount))}
                </p>

                <p>
                    <strong>عمولة المنصة:</strong>
                    ${escapeHTML(formatAmount(platformFee))}
                </p>

                <p>
                    <strong>رقم Stripe Payment Intent:</strong>
                    ${escapeHTML(payment.stripePaymentIntentId || 'غير متوفر')}
                </p>

                <p>
                    <strong>تاريخ إنشاء الدفع:</strong>
                    ${escapeHTML(formatDate(payment.created_at))}
                </p>

                <p>
                    <strong>آخر تحديث:</strong>
                    ${escapeHTML(formatDate(payment.updated_at))}
                </p>

                <hr>

                <h3>معلومات الحجز</h3>

                <p>
                    <strong>رقم الحجز:</strong>
                    ${escapeHTML(booking?.id ?? 'غير متوفر')}
                </p>

                <p>
                    <strong>حالة الحجز:</strong>
                    ${escapeHTML(booking?.status || 'غير متوفر')}
                </p>

                <p>
                    <strong>مبلغ الحجز:</strong>
                    ${escapeHTML(formatAmount(booking?.amount))}
                </p>

                <p>
                    <strong>عمولة المنصة من الحجز:</strong>
                    ${escapeHTML(formatAmount(booking?.platformCommission))}
                </p>

                <p>
                    <strong>مستحقات الأخصائي:</strong>
                    ${escapeHTML(formatAmount(booking?.providerAmount))}
                </p>

                <p>
                    <strong>بداية الموعد:</strong>
                    ${escapeHTML(formatDate(booking?.startsAt))}
                </p>

                <p>
                    <strong>نهاية الموعد:</strong>
                    ${escapeHTML(formatDate(booking?.endsAt))}
                </p>

                <hr>

                <h3>معلومات العضو</h3>

                <p>
                    <strong>الاسم:</strong>
                    ${escapeHTML(member?.name || 'غير متوفر')}
                </p>

                <p>
                    <strong>البريد الإلكتروني:</strong>
                    ${escapeHTML(member?.email || 'غير متوفر')}
                </p>

                <hr>

                <h3>معلومات الأخصائي</h3>

                <p>
                    <strong>الاسم:</strong>
                    ${escapeHTML(specialistUser?.name || 'غير متوفر')}
                </p>

                <p>
                    <strong>البريد الإلكتروني:</strong>
                    ${escapeHTML(specialistUser?.email || 'غير متوفر')}
                </p>

                <p>
                    <strong>التخصص:</strong>
                    ${escapeHTML(specialist?.specialty || 'غير متوفر')}
                </p>

                <p>
                    <strong>سعر الأخصائي:</strong>
                    ${escapeHTML(formatAmount(specialist?.price))}
                </p>

                <hr>

                <h3>معلومات الموعد</h3>

                <p>
                    <strong>رقم الموعد:</strong>
                    ${escapeHTML(slot?.id ?? 'غير متوفر')}
                </p>

            </div>

            <div class="admin-modal-actions">
                <button
                    class="button button--secondary"
                    type="button"
                    id="close-payment-details">
                    إغلاق
                </button>
            </div>
        `;

        modalContent.querySelector('#close-payment-details')
            .addEventListener('click', closePaymentDetailsModal);

    } catch (error) {
        console.error('Failed to load payment details:', error);

        modal.querySelector('.admin-modal').innerHTML = `
            <h2>تعذر تحميل التفاصيل</h2>

            <p class="status-note">
                ${escapeHTML(
                    error.response?.data?.message ||
                    'حدث خطأ أثناء تحميل تفاصيل الدفع.'
                )}
            </p>

            <div class="admin-modal-actions">
                <button
                    class="button button--secondary"
                    type="button"
                    id="close-payment-details">
                    إغلاق
                </button>
            </div>
        `;

        modal.querySelector('#close-payment-details')
            .addEventListener('click', closePaymentDetailsModal);
    }
}

// Close payment details modal.
function closePaymentDetailsModal() {
    document.getElementById('payment-details-modal')?.remove();
}
