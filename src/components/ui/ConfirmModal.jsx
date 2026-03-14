import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Emin misiniz?',
  message,
  confirmText = 'Tamam',
  cancelText = 'İptal',
  type = 'warning' // warning, danger, info
}) => {
  const colors = {
    warning: {
      icon: 'text-amber-500',
      bg: 'bg-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700'
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const color = colors[type] || colors.warning;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="sm">
      <div className="text-center p-3">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${color.bg} mb-4`}>
          <AlertTriangle className={`h-8 w-8 ${color.icon}`} aria-hidden="true" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {title}
        </h3>
        
        <div className="mt-2 px-2">
          <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 order-1 sm:order-2 text-white border-none shadow-lg transition-all active:scale-95 ${color.button}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { ConfirmModal };
