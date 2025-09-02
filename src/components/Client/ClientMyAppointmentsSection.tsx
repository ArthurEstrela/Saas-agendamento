import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserAppointments } from '../../store/userAppointmentsStore';
import ClientAppointmentCard from './ClientAppointmentCard';
import { Loader2, CalendarPlus, ChevronLeft, ChevronRight, CalendarClock, History } from 'lucide-react';

// --- Componentes Auxiliares ---
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center sm:justify-end gap-2 mt-6 text-white">
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

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="text-center text-gray-400 py-16 px-6 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
    <Icon size={48} className="mx-auto text-gray-600 mb-4" />
    <p className="font-bold text-lg text-white">{title}</p>
    <p className="text-sm mt-1">{message}</p>
  </div>
);

const TabButton = ({ icon: Icon, label, count, isActive, onClick }) => (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors duration-200 -mb-px border-b-2 ${
        isActive 
          ? 'text-[#daa520] border-[#daa520]' 
          : 'text-gray-400 border-transparent hover:text-white'
      }`}
    >
        <Icon size={18} />
        <span>{label}</span>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-[#daa520]/20 text-[#daa520]' : 'bg-gray-700 text-gray-300'
        }`}>{count}</span>
    </button>
);

// --- Componente Principal ---
const ClientMyAppointmentsSection = ({ onCancel, onReview }) => { // Adicionado onReview
  const { userProfile } = useAuthStore();
  const { upcomingBookings, pastBookings, loading, error, cancelBooking } = useUserAppointments(userProfile?.uid);
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reseta a página ao trocar de aba
  };

  // Renderiza os estados de carregamento e erro primeiro para evitar crashes
  if (loading) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-[#daa520]" size={40} /></div>;
  }
  if (error) {
    return <div className="text-center text-red-400 p-10">{error}</div>;
  }

  // A partir daqui, podemos assumir que os dados estão prontos ou são arrays vazios.
  const currentBookings = activeTab === 'upcoming' ? (upcomingBookings || []) : (pastBookings || []);
  const totalPages = Math.ceil(currentBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = currentBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Navegação por Abas */}
      <div className="flex border-b border-gray-700">
        <TabButton icon={CalendarClock} label="Próximos" count={upcomingBookings?.length || 0} isActive={activeTab === 'upcoming'} onClick={() => handleTabChange('upcoming')} />
        <TabButton icon={History} label="Histórico" count={pastBookings?.length || 0} isActive={activeTab === 'past'} onClick={() => handleTabChange('past')} />
      </div>

      {/* Conteúdo das Abas */}
      <div className="transition-opacity duration-300">
        {paginatedBookings.length > 0 ? (
          <>
            <div className="space-y-5">
              {paginatedBookings.map((booking) => (
                <ClientAppointmentCard key={booking.id} appointment={booking} onCancel={cancelBooking} onReview={onReview} />
              ))}
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        ) : (
          activeTab === 'upcoming' ? (
            <EmptyState icon={CalendarPlus} title="Nenhum agendamento futuro" message="Quando você agendar um serviço, ele aparecerá aqui." />
          ) : (
            <EmptyState icon={History} title="Nenhum histórico encontrado" message="Seus agendamentos anteriores serão listados aqui." />
          )
        )}
      </div>
    </div>
  );
};

export default ClientMyAppointmentsSection;