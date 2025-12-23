// src/components/ServiceProvider/DateSelector.tsx

import { format, addDays, subDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "../../lib/utils/cn"; // Import opcional para estilos condicionais

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  label?: string; // <--- Importante para evitar o erro no AgendaView
}

export const DateSelector = ({ 
  selectedDate, 
  setSelectedDate, 
  label = "Data:" 
}: DateSelectorProps) => {
  
  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-gray-900/80 p-1 rounded-lg border border-gray-700 shadow-sm">
      {/* Rótulo (ex: "Dia:", "Semana:") */}
      <span className="text-xs font-bold text-gray-400 pl-2 hidden sm:inline-block">
        {label}
      </span>

      {/* Botão Dia Anterior */}
      <button
        onClick={handlePrevDay}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        title="Dia anterior"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Popover do Calendário */}
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors border border-transparent",
              "hover:bg-gray-700 hover:border-gray-600",
              "text-white bg-gray-800"
            )}
          >
            <CalendarIcon size={16} className="text-amber-500" />
            <span className="capitalize min-w-[80px] text-center">
              {isToday(selectedDate)
                ? "Hoje"
                : format(selectedDate, "dd MMM", { locale: ptBR })}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
            locale={ptBR}
            className="rounded-md border-none text-gray-100"
          />
        </PopoverContent>
      </Popover>

      {/* Botão Próximo Dia */}
      <button
        onClick={handleNextDay}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        title="Próximo dia"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};