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
        className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-semibold hover:bg-gray-800"
      >
        <Calendar size={20} className="text-[#daa520]" />
        <span>{format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR })}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute top-full mt-2 right-0 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              locale={ptBR}
              showOutsideDays
              // Estilização customizada para o tema escuro
              classNames={{
                caption_label: 'text-white font-bold',
                head_cell: 'text-gray-400',
                day: 'text-gray-300 hover:bg-gray-700 rounded-full',
                day_today: 'text-[#daa520] font-bold',
                day_selected: 'bg-[#daa520] text-black font-bold rounded-full',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};