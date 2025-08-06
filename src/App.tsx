import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainAppContent from './components/MainAppContent';
import PublicBookingPage from './components/PublicBookingPage';
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

// Componente para proteger rotas que exigem autenticação
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    // Redireciona para a página de login se o usuário não estiver autenticado
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Componente para redirecionar usuários autenticados da página de login
const LoginRedirect = () => {
  const { currentUser } = useAuth();
  if (currentUser) {
    // Redireciona para o dashboard se o usuário já estiver autenticado
    return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas Públicas com Header e Footer (páginas de marketing, etc.) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/sobre-nos" element={<AboutUs />} />
          <Route path="/contato" element={<Contact />} />
        </Route>

        {/* Rotas da Aplicação (sem o layout de marketing) */}
        <Route path="/login" element={<LoginRedirect />} />
        
        {/* Rota principal para o cliente (convidado ou logado) */}
        {/* Agora, /booking leva ao ClientDashboard, onde a funcionalidade de agendamento é integrada */}
        <Route path="/booking" element={<ClientDashboard />} />

        {/* Rota de Agendamento para um profissional específico (pública) */}
        {/* Esta rota permanece para permitir que usuários não autenticados agendem diretamente via um link público */}
        <Route path="/agendar/:professionalId" element={<PublicBookingPage />} />
        
        {/* Rota Protegida para o Dashboard (decide entre cliente e profissional) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
      </Routes>
    </AuthProvider>
  );
};

export default App;
