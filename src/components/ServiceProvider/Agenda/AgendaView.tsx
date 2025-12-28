import { useState, useMemo, useEffect } from "react";
import {
  useProviderAppointmentsStore,
  type EnrichedProviderAppointment,
} from "../../../store/providerAppointmentsStore";
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
  AlertCircle,
} from "lucide-react";
import { startOfDay, isPast } from "date-fns";
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useFilteredAppointments } from "../../../hooks/useFilteredAppointments";
import { AgendaModalsWrapper } from "./AgendaModalsWrapper";

import { cn } from "../../../lib/utils/cn";

// Abas e Componentes
import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { AgendaViewSwitcher } from "./AgendaViewSwitcher";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";
import { AgendaListView } from "./AgendaListView";
import { TimeGridCalendar } from "./TimeGridCalendar";
import { DateSelector } from "../DateSelector";
import { PendingIssuesTab } from "./PendingIssuesTab";

// UI
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";

export type AgendaTab = "requests" | "scheduled" | "pendingIssues" | "history";
export type ViewMode = "card" | "list" | "calendar";

interface AgendaViewProps {
  userProfile: UserProfile | null;
}

export const AgendaView = ({ userProfile }: AgendaViewProps) => {
  const { appointments, isLoading, fetchAppointments, updateStatus } =
    useProviderAppointmentsStore();
  const { openModal } = useAgendaModalStore();

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");

  // Melhoria: Define o padrão inicial baseado no tamanho da tela, mas não força mudança depois
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    typeof window !== "undefined" && window.innerWidth < 768
      ? "list"
      : "calendar"
  );

  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  const isOwner = userProfile?.role === "serviceProvider";

  useEffect(() => {
    if (!userProfile) return;
    const providerId = isOwner
      ? (userProfile as ServiceProviderProfile).id
      : (userProfile as ProfessionalProfile).serviceProviderId;
    if (providerId) fetchAppointments(providerId);
  }, [isOwner, userProfile, fetchAppointments]);

  const filteredAppointments = useFilteredAppointments(
    appointments,
    userProfile as UserProfile,
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

  const handleOpenDetails = (appointment: Appointment) =>
    openModal("details", appointment);

  if (!userProfile)
    return (
      <div className="flex justify-center h-[50vh] items-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  const enrichedFiltered =
    filteredAppointments as EnrichedProviderAppointment[];

  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center h-[50vh] items-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      );

    if (viewMode !== "calendar" && filteredAppointments.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-[50vh] text-gray-500 text-center p-4">
          <CalendarIcon size={64} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Agenda vazia.</p>
          <p className="text-sm">
            Nenhum agendamento encontrado para este filtro.
          </p>
        </div>
      );
    }

    if (viewMode === "calendar")
      return (
        <TimeGridCalendar
          appointments={filteredAppointments}
          currentDate={selectedDay}
          onAppointmentSelect={handleOpenDetails}
        />
      );
    if (viewMode === "list")
      return (
        <AgendaListView
          appointments={filteredAppointments}
          onAppointmentSelect={handleOpenDetails}
        />
      );
    return (
      <ScheduledAppointmentsTab
        appointments={enrichedFiltered}
        onAppointmentSelect={handleOpenDetails}
      />
    );
  };

  return (
    <Card className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-sm border-gray-800 shadow-2xl overflow-hidden h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 pb-2 border-b border-gray-800 z-20 bg-gray-900/95">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-4">
          {/* Título e Filtro de Profissional */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 whitespace-nowrap">
              <CalendarIcon className="text-primary" />
              <span className="hidden sm:inline">Agenda</span>
            </h1>

            {isOwner && (
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <ProfessionalFilter
                  selectedProfessionalId={selectedProfessionalId}
                  onSelectProfessional={(id) =>
                    setSelectedProfessionalId(id || "all")
                  }
                />
              </div>
            )}
          </div>

          {/* Controles de Data e Visualização */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
            {(activeTab === "scheduled" || activeTab === "history") && (
              <div className="w-full sm:w-auto flex-1">
                <DateSelector
                  selectedDate={selectedDay}
                  setSelectedDate={setSelectedDay}
                  // Lógica inteligente de label:
                  // Se for mobile E estiver no modo calendário -> Mostra "Dia" (pois mobile vira day view)
                  // Se for desktop E estiver no modo calendário -> Mostra "Semana"
                  label={
                    activeTab === "scheduled" &&
                    viewMode === "calendar" &&
                    !isMobileView
                      ? "Semana:"
                      : "Dia:"
                  }
                />
              </div>
            )}

            {activeTab === "scheduled" && (
              <div className="flex-shrink-0 self-end sm:self-auto">
                <AgendaViewSwitcher
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  icons={{
                    card: <LayoutGrid size={18} />,
                    list: <List size={18} />,
                    calendar: <ClockIcon size={18} />,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Scrollável no mobile) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: "requests", label: "Solicitações", count: pendingCount },
            { id: "scheduled", label: "Agenda", count: 0 },
            {
              id: "pendingIssues",
              label: "Pendências",
              count: pendingPastCount,
              alert: true,
            },
            { id: "history", label: "Histórico", count: 0 },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as AgendaTab)}
              className={cn(
                "relative h-9 rounded-full px-4 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                activeTab === tab.id
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={tab.alert ? "destructive" : "secondary"}
                  className={cn(
                    "ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full text-[10px]",
                    tab.alert ? "animate-pulse" : "bg-gray-700 text-white"
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 bg-black/20 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${viewMode}-${selectedDay.toISOString()}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="h-full flex flex-col"
          >
            {activeTab === "requests" && (
              <RequestsTab
                appointments={enrichedFiltered}
                onAppointmentSelect={handleOpenDetails}
                onUpdateStatus={updateStatus}
              />
            )}
            {activeTab === "scheduled" && (
              <div className="h-full flex flex-col">{renderContent()}</div>
            )}
            {activeTab === "pendingIssues" && (
              <PendingIssuesTab
                appointments={enrichedFiltered}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab
                appointments={enrichedFiltered}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AgendaModalsWrapper />
    </Card>
  );
};
