import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ProfessionalsManagement from './ServiceProvider/ProfessionalsManagement';
import AvailabilityManagement from './ServiceProvider/AvailabilityManagement';
import ProfileManagement from './ServiceProvider/ProfileManagement';
import FinancialManagement from './ServiceProvider/FinancialManagement';
import type { Appointment } from '../types';

// Componente de Modal de Confirmação
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-300 mb-8">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                    Voltar
                </button>
                <button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                    Confirmar
                </button>
            </div>
        </div>
    </div>
);

const ServiceProviderDashboard = () => {
  const { userProfile, logout, updateAppointmentStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'professionals' | 'availability' | 'financial'>('calendar');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
  
  // Estados para os filtros da agenda
  const [filterMode, setFilterMode] = useState<'day' | 'range' | 'all'>('day');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [professionalFilter, setProfessionalFilter] = useState('todos');

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
            const professional = userProfile.professionals?.find(p => p.id === appt.professionalId);
            
            let totalPrice = 0;
            const serviceNames = appt.serviceIds?.map(serviceId => {
                const service = professional?.services.find(s => s.id === serviceId);
                if (service) { totalPrice += service.price; return service.name; }
                return 'Serviço Removido';
            }).join(', ') || 'N/A';
            
            return { ...appt, clientName: clientProfile?.displayName || 'Cliente', professionalName: professional?.name || 'N/A', serviceName: serviceNames, totalPrice };
        }));
        
        setAllAppointments(appointmentsWithDetails.filter(app => app.status !== 'cancelled'));
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = allAppointments;

    // Aplica filtro de data com base no modo
    if (filterMode === 'day') {
        filtered = filtered.filter(app => app.date === dateRange.start);
    } else if (filterMode === 'range') {
        const startDate = new Date(dateRange.start + 'T00:00:00');
        const endDate = new Date(dateRange.end + 'T23:59:59');
        filtered = filtered.filter(app => {
            const appDate = new Date(app.date + 'T00:00:00');
            return appDate >= startDate && appDate <= endDate;
        });
    }
    // Se o modo for 'all', não aplica filtro de data

    // Aplica filtro de profissional
    if (professionalFilter !== 'todos') {
        filtered = filtered.filter(app => app.professionalId === professionalFilter);
    }

    // Lógica de Ordenação Priorizada
    const now = new Date();
    const getOrder = (app: Appointment) => {
        const appDate = new Date(`${app.date}T${app.time}`);
        if (app.status === 'pending') return 1; // 1. Pendentes
        if (app.status === 'confirmed' && appDate < now) return 2; // 2. Ações Requeridas (Concluir/Não Compareceu)
        if (app.status === 'confirmed' && appDate >= now) return 3; // 3. Próximos Agendamentos
        if (app.status === 'completed') return 4; // 4. Concluídos
        if (app.status === 'no-show') return 5; // 5. Não Compareceu
        return 6; // Outros
    };

    return filtered.sort((a, b) => {
        const orderA = getOrder(a);
        const orderB = getOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
    });
  }, [allAppointments, filterMode, dateRange, professionalFilter]);
  
  const handleActionConfirmation = (action: () => void, title: string, message: string) => {
    setModalState({ isOpen: true, title, message, onConfirm: () => { action(); setModalState(null); } });
  };

  const handleCompleteAppointment = (app: Appointment) => {
    handleActionConfirmation(() => updateAppointmentStatus(app.id, 'completed', app.totalPrice), 'Confirmar Conclusão', `Tem a certeza de que pretende marcar o serviço de "${app.serviceName}" como concluído?`);
  };

  const handleNoShowAppointment = (app: Appointment) => {
    handleActionConfirmation(() => updateAppointmentStatus(app.id, 'no-show'), 'Confirmar Ausência', `Tem a certeza de que pretende marcar este agendamento como "não compareceu"?`);
  };

  if (isEditingProfile) {
    return <ProfileManagement onBack={() => setIsEditingProfile(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      {modalState?.isOpen && (
          <ConfirmationModal title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={() => setModalState(null)} />
      )}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center">
            <img src={userProfile?.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} alt="Foto do perfil" className="h-14 w-14 rounded-full object-cover mr-4 border-2 border-gray-700" />
            <div>
                <h1 className="text-2xl font-bold text-white">{userProfile?.establishmentName}</h1>
                <p className="text-gray-400">Painel do Prestador de Serviço</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsEditingProfile(true)} className="flex items-center space-x-2 bg-gray-800 hover:bg-yellow-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            <span>Editar Perfil</span>
          </button>
          <button onClick={logout} className="flex items-center space-x-2 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main>
        <div className="mb-8">
          <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('calendar')} className={`py-3 px-4 font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'calendar' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Agenda</button>
            <button onClick={() => setActiveTab('professionals')} className={`py-3 px-4 font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'professionals' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Profissionais</button>
            <button onClick={() => setActiveTab('availability')} className={`py-3 px-4 font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'availability' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Disponibilidade</button>
            <button onClick={() => setActiveTab('financial')} className={`py-3 px-4 font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === 'financial' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Financeiro</button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
            {activeTab === 'calendar' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Agenda e Solicitações</h2>
                    
                    <div className="bg-gray-700 p-4 rounded-lg mb-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => setFilterMode('day')} className={`px-3 py-1 rounded-md text-sm font-semibold ${filterMode === 'day' ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500'}`}>Ver por Dia</button>
                            <button onClick={() => setFilterMode('range')} className={`px-3 py-1 rounded-md text-sm font-semibold ${filterMode === 'range' ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500'}`}>Ver por Período</button>
                            <button onClick={() => setFilterMode('all')} className={`px-3 py-1 rounded-md text-sm font-semibold ${filterMode === 'all' ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500'}`}>Mostrar Todos</button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            {filterMode === 'day' && (
                                <div className="flex-1">
                                    <label htmlFor="dateStart" className="block text-sm font-medium text-gray-300 mb-1">Selecione o dia</label>
                                    <input type="date" id="dateStart" value={dateRange.start} onChange={e => setDateRange({start: e.target.value, end: e.target.value})} className="w-full bg-gray-600 text-white p-2 rounded-md" />
                                </div>
                            )}
                            {filterMode === 'range' && (
                                <>
                                    <div className="flex-1">
                                        <label htmlFor="dateStart" className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label>
                                        <input type="date" id="dateStart" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full bg-gray-600 text-white p-2 rounded-md" />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-300 mb-1">Data de Fim</label>
                                        <input type="date" id="dateEnd" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full bg-gray-600 text-white p-2 rounded-md" />
                                    </div>
                                </>
                            )}
                            <div className="flex-1">
                                <label htmlFor="professionalFilter" className="block text-sm font-medium text-gray-300 mb-1">Filtrar por profissional</label>
                                <select id="professionalFilter" value={professionalFilter} onChange={e => setProfessionalFilter(e.target.value)} className="w-full bg-gray-600 text-white p-2 rounded-md">
                                    <option value="todos">Todos os Profissionais</option>
                                    {userProfile?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-400">A carregar agendamentos...</p>
                    ) : filteredAndSortedAppointments.length > 0 ? (
                        <ul className="space-y-4">
                            {filteredAndSortedAppointments.map(app => {
                                const appointmentDateTime = new Date(`${app.date}T${app.time}`);
                                const isPast = appointmentDateTime < new Date();
                                
                                return (
                                <li key={app.id} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex items-center mb-3 md:mb-0">
                                        <div className="text-center border-r border-gray-600 pr-4 mr-4">
                                            <p className="text-xl font-bold text-white">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}</p>
                                            <p className="text-sm text-gray-400">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-white">{app.time}</p>
                                            <p className="text-gray-300">{app.serviceName}</p>
                                            <p className="text-sm text-gray-400">com {app.professionalName}</p>
                                            <p className="text-sm text-gray-500">Cliente: {app.clientName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 self-end md:self-center mt-3 md:mt-0">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                                            app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                            app.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                                            'bg-red-500/20 text-red-300'
                                        }`}>
                                            {app.status === 'pending' ? 'Pendente' : app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : 'Não Compareceu'}
                                        </span>
                                        
                                        {app.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateAppointmentStatus(app.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Confirmar</button>
                                                <button onClick={() => updateAppointmentStatus(app.id, 'cancelled')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Recusar</button>
                                            </>
                                        )}

                                        {isPast && app.status === 'confirmed' && (
                                            <>
                                                <button onClick={() => handleNoShowAppointment(app)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Não Compareceu</button>
                                                <button onClick={() => handleCompleteAppointment(app)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Concluir</button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-400 py-8">Nenhum agendamento encontrado para os filtros selecionados.</p>
                    )}
                </div>
            )}
            {activeTab === 'professionals' && <ProfessionalsManagement />}
            {activeTab === 'availability' && <AvailabilityManagement />}
            {activeTab === 'financial' && <FinancialManagement />}
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
