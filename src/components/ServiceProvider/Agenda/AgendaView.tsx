// src/components/ServiceProvider/Agenda/AgendaView.tsx

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AgendaToolbar } from "./AgendaToolbar";
import { AgendaListView } from "./AgendaListView";
import { AgendaColumnView } from "./AgendaColumnView";
// import { AgendaCalendario } from './AgendaCalendario'; // Futura implementação
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useProviderAppointmentsStore } from "../../../store/providerAppointmentsStore";
import type { ServiceProviderProfile } from "../../../types";
import { useProfileStore } from "../../../store/profileStore";
import { AgendaCalendario } from "./AgendaCalendario";

export type AgendaViewMode = "list" | "column" | "calendar";

export const AgendaView = () => {
  const [viewMode, setViewMode] = useState<AgendaViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { userProfile } = useProfileStore();
  const {
    appointments,
    isLoading,
    fetchAppointments,
    selectedProfessionalId,
    setSelectedProfessionalId,
  } = useProviderAppointmentsStore();

  const provider = userProfile as ServiceProviderProfile;

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const isSameDay = isWithinInterval(appointment.startTime, {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate),
      });
      if (!isSameDay) return false;

      if (
        selectedProfessionalId !== "all" &&
        appointment.professionalId !== selectedProfessionalId
      ) {
        return false;
      }

      return appointment.status === "scheduled";
    });
  }, [appointments, selectedDate, selectedProfessionalId]);

  const renderActiveView = () => {
    switch (viewMode) {
      case "column":
        return <AgendaColumnView appointments={filteredAppointments} />;
      case "list":
        return <AgendaListView appointments={filteredAppointments} />;
      case "calendar":
        return <AgendaCalendario appointments={appointments} />;
      default:
        return <AgendaListView appointments={filteredAppointments} />;
    }
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black rounded-2xl text-white p-4 sm:p-6">
      <AgendaToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedProfessionalId={selectedProfessionalId}
        onProfessionalChange={setSelectedProfessionalId}
        professionals={provider?.professionals || []}
      />
      <main className="flex-1 overflow-y-auto mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              viewMode + selectedDate.toDateString() + selectedProfessionalId
            }
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
