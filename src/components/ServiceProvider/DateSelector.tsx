import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// UI
import { cn } from "../../lib/utils/cn";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  label?: string;
}

export const DateSelector = ({
  selectedDate,
  setSelectedDate,
  label = "Data:",
}: DateSelectorProps) => {
  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  return (
    <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevDay}
        className="h-7 w-7 text-gray-500 hover:text-white hover:bg-gray-800"
      >
        <ChevronLeft size={16} />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-7 px-2 text-sm font-medium text-gray-200 hover:bg-gray-800 hover:text-white min-w-[140px] justify-center"
            )}
          >
            <CalendarIcon size={14} className="mr-2 text-primary" />
            <span className="mr-1 text-gray-500 font-normal">{label}</span>
            {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-gray-900 border-gray-800"
          align="center"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextDay}
        className="h-7 w-7 text-gray-500 hover:text-white hover:bg-gray-800"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};
