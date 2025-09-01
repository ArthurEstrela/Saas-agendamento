import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProviderAppointments } from '../../store/providerAppointmentsStore';
import type { AppAppointment } from '../../store/providerAppointmentsStore';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import { format, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarX, Bell, CalendarClock, CalendarCheck } from 'lucide-react';

// Card de Agendamento para a lista
const AppointmentItemCard = ({ appointment, onClick }: { appointment: AppAppointment, onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left p-4 bg-gray-800 rounded-lg flex items-center gap-4 hover:bg-gray-700/50 transition-colors duration-200">
    <img
      src={appointment.clientPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=4a5568&color=ffffff`}
      alt={appointment.clientName}
      className="h-12 w-12 rounded-full object-cover border-2 border-gray-600"
    />
    <div className="flex-grow">
      <p className="font-bold text-white">{appointment.clientName}</p>
      <p className="text-sm text-gray-300">{appointment.serviceName}</p>
    </div>
    <div className="text-right">
      <p className="text-lg font-semibold text-white">{format(appointment.startTime!, 'HH:mm')}</p>
      <p className="text-xs text-gray-400">{appointment.professionalName}</p>
    </div>
  </button>
);

// Componente de Seção para organizar a UI
const AgendaSection = ({ title, icon: Icon, appointments, onAppointmentClick }) => (
  <section>
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <Icon className="text-[#daa520]" size={22} />
      {title}
    </h2>
    {appointments.length > 0 ? (
      <div className="space-y-3">
        {appointments.map(app => (
          <AppointmentItemCard key={app.id} appointment={app} onClick={() => onAppointmentClick(app)} />
        ))}
      </div>
    ) : (
      <div className="text-center text-gray-500 py-8 px-4 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
        <p>Nenhum agendamento nesta categoria.</p>
      </div>
    )}
  </section>
);


export const AgendaView = () => {
  const { userProfile } = useAuthStore();
  const { allAppointments, loading, error } = useProviderAppointments(userProfile?.uid);
  const [selectedAppointment, setSelectedAppointment] = useState<AppAppointment | null>(null);

  // Filtra e ordena os agendamentos em categorias
  const { pendingAppointments, todayAppointments, upcomingAppointments } = useMemo(() => {
    const validAppointments = allAppointments.filter(app => app.startTime instanceof Date);
    
    const pending = validAppointments
      .filter(app => app.status === 'pending')
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());
      
    const today = validAppointments
      .filter(app => app.status === 'confirmed' && isToday(app.startTime!))
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());

    const upcoming = validAppointments
      .filter(app => app.status === 'confirmed' && isFuture(app.startTime!) && !isToday(app.startTime!))
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());

    return { pendingAppointments: pending, todayAppointments: today, upcomingAppointments: upcoming };
  }, [allAppointments]);

  if (loading) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-[#daa520]" size={40} /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 p-10 bg-red-500/10 rounded-lg">{error}</div>;
  }

  const hasAppointments = allAppointments.length > 0;

  return (
    <div className="p-4 sm:p-6 text-white animate-fade-in-down">
      <h1 className="text-3xl font-bold mb-8">Minha Agenda</h1>
      
      {hasAppointments ? (
        <div className="space-y-10">
          <AgendaSection title={`Novas Solicitações (${pendingAppointments.length})`} icon={Bell} appointments={pendingAppointments} onAppointmentClick={setSelectedAppointment} />
          <AgendaSection title={`Agendamentos de Hoje (${todayAppointments.length})`} icon={CalendarClock} appointments={todayAppointments} onAppointmentClick={setSelectedAppointment} />
          <AgendaSection title={`Próximos Agendamentos (${upcomingAppointments.length})`} icon={CalendarCheck} appointments={upcomingAppointments} onAppointmentClick={setSelectedAppointment} />
        </div>
      ) : (
        <div className="text-center text-gray-400 py-24 px-6 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
          <CalendarX size={56} className="mx-auto text-gray-600 mb-4" />
          <h2 className="font-bold text-xl text-white">Sua agenda está vazia</h2>
          <p className="text-sm mt-2">Quando um cliente agendar um serviço, ele aparecerá aqui.</p>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
};

export default AgendaView;

