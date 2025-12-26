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
} from "lucide-react";
import { startOfDay, isPast } from "date-fns";
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useFilteredAppointments } from "../../../hooks/useFilteredAppointments";
import { AgendaModalsWrapper } from "./AgendaModalsWrapper";

// Importação que faltava!
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
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "calendar"
  );
  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  const isOwner = userProfile?.role === "serviceProvider";

  useEffect(() => {
    if (window.innerWidth < 768)
      setViewMode((prev) => (prev === "calendar" ? "list" : prev));
  }, [setViewMode]);

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
      <div className="flex justify-center h-96 items-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  const enrichedFiltered =
    filteredAppointments as EnrichedProviderAppointment[];

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center h-96 items-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      );

    if (viewMode !== "calendar" && filteredAppointments.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-96 text-gray-500">
          <CalendarIcon size={64} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">Agenda vazia para este dia.</p>
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

  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Card className="min-h-0 flex-1 flex flex-col bg-gray-900/60 backdrop-blur-sm border-gray-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 pb-2 border-b border-gray-800">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="text-primary" /> Agenda
          </h1>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {isOwner && (
              <ProfessionalFilter
                selectedProfessionalId={selectedProfessionalId}
                onSelectProfessional={(id) =>
                  setSelectedProfessionalId(id || "all")
                }
              />
            )}

            {(activeTab === "scheduled" || activeTab === "history") && (
              <DateSelector
                selectedDate={selectedDay}
                setSelectedDate={setSelectedDay}
                label={
                  activeTab === "scheduled" &&
                  viewMode === "calendar" &&
                  !isMobileView
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
                  card: <LayoutGrid size={16} />,
                  list: <List size={16} />,
                  calendar: <ClockIcon size={16} />,
                }}
              />
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
          {[
            { id: "requests", label: "Solicitações", count: pendingCount },
            { id: "scheduled", label: "Agenda", count: 0 },
            {
              id: "pendingIssues",
              label: "Pendências",
              count: pendingPastCount,
            },
            { id: "history", label: "Histórico", count: 0 },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as AgendaTab)}
              className={cn(
                "relative h-9 rounded-full px-4 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]"
                >
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${viewMode}-${selectedDay.toISOString()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "requests" && (
              <RequestsTab
                appointments={enrichedFiltered}
                onAppointmentSelect={handleOpenDetails}
                onUpdateStatus={updateStatus}
              />
            )}
            {activeTab === "scheduled" && renderContent()}
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