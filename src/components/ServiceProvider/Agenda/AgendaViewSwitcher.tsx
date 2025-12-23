// src/components/ServiceProvider/Agenda/AgendaViewSwitcher.tsx

import { LayoutGrid, List, Calendar } from "lucide-react";
import type { ViewMode } from "./AgendaView";

interface AgendaViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // ✅ ADICIONADO: Isso é obrigatório para não dar erro no AgendaView.tsx
  // mesmo que você use os ícones padrão, o pai está tentando passar essa prop.
  icons?: {
    card?: React.ReactNode;
    list?: React.ReactNode;
    calendar?: React.ReactNode;
  };
}

export const AgendaViewSwitcher = ({
  viewMode,
  onViewModeChange,
  icons, // ✅ Recebemos os ícones aqui
}: AgendaViewSwitcherProps) => {
  
  const viewOptions: { id: ViewMode; icon: React.ReactNode; label: string }[] =
    [
      { 
        id: "calendar", 
        // Lógica inteligente: Usa o ícone que o pai mandou, se não tiver, usa o padrão
        icon: icons?.calendar || <Calendar size={18} />, 
        label: "Mês/Semana" 
      },
      { 
        id: "card", 
        icon: icons?.card || <LayoutGrid size={18} />, 
        label: "Cards" 
      },
      { 
        id: "list", 
        icon: icons?.list || <List size={18} />, 
        label: "Lista" 
      },
    ];

  return (
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