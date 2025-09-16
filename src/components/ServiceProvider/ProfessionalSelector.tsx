// src/components/ServiceProvider/ProfessionalSelector.tsx
import { useState } from 'react';
import type { Professional } from '../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Users } from 'lucide-react';

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessionalId: string;
  setSelectedProfessionalId: (id: string) => void;
}

export const ProfessionalSelector = ({ professionals, selectedProfessionalId, setSelectedProfessionalId }: ProfessionalSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);

  const handleSelect = (id: string) => {
    setSelectedProfessionalId(id);
    setIsOpen(false);
  };
  
  return (
    <div className="relative w-56">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 bg-gray-900 rounded-lg border border-gray-700 text-white"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedProfessional ? (
            <img
              src={selectedProfessional.photoURL || `https://ui-avatars.com/api/?name=${selectedProfessional.name.replace(/\s/g, "+")}`}
              alt={selectedProfessional.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <Users size={20} className="text-[#daa520]" />
          )}
          <span className="font-semibold text-sm">{selectedProfessional?.name || 'Todos'}</span>
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <ul onMouseLeave={() => setIsOpen(false)}>
              <li
                onClick={() => handleSelect('all')}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-700"
              >
                <Users size={20} className="text-gray-400" />
                <span className="font-semibold text-gray-200">Todos</span>
              </li>
              {professionals.map(p => (
                <li
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-700"
                >
                  <img
                    src={p.photoURL || `https://ui-avatars.com/api/?name=${p.name.replace(/\s/g, "+")}`}
                    alt={p.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-gray-200">{p.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};