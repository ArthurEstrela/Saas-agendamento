// src/components/ServiceProvider/Agenda/AgendaCalendario.tsx

import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { motion } from "framer-motion";
import { useMemo } from "react";

// Configuração do localizador para date-fns com pt-BR
const locales = {
  "pt-BR": ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

// Tipagem para os eventos do calendário
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: EnrichedProviderAppointment; // Armazena o agendamento original
}

// Componente customizado para renderizar cada evento no calendário
const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();
  return (
    <div
      onClick={() => setSelectedAppointment(event.resource)}
      className="p-1 text-xs text-white bg-amber-600/80 border-l-4 border-amber-400 rounded-sm h-full overflow-hidden hover:bg-amber-500/90 transition cursor-pointer"
    >
      <p className="font-bold truncate">{event.title}</p>
      <p className="truncate">{event.resource.client?.name}</p>
    </div>
  );
};

interface AgendaCalendarioProps {
  appointments: EnrichedProviderAppointment[];
}

export const AgendaCalendario = ({ appointments }: AgendaCalendarioProps) => {
  const { setSelectedAppointment } = useProviderAppointmentsStore();

  // Converte nossos agendamentos para o formato que o react-big-calendar entende
  const events = useMemo((): CalendarEvent[] => {
    return appointments.map((appt) => ({
      title: appt.services.map((s) => s.name).join(", "),
      start: appt.startTime,
      end: appt.endTime,
      resource: appt,
    }));
  }, [appointments]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[75vh] text-white rbc-dark" // Classe wrapper para o tema dark
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="pt-BR"
        defaultView="week" // Visão padrão de semana
        views={["month", "week", "day"]}
        messages={{
          next: "Próximo",
          previous: "Anterior",
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Não há agendamentos neste período.",
        }}
        onSelectEvent={(event) => setSelectedAppointment(event.resource)}
        components={{
          event: CustomEvent, // Usa nosso componente customizado
        }}
        eventPropGetter={() => ({
          className: "!bg-transparent", // Remove o background padrão para usarmos o nosso
        })}
      />
    </motion.div>
  );
};
