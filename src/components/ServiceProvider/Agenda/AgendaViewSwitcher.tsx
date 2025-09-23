// src/components/ServiceProvider/Agenda/AgendaViewSwitcher.tsx
import { LayoutGrid, List, Columns } from "lucide-react";
import type { ViewMode } from "./AgendaView";

interface AgendaViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const AgendaViewSwitcher = ({
  viewMode,
  onViewModeChange,
}: AgendaViewSwitcherProps) => {
  const viewOptions: { id: ViewMode; icon: React.ReactNode; label: string }[] =
    [
      { id: "card", icon: <LayoutGrid size={18} />, label: "Cards" },
      { id: "list", icon: <List size={18} />, label: "Lista" },
      { id: "column", icon: <Columns size={18} />, label: "Colunas" },
    ];

  return (
    <div className="flex items-center justify-end mb-6">
      {" "}
      {/* Alinhado à direita para um visual limpo */}
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
