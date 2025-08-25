// src/components/Client/ClientMyAppointmentsSection.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Appointment, UserProfile, Professional, Service } from '../../types';
import ClientAppointmentCard from './ClientAppointmentCard';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';


interface ClientMyAppointmentsSectionProps {
  handleCancelAppointment: (appointmentId: string) => void;
  handleOpenReviewModal: (appointment: Appointment) => void;
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile') => void;
}

const ClientMyAppointmentsSection: React.FC<ClientMyAppointmentsSectionProps> = ({
  handleCancelAppointment,
  handleOpenReviewModal,
  setActiveView,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentSubTab, setAppointmentSubTab] = useState<'upcoming' | 'history'>('upcoming');

  useEffect(() => {
    if (!currentUser?.uid) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);
    const q = query(collection(db, 'appointments'), where('clientId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
          if (!appt.serviceProviderId) return appt;

          const providerDocRef = doc(db, "users", appt.serviceProviderId);
          const providerSnap = await getDoc(providerDocRef);
          const providerProfile = providerSnap.exists() ? providerSnap.data() as UserProfile : null;

          const professional = providerProfile?.professionals?.find((p): p is Professional => p.id === appt.professionalId);
          
          const serviceNames = (appt.serviceIds || []).map(serviceId => 
            professional?.services.find((s): s is Service => s.id === serviceId)?.name || ''
          ).filter(Boolean).join(', ');

          return {
            ...appt,
            establishmentName: providerProfile?.companyName,
            professionalName: professional?.name,
            serviceName: serviceNames || appt.serviceName,
          };
        }));

        appointmentsWithDetails.sort((a, b) => {
          // Usando `startTime` e com fallback `|| '00:00'` para não quebrar
          const appDateTimeA = new Date(`${a.date}T${a.startTime || '00:00'}`);
          const appDateTimeB = new Date(`${b.date}T${b.startTime || '00:00'}`);
          return appDateTimeB.getTime() - appDateTimeA.getTime(); // Mais recente primeiro
        });
        
        setAppointments(appointmentsWithDetails);

      } catch (error) {
        console.error("Erro ao processar detalhes dos agendamentos:", error);
        showToast("Erro ao buscar detalhes dos agendamentos.", 'error');
      } finally {
        setLoadingAppointments(false);
      }
    }, (error) => {
      console.error("Erro ao carregar agendamentos:", error);
      showToast("Erro ao carregar agendamentos.", 'error');
      setLoadingAppointments(false);
    });

    return () => unsubscribe();
  }, [currentUser, showToast]);

  // --- CORREÇÃO PRINCIPAL: LÓGICA DE FILTRAGEM ---
  // Movemos o filtro para ser calculado diretamente antes de renderizar.
  // Isso evita o erro de "Cannot access before initialization".
  const now = new Date();
  const upcomingAppointments = appointments.filter(app => {
    const appDateTime = new Date(`${app.date}T${app.startTime || '00:00'}`);
    // O status correto é 'scheduled', como estamos salvando no Booking.tsx
    return appDateTime >= now && app.status === 'scheduled';
  });

  const historyAppointments = appointments.filter(app => {
    const appDateTime = new Date(`${app.date}T${app.startTime || '00:00'}`);
    return appDateTime < now || app.status === 'completed' || app.status === 'cancelled';
  });

  const renderContent = () => {
    if (loadingAppointments) {
      return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-[#daa520]" />
            <p className="ml-3 text-gray-400">A carregar...</p>
        </div>
      );
    }

    if (appointmentSubTab === 'upcoming') {
      return upcomingAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
          {upcomingAppointments.map(app => (
            <ClientAppointmentCard
              key={app.id}
              app={app}
              handleOpenReviewModal={handleOpenReviewModal}
              handleCancelAppointment={handleCancelAppointment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10">
          <p className="mb-4">Nenhum agendamento futuro.</p>
          <button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Procurar Profissionais</button>
        </div>
      );
    }

    // else (history)
    return historyAppointments.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
        {historyAppointments.map(app => (
          <ClientAppointmentCard
            key={app.id}
            app={app}
            handleOpenReviewModal={handleOpenReviewModal}
            handleCancelAppointment={handleCancelAppointment}
          />
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-400 py-10">O seu histórico de agendamentos está vazio.</p>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Meus Agendamentos</h2>
      <div className="mb-6 flex space-x-2 border-b border-gray-800">
        <button onClick={() => setAppointmentSubTab('upcoming')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'upcoming' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Próximos</button>
        <button onClick={() => setAppointmentSubTab('history')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'history' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Histórico</button>
      </div>
      {renderContent()}
    </div>
  );
};

export default ClientMyAppointmentsSection;