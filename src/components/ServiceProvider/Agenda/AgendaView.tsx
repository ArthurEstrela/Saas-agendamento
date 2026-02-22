import { useState, useMemo, useEffect } from "react";
// Lemos o utilizador centralizado no authStore
import { useAuthStore } from "../../../store/authStore";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { useAvailabilityStore } from "../../../store/availabilityStore";
import type {
  ServiceProviderProfile,
  ProfessionalProfile,
  Appointment,
} from "../../../types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  List,
  LayoutGrid,
  Clock as ClockIcon,
  Filter,
  Download,
  Plus,
} from "lucide-react";
import { startOfDay, isPast, format, parse, startOfWeek, endOfWeek } from "date-fns";
import { useAgendaModalStore } from "../../../store/useAgendaModalStore";
import { useFilteredAppointments } from "../../../hooks/useFilteredAppointments";
import { AgendaModalsWrapper } from "./AgendaModalsWrapper";
import { exportDailyAgendaToCsv } from "../../../lib/utils/exportToCsv";

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

export type AgendaTab = "requests" | "scheduled" | "pendingIssues" | "history";
export type ViewMode = "card" | "list" | "calendar";

export const AgendaView = () => {
  // 🔥 Pegamos o usuário do Store Principal de Autenticação
  const { user } = useAuthStore();

  // 🔥 Lemos funções corretas e estritas do provider store
  const {
    appointments,
    loading: isLoading,
    fetchAppointments,
    confirmAppointment,
    cancelAppointment,
  } = useProviderAppointmentsStore();

  const { availableSlots } = useAvailabilityStore();
  const { openModal } = useAgendaModalStore();

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    isMobile ? "list" : "calendar",
  );

  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Verifica se o usuário é um Service Provider (dono)
  const isOwner =
    user?.role === "SERVICE_PROVIDER" || user?.role === "serviceProvider";

  useEffect(() => {
    if (!user) return;
    
    const providerId = isOwner
      ? (user as ServiceProviderProfile).id
      : (user as ProfessionalProfile).serviceProviderId;

    if (providerId) {
      // ✨ CORREÇÃO: Passando as datas corretamente (vamos buscar a semana toda ao redor da data selecionada)
      const startDateStr = format(startOfWeek(selectedDay), "yyyy-MM-dd");
      const endDateStr = format(endOfWeek(selectedDay), "yyyy-MM-dd");
      fetchAppointments(providerId, startDateStr, endDateStr);
    }
  }, [isOwner, user, selectedDay, fetchAppointments]);

  // Cast seguro para a interface correta do Hook
  const providerUser = isOwner
    ? (user as ServiceProviderProfile)
    : (user as ProfessionalProfile);

  const filteredAppointments = useFilteredAppointments(
    appointments,
    providerUser,
    selectedProfessionalId,
    activeTab,
    selectedDay,
    viewMode,
  );

  // Lógica de exportação com ordenação cronológica
  const handleExport = () => {
    const apps = filteredAppointments.map((app) => ({
      ...app,
      isVacant: false,
    }));

    const vacantData = availableSlots.map((slotTime) => ({
      startTime: parse(slotTime, "HH:mm", selectedDay).toISOString(),
      isVacant: true,
      clientName: "DISPONÍVEL",
      serviceName: "-",
      status: "FREE",
    }));

    // Ordena por horário convertendo as strings ISO em Date
    const fullDailyData = [...apps, ...vacantData].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const filename = `agenda_${format(selectedDay, "dd-MM-yyyy")}.csv`;
    exportDailyAgendaToCsv(filename, fullDailyData);
  };

  const handleOpenDetails = (appointment: Appointment) =>
    openModal("details", appointment);

  // Status agora chegam em maiúsculas (PENDING)
  const pendingCount = useMemo(
    () =>
      appointments.filter((a) => a.status.toUpperCase() === "PENDING").length,
    [appointments],
  );

  const pendingPastCount = useMemo(() => {
    const beginningOfToday = startOfDay(new Date());
    return appointments.filter((appt) => {
      const endTimeDate = new Date(appt.endTime);
      return (
        appt.status.toUpperCase() === "SCHEDULED" &&
        isPast(endTimeDate) &&
        endTimeDate < beginningOfToday
      );
    }).length;
  }, [appointments]);

  if (!user)
    return (
      <div className="flex justify-center h-[50vh] items-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center h-[50vh] items-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      );

    if (viewMode !== "calendar" && filteredAppointments.length === 0) {
      return (
        <AgendaListView
          appointments={[]}
          onAppointmentSelect={handleOpenDetails}
        />
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
        appointments={filteredAppointments}
        onAppointmentSelect={handleOpenDetails}
      />
    );
  };

  // 🔥 Wrapper para a tabela de 'Solicitações' (RequestsTab)
  // Recebe o id e o status (Confirmar/Rejeitar) e chama os métodos corretos do Java.
  const handleUpdateStatusWrapper = async (id: string, newStatus: string) => {
    const normalizedStatus = newStatus.toUpperCase();
    if (normalizedStatus === "SCHEDULED" || normalizedStatus === "CONFIRMED") {
      await confirmAppointment(id);
    } else if (normalizedStatus === "CANCELLED" || normalizedStatus === "REJECTED") {
      await cancelAppointment(id, "Rejeitado pelo profissional");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full max-w-full md:bg-gray-900/60 md:backdrop-blur-sm md:border md:border-gray-800 md:shadow-2xl md:rounded-xl overflow-hidden">
      <div className="flex-shrink-0 flex flex-col bg-background/95 md:bg-transparent z-10 w-full border-b border-gray-800">
        <div className="flex flex-col gap-2 p-2 sm:p-4 pb-0 sm:pb-2 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="w-full sm:w-auto sm:flex-1 min-w-0">
              {(activeTab === "scheduled" || activeTab === "history") && (
                <DateSelector
                  selectedDate={selectedDay}
                  setSelectedDate={setSelectedDay}
                  label={isMobile ? undefined : "Exibindo:"}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
              <Button
                size="sm"
                onClick={() =>
                  openModal("manual_booking", undefined, {
                    defaultDate: selectedDay,
                  })
                }
                className="bg-primary text-black hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">Novo Agendamento</span>
              </Button>

              {activeTab === "scheduled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
                >
                  <Download size={16} />
                  <span className="xs:inline">Exportar CSV</span>
                </Button>
              )}

              {isOwner && isMobile && (
                <Button
                  size="icon"
                  variant={showFiltersMobile ? "default" : "outline"}
                  className="h-9 w-9 border-gray-700 bg-gray-800"
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                >
                  <Filter size={16} />
                </Button>
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
        </div>

        <AnimatePresence>
          {isOwner && (!isMobile || showFiltersMobile) && (
            <motion.div
              initial={
                isMobile
                  ? { height: 0, opacity: 0 }
                  : { height: "auto", opacity: 1 }
              }
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden w-full px-2 sm:px-4"
            >
              <div className="py-2 md:w-[250px]">
                <ProfessionalFilter
                  selectedProfessionalId={selectedProfessionalId}
                  onSelectProfessional={(id) =>
                    setSelectedProfessionalId(id || "all")
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full overflow-x-auto p-2 scrollbar-hide border-t border-gray-800/30 mt-2 bg-gray-900/30">
          <div className="flex items-center gap-2 w-max mx-auto sm:mx-0">
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
                size="sm"
                onClick={() => setActiveTab(tab.id as AgendaTab)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-black hover:bg-primary/90"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge
                    variant={tab.alert ? "destructive" : "secondary"}
                    className={cn(
                      "ml-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px]",
                      tab.alert ? "animate-pulse" : "bg-gray-700 text-white",
                    )}
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent w-full bg-background/50">
        <div className="h-full w-full p-0 sm:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${viewMode}-${selectedDay.toISOString()}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col w-full"
            >
              {activeTab === "requests" && (
                <div className="p-2 sm:p-0">
                  <RequestsTab
                    appointments={filteredAppointments}
                    onAppointmentSelect={handleOpenDetails}
                    onUpdateStatus={handleUpdateStatusWrapper} // Agora com wrapper seguro!
                  />
                </div>
              )}
              {activeTab === "scheduled" && (
                <div className="h-full flex flex-col w-full">
                  {renderContent()}
                </div>
              )}
              {activeTab === "pendingIssues" && (
                <div className="p-2 sm:p-0">
                  <PendingIssuesTab
                    appointments={filteredAppointments}
                    onAppointmentSelect={handleOpenDetails}
                  />
                </div>
              )}
              {activeTab === "history" && (
                <div className="p-2 sm:p-0">
                  <HistoryTab
                    appointments={filteredAppointments}
                    onAppointmentSelect={handleOpenDetails}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AgendaModalsWrapper />
    </div>
  );
};