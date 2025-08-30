import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getServiceProviderAppointments, updateAppointmentStatus } from '../../firebase/bookingService';
import type { Appointment } from '../../types';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Bell, Check, X, Calendar, Clock, User, Tag, DollarSign, History, Inbox } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AppointmentDetailsModal from './AppointmentDetailsModal'; // Certifique-se que este modal existe

// --- CARD DE SOLICITAÇÃO PENDENTE (O mais importante) ---
const PendingAppointmentCard = ({ appointment, onUpdate }) => {
    const [isLoading, setIsLoading] = useState<'confirmed' | 'cancelled' | null>(null);

    const handleUpdate = async (status: 'confirmed' | 'cancelled') => {
        setIsLoading(status);
        await onUpdate({ appointmentId: appointment.id, status });
        // O isLoading é resetado pelo re-render do componente pai
    };

    return (
        <div className="bg-amber-900/20 p-4 rounded-xl border-2 border-amber-500/30 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:border-amber-500/80">
            <div className="flex-grow space-y-2 text-center sm:text-left">
                <p className="font-bold text-lg text-white">{appointment.clientName}</p>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 text-sm text-gray-300">
                    <span className="flex items-center gap-1.5"><Tag size={14} />{appointment.serviceName}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} />{format(parseISO(`${appointment.date}T${appointment.startTime}`), "dd/MM/yy")}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} />{appointment.startTime}</span>
                </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
                <button
                    onClick={() => handleUpdate('cancelled')}
                    disabled={!!isLoading}
                    title="Recusar"
                    className="p-3 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center h-12 w-12"
                >
                    {isLoading === 'cancelled' ? <Loader2 className="animate-spin" size={24}/> : <X size={24} />}
                </button>
                <button
                    onClick={() => handleUpdate('confirmed')}
                    disabled={!!isLoading}
                    title="Confirmar"
                    className="p-3 bg-green-600/80 hover:bg-green-600 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center h-12 w-12"
                >
                    {isLoading === 'confirmed' ? <Loader2 className="animate-spin" size={24}/> : <Check size={24} />}
                </button>
            </div>
        </div>
    );
};

// --- CARD DE AGENDAMENTOS FUTUROS E PASSADOS ---
const AppointmentCard = ({ appointment, onClick }) => {
    const date = parseISO(`${appointment.date}T${appointment.startTime}`);
    const isPast = date < new Date() && !isToday(date);
    
    return (
        <div 
            onClick={() => onClick(appointment)}
            className={`bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4 cursor-pointer hover:bg-gray-700/50 transition-colors ${isPast ? 'opacity-60' : ''}`}
        >
            <div className="flex flex-col items-center justify-center w-16 text-center bg-gray-900/50 p-2 rounded-lg">
                <span className="text-xs uppercase text-amber-400 font-bold">{format(date, 'MMM', { locale: ptBR })}</span>
                <span className="text-2xl font-bold text-white">{format(date, 'dd')}</span>
                <span className="text-sm text-gray-400">{appointment.startTime}</span>
            </div>
            <div className="flex-grow">
                <p className="font-bold text-white">{appointment.clientName}</p>
                <p className="text-sm text-gray-300">{appointment.serviceName}</p>
                <p className="text-xs text-gray-500 mt-1">com {appointment.professionalName}</p>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL DA AGENDA ---
const AgendaView = () => {
  const { userProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['providerAppointments', userProfile?.uid],
    queryFn: () => getServiceProviderAppointments(userProfile!.uid),
    enabled: !!userProfile,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string, status: 'confirmed' | 'cancelled' }) => 
        updateAppointmentStatus(appointmentId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providerAppointments', userProfile?.uid] });
      showToast(`Agendamento ${variables.status === 'confirmed' ? 'confirmado' : 'recusado'}!`, 'success');
    },
    onError: (err: Error) => {
        showToast(err.message || 'Não foi possível atualizar o agendamento.', 'error');
    }
  });

  const { pending, upcoming, past } = useMemo(() => {
    if (!appointments) return { pending: [], upcoming: [], past: [] };

    const now = new Date();
    const validAppointments = appointments.filter(a => a && a.date && a.startTime);

    const pending = validAppointments.filter(a => a.status === 'pending' && parseISO(`${a.date}T${a.startTime}`) > now);
    const upcoming = validAppointments.filter(a => a.status === 'confirmed' && parseISO(`${a.date}T${a.startTime}`) > now);
    const past = validAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || parseISO(`${a.date}T${a.startTime}`) <= now);

    pending.sort((a, b) => parseISO(`${a.date}T${a.startTime}`).getTime() - parseISO(`${b.date}T${b.startTime}`).getTime());
    upcoming.sort((a, b) => parseISO(`${a.date}T${a.startTime}`).getTime() - parseISO(`${b.date}T${b.startTime}`).getTime());
    past.sort((a, b) => parseISO(`${b.date}T${b.startTime}`).getTime() - parseISO(`${a.date}T${a.startTime}`).getTime());

    return { pending, upcoming, past };
  }, [appointments]);

  if (isLoading) {
    return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#daa520]" size={48}/></div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-400">Ocorreu um erro ao carregar sua agenda.</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-12">
      {/* Seção de Solicitações Pendentes */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Bell className="text-amber-400"/> Solicitações Pendentes 
            <span className="bg-amber-400 text-black text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full">{pending.length}</span>
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-4">
            {pending.map(app => (
              <PendingAppointmentCard key={app.id} appointment={app} onUpdate={updateStatusMutation.mutateAsync} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <Inbox size={40} className="mx-auto mb-2"/>
            <p>Nenhuma solicitação de agendamento no momento.</p>
          </div>
        )}
      </section>

      {/* Seção de Próximos Agendamentos */}
       <section>
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3"><Calendar/> Próximos Agendamentos ({upcoming.length})</h2>
         {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
             {upcoming.map(app => <AppointmentCard key={app.id} appointment={app} onClick={setSelectedAppointment} />)}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <p>Nenhum agendamento confirmado para o futuro.</p>
          </div>
        )}
      </section>

       {/* Seção de Histórico */}
       <section>
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3"><History/> Histórico ({past.length})</h2>
         {past.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
             {past.map(app => <AppointmentCard key={app.id} appointment={app} onClick={setSelectedAppointment} />)}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <p>Seu histórico de agendamentos aparecerá aqui.</p>
          </div>
        )}
      </section>

      {/* Modal para exibir detalhes */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          professionals={userProfile?.professionals || []}
        />
      )}
    </div>
  );
};

export default AgendaView;