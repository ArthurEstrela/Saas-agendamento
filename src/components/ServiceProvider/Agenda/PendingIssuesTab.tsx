import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PendingIssueCard } from "./PendingIssueCard";

// UI
import { Card, CardContent } from "../../ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface PendingIssuesTabProps {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
  emptyStateMessage?: string;
}

export const PendingIssuesTab = ({
  appointments,
  onAppointmentSelect,
  emptyStateMessage = "Nenhum agendamento pendente de conclusão.",
}: PendingIssuesTabProps) => {
  if (appointments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 min-h-[40vh]">
        <Card className="bg-gray-900/30 border-dashed border-gray-800 w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/20">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-1">
              Tudo certo por aqui!
            </h3>
            <p className="text-sm text-gray-500 px-4">{emptyStateMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ordena por mais antigo primeiro (prioridade de resolução)
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  return (
    <div className="space-y-6 pb-20">
      {" "}
      {/* pb-20 garante espaço para scroll final */}
      {/* Banner de Aviso */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 text-yellow-500"
      >
        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm">Atenção Necessária</h3>
          <p className="text-xs sm:text-sm text-yellow-500/80 leading-relaxed mt-1">
            Estes agendamentos já passaram do horário de término e precisam ser
            <strong className="text-yellow-400"> finalizados</strong> (para
            contabilizar no financeiro) ou
            <strong className="text-yellow-400"> cancelados</strong>.
          </p>
        </div>
      </motion.div>
      {/* Lista de Cards */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedAppointments.map((appt) => (
            <PendingIssueCard
              key={appt.id}
              appointment={appt}
              onAppointmentSelect={onAppointmentSelect}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
