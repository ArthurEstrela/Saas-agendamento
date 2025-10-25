import { useProfileStore } from '../store/profileStore';
import ServiceProviderDashboard from '../components/ServiceProviderDashboard';
import { DashboardSkeleton } from '../components/Common/LoadingSpinner';
import { ClientDashboard } from '../components/ClientDashboard';

const DashboardPage = () => {
  const { userProfile, isLoadingProfile, error } = useProfileStore();

  // 1. Estado de Carregamento Inicial
  // Mostra o esqueleto APENAS se estiver carregando E o perfil ainda não existir.
  // Esta é a mudança principal que resolve o problema.
  if (isLoadingProfile && !userProfile) {
    return <DashboardSkeleton />;
  }

  // 2. Estado de Erro
  // Se houver um erro, exibe a mensagem de erro.
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

  // 3. Estado de Perfil Carregado (ou Atualizando em Background)
  // Se o perfil já existe (userProfile não é null), renderiza o dashboard.
  // Mesmo que isLoadingProfile seja true (indicando um refresh), o dashboard
  // não será desmontado, preservando o estado da aba ativa.
  if (userProfile) {
    if (userProfile.role === 'client') {
      return <ClientDashboard />;
    }
    if (userProfile.role === 'serviceProvider') {
      return <ServiceProviderDashboard />;
    }
    // Caso tenha perfil, mas um 'role' desconhecido
    return <div>Tipo de usuário desconhecido.</div>;
  }

  // 4. Estado de Fallback
  // Se não está carregando, não deu erro, mas o perfil é null.
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Perfil não encontrado.</h2>
      </div>
    </div>
  );
};

export default DashboardPage;