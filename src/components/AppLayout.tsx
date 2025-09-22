import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuthStore } from "../store/authStore";
import { AppointmentDetailsModal } from "./ServiceProvider/Agenda/AppointmentDetailsModal";

const AppLayout = () => {
  const { user, userProfile, loading } = useAuthStore();
  const navigate = useNavigate();

  // NOVO USEEFFECT PARA VERIFICAR AGENDAMENTO PENDENTE
  useEffect(() => {
    if (!loading && user && userProfile) {
      if (userProfile.pendingBooking) {
        navigate("/booking");
      }
    }
  }, [user, userProfile, loading, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <Header />
      <main className="flex-grow">
        {/* O Outlet renderiza a rota filha (Dashboard, etc.) */}
        <Outlet />
      </main>
      <Footer />
      <AppointmentDetailsModal />
    </div>
  );
};

export default AppLayout;
