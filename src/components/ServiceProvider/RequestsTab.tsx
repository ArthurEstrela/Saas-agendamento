import type { EnrichedProviderAppointment } from "../../store/providerAppointmentsStore";
import type { Appointment } from "../../types";
import { AppointmentRequestCard } from "./AppointmentRequestCard";
import { Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI
import { Card, CardContent } from "../ui/card";

interface RequestsTabProps {
  appointments: EnrichedProviderAppointment[];
  onUpdateStatus: (id: string, status: "scheduled" | "cancelled") => void;
  onAppointmentSelect: (appointment: Appointment) => void;
}

export const RequestsTab = ({
  appointments,
  onUpdateStatus,
  onAppointmentSelect,
}: RequestsTabProps) => {
  const sortedAppointments = appointments
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (sortedAppointments.length === 0) {
    return (
      <Card className="bg-gray-900/30 border-dashed border-gray-800 mt-8">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
          <Inbox size={48} className="mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-300 mb-1">
            Tudo limpo por aqui!
          </h3>
          <p className="text-sm">Você não tem novas solicitações pendentes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        Novas Solicitações
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({sortedAppointments.length})
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        <AnimatePresence mode="popLayout">
          {sortedAppointments.map((appt) => (
            <motion.div
              key={appt.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => onAppointmentSelect(appt)}
              className="cursor-pointer"
            >
              <AppointmentRequestCard
                appointment={appt}
                onAccept={(id, status) => onUpdateStatus(id, status)}
                onReject={(id, status) => onUpdateStatus(id, status)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
