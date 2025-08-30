import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getServiceProviderAppointments, updateAppointmentStatus } from '../../firebase/bookingService';
import type { Appointment } from '../../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Bell, Check, X, Calendar, Clock, User, Tag, DollarSign, History, Inbox, SlidersHorizontal, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AppointmentDetailsModal from './AppointmentDetailsModal';

// --- CARD DE SOLICITAÇÃO PENDENTE ---
const PendingAppointmentCard = ({ appointment, onUpdate }) => {
    const [isLoading, setIsLoading] = useState<'confirmed' | 'cancelled' | null>(null);

    const handleUpdate = async (status: 'confirmed' | 'cancelled') => {
        setIsLoading(status);
        await onUpdate({ appointmentId: appointment.id, status });
    };

    return (
        <div className="bg-amber-900/20 p-4 rounded-xl border-2 border-amber-500/30 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:border-amber-500/80">
            <div className="flex-grow flex items-center gap-4">
                <img src={appointment.clientPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=1f2937&color=daa520`} alt={appointment.clientName} className="h-12 w-12 rounded-full object-cover" />
                <div className="space-y-1 text-center sm:text-left">
                    <p className="font-bold text-lg text-white">{appointment.clientName}</p>
                    <p className="text-sm text-gray-300">{appointment.serviceName}</p>
                    <p className="text-sm text-gray-400">{format(parseISO(`${appointment.date}T${appointment.startTime}`), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => handleUpdate('cancelled')} disabled={!!isLoading} title="Recusar" className="p-3 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 h-12 w-12 flex items-center justify-center">
                    {isLoading === 'cancelled' ? <Loader2 className="animate-spin" size={24}/> : <X size={24} />}
                </button>
                <button onClick={() => handleUpdate('confirmed')} disabled={!!isLoading} title="Confirmar" className="p-3 bg-green-600/80 hover:bg-green-600 rounded-lg text-white transition-colors disabled:opacity-50 h-12 w-12 flex items-center justify-center">
                    {isLoading === 'confirmed' ? <Loader2 className="animate-spin" size={24}/> : <Check size={24} />}
                </button>
            </div>
        </div>
    );
};

// --- CARD DE AGENDAMENTOS (PRÓXIMOS E HISTÓRICO) ---
const AppointmentCard = ({ appointment, onClick }) => {
    const date = parseISO(`${appointment.date}T${appointment.startTime}`);
    return (
        <div onClick={() => onClick(appointment)} className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-3 cursor-pointer hover:border-[#daa520]/50 transition-all group">
            <div className="flex items-center gap-4">
                <img src={appointment.clientPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=1f2937&color=daa520`} alt={appointment.clientName} className="h-16 w-16 rounded-full object-cover border-2 border-gray-700 group-hover:border-[#daa520]/80" />
                <div>
                    <p className="font-bold text-lg text-white">{appointment.clientName}</p>
                    <p className="text-sm text-gray-400">com {appointment.professionalName}</p>
                </div>
            </div>
            <div className="border-t border-gray-700 pt-3 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-300"><Tag size={16} className="text-[#daa520]" />{appointment.serviceName}</p>
                <p className="flex items-center gap-2 text-gray-300"><Calendar size={16} className="text-[#daa520]" />{format(date, "eeee, dd 'de' MMMM", { locale: ptBR })}</p>
                <p className="flex items-center gap-2 text-gray-300"><Clock size={16} className="text-[#daa520]" />{appointment.startTime} - {appointment.endTime}</p>
                <p className="flex items-center gap-2 font-bold text-white"><DollarSign size={16} className="text-[#daa520]" />R$ {appointment.price.toFixed(2)}</p>
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
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'history'>('pending');
  
  // Lógica do Filtro com localStorage
  const getInitialFilter = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`agenda-filter-${userProfile?.uid}`) || 'all';
    }
    return 'all';
  };
  const [professionalFilter, setProfessionalFilter] = useState<string>(getInitialFilter());

  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile?.uid) {
      localStorage.setItem(`agenda-filter-${userProfile.uid}`, professionalFilter);
    }
  }, [professionalFilter, userProfile?.uid]);


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

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];
    if (professionalFilter === 'all') return appointments;
    return appointments.filter(app => app.professionalId === professionalFilter || (app.professionalId === 'any' && professionalFilter === 'any'));
  }, [appointments, professionalFilter]);

  const { pending, upcoming, history } = useMemo(() => {
    const now = new Date();
    const validAppointments = filteredAppointments.filter(a => a && a.date && a.startTime);

    const pending = validAppointments.filter(a => a.status === 'pending' && parseISO(`${a.date}T${a.startTime}`) > now);
    const upcoming = validAppointments.filter(a => a.status === 'confirmed' && parseISO(`${a.date}T${a.startTime}`) > now);
    const history = validAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || parseISO(`${a.date}T${a.startTime}`) <= now);

    pending.sort((a, b) => parseISO(`${a.date}T${a.startTime}`).getTime() - parseISO(`${b.date}T${b.startTime}`).getTime());
    upcoming.sort((a, b) => parseISO(`${a.date}T${a.startTime}`).getTime() - parseISO(`${b.date}T${b.startTime}`).getTime());
    history.sort((a, b) => parseISO(`${b.date}T${b.startTime}`).getTime() - parseISO(`${a.date}T${a.startTime}`).getTime());

    return { pending, upcoming, history };
  }, [filteredAppointments]);
  
  const TABS = {
    pending: { label: 'Solicitações', data: pending, icon: Bell },
    upcoming: { label: 'Próximos', data: upcoming, icon: Calendar },
    history: { label: 'Histórico', data: history, icon: History },
  };
  
  const ActiveContent = () => {
      const currentTab = TABS[activeTab];
      if (currentTab.data.length === 0) {
          return (
              <div className="text-center text-gray-500 py-20 bg-black/20 rounded-lg border border-dashed border-gray-700">
                  <Inbox size={48} className="mx-auto mb-4"/>
                  <p className="font-semibold">Nenhum agendamento encontrado</p>
                  <p className="text-sm">Não há nada para mostrar nesta aba no momento.</p>
              </div>
          );
      }

      if (activeTab === 'pending') {
          return (
              <div className="space-y-4">
                  {currentTab.data.map(app => (
                      <PendingAppointmentCard key={app.id} appointment={app} onUpdate={updateStatusMutation.mutateAsync} />
                  ))}
              </div>
          );
      }

      return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {currentTab.data.map(app => (
                  <AppointmentCard key={app.id} appointment={app} onClick={setSelectedAppointment} />
              ))}
          </div>
      );
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#daa520]" size={48}/></div>;
  if (error) return <div className="p-10 text-center text-red-400">Ocorreu um erro ao carregar sua agenda.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Cabeçalho com Título e Filtros */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-bold text-white">Agenda</h1>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2">
            <Users size={18} className="text-gray-400 ml-2" />
            <select
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none appearance-none pr-8"
            >
              <option value="all" className="bg-gray-800">Todos os Profissionais</option>
              {userProfile?.professionals?.map(prof => (
                  <option key={prof.id} value={prof.id} className="bg-gray-800">{prof.name}</option>
              ))}
            </select>
        </div>
      </header>
      
      {/* Navegação por Abas */}
      <nav className="flex items-center gap-2 p-1.5 bg-gray-800 rounded-xl">
        {Object.entries(TABS).map(([key, { label, data, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              activeTab === key
                ? 'bg-[#daa520] text-black'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === key ? 'bg-black/20 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {data.length}
            </span>
          </button>
        ))}
      </nav>

      {/* Conteúdo Principal */}
      <main>
        <ActiveContent />
      </main>

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