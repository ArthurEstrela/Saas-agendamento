import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationsStore"; // Importado
import { AnimatePresence, motion } from "framer-motion";

import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/Common/ProtectedRoute";

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

// Lazy imports mantidos...
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const RegisterTypeSelection = lazy(() => import("./pages/RegisterTypeSelection"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const BookingPage = lazy(() => import("./pages/BookingPage").then(module => ({ default: module.BookingPage })));
const PublicBookingPage = lazy(() => import("./pages/PublicBookingPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AboutUs = lazy(() => import("./components/AboutUs"));
const Pricing = lazy(() => import("./components/Pricing"));
const FAQ = lazy(() => import("./components/FAQ"));
const Contact = lazy(() => import("./components/Contact"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./components/TermsOfUse"));
const Features = lazy(() => import("./components/Features"));
const ClientSearchSection = lazy(() => import("./components/Client/ClientSearchSection").then(m => ({ default: m.ClientSearchSection })));
const ClientMyAppointmentsSection = lazy(() => import("./components/Client/ClientMyAppointmentsSection").then(m => ({ default: m.ClientMyAppointmentsSection })));
const ClientFavoritesSection = lazy(() => import("./components/Client/ClientFavoritesSection").then(m => ({ default: m.ClientFavoritesSection })));
const ClientProfileSection = lazy(() => import("./components/Client/ClientProfileSection").then(m => ({ default: m.ClientProfileSection })));
const AgendaView = lazy(() => import("./components/ServiceProvider/Agenda/AgendaView").then(m => ({ default: m.AgendaView })));
const FinancialManagement = lazy(() => import("./components/ServiceProvider/FinancialManagement").then(m => ({ default: m.FinancialManagement })));
const ProfessionalsManagement = lazy(() => import("./components/ServiceProvider/ProfessionalsManagement").then(m => ({ default: m.ProfessionalsManagement })));
const AvailabilityManagement = lazy(() => import("./components/ServiceProvider/AvailabilityManagement").then(m => ({ default: m.AvailabilityManagement })));
const ProfileManagement = lazy(() => import("./components/ServiceProvider/ProfileManagement").then(m => ({ default: m.ProfileManagement })));
const ServicesManagement = lazy(() => import("./components/ServiceProvider/ServicesManagement").then(m => ({ default: m.ServicesManagement })));
const ReviewsManagement = lazy(() => import("./components/ServiceProvider/ReviewsManagement").then(m => ({ default: m.ReviewsManagement })));
const Notifications = lazy(() => import("./components/Common/Notifications").then(m => ({ default: m.Notifications })));
const SubscriptionManagement = lazy(() => import("./components/ServiceProvider/SubscriptionManagement").then(m => ({ default: m.SubscriptionManagement })));
const ProfessionalHome = lazy(() => import("./components/Professional/ProfessionalHome").then(m => ({ default: m.ProfessionalHome })));
const ProfessionalProfileManagement = lazy(() => import("./components/Professional/ProfessionalProfileManagement").then(m => ({ default: m.ProfessionalProfileManagement })));

function App() {
  const location = useLocation();
  const { user } = useAuthStore(); // Pega o usuário logado
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  // NOVO: Monitora notificações globalmente
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user?.uid, fetchNotifications]);

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register-type" element={<RegisterTypeSelection />} />
          <Route path="/register/:userType" element={<RegisterPage />} />
          <Route path="/schedule/:slug" element={<PublicBookingPage />} />
          <Route path="/book/:providerId" element={<BookingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />}>
              <Route path="notifications" element={<Notifications />} />
              <Route path="explore" element={<ClientSearchSection />} />
              <Route path="appointments" element={<ClientMyAppointmentsSection />} />
              <Route path="favorites" element={<ClientFavoritesSection />} />
              <Route path="profile" element={<ClientProfileSection />} />
              <Route path="agenda" element={<AgendaView />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="professionals" element={<ProfessionalsManagement />} />
              <Route path="availability" element={<AvailabilityManagement />} />
              <Route path="financial" element={<FinancialManagement />} />
              <Route path="reviews" element={<ReviewsManagement />} />
              <Route path="subscription" element={<SubscriptionManagement />} />
              <Route path="business-profile" element={<ProfileManagement />} />
              <Route path="home" element={<ProfessionalHome />} />
              <Route path="my-agenda" element={<AgendaView />} />
              <Route path="my-availability" element={<AvailabilityManagement />} />
              <Route path="my-reviews" element={<ReviewsManagement />} />
              <Route path="my-profile" element={<ProfessionalProfileManagement />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default App;