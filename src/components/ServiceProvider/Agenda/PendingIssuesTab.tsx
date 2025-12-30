import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
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
  // Ordena por mais antigo primeiro (prioridade de resolução)
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  if (appointments.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 min-h-[50vh] animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
          <div className="relative h-20 w-20 bg-gray-900 border border-green-900/50 rounded-full flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2 text-center">
          Tudo em dia!
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-[250px]">
          {emptyStateMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-10">
      {/* Banner de Aviso Compacto */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 bg-yellow-950/30 p-3 sm:p-4 rounded-xl border border-yellow-500/20 text-yellow-500 backdrop-blur-md"
      >
        <AlertTriangle
          size={18}
          className="shrink-0 mt-0.5 animate-bounce-slow"
        />
        <div>
          <h3 className="font-bold text-sm text-yellow-400">Ação Necessária</h3>
          <p className="text-xs text-yellow-500/80 leading-relaxed mt-1">
            Estes agendamentos passaram do horário e precisam ser finalizados
            para atualizar seu caixa.
          </p>
        </div>
      </motion.div>

      {/* Lista de Cards */}
      <div className="flex flex-col gap-3">
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
