import { useEffect } from 'react';
import { useUserAppointmentsStore } from '../../store/userAppointmentsStore';
import { useProfileStore } from '../../store/profileStore';
import { ClientAppointmentCard } from './ClientAppointmentCard'; 
import { AppointmentCardSkeleton } from './AppointmentCardSkeleton';

export const ClientMyAppointmentsSection = () => {
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, error, fetchAppointments } = useUserAppointmentsStore();

  useEffect(() => {
    if (userProfile?.id) {
      fetchAppointments(userProfile.id);
    }
  }, [userProfile, fetchAppointments]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center py-10">{error}</div>;
    }

    if (appointments.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <h2 className="text-xl font-semibold">Nenhum agendamento encontrado</h2>
          <p>Que tal agendar seu próximo serviço?</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((app) => (
          <ClientAppointmentCard key={app.id} appointment={app} />
        ))}
      </div>
    );
  };

  return (
    <section>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meus Agendamentos</h1>
      {renderContent()}
    </section>
  );
};