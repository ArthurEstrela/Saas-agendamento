import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Timestamp } from "firebase/firestore";

import logo from "../assets/stylo-logo.png";
import { useProfileStore } from "../store/profileStore";
import type { ServiceProviderProfile } from "../types";
import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";
import { OnboardingChecklist } from "./ServiceProvider/OnboardingChecklist";
import { Button } from "./ui/button";

const ServiceProviderDashboard = () => {
  const { userProfile } = useProfileStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const profile = userProfile as ServiceProviderProfile | null;
  const status = profile?.subscriptionStatus;

  // Status Helpers
  const isSubscriptionOk = status === "active" || status === "lifetime";
  const isTrial = status === "trial";
  const isExpired = status === "expired";
  const subscriptionProblem = status === "past_due" || status === "cancelled";

  const isSubscriptionPage = location.pathname.includes("/subscription");
  const isAgendaPage = location.pathname.includes("/agenda");

  // --- LÓGICA DE DIAS RESTANTES DO TRIAL ---
  const getTrialDaysLeft = () => {
    if (!profile?.trialEndsAt) return 0;

    let endDate: Date;
    if (profile.trialEndsAt instanceof Timestamp) {
      endDate = profile.trialEndsAt.toDate();
    } else {
      endDate = new Date(profile.trialEndsAt as Date | string);
    }

    const today = new Date();
    const days = differenceInDays(endDate, today);
    if (days <= 0) return 1;

    return days;
  };

  const daysLeft = isTrial ? getTrialDaysLeft() : 0;

  useEffect(() => {
    // Lógica de redirecionamento forçado (se necessário)
  }, [profile, isExpired, subscriptionProblem, isSubscriptionPage, navigate]);

  const disableNav = !isSubscriptionOk && !isTrial && isSubscriptionPage;

  return (
    // Fundo base consistente e performático
    <div className="flex min-h-screen bg-[#09090b] text-foreground font-sans relative overflow-x-hidden selection:bg-primary/30">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Mobile: Gradiente Estático (Leve) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden" />
        
        {/* Desktop: Efeito Radial Rico */}
        <div
          className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(218,165,32,0.08),transparent)]"
          aria-hidden="true"
        />
      </div>

      <ServiceProviderSideNav
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        disableNav={disableNav}
      />

      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        
        {/* Header Mobile Otimizado: Fundo Sólido */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-[#09090b] sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white active:bg-white/10 touch-manipulation"
          >
            <Menu size={24} />
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-x-hidden">
          {/* Checklist de Onboarding */}
          {isAgendaPage && (
            <OnboardingChecklist
              onChangeView={(view) => {
                const routeMap: Record<string, string> = {
                  services: "/dashboard/services",
                  professionals: "/dashboard/professionals",
                  availability: "/dashboard/availability",
                  financial: "/dashboard/financial",
                  profile: "/dashboard/business-profile",
                };
                if (routeMap[view]) navigate(routeMap[view]);
              }}
            />
          )}

          {/* --- BANNER 1: TRIAL ATIVO --- */}
          {isTrial && !isSubscriptionPage && (
            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3 text-center md:text-left w-full md:w-auto">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 hidden sm:block">
                  <Clock size={24} />
                </div>
                <div className="w-full md:w-auto">
                  <h3 className="font-bold text-white text-base md:text-lg flex items-center justify-center md:justify-start gap-2">
                    <span className="sm:hidden text-indigo-400">
                      <Clock size={18} />
                    </span>
                    Período de Teste Gratuito
                  </h3>
                  <p className="text-indigo-200 text-xs md:text-sm mt-1 md:mt-0">
                    Você tem{" "}
                    <strong className="text-white">
                      {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                    </strong>
                    {" "}restantes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/subscription")}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg h-10 text-sm font-bold touch-manipulation"
              >
                Assinar Agora
              </Button>
            </div>
          )}

          {/* --- BANNER 2: TRIAL EXPIRADO --- */}
          {isExpired && !isSubscriptionPage && (
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center md:text-left w-full md:w-auto">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 hidden sm:block">
                  <AlertTriangle size={24} />
                </div>
                <div className="w-full md:w-auto">
                  <h3 className="font-bold text-red-100 flex items-center justify-center md:justify-start gap-2 text-base md:text-lg">
                    <span className="sm:hidden text-red-500">
                      <AlertTriangle size={18} />
                    </span>
                    Período de teste acabou
                  </h3>
                  <p className="text-red-300 text-xs md:text-sm mt-1">
                    Seus agendamentos públicos estão bloqueados.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/subscription")}
                variant="destructive"
                className="w-full md:w-auto font-bold h-10 text-sm shadow-lg shadow-red-900/10"
              >
                Ver Planos
              </Button>
            </div>
          )}

          {/* --- BANNER 3: PROBLEMA NO PAGAMENTO --- */}
          {subscriptionProblem && !isSubscriptionPage && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <span className="text-sm">
                Há um problema com sua assinatura.{" "}
                <Link
                  to="/dashboard/subscription"
                  className="underline font-bold hover:text-white transition-colors p-1"
                >
                  Regularizar agora
                </Link>
              </span>
            </div>
          )}

          {/* Renderização das Sub-rotas com Animação Otimizada */}
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: -5 }} // Movimento reduzido para mobile
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full will-change-transform" // Dica de performance
              >
                <Outlet context={{ userProfile: profile }} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;