// Em: src/components/ServiceProvider/AgendaView.tsx
import { useState, useEffect, useMemo } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useProviderAppointmentsStore } from '../../store/providerAppointmentsStore';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { isSameDay, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { AppointmentRequestCard } from './AppointmentRequestCard';
import { AppointmentCard } from './AppointmentCard'; // Reutilizaremos o AppointmentCard
import { Loader2, Users, CalendarDays, Inbox } from 'lucide-react';
import type { ServiceProviderProfile } from '../../types';

export const AgendaView = () => {
  const { userProfile } = useProfileStore();
  const { appointments, isLoading, fetchAppointments, selectedProfessionalId, setSelectedProfessionalId, updateStatus } = useProviderAppointmentsStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const provider = userProfile as ServiceProviderProfile;

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);

  const { pending, confirmedOnDate } = useMemo(() => {
    const pending = appointments
      .filter(a => a.status === 'pending')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const filteredByProf = selectedProfessionalId === 'all' 
      ? appointments 
      : appointments.filter(a => a.professionalId === selectedProfessionalId);

    const confirmedOnDate = filteredByProf
      .filter(a => a.status === 'scheduled' && isSameDay(a.startTime, selectedDate))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return { pending, confirmedOnDate };
  }, [appointments, selectedDate, selectedProfessionalId]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 size={48} className="animate-spin text-[#daa520]" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col lg:flex-row gap-8">
      
      {/* Coluna de Solicitações Pendentes */}
      <aside className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><Inbox size={24} className="text-[#daa520]" /> Novas Solicitações</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 h-[75vh] overflow-y-auto">
          <AnimatePresence>
            {pending.length > 0 ? (
              pending.map(appt => (
                <AppointmentRequestCard key={appt.id} appointment={appt} onAccept={updateStatus} onReject={updateStatus} />
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <Inbox size={48} />
                <p className="mt-4 font-semibold">Caixa de entrada limpa!</p>
                <p className="text-sm">Nenhuma nova solicitação no momento.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Agenda Principal */}
      <main className="flex-grow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><CalendarDays size={24} className="text-[#daa520]" /> Agenda</h2>
          {/* Filtro de Profissionais */}
          <div className="mt-4 sm:mt-0">
            <select
              value={selectedProfessionalId}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="bg-gray-900 p-2 rounded-md border border-gray-700 text-white"
            >
              <option value="all">Todos os Profissionais</option>
              {provider?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-gray-800/50 border border-gray-700 rounded-2xl p-4 flex justify-center">
            <DayPicker mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} locale={ptBR} className="text-white"/>
          </div>

          <div className="xl:col-span-2">
            <h3 className="text-xl font-semibold text-white mb-4">
              Agendamentos para <span className="text-[#daa520]">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
            </h3>
            <div className="space-y-4 h-[65vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {confirmedOnDate.length > 0 ? (
                  confirmedOnDate.map(appt => (
                    <AppointmentCard key={appt.id} appointment={appt} />
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <Users size={48} />
                    <p className="mt-4 font-semibold">Nenhum horário confirmado</p>
                    <p className="text-sm">Não há agendamentos para este dia ou profissional.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};