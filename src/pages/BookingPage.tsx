import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBookingProcessStore } from "../store/bookingProcessStore";
import { ServiceSelection } from "../components/booking/ServiceSelection";
import { ProfessionalSelection } from "../components/booking/ProfessionalSelection";
import { DateTimeSelection } from "../components/booking/DateTimeSelection";
import { Confirmation } from "../components/booking/Confirmation";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BookingStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Serviços", "Profissional", "Data e Hora", "Confirmação"];
  return (
    <div className="flex items-center justify-center space-x-4 md:space-x-8 my-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isActive = currentStep === stepNumber;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                ${isCompleted ? "bg-[#daa520] text-gray-900" : ""}
                ${
                  isActive
                    ? "bg-amber-500/20 border-2 border-[#daa520] text-[#daa520]"
                    : ""
                }
                ${!isActive && !isCompleted ? "bg-gray-800 text-gray-500" : ""}
              `}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>
            <span
              className={`ml-3 hidden md:block ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const BookingPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const {
    provider,
    currentStep,
    isLoading,
    fetchProviderDetailsById,
    resetBooking,
  } = useBookingProcessStore();

  useEffect(() => {
    const initializeBooking = async () => {
      if (!providerId) {
        return; // Sai se não tiver ID na URL
      }

      // "Espiamos" a memória (store) para ver o que está salvo
      const { provider: currentProviderInStore, isLoading: isStoreLoading } =
        useBookingProcessStore.getState();

      // CASO 1: É o mesmo agendamento que o usuário estava fazendo?
      if (currentProviderInStore?.id === providerId) {
        console.log("Continuando agendamento existente.");

        // CHECAGEM EXTRA: O agendamento salvo ficou travado no "carregando"?
        if (isStoreLoading) {
          console.log(
            "Estado salvo estava 'carregando', buscando dados novamente para destravar."
          );
          // Se sim, a gente busca os dados de novo para garantir que o isLoading seja setado para 'false'.
          await useBookingProcessStore
            .getState()
            .fetchProviderDetailsById(providerId);
        }
        // Se não estava carregando, não fazemos nada e deixamos o progresso salvo aparecer.
        return;
      }

      // CASO 2: É um agendamento novo para um profissional diferente.
      console.log("Iniciando novo agendamento para o provider:", providerId);
      // Resetamos tudo e buscamos os dados do zero.
      useBookingProcessStore.getState().resetBooking();
      await useBookingProcessStore
        .getState()
        .fetchProviderDetailsById(providerId);
    };

    initializeBooking();

    // O efeito só precisa rodar de novo se o ID na URL mudar. Isso quebra qualquer loop.
  }, [providerId]);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection />;
      case 2:
        return <ProfessionalSelection />;
      case 3:
        return <DateTimeSelection />;
      case 4:
        return <Confirmation />;
      default:
        return <ServiceSelection />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader2 className="animate-spin text-[#daa520]" size={64} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white text-center p-4">
        <AlertTriangle size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Prestador Não Encontrado</h1>
        <p className="text-gray-400 mb-8">
          Não conseguimos encontrar o perfil que você está procurando. Verifique
          o link ou tente novamente.
        </p>
        <Link to="/dashboard" className="primary-button">
          Voltar para a Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="h-48 md:h-64 bg-gray-800 relative flex items-center justify-center">
        {provider.logoUrl ? (
          <img
            src={provider.logoUrl}
            alt={provider.businessName}
            className="h-full w-full object-cover opacity-20"
          />
        ) : (
          <Sparkles className="text-amber-500/10 text-9xl" />
        )}
        <div className="absolute text-center">
          <p className="text-[#daa520] text-lg font-semibold">Agendando em</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mt-2">
            {provider.businessName}
          </h1>
        </div>
      </div>
      <div className="container mx-auto p-4 md:p-8">
        <BookingStepper currentStep={currentStep} />
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
