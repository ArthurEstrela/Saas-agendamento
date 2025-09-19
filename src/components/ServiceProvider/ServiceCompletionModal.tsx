// src/components/ServiceProvider/ServiceCompletionModal.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, CheckCircle, Loader2 } from 'lucide-react';

interface ServiceCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalPrice: number) => void;
  initialPrice: number;
  isLoading: boolean;
}

export const ServiceCompletionModal = ({ isOpen, onClose, onConfirm, initialPrice, isLoading }: ServiceCompletionModalProps) => {
  const [price, setPrice] = useState(initialPrice.toString());

  const handleConfirm = () => {
    onConfirm(parseFloat(price));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="text-green-400" />
            Confirmar Conclusão
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Confirme o valor final do serviço. Este valor será usado para seus registros financeiros e pode ser o mesmo do agendamento ou um valor atualizado.
        </p>

        <div>
          <label htmlFor="finalPrice" className="block text-sm font-medium text-gray-300 mb-2">
            Valor Total Gasto pelo Cliente (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id="finalPrice"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field pl-10 text-lg"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button onClick={onClose} disabled={isLoading} className="secondary-button w-full">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="primary-button w-full flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Confirmar e Concluir'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};