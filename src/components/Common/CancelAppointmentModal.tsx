// src/components/Common/CancelAppointmentModal.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  userType: 'client' | 'provider';
}

export const CancelAppointmentModal = ({ isOpen, onClose, onConfirm, isLoading, userType }: CancelAppointmentModalProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (userType === 'provider' && reason.trim().length < 10) {
      setError('Por favor, forneça um motivo de pelo menos 10 caracteres.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-400" />
            Confirmar Cancelamento
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          {userType === 'client'
            ? 'Você tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.'
            : 'Por favor, informe ao cliente o motivo do cancelamento.'}
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            userType === 'client'
              ? 'Motivo do cancelamento (opcional)'
              : 'Motivo do cancelamento (obrigatório)'
          }
          className="input-field w-full h-24 resize-none mb-2"
        />
        {error && <p className="error-message text-xs mb-4">{error}</p>}

        <div className="mt-6 flex gap-4">
          <button onClick={onClose} disabled={isLoading} className="secondary-button w-full">
            Voltar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="danger-button w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send size={16} /> Confirmar Cancelamento
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};