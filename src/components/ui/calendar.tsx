import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale"; // Importante para garantir idioma

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
      locale={ptBR} // Força o português direto aqui também
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
          "h-7 w-7 bg-transparent p-0 text-gray-400 hover:opacity-100 hover:bg-gray-800 hover:text-white border-gray-700"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        // --- AQUI ESTAVA O ERRO, AGORA CORRIGIDO PARA TABELA ---
        table: "w-full border-collapse",
        head_row: "flex w-full mt-2", // Mantemos flex no header para distribuir
        head_cell:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] uppercase tracking-wider text-center flex-1", // flex-1 ajuda a distribuir

        row: "flex w-full mt-2 justify-between", // Garante que a linha ocupe tudo
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",

        // --- BOTÕES DOS DIAS ---
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-300 hover:bg-gray-800 hover:text-white"
        ),

        // Correção da cor Azul e Seleção
        day_selected:
          "bg-primary text-black hover:bg-primary hover:text-black focus:bg-primary focus:text-black font-bold shadow-md shadow-primary/20", // Força o dourado

        day_today: "bg-gray-800 text-white border border-primary/50 font-bold",
        day_outside: "text-gray-700 opacity-50",
        day_disabled: "text-gray-700 opacity-50",
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
