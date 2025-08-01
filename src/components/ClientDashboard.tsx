import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, documentId } from 'firebase/firestore';
import Booking from './Booking';
import ClientProfileManagement from './Client/ClientProfileManagement';
import type { Appointment, UserProfile, Review } from '../types';

// Componente do Modal de Avaliação
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
                        <svg key={star}
                            className={`w-10 h-10 cursor-pointer transition-colors ${ (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
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

// Componente de Modal de Confirmação para o cancelamento
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

const ClientDashboard = () => {
    const { userProfile, logout, toggleFavorite, cancelAppointment, submitReview } = useAuth();
    const [activeTab, setActiveTab] = useState<'search' | 'myAppointments' | 'favorites'>('search');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
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

    useEffect(() => {
        const fetchProviders = async () => {
            setIsLoading(true);
            const q = query(collection(db, 'users'), where('userType', '==', 'serviceProvider'));
            const querySnapshot = await getDocs(q);
            const providersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
            setAllProviders(providersData);
            setIsLoading(false);
        };
        fetchProviders();
    }, []);

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

    useEffect(() => {
        if (!userProfile?.uid) return;
        const q = query(collection(db, 'appointments'), where('clientId', '==', userProfile.uid));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setLoadingAppointments(true);
            const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

            const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
                const providerDocRef = doc(db, "users", appt.serviceProviderId);
                const providerSnap = await getDoc(providerDocRef);
                const providerProfile = providerSnap.exists() ? providerSnap.data() as UserProfile : null;

                const professional = providerProfile?.professionals?.find(p => p.id === appt.professionalId);
                const serviceNames = appt.serviceIds?.map(serviceId => professional?.services.find(s => s.id === serviceId)?.name || '').join(', ');

                return {
                    ...appt,
                    establishmentName: providerProfile?.establishmentName || 'Estabelecimento não encontrado',
                    professionalName: professional?.name || 'Profissional não encontrado',
                    serviceName: serviceNames,
                };
            }));

            appointmentsWithDetails.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
            setAppointments(appointmentsWithDetails);
            setLoadingAppointments(false);
        });
        return () => unsubscribe();
    }, [userProfile]);

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
                const favsData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
                setFavoriteProfessionals(favsData);
            } catch (error) {
                console.error("Erro ao procurar favoritos:", error);
            } finally {
                setLoadingFavorites(false);
            }
        };
        if (activeTab === 'favorites') {
            fetchFavorites();
        }
    }, [userProfile?.favoriteProfessionals, activeTab]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({ segment: '', city: '', date: '' });
    };

    const handleCancelAppointment = (appointmentId: string) => {
        setModalState({
            isOpen: true,
            title: 'Cancelar Agendamento',
            message: 'Tem a certeza de que pretende cancelar este agendamento?',
            onConfirm: () => {
                cancelAppointment(appointmentId);
                setModalState(null);
            }
        });
    };

    const handleOpenReviewModal = (appointment: Appointment) => {
        setReviewModal({ isOpen: true, appointment });
    };

    const handleSubmitReview = (rating: number, comment: string) => {
        if (reviewModal.appointment && userProfile) {
            submitReview({
                serviceProviderId: reviewModal.appointment.serviceProviderId,
                appointmentId: reviewModal.appointment.id,
                rating,
                comment,
                clientId: userProfile.uid,
                serviceIds: reviewModal.appointment.serviceIds
            });
        }
        setReviewModal({ isOpen: false });
    };

    if (selectedProfessional) {
        return <Booking professional={selectedProfessional} onBack={() => setSelectedProfessional(null)} />;
    }

    if (isEditingProfile) {
        return <ClientProfileManagement onBack={() => setIsEditingProfile(false)} />;
    }

    const renderProfessionalCard = (prof: UserProfile) => {
        const isFavorite = userProfile?.favoriteProfessionals?.includes(prof.uid);
        const getInstagramUrl = (usernameOrUrl: string) => usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://instagram.com/${usernameOrUrl.replace('@', '')}`;

        return (
            <div key={prof.uid} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between transition-all hover:shadow-lg hover:bg-gray-600 gap-4">
                <div className="flex items-center flex-grow min-w-0 w-full">
                    <img src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} alt={`Foto de ${prof.establishmentName}`} className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-600" />
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-white truncate">{prof.establishmentName}</h3>
                        <p className="text-gray-400 truncate">{prof.segment} - {prof.address?.city || 'Endereço não informado'}</p>
                        {prof.reviewCount && prof.reviewCount > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-sm font-bold text-white">{prof.averageRating?.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({prof.reviewCount} avaliações)</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    {prof.instagram && <a href={getInstagramUrl(prof.instagram)} target="_blank" rel="noopener noreferrer" title="Ver no Instagram" className="p-2 rounded-full bg-gray-600 hover:bg-pink-600 transition-colors"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44c0-.795-.645-1.44-1.441-1.44z"></path></svg></a>}
                    <button onClick={() => toggleFavorite(prof.uid)} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}><svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-all duration-200 transform hover:scale-110 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></button>
                    <button onClick={() => setSelectedProfessional(prof)} className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Agendar</button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
            {modalState?.isOpen && <ConfirmationModal title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={() => setModalState(null)} />}
            <ReviewModal isOpen={reviewModal.isOpen} onClose={() => setReviewModal({ isOpen: false })} appointment={reviewModal.appointment!} onSubmit={handleSubmitReview} />

            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                {/* User Info (Left on Desktop) */}
                <div className="flex items-center self-start md:self-center">
                    <img src={userProfile?.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} alt="A sua foto de perfil" className="h-14 w-14 rounded-full object-cover mr-4 border-2 border-gray-700" />
                    <div>
                        <p className="text-gray-400 text-sm">Bem-vindo(a),</p>
                        <h1 className="text-xl font-bold text-white">{userProfile?.displayName || 'Cliente'}</h1>
                    </div>
                </div>

                {/* Logo (Center on Desktop) */}
                <div className="order-first md:order-none">
                    <img className='w-[10rem] md:w-[12rem]' src="/src/assets/stylo-logo.png" alt="logo stylo" />
                </div>

                {/* Buttons (Right on Desktop) */}
                <div className="flex items-center justify-end w-full md:w-auto space-x-2">
                    <button onClick={() => setIsEditingProfile(true)} className="flex items-center space-x-2 bg-gray-800 hover:bg-yellow-600 text-gray-300 font-semibold py-2 px-3 rounded-lg transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        <span className="hidden sm:inline">Perfil</span>
                    </button>
                    <button onClick={logout} className="flex items-center space-x-2 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 font-semibold py-2 px-3 rounded-lg transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                </div>
            </header>

            <main>
                <div className="mb-8">
                    <div className="flex space-x-2 md:space-x-4 border-b border-gray-700">
                        <button onClick={() => setActiveTab('search')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'search' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Procurar</button>
                        <button onClick={() => setActiveTab('myAppointments')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'myAppointments' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Agendamentos</button>
                        <button onClick={() => setActiveTab('favorites')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'favorites' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Favoritos</button>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
                    {activeTab === 'search' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Encontre um profissional</h2>
                            <div className="bg-gray-700 p-4 rounded-lg mb-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div><label htmlFor="segment" className="block text-sm font-medium text-gray-300 mb-1">Área de Atuação</label><select name="segment" id="segment" value={filters.segment} onChange={handleFilterChange} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500"><option value="">Todas</option><option value="Barbearia">Barbearia</option><option value="Salão de Beleza">Salão de Beleza</option><option value="Manicure/Pedicure">Manicure/Pedicure</option><option value="Esteticista">Esteticista</option><option value="Maquiagem">Maquilhagem</option><option value="Outro">Outro</option></select></div><div><label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">Cidade</label><input type="text" name="city" id="city" placeholder="Ex: Brasília" value={filters.city} onChange={handleFilterChange} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" /></div><div><label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Disponível em</label><input type="date" name="date" id="date" value={filters.date} onChange={handleFilterChange} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" /></div><div className="flex items-end"><button onClick={clearFilters} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Limpar Filtros</button></div></div></div>
                            <div className="relative mb-8"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></div><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Procure por nome, profissional ou serviço..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" /></div>
                            <div className="space-y-4">{isLoading ? <p className="text-center text-gray-400">A carregar profissionais...</p> : filteredResults.length > 0 ? filteredResults.map(renderProfessionalCard) : <p className="text-center text-gray-400 py-8">Nenhum resultado encontrado para os filtros aplicados.</p>}</div>
                        </div>
                    )}

                    {activeTab === 'myAppointments' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Os Meus Agendamentos</h2>
                            {loadingAppointments ? (<p className="text-center text-gray-400">A carregar os seus agendamentos...</p>) : appointments.length > 0 ? (
                                <ul className="space-y-4">
                                    {appointments.map(app => (
                                        <li key={app.id} className="bg-gray-700 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                                            <div className="flex items-center mb-3 md:mb-0"><div className="text-center border-r border-gray-600 pr-4 mr-4"><p className="text-xl font-bold text-white">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' })}</p><p className="text-sm text-gray-400">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' })}</p></div><div><p className="font-bold text-lg text-white">{app.time} - {app.establishmentName}</p><p className="text-gray-300">{app.serviceName}</p><p className="text-sm text-gray-400">com {app.professionalName}</p></div></div>
                                            <div className="flex items-center space-x-3 self-end md:self-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : app.status === 'completed' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>{app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                                                {(app.status === 'pending' || app.status === 'confirmed') && <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg">Cancelar</button>}
                                                {app.status === 'completed' && !app.hasBeenReviewed && <button onClick={() => handleOpenReviewModal(app)} className="bg-yellow-500 text-black font-bold py-1 px-3 text-xs rounded-lg">Avaliar</button>}
                                                {app.status === 'completed' && app.hasBeenReviewed && <p className="text-xs text-green-400">Avaliado ✓</p>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-gray-400 py-8"><p className="mb-4">Ainda não tem nenhum agendamento.</p><button onClick={() => setActiveTab('search')} className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Procurar Profissionais</button></div>
                            )}
                        </div>
                    )}

                    {activeTab === 'favorites' && (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Os Meus Favoritos</h2>
                            {loadingFavorites ? (<p className="text-center text-gray-400">A carregar favoritos...</p>) : favoriteProfessionals.length > 0 ? (
                                <div className="space-y-4">{favoriteProfessionals.map(renderProfessionalCard)}</div>
                            ) : (
                                <p className="text-center text-gray-400 py-8">Ainda não adicionou profissionais aos seus favoritos.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
