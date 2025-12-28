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
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils/cn";

// --- NOVO STEPPER (Visual Limpo e Integrado) ---
const BookingStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, label: "Serviços" },
    { id: 2, label: "Profissional" },
    { id: 3, label: "Horário" },
    { id: 4, label: "Fim" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 px-4 relative z-20">
      <div className="relative flex items-center justify-between">
        {/* Linha de Fundo (Track) - Mais sutil */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full -z-10" />

        {/* Linha de Progresso (Track Ativa) - Dourado Brilhante */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 shadow-[0_0_15px_#daa520]"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Bolinha do Passo */}
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor:
                    isCompleted || isActive ? "#daa520" : "#18181b", // Dourado vs Zinc-900
                  borderColor: isCompleted || isActive ? "#daa520" : "#27272a", // Dourado vs Zinc-800
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300",
                  isCompleted || isActive
                    ? "text-black shadow-[0_0_20px_rgba(218,165,32,0.6)]" // Brilho mais forte no ativo
                    : "text-gray-500 bg-zinc-900 border-zinc-800"
                )}
              >
                {isCompleted ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </motion.div>

              {/* Texto do Passo (Label) */}
              <div className="absolute top-14 w-32 text-center">
                <span
                  className={cn(
                    "text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-300 block",
                    isActive
                      ? "text-primary drop-shadow-sm"
                      : isCompleted
                      ? "text-gray-400"
                      : "text-gray-600"
                  )}
                >
                  {step.label}
                </span>
              </div>
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
    <Card className="max-w-lg mx-auto bg-[#121214]/80 backdrop-blur-xl border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
      <CardContent className="flex flex-col items-center justify-center text-center p-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
        >
          <CheckCircle size={56} className="text-green-500" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Solicitação Enviada!
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed max-w-sm">
          Seu agendamento foi processado com sucesso. <br />
          Acompanhe os detalhes na sua dashboard.
        </p>
        <Link to="/dashboard">
          <Button
            size="lg"
            className="font-bold gap-2 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 px-8 h-12 rounded-xl"
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
      <div className="flex justify-center items-center min-h-screen bg-[#09090b] relative overflow-hidden">
        {/* Loading Aurora */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[100px] opacity-20 animate-pulse" />
        <Loader2
          className="animate-spin text-primary relative z-10"
          size={64}
        />
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#09090b] text-white p-4 relative overflow-hidden">
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-red-900/10 rounded-full blur-[100px]" />
        <AlertTriangle
          size={64}
          className="text-destructive mb-6 opacity-80 relative z-10"
        />
        <h1 className="text-3xl font-bold mb-2 relative z-10">
          Ops! Algo deu errado
        </h1>
        <p className="text-gray-400 mb-8 max-w-md text-center relative z-10">
          {status.error}
        </p>
        <Link to="/dashboard" className="relative z-10">
          <Button
            variant="outline"
            className="border-white/10 hover:bg-white/5 text-white"
          >
            Voltar para a Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    // FIX: Fundo alterado de 'bg-black' para 'bg-[#09090b]' (mais suave)
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-24 font-sans relative selection:bg-primary/30 overflow-x-hidden">
      {/* --- BACKGROUND AURORA --- 
          Isso remove a sensação de "buraco negro" adicionando luz ambiente
      */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Luz Dourada (Topo Esquerdo) */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary/5 rounded-full blur-[120px] opacity-50" />
        {/* Luz Azulada (Direita) */}
        <div className="absolute top-[10%] right-[-20%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-40" />
        {/* Luz Roxa (Base) */}
        <div className="absolute bottom-[-20%] left-[10%] w-[70vw] h-[70vw] bg-purple-900/5 rounded-full blur-[150px] opacity-40" />
        {/* Textura sutil (Noise) para tirar o aspecto chapado */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Banner do Prestador */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-[#0c0c0e] border-b border-white/5 z-10 shadow-2xl">
        {provider?.bannerUrl ? (
          <img
            src={provider.bannerUrl}
            alt={provider.businessName}
            className="h-full w-full object-cover opacity-50 blur-[3px] scale-105 transition-transform duration-1000 hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c0e] via-black to-[#0c0c0e] flex items-center justify-center opacity-50">
            <Sparkles size={100} className="text-white/5" />
          </div>
        )}

        {/* Overlay Gradiente Suave */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] mb-4 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg"
          >
            Agendamento Online
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-extrabold text-white text-center drop-shadow-2xl px-4 tracking-tight"
          >
            {provider?.businessName || "Carregando..."}
          </motion.h1>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 -mt-16 relative z-20">
        {status.isSuccess && currentStep !== 4 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookingSuccess />
          </motion.div>
        ) : (
          <>
            {/* Stepper flutuante sem fundo em volta */}
            <BookingStepper currentStep={currentStep} />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};
