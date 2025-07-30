import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ServicesManagement from './ServiceProvider/ServicesManagement';
import AvailabilityManagement from './ServiceProvider/AvailabilityManagement';
import ProfileManagement from './ServiceProvider/ProfileManagement';
import type { Appointment } from '../types';

const ServiceProviderDashboard = () => {
  const { userProfile, logout, cancelAppointment, updateAppointmentStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'availability' | 'profile'>('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'appointments'), 
      where('serviceProviderId', '==', userProfile.uid)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        setLoading(true);
        const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

        const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
            const clientDocRef = doc(db, "users", appt.clientId);
            const clientSnap = await getDoc(clientDocRef);
            const clientProfile = clientSnap.data();
            const serviceName = userProfile.services?.find(s => s.id === appt.serviceId)?.name || 'Serviço não encontrado';
            
            return {
                ...appt,
                clientName: clientProfile?.displayName || 'Cliente não encontrado',
                serviceName: serviceName,
            };
        }));
        
        appointmentsWithDetails.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        // Filtra para não mostrar agendamentos já cancelados pelo cliente
        setAppointments(appointmentsWithDetails.filter(app => app.status !== 'cancelled'));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center">
            <img 
              src={userProfile?.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
              alt="Foto do perfil" 
              className="h-14 w-14 rounded-full object-cover mr-4 border-2 border-gray-700"
            />
            <div>
                <h1 className="text-2xl font-bold text-white">{userProfile?.establishmentName}</h1>
                <p className="text-gray-400">Painel do Profissional</p>
            </div>
        </div>
        <button onClick={logout} className="flex items-center space-x-2 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sair</span>
        </button>
      </header>

      <main>
        <div className="mb-8">
          <div className="flex space-x-2 md:space-x-4 border-b border-gray-700">
            <button onClick={() => setActiveTab('calendar')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'calendar' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Agenda</button>
            <button onClick={() => setActiveTab('services')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'services' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Meus Serviços</button>
            <button onClick={() => setActiveTab('availability')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'availability' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Disponibilidade</button>
            <button onClick={() => setActiveTab('profile')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'profile' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Meu Perfil</button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
            {activeTab === 'calendar' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Solicitações e Agenda</h2>
                    {loading ? (
                        <p className="text-center text-gray-400">Carregando agendamentos...</p>
                    ) : appointments.length > 0 ? (
                        <ul className="space-y-4">
                            {appointments.map(app => (
                                <li key={app.id} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center transition-all hover:shadow-lg hover:bg-gray-600">
                                    <div className="flex items-center mb-3 md:mb-0">
                                        <div className="text-center border-r border-gray-600 pr-4 mr-4">
                                            <p className="text-xl font-bold text-white">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}</p>
                                            <p className="text-sm text-gray-400">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-white">{app.time}</p>
                                            <p className="text-gray-300">{app.serviceName}</p>
                                            <p className="text-sm text-gray-400">com {app.clientName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 self-end md:self-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                                            'bg-yellow-500/20 text-yellow-300'
                                        }`}>
                                            {app.status === 'pending' ? 'Pendente' : 'Confirmado'}
                                        </span>
                                        
                                        {app.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-lg transition-colors"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm("Tem certeza que deseja recusar este agendamento? O horário ficará vago novamente.")) {
                                                            cancelAppointment(app.id);
                                                        }
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg transition-colors"
                                                >
                                                    Recusar
                                                </button>
                                            </>
                                        )}

                                        {app.status === 'confirmed' && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm("Tem certeza que deseja cancelar este agendamento confirmado? O horário ficará vago novamente.")) {
                                                        cancelAppointment(app.id);
                                                    }
                                                }}
                                                className="bg-gray-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-400 py-8">Nenhum agendamento encontrado.</p>
                    )}
                </div>
            )}
            {activeTab === 'services' && <ServicesManagement />}
            {activeTab === 'availability' && <AvailabilityManagement />}
            {activeTab === 'profile' && <ProfileManagement />}
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
