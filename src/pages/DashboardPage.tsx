import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/profileStore";
import ServiceProviderDashboard from "../components/ServiceProviderDashboard";
import { DashboardSkeleton } from "../components/Common/LoadingSpinner";
import { ClientDashboard } from "../components/ClientDashboard";
import ProfessionalDashboard from "../components/Professional/ProfessionalDashboard";

const DashboardPage = () => {
  const { userProfile, isLoadingProfile, error } = useProfileStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireciona "/dashboard" para a sub-rota correta baseada no cargo
  useEffect(() => {
    if (userProfile && location.pathname === "/dashboard") {
      // ✅ CORREÇÃO: Capturamos os parâmetros atuais (ex: ?action=review&id=123)
      const targetSearch = location.search; 

      if (userProfile.role === "client") {
        // ✅ Passamos o 'search' junto com o pathname para não perder os dados
        navigate({ pathname: "/dashboard/explore", search: targetSearch }, { replace: true });
      } else if (userProfile.role === "serviceProvider") {
        navigate({ pathname: "/dashboard/agenda", search: targetSearch }, { replace: true });
      } else if (userProfile.role === "professional") {
        navigate({ pathname: "/dashboard/home", search: targetSearch }, { replace: true });
      }
    }
  }, [userProfile, location.pathname, navigate, location.search]);

  if (isLoadingProfile && !userProfile) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50 text-red-700">
        <h2 className="text-2xl font-bold">Error Loading Profile</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Renderiza o Dashboard correto baseada no User Role
  if (userProfile) {
    if (userProfile.role === "client") {
      return <ClientDashboard />;
    }
    if (userProfile.role === "serviceProvider") {
      return <ServiceProviderDashboard />;
    }
    if (userProfile.role === "professional") {
      return <ProfessionalDashboard />;
    }
    return <div>Unknown user role.</div>;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Profile not found.</h2>
      </div>
    </div>
  );
};

export default DashboardPage;