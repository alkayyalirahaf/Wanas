const eventId = new URLSearchParams(window.location.search).get('id');
const eventDetail = document.querySelector('#event-detail');
const eventMessage = document.querySelector('#event-message');
const eventJoinAction = document.querySelector('#event-join-action');

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

function formatDate(value) {
  if (!value) return 'التاريخ غير محدد';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('ar-EG');
}

function renderJoinAction(event, joinedMessage = 'أنت مسجل بالفعل') {
  const currentUser = readCurrentUser();
  eventJoinAction.replaceChildren();

  if (!currentUser) {
    const loginLink = document.createElement('a');
    loginLink.className = 'button';
    loginLink.href = 'login.html';
    loginLink.textContent = 'سجل دخول للتسجيل في الفعالية';
    eventJoinAction.append(loginLink);
    return;
  }

  const attendees = readArray('eventAttendees');
  const isJoined = attendees.some((attendee) =>
    String(attendee.eventId) === String(event.id) && String(attendee.userId) === String(currentUser.id)
  );
  const button = document.createElement('button');
  button.className = 'button';
  button.type = 'button';
  button.disabled = isJoined;
  button.textContent = isJoined ? joinedMessage : 'سجل في الفعالية';
  button.addEventListener('click', () => {
    const latestAttendees = readArray('eventAttendees');
    const alreadyRegistered = latestAttendees.some((attendee) =>
      String(attendee.eventId) === String(event.id) && String(attendee.userId) === String(currentUser.id)
    );
    if (!alreadyRegistered) {
      latestAttendees.push({ eventId: event.id, userId: currentUser.id });
      localStorage.setItem('eventAttendees', JSON.stringify(latestAttendees));
    }
    renderJoinAction(event, 'أنت مسجل في هذه الفعالية');
  });
  eventJoinAction.append(button);
}

const event = readArray('events').find((item) =>
  String(item.id) === String(eventId) && item.status === 'Published'
);

if (!event) {
  eventMessage.textContent = 'لم يتم العثور على هذه الفعالية أو لم تعد منشورة.';
} else {
  document.querySelector('#event-title').textContent = event.title || 'فعالية ونس';
  document.querySelector('#event-date').textContent = formatDate(event.date);
  document.querySelector('#event-time').textContent = event.time || 'الوقت غير محدد';
  document.querySelector('#event-description').textContent = event.description || 'تفاصيل الفعالية غير متوفرة حالياً.';
  document.title = `${event.title || 'الفعالية'} | ونس`;
  eventDetail.hidden = false;
  renderJoinAction(event);
}
