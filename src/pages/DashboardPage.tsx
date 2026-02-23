import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// ✨ Substituído useProfileStore pelo useAuthStore
import { useAuthStore } from "../store/authStore";
import ServiceProviderDashboard from "../components/ServiceProviderDashboard";
import { DashboardSkeleton } from "../components/Common/LoadingSpinner";
import { ClientDashboard } from "../components/ClientDashboard";
import ProfessionalDashboard from "../components/Professional/ProfessionalDashboard";

const DashboardPage = () => {
  // ✨ Agora tudo vem da store de autenticação unificada
  const { user, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireciona "/dashboard" para a sub-rota correta baseada no cargo
  useEffect(() => {
    if (user && location.pathname === "/dashboard") {
      // Capturamos os parâmetros atuais (ex: ?action=review&appointmentId=123)
      const targetSearch = location.search; 

      // Normaliza o role para lidar com o Enum do Java (ex: 'SERVICE_PROVIDER' -> 'service_provider')
      const role = user.role.toLowerCase();

      if (role === "client") {
        // Passamos o 'search' junto com o pathname para não perder os dados de deep link (ex: avaliações)
        navigate({ pathname: "/dashboard/explore", search: targetSearch }, { replace: true });
      } else if (role === "serviceprovider" || role === "service_provider") {
        navigate({ pathname: "/dashboard/agenda", search: targetSearch }, { replace: true });
      } else if (role === "professional") {
        navigate({ pathname: "/dashboard/home", search: targetSearch }, { replace: true });
      }
    }
  }, [user, location.pathname, navigate, location.search]);

  if (loading && !user) {
    return <DashboardSkeleton />;
  }

  if (error && !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-900/10 text-red-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar perfil</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Renderiza o Dashboard correto baseado no User Role
  if (user) {
    const role = user.role.toLowerCase();
    
    if (role === "client") {
      return <ClientDashboard />;
    }
    if (role === "serviceprovider" || role === "service_provider") {
      return <ServiceProviderDashboard />;
    }
    if (role === "professional") {
      return <ProfessionalDashboard />;
    }
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Tipo de utilizador desconhecido: {user.role}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-950">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-400">Perfil não encontrado.</h2>
      </div>
    </div>
  );
};

export default DashboardPage;