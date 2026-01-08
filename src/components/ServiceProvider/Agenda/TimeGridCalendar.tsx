import { useMemo, useRef, useEffect, useState } from "react";
import { format, isToday, addDays, startOfWeek, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils/cn";
import type { Appointment } from "../../../types";
import { type EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";

// --- Configurações de Layout ---
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT = 70; // Mantido altura boa para mobile

// --- Hook Mobile ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

const getMinutesFromStart = (date: Date) =>
  (date.getHours() - START_HOUR) * 60 + date.getMinutes();

// --- Card Interno do Calendário ---
const AppointmentCard = ({
  appointment,
  onSelect,
}: {
  appointment: EnrichedProviderAppointment;
  onSelect: (appointment: Appointment) => void;
}) => {
  const top = (getMinutesFromStart(appointment.startTime) / 60) * ROW_HEIGHT;
  const durationInMinutes =
    (appointment.endTime.getTime() - appointment.startTime.getTime()) /
    (1000 * 60);

  // Altura mínima para clique
  const calculatedHeight = (durationInMinutes / 60) * ROW_HEIGHT;
  const height = Math.max(calculatedHeight, 40);

  const isPending = appointment.status === "pending";
  const isCompleted = appointment.status === "completed";
  const isPastTime =
    !isPending && !isCompleted && !isFuture(appointment.endTime);

  // --- CORES CORRIGIDAS (Mais claras e legíveis) ---
  const statusClasses = cn(
    "border-l-[3px] shadow-sm backdrop-blur-sm transition-all",

    // Pendente: Azul vibrante com transparência (Vidro)
    isPending &&
      "bg-blue-600/30 border-blue-400 text-blue-50 hover:bg-blue-600/40",

    // Concluído: Verde vibrante com transparência
    isCompleted &&
      "bg-emerald-600/30 border-emerald-400 text-emerald-50 hover:bg-emerald-600/40",

    // Agendado (Padrão): Cinza mais claro (Gray-800) em vez de preto, com borda dourada
    !isPending &&
      !isCompleted &&
      !isPastTime &&
      "bg-gray-800 border-primary text-white hover:bg-gray-700 shadow-lg shadow-black/20",

    // Passado: Cinza um pouco mais escuro/opaco para não chamar atenção, mas legível
    isPastTime &&
      "bg-gray-800/60 border-gray-600 text-gray-400 grayscale opacity-80"
  );

  const isShort = height < 55;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(appointment);
      }}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      className={cn(
        "absolute left-1 right-1 sm:left-1.5 sm:right-1.5 rounded-lg overflow-hidden cursor-pointer z-10 select-none group",
        statusClasses
      )}
    >
      <div className="h-full w-full px-2 py-1 flex flex-col justify-center">
        {/* Linha Principal */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[10px] font-bold font-mono opacity-90 shrink-0">
            {format(appointment.startTime, "HH:mm")}
          </span>
          <span className="text-xs font-bold truncate leading-none">
            {appointment.services[0].name}
          </span>
        </div>

        {/* Linha Secundária */}
        {!isShort && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[10px] opacity-80 truncate max-w-[70%]">
              <User size={10} />
              <span className="truncate">
                {appointment.client?.name || "Cliente"}
              </span>
            </div>
            {/* Preço com destaque */}
            <span className="text-[10px] font-bold opacity-100">
              R${appointment.totalPrice.toFixed(0)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CurrentTimeIndicator = () => {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      if (now.getHours() >= START_HOUR && now.getHours() < END_HOUR) {
        setTop((getMinutesFromStart(now) / 60) * ROW_HEIGHT);
      } else {
        setTop(null);
      }
    };
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, []);

  if (top === null) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -ml-1.5 ring-2 ring-gray-900" />
      <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
    </div>
  );
};

interface TimeGridCalendarProps {
  appointments: EnrichedProviderAppointment[];
  currentDate: Date;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const TimeGridCalendar = ({
  appointments,
  currentDate,
  onAppointmentSelect,
}: TimeGridCalendarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeColumnRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Sincronia de Scroll
  useEffect(() => {
    const scrollContainer = containerRef.current;
    const timeColumn = timeColumnRef.current;
    if (scrollContainer && timeColumn) {
      const handleScroll = () => {
        timeColumn.scrollTop = scrollContainer.scrollTop;
      };
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Define os dias visíveis (1 no mobile, 7 no desktop)
  const weekDays = useMemo(() => {
    if (!isDesktop) return [currentDate];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, isDesktop]);

  const timeLabels = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  }, []);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, EnrichedProviderAppointment[]>();
    weekDays.forEach((day) => map.set(format(day, "yyyy-MM-dd"), []));
    appointments.forEach((appt) => {
      const dayKey = format(appt.startTime, "yyyy-MM-dd");
      if (map.has(dayKey)) {
        map.get(dayKey)!.push(appt);
      }
    });
    return map;
  }, [appointments, weekDays]);

  const gridColsClass = isDesktop ? "grid-cols-7" : "grid-cols-1";
  const timeColWidthClass = "w-14 sm:w-16";

  return (
    <div className="flex flex-col h-full bg-gray-950/50 rounded-xl border border-gray-800 shadow-inner overflow-hidden select-none">
      {/* Header dos Dias */}
      <div className="flex flex-shrink-0 bg-gray-900 border-b border-gray-800 z-30">
        <div
          className={cn(
            "flex-shrink-0 bg-gray-900/80 border-r border-gray-800",
            timeColWidthClass
          )}
        />
        <div
          className={cn("flex-1 grid divide-x divide-gray-800", gridColsClass)}
        >
          {weekDays.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-3 text-center relative transition-colors",
                  isDayToday ? "bg-primary/5" : ""
                )}
              >
                {isDayToday && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                )}
                <p className="text-[10px] uppercase font-bold text-gray-500">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <div
                  className={cn(
                    "text-xl font-bold font-mono mt-0.5",
                    isDayToday ? "text-primary" : "text-white"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corpo com Scroll */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Coluna de Horas */}
        <div
          ref={timeColumnRef}
          className={cn(
            "flex-shrink-0 bg-gray-900/50 border-r border-gray-800 overflow-hidden",
            timeColWidthClass
          )}
        >
          <div
            className="relative"
            style={{ height: `${timeLabels.length * ROW_HEIGHT}px` }}
          >
            {timeLabels.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-center text-xs font-medium text-gray-500 transform -translate-y-1/2"
                style={{ top: `${(hour - START_HOUR) * ROW_HEIGHT}px` }}
              >
                {hour}:00
              </div>
            ))}
          </div>
        </div>

        {/* Grid de Agendamentos */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar relative",
            gridColsClass
          )}
        >
          <div
            className={cn("grid divide-x divide-gray-800", gridColsClass)}
            style={{ height: `${timeLabels.length * ROW_HEIGHT}px` }}
          >
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dailyAppointments = appointmentsByDay.get(dayKey) || [];

              return (
                <div key={dayKey} className="relative h-full group">
                  {/* Linhas de Fundo */}
                  {timeLabels.map((hour) => (
                    <div
                      key={`bg-${hour}`}
                      className="absolute w-full border-t border-gray-800/30"
                      style={{
                        top: `${(hour - START_HOUR) * ROW_HEIGHT}px`,
                        height: `${ROW_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {isToday(day) && <CurrentTimeIndicator />}

                  <AnimatePresence>
                    {dailyAppointments.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appointment={appt}
                        onSelect={onAppointmentSelect}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
