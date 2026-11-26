const CURRENT_USER_KEY = 'currentUser';

function readCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(CURRENT_USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let currentUser = readCurrentUser();
if (!currentUser) {
  window.location.replace('login.html');
} else {
  const profileForm = document.querySelector('#profile-form');
  const profileMessage = document.querySelector('#profile-message');
  const facilitatorSection = document.querySelector('#facilitator-section');
  const facilitatorDashboardLink = document.querySelector('#facilitator-dashboard-link');
  const facilitatorMessage = document.querySelector('#facilitator-message');
  const applyButton = document.querySelector('#apply-facilitator-button');

  function roleLabel(role) {
    return ({ member: 'عضو', facilitator: 'ميسّر', specialist: 'أخصائي', owner: 'مالك مساحة', admin: 'مدير' })[role] || 'مستخدم';
  }

  function syncApprovedApplication() {
    const applications = readArray('facilitatorApplications');
    const approved = applications.some((application) =>
      String(application.userId) === String(currentUser.id) && application.status === 'Approved'
    );
    if (!approved || currentUser.role === 'facilitator') return false;

    const users = readArray('users');
    const userIndex = users.findIndex((user) => String(user.id) === String(currentUser.id));
    if (userIndex !== -1 && users[userIndex].role === 'member') {
      users[userIndex] = { ...users[userIndex], role: 'facilitator' };
      localStorage.setItem('users', JSON.stringify(users));
      currentUser = users[userIndex];
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      return true;
    }
    return false;
  }

  function getSavedUser() {
    const savedUser = readArray('users').find((user) => String(user.id) === String(currentUser.id));
    return savedUser || currentUser;
  }

  function renderApplicationState() {
    const applications = readArray('facilitatorApplications');
    const application = applications.find((item) =>
      String(item.userId) === String(currentUser.id) && ['Pending', 'Approved'].includes(item.status)
    );

    if (application?.status === 'Approved') {
      syncApprovedApplication();
      facilitatorMessage.textContent = 'أنت ميسر بالفعل.';
      applyButton.disabled = true;
      applyButton.textContent = 'أنت ميسر بالفعل';
      return;
    }
    if (application?.status === 'Pending') {
      facilitatorMessage.textContent = 'طلبك قيد المراجعة حالياً.';
      applyButton.disabled = true;
      applyButton.textContent = 'تم إرسال الطلب، بانتظار موافقة الإدارة';
      return;
    }

    facilitatorMessage.textContent = '';
    applyButton.disabled = false;
    applyButton.textContent = 'تقديم طلب لميسر';
  }

  function renderProfile() {
    const wasPromoted = syncApprovedApplication();
    currentUser = getSavedUser();
    if (wasPromoted) {
      profileMessage.textContent = 'أنت ميسر بالفعل.';
      profileMessage.classList.add('form-message--ok');
    }
    document.querySelector('#profile-display-name').textContent = currentUser.name || 'المستخدم';
    document.querySelector('#profile-avatar').textContent = (currentUser.name || 'و').trim().charAt(0) || 'و';
    document.querySelector('#profile-email').value = currentUser.email || '';
    document.querySelector('#profile-role').textContent = `الدور: ${roleLabel(currentUser.role)}`;
    document.querySelector('#profile-name').value = currentUser.name || '';
    document.querySelector('#profile-bio').value = currentUser.bio || '';

    facilitatorSection.hidden = currentUser.role !== 'member';
    facilitatorDashboardLink.hidden = currentUser.role !== 'facilitator';
    if (currentUser.role === 'member') renderApplicationState();
  }

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;

    const users = readArray('users');
    const userIndex = users.findIndex((user) => String(user.id) === String(currentUser.id));
    if (userIndex === -1) {
      profileMessage.textContent = 'تعذر العثور على حسابك. سجّل الدخول مجدداً.';
      profileMessage.classList.remove('form-message--ok');
      return;
    }

    const formData = new FormData(profileForm);
    users[userIndex] = {
      ...users[userIndex],
      name: String(formData.get('name') || '').trim(),
      bio: String(formData.get('bio') || '').trim(),
    };
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = users[userIndex];
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    profileMessage.textContent = 'تم حفظ التعديلات بنجاح.';
    profileMessage.classList.add('form-message--ok');
    renderProfile();
  });

  applyButton.addEventListener('click', () => {
    const applications = readArray('facilitatorApplications');
    const existingApplication = applications.find((application) =>
      String(application.userId) === String(currentUser.id) && ['Pending', 'Approved'].includes(application.status)
    );

    if (existingApplication?.status === 'Approved') {
      syncApprovedApplication();
      renderProfile();
      facilitatorMessage.textContent = 'أنت ميسر بالفعل.';
      return;
    }
    if (existingApplication?.status === 'Pending') {
      facilitatorMessage.textContent = 'طلبك قيد المراجعة حالياً.';
      applyButton.disabled = true;
      return;
    }

    applications.push({
      id: globalThis.crypto?.randomUUID?.() || `application-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    });
    localStorage.setItem('facilitatorApplications', JSON.stringify(applications));
    facilitatorMessage.textContent = 'طلبك قيد المراجعة حالياً.';
    applyButton.disabled = true;
    applyButton.textContent = 'تم إرسال الطلب، بانتظار موافقة الإدارة';
  });

  renderProfile();
}
