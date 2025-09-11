import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Enquanto o estado de autenticação está sendo verificado, não renderiza nada
  if (isLoading) {
    return null; // Ou um spinner de tela cheia, se preferir
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza o componente filho (neste caso, a DashboardPage)
  return <Outlet />;
};