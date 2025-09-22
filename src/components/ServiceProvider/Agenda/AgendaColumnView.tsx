// src/components/ServiceProvider/Agenda/AgendaColumnView.tsx

import type { EnrichedProviderAppointment } from "../../../store/providerAppointmentsStore";
import { useProfileStore } from "../../../store/profileStore";
import { AnimatePresence, motion } from "framer-motion";
import { AppointmentCard } from "./AppointmentCard";
import { Users, User } from "lucide-react";
import type { ServiceProviderProfile } from "../../../types";

interface AgendaColumnViewProps {
  appointments: EnrichedProviderAppointment[];
}

export const AgendaColumnView = ({ appointments }: AgendaColumnViewProps) => {
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;

  // Filtra os profissionais que têm agendamentos no dia
  const professionalsWithAppointments = provider.professionals.filter((prof) =>
    appointments.some((appt) => appt.professionalId === prof.id)
  );

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center text-gray-600 mt-16">
        <Users size={48} />
        <p className="mt-4 font-semibold">Nenhum agendamento para este dia</p>
        <p className="text-sm">
          Os horários de todos os profissionais estão livres.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {professionalsWithAppointments.map((professional) => (
          <motion.div
            key={professional.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col bg-gray-900/50 rounded-xl"
          >
            <header className="flex items-center gap-3 p-4 border-b border-gray-800">
              <User size={18} className="text-amber-500" />
              <h3 className="font-bold text-white text-lg">
                {professional.name}
              </h3>
            </header>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {appointments
                .filter((appt) => appt.professionalId === professional.id)
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} />
                ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
