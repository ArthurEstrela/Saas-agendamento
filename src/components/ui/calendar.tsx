import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "../../lib/utils/cn";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label:
          "text-sm font-bold text-gray-100 uppercase tracking-wide",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 text-gray-400 hover:opacity-100 hover:bg-gray-800 hover:text-white border-gray-700 transition-colors"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        // --- CORREÇÃO DO LAYOUT (Tabela Real) ---
        table: "w-full border-collapse space-y-1",
        head_row: "flex", // Mantém flex no header para centralizar se necessário, ou use 'table-row'
        head_cell:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] uppercase tracking-wider text-center",

        // Removemos o 'flex w-full justify-between' daqui para evitar o bug visual
        row: "flex w-full mt-2",

        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-800/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        ),

        // --- CORREÇÃO DA COR (Dourado/Primary) ---
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-[0_0_10px_rgba(218,165,32,0.5)]", // Adiciona brilho dourado

        day_today: "bg-gray-800 text-white border border-primary/50 font-bold",
        day_outside: "text-gray-600 opacity-50",
        day_disabled: "text-gray-600 opacity-50",
        day_range_middle:
          "aria-selected:bg-gray-800 aria-selected:text-gray-100",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
