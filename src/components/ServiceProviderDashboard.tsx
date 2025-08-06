import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import type { Appointment } from '../types';
import logo from '../assets/stylo-logo.png';
import { LayoutDashboard, User, Scissors, Users, Clock, DollarSign, Star, LogOut, Check, X, UserX, CheckCircle, AlertTriangle } from 'lucide-react';

// Importando os seus componentes de gerenciamento existentes
import ProfileManagement from './ServiceProvider/ProfileManagement';
import ServicesManagement from './ServiceProvider/ServicesManagement';
import ProfessionalsManagement from './ServiceProvider/ProfessionalsManagement';
import AvailabilityManagement from './ServiceProvider/AvailabilityManagement';
import FinancialManagement from './ServiceProvider/FinancialManagement';
import ReviewsManagement from './ServiceProvider/ReviewsManagement';

// --- Subcomponente de Modal de Confirmação ---
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

// --- Componentes do Layout do Dashboard ---

const NavItem = ({ icon: Icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${active ? 'bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md'}`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">{text}</span>
  </button>
);

const SideNav = ({ activeView, setActiveView }) => {
    const { logout, userProfile } = useAuth();
    return (
        <div className="w-72 h-screen bg-black p-4 flex flex-col border-r border-gray-800 fixed top-0 left-0">
            <div className="flex items-center space-x-2 mb-10 px-2">
                <Link to="/"><img className="h-10 w-auto" src={logo} alt="Stylo" /></Link>
                <span className="text-white text-2xl font-bold tracking-tight">Stylo</span>
            </div>
            <nav className="flex-grow flex flex-col space-y-2">
                <NavItem icon={LayoutDashboard} text="Agenda" active={activeView === 'agenda'} onClick={() => setActiveView('agenda')} />
                <NavItem icon={Scissors} text="Serviços" active={activeView === 'services'} onClick={() => setActiveView('services')} />
                <NavItem icon={Users} text="Profissionais" active={activeView === 'professionals'} onClick={() => setActiveView('professionals')} />
                <NavItem icon={Clock} text="Disponibilidade" active={activeView === 'availability'} onClick={() => setActiveView('availability')} />
                <NavItem icon={DollarSign} text="Financeiro" active={activeView === 'financial'} onClick={() => setActiveView('financial')} />
                <NavItem icon={Star} text="Avaliações" active={activeView === 'reviews'} onClick={() => setActiveView('reviews')} />
            </nav>
            <div className="mt-auto">
                <div className="border-t border-gray-800 pt-4">
                    <div className="flex items-center px-2 mb-4">
                        <img src={userProfile?.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt="Sua foto de perfil" className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700" />
                        <div>
                            <p className="text-sm font-semibold text-white truncate">{userProfile?.establishmentName || 'Nome do Salão'}</p>
                            <p className="text-xs text-gray-400">Prestador de Serviço</p>
                        </div>
                    </div>
                    <NavItem icon={User} text="Meu Perfil" active={activeView === 'profile'} onClick={() => setActiveView('profile')} />
                    <button onClick={logout} className="flex items-center w-full h-12 px-4 mt-1 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 ease-in-out group">
                        <LogOut className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
                        <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">Sair</span>
                    </button>
                </div>
            </div>
        </div>
    )
};

// --- Componente Principal do Dashboard ---
const ServiceProviderDashboard = () => {
    const { userProfile, logout, updateAppointmentStatus } = useAuth();
    const [activeView, setActiveView] = useState('agenda');
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
    const [filterMode, setFilterMode] = useState<'day' | 'range' | 'all'>('day');
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [professionalFilter, setProfessionalFilter] = useState('todos');

    useEffect(() => {
        if (!userProfile?.uid) return;
        const q = query(collection(db, 'appointments'), where('serviceProviderId', '==', userProfile.uid));
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
        if (professionalFilter !== 'todos') {
            filtered = filtered.filter(app => app.professionalId === professionalFilter);
        }
        const now = new Date();
        const getOrder = (app: Appointment) => {
            const appDate = new Date(`${app.date}T${app.time}`);
            if (app.status === 'pending') return 1;
            if (app.status === 'confirmed' && appDate >= now) return 2;
            if (app.status === 'confirmed' && appDate < now) return 3;
            if (app.status === 'completed') return 4;
            if (app.status === 'no-show') return 5;
            return 6;
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
    
    const getStatusInfo = (status, isPast) => {
        switch (status) {
            case 'pending': return { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300', icon: <Clock size={14} /> };
            case 'confirmed': return { text: 'Confirmado', color: isPast ? 'bg-gray-500/20 text-gray-300' : 'bg-green-500/20 text-green-300', icon: isPast ? <AlertTriangle size={14} /> : <Check size={14} /> };
            case 'completed': return { text: 'Concluído', color: 'bg-blue-500/20 text-blue-300', icon: <CheckCircle size={14} /> };
            case 'no-show': return { text: 'Não Compareceu', color: 'bg-red-500/20 text-red-300', icon: <UserX size={14} /> };
            default: return { text: 'Desconhecido', color: 'bg-gray-500/20 text-gray-300', icon: <AlertTriangle size={14} /> };
        }
    }

    const renderContent = () => {
        switch (activeView) {
            case 'agenda':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Agenda e Solicitações</h2>
                        <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl mb-8 space-y-4 border border-gray-800">
                            <div className="flex flex-wrap items-center gap-2">
                                <button onClick={() => setFilterMode('day')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${filterMode === 'day' ? 'bg-[#daa520] text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>Ver por Dia</button>
                                <button onClick={() => setFilterMode('range')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${filterMode === 'range' ? 'bg-[#daa520] text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>Ver por Período</button>
                                <button onClick={() => setFilterMode('all')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${filterMode === 'all' ? 'bg-[#daa520] text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>Mostrar Todos</button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                {filterMode === 'day' && <div className="flex-1"><label htmlFor="dateStart" className="block text-sm font-medium text-gray-300 mb-1">Selecione o dia</label><input type="date" id="dateStart" value={dateRange.start} onChange={e => setDateRange({start: e.target.value, end: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-700" /></div>}
                                {filterMode === 'range' && (<><div className="flex-1"><label htmlFor="dateStart" className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label><input type="date" id="dateStart" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-700" /></div><div className="flex-1"><label htmlFor="dateEnd" className="block text-sm font-medium text-gray-300 mb-1">Data de Fim</label><input type="date" id="dateEnd" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-700" /></div></>)}
                                <div className="flex-1"><label htmlFor="professionalFilter" className="block text-sm font-medium text-gray-300 mb-1">Filtrar por profissional</label><select id="professionalFilter" value={professionalFilter} onChange={e => setProfessionalFilter(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-700"><option value="todos">Todos os Profissionais</option>{userProfile?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            </div>
                        </div>
                        {loading ? <p className="text-center text-gray-400 py-10">A carregar agendamentos...</p> : filteredAndSortedAppointments.length > 0 ? (
                            <ul className="space-y-4">{filteredAndSortedAppointments.map(app => {
                                const appointmentDateTime = new Date(`${app.date}T${app.time}`);
                                const isPast = appointmentDateTime < new Date();
                                const statusInfo = getStatusInfo(app.status, isPast);
                                return (
                                <li key={app.id} className="bg-gray-800/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-700 hover:border-[#daa520]/50 transition-colors duration-300">
                                    <div className="flex items-center mb-4 md:mb-0 flex-grow">
                                        <div className="text-center border-r-2 border-gray-700 pr-4 mr-4">
                                            <p className="text-2xl font-bold text-white">{app.time}</p>
                                            <p className="text-sm text-gray-400">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-white">{app.serviceName}</p>
                                            <p className="text-sm text-gray-300">Cliente: {app.clientName}</p>
                                            <p className="text-sm text-gray-400">Profissional: {app.professionalName}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 self-stretch md:self-center w-full md:w-auto">
                                        <div className={`flex items-center justify-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>{statusInfo.icon}<span>{statusInfo.text}</span></div>
                                        <div className="flex items-center justify-end gap-2">
                                            {app.status === 'pending' && (<><button onClick={() => updateAppointmentStatus(app.id, 'confirmed')} className="p-2 bg-green-600/80 hover:bg-green-600 rounded-md text-white transition-colors"><Check size={16} /></button><button onClick={() => updateAppointmentStatus(app.id, 'cancelled')} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors"><X size={16} /></button></>)}
                                            {isPast && app.status === 'confirmed' && (<><button onClick={() => handleNoShowAppointment(app)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white transition-colors"><UserX size={16} /></button><button onClick={() => handleCompleteAppointment(app)} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white transition-colors"><CheckCircle size={16} /></button></>)}
                                        </div>
                                    </div>
                                </li>
                            )})}</ul>
                        ) : <p className="text-center text-gray-400 py-10">Nenhum agendamento encontrado para os filtros selecionados.</p>}
                    </div>
                );
            case 'profile': return <ProfileManagement />;
            case 'services': return <ServicesManagement />;
            case 'professionals': return <ProfessionalsManagement />;
            case 'availability': return <AvailabilityManagement />;
            case 'financial': return <FinancialManagement />;
            case 'reviews': return <ReviewsManagement />;
            default: return <div></div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-gray-200 font-sans">
            {modalState?.isOpen && <ConfirmationModal title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={() => setModalState(null)} />}
            <SideNav activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-grow p-4 sm:p-6 md:p-8 ml-72">
                <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full animate-fade-in-down">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ServiceProviderDashboard;
