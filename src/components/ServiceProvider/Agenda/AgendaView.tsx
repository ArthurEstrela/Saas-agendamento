// src/components/ServiceProvider/Agenda/AgendaView.tsx
import { useState, useMemo, useEffect } from "react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useProfileStore } from "../../../store/profileStore";
import { useAuthStore } from "../../../store/authStore";
import { usePersistentState } from "../../../hooks/usePersistentState";
import type { ServiceProviderProfile } from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter"; // <-- O filtro
import { AgendaViewSwitcher } from "./AgendaViewSwitcher"; // <-- O novo switcher
import { AgendaListView } from "./AgendaListView";
import { AgendaColumnView } from "./AgendaColumnView";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";

type AgendaTab = "requests" | "scheduled" | "history";
export type ViewMode = "card" | "list" | "column";

export const AgendaView = () => {
  const [activeTab, setActiveTab] = useState<AgendaTab>("requests");
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "card"
  );

  const { user } = useAuthStore();
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;

  const getInitialProfessionalId = (): string | null => {
    if (
      user?.role === "professional" &&
      provider?.professionals?.some((p) => p.id === user.id)
    ) {
      return user.id;
    }
    return null;
  };

  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string | null>(
      "agenda_professional_filter",
      getInitialProfessionalId()
    );

  // ... O resto dos hooks e lógicas de busca/filtragem permanecem os mesmos ...
  const { appointments, isLoading, fetchAppointments, updateStatus } =
    useProviderAppointmentsStore();

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const statusMap: Record<AgendaTab, Array<Appointment["status"]>> = {
      requests: ["pending"],
      scheduled: ["scheduled"],
      history: ["completed", "cancelled"],
    };
    let filtered = appointments.filter((appt) =>
      statusMap[activeTab].includes(appt.status)
    );
    if (selectedProfessionalId) {
      filtered = filtered.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }
    return filtered.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [appointments, activeTab, selectedProfessionalId]);

  const professionalsForColumnView = useMemo(() => {
    const allProfessionals =
      (userProfile as ServiceProviderProfile)?.professionals || [];
    if (selectedProfessionalId) {
      return allProfessionals.filter((p) => p.id === selectedProfessionalId);
    }
    return allProfessionals;
  }, [userProfile, selectedProfessionalId]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );
  // ... Fim da lógica que não muda ...

  const renderScheduledContent = () => {
    // Esta função agora está mais limpa, sem a toolbar
    switch (viewMode) {
      case "card":
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
      case "list":
        return <AgendaListView appointments={filteredAppointments} />;
      case "column":
        return (
          <AgendaColumnView
            appointments={filteredAppointments}
            professionals={professionalsForColumnView}
          />
        );
      default:
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/30 rounded-2xl text-white p-4 sm:p-6 border border-gray-800">
      {/* ===== HEADER ATUALIZADO ===== */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-4 pb-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white shrink-0">Minha Agenda</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* 1. Filtro de profissional movido para o header global */}
          <ProfessionalFilter
            selectedProfessionalId={selectedProfessionalId}
            onSelectProfessional={setSelectedProfessionalId}
          />
          {/* 2. Abas de navegação */}
          <div className="flex items-center bg-gray-900 rounded-lg p-1 space-x-1">
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
            {/* 3. ViewSwitcher aparece apenas na aba 'Agenda' */}
            {activeTab === "scheduled" && (
              <AgendaViewSwitcher
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            )}

            {activeTab === "requests" && (
              <RequestsTab
                appointments={filteredAppointments}
                onUpdateStatus={updateStatus}
              />
            )}
            {activeTab === "scheduled" && renderScheduledContent()}
            {activeTab === "history" && (
              <HistoryTab appointments={filteredAppointments} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
