import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AnimatePresence } from "framer-motion";

// Layouts e Páginas
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage"; 
import { ProtectedRoute } from "./components/Common/ProtectedRoute";
import RegisterTypeSelection from "./pages/RegisterTypeSelection";
import RegisterPage from "./pages/RegisterPage";
import { BookingPage } from "./pages/BookingPage";
import PublicBookingPage from "./pages/PublicBookingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";

// Componentes Estáticos
import AboutUs from "./components/AboutUs";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";

// --- COMPONENTS IMPORTS ---
// Client
import { ClientSearchSection } from "./components/Client/ClientSearchSection";
import { ClientMyAppointmentsSection } from "./components/Client/ClientMyAppointmentsSection";
import { ClientFavoritesSection } from "./components/Client/ClientFavoritesSection";
import { ClientProfileSection } from "./components/Client/ClientProfileSection";

// Service Provider & Professional
import { AgendaView } from "./components/ServiceProvider/Agenda/AgendaView";
import { FinancialManagement } from "./components/ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./components/ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./components/ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./components/ServiceProvider/ProfileManagement";
import { ServicesManagement } from "./components/ServiceProvider/ServicesManagement";
import { ReviewsManagement } from "./components/ServiceProvider/ReviewsManagement";
import { Notifications } from "./components/Common/Notifications";
import { SubscriptionManagement } from "./components/ServiceProvider/SubscriptionManagement";
import { ProfessionalHome } from "./components/Professional/ProfessionalHome";
import { ProfessionalProfileManagement } from "./components/Professional/ProfessionalProfileManagement";
import Features from "./components/Features";

function App() {
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes with Layout */}
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

        {/* Auth & Standalone Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register-type" element={<RegisterTypeSelection />} />
        <Route path="/register/:userType" element={<RegisterPage />} />
        <Route path="/schedule/:slug" element={<PublicBookingPage />} />
        <Route path="/book/:providerId" element={<BookingPage />} />

        {/* --- DASHBOARD ROUTES (Standardized in English) --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            
            {/* Common */}
            <Route path="notifications" element={<Notifications />} />

            {/* Client Routes */}
            <Route path="explore" element={<ClientSearchSection />} />
            <Route path="appointments" element={<ClientMyAppointmentsSection />} />
            <Route path="favorites" element={<ClientFavoritesSection />} />
            <Route path="profile" element={<ClientProfileSection />} />

            {/* Service Provider Routes */}
            <Route path="agenda" element={<AgendaView />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="professionals" element={<ProfessionalsManagement />} />
            <Route path="availability" element={<AvailabilityManagement />} />
            <Route path="financial" element={<FinancialManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="subscription" element={<SubscriptionManagement />} />
            <Route path="business-profile" element={<ProfileManagement />} />

            {/* Professional Routes */}
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
  );
}

export default App;