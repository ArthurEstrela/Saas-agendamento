// src/components/Client/ClientMyAppointmentsSection.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import type { Appointment, UserProfile, Professional, Service } from '../../types';
import ClientAppointmentCard from './ClientAppointmentCard';
import { Loader2 } from 'lucide-react';

interface ClientMyAppointmentsSectionProps {
  handleCancelAppointment: (appointmentId: string) => void;
  handleOpenReviewModal: (appointment: Appointment) => void;
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking' | 'notifications') => void;
}

const ClientMyAppointmentsSection: React.FC<ClientMyAppointmentsSectionProps> = ({
  handleCancelAppointment,
  handleOpenReviewModal,
  setActiveView,
}) => {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentSubTab, setAppointmentSubTab] = useState<'upcoming' | 'history'>('upcoming');

  useEffect(() => {
    if (!user?.uid) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    setLoadingAppointments(true);
    const q = query(collection(db, 'appointments'), where('clientId', '==', user.uid));

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
            // CORREÇÃO: Usamos o nome do estabelecimento do perfil do prestador, mais confiável.
            establishmentName: providerProfile?.companyName || appt.establishmentName || 'Estabelecimento Não Encontrado',
            professionalName: professional?.name || appt.professionalName || 'Profissional Não Encontrado',
            serviceName: serviceNames || appt.serviceName || 'Serviço Não Encontrado',
            // NOVO: Adicionamos o photoURL do prestador para exibição no card
            providerPhotoURL: providerProfile?.photoURL || null,
          };
        }));

        appointmentsWithDetails.sort((a, b) => {
          const appDateTimeA = new Date(`${a.date}T${a.startTime || '00:00'}`);
          const appDateTimeB = new Date(`${b.date}T${b.startTime || '00:00'}`);
          return appDateTimeB.getTime() - appDateTimeA.getTime();
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
  }, [user, showToast]);

  const now = new Date();
  const upcomingAppointments = appointments.filter(app => {
    const appDateTime = new Date(`${app.date}T${app.startTime || '00:00'}`);
    return appDateTime >= now && (app.status === 'scheduled' || app.status === 'confirmed');
  });

  const historyAppointments = appointments.filter(app => {
    const appDateTime = new Date(`${app.date}T${app.startTime || '00:00'}`);
    return appDateTime < now || app.status === 'completed' || app.status === 'cancelled' || app.status === 'no-show';
  });

  const renderContent = () => {
    if (loadingAppointments) {
      return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-yellow-500" />
            <p className="ml-3 text-gray-400">A carregar...</p>
        </div>
      );
    }

    if (appointmentSubTab === 'upcoming') {
      return upcomingAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down">
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
          <button onClick={() => setActiveView('search')} className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Procurar Profissionais</button>
        </div>
      );
    }

    return historyAppointments.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-down">
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
      <div className="text-center text-gray-400 py-10">
          <p className="mb-4">O seu histórico de agendamentos está vazio.</p>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Meus Agendamentos</h2>
      <div className="mb-6 flex space-x-4 border-b-2 border-gray-800">
        <button
          onClick={() => setAppointmentSubTab('upcoming')}
          className={`py-2 px-4 font-semibold transition-colors duration-300 ${
            appointmentSubTab === 'upcoming' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setAppointmentSubTab('history')}
          className={`py-2 px-4 font-semibold transition-colors duration-300 ${
            appointmentSubTab === 'history' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          Histórico
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default ClientMyAppointmentsSection;