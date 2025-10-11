// src/components/ServiceProvider/Agenda/TimeGridCalendar.tsx

import { useMemo, useRef, useEffect, useState } from "react";
import { format, isToday, addDays, startOfWeek, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, CheckCircle, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils/cn";
import {
  useProviderAppointmentsStore,
  type EnrichedProviderAppointment,
} from "../../../store/providerAppointmentsStore";

// --- Configurações de Layout ---
const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// --- Funções Utilitárias ---
const getMinutesFromStart = (date: Date) =>
  (date.getHours() - START_HOUR) * 60 + date.getMinutes();

// --- Componente do Card de Agendamento ---
const AppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedProviderAppointment;
}) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();
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
      onClick={() => setSelectedAppointment(appointment)}
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
    <div className="absolute w-full z-20" style={{ top: `${top}px` }}>
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
}

export const TimeGridCalendar = ({
  appointments,
  currentDate,
}: TimeGridCalendarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeColumnRef = useRef<HTMLDivElement>(null);

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

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-900 rounded-xl border border-gray-800">
      {/* Cabeçalho */}
      <div className="grid grid-cols-[auto,1fr] sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="w-20 border-r border-gray-800"></div>
        <div className="grid grid-cols-7">
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
                  "text-2xl font-bold",
                  isToday(day) ? "text-amber-400" : "text-white"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna de Horários (Sticky) */}
        <div className="w-20 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-hidden relative z-30">
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

        {/* Grid de Agendamentos (com Scroll) */}
        <div ref={containerRef} className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 min-w-max relative">
            {/* Linhas de fundo */}
            <div className="absolute inset-0 col-span-7 z-0">
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
                  className="relative border-r border-gray-800 last:border-r-0"
                >
                  {isToday(day) && <CurrentTimeIndicator />}
                  <AnimatePresence>
                    {dailyAppointments.map((appt) => (
                      <AppointmentCard key={appt.id} appointment={appt} />
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
