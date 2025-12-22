// src/components/ServiceProvider/Agenda/AgendaView.tsx

export type AgendaTab = "requests" | "scheduled" | "pendingIssues" | "history";
export type ViewMode = "card" | "list" | "calendar";

import { useState, useMemo, useEffect } from "react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { usePersistentState } from "../../../hooks/usePersistentState";
import type {
  UserProfile,
  ProfessionalProfile,
  ServiceProviderProfile,
  Appointment,
} from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Clock as ClockIcon,
} from "lucide-react";
import { startOfDay, isPast } from "date-fns";

import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useFilteredAppointments } from "../../../hooks/useFilteredAppointments";
import { AgendaModalsWrapper } from "./AgendaModalsWrapper";

import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { AgendaViewSwitcher } from "./AgendaViewSwitcher";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";
import { AgendaListView } from "./AgendaListView";
import { TimeGridCalendar } from "./TimeGridCalendar";
import { DateSelector } from "../DateSelector";
import { PendingIssuesTab } from "./PendingIssuesTab";

interface AgendaViewProps {
  userProfile: UserProfile | null;
}

export const AgendaView = ({ userProfile }: AgendaViewProps) => {
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }

  const isOwner = userProfile.role === "serviceProvider";

  const { appointments, isLoading, fetchAppointments } =
    useProviderAppointmentsStore();
  const { openModal } = useAgendaModalStore();

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");
  
  // Persistência do modo de visualização
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "calendar"
  );
  
  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  // --- CORREÇÃO DE RESPONSIVIDADE INICIAL ---
  // Ao carregar, verifica se é mobile e força a visualização para "list"
  // para garantir a melhor experiência inicial, conforme solicitado.
  useEffect(() => {
    const handleInitialResize = () => {
      if (window.innerWidth < 768) {
        // Se estiver no mobile, sugerimos "list" ou "card" inicialmente
        // Mas respeitamos se o usuário mudar depois (pois o hook usePersistentState cuida do resto)
        // Aqui forçamos apenas se o estado atual for 'calendar', que pode ser pesado no mobile
        setViewMode((prev) => (prev === "calendar" ? "list" : prev));
      }
    };

    // Executa apenas na montagem
    handleInitialResize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio para rodar apenas uma vez na montagem

  useEffect(() => {
    const providerId = isOwner
      ? (userProfile as ServiceProviderProfile).id
      : (userProfile as ProfessionalProfile).serviceProviderId;

    if (providerId) {
      fetchAppointments(providerId);
    }
  }, [isOwner, userProfile, fetchAppointments]);

  const filteredAppointments = useFilteredAppointments(
    appointments,
    userProfile,
    selectedProfessionalId,
    activeTab,
    selectedDay,
    viewMode
  );

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );
  const pendingPastCount = useMemo(() => {
    const beginningOfToday = startOfDay(new Date());
    return appointments.filter(
      (appt) =>
        appt.status === "scheduled" &&
        isPast(appt.endTime) &&
        appt.endTime < beginningOfToday
    ).length;
  }, [appointments]);

  const handleOpenDetails = (appointment: Appointment) => {
    openModal("details", appointment);
  };

  const renderScheduledContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      );
    }
    if (viewMode !== "calendar" && filteredAppointments.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-96 text-gray-500">
          <CalendarIcon size={48} className="mb-4" />
          <p className="text-lg font-semibold">
            Nenhum agendamento para este dia.
          </p>
          <p className="text-sm">Nem confirmados, nem pendentes.</p>
        </div>
      );
    }
    if (viewMode === "calendar") {
      return (
        <TimeGridCalendar
          appointments={filteredAppointments}
          currentDate={selectedDay}
          onAppointmentSelect={handleOpenDetails}
        />
      );
    }

    switch (viewMode) {
      case "card":
        return (
          <ScheduledAppointmentsTab
            appointments={filteredAppointments}
            onAppointmentSelect={handleOpenDetails}
          />
        );
      case "list":
        return (
          <AgendaListView
            appointments={filteredAppointments}
            onAppointmentSelect={handleOpenDetails}
          />
        );
      default:
        return (
          <ScheduledAppointmentsTab
            appointments={filteredAppointments}
            onAppointmentSelect={handleOpenDetails}
          />
        );
    }
  };

  // Detecta se é mobile para ajustar o rótulo do DateSelector
  // (Poderia usar o hook useMediaQuery aqui também, mas window.innerWidth resolve rápido)
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-0 flex-1 flex flex-col bg-gray-900/60 rounded-2xl text-white p-4 sm:p-6 border border-gray-800 shadow-2xl shadow-black/50">
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
          {isOwner && (
            <ProfessionalFilter
              selectedProfessionalId={selectedProfessionalId}
              onSelectProfessional={setSelectedProfessionalId}
            />
          )}

          {(activeTab === "scheduled" || activeTab === "history") && (
            <DateSelector
              selectedDate={selectedDay}
              setSelectedDate={setSelectedDay}
              // Ajuste Dinâmico do Rótulo: 
              // Se for Calendar E Desktop: Mostra "Semana". 
              // Se for Mobile ou outros modos: Mostra "Dia".
              label={
                activeTab === "scheduled" && viewMode === "calendar" && !isMobileView
                  ? "Semana:"
                  : "Dia:"
              }
            />
          )}
          {activeTab === "scheduled" && (
            <AgendaViewSwitcher
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              icons={{
                card: <LayoutGrid size={18} />,
                list: <List size={18} />,
                calendar: <ClockIcon size={18} />,
              }}
            />
          )}
        </div>
      </header>

      <nav className="flex items-center overflow-x-auto bg-black/50 rounded-xl p-1 space-x-1 mt-4 border border-gray-800 shrink-0 scrollbar-hide">
        <button
          onClick={() => setActiveTab("requests")}
          className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
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
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
            activeTab === "scheduled"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => setActiveTab("pendingIssues")}
          className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
            activeTab === "pendingIssues"
              ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Pendências
          {pendingPastCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold"
            >
              {pendingPastCount}
            </motion.span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
            activeTab === "history"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Histórico
        </button>
      </nav>

      <main className="flex-1 mt-6 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              activeTab +
              viewMode +
              selectedDay.toISOString() +
              (isOwner ? selectedProfessionalId : "professional_view")
            }
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {activeTab === "requests" && (
              <RequestsTab
                appointments={filteredAppointments}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
            {activeTab === "scheduled" && renderScheduledContent()}
            {activeTab === "pendingIssues" && (
              <PendingIssuesTab
                appointments={filteredAppointments}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab
                appointments={filteredAppointments}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AgendaModalsWrapper />
    </div>
  );
};