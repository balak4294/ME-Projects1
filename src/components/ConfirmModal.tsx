import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
      : tone === 'warning'
        ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white';

  const iconBgClass =
    tone === 'danger'
      ? 'bg-[#FEE2E2] text-[#B91C1C]'
      : tone === 'warning'
        ? 'bg-[#FEF3C7] text-[#92400E]'
        : 'bg-[#EFF6FF] text-[#2563EB]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                className="text-base font-bold text-[#0F172A]"
              >
                {title}
              </h2>
              <p className="mt-1.5 text-xs text-[#434655] leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
