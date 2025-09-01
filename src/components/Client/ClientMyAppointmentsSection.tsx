import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserAppointments } from '../../store/userAppointmentsStore';
import ClientAppointmentCard from './ClientAppointmentCard';
import { useToast } from '../../context/ToastContext';
import { Loader2, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Componente Auxiliar de Paginação (Sem alterações, já está ótimo) ---
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className="flex items-center justify-end gap-2 mt-4 text-white">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm text-gray-300 font-medium">
        Página {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// --- Componente Principal Refatorado ---
const ClientMyAppointmentsSection = () => {
  const { userProfile } = useAuthStore();
  const { bookings, loading, error, cancelBooking } = useUserAppointments(userProfile?.uid);
  const { showToast } = useToast();

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  // ✅ MELHORIA: A lógica de filtro e ordenação foi simplificada e agora usa objetos Date.
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    
    // Filtra agendamentos que não são válidos ou não possuem uma data de início.
    const validBookings = bookings.filter(b => b && b.id && b.startTime instanceof Date);

    const upcoming = validBookings.filter(b => 
      b.status === 'confirmed' && b.startTime >= now
    );

    const past = validBookings.filter(b => 
      b.status !== 'confirmed' || b.startTime < now
    );

    // Ordena os próximos agendamentos do mais próximo para o mais distante.
    upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    // Ordena o histórico do mais recente para o mais antigo.
    past.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [bookings]);

  // Lógica de Paginação (sem alterações)
  const totalUpcomingPages = Math.ceil(upcomingAppointments.length / ITEMS_PER_PAGE);
  const paginatedUpcoming = upcomingAppointments.slice((upcomingPage - 1) * ITEMS_PER_PAGE, upcomingPage * ITEMS_PER_PAGE);

  const totalPastPages = Math.ceil(pastAppointments.length / ITEMS_PER_PAGE);
  const paginatedPast = pastAppointments.slice((pastPage - 1) * ITEMS_PER_PAGE, pastPage * ITEMS_PER_PAGE);

  // ✅ MELHORIA: A função de cancelamento foi mantida, mas agora é mais resiliente.
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      showToast('Agendamento cancelado com sucesso.', 'success');
    } catch (err) {
      // O erro já é tratado no store, mas um feedback extra é bom.
      showToast('Não foi possível cancelar o agendamento.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#daa520]" size={40} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 p-10">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-10">
      {/* Seção de Próximos Agendamentos */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-4">
          Próximos ({upcomingAppointments.length})
        </h2>
        {paginatedUpcoming.length > 0 ? (
          <>
            <div className="space-y-5">
              {paginatedUpcoming.map((booking) => (
                <ClientAppointmentCard
                  key={booking.id}
                  appointment={booking}
                  onCancel={handleCancelBooking}
                />
              ))}
            </div>
            <PaginationControls
              currentPage={upcomingPage}
              totalPages={totalUpcomingPages}
              onPageChange={setUpcomingPage}
            />
          </>
        ) : (
          <div className="text-center text-gray-400 py-12 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <CalendarPlus size={40} className="mx-auto text-gray-600 mb-4" />
            <p className="font-semibold text-white">Nenhum agendamento futuro</p>
            <p className="text-sm mt-1">Que tal agendar um novo serviço?</p>
          </div>
        )}
      </section>

      {/* Seção de Histórico de Agendamentos */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-4">
          Histórico ({pastAppointments.length})
        </h2>
        {paginatedPast.length > 0 ? (
          <>
            <div className="space-y-5">
              {paginatedPast.map((booking) => (
                <ClientAppointmentCard
                  key={booking.id}
                  appointment={booking}
                  // O onCancel é opcional aqui, mas pode ser útil para referência
                  onCancel={handleCancelBooking} 
                />
              ))}
            </div>
            <PaginationControls
              currentPage={pastPage}
              totalPages={totalPastPages}
              onPageChange={setPastPage}
            />
          </>
        ) : (
          <div className="text-center text-gray-400 py-12 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <p>Seu histórico de agendamentos aparecerá aqui.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientMyAppointmentsSection;