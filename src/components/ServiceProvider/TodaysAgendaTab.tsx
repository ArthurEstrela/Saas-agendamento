// src/components/ServiceProvider/TodaysAgendaTab.tsx
import { useState, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
// O tipo EnrichedProviderAppointment pode vir do types.ts ou da store, dependendo de onde você o centralizou
import {
  useProviderAppointmentsStore,
  type EnrichedProviderAppointment,
} from "../../store/providerAppointmentsStore";
import { isSameDay } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { AgendaTimeline } from "./AgendaTimeline";
import { DateSelector } from "./DateSelector";
import { ProfessionalSelector } from "./ProfessionalSelector";
import { AppointmentDetailsModal } from "./AppointmentDetailsModal";
import type { ServiceProviderProfile } from "../../types";

// ================== MELHORIA DE SEGURANÇA ==================
// Adicionamos ` = []` para garantir que appointments seja sempre um array
export const TodaysAgendaTab = ({
  appointments = [],
}: {
  appointments: EnrichedProviderAppointment[];
}) => {
  // ==========================================================
  const { userProfile } = useProfileStore();
  const { selectedProfessionalId, setSelectedProfessionalId, updateStatus } =
    useProviderAppointmentsStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<EnrichedProviderAppointment | null>(null);
  const provider = userProfile as ServiceProviderProfile;

  const appointmentsForDay = useMemo(() => {
    // Agora, mesmo que appointments seja undefined, o valor padrão [] evita o erro
    const filteredByProf =
      selectedProfessionalId === "all"
        ? appointments
        : appointments.filter(
            (a) => a.professionalId === selectedProfessionalId
          );

    return filteredByProf
      .filter(
        (a) => isSameDay(a.startTime, selectedDate) && a.status !== "pending"
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [appointments, selectedDate, selectedProfessionalId]);

  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Visão do Dia</h2>
        <div className="flex items-center gap-4">
          <DateSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          {provider?.professionals && provider.professionals.length > 1 && (
            <ProfessionalSelector
              professionals={provider.professionals}
              selectedProfessionalId={selectedProfessionalId}
              setSelectedProfessionalId={setSelectedProfessionalId}
            />
          )}
        </div>
      </header>

      <div className="pr-2">
        <AgendaTimeline
          appointments={appointmentsForDay}
          onSelectAppointment={setSelectedAppointment}
          onUpdateStatus={updateStatus}
        />
      </div>

      <AnimatePresence>
        {selectedAppointment && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
