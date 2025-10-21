// src/components/Client/ProviderFilter.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, MapPin, Star, CreditCard, DollarSign, X } from 'lucide-react';
import type { PaymentMethod } from '../../types'; // Certifique-se que seu types.ts exporta PaymentMethod

interface FilterValues {
  distance: number;
  areaOfWork: string;
  minRating: number;
  paymentMethods: PaymentMethod[];
}

interface ProviderFilterProps {
  initialFilters?: Partial<FilterValues>;
  onApplyFilters: (filters: FilterValues) => void;
  availableAreas: string[]; // Receber as áreas disponíveis
}

export const ProviderFilter = ({ initialFilters = {}, onApplyFilters, availableAreas }: ProviderFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [distance, setDistance] = useState(initialFilters.distance ?? 50); // Distância máxima em km
  const [areaOfWork, setAreaOfWork] = useState(initialFilters.areaOfWork ?? 'all');
  const [minRating, setMinRating] = useState(initialFilters.minRating ?? 0);
  const [selectedPayments, setSelectedPayments] = useState<PaymentMethod[]>(initialFilters.paymentMethods ?? []);

  const handlePaymentToggle = (method: PaymentMethod) => {
    setSelectedPayments((prev) =>
      prev.includes(method)
        ? prev.filter((pm) => pm !== method)
        : [...prev, method]
    );
  };

  const applyFilters = () => {
    onApplyFilters({ distance, areaOfWork, minRating, paymentMethods: selectedPayments });
    setIsOpen(false);
  };

  const clearFilters = () => {
    setDistance(50);
    setAreaOfWork('all');
    setMinRating(0);
    setSelectedPayments([]);
    onApplyFilters({ distance: 50, areaOfWork: 'all', minRating: 0, paymentMethods: [] }); // Aplica filtros limpos
    setIsOpen(false);
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: 'pix', label: 'Pix', icon: DollarSign }, // Ajuste os ícones se necessário
    { id: 'credit_card', label: 'Cartão', icon: CreditCard },
    { id: 'cash', label: 'Dinheiro', icon: DollarSign },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-semibold hover:bg-gray-700 transition-colors"
      >
        <SlidersHorizontal size={20} />
        <span>Filtros</span>
        {/* Badge para indicar filtros ativos */}
        {(distance !== 50 || areaOfWork !== 'all' || minRating > 0 || selectedPayments.length > 0) && (
            <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Filtrar Resultados</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Filtro de Distância */}
              <div>
                <label htmlFor="distance" className="label-text flex items-center gap-2"><MapPin size={16}/> Distância Máxima</label>
                <div className='flex items-center gap-3'>
                    <input
                        type="range"
                        id="distance"
                        min="1"
                        max="100"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-sm font-semibold text-amber-400 w-12 text-right">{distance} km</span>
                </div>
              </div>

              {/* Filtro de Área de Atuação */}
              <div>
                  <label htmlFor="areaOfWork" className="label-text">Área de Atuação</label>
                  <select
                      id="areaOfWork"
                      value={areaOfWork}
                      onChange={(e) => setAreaOfWork(e.target.value)}
                      className="input-field" // Reutilizando a classe base
                  >
                      <option value="all">Todas as Áreas</option>
                      {availableAreas.map(area => (
                          <option key={area} value={area}>{area}</option>
                      ))}
                  </select>
              </div>

              {/* Filtro de Avaliação */}
              <div>
                <label htmlFor="minRating" className="label-text flex items-center gap-2"><Star size={16}/> Avaliação Mínima</label>
                 <div className="flex justify-between items-center bg-gray-800 rounded-lg p-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setMinRating(rating === minRating ? 0 : rating)} // Permite desmarcar
                        className={`p-2 rounded-full transition-colors ${
                          minRating >= rating ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-amber-400'
                        }`}
                      >
                        <Star size={20} fill={minRating >= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                 </div>
              </div>

              {/* Filtro de Pagamento */}
              <div>
                <label className="label-text">Formas de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handlePaymentToggle(option.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                        selectedPayments.includes(option.id)
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <option.icon size={20} className={`${selectedPayments.includes(option.id) ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${selectedPayments.includes(option.id) ? 'text-white' : 'text-gray-400'}`}>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <button type="button" onClick={clearFilters} className="secondary-button text-sm flex-1">Limpar</button>
                <button type="button" onClick={applyFilters} className="primary-button text-sm flex-1">Aplicar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};