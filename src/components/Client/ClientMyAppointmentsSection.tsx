import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserAppointmentsStore, type EnrichedAppointment } from '../../store/userAppointmentsStore';
import { ClientAppointmentCard } from './ClientAppointmentCard';
import { AppointmentCardSkeleton } from './AppointmentCardSkeleton';
import { CalendarX } from 'lucide-react';

export const ClientMyAppointmentsSection = () => {
  const { user } = useAuthStore();
  const { appointments, isLoading, fetchAppointments, clearAppointments } = useUserAppointmentsStore();

  useEffect(() => {
    if (user) {
      fetchAppointments(user.uid);
    }
    return () => {
      clearAppointments();
    };
  }, [user, fetchAppointments, clearAppointments]);

  const upcomingAppointments = appointments.filter(a => a.startTime >= new Date() && (a.status === 'pending' || a.status === 'scheduled'));
  const pastAppointments = appointments.filter(a => a.startTime < new Date() || a.status === 'completed' || a.status === 'cancelled');

  const renderAppointmentList = (list: EnrichedAppointment[], title: string) => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      {list.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map(appointment => (
            <ClientAppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <CalendarX size={48} className="mx-auto text-gray-600" />
          <p className="mt-4 text-gray-400">Nenhum agendamento encontrado.</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Próximos Agendamentos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {renderAppointmentList(upcomingAppointments, 'Próximos Agendamentos')}
      {renderAppointmentList(pastAppointments, 'Agendamentos Anteriores')}
    </div>
  );
};