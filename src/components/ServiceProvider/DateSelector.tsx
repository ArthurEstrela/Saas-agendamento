// src/components/ServiceProvider/DateSelector.tsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const DateSelector = ({ selectedDate, setSelectedDate }: {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDayClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
        title="Selecionar Data"
      >
        <Calendar size={20} className="text-amber-500" />
        <span>{format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR })}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute top-full mt-2 right-0 z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-2" 
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              locale={ptBR}
              fromDate={new Date(new Date().setHours(0, 0, 0, 0))}
              // Os estilos DayPicker customizados em index.css ou styles/day-picker.css cuidarão do tema dark.
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};