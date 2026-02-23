import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
// ✨ Agora centralizamos tudo no AuthStore
import { useAuthStore } from "../store/authStore";
import type { UserProfile } from "../types";

const AppLayout = () => {
  // ✨ Usando 'loading' em vez de 'isLoading'
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ✨ Atualizado para cobrir as rotas das diferentes roles
  const isDashboardRoute = 
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/professional") ||
    location.pathname.startsWith("/provider") ||
    location.pathname.startsWith("/client");

  useEffect(() => {
    // Se terminou de carregar e o utilizador existe
    if (!loading && user) {
      // Cast para verificar a flag local de agendamento pendente
      const profileWithBooking = user as UserProfile & {
        pendingBooking?: boolean;
      };

      if (profileWithBooking.pendingBooking) {
        navigate("/booking");
      }
    }
  }, [user, loading, navigate]);

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