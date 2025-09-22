// src/components/ServiceProvider/Agenda/AgendaToolbar.tsx

import {
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DateSelector } from "../DateSelector"; // Componente que você já tinha, só movido
import { ProfessionalSelector } from "../ProfessionalSelector"; // Componente que você já tinha
import type { AgendaViewMode } from "./AgendaView";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Professional } from "../../../types";

interface AgendaToolbarProps {
  viewMode: AgendaViewMode;
  setViewMode: (mode: AgendaViewMode) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedProfessionalId: string;
  onProfessionalChange: (id: string) => void;
  professionals: Professional[];
}

export const AgendaToolbar = ({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  selectedProfessionalId,
  onProfessionalChange,
  professionals,
}: AgendaToolbarProps) => {
  const handleDateChange = (days: number) => {
    const newDate =
      days > 0
        ? addDays(selectedDate, days)
        : subDays(selectedDate, Math.abs(days));
    setSelectedDate(newDate);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-white capitalize">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="flex items-center">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 rounded-md hover:bg-gray-800"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 rounded-md hover:bg-gray-800"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <DateSelector
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {professionals.length > 1 && (
          <ProfessionalSelector
            professionals={professionals}
            selectedProfessionalId={selectedProfessionalId}
            setSelectedProfessionalId={onProfessionalChange}
          />
        )}

        {/* Seletores de Visualização */}
        <div className="flex items-center bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            aria-label="Visualização em Lista"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("column")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "column"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            aria-label="Visualização em Coluna"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "calendar"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            aria-label="Visualização em Calendário"
          >
            <CalendarIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
