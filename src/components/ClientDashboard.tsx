// src/components/ClientDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Booking as Appointment, UserProfile, Review } from '../types'; // Renomeando para consistência
import { Menu as MenuIcon } from 'lucide-react';

// Importando todos os componentes necessários
import ClientSideNav from './Client/ClientSideNav';
import ClientSearchSection from './Client/ClientSearchSection';
import ClientMyAppointmentsSection from './Client/ClientMyAppointmentsSection';
import ClientFavoritesSection from './Client/ClientFavoritesSection';
import ClientProfileManagement from './Client/ClientProfileManagement';
import Booking from './Booking';
import LoginPrompt from './Common/LoginPrompt';
import Notifications from './Common/Notifications';
import ReviewModal from './Common/ReviewModal';
import ConfirmationModal from './Common/ConfirmationModal';


// Definindo os tipos de visualização para mais clareza
type ActiveView = "search" | "myAppointments" | "favorites" | "profile" | "notifications";

const ClientDashboard: React.FC = () => {
    const { user, userProfile, logout, toggleFavorite, cancelAppointment, submitReview } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // --- STATE MANAGEMENT ---
    const [activeView, setActiveView] = useState<ActiveView>("search");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    
    // Estado para o fluxo de agendamento
    const [bookingTarget, setBookingTarget] = useState<UserProfile | null>(null);

    // Estado unificado para modais
    const [modals, setModals] = useState({
        confirmation: { isOpen: false, title: '', message: '', onConfirm: () => {} },
        review: { isOpen: false, appointment: null as Appointment | null },
    });

    // Efeito para navegar para uma view específica (ex: vindo de outra página)
    useEffect(() => {
        if (location.state?.view) {
            setActiveView(location.state.view);
            window.history.replaceState({}, document.title); // Limpa o state para não reativar
        }
    }, [location.state]);

    // --- HANDLERS DE AÇÕES ---
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleStartBooking = (professional: UserProfile) => {
        if (!user) {
            navigate('/login'); // Se não estiver logado, vai para a página de login
        } else {
            setBookingTarget(professional); // Abre o modal de agendamento
        }
    };

    const handleCloseBooking = () => {
        setBookingTarget(null);
        setActiveView("myAppointments"); // Volta para "Meus Agendamentos" após agendar
    };

    const handleCancelAppointment = (appointmentId: string) => {
        setModals(prev => ({ ...prev, confirmation: {
            isOpen: true,
            title: "Cancelar Agendamento",
            message: "Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.",
            onConfirm: async () => {
                await cancelAppointment(appointmentId);
                setModals(prev => ({ ...prev, confirmation: { ...prev.confirmation, isOpen: false } }));
            },
        }}));
    };

    const handleOpenReviewModal = (appointment: Appointment) => {
        setModals(prev => ({ ...prev, review: { isOpen: true, appointment } }));
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (modals.review.appointment && user) {
            const reviewData: Omit<Review, 'id' | 'createdAt'> = {
                providerId: modals.review.appointment.providerId,
                bookingId: modals.review.appointment.id,
                clientId: user.uid,
                clientName: userProfile?.displayName || user.displayName || 'Anônimo',
                clientPhotoURL: userProfile?.photoURL || user.photoURL || '',
                rating,
                comment,
            };
            await submitReview(reviewData);
        }
        setModals(prev => ({ ...prev, review: { isOpen: false, appointment: null } }));
    };

    // --- RENDERIZAÇÃO DE CONTEÚDO ---
    const renderContent = () => {
        // Se o usuário não estiver logado, mostra a tela de login para seções protegidas
        if (!user && (activeView === "myAppointments" || activeView === "favorites" || activeView === "profile")) {
            return <LoginPrompt onAction={() => navigate('/login')} />;
        }
        
        switch (activeView) {
            case "search":
                return <ClientSearchSection onSelectProfessional={handleStartBooking} />;
            case "myAppointments":
                return <ClientMyAppointmentsSection onCancel={handleCancelAppointment} onReview={handleOpenReviewModal} />;
            case "favorites":
                return <ClientFavoritesSection onSelectProfessional={handleStartBooking} />;
            case "profile":
                return <ClientProfileManagement />;
            case "notifications":
                return <Notifications />;
            default:
                return <ClientSearchSection onSelectProfessional={handleStartBooking} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-gray-200">
            {/* MODAIS */}
            {modals.confirmation.isOpen && (
                <ConfirmationModal
                    title={modals.confirmation.title}
                    message={modals.confirmation.message}
                    onConfirm={modals.confirmation.onConfirm}
                    onCancel={() => setModals(prev => ({...prev, confirmation: {...prev.confirmation, isOpen: false}}))}
                />
            )}
            {modals.review.isOpen && modals.review.appointment && (
                <ReviewModal
                    isOpen={modals.review.isOpen}
                    onClose={() => setModals(prev => ({...prev, review: {isOpen: false, appointment: null}}))}
                    appointment={modals.review.appointment}
                    onSubmit={handleSubmitReview}
                />
            )}
            {bookingTarget && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
                    <Booking professional={bookingTarget} onBack={handleCloseBooking} />
                </div>
            )}

            {/* NAVEGAÇÃO E CONTEÚDO */}
            <ClientSideNav
                activeView={activeView}
                setActiveView={setActiveView}
                logout={handleLogout}
                userProfile={userProfile}
                isOpen={isMobileNavOpen}
                setIsOpen={setIsMobileNavOpen}
            />
            <main className="flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300">
                <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full">
                    <div className="md:hidden flex justify-between items-center mb-6">
                        <button onClick={() => setIsMobileNavOpen(true)} className="text-gray-300 hover:text-white" aria-label="Abrir menu">
                            <MenuIcon size={28} />
                        </button>
                        <span className="text-xl font-bold text-white">Stylo</span>
                    </div>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;