
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

// Display the facilitator application review dialog.
export function openFacilitatorReview(application, onReviewed) {
  if (!application) return;

  const applicationId = application.id;
  const applicant = application.applicant || {};

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
    <h2>مراجعة طلب الانضمام كميسّر</h2>

    <div>
      <p><strong>الاسم:</strong> ${escapeHTML(applicant.name || '—')}</p>
      <p><strong>البريد الإلكتروني:</strong> ${escapeHTML(applicant.email || '—')}</p>
      <p><strong>رقم الهاتف:</strong> ${escapeHTML(applicant.phoneNumber || '—')}</p>
      <p><strong>الموضوع المقترح:</strong> ${escapeHTML(application.proposedTopic || '—')}</p>
      <p><strong>سبب التقديم:</strong></p>
      <p>${escapeHTML(application.reason || '—')}</p>
    </div>

    <hr>
    <h3>قرار مراجعة الطلب</h3>

    <div style="margin-bottom: 15px;">
      <label for="facilitator-rejection-reason">
        سبب الرفض (مطلوب عند الرفض):
      </label>

      <textarea
        id="facilitator-rejection-reason"
        rows="4"
        maxlength="1000"
        placeholder="اكتبي سبب رفض الطلب..."
        style="display: block; width: 100%; margin-top: 8px;"
      ></textarea>
    </div>

    <div
      id="facilitator-review-confirmation"
      hidden
      style="margin: 15px 0; padding: 15px; border-radius: 8px; background: #f3f4f6;"
    >
      <p id="facilitator-confirmation-text"></p>

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
      id="facilitator-review-message"
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
    const actionButton = event.target.closest('button[data-action]');

    if (!actionButton) return;

    const action = actionButton.dataset.action;

    const message = dialog.querySelector(
      '#facilitator-review-message'
    );

    const confirmation = dialog.querySelector(
      '#facilitator-review-confirmation'
    );

    const confirmationText = dialog.querySelector(
      '#facilitator-confirmation-text'
    );

    const reasonInput = dialog.querySelector(
      '#facilitator-rejection-reason'
    );

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
        ? 'هل أنتِ متأكدة من قبول طلب هذا الميسّر؟'
        : 'هل أنتِ متأكدة من رفض طلب هذا الميسّر؟';

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
      message.style.color = '#64748b';

      try {
        if (pendingAction === 'approve') {
          await api.patch(
            `/facilitator-applications/${applicationId}/approve`
          );
        } else {
          await api.patch(
            `/facilitator-applications/${applicationId}/reject`,
            { reason }
          );
        }

        message.textContent = pendingAction === 'approve'
          ? 'تم قبول طلب الميسّر بنجاح.'
          : 'تم رفض طلب الميسّر بنجاح.';

        message.style.color = '#15803d';

        if (typeof onReviewed === 'function') {
          await onReviewed();
        }

        dialog.close();

      } catch (error) {
        console.error('Failed to review facilitator application:', error);

        message.textContent =
          error.response?.data?.message ||
          'حدث خطأ أثناء تنفيذ القرار. يرجى المحاولة مرة أخرى.';

        message.style.color = '#dc2626';

        reviewButtons.forEach((button) => {
          button.disabled = false;
        });

        actionButton.disabled = false;
      }
    }
  });

  dialog.showModal();
}
