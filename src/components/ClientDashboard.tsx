// src/components/ClientDashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useReviewStore } from "../store/reviewStore";
import { useNavigate, useLocation } from "react-router-dom";
import type { Appointment, UserProfile } from "../types";
import { Star, Menu as MenuIcon } from "lucide-react";
import ReviewModal from "./Common/ReviewModal";
import Booking from "./Booking";
import ConfirmationModal from "./Common/ConfirmationModal";

import ClientSideNav from "./Client/ClientSideNav";
import ClientSearchSection from "./Client/ClientSearchSection";
import ClientMyAppointmentsSection from "./Client/ClientMyAppointmentsSection";
import ClientFavoritesSection from "./Client/ClientFavoritesSection";
import ClientProfileManagement from "./Client/ClientProfileManagement";
import LoginPrompt from "./Common/LoginPrompt";
import Notifications from "./Common/Notifications";
import { useUserAppointments } from "../store/userAppointmentsStore";

const ClientDashboard: React.FC = () => {
  const { user, userProfile, logout, toggleFavorite } = useAuthStore();
  const { submitReview, isSubmitting, error: reviewError } = useReviewStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { cancelBooking } = useUserAppointments(user?.uid);
  const [activeView, setActiveView] = useState<
    | "search"
    | "myAppointments"
    | "favorites"
    | "profile"
    | "booking"
    | "notifications"
  >("search");

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedProfessionalForBooking, setSelectedProfessionalForBooking] =
    useState<UserProfile | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    appointment?: Appointment;
  }>({ isOpen: false });

  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleLoginAction = () => navigate("/login");

  const handleCancelAppointment = (appointmentId: string) => {
    setModalState({
      isOpen: true,
      title: "Cancelar Agendamento",
      message: "Tem a certeza de que pretende cancelar este agendamento?",
      onConfirm: () => {
        cancelBooking(appointmentId);
        setModalState(null);
      },
    });
  };

  const handleOpenReviewModal = (appointment: Appointment) => {
    setReviewModal({ isOpen: true, appointment });
  };

  const handleCloseReviewModal = () => {
    setReviewModal({ isOpen: false });
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewModal.appointment || !user) return;

    const reviewPayload = {
      serviceProviderId: reviewModal.appointment.serviceProviderId,
      appointmentId: reviewModal.appointment.id,
      clientId: user.uid,
      professionalId: reviewModal.appointment.professionalId,
      serviceName: reviewModal.appointment.serviceName,
      rating,
      comment,
    };

    try {
      await submitReview(reviewPayload);
      // Aqui você pode adicionar um toast de sucesso
      handleCloseReviewModal();
    } catch (e) {
      // Aqui você pode adicionar um toast de erro
      console.error("Falha ao enviar avaliação:", e);
    }
  };

  const handleSelectProfessionalForBooking = (prof: UserProfile) => {
    setSelectedProfessionalForBooking(prof);
    setActiveView("booking");
  };

  const handleBackFromBooking = () => {
    setSelectedProfessionalForBooking(null);
    setActiveView("search");
  };

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      // Redireciona para a página de login
      handleLoginAction();
    } else {
      action();
    }
  };

  const renderContent = () => {
    if (activeView === "booking" && selectedProfessionalForBooking) {
      return (
        <Booking
          professional={selectedProfessionalForBooking}
          onBack={handleBackFromBooking}
        />
      );
    }

    // Usando LoginPrompt para renderizar a mensagem correta caso o usuário não esteja logado
    if (
      !user &&
      (activeView === "myAppointments" ||
        activeView === "favorites" ||
        activeView === "profile" ||
        activeView === "notifications")
    ) {
      let message = "";
      switch (activeView) {
        case "myAppointments":
          message = "Veja aqui os seus próximos agendamentos.";
          break;
        case "favorites":
          message = "Guarde aqui os seus profissionais favoritos.";
          break;
        case "profile":
          message = "Edite aqui o seu perfil.";
          break;
        case "notifications":
          message = "Veja aqui as suas notificações.";
          break;
      }
      return <LoginPrompt message={message} onAction={handleLoginAction} />;
    }

    switch (activeView) {
      case "search":
        return (
          <ClientSearchSection
            handleSelectProfessionalForBooking={
              handleSelectProfessionalForBooking
            }
            handleProtectedAction={handleProtectedAction}
          />
        );
      case "myAppointments":
        return (
          <ClientMyAppointmentsSection
            onCancel={handleCancelAppointment}
            onReview={handleOpenReviewModal}
            setActiveView={setActiveView}
          />
        );
      case "favorites":
        return (
          <ClientFavoritesSection
            handleProtectedAction={handleProtectedAction}
            toggleFavorite={toggleFavorite}
            handleSelectProfessionalForBooking={
              handleSelectProfessionalForBooking
            }
            user={user}
            userProfile={userProfile}
            handleLoginAction={handleLoginAction}
            LoginPrompt={LoginPrompt}
            setActiveView={setActiveView}
          />
        );
      case "profile":
        return (
          <ClientProfileManagement onBack={() => setActiveView("search")} />
        );
      case "notifications":
        return <Notifications />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      {modalState?.isOpen && (
        <ConfirmationModal
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={() => setModalState(null)}
        />
      )}
      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview} // A prop onSubmit está correta aqui
          appointment={reviewModal.appointment}
          isSubmitting={isSubmitting} // 4. (Opcional) Passe o estado de loading para o modal
        />
      )}

      <ClientSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        logout={logout}
        userProfile={userProfile}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      <main className="flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300">
        <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full">
          <div className="md:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="text-gray-300 hover:text-white"
              aria-label="Abrir menu"
            >
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
