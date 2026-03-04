import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import ServiceProviderDashboard from "../components/ServiceProviderDashboard";
import { DashboardSkeleton } from "../components/Common/LoadingSpinner";
import { ClientDashboard } from "../components/ClientDashboard";
import ProfessionalDashboard from "../components/Professional/ProfessionalDashboard";
import { Loader2 } from "lucide-react";

const DashboardPage = () => {
  const { user, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireciona "/dashboard" para a sub-rota correta baseada no cargo
  useEffect(() => {
    if (user && location.pathname === "/dashboard") {
      // Capturamos os parâmetros atuais (ex: ?action=review&appointmentId=123)
      const targetSearch = location.search; 

      // ✨ Lemos direto do Enum oficial em UPPERCASE
      const role = user.role;

      if (role === "CLIENT") {
        navigate({ pathname: "/dashboard/explore", search: targetSearch }, { replace: true });
      } else if (role === "SERVICE_PROVIDER") {
        navigate({ pathname: "/dashboard/agenda", search: targetSearch }, { replace: true });
      } else if (role === "PROFESSIONAL") {
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
    // ✨ Comparações diretas. Se 'role' estiver ausente (undefined) durante um recarregamento, não quebra a tela.
    const role = user.role;
    
    if (role === "CLIENT") {
      return <ClientDashboard />;
    }
    if (role === "SERVICE_PROVIDER") {
      return <ServiceProviderDashboard />;
    }
    if (role === "PROFESSIONAL") {
      return <ProfessionalDashboard />;
    }
    
    // Fallback amigável caso o role venha vazio por um microsegundo na atualização de estado
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#09090b] text-gray-400">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p>Atualizando informações do perfil...</p>
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