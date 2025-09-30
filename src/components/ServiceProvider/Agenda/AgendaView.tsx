// src/components/ServiceProvider/Agenda/AgendaView.tsx

import { useState, useMemo, useEffect } from "react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { useProfileStore } from "../../../store/profileStore";
import { useAuthStore } from "../../../store/authStore";
import { usePersistentState } from "../../../hooks/usePersistentState";
import type { ServiceProviderProfile, Appointment } from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Clock as ClockIcon,
} from "lucide-react";
import { isSameDay, startOfDay } from "date-fns";

import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { AgendaViewSwitcher } from "./AgendaViewSwitcher";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";
import { AgendaListView } from "./AgendaListView";
import { AgendaColumnView } from "./AgendaColumnView";
// CORREÇÃO DE IMPORT: Importa a exportação TimeGridCalendar do arquivo AgendaCalendario
import { TimeGridCalendar } from "./TimeGridCalendar"; 
import { DateSelector } from "../DateSelector";

type AgendaTab = "requests" | "scheduled" | "history";
export type ViewMode = "card" | "list" | "column" | "calendar";

export const AgendaView = () => {
  const { user } = useAuthStore();
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));

  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "calendar" // Define o calendário como visão padrão
  );

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

  const { appointments, isLoading, fetchAppointments, updateStatus } =
    useProviderAppointmentsStore();

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  // Lógica de filtragem:
  const filteredAppointments = useMemo(() => {
    const statusMap: Record<AgendaTab, Array<Appointment["status"]>> = {
      requests: ["pending"],
      scheduled: ["scheduled"],
      history: ["completed", "cancelled"],
    };

    let filtered = appointments.filter((appt) =>
      statusMap[activeTab].includes(appt.status)
    );

    // 1. FILTRO POR PROFISSIONAL 
    if (selectedProfessionalId) {
      filtered = filtered.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }

    // 2. FILTRO POR DATA (APENAS para visualizações diárias, não para o 'calendar')
    if (
      (activeTab === "scheduled" || activeTab === "requests") &&
      viewMode !== "calendar"
    ) {
      filtered = filtered.filter((appt) =>
        isSameDay(appt.startTime, selectedDay)
      );
    }

    // 3. ORDENAÇÃO
    return filtered.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [appointments, activeTab, selectedProfessionalId, selectedDay, viewMode]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );

  const renderScheduledContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      );
    }

    if (viewMode === "calendar") {
      return (
        <TimeGridCalendar
          appointments={filteredAppointments}
          currentDate={selectedDay}
        />
      );
    }

    switch (viewMode) {
      case "card":
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
      case "list":
        return <AgendaListView appointments={filteredAppointments} />;
      case "column":
        return <AgendaColumnView appointments={filteredAppointments} />;
      default:
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
    }
  };

  return (
    // Container principal do AgendaView
    <div className="h-full flex flex-col bg-gray-900/60 rounded-2xl text-white p-4 sm:p-6 border border-gray-800 shadow-2xl shadow-black/50">
      
      {/* ===== HEADER (FIXO) ===== */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-800 shrink-0">
        <motion.h1
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-3xl font-extrabold text-white shrink-0 flex items-center gap-2"
        >
          <CalendarIcon size={28} className="text-amber-500" />
          Agenda Profissional
        </motion.h1>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          
          <ProfessionalFilter
            selectedProfessionalId={selectedProfessionalId}
            onSelectProfessional={setSelectedProfessionalId}
          />

          {activeTab !== "history" && (
            <DateSelector
              selectedDate={selectedDay}
              setSelectedDate={setSelectedDay}
              label={viewMode === "calendar" ? "Ir para Semana:" : "Dia:"}
            />
          )}

          {activeTab === "scheduled" && (
            <AgendaViewSwitcher
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              icons={{
                card: <LayoutGrid size={18} />,
                list: <List size={18} />,
                column: <LayoutGrid size={18} />,
                calendar: <ClockIcon size={18} />,
              }}
            />
          )}
        </div>
      </header>

      {/* ===== ABAS DE NAVEGAÇÃO (FIXO) ===== */}
      {/* ... (código das abas) ... */}
      <nav className="flex items-center bg-black/50 rounded-xl p-1 space-x-1 mt-4 border border-gray-800 shrink-0">
         <button
          onClick={() => setActiveTab("requests")}
          className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
            activeTab === "requests"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Solicitações
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold"
            >
              {pendingCount}
            </motion.span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
            activeTab === "scheduled"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
            activeTab === "history"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Histórico
        </button>
      </nav>

      {/* ===== CONTEÚDO DINÂMICO (ÁREA DE SCROLL) ===== */}
      <main className="flex-1 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + viewMode + selectedDay.toISOString()}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            // CLASSE CRÍTICA PARA ROLAGEM INTERNA
            className={
              viewMode === "calendar" && activeTab === "scheduled"
                ? "h-full overflow-y-auto"
                : "h-full"
            }
          >
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