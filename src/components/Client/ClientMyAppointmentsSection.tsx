// src/components/Client/ClientMyAppointmentsSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { Appointment } from '../../types';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, User, Star, RefreshCw, XCircle, Loader, Inbox } from 'lucide-react';

// --- Configuração de Status ---
const statusConfig = {
  pendente: { label: 'Pendente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  confirmado: { label: 'Confirmado', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  concluido: { label: 'Concluído', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  nao_compareceu: { label: 'Não Compareceu', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
};


// --- Componente Principal ---
const ClientMyAppointmentsSection = () => {
  const { userProfile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'appointments'), where('clientId', '==', userProfile.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      fetchedAppointments.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      setAppointments(fetchedAppointments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter(a => !isPast(parseISO(a.date)) || isToday(parseISO(a.date)));
    const past = appointments.filter(a => isPast(parseISO(a.date)) && !isToday(parseISO(a.date)));
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, { status: 'cancelado' });
      } catch (error) {
        console.error("Erro ao cancelar agendamento:", error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Meus Agendamentos</h1>
        <p className="text-gray-400 mt-1">Acompanhe seus horários marcados e seu histórico.</p>
      </div>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('upcoming')} className={`${activeTab === 'upcoming' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Próximos</button>
          <button onClick={() => setActiveTab('past')} className={`${activeTab === 'past' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Histórico</button>
        </nav>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'upcoming' && (
          upcomingAppointments.length > 0
            ? upcomingAppointments.map(app => <AppointmentCard key={app.id} appointment={app} onCancel={handleCancelAppointment} />)
            : <EmptyState message="Você não possui agendamentos futuros." />
        )}
        {activeTab === 'past' && (
          pastAppointments.length > 0
            ? pastAppointments.map(app => <AppointmentCard key={app.id} appointment={app} onCancel={handleCancelAppointment}/>)
            : <EmptyState message="Seu histórico de agendamentos está vazio." />
        )}
      </div>
    </div>
  );
};


// --- Componente Card de Agendamento ---
const AppointmentCard = ({ appointment, onCancel }) => {
  const isUpcoming = !isPast(parseISO(appointment.date)) || isToday(parseISO(appointment.date));
  const statusInfo = statusConfig[appointment.status] || statusConfig.pendente;
  const avatarUrl = appointment.serviceProviderPhotoURL 
    ? appointment.serviceProviderPhotoURL 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.serviceProviderName || 'S')}&background=1f2937&color=f59e0b&bold=true`;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col justify-between p-5 transition-all hover:border-amber-500 hover:shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={avatarUrl}
              alt={`Logo de ${appointment.serviceProviderName}`}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
            />
            <h3 className="text-lg font-bold text-white truncate">{appointment.serviceProviderName}</h3>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        <div className="space-y-2 text-sm text-gray-300 border-t border-gray-700 pt-3">
          <InfoItem icon={Scissors} text={appointment.serviceName} />
          <InfoItem icon={User} text={appointment.professionalName} />
          <InfoItem icon={Calendar} text={format(parseISO(appointment.date), "EEEE, dd 'de' MMMM", { locale: ptBR })} />
          <InfoItem icon={Clock} text={`${appointment.startTime}h`} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 border-t border-gray-700 pt-4">
        {isUpcoming && appointment.status !== 'cancelado' && (
          <ActionButton icon={XCircle} text="Cancelar" onClick={() => onCancel(appointment.id)} variant="danger" />
        )}
        {!isUpcoming && (
          <>
            <ActionButton icon={RefreshCw} text="Reagendar" onClick={() => {}} variant="secondary" />
            <ActionButton icon={Star} text="Avaliar" onClick={() => {}} variant="primary" />
          </>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2 text-gray-400">
    <Icon size={14} className="flex-shrink-0" />
    <span className="truncate">{text}</span>
  </div>
);

const ActionButton = ({ icon: Icon, text, onClick, variant }) => {
  const baseClasses = "w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-lg transition-colors";
  const variants = {
    primary: "bg-amber-500 text-black hover:bg-amber-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600",
    danger: "text-red-400 hover:bg-red-500/10 hover:text-red-300",
  };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <Icon size={16} />
      <span>{text}</span>
    </button>
  );
};

const EmptyState = ({ message }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
    <Inbox size={48} />
    <p className="mt-4 text-lg font-semibold">{message}</p>
  </div>
);

export default ClientMyAppointmentsSection;
