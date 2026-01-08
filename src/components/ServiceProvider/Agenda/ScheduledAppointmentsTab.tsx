import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { ScheduledAppointmentCard } from "./ScheduledAppointmentCard";
import { CalendarX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Empty State Moderno
  if (scheduledAppointments.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 min-h-[50vh] animate-in fade-in zoom-in duration-500">
        <div className="bg-gray-900 p-6 rounded-full mb-6 border border-gray-800 shadow-xl">
          <CalendarX size={48} className="text-gray-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-200 mb-2">Agenda Livre</h3>
        <p className="text-sm text-gray-500 text-center max-w-[250px] leading-relaxed">
          Nenhum agendamento confirmado para este período. Que tal divulgar seu
          link?
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24 sm:pb-8">
      {" "}
      {/* Padding extra para mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {scheduledAppointments.map((appt, index) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index * 0.05, 0.3),
                type: "spring",
                stiffness: 300,
                damping: 25,
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
