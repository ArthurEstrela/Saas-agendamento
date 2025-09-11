import { useProfileStore } from '../store/profileStore';
import ClientDashboard from '../components/ClientDashboard';
import ServiceProviderDashboard from '../components/ServiceProviderDashboard';
import { DashboardSkeleton } from '../components/Common/LoadingSpinner';


// O tipo é exportado pelo ClientDashboard, mas a página precisa dele
export type { ClientDashboardView } from '../components/ClientDashboard';

const DashboardPage = () => {
  const { userProfile, isLoadingProfile, error } = useProfileStore();

  if (isLoadingProfile) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <div className="text-center text-red-700">
          <h2 className="text-2xl font-bold mb-2">Erro ao Carregar o Perfil</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Perfil não encontrado.</h2>
            </div>
        </div>
    );
  }

  if (userProfile.role === 'client') {
    return <ClientDashboard />;
  }

  if (userProfile.role === 'serviceProvider') {
    return <ServiceProviderDashboard />;
  }

  return <div>Tipo de usuário desconhecido.</div>;
};

export default DashboardPage;