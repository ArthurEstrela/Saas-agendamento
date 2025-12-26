import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PendingIssueCard } from "./PendingIssueCard";

// UI
import { Card, CardContent } from "../../ui/card";

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
      <Card className="bg-gray-900/30 border-dashed border-gray-800 mt-8">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-1">
            Tudo certo por aqui!
          </h3>
          <p className="text-sm text-gray-500">{emptyStateMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Ordena por mais antigo primeiro (prioridade de resolução)
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 text-yellow-500 mb-6">
        <AlertTriangle size={24} />
        <div>
          <h3 className="font-bold text-sm">Atenção Necessária</h3>
          <p className="text-xs text-yellow-500/80">
            Estes agendamentos já passaram do horário e precisam ser finalizados
            ou cancelados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedAppointments.map((appt) => (
          <PendingIssueCard
            key={appt.id}
            appointment={appt}
            onAppointmentSelect={onAppointmentSelect}
          />
        ))}
      </div>
    </div>
  );
};
