import { useState, useEffect, useMemo } from 'react';
import { useProviderAppointmentsStore } from '../../store/providerAppointmentsStore';
import { AppointmentCard } from './AppointmentCard';
import { Loader2, CalendarX, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AgendaView = () => {
  const { appointments, isLoading, fetchAppointments, updateAppointmentStatus } = useProviderAppointmentsStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Busca os agendamentos quando o componente monta
    fetchAppointments();
  }, [fetchAppointments]);

  // Filtra e ordena os agendamentos para a data selecionada
  const dailyAppointments = useMemo(() => {
    return appointments
      .filter(app => isSameDay(new Date(app.startTime), selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointments, selectedDate]);

  const handleUpdateStatus = (id: string, status: 'scheduled' | 'cancelled') => {
    updateAppointmentStatus(id, status);
    // Aqui você pode adicionar uma notificação de sucesso (toast)
  };
  
  const handleDateChange = (days: number) => {
    setSelectedDate(current => days > 0 ? addDays(current, days) : subDays(current, -days));
  };

  return (
    <div>
      {/* Cabeçalho e Controle de Data */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">Minha Agenda</h1>
          <p className="text-lg text-gray-400 mt-2">Visualize e gerencie seus compromissos.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
          <button onClick={() => handleDateChange(-1)} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ChevronLeft /></button>
          <button onClick={() => setSelectedDate(new Date())} className="px-6 py-2 rounded-md hover:bg-gray-700 transition-colors text-center">
            <span className="font-bold text-lg capitalize">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
          </button>
          <button onClick={() => handleDateChange(1)} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ChevronRight /></button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-amber-500" size={48} />
          </div>
        ) : dailyAppointments.length > 0 ? (
          dailyAppointments.map(app => (
            <AppointmentCard key={app.id} appointment={app} onUpdateStatus={handleUpdateStatus} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
            <CalendarX size={48} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">Nenhum agendamento para este dia</h3>
            <p>Aproveite o dia ou divulgue seus horários!</p>
          </div>
        )}
      </div>
    </div>
  );
};