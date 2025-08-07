// src/components/Client/ClientMyAppointmentsSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Ajuste o caminho
import { useAuth } from '../../context/AuthContext'; // Ajuste o caminho
import { useToast } from '../../context/ToastContext'; // Ajuste o caminho
import type { Appointment, UserProfile } from '../../types'; // Ajuste o caminho
import ClientAppointmentCard from './ClientAppointmentCard'; // Importa o novo componente
import { Calendar } from 'lucide-react'; // Mantém apenas o Calendar para o botão "Procurar Profissionais"

interface ClientMyAppointmentsSectionProps {
  currentUser: any; // Firebase User
  handleLoginAction: () => void;
  handleCancelAppointment: (appointmentId: string) => void;
  handleOpenReviewModal: (appointment: Appointment) => void;
  LoginPrompt: React.ComponentType<{ message: string; onAction: () => void }>;
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => void; // Adicionado setActiveView
}

const ClientMyAppointmentsSection: React.FC<ClientMyAppointmentsSectionProps> = ({
  currentUser,
  handleLoginAction,
  handleCancelAppointment,
  handleOpenReviewModal,
  LoginPrompt,
  setActiveView, // Recebe setActiveView
}) => {
  const { userProfile } = useAuth(); // Para acessar professionals e services para detalhes do agendamento
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentSubTab, setAppointmentSubTab] = useState<'upcoming' | 'history'>('upcoming');

  // Fetch de agendamentos (apenas para utilizadores logados)
  useEffect(() => {
    if (!currentUser?.uid) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }
    setLoadingAppointments(true);
    const q = query(collection(db, 'appointments'), where('clientId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
        const providerDocRef = doc(db, "users", appt.serviceProviderId);
        const providerSnap = await getDoc(providerDocRef);
        const providerProfile = providerSnap.exists() ? providerSnap.data() as UserProfile : null;

        // Encontrar o profissional e os nomes dos serviços dentro do perfil do provedor
        const professional = providerProfile?.professionals?.find(p => p.id === appt.professionalId);
        const serviceNames = appt.serviceIds?.map(serviceId => professional?.services.find(s => s.id === serviceId)?.name || '').join(', ');

        return {
          ...appt,
          establishmentName: providerProfile?.establishmentName,
          professionalName: professional?.name,
          serviceName: serviceNames,
        };
      }));
      appointmentsWithDetails.sort((a, b) => {
        // Cria a data no fuso horário local para ordenação
        const [yearA, monthA, dayA] = a.date.split('-').map(Number);
        const [hourA, minuteA] = a.time.split(':').map(Number);
        const appDateTimeA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);

        const [yearB, monthB, dayB] = b.date.split('-').map(Number);
        const [hourB, minuteB] = b.time.split(':').map(Number);
        const appDateTimeB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);

        return appDateTimeA.getTime() - appDateTimeB.getTime();
      });
      setAppointments(appointmentsWithDetails);
      setLoadingAppointments(false);
    }, (error) => {
      console.error("Erro ao carregar agendamentos:", error);
      showToast("Erro ao carregar agendamentos.", 'error');
      setLoadingAppointments(false);
    });
    return () => unsubscribe();
  }, [currentUser, showToast]);

  const { upcomingAppointments, historyAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = appointments.filter(app => {
      // Cria a data no fuso horário local
      const [year, month, day] = app.date.split('-').map(Number);
      const [hour, minute] = app.time.split(':').map(Number);
      const appDateTime = new Date(year, month - 1, day, hour, minute); // Mês é 0-indexado

      return appDateTime >= now && (app.status === 'pending' || app.status === 'confirmed');
    });
    const history = appointments.filter(app => {
      // Cria a data no fuso horário local
      const [year, month, day] = app.date.split('-').map(Number);
      const [hour, minute] = app.time.split(':').map(Number);
      const appDateTime = new Date(year, month - 1, day, hour, minute); // Mês é 0-indexado

      return appDateTime < now || app.status === 'completed' || app.status === 'cancelled' || app.status === 'no-show';
    });
    return { upcomingAppointments: upcoming, historyAppointments: history };
  }, [appointments]);

  // Removido o condicional if (!currentUser) aqui, será tratado no ClientDashboard pai

  // Removida a definição local de AppointmentCard
  // O componente ClientAppointmentCard é importado e usado diretamente abaixo

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Os Meus Agendamentos</h2>
      <div className="mb-6 flex space-x-2 border-b border-gray-800">
        <button onClick={() => setAppointmentSubTab('upcoming')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'upcoming' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Próximos</button>
        <button onClick={() => setAppointmentSubTab('history')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'history' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Histórico</button>
      </div>
      {loadingAppointments ? <p className="text-center text-gray-400 py-10">A carregar...</p> : (
        appointmentSubTab === 'upcoming' ? (
          upcomingAppointments.length > 0 ?
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
              {upcomingAppointments.map(app => (
                <ClientAppointmentCard // Usando o componente importado
                  key={app.id}
                  app={app}
                  handleOpenReviewModal={handleOpenReviewModal}
                  handleCancelAppointment={handleCancelAppointment}
                />
              ))}
            </div> :
            <div className="text-center text-gray-400 py-10">
              <p className="mb-4">Nenhum agendamento futuro.</p>
              <button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Procurar Profissionais</button>
            </div>
        ) : (
          historyAppointments.length > 0 ?
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">
              {historyAppointments.map(app => (
                <ClientAppointmentCard // Usando o componente importado
                  key={app.id}
                  app={app}
                  handleOpenReviewModal={handleOpenReviewModal}
                  handleCancelAppointment={handleCancelAppointment}
                />
              ))}
            </div> :
            <p className="text-center text-gray-400 py-10">O seu histórico de agendamentos está vazio.</p>
        )
      )}
    </div>
  );
};

export default ClientMyAppointmentsSection;
