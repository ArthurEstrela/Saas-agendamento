import { useEffect, lazy, Suspense } from "react";
import type { ComponentType } from "react"; 
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationsStore";
import { AnimatePresence, motion } from "framer-motion";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/Common/ProtectedRoute";

// --- Utilitário de Retry para Lazy Load (Solução Anti-Erro de Vendor) ---
// Tenta importar o componente. Se falhar por erro de rede/versão (comum em deploys),
// força um reload na página do usuário para buscar o arquivo novo.
// CORREÇÃO: Usamos 'any' aqui para aceitar componentes com quaisquer props (ex: ReviewsManagementProps)
const lazyRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Verifica se o erro é uma instância de Error para acessar .message e .name com segurança
      if (error instanceof Error) {
        const isChunkLoadError = 
          error.message.includes("Failed to fetch dynamically imported module") ||
          error.message.includes("Importing a module script failed") ||
          error.name === "ChunkLoadError";

        if (isChunkLoadError) {
          // Previne loop infinito: verifica se já tentamos recarregar nesta sessão
          const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
          );

          if (!pageHasAlreadyBeenForceRefreshed) {
            // Marca flag na sessão e recarrega
            window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
            window.location.reload();
            // Retorna promessa vazia para "pausar" o erro visual enquanto recarrega
            return new Promise<{ default: T }>(() => {}); 
          }
        }
      }
      
      // Se não for erro de chunk ou já tiver recarregado, lança o erro normal
      throw error;
    }
  });
};

// --- Loader de Página ---
const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="flex h-screen w-full items-center justify-center bg-white dark:bg-zinc-950"
  >
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </motion.div>
);

// --- Lazy Imports (Agora usando lazyRetry) ---
// Páginas Públicas
const HomePage = lazyRetry(() => import("./pages/HomePage"));
const AboutUs = lazyRetry(() => import("./components/AboutUs"));
const Pricing = lazyRetry(() => import("./components/Pricing"));
const FAQ = lazyRetry(() => import("./components/FAQ"));
const Contact = lazyRetry(() => import("./components/Contact"));
const PrivacyPolicy = lazyRetry(() => import("./components/PrivacyPolicy"));
const TermsOfUse = lazyRetry(() => import("./components/TermsOfUse"));
const Features = lazyRetry(() => import("./components/Features"));

