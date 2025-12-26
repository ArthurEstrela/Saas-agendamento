import type { ViewMode } from "./AgendaView";
import { cn } from "../../../lib/utils/cn";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";


interface AgendaViewSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  icons: {
    card: React.ReactNode;
    list: React.ReactNode;
    calendar: React.ReactNode;
  };
}

export const AgendaViewSwitcher = ({
  viewMode,
  onViewModeChange,
  icons,
}: AgendaViewSwitcherProps) => {
  const options: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: "calendar", label: "Calendário", icon: icons.calendar },
    { mode: "card", label: "Cards", icon: icons.card },
    { mode: "list", label: "Lista", icon: icons.list },
  ];

  return (
    <div className="flex items-center bg-gray-900 p-1 rounded-lg border border-gray-800">
      <TooltipProvider>
        {options.map((opt) => (
          <Tooltip key={opt.mode}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewModeChange(opt.mode)}
                className={cn(
                  "h-8 w-8 rounded-md transition-all",
                  viewMode === opt.mode
                    ? "bg-gray-800 text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                )}
              >
                {opt.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-gray-800 text-xs border-gray-700"
            >
              <p>{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};
