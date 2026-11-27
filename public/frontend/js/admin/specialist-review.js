
import { api } from './api.js';

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

// Translate document status.
function getDocumentStatusLabel(status) {
  const labels = {
    pending: 'بانتظار المراجعة',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
  };

  return labels[status] || status;
}

// Render verification documents.
export function renderSpecialistDocuments(documents) {
  if (!documents || documents.length === 0) {
    return 'لا توجد مستندات';
  }

  return documents.map((document) => {
    const type = document.documentType === 'license'
      ? 'الرخصة المهنية'
      : 'الهوية';

    return `
      <div class="document-item">
        <button
          type="button"
          class="document-link"
          data-document-id="${Number(document.id)}">
          ${type}
        </button>
        <span>${escapeHTML(getDocumentStatusLabel(document.status))}</span>
      </div>
    `;
  }).join('');
}

// Display an inline message in the supplied element or container.
function showInlineMessage(target, message, isError = true) {
  if (!target) return;

  if (target instanceof Element && target.matches('#review-message')) {
    target.textContent = message;
    target.style.color = isError ? '#dc2626' : '#15803d';
    return;
  }

  let note = target.querySelector?.('[data-document-message]');

  if (!note) {
    note = document.createElement('p');
    note.dataset.documentMessage = 'true';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    target.prepend(note);
  }

  note.className = 'status-note';
  note.textContent = message;
  note.style.color = isError ? '#dc2626' : '#15803d';
}

// Open a private verification document.
export async function openVerificationDocument(documentId, messageTarget) {
  const documentWindow = window.open('', '_blank');

  if (!documentWindow) {
    showInlineMessage(
      messageTarget,
      'يرجى السماح بفتح النوافذ المنبثقة في المتصفح.'
    );
    return;
  }

  try {
    const response = await api.get(
      `/verification-documents/${documentId}`,
      { responseType: 'blob' }
    );

    const fileURL = URL.createObjectURL(response.data);
    documentWindow.location.href = fileURL;

  } catch (error) {
    console.error('Failed to open verification document:', error);
    documentWindow.close();

    showInlineMessage(
      messageTarget,
      'تعذّر فتح المستند. تأكدي من تسجيل الدخول وحاولي مرة أخرى.'
    );
  }
}

