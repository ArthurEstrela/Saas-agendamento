// Em src/components/ServiceProvider/Agenda/AgendaView.tsx

// 1. Exporte estes tipos para os hooks poderem usá-los
export type AgendaTab = "requests" | "scheduled" | "pendingIssues" | "history";
export type ViewMode = "card" | "list" | "calendar";

import { useState, useMemo, useEffect } from "react";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { usePersistentState } from "../../../hooks/usePersistentState";
import type {
  UserProfile,
  ProfessionalProfile,
  ServiceProviderProfile,
  Appointment, // <-- Importe o tipo Appointment
} from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Clock as ClockIcon,
} from "lucide-react";
import { startOfDay, isPast } from "date-fns"; // <-- Importe isPast

// 2. Nossas novas importações
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useFilteredAppointments } from "../../../hooks/useFilteredAppointments";
import { AgendaModalsWrapper } from "./AgendaModalsWrapper";

// 3. Seus componentes de UI (sem alteração)
import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { AgendaViewSwitcher } from "./AgendaViewSwitcher";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";
import { AgendaListView } from "./AgendaListView";
import { TimeGridCalendar } from "./TimeGridCalendar";
import { DateSelector } from "../DateSelector";
import { PendingIssuesTab } from "./PendingIssuesTab";

// 4. O componente agora recebe o userProfile como prop
interface AgendaViewProps {
  userProfile: UserProfile | null; // <-- Aceite 'null' para segurança
}

export const AgendaView = ({ userProfile }: AgendaViewProps) => {
  // --- A CORREÇÃO DE SEGURANÇA (LINHA 49) ---
  // Se o perfil for null ou undefined (ex: durante o carregamento do pai),
  // mostre um loader em vez de falhar.
  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-amber-500" size={48} />
      </div>
    );
  }
  // --- Daqui para baixo, 'userProfile' é garantidamente um objeto ---

  // --- 5. Lógica de Role ---
  const isOwner = userProfile.role === "serviceProvider"; // <-- Esta linha agora é segura

  // --- 6. Stores ---
  const { appointments, isLoading, fetchAppointments } =
    useProviderAppointmentsStore();
  const { openModal } = useAgendaModalStore(); // Store dos Modals

  // --- 7. Estado Local (MUITO reduzido) ---
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "calendar"
  );
  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  // --- 8. Fetch de Dados (Agora ciente do Role) ---
  useEffect(() => {
    const providerId = isOwner
      ? (userProfile as ServiceProviderProfile).id
      : (userProfile as ProfessionalProfile).serviceProviderId;

    if (providerId) {
      fetchAppointments(providerId);
    }
    // A dependência [userProfile] é segura porque o 'if' no topo já o validou
  }, [isOwner, userProfile, fetchAppointments]);

  // --- 9. Lógica de Filtragem (agora no Hook) ---
  const filteredAppointments = useFilteredAppointments(
    appointments,
    userProfile, // Passamos o perfil (que sabemos não ser nulo)
    selectedProfessionalId,
    activeTab,
    selectedDay,
    viewMode
  );

  // --- 10. Contagens (Lógica original mantida) ---
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

  // --- 11. Handlers (MUITO reduzidos) ---
  const handleOpenDetails = (appointment: Appointment) => {
    openModal("details", appointment);
  };

  // --- 12. Renderização ---
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
              label={
                activeTab === "scheduled" && viewMode === "calendar"
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
          onClick={() => setActiveTab("pendingIssues")}
          className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
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
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
            activeTab === "history"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10"
              : "text-gray-400 hover:bg-gray-800"
          }`}
        >
          Histórico
        </button>
      </nav>

      <main className="flex-1 mt-6">
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
