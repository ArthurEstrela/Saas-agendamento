import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Note que BrowserRouter não está mais aqui
import { useAuthStore } from './store/authStore';

// Importação dos seus componentes de página
import Home from './components/Home';
import Login from './components/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import ClientDashboard from './components/ClientDashboard';
import PublicBookingPage from './components/PublicBookingPage';

/**
 * Componente para proteger rotas que exigem autenticação.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Componente para a rota de login.
 */
const LoginRedirect = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return null; 
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};


/**
 * Componente principal da aplicação.
 */
function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = checkAuth();
    return () => unsubscribe();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        Carregando...
      </div>
    );
  }

  // O componente agora retorna diretamente as rotas, sem o <Router>
  return (
    <Routes>
      {/* Rotas Públicas com o layout principal (Header/Footer) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/termos-de-uso" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/sobre-nos" element={<AboutUs />} />
        <Route path="/contato" element={<Contact />} />
      </Route>

      {/* Rotas que não usam o AppLayout padrão */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/booking" element={<ClientDashboard />} />
      <Route path="/agendar/:professionalId" element={<PublicBookingPage />} />
      
      {/* Rota Protegida para o Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;
