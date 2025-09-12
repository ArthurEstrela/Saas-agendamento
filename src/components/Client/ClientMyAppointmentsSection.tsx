import { useEffect, useState, useMemo } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useUserAppointmentsStore } from '../../store/userAppointmentsStore';
import { ClientAppointmentCard } from './ClientAppointmentCard';
import { Loader2, CalendarX2 } from 'lucide-react';
import type { Appointment } from '../../types';
// Importe seu modal de review se já tiver um
// import { ReviewModal } from '../Common/ReviewModal';

export const ClientMyAppointmentsSection = () => {
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, fetchAppointments } = useUserAppointmentsStore();

  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchAppointments(userProfile.id);
    }
  }, [userProfile, fetchAppointments]);

  // Separa os agendamentos em "próximos" e "histórico"
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(app => new Date(app.startTime) >= now && app.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    const past = appointments
      .filter(app => new Date(app.startTime) < now || app.status === 'cancelled')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const handleReview = (appointment: Appointment) => {
    setReviewingAppointment(appointment);
    // Lógica para abrir o modal de review
  };

  const handleCloseReviewModal = () => {
    setReviewingAppointment(null);
  };

  const handleSaveReview = async (rating: number, comment: string) => {
    if (!reviewingAppointment) return;
    // Chame a função da sua reviewStore aqui
    console.log('Salvando review...', { rating, comment });
    handleCloseReviewModal();
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">Meus Agendamentos</h1>
        <p className="text-lg text-gray-400 mt-2">Acompanhe seus horários marcados e seu histórico.</p>
      </div>
      
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
            <CalendarX2 size={48} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">Nenhum agendamento encontrado</h3>
            <p>Você ainda não marcou nenhum horário. Que tal buscar um profissional?</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Próximos Agendamentos */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-400 border-b-2 border-amber-500/30 pb-3 mb-6">Próximos Agendamentos</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingAppointments.map(app => <ClientAppointmentCard key={app.id} appointment={app} onReview={handleReview} />)}
              </div>
            ) : (
              <p className="text-gray-500">Você não tem horários futuros marcados.</p>
            )}
          </section>

          {/* Histórico */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-400 border-b-2 border-amber-500/30 pb-3 mb-6">Histórico</h2>
            {pastAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastAppointments.map(app => <ClientAppointmentCard key={app.id} appointment={app} onReview={handleReview} />)}
                </div>
            ) : (
              <p className="text-gray-500">Seu histórico de agendamentos está vazio.</p>
            )}
          </section>
        </div>
      )}

      {/* O Modal de Review seria renderizado aqui */}
      {/* <ReviewModal 
        isOpen={!!reviewingAppointment}
        onClose={handleCloseReviewModal}
        onSubmit={handleSaveReview}
        appointment={reviewingAppointment}
      /> 
      */}
    </div>
  );
};