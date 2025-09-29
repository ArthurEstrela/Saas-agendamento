// src/components/ServiceProvider/Agenda/AgendaCalendario.tsx

import { Calendar, dateFnsLocalizer, type EventProps } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Certifique-se de que a importação do CSS padrão está aqui:
// import 'react-big-calendar/lib/css/react-big-calendar.css'; 
import type { EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore';
import { useProviderAppointmentsStore } from '../../../store/providerAppointmentsStore';
import { useMemo } from 'react';
import { Clock, User, ClipboardList, DollarSign, Calendar as CalendarIcon } from 'lucide-react';

// === CONFIGURAÇÃO DO CALENDÁRIO ===
const locales = {
  'pt-BR': ptBR,
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

// === COMPONENTE CUSTOMIZADO DO EVENTO (Card Moderno e Clicável) ===
const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    const { setSelectedAppointment } = useProviderAppointmentsStore();
    const appt = event.resource;

    const eventStyle = {
        // Estilo baseado na duração, para ocupar todo o espaço no modo 'day' ou 'week'
        backgroundColor: '#4c1d95', // Cor mais escura (Indigo)
        borderColor: '#a78bfa', // Borda sutil (Violeta Claro)
    };

    const duration = (appt.endTime.getTime() - appt.startTime.getTime()) / (1000 * 60);

    return (
        <div
            onClick={() => setSelectedAppointment(appt)} // Torna o evento Clicável
            style={eventStyle}
            className={`
                p-2 text-xs text-white rounded-lg overflow-hidden transition-all duration-300 cursor-pointer
                shadow-md hover:shadow-lg hover:ring-2 hover:ring-amber-500/80
                flex flex-col gap-1 justify-center h-full
            `}
        >
            <div className="flex items-center gap-1 font-bold truncate text-sm">
                <CalendarIcon size={12} className="text-amber-300" />
                {event.title}
            </div>
            
            <div className="flex items-center gap-1 text-gray-200">
                <User size={12} className="text-pink-300" />
                <span className="truncate">{appt.client?.name || 'Cliente Desconhecido'}</span>
            </div>

            {/* Mostra a hora de forma clara (Visível apenas em visualizações diárias/semanais) */}
            <div className="flex items-center gap-1 text-gray-300">
                <Clock size={12} className="text-sky-300" />
                <span className="font-semibold">{format(appt.startTime, 'HH:mm')}</span> 
                <span className="text-gray-400">({duration} min)</span>
            </div>
        </div>
    );
};


// === COMPONENTE PRINCIPAL DA AGENDA CALENDÁRIO ===
interface AgendaCalendarioProps {
  appointments: EnrichedProviderAppointment[];
}

export const AgendaCalendario = ({ appointments }: AgendaCalendarioProps) => {

  const { setSelectedAppointment } = useProviderAppointmentsStore();

  // Converte nossos agendamentos para o formato que o react-big-calendar entende
  const events = useMemo((): CalendarEvent[] => {
    return appointments.map(appt => ({
      // Ajuste o título para ser mais conciso e profissional
      title: appt.services.length > 1 ? `${appt.services[0].name} +${appt.services.length - 1}` : appt.services[0].name,
      start: appt.startTime,
      end: appt.endTime,
      resource: appt,
    }));
  }, [appointments]);
  
  // Customiza a altura para o calendário não ficar "apertado" e preencher a tela
  const minHeight = 'calc(100vh - 250px)'; // Exemplo: 100vh menos o espaço do header e padding

  return (
    <div className="h-full" style={{ minHeight }}>
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture='pt-BR'
            defaultView="week" 
            views={['month', 'week', 'day']}
            // Ajusta o slot mínimo para 15 minutos, melhorando a granularidade na visualização de tempo
            step={15} 
            timeslots={2} // Mostra divisões a cada 30 minutos na coluna de tempo
            // Usa as mensagens traduzidas
            messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Listagem",
                date: "Data",
                time: "Hora",
                event: "Agendamento",
                noEventsInRange: "Não há agendamentos neste período.",
            }}
            onSelectEvent={(event) => setSelectedAppointment(event.resource)} // O card customizado também faz isso, mas é bom ter o fallback
            components={{
                event: CustomEvent, // Usa nosso componente customizado
            }}
            // Adiciona a classe global para o tema customizado
            className="rbc-calendar"
        />
    </div>
  );
};