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
const ROW_HEIGHT = 64; // Altura de cada hora em pixels (aumentado levemente para toque)

// --- Hook para Media Query ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verifica suporte a window
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches); // Set inicial

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

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
  const top = (getMinutesFromStart(appointment.startTime) / 60) * ROW_HEIGHT;
  const durationInMinutes =
    (appointment.endTime.getTime() - appointment.startTime.getTime()) /
    (1000 * 60);
  const height = Math.max((durationInMinutes / 60) * ROW_HEIGHT, 34); // Mínimo de 34px para caber texto

  const isPending = appointment.status === "pending";
  const isCompleted = appointment.status === "completed";
  const isPastTime =
    !isPending && !isCompleted && !isFuture(appointment.endTime);

  const statusClasses = cn(
    "bg-gray-800 border-l-4",
    isPending && "bg-blue-900/90 border-blue-500",
    isCompleted && "bg-emerald-900/90 border-emerald-500",
    !isPending && !isCompleted && "bg-gray-700/90 border-primary", // Agendado padrão
    isPastTime && "opacity-60 saturate-50"
  );

  const isShort = height < 50;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, zIndex: 50 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(appointment)}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      className={cn(
        "absolute left-1 right-1 sm:left-2 sm:right-2 rounded-md overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all z-10",
        statusClasses
      )}
    >
      <div className="h-full w-full p-1.5 sm:p-2 flex flex-col justify-start">
        {/* Linha Principal: Hora e Serviço */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
          {!isShort && <Clock size={12} className="text-white/70 shrink-0" />}
          <span className="truncate leading-tight">
            {isShort && (
              <span className="mr-1">
                {format(appointment.startTime, "HH:mm")}
              </span>
            )}
            {appointment.services[0].name}
            {appointment.services.length > 1 &&
              ` +${appointment.services.length - 1}`}
          </span>
        </div>

        {/* Linha Secundária: Cliente (Apenas se houver espaço) */}
        {!isShort && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-300 truncate mt-0.5">
            <User size={12} className="shrink-0 opacity-70" />
            <span className="truncate">
              {appointment.client?.name || "Cliente"}
            </span>
          </div>
        )}

        {/* Rodapé: Preço e Status Visual (Apenas se muito espaço) */}
        {height > 80 && (
          <div className="mt-auto flex justify-between items-end pt-1 border-t border-white/10">
            <span className="text-[10px] text-amber-300 font-mono font-bold">
              R$ {appointment.totalPrice.toFixed(0)}
            </span>
            {isCompleted && (
              <CheckCircle size={12} className="text-emerald-400" />
            )}
            {isPending && (
              <MoreHorizontal size={12} className="text-blue-400" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Indicador de Hora Atual ---
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
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center group"
      style={{ top: `${top}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -ml-1"></div>
      <div className="flex-1 h-[2px] bg-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>
    </div>
  );
};

// --- Componente Principal ---
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

  // Detecta Desktop (> 768px)
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Sincronia de Scroll (Vertical)
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

  // Lógica de Dias: 1 dia no Mobile, 7 dias no Desktop
  const weekDays = useMemo(() => {
    if (!isDesktop) {
      return [currentDate];
    }
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, isDesktop]);

  // Labels de Hora
  const timeLabels = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  }, []);

  // Agrupamento de Agendamentos
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

  // Ajuste de classes de grid dinâmicas
  const gridColsClass = isDesktop ? "grid-cols-7" : "grid-cols-1";

  // Largura da coluna de hora (fixa para alinhar header e body)
  const timeColWidthClass = "w-12 sm:w-16";

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-xl border border-gray-800 shadow-inner overflow-hidden select-none">
      {/* --- Header (Dias da Semana) --- */}
      <div className="flex flex-shrink-0 bg-gray-900 border-b border-gray-800 z-30 shadow-md">
        {/* Canto Vazio (acima das horas) */}
        <div
          className={cn(
            "flex-shrink-0 border-r border-gray-800 bg-gray-900/50",
            timeColWidthClass
          )}
        />

        {/* Dias */}
        <div
          className={cn("flex-1 grid divide-x divide-gray-800", gridColsClass)}
        >
          {weekDays.map((day) => {
            const isDayToday = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-2 sm:py-3 px-1 text-center transition-colors relative overflow-hidden",
                  isDayToday ? "bg-primary/5" : "bg-transparent"
                )}
              >
                {/* Indicador de "Hoje" (topo colorido) */}
                {isDayToday && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_#daa520]" />
                )}

                <p className="text-[10px] sm:text-xs uppercase font-medium text-gray-400 tracking-wider">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span
                    className={cn(
                      "text-lg sm:text-xl font-bold font-mono",
                      isDayToday ? "text-primary" : "text-gray-200"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Corpo do Calendário (Scrollável) --- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Coluna de Horas (Fixo lateralmente, scroll vertical syncado via ref) */}
        <div
          ref={timeColumnRef}
          className={cn(
            "flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-hidden hide-scrollbar select-none",
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
                className="absolute w-full text-right pr-2 text-[10px] sm:text-xs font-medium text-gray-500 transform -translate-y-1/2"
                style={{ top: `${(hour - START_HOUR) * ROW_HEIGHT}px` }}
              >
                {hour}:00
              </div>
            ))}
          </div>
        </div>

        {/* Grid Principal (Scrollável) */}
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar relative bg-gray-950/50",
            gridColsClass
          )}
        >
          {/* Conteúdo do Grid */}
          <div
            className={cn("grid divide-x divide-gray-800", gridColsClass)}
            style={{ height: `${timeLabels.length * ROW_HEIGHT}px` }}
          >
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dailyAppointments = appointmentsByDay.get(dayKey) || [];

              return (
                <div key={dayKey} className="relative h-full group">
                  {/* Linhas de Horário (Background) */}
                  {timeLabels.map((hour) => (
                    <div
                      key={`bg-${hour}`}
                      className="absolute w-full border-t border-gray-800/40"
                      style={{
                        top: `${(hour - START_HOUR) * ROW_HEIGHT}px`,
                        height: `${ROW_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {/* Indicador de Hora Atual (Só renderiza na coluna de hoje) */}
                  {isToday(day) && <CurrentTimeIndicator />}

                  {/* Agendamentos */}
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
