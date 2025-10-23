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

// ****** IMPORTS ADICIONADOS ******
import { useToast } from "../../../hooks/useToast";

// **********************************

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

type AgendaTab = "requests" | "scheduled" | "history";
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

  // ****** LÓGICA DO STORE ATUALIZADA ******
  const {
    appointments,
    isLoading,
    fetchAppointments,
    updateStatus,
    completeAppointment, // Adicionado
  } = useProviderAppointmentsStore();

  const { showToast } = useToast(); // Adicionado
  // ****************************************

  // ****** ESTADO CENTRALIZADO PARA MODAIS (NOVO) ******
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // ****************************************************

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  // ****** HANDLERS DO FLUXO DE MODAIS (NOVO) ******

  // 1. Abre o modal de Detalhes (chamado pelos componentes filhos)
  const handleOpenDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  // 2. Fecha o modal de Detalhes
  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    // Não limpa o selectedAppointment aqui, pois os outros modais podem precisar dele
  };

  // 3. Abre o modal de Conclusão (chamado de dentro do modal de Detalhes)
  const handleOpenCompletion = () => {
    setIsDetailsModalOpen(false); // Fecha detalhes
    setIsCompletionModalOpen(true); // Abre conclusão
  };

  // 4. Abre o modal de Cancelamento (chamado de dentro do modal de Detalhes)
  const handleOpenCancel = () => {
    setIsDetailsModalOpen(false); // Fecha detalhes
    setIsCancelModalOpen(true); // Abre cancelamento
  };

  // 5. Confirma a Conclusão (chamado pelo ServiceCompletionModal)
  const handleConfirmCompletion = async (finalPrice: number) => {
    if (!selectedAppointment) return;
    try {
      await completeAppointment(selectedAppointment.id, finalPrice);
      showToast("Sucesso", "Agendamento concluído com sucesso!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o agendamento.";
      showToast("Erro", errorMessage, "error");
    } finally {
      setIsCompletionModalOpen(false);
      setSelectedAppointment(null); // Limpa aqui, no fim do fluxo
    }
  };

  // 6. Confirma o Cancelamento (chamado pelo CancelAppointmentModal)
  const handleConfirmCancel = async (reason: string) => {
    if (!selectedAppointment) return;
    try {
      await updateStatus(selectedAppointment.id, "cancelled", reason);
      showToast("Sucesso", "Agendamento cancelado com sucesso!", "success");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o agendamento.";
      showToast("Erro", errorMessage, "error");
    } finally {
      setIsCancelModalOpen(false);
      setSelectedAppointment(null); // Limpa aqui, no fim do fluxo
    }
  };
  // *************************************************

  // Lógica de filtragem: (EXISTENTE - INTACTA)
  const filteredAppointments = useMemo(() => {
    // ... (toda a sua lógica de filtro existente)
    const statusMap: Record<AgendaTab, Array<Appointment["status"]>> = {
      requests: ["pending"],
      scheduled: ["scheduled"],
      history: ["completed", "cancelled"],
    };

    let filtered = appointments.filter((appt) =>
      statusMap[activeTab].includes(appt.status)
    );

    if (activeTab === "requests") {
      if (selectedProfessionalId) {
        filtered = filtered.filter(
          (appt) => appt.professionalId === selectedProfessionalId
        );
      }
      return filtered;
    }

    if (selectedProfessionalId) {
      filtered = filtered.filter(
        (appt) => appt.professionalId === selectedProfessionalId
      );
    }

    if (activeTab === "scheduled" && viewMode !== "calendar") {
      filtered = filtered.filter((appt) =>
        isSameDay(appt.startTime, selectedDay)
      );
    }

    return filtered.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }, [appointments, activeTab, selectedProfessionalId, selectedDay, viewMode]);

  // (EXISTENTE - INTACTA)
  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments]
  );

  // (EXISTENTE - INTACTA)
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
          // ****** PROP ADICIONADA ******
          onAppointmentSelect={handleOpenDetails}
        />
      );
    }

    switch (viewMode) {
      case "card":
        return (
          <ScheduledAppointmentsTab
            appointments={filteredAppointments}
            // ****** PROP ADICIONADA ******
            onAppointmentSelect={handleOpenDetails}
          />
        );
      case "list":
        return (
          <AgendaListView
            appointments={filteredAppointments}
            // ****** PROP ADICIONADA ******
            onAppointmentSelect={handleOpenDetails}
          />
        );
      default:
        return (
          <ScheduledAppointmentsTab
            appointments={filteredAppointments}
            // ****** PROP ADICIONADA ******
            onAppointmentSelect={handleOpenDetails}
          />
        );
    }
  };

  return (
    // Container principal (EXISTENTE - INTACTO)
    <div className="min-h-0 flex-1 flex flex-col bg-gray-900/60 rounded-2xl text-white p-4 sm:p-6 border border-gray-800 shadow-2xl shadow-black/50">
      {/* ===== HEADER (EXISTENTE - INTACTO) ===== */}
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
                calendar: <ClockIcon size={18} />,
              }}
            />
          )}
        </div>
      </header>

      {/* ===== ABAS DE NAVEGAÇÃO (EXISTENTE - INTACTO) ===== */}
      <nav className="flex items-center bg-black/50 rounded-xl p-1 space-x-1 mt-4 border border-gray-800 shrink-0">
        {/* ... (Botões de Abas - INTACTOS) ... */}
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

      {/* ===== CONTEÚDO DINÂMICO (EXISTENTE - INTACTO) ===== */}
      <main className="flex-1 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + viewMode + selectedDay.toISOString()}
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
                // Você pode querer adicionar onAppointmentSelect={handleOpenDetails} aqui também
                // se quiser ver detalhes de uma solicitação.
              />
            )}
            {activeTab === "scheduled" && renderScheduledContent()}
            {activeTab === "history" && (
              <HistoryTab
                appointments={filteredAppointments}
                // ****** PROP ADICIONADA ******
                onAppointmentSelect={handleOpenDetails}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ****** MODAIS ADICIONADOS ****** */}
      {/* Renderiza os modais aqui no final, fora da 'main', 
        para garantir que fiquem no topo da stack de layout
      */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          handleCloseDetails();
          setSelectedAppointment(null); // Limpa ao fechar manualmente
        }}
        appointment={selectedAppointment}
        onOpenCompletion={handleOpenCompletion}
        onOpenCancel={handleOpenCancel}
      />

      <ServiceCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirmCompletion}
        appointment={selectedAppointment} // <--- CORRETO
        isLoading={isLoading} // <-- Use o isLoading do store que já temos!
      />

      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedAppointment(null); // Limpa se fechar sem confirmar
        }}
        appointmentId={selectedAppointment?.id || ""}
        onConfirm={handleConfirmCancel}
        userType="serviceProvider"
      />
      {/* ******************************** */}
    </div>
  );
};
