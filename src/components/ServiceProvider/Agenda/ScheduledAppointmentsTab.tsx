import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { ScheduledAppointmentCard } from "./ScheduledAppointmentCard";
import { CalendarX, SearchX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI
import { Card, CardContent } from "../../ui/card";

interface ScheduledAppointmentsTabProps {
  appointments: EnrichedProviderAppointment[];
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const ScheduledAppointmentsTab = ({
  appointments,
  onAppointmentSelect,
}: ScheduledAppointmentsTabProps) => {
  // Filtra e Ordena
  const scheduledAppointments = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Empty State
  if (scheduledAppointments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 min-h-[40vh]">
        <Card className="bg-gray-900/30 border-dashed border-gray-800 w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <div className="bg-gray-800/50 p-4 rounded-full mb-4">
              <CalendarX size={40} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-1">
              Agenda Livre
            </h3>
            <p className="text-sm px-8 leading-relaxed">
              Nenhum agendamento confirmado para o filtro selecionado neste
              período.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grid Layout Responsivo: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
  return (
    <div className="pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {scheduledAppointments.map((appt, index) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.2,
                delay: Math.min(index * 0.05, 0.3), // Limita o delay máximo para não ficar lento
              }}
            >
              <ScheduledAppointmentCard
                appointment={appt}
                onAppointmentSelect={onAppointmentSelect}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
