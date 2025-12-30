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
  Filter,
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

  // Mobile check
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    isMobile ? "list" : "calendar"
  );

  const [selectedProfessionalId, setSelectedProfessionalId] =
    usePersistentState<string>("agenda_professional_filter", "all");

  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

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

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center h-[50vh] items-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      );

    if (viewMode !== "calendar" && filteredAppointments.length === 0) {
      // Empty State renderizado dentro da ListView para consistência, 
      // mas se quiser customizar, pode retornar aqui.
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
        appointments={enrichedFiltered}
        onAppointmentSelect={handleOpenDetails}
      />
    );
  };

  return (
    // Removido "Card" wrapper no mobile para evitar bordas duplas e padding excessivo
    <div className="flex-1 flex flex-col md:bg-gray-900/60 md:backdrop-blur-sm md:border md:border-gray-800 md:shadow-2xl md:rounded-xl overflow-hidden h-full min-h-0">
      
      {/* Header Responsivo */}
      <div className="flex-shrink-0 flex flex-col gap-3 p-0 md:p-6 md:pb-2 border-b-0 md:border-b md:border-gray-800 z-10">
        
        {/* Linha Superior: Controles Principais */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Esquerda: Data Selector (Agora Full Width no mobile para facilidade) */}
            <div className="w-full md:w-auto order-2 md:order-1">
                 {(activeTab === "scheduled" || activeTab === "history") && (
                    <DateSelector
                        selectedDate={selectedDay}
                        setSelectedDate={setSelectedDay}
                        label={isMobile ? undefined : "Exibindo:"} // Remove label no mobile pra economizar espaço
                    />
                 )}
            </div>

            {/* Direita: Switcher e Filtros */}
            <div className="flex items-center justify-end gap-2 order-1 md:order-2">
                {/* Botão de Filtro Mobile */}
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

                {/* Switcher de Visualização */}
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

        {/* Área de Filtro Expansível (Mobile) ou Fixa (Desktop) */}
        <AnimatePresence>
            {(isOwner && (!isMobile || showFiltersMobile)) && (
                <motion.div 
                    initial={isMobile ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="py-2 md:py-0 md:w-[250px]">
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

        {/* Tabs de Navegação - Scroll Horizontal no Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 md:pt-2">
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
              variant={activeTab === tab.id ? "default" : "secondary"}
              onClick={() => setActiveTab(tab.id as AgendaTab)}
              className={cn(
                "h-8 md:h-9 rounded-full px-4 text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border border-transparent",
                activeTab === tab.id
                  ? "bg-primary text-black hover:bg-primary/90 shadow-md shadow-primary/20"
                  : "bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-white"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={tab.alert ? "destructive" : "secondary"}
                  className={cn(
                    "ml-2 h-4 md:h-5 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px]",
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <div className="p-0 md:p-4 min-h-full"> {/* Remove padding interno no mobile se quiser full-bleed, ou use p-1 */}
            <AnimatePresence mode="wait">
            <motion.div
                key={`${activeTab}-${viewMode}-${selectedDay.toISOString()}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
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
        </div>
      </main>

      <AgendaModalsWrapper />
    </div>
  );
};