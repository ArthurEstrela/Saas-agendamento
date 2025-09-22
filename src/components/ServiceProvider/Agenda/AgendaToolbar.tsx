// src/components/ServiceProvider/Agenda/AgendaToolbar.tsx
import { LayoutGrid, List, Columns } from "lucide-react";
import { ProfessionalFilter } from "./ProfessionalFilter";
import type { ViewMode } from "./AgendaView"; // <-- Vamos definir este tipo no AgendaView

interface AgendaToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedProfessionalId: string | null;
  onSelectProfessional: (id: string | null) => void;
}

export const AgendaToolbar = ({
  viewMode,
  onViewModeChange,
  selectedProfessionalId,
  onSelectProfessional,
}: AgendaToolbarProps) => {
  const viewOptions: { id: ViewMode; icon: React.ReactNode; label: string }[] =
    [
      { id: "card", icon: <LayoutGrid size={18} />, label: "Cards" },
      { id: "list", icon: <List size={18} />, label: "Lista" },
      { id: "column", icon: <Columns size={18} />, label: "Colunas" },
    ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <ProfessionalFilter
        selectedProfessionalId={selectedProfessionalId}
        onSelectProfessional={onSelectProfessional}
      />
      <div className="flex items-center bg-gray-900 rounded-lg p-1 space-x-1">
        {viewOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onViewModeChange(option.id)}
            className={`px-3 py-2 flex items-center gap-2 text-sm font-semibold rounded-md transition-colors ${
              viewMode === option.id
                ? "bg-amber-500 text-black"
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
