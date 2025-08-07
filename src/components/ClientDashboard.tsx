// src/components/ClientDashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Appointment, UserProfile } from '../types';
import { Star } from 'lucide-react'; // Mantido para o ícone de estrela no ReviewModal
import Booking from './Booking';

// Importa os novos subcomponentes
import ClientSideNav from './Client/ClientSideNav';
import ClientSearchSection from './Client/ClientSearchSection';
import ClientMyAppointmentsSection from './Client/ClientMyAppointmentsSection';
import ClientFavoritesSection from './Client/ClientFavoritesSection';
import ClientProfileManagement from './Client/ClientProfileManagement'; // Importa o ClientProfileManagement
import LoginPrompt from './Common/LoginPrompt'; // Importa o novo LoginPrompt

// Componente de modal de confirmação (mantido aqui, pode ser movido para common/modals)
const ConfirmationModal = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => (
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

// Componente de modal de avaliação (mantido aqui, pode ser movido para common/modals)
const ReviewModal = ({ isOpen, onClose, appointment, onSubmit }: { isOpen: boolean; onClose: () => void; appointment: Appointment; onSubmit: (rating: number, comment: string) => void; }) => {
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
            alert('Por favor, dê uma classificação.'); // Substituir por Toast
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


const ClientDashboard: React.FC = () => {
    const { currentUser, userProfile, logout, toggleFavorite, cancelAppointment, submitReview } = useAuth();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking'>('search');
    
    const [selectedProfessionalForBooking, setSelectedProfessionalForBooking] = useState<UserProfile | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
    const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; appointment?: Appointment }>({ isOpen: false });
    // showLoginPrompt removido, pois o LoginPrompt agora é inline

    const handleLoginAction = () => navigate('/login');
    
    // handleProtectedAction agora apenas navega para o login
    const handleProtectedAction = (action: () => void) => {
        if (!currentUser) {
            handleLoginAction(); // Redireciona para o login
        } else {
            action(); // Executa a ação se o usuário estiver logado
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

    const renderContent = () => {
        if (activeView === 'booking' && selectedProfessionalForBooking) {
            return <Booking professional={selectedProfessionalForBooking} onBack={handleBackFromBooking} />;
        }
        
        // Seções que exigem login, renderizam o LoginPrompt se o usuário não estiver logado
        if (!currentUser && (activeView === 'myAppointments' || activeView === 'favorites' || activeView === 'profile')) {
            let message = "";
            switch (activeView) {
                case 'myAppointments': message = "Veja aqui os seus próximos agendamentos."; break;
                case 'favorites': message = "Guarde aqui os seus profissionais favoritos."; break;
                case 'profile': message = "Edite aqui o seu perfil."; break;
            }
            return <LoginPrompt message={message} onAction={handleLoginAction} />;
        }

        switch (activeView) {
            case 'search':
                return (
                    <ClientSearchSection
                        currentUser={currentUser}
                        userProfile={userProfile}
                        handleProtectedAction={handleProtectedAction}
                        toggleFavorite={toggleFavorite}
                        handleSelectProfessionalForBooking={handleSelectProfessionalForBooking}
                    />
                );
            case 'myAppointments':
                return (
                    <ClientMyAppointmentsSection
                        currentUser={currentUser}
                        handleLoginAction={handleLoginAction}
                        handleCancelAppointment={handleCancelAppointment}
                        handleOpenReviewModal={handleOpenReviewModal}
                        LoginPrompt={LoginPrompt} // Passa o componente LoginPrompt
                        setActiveView={setActiveView} // Passa setActiveView
                    />
                );
            case 'favorites':
                return (
                    <ClientFavoritesSection
                        currentUser={currentUser}
                        userProfile={userProfile}
                        handleLoginAction={handleLoginAction}
                        handleProtectedAction={handleProtectedAction}
                        toggleFavorite={toggleFavorite}
                        handleSelectProfessionalForBooking={handleSelectProfessionalForBooking}
                        LoginPrompt={LoginPrompt} // Passa o componente LoginPrompt
                        setActiveView={setActiveView} // Passa setActiveView
                    />
                );
            case 'profile':
                return <ClientProfileManagement onBack={() => setActiveView('search')} LoginPrompt={LoginPrompt} handleLoginAction={handleLoginAction} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-gray-200 font-sans">
            {modalState?.isOpen && <ConfirmationModal title={modalState.title} message={modalState.message} onConfirm={modalState.onConfirm} onCancel={() => setModalState(null)} />}
            {reviewModal.isOpen && <ReviewModal isOpen={reviewModal.isOpen} onClose={() => setReviewModal({ isOpen: false })} appointment={reviewModal.appointment!} onSubmit={handleSubmitReview} />}
            
            <ClientSideNav activeView={activeView} setActiveView={setActiveView} logout={logout} userProfile={userProfile} />
            
            <main className="flex-grow p-4 sm:p-6 md:p-8 ml-72">
                <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
