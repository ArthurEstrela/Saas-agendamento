import { useEffect } from "react";
import { Routes, Route, useLocation, useLocation, useNavigate } from "react-router-dom";
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

// O componente AuthHandler é onde a mágica acontece
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <-- 2. INICIE O HOOK
  const { user, setUser, userProfile, fetchUserProfile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Se o perfil ainda não foi buscado, busca
        if (!userProfile) {
          await fetchUserProfile(firebaseUser.uid);
        }
        
        // 3. !! LÓGICA DE REDIRECT ATUALIZADA !!
        // Vê se viemos de algum lugar (como a HomePage querendo pagar)
        const from = location.state?.from?.pathname || "/dashboard";
        
        // Se já estávamos no login/register, manda para o 'from'
        if (location.pathname === "/login" || location.pathname === "/register") {
          navigate(from, { replace: true });
        }
        
      } else {
        setUser(null);
        // (aqui você pode adicionar um `Maps("/login")` se quiser
        // forçar o logout para a tela de login)
      }
    });
    return () => unsubscribe();
  }, [user, userProfile, fetchUserProfile, setUser, navigate, location]);

  return null; // Este componente não renderiza nada
};

function App() {
  const location = useLocation();

  // Inicializa o listener de autenticação
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <AuthHandler /> {/* Adiciona o handler de autenticação */}
      <Routes location={location} key={location.pathname}>
        {/* Rotas Públicas com Layout (Header/Footer) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* Adicione outras páginas públicas aqui */}
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

        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
