// src/components/Dashboard.tsx
import { useAuth } from '../context/AuthContext';
import ServiceProviderDashboard from './ServiceProviderDashboard';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500">A carregar perfil...</div>;
  }

  // Se for um prestador de serviço, mostra o painel específico
  if (userProfile.userType === 'serviceProvider') {
    return <ServiceProviderDashboard />;
  }

  // Se for um cliente, redireciona para a nova experiência de agendamento unificada
  if (userProfile.userType === 'client') {
    return <Navigate to="/booking" replace />;
  }

  // Fallback para caso o tipo de utilizador seja desconhecido
  return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">Tipo de utilizador desconhecido.</div>;
};

export default Dashboard;
