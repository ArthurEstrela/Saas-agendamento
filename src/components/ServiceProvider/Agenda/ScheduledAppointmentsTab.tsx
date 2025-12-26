import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import type { Appointment } from "../../../types";
import { ScheduledAppointmentCard } from "./ScheduledAppointmentCard";
import { CalendarX } from "lucide-react";
import { motion } from "framer-motion";

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
  // Filtra apenas os agendados (garantia extra)
  const scheduledAppointments = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (scheduledAppointments.length === 0) {
    return (
      <Card className="bg-gray-900/30 border-dashed border-gray-800 mt-8">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
          <CalendarX size={48} className="mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-300 mb-1">
            Agenda Livre
          </h3>
          <p className="text-sm">
            Nenhum agendamento confirmado para este período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {scheduledAppointments.map((appt, index) => (
        <motion.div
          key={appt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ScheduledAppointmentCard
            appointment={appt}
            onAppointmentSelect={onAppointmentSelect}
          />
        </motion.div>
      ))}
    </div>
  );
};
