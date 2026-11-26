const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';




function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function showMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle('form-message--ok', isSuccess);
}

function redirectFor(user) {
  if (user.role === 'admin') return 'admin.html';
  if (user.role === 'facilitator') return 'organizer.html';
  if (user.role === 'specialist' || user.role === 'owner') return 'provider.html';
  return '../index.html';
}

const registerForm = document.querySelector('#register-form');
if (registerForm) {
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.querySelector('#register-message');
    if (!registerForm.reportValidity()) return;

    const formData = new FormData(registerForm);
    const name = String(formData.get('name')).trim();
    const email = String(formData.get('email')).trim().toLowerCase();
    const password = String(formData.get('password'));
    const role = String(formData.get('role'));
    const users = readUsers();

    if (users.some((user) => user.email.toLowerCase() === email)) {
      showMessage(message, 'هذا البريد الإلكتروني مسجّل بالفعل. جرّب تسجيل الدخول.');
      return;
    }

    const user = {
      id: globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      email,
      password,
      role,
      status: role === 'member' ? 'Active' : 'Pending',
    };

    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.location.assign(redirectFor(user));
  });
}

const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.querySelector('#login-message');
    if (!loginForm.reportValidity()) return;

    const formData = new FormData(loginForm);
    const email = String(formData.get('email')).trim().toLowerCase();
    const password = String(formData.get('password'));
    const user = readUsers().find((candidate) => candidate.email.toLowerCase() === email && candidate.password === password);

    if (!user) {
      showMessage(message, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      return;
    }

    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    if ((user.role === 'specialist' || user.role === 'owner') && user.status === 'Rejected') {
      showMessage(message, 'لم تتم الموافقة على الحساب بعد. يمكنك تحديث ملفك وإعادة تقديم الطلب.');
      window.location.assign('complete-profile.html');
      return;
    }
    if ((user.role === 'specialist' || user.role === 'owner') && user.status === 'Pending') {
      showMessage(message, 'حسابك قيد المراجعة. أكمل ملفك لإرسال مستندات التحقق.');
    }
    window.location.assign(redirectFor(user));
  });
}

// 
const roleSelect = document.querySelector('#role');
const roleHint = document.querySelector('#role-hint');
if (roleSelect && roleHint) {
  roleSelect.addEventListener('change', (e) => {
    if (e.target.value === 'specialist' || e.target.value === 'owner') {
      roleHint.style.display = 'block';
    } else {
      roleHint.style.display = 'none';
    }
  });
}
