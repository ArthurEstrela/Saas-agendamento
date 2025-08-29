// src/components/Client/ClientMyAppointmentsSection.tsx

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import ClientAppointmentCard from './ClientAppointmentCard';
import { CalendarX2 } from 'lucide-react';

const ClientMyAppointmentsSection = () => {
  const { userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!userProfile?.myAppointments) {
      return { upcomingAppointments: [], pastAppointments: [] };
    }

    const now = new Date();
    // Ordena os agendamentos do mais recente para o mais antigo
    const sortedAppointments = [...userProfile.myAppointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const upcoming = sortedAppointments.filter(app => new Date(app.date) >= now);
    const past = sortedAppointments.filter(app => new Date(app.date) < now);

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [userProfile?.myAppointments]);

  const appointmentsToShow = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="p-4 sm:p-6 animate-fade-in-down">
      <h2 className="text-3xl font-bold text-white mb-2">Meus Agendamentos</h2>
      <p className="text-gray-400 mb-8">Acompanhe seus horários marcados e seu histórico.</p>

      {/* Abas de Navegação */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'upcoming' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-400 hover:text-white'}`}
        >
          Próximos ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'past' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-400 hover:text-white'}`}
        >
          Anteriores ({pastAppointments.length})
        </button>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-6">
        {appointmentsToShow.length > 0 ? (
          appointmentsToShow.map(booking => (
            <ClientAppointmentCard key={booking.id} booking={booking} />
          ))
        ) : (
          <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
            <CalendarX2 size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white">Nenhum agendamento encontrado</h3>
            <p className="text-sm mt-2">
              {activeTab === 'upcoming' 
                ? 'Você não tem nenhum horário futuro marcado.' 
                : 'Você ainda não tem um histórico de agendamentos.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMyAppointmentsSection;