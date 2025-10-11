// src/pages/BookingPage.tsx
import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBookingProcessStore } from "../store/bookingProcessStore";
import { ServiceSelection } from "../components/booking/ServiceSelection";
import { ProfessionalSelection } from "../components/booking/ProfessionalSelection";
import { DateTimeSelection } from "../components/booking/DateTimeSelection";
import { Confirmation } from "../components/booking/Confirmation";
import { Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Componente de Stepper (sem alterações, já está ótimo)
const BookingStepper = ({ currentStep }: { currentStep: number }) => {
    // ... seu código do stepper aqui ...
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
                                ${isActive ? "bg-amber-500/20 border-2 border-[#daa520] text-[#daa520]" : ""}
                                ${!isActive && !isCompleted ? "bg-gray-800 text-gray-500" : ""}
                            `}
                        >
                            {isCompleted ? "✓" : stepNumber}
                        </div>
                        <span
                            className={`ml-3 hidden md:block ${isActive ? "text-white" : "text-gray-400"}`}
                        >
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};


// Componente de Sucesso para reutilização
const BookingSuccess = () => {
    const navigate = useNavigate();
    return (
        <div className="text-center max-w-lg mx-auto py-10">
            <CheckCircle size={64} className="mx-auto text-green-400 mb-6" />
            <h2 className="text-3xl font-bold text-green-400 mb-4">
                Agendamento Solicitado!
            </h2>
            <p className="text-gray-300 mb-6">
                Sua solicitação foi enviada. Você pode acompanhar o status na sua área de agendamentos.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link to="/dashboard" className="primary-button">
                    Ver Meus Agendamentos
                </Link>
            </div>
        </div>
    );
};


export const BookingPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  
  // ✅ Usando o novo `status` e a ação simplificada
  const {
    provider,
    currentStep,
    status,
    fetchProviderData,
    resetBookingState,
  } = useBookingProcessStore();

  useEffect(() => {
    if (providerId) {
      // ✅ Chamada única e limpa para buscar todos os dados necessários
      fetchProviderData(providerId);
    }
    
    // ✅ Limpa o estado ao desmontar o componente para evitar vazamento de estado
    return () => {
      resetBookingState(false);
    };
  }, [providerId, fetchProviderData, resetBookingState]);

  const renderCurrentStep = () => {
    // ... (seu switch case permanece o mesmo)
    switch (currentStep) {
        case 1: return <ServiceSelection />;
        case 2: return <ProfessionalSelection />;
        case 3: return <DateTimeSelection />;
        case 4: return <Confirmation />;
        default: return <ServiceSelection />;
    }
  };

  // ✅ Conectado ao novo estado de loading
  if (status.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader2 className="animate-spin text-[#daa520]" size={64} />
      </div>
    );
  }

  // ✅ Conectado ao novo estado de erro
  if (status.error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white text-center p-4">
        <AlertTriangle size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Ocorreu um Erro</h1>
        <p className="text-gray-400 mb-8">{status.error}</p>
        <Link to="/dashboard" className="primary-button">
          Voltar para a Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
        {/* ... (Seu JSX de Header/Banner permanece o mesmo) ... */}
        <div className="h-48 md:h-64 bg-gray-800 relative flex items-center justify-center">
            {provider?.bannerUrl ? (
                <img
                    src={provider.bannerUrl}
                    alt={provider.businessName}
                    className="h-full w-full object-cover opacity-20"
                />
            ) : (
                <Sparkles className="text-amber-500/10 text-9xl" />
            )}
            <div className="absolute text-center">
                <p className="text-[#daa520] text-lg font-semibold">Agendando em</p>
                <h1 className="text-4xl md:text-6xl font-bold text-white mt-2">
                    {provider?.businessName}
                </h1>
            </div>
        </div>
        
        <div className="container mx-auto p-4 md:p-8">
            {/* ✅ Se o agendamento foi um sucesso, mostra a tela de sucesso */}
            {status.isSuccess ? (
                <BookingSuccess />
            ) : (
                <>
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
                </>
            )}
        </div>
    </div>
  );
};