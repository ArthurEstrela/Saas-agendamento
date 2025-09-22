// src/components/ServiceProvider/Agenda/AgendaView.tsx
import { useState, useMemo, useEffect } from "react";
import {
  useProviderAppointmentsStore,
  type EnrichedProviderAppointment,
} from "../../../store/providerAppointmentsStore";
import { useProfileStore } from "../../../store/profileStore";
import type { ServiceProviderProfile } from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, CalendarCheck, Inbox, History } from "lucide-react";

// Importando os componentes de cada aba
import { RequestsTab } from "../RequestsTab";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab"; // <-- Novo componente para a agenda principal
import { HistoryTab } from "../HistoryTab";

type AgendaTab = "requests" | "scheduled" | "history";

export const AgendaView = () => {
  const [activeTab, setActiveTab] = useState<AgendaTab>("requests");
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, fetchAppointments, updateStatus } =
    useProviderAppointmentsStore();

  const provider = userProfile as ServiceProviderProfile;

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  // Filtra os agendamentos baseado na aba ativa
  const filteredAppointments = useMemo(() => {
    const statusMap: Record<
      AgendaTab,
      Array<EnrichedProviderAppointment["status"]>
    > = {
      requests: ["pending"],
      scheduled: ["scheduled"],
      history: ["completed", "cancelled"],
    };
    return appointments.filter((appt) =>
      statusMap[activeTab].includes(appt.status)
    );
  }, [appointments, activeTab]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "requests":
        return (
          <RequestsTab
            appointments={filteredAppointments}
            onUpdateStatus={updateStatus}
          />
        );
      case "scheduled":
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
      case "history":
        return <HistoryTab appointments={filteredAppointments} />;
      default:
        return null;
    }
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/30 rounded-2xl text-white p-4 sm:p-6 border border-gray-800">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Minha Agenda</h1>
        <div className="flex items-center bg-gray-900 rounded-lg p-1 space-x-1">
          {/* Botão da Aba de Solicitações */}
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "requests"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            Solicitações
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </button>
          {/* Botão da Aba de Agenda */}
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "scheduled"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            Agenda
          </button>
          {/* Botão da Aba de Histórico */}
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === "history"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            Histórico
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto mt-6 pr-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
