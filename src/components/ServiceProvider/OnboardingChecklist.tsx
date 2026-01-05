import { useEffect, useState, useMemo } from "react";
import { useProfileStore } from "../../store/profileStore";
import type {
  ServiceProviderProfile,
  ProviderDashboardView,
  Professional,
} from "../../types";
import {
  CheckCircle2,
  Circle,
  User,
  Scissors,
  CalendarClock,
  Trophy,
  PartyPopper,
  X,
  Users, // Importação do novo ícone
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils/cn";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import confetti from "canvas-confetti";

interface OnboardingChecklistProps {
  onChangeView: (view: ProviderDashboardView) => void;
}

export const OnboardingChecklist = ({
  onChangeView,
}: OnboardingChecklistProps) => {
  const { userProfile, updateUserProfile } = useProfileStore();

  // Estados de verificação
  const [hasAvailability, setHasAvailability] = useState(false);
  const [hasProfessionals, setHasProfessionals] = useState(false); // Novo estado
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // 1. Sincroniza com o banco: Se já estiver marcado como dispensado no perfil, esconde.
  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;
      if (profile.onboardingDismissed) {
        setIsDismissed(true);
      }
    }
  }, [userProfile]);

  // 2. Verificações de Perfil e Serviços (Síncronas / Memória)
  const isProfileComplete = useMemo(() => {
    if (!userProfile || userProfile.role !== "serviceProvider") return false;
    const profile = userProfile as ServiceProviderProfile;
    // Consideramos completo se tiver logo E endereço
    return !!(profile.logoUrl && profile.businessAddress?.street);
  }, [userProfile]);

  const hasServices = useMemo(() => {
    if (!userProfile || userProfile.role !== "serviceProvider") return false;
    const profile = userProfile as ServiceProviderProfile;
    return profile.services && profile.services.length > 0;
  }, [userProfile]);

  // 3. Verificação de Profissionais e Disponibilidade (Assíncrona / Firestore)
  useEffect(() => {
    const checkData = async () => {
      if (!userProfile) return;
      
      try {
        const professionalsRef = collection(
          db,
          "serviceProviders",
          userProfile.id,
          "professionals"
        );
        
        // Buscamos os profissionais
        const q = query(professionalsRef);
        const snap = await getDocs(q);

        // A. Verifica se tem profissionais (equipe)
        const hasTeam = !snap.empty;
        setHasProfessionals(hasTeam);

        // B. Verifica se algum deles tem disponibilidade configurada
        let availabilityConfigured = false;
        if (hasTeam) {
            snap.forEach((doc) => {
            const prof = doc.data() as Professional;
            if (
                prof.availability &&
                prof.availability.some((d) => d.isAvailable)
            ) {
                availabilityConfigured = true;
            }
            });
        }
        setHasAvailability(availabilityConfigured);

      } catch (error) {
        console.error("Erro ao verificar dados do onboarding:", error);
      } finally {
        setIsLoadingCheck(false);
      }
    };

    checkData();
  }, [userProfile]);

  // 4. Definição dos Passos
  const steps = [
    {
      id: "profile",
      title: "Personalizar Perfil",
      description: "Adicione logo e endereço.",
      isCompleted: isProfileComplete,
      icon: User,
      actionView: "profile" as ProviderDashboardView,
      buttonText: "Editar",
    },
    {
      id: "services",
      title: "Cadastrar Serviços",
      description: "Crie seu menu de serviços.",
      isCompleted: hasServices,
      icon: Scissors,
      actionView: "services" as ProviderDashboardView,
      buttonText: "Serviços",
    },
    {
      id: "professionals",
      title: "Cadastrar Equipe",
      description: "Crie ao menos um profissional.",
      isCompleted: hasProfessionals,
      icon: Users,
      actionView: "professionals" as ProviderDashboardView,
      buttonText: "Equipe",
    },
    {
      id: "availability",
      title: "Definir Horários",
      description: "Configure a agenda da equipe.",
      isCompleted: hasAvailability,
      icon: CalendarClock,
      actionView: "availability" as ProviderDashboardView,
      buttonText: "Agenda",
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progress = (completedCount / steps.length) * 100;
  const isAllDone = completedCount === steps.length;

  // 5. Função para fechar e salvar no banco
  const handleDismiss = async () => {
    setIsDismissed(true);

    if (userProfile && userProfile.role === "serviceProvider") {
      try {
        await updateUserProfile(userProfile.id, {
          onboardingDismissed: true,
        } as Partial<ServiceProviderProfile>);
      } catch (error) {
        console.error("Erro ao salvar status do onboarding:", error);
      }
    }
  };

  // Efeito de Confete
  useEffect(() => {
    if (isAllDone && !isDismissed) {
      if (typeof confetti === "function") {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
    }
  }, [isAllDone, isDismissed]);

  // Renderizações Condicionais
  if (isDismissed) return null;

  if (isLoadingCheck && !isAllDone)
    return (
      <div className="w-full h-32 mb-8 bg-gray-900/50 rounded-xl animate-pulse border border-gray-800" />
    );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-8"
      >
        {isAllDone ? (
          // --- ESTADO DE CELEBRAÇÃO ---
          <Card className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500/30 overflow-hidden relative">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-500/20 rounded-full text-green-400 animate-bounce-slow">
                  <PartyPopper size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Tudo pronto para começar!
                  </h2>
                  <p className="text-green-100/80">
                    Seu perfil está configurado. Agora é só esperar os
                    agendamentos chegarem.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDismiss}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-lg shadow-green-900/20 transition-all hover:scale-105"
              >
                Fechar e Começar
              </Button>
            </CardContent>
          </Card>
        ) : (
          // --- ESTADO DE CHECKLIST ---
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-amber-500/20 overflow-hidden relative shadow-xl">
            {/* Barra de Progresso */}
            <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full z-10">
              <motion.div
                className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>

            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Trophy className="text-amber-500" size={20} />
                    Configuração Inicial
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Complete {steps.length} passos para ativar sua agenda.
                  </p>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="text-gray-600 hover:text-gray-300 transition-colors p-1 hover:bg-gray-800 rounded-full"
                  title="Ignorar configuração"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Ajustado para 4 colunas em telas grandes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "relative p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between h-full group",
                      step.isCompleted
                        ? "bg-green-900/10 border-green-500/20"
                        : "bg-gray-800/40 border-gray-700 hover:border-gray-600"
                    )}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            step.isCompleted
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-gray-200"
                          )}
                        >
                          <step.icon size={18} />
                        </div>
                        {step.isCompleted ? (
                          <CheckCircle2 className="text-green-500" size={20} />
                        ) : (
                          <Circle className="text-gray-600 group-hover:text-gray-500" size={20} />
                        )}
                      </div>
                      <h3
                        className={cn(
                          "font-bold text-sm",
                          step.isCompleted ? "text-green-50" : "text-gray-200"
                        )}
                      >
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 mb-4 h-8 line-clamp-2">
                        {step.description}
                      </p>
                    </div>

                    {!step.isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-transparent border-gray-600 hover:bg-amber-500 hover:text-black hover:border-amber-500 text-xs h-8 transition-colors"
                        onClick={() => onChangeView(step.actionView)}
                      >
                        {step.buttonText}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};