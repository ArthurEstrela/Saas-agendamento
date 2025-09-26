import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useUserAppointmentsStore,
  type EnrichedAppointment,
} from "../../store/userAppointmentsStore";
import { ClientAppointmentCard } from "./ClientAppointmentCard";
import { AppointmentCardSkeleton } from "./AppointmentCardSkeleton";
import { CalendarX, Clock, History } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Define os tipos de aba para o estado
type Tab = "upcoming" | "past";

export const ClientMyAppointmentsSection = () => {
  const { user } = useAuthStore(); // Usamos seletores individuais para extração robusta do estado
  const appointments = useUserAppointmentsStore((state) => state.appointments);
  const isLoading = useUserAppointmentsStore((state) => state.isLoading);
  const fetchAppointments = useUserAppointmentsStore(
    (state) => state.fetchAppointments
  );
  const clearAppointments = useUserAppointmentsStore(
    (state) => state.clearAppointments
  ); // Estado para controlar a aba ativa (padrão: próximos)

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (user?.uid) {
      fetchAppointments(user.uid);
    }
    return () => {
      // Limpa o estado quando o componente é desmontado ou o usuário muda
      clearAppointments();
    };
  }, [user?.uid, fetchAppointments, clearAppointments]); // Lógica de filtragem memoizada para evitar recálculos desnecessários

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(
        (a) =>
          a.startTime >= now &&
          (a.status === "pending" || a.status === "scheduled")
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()); // Ordena do mais próximo para o mais distante

    const past = appointments
      .filter(
        (a) =>
          a.startTime < now ||
          a.status === "completed" ||
          a.status === "cancelled"
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Ordena do mais recente para o mais antigo

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]); // Mapeia a lista baseada na aba ativa

  const currentList =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;
  const title =
    activeTab === "upcoming"
      ? "Próximos Agendamentos"
      : "Histórico de Agendamentos";
  const EmptyIcon = activeTab === "upcoming" ? Clock : History;

  const renderAppointmentList = (list: EnrichedAppointment[]) => (
    <motion.div
      key={activeTab} // Chave para forçar a animação de transição ao trocar de aba
      initial={{ opacity: 0, x: activeTab === "upcoming" ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: activeTab === "upcoming" ? -20 : 20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      {list.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((appointment) => (
            <ClientAppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl mt-4">
          <CalendarX size={48} className="mx-auto text-gray-600" />

          <p className="mt-4 text-gray-400">
            Nenhum agendamento encontrado nesta categoria.
          </p>
        </div>
      )}
    </motion.div>
  );

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          Carregando Agendamentos
        </h2>

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
      <h1 className="text-3xl font-bold text-white mb-6">Meus Agendamentos</h1>
      {/* Estrutura de Abas */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 
 ${
   activeTab === "upcoming"
     ? "text-amber-500 border-b-2 border-amber-500"
     : "text-gray-400 hover:text-gray-200"
 }`}
        >
          <Clock size={18} /> Próximos ({upcomingAppointments.length})
        </button>

        <button
          onClick={() => setActiveTab("past")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200
 ${
   activeTab === "past"
     ? "text-amber-500 border-b-2 border-amber-500"
     : "text-gray-400 hover:text-gray-200"
 }`}
        >
          <History size={18} /> Anteriores ({pastAppointments.length})
        </button>
      </div>
      {/* Título da Seção (abaixo das abas) */}
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      {/* Conteúdo da Aba */}
      <AnimatePresence mode="wait">
        {renderAppointmentList(currentList)}
      </AnimatePresence>
    </div>
  );
};
