import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AnimatePresence } from "framer-motion";

// Importando os Layouts e Páginas
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

// --- NOVAS PÁGINAS IMPORTADAS ---
// (Note que elas estão vindo da pasta /components, conforme sua estrutura)
import AboutUs from "./components/AboutUs";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const location = useLocation();

  // Inicializa o listener de autenticação (Está perfeito)
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Rotas Públicas com Layout (Header/Footer) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* --- ROTAS PÚBLICAS ADICIONADAS --- */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/sobre-nos" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          {/* --- FIM DAS ROTAS ADICIONADAS --- */}
        </Route>

        {/* Rotas Públicas sem o Layout Principal */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register-type" element={<RegisterTypeSelection />} />
        <Route path="/register/:userType" element={<RegisterPage />} />
        <Route path="/agendar/:slug" element={<PublicBookingPage />} />
        <Route path="/book/:providerId" element={<BookingPage />} />

        {/* Rota Protegida para a Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Adicione outras rotas que precisam de login aqui */}
        </Route>

        {/* Rota 404 - Página Não Encontrada */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
