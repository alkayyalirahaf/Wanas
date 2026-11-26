const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const form = document.querySelector('#complete-profile-form');
const roleFields = document.querySelector('#role-fields');
const message = document.querySelector('#profile-message');

function readCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function showMessage(text, isSuccess = false) {
  message.textContent = text;
  message.classList.toggle('form-message--ok', isSuccess);
}

const currentUser = readCurrentUser();
if (!currentUser || !['specialist', 'owner'].includes(currentUser.role)) {
  window.location.replace('login.html');
} else {
  const isSpecialist = currentUser.role === 'specialist';
  const detailName = isSpecialist ? 'التخصص' : 'اسم المساحة';
  const documentName = isSpecialist ? 'الرخصة المهنية (صورة أو PDF)' : 'إثبات الملكية (صورة أو PDF)';
  const detailFieldName = isSpecialist ? 'specialization' : 'spaceName';
  const verificationFieldName = isSpecialist ? 'professionalLicense' : 'ownershipProof';

  roleFields.innerHTML = `
    <label class="field" for="provider-detail">${detailName}
      <input id="provider-detail" name="${detailFieldName}" type="text" required>
    </label>
    <label class="upload-field">${documentName}
      <span class="upload-dropzone">
        <span>اختر المستند</span>
        <span class="upload-dropzone__hint">صورة أو ملف PDF</span>
        <span class="upload-file-name" data-file-name>لم يتم اختيار ملف</span>
        <input type="file" name="${verificationFieldName}" accept="image/*,.pdf" required aria-label="${documentName}">
      </span>
    </label>
  `;

  form.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const fileName = input.closest('.upload-dropzone').querySelector('[data-file-name]');
      fileName.textContent = input.files?.[0]?.name || 'لم يتم اختيار ملف';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const agreement = form.elements.namedItem('commissionAgreement');
    if (!agreement.checked) {
      showMessage('يرجى الموافقة على اتفاقية المنصة وعمولة 8% لإرسال الطلب.');
      agreement.focus();
      return;
    }
    if (!form.reportValidity()) return;

    const users = readUsers();
    const userIndex = users.findIndex((user) => user.id === currentUser.id);
    if (userIndex === -1) {
      showMessage('تعذر العثور على حسابك. سجّل الدخول مجدداً وحاول مرة أخرى.');
      return;
    }

    const submittedAt = new Date().toISOString();
    users[userIndex] = { ...users[userIndex], status: 'Pending', submittedAt };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const updatedUser = { ...currentUser, status: 'Pending', submittedAt };
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    form.querySelector('button[type="submit"]').disabled = true;
    showMessage('تم إرسال مستنداتك بنجاح. حسابك قيد المراجعة من قبل الإدارة.', true);

    window.setTimeout(() => {
      sessionStorage.clear();
      window.location.assign('login.html');
    }, 2000);
  });
}
