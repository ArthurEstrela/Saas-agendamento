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
  AlertTriangle,
} from "lucide-react";
import { isPast, isSameDay, startOfDay } from "date-fns";

import { useToast } from "../../../hooks/useToast";

import { RequestsTab } from "../RequestsTab";
import { HistoryTab } from "../HistoryTab";
import { ProfessionalFilter } from "./ProfessionalFilter";
import { AgendaViewSwitcher } from "./AgendaViewSwitcher";
import { ScheduledAppointmentsTab } from "./ScheduledAppointmentsTab";
import { AgendaListView } from "./AgendaListView";
import { TimeGridCalendar } from "./TimeGridCalendar";
import { DateSelector } from "../DateSelector";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import { ServiceCompletionModal } from "../ServiceCompletionModal";
import { CancelAppointmentModal } from "../../Common/CancelAppointmentModal";
import { PendingIssuesTab } from "./PendingIssuesTab";

type AgendaTab = "requests" | "scheduled" | "pendingIssues" | "history";
export type ViewMode = "card" | "list" | "calendar";

export const AgendaView = () => {
  const { user } = useAuthStore();
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));

  const [activeTab, setActiveTab] = useState<AgendaTab>("scheduled");
  const [viewMode, setViewMode] = usePersistentState<ViewMode>(
    "agenda_view_mode",
    "calendar"
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

  const {
    appointments,
    isLoading,
    fetchAppointments,
    updateStatus,
    completeAppointment,
  } = useProviderAppointmentsStore();

  const { showToast } = useToast();

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]); // Handlers 1-6 (Fluxo de Conclusão/Cancelamento)

  const handleOpenDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
  };

  const handleOpenCompletion = () => {
    setIsDetailsModalOpen(false);
    setIsCompletionModalOpen(true);
  };

  const handleOpenCancel = () => {
    setIsDetailsModalOpen(false);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCompletion = async (finalPrice: number) => {
    if (!selectedAppointment) return;
    try {
      await completeAppointment(selectedAppointment.id, finalPrice);
      showToast("Sucesso", "Agendamento concluído com sucesso!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao concluir.";
      showToast("Erro", errorMessage, "error");
    } finally {
      setIsCompletionModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedAppointment) return;
    const isDeclining = selectedAppointment.status === "pending";
    try {
      await updateStatus(selectedAppointment.id, "cancelled", reason);
      showToast(
        "Sucesso",
        `Agendamento ${isDeclining ? "recusado" : "cancelado"} com sucesso!`,
        "success"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao processar.";
      showToast("Erro", errorMessage, "error");
    } finally {
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
    }
  }; // ****** NOVOS HANDLERS PARA ACEITAR/RECUSAR (ADICIONADO) ****** // 7. Confirma o Aceite

  const handleConfirmAccept = async () => {
    if (!selectedAppointment) return;
    try {
      await updateStatus(selectedAppointment.id, "scheduled");
      showToast("Sucesso", "Agendamento confirmado!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao confirmar.";
      showToast("Erro", errorMessage, "error");
    } finally {
      setIsDetailsModalOpen(false);
      setSelectedAppointment(null);
    }
  }; // 8. Inicia a Recusa (reutiliza o modal de cancelamento)

  const handleDecline = () => {
    handleOpenCancel();
  }; // ************************************************************* // ****** LÓGICA DE FILTRO ATUALIZADA ******
  const filteredAppointments = useMemo(() => {
    // 1. Filtro por Profissional (é global)
    let filtered = appointments;
    if (selectedProfessionalId) {
      filtered = filtered.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }

    // 2. Filtro principal por Aba
    const beginningOfToday = startOfDay(new Date());

    switch (activeTab) {
      case "requests":
        filtered = filtered.filter((a) => a.status === "pending"); // Não filtra por dia, é um inbox global
        break;

      case "pendingIssues": // <-- LÓGICA DA NOVA ABA
        filtered = filtered.filter(
          (a) =>
            a.status === "scheduled" &&
            isPast(a.endTime) &&
            a.endTime < beginningOfToday
        );
        // Também não filtra por dia, é um inbox global
        break;

      case "scheduled":
        filtered = filtered.filter(
          (a) => a.status === "scheduled" || a.status === "pending"
        );
        // Na agenda, filtramos por dia (exceto no calendário)
        if (viewMode !== "calendar") {
          filtered = filtered.filter((a) =>
            isSameDay(a.startTime, selectedDay)
          );
        }
        break;

      case "history":
        filtered = filtered.filter(
          (a) => a.status === "completed" || a.status === "cancelled"
        );
        // No histórico, também filtramos por dia
        filtered = filtered.filter((a) => isSameDay(a.startTime, selectedDay));
        break;
    }

    // 3. Ordenação final
    return filtered.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [appointments, activeTab, selectedProfessionalId, selectedDay, viewMode]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );

  const pendingPastCount = useMemo(() => {
    const beginningOfToday = startOfDay(new Date());
    return appointments.filter(
      (appt) =>
        appt.status === "scheduled" && // Foi agendado
        isPast(appt.endTime) && // O horário já passou
        appt.endTime < beginningOfToday // E foi antes de hoje
    ).length;
  }, [appointments]);

  const renderScheduledContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      );
    } // ****** ADIÇÃO DE VERIFICAÇÃO DE "VAZIO" (UX MELHORADA) ******

    if (
      (viewMode === "card" || viewMode === "list") &&
      filteredAppointments.length === 0
    ) {
      return (
        <div className="flex flex-col justify-center items-center h-96 text-gray-500">
          <CalendarIcon size={48} className="mb-4" />
          <p className="text-lg font-semibold">
            Nenhum agendamento para este dia.
          </p>
          <p className="text-sm">Nem confirmados, nem pendentes.</p>
        </div>
      );
    } // ****************************************************************
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
          <ProfessionalFilter
            selectedProfessionalId={selectedProfessionalId}
            onSelectProfessional={setSelectedProfessionalId}
          />
          {/* O DateSelector agora aparece em 'scheduled' e 'history' */}
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
              N
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
              ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/10" // Cor de destaque
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
              selectedProfessionalId
            }
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className={
              viewMode === "calendar" && activeTab === "scheduled"
                ? "h-full"
                : "h-full"
            }
          >
            {activeTab === "requests" && (
              <RequestsTab
                appointments={filteredAppointments}
                onUpdateStatus={updateStatus}
                onAppointmentSelect={handleOpenDetails}
              />
            )}
            {activeTab === "scheduled" && renderScheduledContent()} 
            {activeTab === "pendingIssues" && (
              <PendingIssuesTab // <-- USANDO O COMPONENTE NOVO
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
      {/* ****** MODAIS ATUALIZADOS COM NOVAS PROPS ****** */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          handleCloseDetails();
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onOpenCompletion={handleOpenCompletion}
        onOpenCancel={handleOpenCancel} // Novas props
        onAccept={handleConfirmAccept}
        onDecline={handleDecline}
      />
      <ServiceCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirmCompletion}
        appointment={selectedAppointment}
        isLoading={isLoading}
      />
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointmentId={selectedAppointment?.id || ""}
        onConfirm={handleConfirmCancel}
        userType="serviceProvider" // Prop de intenção para mudar o texto
        intent={
          selectedAppointment?.status === "pending" ? "decline" : "cancel"
        }
        isLoading={isLoading} // Passando o isLoading
      />
      {/* ************************************************ */}
    </div>
  );
};
