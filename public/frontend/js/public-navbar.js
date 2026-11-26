const navbarScriptUrl = document.currentScript?.src;
const landingPageUrl = navbarScriptUrl ? new URL('../index.html', navbarScriptUrl).href : '../index.html';
let publicCurrentUser = null;

try {
  publicCurrentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
} catch {
  publicCurrentUser = null;
}

if (publicCurrentUser) {
  const loginLink = document.querySelector('#header-login');
  const registerLink = document.querySelector('#header-register');
  const userMenu = document.querySelector('#header-user');
  const profileLink = document.querySelector('#header-profile');
  const logoutButton = document.querySelector('#header-logout');

  if (loginLink) loginLink.hidden = true;
  if (registerLink) registerLink.hidden = true;
  if (profileLink) {
    profileLink.href = new URL('../html/profile.html', navbarScriptUrl).href;
    profileLink.textContent = `أهلاً، ${publicCurrentUser.name || 'بك'}`;
  }
  if (userMenu) userMenu.hidden = false;

  logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = landingPageUrl;
  });

  // A user's other tab can approve a facilitator application. Refresh this
  // tab's session from the shared users list and route newly approved users.
  window.addEventListener('storage', (event) => {
    if (event.key !== 'users' || !event.newValue) return;
    try {
      const users = JSON.parse(event.newValue);
      const updatedUser = Array.isArray(users)
        ? users.find((user) => String(user.id) === String(publicCurrentUser.id))
        : null;
      if (!updatedUser) return;

      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      if (updatedUser.role === 'facilitator' && publicCurrentUser.role !== 'facilitator') {
        window.location.assign(new URL('../html/organizer.html', navbarScriptUrl).href);
      }
    } catch {
      // Ignore malformed updates and keep the current session intact.
    }
  });
}
