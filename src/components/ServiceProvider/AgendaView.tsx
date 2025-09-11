import { useEffect, useMemo, useState } from 'react';
import { useProviderAppointmentsStore } from '../../store/providerAppointmentsStore';
import { useProfileStore } from '../../store/profileStore';
import type { Appointment } from '../../types';
import { format, isToday, isFuture, isPast, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarX, Bell, ClipboardCheck, Clock, Calendar as CalendarIcon } from 'lucide-react';

// Card de Agendamento (Poderíamos separar em outro arquivo se ficasse complexo)
const AppointmentCard = ({ appointment, onClick }: { appointment: Appointment, onClick: () => void }) => {
    // Lógica de estilo baseada no status...
    return (
        <button onClick={onClick} className="w-full text-left p-4 rounded-xl bg-gray-800/80 hover:bg-gray-700/50 cursor-pointer border border-gray-700 transition-all">
            <div className="flex justify-between items-center">
                <p className="font-bold text-white">{appointment.clientName}</p>
                <span className="text-xs font-medium text-[#daa520] bg-yellow-900/40 px-2 py-1 rounded-full">
                    {appointment.status}
                </span>
            </div>
            <p className="text-sm text-gray-400">{appointment.serviceName}</p>
            <div className="text-sm text-white mt-2 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                {format(appointment.startTime, 'HH:mm')} com {appointment.professionalName}
            </div>
        </button>
    )
}

// -- Componente Principal da Agenda --
export const AgendaView = () => {
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, error, fetchAppointments, approveAppointment, rejectAppointment } = useProviderAppointmentsStore();
  
  // O modal agora seria controlado aqui, por exemplo:
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (userProfile?.id) {
      fetchAppointments(userProfile.id);
    }
  }, [userProfile, fetchAppointments]);

  const { pending, today, upcoming } = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'pending').sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
    const today = appointments.filter(a => a.status === 'scheduled' && isToday(a.startTime)).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
    const upcoming = appointments.filter(a => a.status === 'scheduled' && isFuture(a.startTime) && !isToday(a.startTime)).sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
    return { pending, today, upcoming };
  }, [appointments]);

  if (isLoading) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-[#daa520]" size={40} /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 p-10 bg-red-500/10 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 text-white">
      <h1 className="text-3xl font-bold mb-8 animate-fade-in-down">Minha Agenda</h1>
      
      {/* Seção de Agendamentos Pendentes */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-[#daa520] mb-4 flex items-center gap-3"><Bell />Novas Solicitações ({pending.length})</h2>
        {pending.length > 0 ? (
            <div className="space-y-4">
                {pending.map(app => (
                    <div key={app.id} className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                        <p className="font-bold">{app.clientName}</p>
                        <p className="text-sm text-gray-400">{app.serviceName} para {format(app.startTime, 'dd/MM \'às\' HH:mm')}</p>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => rejectAppointment(app.id, "Horário indisponível")} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 text-sm font-bold py-2 px-4 rounded-lg transition-colors">Recusar</button>
                            <button onClick={() => approveAppointment(app.id)} className="flex-1 bg-green-600 text-white hover:bg-green-500 text-sm font-bold py-2 px-4 rounded-lg transition-colors">Aprovar</button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-gray-500">Nenhuma nova solicitação no momento.</p>
        )}
      </section>

      {/* Seção de Agendamentos de Hoje */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3"><ClipboardCheck />Agendamentos de Hoje ({today.length})</h2>
         {today.length > 0 ? (
            <div className="space-y-3">
                {today.map(app => <AppointmentCard key={app.id} appointment={app} onClick={() => setSelectedAppointment(app)} />)}
            </div>
         ) : (
            <p className="text-gray-500">Nenhum agendamento para hoje.</p>
         )}
      </section>

      {/* Modal de Detalhes (você criaria/refatoraria este) */}
      {/* {selectedAppointment && <AppointmentDetailsModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />} */}
    </div>
  );
};