import type { ViewMode } from "./AgendaView";
import { cn } from "../../../lib/utils/cn";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AgendaViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // ✨ TIPAGEM SÊNIOR: Usa o tipo exato ViewMode para mapear os ícones.
  // Partial permite que quem chame o componente envie apenas alguns ícones (ou nenhum).
  icons?: Partial<Record<ViewMode, ReactNode>>;
}

export const AgendaViewSwitcher = ({
  viewMode,
  onViewModeChange,
  icons,
}: AgendaViewSwitcherProps) => {
  
  // ✨ Garantia de que todas as opções de ViewMode têm um fallback
  const defaults: Record<ViewMode, ReactNode> = {
    card: <LayoutGrid size={18} />,
    list: <List size={18} />,
    calendar: <CalendarIcon size={18} />,
  };

  const finalIcons = { ...defaults, ...icons };

  const options: { mode: ViewMode; label: string; icon: ReactNode }[] = [
    { mode: "calendar", label: "Calendário", icon: finalIcons.calendar },
    { mode: "card", label: "Cards", icon: finalIcons.card },
    { mode: "list", label: "Lista", icon: finalIcons.list },
  ];

  return (
    <div className="flex items-center bg-gray-900/80 p-1 rounded-lg border border-gray-800 backdrop-blur-sm">
      <TooltipProvider delayDuration={0}>
        {options.map((opt) => (
          <Tooltip key={opt.mode}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewModeChange(opt.mode)}
                className={cn(
                  "h-9 w-9 rounded-md transition-all duration-200", 
                  viewMode === opt.mode
                    ? "bg-gray-800 text-primary shadow-sm scale-105"
                    : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/50"
                )}
              >
                {opt.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-gray-900 text-xs border-gray-800 text-gray-300"
            >
              <p>{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};