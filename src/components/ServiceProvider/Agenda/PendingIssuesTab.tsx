// src/components/ServiceProvider/Agenda/PendingIssuesTab.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { AlertTriangle } from "lucide-react";
import { PendingIssueCard } from "./PendingIssueCard"; // Importa o novo card

interface PendingIssuesTabProps {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
  emptyStateMessage?: string;
}

export const PendingIssuesTab = ({
  appointments,
  onAppointmentSelect,
  emptyStateMessage = "Nenhum agendamento passado pendente de conclusão.",
}: PendingIssuesTabProps) => {
  
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center text-gray-600 mt-16">
        <AlertTriangle size={48} className="text-yellow-500" />
        <p className="mt-4 font-semibold text-gray-400">
          {emptyStateMessage}
        </p>
        <p className="text-sm">Tudo certo por aqui!</p>
      </div>
    );
  }

  // Ordena por mais antigo primeiro
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className="space-y-4">
      {sortedAppointments.map((appt) => (
        <PendingIssueCard
          key={appt.id}
          appointment={appt}
          onAppointmentSelect={onAppointmentSelect}
        />
      ))}
    </div>
  );
};