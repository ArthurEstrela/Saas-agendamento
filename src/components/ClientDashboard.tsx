import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, documentId } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { Appointment, UserProfile } from '../types';
import { LogIn, Star, Search, Calendar, Heart, User, LogOut, Instagram, X } from 'lucide-react';
import logo from '../assets/stylo-logo.png';
import Booking from './Booking';
import ClientProfileManagement from './Client/ClientProfileManagement';

// --- Subcomponente de Alerta para Login ---
const LoginPrompt = ({ message, onAction }: { message: string; onAction: () => void; }) => (
    <div className="text-center bg-gray-800/50 p-10 rounded-xl border border-dashed border-gray-600 animate-fade-in-down">
        <div className="mx-auto h-12 w-12 text-gray-500">
            <LogIn size={48} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{message}</h3>
        <p className="mt-2 text-sm text-gray-400">
            Crie uma conta ou faça login para aceder a esta funcionalidade e guardar as suas preferências.
        </p>
        <div className="mt-6">
            <button
                onClick={onAction}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-[#daa520] hover:bg-[#c8961e]"
            >
                Entrar ou Criar Conta
            </button>
        </div>
    </div>
);

// --- Subcomponente do Modal de Avaliação ---
const ReviewModal = ({ isOpen, onClose, appointment, onSubmit }: { isOpen: boolean; onClose: () => void; appointment: Appointment; onSubmit: (rating: number, comment: string) => void; }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setHoverRating(0);
            setComment('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (rating > 0) {
            onSubmit(rating, comment);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
            <div className="bg-gray-800 p-8 rounded-xl w-full max-w-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-2">Avalie o seu Atendimento</h3>
                <p className="text-sm text-gray-400 mb-6">Estabelecimento: {appointment.establishmentName}</p>
                <div className="flex justify-center items-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star}
                            className={`w-10 h-10 cursor-pointer transition-colors ${ (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            fill="currentColor"
                        />
                    ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Deixe um comentário (opcional)..." rows={4} className="w-full bg-gray-700 p-3 rounded-md mb-6 focus:ring-2 focus:ring-yellow-500" />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-semibold px-6 py-2 rounded-lg">Fechar</button>
                    <button onClick={handleSubmit} disabled={rating === 0} className="bg-green-600 hover:bg-green-700 font-semibold px-6 py-2 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Enviar Avaliação</button>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponente de Modal de Confirmação para o cancelamento ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-300 mb-8">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                    Voltar
                </button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                    Confirmar Cancelamento
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
                <img className="h-10 w-auto" src={logo} alt="Stylo" />
                <span className="text-white text-2xl font-bold tracking-tight">Stylo</span>
            </div>
            <nav className="flex-grow flex flex-col space-y-2">
                <NavItem icon={Search} text="Procurar" active={activeView === 'search'} onClick={() => setActiveView('search')} />
                <NavItem icon={Calendar} text="Meus Agendamentos" active={activeView === 'myAppointments'} onClick={() => setActiveView('myAppointments')} />
                <NavItem icon={Heart} text="Meus Favoritos" active={activeView === 'favorites'} onClick={() => setActiveView('favorites')} />
            </nav>
            <div className="mt-auto">
                <div className="border-t border-gray-800 pt-4">
                    <div className="flex items-center px-2 mb-4">
                        <img src={userProfile?.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt="Sua foto de perfil" className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700" />
                        <div>
                            <p className="text-sm font-semibold text-white truncate">{userProfile?.displayName || 'Convidado(a)'}</p>
                            <p className="text-xs text-gray-400">Cliente</p>
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

// --- Componente Principal ---
const ClientDashboard = () => {
    const { currentUser, userProfile, logout, toggleFavorite, cancelAppointment, submitReview } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'search' | 'myAppointments' | 'favorites' | 'profile'>('search');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [allProviders, setAllProviders] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ segment: '', city: '', date: '' });
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [selectedProfessional, setSelectedProfessional] = useState<UserProfile | null>(null);
    const [favoriteProfessionals, setFavoriteProfessionals] = useState<UserProfile[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; appointment?: Appointment }>({ isOpen: false });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Fetch de todos os prestadores (público)
    useEffect(() => {
        const fetchProviders = async () => {
            setIsLoading(true);
            const q = query(collection(db, 'users'), where('userType', '==', 'serviceProvider'));
            const querySnapshot = await getDocs(q);
            const providersData = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
            setAllProviders(providersData);
            setIsLoading(false);
        };
        fetchProviders();
    }, []);
    
    // Fetch de agendamentos (apenas para utilizadores logados)
    useEffect(() => {
        if (!currentUser?.uid) {
            setAppointments([]);
            setLoadingAppointments(false);
            return;
        };
        setLoadingAppointments(true);
        const q = query(collection(db, 'appointments'), where('clientId', '==', currentUser.uid));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
            const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
                const providerDocRef = doc(db, "users", appt.serviceProviderId);
                const providerSnap = await getDoc(providerDocRef);
                const providerProfile = providerSnap.exists() ? providerSnap.data() as UserProfile : null;
                const professional = providerProfile?.professionals?.find(p => p.id === appt.professionalId);
                const serviceNames = appt.serviceIds?.map(serviceId => professional?.services.find(s => s.id === serviceId)?.name || '').join(', ');
                return { ...appt, establishmentName: providerProfile?.establishmentName, professionalName: professional?.name, serviceName: serviceNames };
            }));
            appointmentsWithDetails.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
            setAppointments(appointmentsWithDetails);
            setLoadingAppointments(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Fetch de favoritos (apenas para utilizadores logados)
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!userProfile?.favoriteProfessionals || userProfile.favoriteProfessionals.length === 0) {
                setFavoriteProfessionals([]);
                return;
            }
            setLoadingFavorites(true);
            try {
                const q = query(collection(db, 'users'), where(documentId(), 'in', userProfile.favoriteProfessionals));
                const querySnapshot = await getDocs(q);
                const favsData = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
                setFavoriteProfessionals(favsData);
            } catch (error) {
                console.error("Erro ao procurar favoritos:", error);
            } finally {
                setLoadingFavorites(false);
            }
        };
        if (currentUser && activeView === 'favorites') {
            fetchFavorites();
        }
    }, [currentUser, userProfile?.favoriteProfessionals, activeView]);

    const filteredResults = useMemo(() => {
        return allProviders.filter(provider => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ?
                provider.establishmentName?.toLowerCase().includes(searchTermLower) ||
                provider.professionals?.some(p => p.name.toLowerCase().includes(searchTermLower)) ||
                provider.professionals?.some(p => p.services.some(s => s.name.toLowerCase().includes(searchTermLower)))
                : true;
            const matchesSegment = filters.segment ? provider.segment === filters.segment : true;
            const matchesCity = filters.city ? provider.address?.city?.toLowerCase().includes(filters.city.toLowerCase()) : true;
            const matchesDate = filters.date ? (() => {
                const selectedDate = new Date(filters.date + 'T00:00:00');
                const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                return provider.professionals?.some(prof => prof.availability?.[dayOfWeek as keyof typeof prof.availability]?.active);
            })() : true;
            return matchesSearch && matchesSegment && matchesCity && matchesDate;
        });
    }, [searchTerm, filters, allProviders]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const clearFilters = () => { setSearchTerm(''); setFilters({ segment: '', city: '', date: '' }); };
    
    const handleLoginAction = () => navigate('/login');
    
    const handleProtectedAction = (action: () => void) => {
        if (!currentUser) {
            setShowLoginPrompt(true);
        } else {
            action();
        }
    };

    const handleCancelAppointment = (appointmentId: string) => {
        setModalState({ isOpen: true, title: 'Cancelar Agendamento', message: 'Tem a certeza de que pretende cancelar este agendamento?', onConfirm: () => { cancelAppointment(appointmentId); setModalState(null); } });
    };

    const handleOpenReviewModal = (appointment: Appointment) => setReviewModal({ isOpen: true, appointment });
    
    const handleSubmitReview = (rating: number, comment: string) => {
        if (reviewModal.appointment && currentUser) {
            submitReview({ serviceProviderId: reviewModal.appointment.serviceProviderId, appointmentId: reviewModal.appointment.id, rating, comment, clientId: currentUser.uid, serviceIds: reviewModal.appointment.serviceIds });
        }
        setReviewModal({ isOpen: false });
    };

    if (selectedProfessional) return <Booking professional={selectedProfessional} onBack={() => setSelectedProfessional(null)} />;

    const renderProfessionalCard = (prof: UserProfile) => {
        const isFavorite = userProfile?.favoriteProfessionals?.includes(prof.uid);
        const getInstagramUrl = (usernameOrUrl: string) => usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://instagram.com/${usernameOrUrl.replace('@', '')}`;
        return (
            <div key={prof.uid} className="bg-gray-800/80 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-lg hover:bg-gray-800 gap-4 border border-gray-700">
                <div className="flex items-center flex-grow min-w-0 w-full">
                    <img src={prof.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt={`Foto de ${prof.establishmentName}`} className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-600" />
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-white truncate">{prof.establishmentName}</h3>
                        <p className="text-gray-400 truncate">{prof.segment} - {prof.address?.city || 'Endereço não informado'}</p>
                        {prof.reviewCount && prof.reviewCount > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor"/>
                                <span className="text-sm font-bold text-white">{prof.averageRating?.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({prof.reviewCount} avaliações)</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    {prof.instagram && <a href={getInstagramUrl(prof.instagram)} target="_blank" rel="noopener noreferrer" title="Ver no Instagram" className="p-2 rounded-full bg-gray-600 hover:bg-pink-600 transition-colors"><Instagram className="w-6 h-6 text-white"/></a>}
                    <button onClick={() => handleProtectedAction(() => toggleFavorite(prof.uid))} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}><Heart className={`h-7 w-7 transition-all duration-200 transform hover:scale-110 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} fill={isFavorite ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => setSelectedProfessional(prof)} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Agendar</button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeView) {
            case 'search':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Encontre um profissional</h2>
                        <div className="bg-black/30 p-4 rounded-lg mb-6 border border-gray-800"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label htmlFor="segment" className="block text-sm font-medium text-gray-300 mb-1">Área de Atuação</label><select name="segment" id="segment" value={filters.segment} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]"><option value="">Todas</option><option value="Barbearia">Barbearia</option><option value="Salão de Beleza">Salão de Beleza</option><option value="Manicure/Pedicure">Manicure/Pedicure</option><option value="Esteticista">Esteticista</option><option value="Maquiagem">Maquilhagem</option><option value="Outro">Outro</option></select></div><div><label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">Cidade</label><input type="text" name="city" id="city" placeholder="Ex: Brasília" value={filters.city} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div><div><label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Disponível em</label><input type="date" name="date" id="date" value={filters.date} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div><div className="flex items-end"><button onClick={clearFilters} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Limpar Filtros</button></div></div></div>
                        <div className="relative mb-8"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></div><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Procure por nome, profissional ou serviço..." className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#daa520]" /></div>
                        <div className="space-y-4">{isLoading ? <p className="text-center text-gray-400">A carregar profissionais...</p> : filteredResults.length > 0 ? filteredResults.map(renderProfessionalCard) : <p className="text-center text-gray-400 py-8">Nenhum resultado encontrado para os filtros aplicados.</p>}</div>
                    </div>
                );
            case 'myAppointments':
                return !currentUser ? <LoginPrompt message="Veja aqui os seus próximos agendamentos." onAction={handleLoginAction} /> : (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Os Meus Agendamentos</h2>
                        {loadingAppointments ? (<p className="text-center text-gray-400">A carregar os seus agendamentos...</p>) : appointments.length > 0 ? (
                            <ul className="space-y-4">{appointments.map(app => (<li key={app.id} className="bg-gray-800/80 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-700"><div className="flex items-center mb-3 md:mb-0"><div className="text-center border-r border-gray-600 pr-4 mr-4"><p className="text-xl font-bold text-white">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}</p><p className="text-sm text-gray-400">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</p></div><div><p className="font-bold text-lg text-white">{app.time} - {app.establishmentName}</p><p className="text-gray-300">{app.serviceName}</p><p className="text-sm text-gray-400">com {app.professionalName}</p></div></div><div className="flex items-center space-x-3 self-end md:self-center"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : app.status === 'completed' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>{(app.status === 'pending' || app.status === 'confirmed') && <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Cancelar</button>}{app.status === 'completed' && !app.hasBeenReviewed && <button onClick={() => handleOpenReviewModal(app)} className="bg-[#daa520] text-black font-bold py-1 px-3 text-xs rounded-lg">Avaliar</button>}{app.status === 'completed' && app.hasBeenReviewed && <p className="text-xs text-green-400">Avaliado ✓</p>}</div></li>))}</ul>
                        ) : (
                            <div className="text-center text-gray-400 py-8"><p className="mb-4">Ainda não tem nenhum agendamento.</p><button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Procurar Profissionais</button></div>
                        )}
                    </div>
                );
            case 'favorites':
                return !currentUser ? <LoginPrompt message="Guarde aqui os seus profissionais favoritos." onAction={handleLoginAction} /> : (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Os Meus Favoritos</h2>
                        {loadingFavorites ? (<p className="text-center text-gray-400">A carregar favoritos...</p>) : favoriteProfessionals.length > 0 ? (
                            <div className="space-y-4">{favoriteProfessionals.map(renderProfessionalCard)}</div>
                        ) : (
                            <p className="text-center text-gray-400 py-8">Ainda não adicionou profissionais aos seus favoritos.</p>
                        )}
                    </div>
                );
            case 'profile':
                return !currentUser ? <LoginPrompt message="Edite aqui o seu perfil." onAction={handleLoginAction} /> : <ClientProfileManagement />;
            default:
                return <div></div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-gray-200 font-sans">
            {modalState?.isOpen && <ConfirmationModal title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={() => setModalState(null)} />}
            {reviewModal.isOpen && <ReviewModal isOpen={reviewModal.isOpen} onClose={() => setReviewModal({ isOpen: false })} appointment={reviewModal.appointment!} onSubmit={handleSubmitReview} />}
            {showLoginPrompt && <LoginPrompt message="É necessário fazer login para realizar esta ação." onAction={() => { setShowLoginPrompt(false); handleLoginAction(); }} />}
            
            <SideNav activeView={activeView} setActiveView={setActiveView} />
            
            <main className="flex-grow p-4 sm:p-6 md:p-8 ml-72">
                <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
