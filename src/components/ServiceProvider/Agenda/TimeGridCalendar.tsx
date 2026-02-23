import { useMemo, useRef, useEffect, useState } from "react";
import { format, isToday, addDays, startOfWeek, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils/cn";
import type { Appointment } from "../../../types";

// --- Configurações de Layout ---
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT = 120; // 120px por hora

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
  appointment: Appointment;
  onSelect: (appointment: Appointment) => void;
}) => {
  // ✨ Conversão crucial para a nova API (Strings ISO para Date)
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);

  const top = (getMinutesFromStart(startDate) / 60) * ROW_HEIGHT;
  const durationInMinutes =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60);

  const height = Math.max((durationInMinutes / 60) * ROW_HEIGHT, 45);

  const status = appointment.status.toUpperCase();
  const isPending = status === "PENDING";
  const isCompleted = status === "COMPLETED";
  const isPastTime = !isPending && !isCompleted && !isFuture(endDate);

  // ✨ Lógica de detecção de bloqueio alinhada com o backend
  const isBlock =
    status === "BLOCKED" || appointment.notes?.includes("Bloqueio");

  const statusClasses = cn(
    "border-l-[3px] sm:border-l-[4px] shadow-md backdrop-blur-sm transition-all",
    isPending &&
      "bg-blue-600/30 border-blue-400 text-blue-50 hover:bg-blue-600/40",
    isCompleted &&
      "bg-emerald-600/30 border-emerald-400 text-emerald-50 hover:bg-emerald-600/40",
    isBlock && "bg-amber-600/20 border-amber-500/50 text-amber-100 italic",
    !isPending &&
      !isCompleted &&
      !isPastTime &&
      !isBlock &&
      "bg-gray-800 border-primary text-white hover:bg-gray-700 shadow-lg shadow-black/30",
    isPastTime &&
      !isBlock &&
      "bg-gray-800/60 border-gray-600 text-gray-400 grayscale opacity-80",
  );

  const isShort = height < 60;
  const displayPrice = appointment.totalAmount || appointment.finalAmount || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(appointment);
      }}
      style={{ top: `${top}px`, height: `${height}px` }}
      className={cn(
        "absolute left-1 right-1 sm:left-2 sm:right-2 rounded-md sm:rounded-lg overflow-hidden cursor-pointer z-10 select-none group",
        statusClasses,
      )}
    >
      <div className="h-full w-full px-2 sm:px-3 py-1.5 flex flex-col justify-center relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 overflow-hidden w-full">
          <span className="text-[10px] sm:text-xs font-mono font-bold opacity-80 shrink-0 bg-black/20 px-1 rounded w-fit">
            {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
          </span>
          <span className="text-xs sm:text-sm font-bold truncate leading-tight mt-0.5 sm:mt-0">
            {appointment.items?.[0]?.name ||
              (isBlock ? "Horário Bloqueado" : "Compromisso")}
          </span>
        </div>

        {!isShort && !isBlock && (
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/10 w-full">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs opacity-90 truncate max-w-[75%]">
              <User size={12} className="shrink-0" />
              <span className="truncate font-medium">
                {appointment.clientName || "Particular"}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold bg-white/10 px-1.5 py-0.5 rounded text-white/90">
              R${displayPrice.toFixed(0)}
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
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] -ml-1.5 ring-2 ring-gray-950" />
      <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)] opacity-80" />
    </div>
  );
};

interface TimeGridCalendarProps {
  appointments: Appointment[]; // ✨ Tipagem estrita
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

  const weekDays = useMemo(() => {
    if (!isDesktop) return [currentDate];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, isDesktop]);

  const timeLabels = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  }, []);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((day) => map.set(format(day, "yyyy-MM-dd"), []));

    appointments.forEach((appt) => {
      // ✨ Conversão para Date antes de formatar a chave do Map
      const dayKey = format(new Date(appt.startTime), "yyyy-MM-dd");
      if (map.has(dayKey)) {
        map.get(dayKey)!.push(appt);
      }
    });
    return map;
  }, [appointments, weekDays]);

  const gridColsClass = isDesktop ? "grid-cols-7" : "grid-cols-1";
  const timeColWidthClass = "w-11 sm:w-16";

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-lg sm:rounded-xl border border-gray-800 shadow-xl overflow-hidden select-none w-full">
      {/* Header dos Dias */}
      <div className="flex flex-shrink-0 bg-gray-900 border-b border-gray-800 z-30 shadow-sm">
        <div
          className={cn(
            "flex-shrink-0 bg-gray-900/95 border-r border-gray-800",
            timeColWidthClass,
          )}
        />
        <div
          className={cn(
            "flex-1 grid divide-x divide-gray-800/50",
            gridColsClass,
          )}
        >
          {weekDays.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-3 sm:py-4 text-center relative transition-colors duration-300",
                  isDayToday ? "bg-primary/5" : "bg-gray-900/50",
                )}
              >
                {isDayToday && (
                  <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                )}
                <p
                  className={cn(
                    "text-[10px] sm:text-[11px] uppercase font-bold tracking-wider",
                    isDayToday ? "text-primary/80" : "text-gray-500",
                  )}
                >
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <div
                  className={cn(
                    "text-lg sm:text-2xl font-bold font-mono mt-0.5",
                    isDayToday ? "text-primary" : "text-gray-200",
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
      <div className="flex-1 flex overflow-hidden relative bg-gray-950">
        <div
          ref={timeColumnRef}
          className={cn(
            "flex-shrink-0 bg-gray-900/40 border-r border-gray-800 overflow-hidden select-none",
            timeColWidthClass,
          )}
        >
          <div
            className="relative"
            style={{ height: `${timeLabels.length * ROW_HEIGHT}px` }}
          >
            {timeLabels.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-center transform -translate-y-1/2 pr-1"
                style={{ top: `${(hour - START_HOUR) * ROW_HEIGHT}px` }}
              >
                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 font-mono">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth",
            gridColsClass,
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
                <div
                  key={dayKey}
                  className="relative h-full group bg-[url('/grid-pattern.png')]"
                >
                  {timeLabels.map((hour) => (
                    <div key={`grid-block-${hour}`}>
                      <div
                        className="absolute w-full border-t border-gray-800/40"
                        style={{ top: `${(hour - START_HOUR) * ROW_HEIGHT}px` }}
                      />
                      <div
                        className="absolute w-full border-t border-gray-800/20 border-dashed"
                        style={{
                          top: `${(hour - START_HOUR) * ROW_HEIGHT + ROW_HEIGHT / 2}px`,
                        }}
                      />
                    </div>
                  ))}

                  {isToday(day) && <CurrentTimeIndicator />}

                  <AnimatePresence mode="popLayout">
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
