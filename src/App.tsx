// src/App.tsx
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
import ClientDashboard from './components/ClientDashboard'; // 1. Importar

// Componente para proteger rotas que exigem autenticação
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500 text-xl">A carregar...</div>;
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
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
        
        {/* Nova rota principal para o cliente (convidado ou logado) */}
        <Route path="/booking" element={<ClientDashboard />} />

        {/* Rota de Agendamento para um profissional específico */}
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

// Componente auxiliar para redirecionar se o utilizador já estiver logado
const LoginRedirect = () => {
    const { currentUser, loading } = useAuth();
    if (loading) return <div>A carregar...</div>;
    return currentUser ? <Navigate to="/dashboard" replace /> : <Login />;
}

export default App;
