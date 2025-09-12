import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AnimatePresence } from 'framer-motion';

// Importando os Layouts e Páginas
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import RegisterTypeSelection from './pages/RegisterTypeSelection';
import RegisterPage from './pages/RegisterPage';
import { BookingPage } from './pages/BookingPage';
import PublicBookingPage from './pages/PublicBookingPage';


function App() {
  const location = useLocation();

  // Inicializa o listener de autenticação
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
          {/* Adicione outras páginas públicas aqui */}
        </Route>

        {/* Rotas Públicas sem o Layout Principal */}
         <Route path="/login" element={<LoginPage />} />
        <Route path="/register-type" element={<RegisterTypeSelection />} />
        <Route path="/register/:userType" element={<RegisterPage />} />
        <Route path="/agendar/:slug" element={<PublicBookingPage />} />
        <Route path="/book/:providerId" element={<BookingPage />} />

        {/* Rota Protegida para a Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Adicione outras rotas que precisam de login aqui */}
        </Route>

        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;