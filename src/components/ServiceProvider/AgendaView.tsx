// src/components/ServiceProvider/AgendaView.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  List, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Loader,
  CalendarDays,
  Inbox
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  subMonths,
  addMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import type { Appointment, Professional } from '../../types';
import { db } from '../../firebase/config';

import AppointmentDetailsModal from './AppointmentDetailsModal';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// --- Tipos e Constantes ---
type ViewMode = 'semanal' | 'diaria' | 'mensal' | 'lista';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400', ring: 'ring-yellow-500/30' },
  confirmado: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400', ring: 'ring-green-500/30' },
  concluido: { label: 'Concluído', color: 'bg-blue-500/20 text-blue-400', ring: 'ring-blue-500/30' },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400', ring: 'ring-red-500/30' },
  nao_compareceu: { label: 'Não Compareceu', color: 'bg-gray-500/20 text-gray-400', ring: 'ring-gray-500/30' },
};

// --- Componente Principal da Agenda ---
const AgendaView = () => {
  const { userProfile } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('semanal');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // --- Busca de Dados em Tempo Real ---
  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'appointments'), where('serviceProviderId', '==', userProfile.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAppointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      setAppointments(fetchedAppointments);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar agendamentos: ", error);
      setLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [userProfile]);

  const professionals = useMemo(() => userProfile?.professionals || [], [userProfile]);

  // --- Funções de Navegação de Data ---
  const handleNext = () => {
    if (viewMode === 'semanal') setCurrentDate(addDays(currentDate, 7));
    else if (viewMode === 'mensal') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handlePrev = () => {
    if (viewMode === 'semanal') setCurrentDate(addDays(currentDate, -7));
    else if (viewMode === 'mensal') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };
  
  const handleAppointmentClick = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
  }, []);

  // --- Renderização do Cabeçalho ---
  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-800 rounded-lg p-1">
          <button onClick={handlePrev} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-white w-48 text-center capitalize">{format(currentDate, viewMode === 'mensal' ? "MMMM 'de' yyyy" : "d 'de' MMMM", { locale: ptBR })}</h2>
          <button onClick={handleNext} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><ChevronRight size={20} /></button>
        </div>
        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-semibold bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Hoje</button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-800 rounded-lg p-1">
          {(['semanal', 'diaria', 'mensal', 'lista'] as ViewMode[]).map(mode => {
            const icons = { semanal: LayoutGrid, diaria: Calendar, mensal: CalendarDays, lista: List };
            const Icon = icons[mode];
            return (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)} 
                className={`p-2 rounded-md transition-colors ${viewMode === mode ? 'bg-amber-500 text-black' : 'hover:bg-gray-700'}`}
                aria-label={`Visão ${mode}`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
        <button className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 font-semibold transition-colors">
          <Plus size={20} /> Agendamento
        </button>
      </div>
    </div>
  );

  // --- Renderização do Conteúdo Principal ---
  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
    }
    switch (viewMode) {
      case 'semanal': return renderSemanalView();
      case 'diaria': return renderDiariaView();
      case 'mensal': return renderMensalView();
      case 'lista': return renderListaView();
      default: return null;
    }
  };
  
  // --- Renderização das Visualizações Específicas ---
  const renderSemanalView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

    return (
      <div className="grid grid-cols-1 md:grid-cols-8 border-t border-l border-gray-700">
        <div className="hidden md:block p-2 border-b border-r border-gray-700 font-bold">Profissional</div>
        {days.map(day => (
          <div key={day.toString()} className={`text-center font-bold p-2 border-b border-r border-gray-700 ${isToday(day) ? 'text-amber-400' : ''}`}>
            {format(day, 'EEE', { locale: ptBR })} <span className="block text-sm">{format(day, 'dd/MM')}</span>
          </div>
        ))}
        {professionals.map(prof => (
          <React.Fragment key={prof.id}>
            <div className="p-2 border-b border-r border-gray-700 font-semibold">{prof.name}</div>
            {days.map(day => {
              const dayAppointments = appointments.filter(a => a.professionalId === prof.id && isSameDay(parseISO(a.date), day));
              return (
                <div key={day.toString()} className="p-2 border-b border-r border-gray-700 min-h-[120px] space-y-2">
                  {dayAppointments.map(a => <AppointmentCard key={a.id} appointment={a} onClick={handleAppointmentClick} />)}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  const renderDiariaView = () => {
    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.date), currentDate));
    return (
      <div className="space-y-4">
        {professionals.map(prof => {
          const profAppointments = dayAppointments.filter(a => a.professionalId === prof.id).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if(profAppointments.length === 0) return null;
          return (
            <div key={prof.id}>
              <h3 className="text-xl font-bold mb-2">{prof.name}</h3>
              <div className="space-y-2">
                {profAppointments.map(a => <AppointmentCard key={a.id} appointment={a} onClick={handleAppointmentClick} />)}
              </div>
            </div>
          )
        })}
        {dayAppointments.length === 0 && <EmptyState />}
      </div>
    );
  };

  const renderMensalView = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 border-t border-l border-gray-700">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center font-bold p-2 border-b border-r border-gray-700">{day}</div>
        ))}
        {days.map(day => {
          const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.date), day));
          return (
            <div key={day.toString()} className={`p-2 border-b border-r border-gray-700 min-h-[120px] ${!isSameMonth(day, currentDate) ? 'bg-gray-800/50' : ''}`}>
              <span className={`font-semibold ${isToday(day) ? 'text-amber-400' : ''}`}>{format(day, 'd')}</span>
              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 2).map(a => (
                  <div key={a.id} onClick={() => handleAppointmentClick(a)} className="text-xs p-1 rounded-md bg-gray-700 truncate cursor-pointer hover:bg-gray-600">{a.clientName}</div>
                ))}
                {dayAppointments.length > 2 && <div className="text-xs text-gray-400">+ {dayAppointments.length - 2} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Funções auxiliares para renderMensalView
  const isSameMonth = (day, date) => format(day, 'MM') === format(date, 'MM');
  const endOfWeek = (date, options) => addDays(startOfWeek(date, options), 6);

  const renderListaView = () => {
    const upcomingAppointments = appointments
      .filter(a => parseISO(a.date) >= new Date())
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime() || a.startTime.localeCompare(b.startTime));
    
    if (upcomingAppointments.length === 0) return <EmptyState message="Nenhum agendamento futuro encontrado." />;
    
    return (
      <div className="space-y-4">
        {upcomingAppointments.map(a => <AppointmentCard key={a.id} appointment={a} onClick={handleAppointmentClick} />)}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg">
      {renderHeader()}
      {renderContent()}
      {selectedAppointment && (
        <AppointmentDetailsModal 
          appointment={selectedAppointment} 
          onClose={() => setSelectedAppointment(null)}
          professionals={professionals}
        />
      )}
    </div>
  );
};

// --- Componentes Auxiliares ---
const AppointmentCard = ({ appointment, onClick }: { appointment: Appointment, onClick: (app: Appointment) => void }) => {
  const status = statusConfig[appointment.status] || statusConfig.pendente;
  return (
    <div
      onClick={() => onClick(appointment)}
      className={`p-3 rounded-lg bg-gray-800 ring-1 ring-inset ${status.ring} cursor-pointer hover:bg-gray-700/70 transition-colors shadow-md`}
    >
      <div className="flex justify-between items-start">
        <p className="font-bold text-sm text-white">{appointment.clientName}</p>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.color}`}>{status.label}</span>
      </div>
      <div className="mt-2 text-xs text-gray-400 space-y-1">
        <div className="flex items-center gap-2"><Scissors size={12} /><span>{appointment.serviceName}</span></div>
        <div className="flex items-center gap-2"><Clock size={12} /><span>{appointment.startTime}</span></div>
      </div>
    </div>
  );
};

const EmptyState = ({ message = "Nenhum agendamento para este dia." }) => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-500">
    <Inbox size={48} />
    <p className="mt-4 text-lg font-semibold">{message}</p>
  </div>
);

export default AgendaView;
