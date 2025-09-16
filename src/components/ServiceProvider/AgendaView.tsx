// src/components/ServiceProvider/AgendaView.tsx
import { useEffect, useState } from "react";
import { useProviderAppointmentsStore } from "../../store/providerAppointmentsStore";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Inbox, History, Loader2 } from "lucide-react";
import { TodaysAgendaTab } from "./TodaysAgendaTab";
import { RequestsTab } from "./RequestsTab";
import { HistoryTab } from "./HistoryTab";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";

// Vamos importar os componentes de cada aba

type Tab = "today" | "requests" | "history";

const tabs = [
  { id: "today", label: "Agenda do Dia", icon: Calendar },
  { id: "requests", label: "Solicitações", icon: Inbox },
  { id: "history", label: "Histórico", icon: History },
];

export const AgendaView = () => {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, fetchAppointments, updateStatus } =
    useProviderAppointmentsStore();
  const provider = userProfile as ServiceProviderProfile;

  // ESTE useEffect AGORA VIVE AQUI, NO COMPONENTE PAI
  useEffect(() => {
    // Garante que só busca os dados uma vez quando o perfil do provider estiver carregado
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  const pendingCount = appointments.filter(
    (a) => a.status === "pending"
  ).length;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <Loader2 size={48} className="animate-spin text-[#daa520]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white p-4 sm:p-6">
      {/* NAVEGAÇÃO DAS ABAS */}
      <div className="flex border-b border-gray-800 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`${
              activeTab === tab.id
                ? "text-[#daa520]"
                : "text-gray-400 hover:text-white"
            } relative flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold transition-colors`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            {tab.id === "requests" && pendingCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                {pendingCount}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#daa520]"
              />
            )}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "today" && <TodaysAgendaTab appointments={appointments} />}
            {activeTab === "requests" && (
              <RequestsTab
                appointments={appointments.filter(
                  (a) => a.status === "pending"
                )}
                onUpdateStatus={updateStatus}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab
                appointments={appointments.filter(
                  (a) => a.status === "completed" || a.status === "cancelled"
                )}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
