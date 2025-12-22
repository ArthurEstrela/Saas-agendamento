// src/components/ServiceProvider/Agenda/TimeGridCalendar.tsx

import { useMemo, useRef, useEffect, useState } from "react";
import { format, isToday, addDays, startOfWeek, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, CheckCircle, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils/cn";
import type { Appointment } from "../../../types";
import { type EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";

// --- Configurações de Layout ---
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// --- Hook Personalizado para Media Query (Interno para garantir portabilidade) ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// --- Funções Utilitárias ---
const getMinutesFromStart = (date: Date) =>
  (date.getHours() - START_HOUR) * 60 + date.getMinutes();

// --- Componente do Card de Agendamento ---
const AppointmentCard = ({
  appointment,
  onSelect,
}: {
  appointment: EnrichedProviderAppointment;
  onSelect: (appointment: Appointment) => void;
}) => {
  const top = getMinutesFromStart(appointment.startTime);
  const duration =
    (appointment.endTime.getTime() - appointment.startTime.getTime()) /
    (1000 * 60);
  const height = Math.max(duration, 30);

  const isPending = appointment.status === "pending";
  const isCompleted = appointment.status === "completed";
  const isPast = !isPending && !isCompleted && !isFuture(appointment.endTime);

  const statusClasses = cn(
    "bg-gray-800/80 border-gray-600",
    isPending && "bg-blue-800/80 border-blue-500",
    isCompleted && "bg-green-800/80 border-green-500",
    isPast && "bg-gray-700/80 border-gray-600 opacity-70"
  );

  const Icon = isPending ? MoreHorizontal : isCompleted ? CheckCircle : Clock;
  const isShort = height < 45;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => onSelect(appointment)}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      className={cn(
        "absolute left-2 right-2 p-2 text-xs text-white rounded-lg overflow-hidden cursor-pointer",
        "shadow-lg hover:shadow-xl border-l-4 transition-all duration-200",
        "flex flex-col justify-start z-[15]",
        statusClasses
      )}
    >
      <p className="font-bold truncate text-sm flex items-center gap-1">
        <Icon size={14} className="shrink-0" />
        <span className="truncate">
          {appointment.services[0].name}
          {appointment.services.length > 1
            ? ` +${appointment.services.length - 1}`
            : ""}
        </span>
      </p>
      {!isShort && (
        <p className="flex items-center gap-1 text-gray-300 mt-1 truncate">
          <User size={12} className="shrink-0" />
          <span className="truncate">
            {appointment.client?.name || "Cliente"}
          </span>
        </p>
      )}
      <div className="mt-auto flex justify-between items-center text-gray-300 text-[10px] font-medium">
        <span>{format(appointment.startTime, "HH:mm")}</span>
        <span className="font-bold text-amber-300">
          R${appointment.totalPrice.toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
};

// --- Componente da Linha de Hora Atual ---
const CurrentTimeIndicator = () => {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      if (now.getHours() >= START_HOUR && now.getHours() < END_HOUR) {
        setTop(getMinutesFromStart(now));
      } else {
        setTop(0);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, []);

  if (top === 0) return null;

  return (
    <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="relative h-px bg-red-500">
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900"></div>
      </div>
    </div>
  );
};

// --- Componente Principal da Agenda ---
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

  // Detecta se é desktop (maior que 768px)
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const scrollContainer = containerRef.current;
    const timeColumn = timeColumnRef.current;
    if (scrollContainer && timeColumn) {
      const handleScroll = () => {
        timeColumn.style.transform = `translateY(-${scrollContainer.scrollTop}px)`;
      };
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Define os dias a serem exibidos com base na responsividade
  const weekDays = useMemo(() => {
    if (!isDesktop) {
      // No Mobile, mostra apenas o dia selecionado
      return [currentDate];
    }
    // No Desktop, mostra a semana inteira começando na Segunda-feira
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, isDesktop]);

  const timeLabels = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
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

  // Define quantas colunas o grid terá
  const gridColsClass = isDesktop ? "grid-cols-7" : "grid-cols-1";
  const colSpanClass = isDesktop ? "col-span-7" : "col-span-1";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-900 rounded-xl border border-gray-800">
      {/* Cabeçalho dos Dias */}
      <div className="flex sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-md">
        {/* Espaço da coluna de horas */}
        <div className="w-14 sm:w-20 flex-shrink-0 border-r border-gray-800"></div>
        
        {/* Cabeçalho dinâmico */}
        <div className={cn("flex-1 grid", gridColsClass)}>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-3 text-center border-r border-gray-800 last:border-r-0",
                isToday(day) && "bg-amber-500/10"
              )}
            >
              <p className="text-xs uppercase text-gray-400">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p
                className={cn(
                  "text-xl sm:text-2xl font-bold",
                  isToday(day) ? "text-amber-400" : "text-white"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Coluna de Horários */}
        <div className="w-14 sm:w-20 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-hidden relative z-30">
          <div ref={timeColumnRef}>
            {timeLabels.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-right pr-2 text-xs text-gray-500 -translate-y-1/2 relative top-[1px]"
              >
                {hour > 0 && `${String(hour).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
        </div>

        {/* Grid de Agendamentos */}
        <div
          ref={containerRef}
          className={cn("flex-1 relative grid overflow-y-auto", gridColsClass)}
        >
          {/* Linhas de fundo (Horários) */}
          <div className={cn("absolute inset-0 z-0", colSpanClass)}>
            {timeLabels.map((hour) => (
              <div
                key={`line-${hour}`}
                className="h-[60px] border-t border-gray-800"
              ></div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dailyAppointments = appointmentsByDay.get(dayKey) || [];
            return (
              <div
                key={dayKey}
                className="relative border-r border-gray-800 last:border-r-0 h-full"
                // Garante que a coluna tenha altura total baseada nas linhas de horário
                style={{ height: `${timeLabels.length * 60}px` }} 
              >
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
  );
};