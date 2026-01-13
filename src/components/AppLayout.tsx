// src/components/AppLayout.tsx

import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom"; // Importe useLocation
import Header from "./Header";
import Footer from "./Footer";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import type { UserProfile } from "../types";

const AppLayout = () => {
  const { user, isLoading } = useAuthStore();
  const { userProfile } = useProfileStore();
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber a rota atual

  // Verifica se a rota atual é parte do dashboard
  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    if (!isLoading && user && userProfile) {
      const profileWithBooking = userProfile as UserProfile & {
        pendingBooking?: boolean;
      };

      if (profileWithBooking.pendingBooking) {
        navigate("/booking");
      }
    }
  }, [user, userProfile, isLoading, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      {/* Só mostra o Header público se NÃO for dashboard.
         Isso evita o "duplo header" em dispositivos móveis,
         já que os dashboards têm seus próprios menus.
      */}
      {!isDashboardRoute && <Header />}

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer público também é escondido no dashboard para ganhar espaço */}
      {!isDashboardRoute && <Footer />}
    </div>
  );
};

export default AppLayout;
