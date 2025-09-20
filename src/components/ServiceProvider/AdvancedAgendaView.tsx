// src/components/ServiceProvider/AdvancedAgendaView.tsx
import { useState, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import { useProviderAppointmentsStore } from "../../store/providerAppointmentsStore";
import type { ServiceProviderProfile } from "../../types";
import { startOfDay, endOfDay, addDays, isWithinInterval } from "date-fns";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProfessionalSelector } from "./ProfessionalSelector";
import { AgendaColumnView } from "./AgendaColumnView";
import { AgendaListView } from "./AgendaListView";

type ViewMode = "column" | "list";

export const AdvancedAgendaView = () => {
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;
  
  const { 
    appointments, 
    selectedProfessionalId, 
    setSelectedProfessionalId,
    dateFilter,
    setDateFilter
  } = useProviderAppointmentsStore();

  const [viewMode, setViewMode] = useState<ViewMode>("column");

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const isInDateRange = isWithinInterval(appointment.startTime, {
        start: dateFilter.startDate,
        end: dateFilter.endDate
      });
      if (!isInDateRange) return false;

      if (selectedProfessionalId !== 'all' && appointment.professionalId !== selectedProfessionalId) {
        return false;
      }
      
      return appointment.status !== 'pending';
    });
  }, [appointments, dateFilter, selectedProfessionalId]);

  const setDateRange = (range: 'today' | 'tomorrow' | '7days') => {
    const today = new Date();
    if (range === 'today') {
      setDateFilter({ startDate: startOfDay(today), endDate: endOfDay(today) });
    } else if (range === 'tomorrow') {
      const tomorrow = addDays(today, 1);
      setDateFilter({ startDate: startOfDay(tomorrow), endDate: endOfDay(tomorrow) });
    } else if (range === '7days') {
      setDateFilter({ startDate: startOfDay(today), endDate: endOfDay(addDays(today, 6)) });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Minha Agenda</h2>
          <SlidersHorizontal size={20} className="text-gray-500" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-gray-900 rounded-lg p-1">
            <button onClick={() => setDateRange('today')} className={`px-3 py-1 text-sm rounded-md ${dateFilter.endDate.getDate() === new Date().getDate() ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-gray-800'}`}>Hoje</button>
            <button onClick={() => setDateRange('tomorrow')} className={`px-3 py-1 text-sm rounded-md ${dateFilter.startDate.getDate() === addDays(new Date(), 1).getDate() ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-gray-800'}`}>Amanhã</button>
            <button onClick={() => setDateRange('7days')} className={`px-3 py-1 text-sm rounded-md ${dateFilter.endDate > addDays(new Date(), 1) ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-gray-800'}`}>7 Dias</button>
          </div>
          
          {provider?.professionals && provider.professionals.length > 1 && (
            <ProfessionalSelector
              professionals={provider.professionals}
              selectedProfessionalId={selectedProfessionalId}
              setSelectedProfessionalId={setSelectedProfessionalId}
            />
          )}

          <div className="flex items-center bg-gray-900 rounded-lg p-1">
            <button onClick={() => setViewMode('column')} className={`p-2 rounded-md ${viewMode === 'column' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}><List size={18} /></button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="flex-grow overflow-auto"
        >
          {viewMode === 'column' ? (
            <AgendaColumnView
              appointments={filteredAppointments}
              provider={provider}
              viewingDate={dateFilter.startDate}
              selectedProfessionalId={selectedProfessionalId}
            />
          ) : (
            <AgendaListView appointments={filteredAppointments} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};