// Auth & Onboarding
const LoginPage = lazyRetry(() => import("./pages/LoginPage"));
const RegisterTypeSelection = lazyRetry(() => import("./pages/RegisterTypeSelection"));
const RegisterPage = lazyRetry(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazyRetry(() => import("./pages/ForgotPasswordPage"));

// Agendamento Público e Misto
const PublicBookingPage = lazyRetry(() => import("./pages/PublicBookingPage"));
const BookingPage = lazyRetry(() => import("./pages/BookingPage").then(module => ({ default: module.BookingPage })));

// Funcionalidade Híbrida (Pública/Privada)
const ClientSearchSection = lazyRetry(() => import("./components/Client/ClientSearchSection").then(m => ({ default: m.ClientSearchSection })));

// Dashboard & Privado
const DashboardPage = lazyRetry(() => import("./pages/DashboardPage"));
const NotFoundPage = lazyRetry(() => import("./pages/NotFoundPage"));

// Componentes do Dashboard (Client)
const ClientMyAppointmentsSection = lazyRetry(() => import("./components/Client/ClientMyAppointmentsSection").then(m => ({ default: m.ClientMyAppointmentsSection })));
const ClientFavoritesSection = lazyRetry(() => import("./components/Client/ClientFavoritesSection").then(m => ({ default: m.ClientFavoritesSection })));
const ClientProfileSection = lazyRetry(() => import("./components/Client/ClientProfileSection").then(m => ({ default: m.ClientProfileSection })));

// Componentes do Dashboard (Service Provider / Professional)
const AgendaView = lazyRetry(() => import("./components/ServiceProvider/Agenda/AgendaView").then(m => ({ default: m.AgendaView })));
const FinancialManagement = lazyRetry(() => import("./components/ServiceProvider/FinancialManagement").then(m => ({ default: m.FinancialManagement })));
const ProfessionalsManagement = lazyRetry(() => import("./components/ServiceProvider/ProfessionalsManagement").then(m => ({ default: m.ProfessionalsManagement })));
const AvailabilityManagement = lazyRetry(() => import("./components/ServiceProvider/AvailabilityManagement").then(m => ({ default: m.AvailabilityManagement })));
const ProfileManagement = lazyRetry(() => import("./components/ServiceProvider/ProfileManagement").then(m => ({ default: m.ProfileManagement })));
const ServicesManagement = lazyRetry(() => import("./components/ServiceProvider/ServicesManagement").then(m => ({ default: m.ServicesManagement })));
const ReviewsManagement = lazyRetry(() => import("./components/ServiceProvider/ReviewsManagement").then(m => ({ default: m.ReviewsManagement })));
const SubscriptionManagement = lazyRetry(() => import("./components/ServiceProvider/SubscriptionManagement").then(m => ({ default: m.SubscriptionManagement })));
const Notifications = lazyRetry(() => import("./components/Common/Notifications").then(m => ({ default: m.Notifications })));

// Componentes do Dashboard (Professional Employee)
const ProfessionalHome = lazyRetry(() => import("./components/Professional/ProfessionalHome").then(m => ({ default: m.ProfessionalHome })));
const ProfessionalProfileManagement = lazyRetry(() => import("./components/Professional/ProfessionalProfileManagement").then(m => ({ default: m.ProfessionalProfileManagement })));

function App() {
  const location = useLocation();
  const { user } = useAuthStore(); // Pega o usuário logado
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  // Monitoramento de Notificações Global
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user?.uid, fetchNotifications]);

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          {/* --- ROTAS PÚBLICAS (Com Header/Footer padrão) --- */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            
            {/* NOVO: Rota de exploração pública (Sem barreira de entrada) */}
            <Route path="/explore" element={<ClientSearchSection />} />
            
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
          </Route>

          {/* --- ROTAS DE AUTH & FUNIL --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register-type" element={<RegisterTypeSelection />} />
          <Route path="/register/:userType" element={<RegisterPage />} />
          
          {/* Rotas de Agendamento (Públicas/Híbridas) */}
          <Route path="/schedule/:slug" element={<PublicBookingPage />} />
          <Route path="/book/:providerId" element={<BookingPage />} />

          {/* --- ROTAS PROTEGIDAS (DASHBOARD) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />}>
              <Route path="notifications" element={<Notifications />} />
              
              {/* Mantido no Dashboard para usuários logados usarem a Sidebar */}
              <Route path="explore" element={<ClientSearchSection />} />
              
              {/* Cliente */}
              <Route path="appointments" element={<ClientMyAppointmentsSection />} />
              <Route path="favorites" element={<ClientFavoritesSection />} />
              <Route path="profile" element={<ClientProfileSection />} />
              
              {/* Service Provider (Dono) */}
              <Route path="agenda" element={<AgendaView />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="professionals" element={<ProfessionalsManagement />} />
              <Route path="availability" element={<AvailabilityManagement />} />
              <Route path="financial" element={<FinancialManagement />} />
              <Route path="reviews" element={<ReviewsManagement />} />
              <Route path="subscription" element={<SubscriptionManagement />} />
              <Route path="business-profile" element={<ProfileManagement />} />
              
              {/* Professional (Funcionário) */}
              <Route path="home" element={<ProfessionalHome />} />
              <Route path="my-agenda" element={<AgendaView />} />
              <Route path="my-availability" element={<AvailabilityManagement />} />
              <Route path="my-reviews" element={<ReviewsManagement />} />
              <Route path="my-profile" element={<ProfessionalProfileManagement />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;