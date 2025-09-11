import { useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Para pegar o ID da URL
import { useBookingProcessStore } from '../store/bookingProcessStore';
import { useProviderProfileStore } from '../store/providerProfileStore';
import { ServiceSelection } from '../components/booking/ServiceSelection';
import { ProfessionalSelection } from '../components/booking/ProfessionalSelection';
import { DateTimeSelection } from '../components/booking/DateTimeSelection';
import { Confirmation } from '../components/booking/Confirmation';

const BookingPage = () => {
  // Pega o providerId da URL, ex: /book/:providerId
  const { providerId } = useParams<{ providerId: string }>(); 
  
  const { currentStep, resetBooking } = useBookingProcessStore();
  const { providerProfile, isLoading, error, fetchProviderProfile } = useProviderProfileStore();

  useEffect(() => {
    // Busca o perfil do prestador quando a página carrega
    if (providerId) {
      fetchProviderProfile(providerId);
    }
    // Limpa o estado do agendamento ao sair da página
    return () => {
      resetBooking();
    };
  }, [providerId, fetchProviderProfile, resetBooking]);

  if (isLoading) {
    // Adicione um skeleton aqui para uma UX melhor
    return <div className="text-center p-10">Carregando informações do estabelecimento...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-10">{error}</div>;
  }

  if (!providerProfile) {
    return <div className="text-center p-10">Prestador não encontrado.</div>;
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection services={providerProfile.services || []} />;
      case 2:
        return <ProfessionalSelection professionals={providerProfile.professionals || []} />;
      case 3:
        return <DateTimeSelection />;
      case 4:
        return <Confirmation />;
      default:
        return <div>Passo desconhecido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{providerProfile.businessName}</h1>
            <p className="text-gray-500">Faça seu Agendamento</p>
        </div>
        {/* Aqui você pode adicionar uma barra de progresso */}
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default BookingPage;