// src/components/ServiceProvider/Agenda/AgendaViewSwitcher.tsx
import { LayoutGrid, List, Columns, Calendar } from "lucide-react";
import type { ViewMode } from "./AgendaView";

interface AgendaViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const AgendaViewSwitcher = ({
  viewMode,
  onViewModeChange,
}: AgendaViewSwitcherProps) => {
  // NOVO: Adicionado a opção 'calendar'
  const viewOptions: { id: ViewMode; icon: React.ReactNode; label: string }[] =
    [
      { id: "calendar", icon: <Calendar size={18} />, label: "Mês/Semana" }, // Nova opção
      { id: "card", icon: <LayoutGrid size={18} />, label: "Cards" },
      { id: "list", icon: <List size={18} />, label: "Lista" },
      { id: "column", icon: <Columns size={18} />, label: "Colunas" },
    ];

  return (
    // Reajustado para melhor alinhamento no novo header
    <div className="flex items-center justify-end"> 
      <div className="flex items-center bg-black/50 rounded-lg p-1 space-x-1 border border-gray-800">
        {viewOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onViewModeChange(option.id)}
            className={`px-3 py-2 flex items-center gap-2 text-sm font-semibold rounded-lg transition-colors
              ${
                viewMode === option.id
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            title={option.label}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};