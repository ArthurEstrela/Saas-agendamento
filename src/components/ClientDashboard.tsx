import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, documentId } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { Appointment, UserProfile } from '../types';
import { LogIn, Star, Search, Calendar, Heart, User, LogOut, Instagram, X, CheckCircle, XCircle, History, Clock, SlidersHorizontal, MapPin, Tag } from 'lucide-react';
import logo from '../assets/stylo-logo.png';
import Booking from './Booking';
import ClientProfileManagement from './Client/ClientProfileManagement';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de navegação lateral
const SideNav = ({ activeView, setActiveView }) => (
    <nav className="fixed left-0 top-0 h-full w-72 bg-gray-950 p-6 flex flex-col shadow-lg z-20">
        <div className="flex items-center mb-10">
            <img src={logo} alt="Stylo Logo" className="h-10 w-auto mr-3" />
            <span className="text-2xl font-extrabold text-[#daa520]">Stylo</span>
        </div>
        <ul className="space-y-3 flex-grow">
            <li>
                <button onClick={() => setActiveView('search')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'search' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                    <Search className="w-5 h-5 mr-3" />
                    Pesquisar
                </button>
            </li>
            <li>
                <button onClick={() => setActiveView('myAppointments')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'myAppointments' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                    <Calendar className="w-5 h-5 mr-3" />
                    Meus Agendamentos
                </button>
            </li>
            <li>
                <button onClick={() => setActiveView('favorites')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'favorites' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                    <Heart className="w-5 h-5 mr-3" />
                    Favoritos
                </button>
            </li>
            <li>
                <button onClick={() => setActiveView('profile')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'profile' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                    <User className="w-5 h-5 mr-3" />
                    Meu Perfil
                </button>
            </li>
        </ul>
        <div className="mt-8">
            <button onClick={() => setActiveView('login')} className="flex items-center w-full p-3 rounded-lg text-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200">
                <LogOut className="w-5 h-5 mr-3" />
                Sair
            </button>
        </div>
    </nav>
);

// Componente de modal de confirmação
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 max-w-sm w-full text-center animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cancelar</button>
                <button onClick={onConfirm} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
            </div>
        </div>
    </div>
);

// Componente de modal de avaliação
const ReviewModal = ({ isOpen, onClose, appointment, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setRating(0);
            setComment('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (rating === 0) {
            alert('Por favor, dê uma classificação.');
            return;
        }
        onSubmit(rating, comment);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 max-w-md w-full animate-scale-in">
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Avaliar Agendamento</h3>
                <p className="text-gray-300 mb-6 text-center">Compartilhe sua experiência com {appointment?.establishmentName}.</p>
                
                <div className="mb-6 text-center">
                    <p className="text-gray-400 mb-2">Sua classificação:</p>
                    <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-10 h-10 cursor-pointer transition-transform duration-200 ${rating >= star ? 'text-yellow-400 fill-current transform scale-110' : 'text-gray-500 hover:text-yellow-300'}`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="comment" className="block text-gray-300 text-sm font-medium mb-2">Comentário (opcional):</label>
                    <textarea
                        id="comment"
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-[#daa520] focus:border-[#daa520] resize-y"
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Deixe seu comentário sobre o serviço..."
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-[#daa520] text-gray-900 font-semibold rounded-lg hover:bg-[#c8961e] transition-colors">Enviar Avaliação</button>
                </div>
            </div>
        </div>
    );
};

// Componente de prompt de login
const LoginPrompt = ({ message, onAction }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 max-w-sm w-full text-center animate-scale-in">
            <LogIn size={48} className="mx-auto text-[#daa520] mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">Ação Protegida</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <button onClick={onAction} className="px-6 py-2 bg-[#daa520] text-gray-900 font-semibold rounded-lg hover:bg-[#c8961e] transition-colors">
                Fazer Login
            </button>
        </div>
    </div>
);

const ClientDashboard = () => {
    const { currentUser, userProfile, logout, toggleFavorite, cancelAppointment, submitReview } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking'>('search');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [allProviders, setAllProviders] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ segment: '', city: '', date: '' });
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [selectedProfessionalForBooking, setSelectedProfessionalForBooking] = useState<UserProfile | null>(null);
    const [favoriteProfessionals, setFavoriteProfessionals] = useState<UserProfile[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; appointment?: Appointment }>({ isOpen: false });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [appointmentSubTab, setAppointmentSubTab] = useState<'upcoming' | 'history'>('upcoming');

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
        }
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
            appointmentsWithDetails.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
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
        let results = allProviders;

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            results = results.filter(provider =>
                provider.establishmentName?.toLowerCase().includes(lowerCaseSearchTerm) ||
                provider.segment?.toLowerCase().includes(lowerCaseSearchTerm) ||
                provider.professionals?.some(p => p.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
                provider.professionals?.some(p => p.services.some(s => s.name.toLowerCase().includes(lowerCaseSearchTerm)))
            );
        }

        if (filters.segment) {
            results = results.filter(provider => provider.segment === filters.segment);
        }
        if (filters.city) {
            results = results.filter(provider => provider.address?.city?.toLowerCase().includes(filters.city.toLowerCase()));
        }
        if (filters.date) {
            const selectedDay = new Date(filters.date).toDateString();
            results = results.filter(provider =>
                provider.professionals?.some(p =>
                    p.availability?.some(a =>
                        new Date(a.date).toDateString() === selectedDay && a.availableTimes.length > 0
                    )
                )
            );
        }
        return results;
    }, [searchTerm, filters, allProviders]);
    
    const { upcomingAppointments, historyAppointments } = useMemo(() => {
        const now = new Date();
        const upcoming = appointments.filter(app => {
            const appDateTime = new Date(`${app.date}T${app.time}`);
            return appDateTime >= now && (app.status === 'pending' || app.status === 'confirmed');
        });
        const history = appointments.filter(app => {
            const appDateTime = new Date(`${app.date}T${app.time}`);
            return appDateTime < now || app.status === 'completed' || app.status === 'cancelled' || app.status === 'no-show';
        });
        return { upcomingAppointments: upcoming, historyAppointments: history };
    }, [appointments]);

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

    const handleSelectProfessionalForBooking = (prof: UserProfile) => {
        setSelectedProfessionalForBooking(prof);
        setActiveView('booking');
    };

    const handleBackFromBooking = () => {
        setSelectedProfessionalForBooking(null);
        setActiveView('search');
    };

    const renderProfessionalCard = (prof: UserProfile) => {
        const isFavorite = userProfile?.favoriteProfessionals?.includes(prof.uid);
        const getInstagramUrl = (usernameOrUrl: string) => usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://instagram.com/${usernameOrUrl.replace('@', '')}`;
        return (
            <div key={prof.uid} className="bg-gray-800/80 p-4 rounded-xl flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-[#daa520]/10 hover:border-[#daa520]/50 hover:-translate-y-1 gap-4 border border-gray-700">
                <div className="flex items-center flex-grow min-w-0 w-full">
                    <img src={prof.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt={`Foto de ${prof.establishmentName}`} className="h-20 w-20 rounded-full object-cover mr-4 border-2 border-gray-600" />
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
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end mt-2 border-t border-gray-700 pt-3">
                    {prof.instagram && <a href={getInstagramUrl(prof.instagram)} target="_blank" rel="noopener noreferrer" title="Ver no Instagram" className="p-2 rounded-full bg-gray-600 hover:bg-pink-600 transition-colors"><Instagram className="w-6 h-6 text-white"/></a>}
                    <button onClick={() => handleProtectedAction(() => toggleFavorite(prof.uid))} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}><Heart className={`h-7 w-7 transition-all duration-200 transform hover:scale-110 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} fill={isFavorite ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => handleSelectProfessionalForBooking(prof)} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Agendar</button>
                </div>
            </div>
        );
    };

    const AppointmentCard = ({ app }) => {
        const getStatusInfo = (status) => {
            switch (status) {
                case 'confirmed': return { text: 'Confirmado', color: 'text-green-400', icon: <CheckCircle size={16} /> };
                case 'completed': return { text: 'Concluído', color: 'text-blue-400', icon: <History size={16} /> };
                case 'cancelled': case 'no-show': return { text: 'Cancelado', color: 'text-red-400', icon: <XCircle size={16} /> };
                default: return { text: 'Pendente', color: 'text-yellow-400', icon: <Clock size={16} /> };
            }
        };
        const statusInfo = getStatusInfo(app.status);

        return (
            <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:border-[#daa520]/50 hover:shadow-lg hover:shadow-[#daa520]/5">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-400">{format(new Date(`${app.date}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                        <p className="text-2xl font-bold text-white">{app.time}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-black/20 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                    </div>
                </div>
                <div className="border-t border-gray-700 my-4"></div>
                <div>
                    <p className="font-bold text-lg text-white">{app.establishmentName}</p>
                    <p className="text-gray-300">{app.serviceName}</p>
                    <p className="text-sm text-gray-400">com {app.professionalName}</p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    {app.status === 'completed' && !app.hasBeenReviewed && (
                        <button onClick={() => handleOpenReviewModal(app)} className="bg-[#daa520] text-black font-bold py-2 px-4 text-sm rounded-lg flex items-center gap-1 hover:bg-[#c8961e] transition-colors">
                            <Star size={16} /> Avaliar
                        </button>
                    )}
                    {(app.status === 'pending' || app.status === 'confirmed') && (
                        <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 text-sm rounded-lg transition-colors">
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (activeView === 'booking' && selectedProfessionalForBooking) {
            return <Booking professional={selectedProfessionalForBooking} onBack={handleBackFromBooking} />;
        }
        
        switch (activeView) {
            case 'search':
                return (
                    <div className="animate-fade-in-down">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-bold text-white tracking-tight">Encontre o <span className="text-[#daa520]">Stylo</span> perfeito para você</h2>
                            <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Busque por serviços, profissionais ou estabelecimentos e agende o seu horário com facilidade.</p>
                        </div>
                        
                        <div className="sticky top-0 z-10 bg-gray-900/50 backdrop-blur-md p-4 rounded-xl mb-8 border border-gray-800">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Search className="h-5 w-5 text-gray-400" /></div>
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Procure por barbearia, corte de cabelo, nome do profissional..." className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#daa520]" />
                            </div>
                            <details className="mt-4">
                                <summary className="font-semibold text-white cursor-pointer flex items-center gap-2">
                                    <SlidersHorizontal size={16}/>
                                    Filtros Avançados
                                </summary>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                                    <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><Tag size={14}/>Área de Atuação</label><select name="segment" value={filters.segment} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]"><option value="">Todas</option><option>Barbearia</option><option>Salão de Beleza</option><option>Manicure/Pedicure</option><option>Esteticista</option><option>Maquiagem</option><option>Outro</option></select></div>
                                    <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><MapPin size={14}/>Cidade</label><input type="text" name="city" placeholder="Ex: Brasília" value={filters.city} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
                                    <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><Calendar size={14}/>Disponível em</label><input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
                                    <div className="flex items-end"><button onClick={clearFilters} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"><X size={16}/>Limpar</button></div>
                                </div>
                            </details>
                        </div>
                        
                        {isLoading ? <p className="text-center text-gray-400 py-10">A carregar profissionais...</p> : filteredResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredResults.map(renderProfessionalCard)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                                <Search size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold text-white">Nenhum resultado encontrado</h3>
                                <p className="text-sm mt-2">Tente ajustar a sua busca ou limpar os filtros.</p>
                            </div>
                        )}
                    </div>
                );
            case 'myAppointments':
                return !currentUser ? <LoginPrompt message="Veja aqui os seus próximos agendamentos." onAction={handleLoginAction} /> : (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Os Meus Agendamentos</h2>
                        <div className="mb-6 flex space-x-2 border-b border-gray-800">
                            <button onClick={() => setAppointmentSubTab('upcoming')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'upcoming' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Próximos</button>
                            <button onClick={() => setAppointmentSubTab('history')} className={`py-2 px-4 font-semibold transition-colors duration-300 ${appointmentSubTab === 'history' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Histórico</button>
                        </div>
                        {loadingAppointments ? <p className="text-center text-gray-400 py-10">A carregar...</p> : (
                            appointmentSubTab === 'upcoming' ? (
                                upcomingAppointments.length > 0 ? 
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">{upcomingAppointments.map(app => <AppointmentCard key={app.id} app={app} />)}</div> :
                                <div className="text-center text-gray-400 py-10"><p className="mb-4">Nenhum agendamento futuro.</p><button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Procurar Profissionais</button></div>
                            ) : (
                                historyAppointments.length > 0 ?
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-down">{historyAppointments.map(app => <AppointmentCard key={app.id} app={app} />)}</div> :
                                <p className="text-center text-gray-400 py-10">O seu histórico de agendamentos está vazio.</p>
                            )
                        )}
                    </div>
                );
            case 'favorites':
                return !currentUser ? <LoginPrompt message="Guarde aqui os seus profissionais favoritos." onAction={handleLoginAction} /> : (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6">Os Meus Favoritos</h2>
                        {loadingFavorites ? (<p className="text-center text-gray-400 py-10">A carregar favoritos...</p>) : favoriteProfessionals.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-down">
                                {favoriteProfessionals.map(renderProfessionalCard)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                                <Heart size={48} className="mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold text-white">Sua galeria de favoritos está vazia</h3>
                                <p className="text-sm mt-2 mb-6">Comece a explorar e adicione os profissionais que mais gosta clicando no coração.</p>
                                <button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">
                                    Procurar Profissionais
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'profile':
                return !currentUser ? <LoginPrompt message="Edite aqui o seu perfil." onAction={handleLoginAction} /> : <ClientProfileManagement onBack={() => setActiveView('search')} />;
            default:
                return null;
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
