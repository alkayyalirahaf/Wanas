const specialistId = new URLSearchParams(window.location.search).get('id');
const profileContainer = document.querySelector('#specialist-profile');
const slotsContainer = document.querySelector('#available-slots');
const pageMessage = document.querySelector('#page-message');
const paymentModal = document.querySelector('#payment-modal');
const paymentForm = document.querySelector('#payment-form');
const paymentMessage = document.querySelector('#payment-message');
const payButton = document.querySelector('#pay-button');
const bookingSummary = document.querySelector('#booking-summary');
let selectedSlot = null;
let specialist = null;

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function formatMoney(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} دينار`;
}

function formatDate(value) {
  if (!value) return 'غير محدد';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('ar-EG');
}

function getSpecialist() {
  return readArray('users').find((user) =>
    String(user.id) === String(specialistId) && user.role === 'specialist' && user.status === 'Active'
  ) || null;
}

function renderProfile() {
  if (!specialist) {
    profileContainer.hidden = true;
    pageMessage.textContent = 'لم يتم العثور على الأخصائي المطلوب.';
    slotsContainer.innerHTML = '<p class="status-note">تعذر عرض المواعيد.</p>';
    return;
  }

  const name = specialist.name || 'أخصائي';
  const specialtyName = specialist.specialty || specialist.specialization || 'أخصائي دعم نفسي';
  const price = specialist.price ?? 0;
  const initials = name.trim().charAt(0) || 'أ';

  profileContainer.innerHTML = `
    <div class="person-avatar person-avatar--large" aria-hidden="true">${escapeHtml(initials)}</div>
    <div>
      <span class="tag">أخصائي معتمد</span>
      <h1>${escapeHtml(name)}</h1>
      <p class="lede">${escapeHtml(specialtyName)}</p>
      <p class="cost-note">سعر الجلسة: ${escapeHtml(formatMoney(price))}</p>
    </div>`;
  document.title = `${name} | ونس`;
}

function renderSlots() {
  if (!specialist) return;
  const slots = readArray('slots').filter((slot) =>
    String(slot.specialistId) === String(specialist.id) && slot.status === 'Available'
  );
  slotsContainer.replaceChildren();

  if (!slots.length) {
    const empty = document.createElement('p');
    empty.className = 'status-note';
    empty.textContent = 'لا توجد مواعيد متاحة حالياً';
    slotsContainer.append(empty);
    return;
  }

  slots.forEach((slot) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-body">
        <span class="tag">موعد متاح</span>
        <h3>${escapeHtml(formatDate(slot.date))}</h3>
        <p>الوقت: ${escapeHtml(slot.time || 'غير محدد')}</p>
        <button class="button" type="button" data-slot-id="${escapeHtml(slot.id)}">اختيار هذا الموعد</button>
      </div>`;
    slotsContainer.append(card);
  });
}

function openPayment(slot) {
  const sessionUser = readCurrentUser();
  if (!sessionUser) {
    window.location.assign('login.html');
    return;
  }
  selectedSlot = slot;
  bookingSummary.innerHTML = `
    <dl class="details-list">
      <dt>الأخصائي</dt><dd>${escapeHtml(specialist.name || 'أخصائي')}</dd>
      <dt>التاريخ</dt><dd>${escapeHtml(formatDate(slot.date))}</dd>
      <dt>الوقت</dt><dd>${escapeHtml(slot.time || 'غير محدد')}</dd>
      <dt>الإجمالي</dt><dd>${escapeHtml(formatMoney(specialist.price))}</dd>
    </dl>`;
  paymentMessage.textContent = '';
  paymentMessage.classList.remove('form-message--ok');
  payButton.disabled = false;
  payButton.textContent = 'ادفع الآن';
  paymentForm.reset();
  paymentModal.hidden = false;
  document.querySelector('#card-number').focus();
}

function readCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function closePayment() {
  if (!payButton.disabled) paymentModal.hidden = true;
}

slotsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-slot-id]');
  if (!button) return;
  const slot = readArray('slots').find((item) =>
    String(item.id) === button.dataset.slotId && String(item.specialistId) === String(specialistId) && item.status === 'Available'
  );
  if (!slot) {
    renderSlots();
    pageMessage.textContent = 'لم يعد هذا الموعد متاحاً. اختر موعداً آخر.';
    return;
  }
  openPayment(slot);
});

paymentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const currentUser = readCurrentUser();
  if (!currentUser) {
    window.location.assign('login.html');
    return;
  }
  if (!selectedSlot || payButton.disabled) return;

  payButton.disabled = true;
  payButton.textContent = 'جاري المعالجة...';

  window.setTimeout(() => {
    const slots = readArray('slots');
    const slotIndex = slots.findIndex((slot) =>
      String(slot.id) === String(selectedSlot.id) &&
      String(slot.specialistId) === String(specialistId) &&
      slot.status === 'Available'
    );

    if (slotIndex === -1) {
      payButton.disabled = false;
      payButton.textContent = 'ادفع الآن';
      paymentMessage.textContent = 'عذراً، تم حجز هذا الموعد بالفعل. اختر موعداً آخر.';
      renderSlots();
      return;
    }

    const bookings = readArray('bookings');
    bookings.push({
      id: Date.now().toString(),
      userId: currentUser.id,
      providerId: specialist.id,
      date: selectedSlot.date,
      time: selectedSlot.time,
      amount: Number(specialist.price) || 0,
      status: 'Confirmed',
      type: 'specialist',
    });
    localStorage.setItem('bookings', JSON.stringify(bookings));

    slots[slotIndex] = { ...slots[slotIndex], status: 'Booked' };
    localStorage.setItem('slots', JSON.stringify(slots));
    paymentMessage.textContent = 'تم الدفع وتأكيد الحجز بنجاح!';
    paymentMessage.classList.add('form-message--ok');

    window.setTimeout(() => {
      paymentModal.hidden = true;
      window.location.reload();
    }, 2000);
  }, 1500);
});

document.querySelector('#close-payment-modal').addEventListener('click', closePayment);
paymentModal.addEventListener('click', (event) => {
  if (event.target === paymentModal) closePayment();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !paymentModal.hidden) closePayment();
});

specialist = getSpecialist();
renderProfile();
renderSlots();
