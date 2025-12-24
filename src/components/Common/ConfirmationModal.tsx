import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-700 m-4">
        <div className="p-8">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 sm:mx-0">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-4 text-left">
                <h3 className="text-xl font-bold text-white" id="modal-title">
                {title}
                </h3>
                <div className="mt-2">
                <p className="text-sm text-gray-400">
                    {message}
                </p>
                </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="secondary-button">
              {cancelText}
            </button>
            <button type="button" onClick={onConfirm} className="danger-button">
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};