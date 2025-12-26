import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  useUserAppointmentsStore,
} from "../../store/userAppointmentsStore";
import { ClientAppointmentCard } from "./ClientAppointmentCard";
import { AppointmentCardSkeleton } from "./AppointmentCardSkeleton";
import { Clock, History } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// UI
import { Button } from "../ui/button";
import { cn } from "../../lib/utils/cn";

type Tab = "upcoming" | "past";

export const ClientMyAppointmentsSection = () => {
  const { user } = useAuthStore();
  const { appointments, isLoading, fetchAppointments, clearAppointments } =
    useUserAppointmentsStore();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (user?.uid) fetchAppointments(user.uid);
    return () => clearAppointments();
  }, [user?.uid, fetchAppointments, clearAppointments]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(
        (a) =>
          a.startTime >= now &&
          (a.status === "pending" || a.status === "scheduled")
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const past = appointments
      .filter(
        (a) =>
          a.startTime < now ||
          a.status === "completed" ||
          a.status === "cancelled"
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const currentList =
    activeTab === "upcoming" ? upcomingAppointments : pastAppointments;
  const EmptyIcon = activeTab === "upcoming" ? Clock : History;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Carregando...</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <AppointmentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Meus Agendamentos</h1>

        {/* Abas */}
        <div className="bg-gray-900 p-1 rounded-lg inline-flex border border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "rounded-md transition-all",
              activeTab === "upcoming"
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            )}
          >
            Próximos ({upcomingAppointments.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("past")}
            className={cn(
              "rounded-md transition-all",
              activeTab === "past"
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            )}
          >
            Histórico ({pastAppointments.length})
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentList.map((appointment) => (
                <ClientAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl text-center">
              <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-600">
                <EmptyIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-300">
                Nenhum agendamento aqui
              </h3>
              <p className="text-gray-500 mt-2 max-w-sm">
                {activeTab === "upcoming"
                  ? "Você não tem agendamentos futuros. Que tal marcar algo novo?"
                  : "Seu histórico de agendamentos está vazio."}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
