const spaceId = new URLSearchParams(window.location.search).get('id');
const spaceHero = document.querySelector('#space-hero');
const detailLayout = document.querySelector('#space-detail-layout');
const pageMessage = document.querySelector('#page-message');
const bookingForm = document.querySelector('#space-booking-form');
const bookingMessage = document.querySelector('#booking-message');
const paymentModal = document.querySelector('#payment-modal');
const paymentForm = document.querySelector('#payment-form');
const paymentMessage = document.querySelector('#payment-message');
const payButton = document.querySelector('#pay-button');
const bookingSummary = document.querySelector('#booking-summary');
let space = null;
let bookingDetails = null;

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

function getSpaceTitle(item) {
  return item.title || item.name || 'مساحة ونس';
}

function getSpacePrice(item) {
  return Number(item.pricePerHour ?? item.price) || 0;
}

function formatMoney(value) {
  return `${Number(value).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} دينار`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderSpace() {
  if (!space) {
    spaceHero.hidden = true;
    pageMessage.textContent = 'لم يتم العثور على هذه المساحة.';
    return;
  }

  const title = getSpaceTitle(space);
  const city = space.city || 'المدينة غير محددة';
  const capacity = Number(space.capacity) || 0;
  const price = getSpacePrice(space);
  spaceHero.innerHTML = `
    <div class="person-avatar person-avatar--large" aria-hidden="true">${escapeHtml(title.trim().charAt(0) || 'م')}</div>
    <div>
      <span class="tag">مساحة متاحة</span>
      <h1>${escapeHtml(title)}</h1>
      <div class="inline-meta"><span>${escapeHtml(city)}</span><span>السعة: ${capacity.toLocaleString('ar-EG')} شخص</span></div>
      <p class="cost-note">السعر: ${escapeHtml(formatMoney(price))} / ساعة</p>
    </div>`;
  document.title = `${title} | ونس`;
  document.querySelector('#space-description').textContent = space.description || 'مساحة مريحة مناسبة للقاءات والأنشطة المجتمعية.';
  document.querySelector('#space-city').textContent = `المدينة: ${city}`;
  document.querySelector('#space-capacity').textContent = `السعة: ${capacity.toLocaleString('ar-EG')} شخص`;
  document.querySelector('#space-price-note').textContent = `${formatMoney(price)} للساعة`;
  detailLayout.hidden = false;
}

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!readCurrentUser()) {
    window.location.assign('login.html');
    return;
  }
  if (!space || !bookingForm.reportValidity()) return;

  const formData = new FormData(bookingForm);
  bookingDetails = {
    date: String(formData.get('date')),
    time: String(formData.get('time')),
    amount: getSpacePrice(space),
  };
  bookingSummary.innerHTML = `
    <dl class="details-list">
      <dt>المساحة</dt><dd>${escapeHtml(getSpaceTitle(space))}</dd>
      <dt>التاريخ</dt><dd>${escapeHtml(bookingDetails.date)}</dd>
      <dt>الوقت</dt><dd>${escapeHtml(bookingDetails.time)}</dd>
      <dt>الإجمالي</dt><dd>${escapeHtml(formatMoney(bookingDetails.amount))}</dd>
    </dl>`;
  paymentMessage.textContent = '';
  paymentMessage.classList.remove('form-message--ok');
  payButton.disabled = false;
  payButton.textContent = 'ادفع الآن';
  paymentForm.reset();
  paymentModal.hidden = false;
  document.querySelector('#card-number').focus();
});

paymentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const currentUser = readCurrentUser();
  if (!currentUser) {
    window.location.assign('login.html');
    return;
  }
  if (!space || !bookingDetails || payButton.disabled) return;

  payButton.disabled = true;
  payButton.textContent = 'جاري المعالجة...';
  window.setTimeout(() => {
    const bookings = readArray('bookings');
    bookings.push({
      id: Date.now().toString(),
      userId: currentUser.id,
      providerId: space.ownerId,
      spaceId: space.id,
      type: 'space',
      date: bookingDetails.date,
      time: bookingDetails.time,
      amount: bookingDetails.amount,
      status: 'Pending',
    });
    localStorage.setItem('bookings', JSON.stringify(bookings));
    paymentMessage.textContent = 'تم الدفع بنجاح. طلبك قيد المراجعة من قبل صاحب المساحة.';
    paymentMessage.classList.add('form-message--ok');

    window.setTimeout(() => {
      window.location.assign('../index.html');
    }, 2000);
  }, 1500);
});

function closePaymentModal() {
  if (!payButton.disabled) paymentModal.hidden = true;
}

document.querySelector('#close-payment-modal').addEventListener('click', closePaymentModal);
paymentModal.addEventListener('click', (event) => {
  if (event.target === paymentModal) closePaymentModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !paymentModal.hidden) closePaymentModal();
});

space = readArray('spaces').find((item) => String(item.id) === String(spaceId)) || null;
renderSpace();
