// src/components/Client/ClientMyAppointmentsSection.tsx

import React, { useState, useMemo } from "react";
import { useAuthStore } from "../../store/authStore";
import ClientAppointmentCard from "./ClientAppointmentCard";
import { CalendarX2 } from "lucide-react";
import type { Booking, Appointment } from "../../types";
import { Timestamp } from "firebase/firestore";
import { useUserAppointments } from '../../store/userAppointmentsStore';

// --- Helper para converter data (Timestamp, string, etc.) para Date ---
const convertToDate = (date: any): Date => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  return new Date(date);
};

// --- Props do Componente ---
interface ClientMyAppointmentsSectionProps {
  setActiveView: (view: string) => void;
  onCancel: (appointmentId: string) => void;
  onReview: (appointment: Booking) => void;
}

const ClientMyAppointmentsSection = ({
  setActiveView,
  onReview,
}: ClientMyAppointmentsSectionProps) => {
  const { user, userProfile } = useAuthStore();
  const { bookings, loading, error, cancelBooking } = useUserAppointments(user?.uid);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Memoiza a separação e ordenação dos agendamentos para melhor performance
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!bookings) {
      return { upcomingAppointments: [], pastAppointments: [] };
    }

    const now = new Date();
    const allAppointments = bookings.map((app) => ({
      ...app,
      date: convertToDate(app.date), // Garante que a data é um objeto Date
    }));

    const upcoming = allAppointments
      .filter((app) => app.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Mais próximos primeiro

    const past = allAppointments
      .filter((app) => app.date < now)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Mais recentes primeiro

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [bookings]);

  const appointmentsToShow =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;

  if (error) {
    return (
      <div className="text-center text-red-500 py-16">
        <h3 className="text-lg font-semibold">Ocorreu um erro</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-fade-in-down">
      <h2 className="text-3xl font-bold text-white mb-2">Meus Agendamentos</h2>
      <p className="text-gray-400 mb-8">
        Acompanhe seus horários marcados e seu histórico.
      </p>

      {/* Abas de Navegação */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === "upcoming"
              ? "text-[#daa520]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Próximos ({upcomingAppointments.length})
          {activeTab === "upcoming" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#daa520] rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === "past"
              ? "text-[#daa520]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Anteriores ({pastAppointments.length})
          {activeTab === "past" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#daa520] rounded-full"></div>
          )}
        </button>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-6">
        {appointmentsToShow.length > 0 ? (
          appointmentsToShow.map((booking) => (
            <ClientAppointmentCard
              key={booking.id}
              booking={booking}
              onCancel={() => cancelBooking(booking.id)}
              onReview={() => onReview(booking)}
            />
          ))
        ) : (
          <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
            <CalendarX2 size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm mt-2">
              {activeTab === "upcoming"
                ? "Você não tem nenhum horário futuro marcado."
                : "Você ainda não tem um histórico de agendamentos."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMyAppointmentsSection;
