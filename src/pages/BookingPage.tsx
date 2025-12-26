import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBookingProcessStore } from "../store/bookingProcessStore";
import { ServiceSelection } from "../components/booking/ServiceSelection";
import { ProfessionalSelection } from "../components/booking/ProfessionalSelection";
import { DateTimeSelection } from "../components/booking/DateTimeSelection";
import { Confirmation } from "../components/booking/Confirmation";
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils/cn";

// Componente de Stepper
const BookingStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Serviços", "Profissional", "Horário", "Fim"];

  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        {/* Linha de fundo */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-800 -z-10" />

        {/* Linha de progresso */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentStep - 1) / (steps.length - 1) }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;

          return (
            <div
              key={step}
              className="flex flex-col items-center gap-2 bg-gray-900 px-2"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                  isCompleted
                    ? "bg-primary border-primary text-black"
                    : isActive
                    ? "bg-black border-primary text-primary shadow-[0_0_15px_rgba(218,165,32,0.4)] scale-110"
                    : "bg-gray-800 border-gray-700 text-gray-500"
                )}
              >
                {isCompleted ? <CheckCircle size={20} /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block transition-colors",
                  isActive || isCompleted ? "text-white" : "text-gray-500"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Sucesso
const BookingSuccess = () => {
  return (
    <Card className="max-w-lg mx-auto bg-gray-900/50 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
      <CardContent className="flex flex-col items-center justify-center text-center p-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={48} className="text-green-500" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Solicitação Enviada!
        </h2>
        <p className="text-gray-400 mb-8">
          Seu agendamento foi processado com sucesso. Acompanhe o status e
          detalhes na sua dashboard.
        </p>
        <Link to="/dashboard">
          <Button
            size="lg"
            className="font-bold gap-2 bg-green-600 hover:bg-green-500 text-white"
          >
            Ver Meus Agendamentos <ArrowRight size={18} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export const BookingPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const {
    provider,
    currentStep,
    status,
    fetchProviderData,
    resetBookingState,
  } = useBookingProcessStore();

  useEffect(() => {
    if (providerId) fetchProviderData(providerId);
    return () => {
      resetBookingState(false);
    };
  }, [providerId, fetchProviderData, resetBookingState]);

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

  if (status.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white p-4">
        <AlertTriangle size={64} className="text-destructive mb-6 opacity-80" />
        <h1 className="text-3xl font-bold mb-2">Ops! Algo deu errado</h1>
        <p className="text-gray-400 mb-8 max-w-md text-center">
          {status.error}
        </p>
        <Link to="/dashboard">
          <Button>Voltar para a Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gray-900 border-b border-gray-800">
        {provider?.bannerUrl ? (
          <img
            src={provider.bannerUrl}
            alt={provider.businessName}
            className="h-full w-full object-cover opacity-40 blur-[2px]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center opacity-30">
            <Sparkles size={100} />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <span className="text-primary text-sm font-bold uppercase tracking-widest mb-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20">
            Agendamento Online
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center drop-shadow-xl">
            {provider?.businessName || "Carregando..."}
          </h1>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 -mt-10 relative z-10">
        {status.isSuccess && currentStep !== 4 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookingSuccess />
          </motion.div>
        ) : (
          <>
            <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <BookingStepper currentStep={currentStep} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
