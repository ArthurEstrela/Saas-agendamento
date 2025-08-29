// src/components/Common/ReviewModal.tsx

import React, { useState, useEffect } from 'react';
import type { Booking } from '../../types';
import { Star, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Booking;
  onSubmit: (rating: number, comment: string) => void;
  isLoading?: boolean;
}

const ReviewModal = ({ isOpen, onClose, appointment, onSubmit, isLoading = false }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (rating === 0) {
      showToast("Por favor, selecione uma classificação de estrelas.", "warning");
      return;
    }
    onSubmit(rating, comment);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
      <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 max-w-md w-full relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            aria-label="Fechar modal"
        >
            <X size={24} />
        </button>

        <h3 className="text-2xl font-bold text-white mb-2 text-center">
          Avaliar Agendamento
        </h3>
        <p className="text-gray-300 mb-6 text-center">
          Compartilhe sua experiência com {appointment?.professionalName}.
        </p>

        <div className="mb-6 text-center">
          <p className="text-gray-300 mb-3 font-semibold">Sua classificação:</p>
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 cursor-pointer transition-all duration-200 ${
                  rating >= star
                    ? "text-yellow-400 fill-yellow-400 transform scale-110"
                    : "text-gray-500 hover:text-yellow-300"
                }`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="comment" className="block text-gray-300 font-semibold mb-2">
            Comentário (opcional):
          </label>
          <textarea
            id="comment"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#daa520] focus:border-transparent resize-y"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Como foi o serviço? O que você achou do profissional?"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-[#daa520] text-black font-semibold rounded-lg hover:bg-[#c8961e] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
