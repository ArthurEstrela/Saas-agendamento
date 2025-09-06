import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProviderAppointments } from '../../store/providerAppointmentsStore';
import type { AppAppointment } from '../../store/providerAppointmentsStore';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import {
  format,
  isToday,
  isFuture,
  isPast,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  endOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2,
  CalendarX,
  Bell,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Calendar as CalendarIcon,
  History,
} from 'lucide-react';
import classNames from 'classnames';

// Componente de Card de Agendamento
const AppointmentItemCard = ({ appointment, onClick }: { appointment: AppAppointment; onClick: () => void }) => {
  const isPastAppointment = isPast(appointment.startTime!) && !isToday(appointment.startTime!);
  const isPending = appointment.status === 'pending';

  const cardClasses = classNames(
    'w-full text-left p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-200 shadow-lg',
    {
      'bg-gray-800/80 hover:bg-gray-700/50 cursor-pointer border border-gray-700': !isPastAppointment,
      'bg-gray-800/40 text-gray-500 border border-gray-800': isPastAppointment,
    }
  );

  return (
    <button onClick={onClick} className={cardClasses} disabled={isPastAppointment}>
      <img
        src={
          appointment.clientPhotoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=4a5568&color=ffffff`}
        alt={appointment.clientName}
        className="h-14 w-14 rounded-full object-cover border-2 border-[#daa520]"
      />
      <div className="flex-grow">
        <p className={`font-bold ${isPastAppointment ? 'text-gray-500 line-through' : 'text-white'}`}>{appointment.clientName}</p>
        <p className={`text-sm ${isPastAppointment ? 'text-gray-600' : 'text-gray-400'}`}>{appointment.serviceName}</p>
        {isPending && (
          <span className="mt-1 inline-block text-xs font-medium text-[#daa520] bg-yellow-900/40 px-2 py-1 rounded-full">
            Pendente
          </span>
        )}
      </div>
      <div className="md:text-right mt-2 md:mt-0 flex items-center md:flex-col text-sm">
        <span className="flex items-center gap-1 font-semibold text-white">
          <Clock size={16} className="text-gray-400" />
          {format(appointment.startTime!, 'HH:mm')}
        </span>
        <span className="text-xs text-gray-400 ml-2 md:ml-0">com {appointment.professionalName}</span>
      </div>
    </button>
  );
};

// Componente do Calendário Pop-up
const CustomCalendar = ({ selectedDate, onDateClick, appointments, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const calendarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const firstDayOfMonth = startOfWeek(currentMonth, { locale: ptBR });
  const lastDayOfMonth = endOfWeek(endOfMonth(currentMonth), { locale: ptBR });
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const datesWithAppointments = useMemo(() => {
    return new Set(appointments.map(app => format(app.startTime!, 'yyyy-MM-dd')));
  }, [appointments]);

  const goToPreviousMonth = useCallback(() => setCurrentMonth(subMonths(currentMonth, 1)), [currentMonth]);
  const goToNextMonth = useCallback(() => setCurrentMonth(addMonths(currentMonth, 1)), [currentMonth]);

  const handleDayClick = (day) => {
    onDateClick(day);
    onClose();
  };

  return (
    <div ref={calendarRef} className="absolute z-10 top-12 left-0 w-full bg-gray-800/80 p-6 rounded-xl shadow-xl border border-gray-700 sm:max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h3 className="font-bold text-lg text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button onClick={goToNextMonth} className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-gray-400 text-xs font-semibold uppercase">
        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map((day) => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center mt-2">
        {daysInMonth.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const hasAppointment = datesWithAppointments.has(format(day, 'yyyy-MM-dd'));
          const isCurrentMonth = isSameMonth(day, currentMonth);

          const dayClasses = classNames(
            'p-2 rounded-full font-medium transition-colors cursor-pointer relative',
            {
              'bg-[#daa520] text-black': isSelected,
              'text-gray-400': !isCurrentMonth,
              'text-white hover:bg-gray-700': isCurrentMonth && !isSelected,
              'before:absolute before:content-[""] before:w-1.5 before:h-1.5 before:bg-[#daa520] before:rounded-full before:-bottom-1 before:left-1/2 before:-translate-x-1/2': hasAppointment && !isSelected,
            }
          );

          return (
            <div key={day.toString()} className="py-1">
              <button onClick={() => handleDayClick(day)} className={dayClasses}>
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente Principal
export const AgendaView = () => {
  const { userProfile } = useAuthStore();
  const { allAppointments, loading, error } = useProviderAppointments(userProfile?.uid);
  const [selectedAppointment, setSelectedAppointment] = useState<AppAppointment | null>(null);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'today' | 'upcoming' | 'history' | 'specificDay'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const { pendingAppointments, todayAppointments, upcomingAppointments, historyAppointments, specificDayAppointments } = useMemo(() => {
    const validAppointments = allAppointments.filter((app) => app.startTime instanceof Date);

    const pending = validAppointments
      .filter((app) => app.status === 'pending')
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());

    const today = validAppointments
      .filter((app) => isToday(app.startTime!) && app.status !== 'pending')
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());

    const upcoming = validAppointments
      .filter((app) => isFuture(app.startTime!) && app.status !== 'pending')
      .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());
    
    const history = validAppointments
        .filter((app) => isPast(app.startTime!) && !isToday(app.startTime!) && app.status !== 'pending')
        .sort((a, b) => b.startTime!.getTime() - a.startTime!.getTime());

    const specificDay = validAppointments
        .filter((app) => isSameDay(app.startTime!, selectedDate) && app.status !== 'pending')
        .sort((a, b) => a.startTime!.getTime() - b.startTime!.getTime());

    return { pendingAppointments: pending, todayAppointments: today, upcomingAppointments: upcoming, historyAppointments: history, specificDayAppointments: specificDay };
  }, [allAppointments, selectedDate]);
  
  const renderAppointments = useMemo(() => {
      switch (selectedTab) {
          case 'pending':
              return pendingAppointments;
          case 'today':
              return todayAppointments;
          case 'upcoming':
              return upcomingAppointments;
          case 'history':
              return historyAppointments;
          case 'specificDay':
              return specificDayAppointments;
          default:
              return [];
      }
  }, [selectedTab, pendingAppointments, todayAppointments, upcomingAppointments, historyAppointments, specificDayAppointments]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTab('specificDay');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#daa520]" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-10 bg-red-500/10 rounded-lg">{error}</div>
    );
  }

  const hasAppointments = allAppointments.length > 0;

  return (
    <div className="p-4 sm:p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 animate-fade-in-down">Minha Agenda</h1>
      
      {hasAppointments ? (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex space-x-2 border-b-2 border-gray-700 overflow-x-auto pb-2">
                    <button
                        onClick={() => setSelectedTab('pending')}
                        className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${selectedTab === 'pending' ? 'bg-[#daa520] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Bell size={18} /> Novas ({pendingAppointments.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('today')}
                        className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${selectedTab === 'today' ? 'bg-[#daa520] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ClipboardCheck size={18} /> Hoje ({todayAppointments.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('upcoming')}
                        className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${selectedTab === 'upcoming' ? 'bg-[#daa520] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <CalendarCheck size={18} /> Próximos ({upcomingAppointments.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('history')}
                        className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${selectedTab === 'history' ? 'bg-[#daa520] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        <History size={18} /> Histórico ({historyAppointments.length})
                    </button>
                </div>
                {/* Seletor de Data */}
                <div className="relative z-10">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`w-full md:w-auto px-4 py-2 font-semibold text-sm rounded-md transition-colors flex items-center gap-2 border ${showCalendar ? 'bg-[#daa520] text-black border-[#daa520]' : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                    >
                        <CalendarIcon size={18} />
                        {selectedTab === 'specificDay' ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Selecionar Data'}
                    </button>
                    {showCalendar && (
                        <CustomCalendar
                            selectedDate={selectedDate}
                            onDateClick={handleDateSelect}
                            appointments={allAppointments}
                            onClose={() => setShowCalendar(false)}
                        />
                    )}
                </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="space-y-3 p-2 rounded-xl border border-gray-700 bg-gray-800/80 min-h-[500px]">
                <h3 className="text-xl font-bold text-white mb-4 p-2">
                    {selectedTab === 'pending' && `Novas Solicitações (${pendingAppointments.length})`}
                    {selectedTab === 'today' && `Agendamentos de Hoje (${todayAppointments.length})`}
                    {selectedTab === 'upcoming' && `Próximos Agendamentos (${upcomingAppointments.length})`}
                    {selectedTab === 'history' && `Histórico (${historyAppointments.length})`}
                    {selectedTab === 'specificDay' && `Agendamentos de ${format(selectedDate, 'PPP', { locale: ptBR })}`}
                </h3>
                {renderAppointments.length > 0 ? (
                    <div className="space-y-3">
                        {renderAppointments.map((app) => (
                            <AppointmentItemCard
                                key={app.id}
                                appointment={app}
                                onClick={() => setSelectedAppointment(app)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8 px-4 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                        <p>Nenhum agendamento nesta categoria.</p>
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-24 px-6 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
          <CalendarX size={56} className="mx-auto text-gray-600 mb-4" />
          <h2 className="font-bold text-xl text-white">Sua agenda está vazia</h2>
          <p className="text-sm mt-2">Quando um cliente agendar um serviço, ele aparecerá aqui.</p>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
};

export default AgendaView;