// Open the specialist review dialog.
export function openSpecialistReview(specialist, onReviewed) {
  if (!specialist) return;

  const specialistId = specialist.id;
  const user = specialist.user || {};
  const dialog = document.createElement('dialog');

  dialog.style.cssText = `
    width: min(600px, 90%);
    max-height: 85vh;
    overflow-y: auto;
    border: none;
    border-radius: 12px;
    padding: 25px;
  `;

  dialog.innerHTML = `
    <h2>مراجعة طلب توثيق الأخصائي</h2>

    <div>
      <p><strong>الاسم:</strong> ${escapeHTML(user.name)}</p>
      <p><strong>البريد الإلكتروني:</strong> ${escapeHTML(user.email)}</p>
      <p><strong>رقم الهاتف:</strong> ${escapeHTML(user.phoneNumber || '—')}</p>
      <p><strong>التخصص:</strong> ${escapeHTML(specialist.specialty || '—')}</p>
      <p><strong>نبذة:</strong> ${escapeHTML(specialist.bio || '—')}</p>
      <p><strong>السعر:</strong> ${escapeHTML(specialist.price || '—')}</p>
    </div>

    <hr>
    <h3>المستندات المرفقة</h3>
    ${renderSpecialistDocuments(user.verification_documents || [])}

    <hr>
    <h3>قرار التوثيق</h3>

    <div style="margin-bottom: 15px;">
      <label for="rejection-reason">
        سبب الرفض (مطلوب عند الرفض):
      </label>

      <textarea
        id="rejection-reason"
        rows="4"
        maxlength="1000"
        placeholder="اكتبي سبب رفض طلب التوثيق..."
        style="display: block; width: 100%; margin-top: 8px;"
      ></textarea>
    </div>

    <div
      id="review-confirmation"
      hidden
      style="margin: 15px 0; padding: 15px; border-radius: 8px; background: #f3f4f6;"
    >
      <p id="confirmation-text"></p>

      <div style="display: flex; gap: 10px;">
        <button type="button" class="button button--primary" data-action="confirm">
          تأكيد
        </button>

        <button type="button" class="button button--secondary" data-action="cancel">
          إلغاء
        </button>
      </div>
    </div>

    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <button type="button" class="button button--primary" data-action="approve">
        قبول الطلب
      </button>

      <button type="button" class="button button--danger" data-action="reject">
        رفض الطلب
      </button>

      <button type="button" class="button button--secondary" data-action="close">
        إغلاق
      </button>
    </div>

    <p
      id="review-message"
      role="status"
      aria-live="polite"
      style="margin-top: 15px;"
    ></p>
  `;

  document.body.appendChild(dialog);

  dialog.addEventListener('close', () => {
    dialog.remove();
  });

  dialog.addEventListener('click', async (event) => {
    const documentButton = event.target.closest('button[data-document-id]');

    if (documentButton) {
      openVerificationDocument(
        documentButton.dataset.documentId,
        dialog.querySelector('#review-message')
      );
      return;
    }

    const actionButton = event.target.closest('button[data-action]');
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const message = dialog.querySelector('#review-message');
    const confirmation = dialog.querySelector('#review-confirmation');
    const confirmationText = dialog.querySelector('#confirmation-text');
    const reasonInput = dialog.querySelector('#rejection-reason');

    const reviewButtons = dialog.querySelectorAll(
      'button[data-action="approve"], button[data-action="reject"]'
    );

    if (action === 'close') {
      dialog.close();
      return;
    }

    if (action === 'cancel') {
      confirmation.hidden = true;
      dialog.dataset.pendingAction = '';
      return;
    }

    if (action === 'approve' || action === 'reject') {
      if (action === 'reject' && reasonInput.value.trim().length < 5) {
        message.textContent = 'يرجى كتابة سبب الرفض (5 أحرف على الأقل).';
        message.style.color = '#dc2626';
        return;
      }

      dialog.dataset.pendingAction = action;

      confirmationText.textContent = action === 'approve'
        ? 'هل أنتِ متأكدة من قبول طلب هذا الأخصائي؟'
        : 'هل أنتِ متأكدة من رفض طلب هذا الأخصائي؟';

      confirmation.hidden = false;
      message.textContent = '';
      return;
    }

    if (action === 'confirm') {
      const pendingAction = dialog.dataset.pendingAction;
      if (!pendingAction) return;

      const reason = reasonInput.value.trim();
      confirmation.hidden = true;

      reviewButtons.forEach((button) => {
        button.disabled = true;
      });

      actionButton.disabled = true;

      message.textContent = 'جاري تنفيذ القرار...';
      message.style.cssText = 'margin-top: 15px; color: #64748b;';

      try {
        if (pendingAction === 'approve') {
          await api.patch(`/specialist-verifications/${specialistId}/approve`);
        } else {
          await api.patch(
            `/specialist-verifications/${specialistId}/reject`,
            { reason }
          );
        }

        message.textContent = pendingAction === 'approve'
          ? 'تم قبول طلب الأخصائي بنجاح.'
          : 'تم رفض طلب الأخصائي بنجاح.';

        message.style.cssText = `
          color: #15803d;
          background: #dcfce7;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
        `;

        if (typeof onReviewed === 'function') {
          await onReviewed();
        }

        dialog.close();

      } catch (error) {
        console.error('Failed to review specialist:', error);

        message.textContent =
          error.response?.data?.message ||
          'حدث خطأ أثناء تنفيذ القرار. يرجى المحاولة مرة أخرى.';

        message.style.cssText = `
          color: #dc2626;
          background: #fee2e2;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
        `;

        reviewButtons.forEach((button) => {
          button.disabled = false;
        });

        actionButton.disabled = false;
      }
    }
  });

  dialog.showModal();
}
