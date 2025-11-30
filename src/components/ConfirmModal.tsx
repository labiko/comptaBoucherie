import { useEffect } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Annuler',
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h3 className="confirm-modal-title">{title}</h3>
          <button
            className="confirm-modal-close"
            onClick={onCancel}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            className="btn-modal btn-modal-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-modal btn-modal-confirm btn-modal-${confirmVariant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
