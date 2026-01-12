import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns"; // Importado para calcular dias
import { Timestamp } from "firebase/firestore"; // Necessário para converter data do Firebase

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

  // Check English routes
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
  // -----------------------------------------

  useEffect(() => {
    // Se estiver expirado ou com problema, e não estiver na pág de assinatura, força o redirecionamento?
    // NOTA: Para UX, às vezes deixamos ele ver o dashboard mas com banner de bloqueio.
    // Se quiser bloquear total: descomente abaixo.
    /*
    if (profile && (isExpired || subscriptionProblem) && !isSubscriptionPage) {
       navigate("/dashboard/subscription");
    }
    */
  }, [profile, isExpired, subscriptionProblem, isSubscriptionPage, navigate]);

  const disableNav = !isSubscriptionOk && !isTrial && isSubscriptionPage;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden">
      {/* Background Effect */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[radial-gradient(circle_at_50%_-20%,rgba(218,165,32,0.08),transparent)]"
        aria-hidden="true"
      />

      <ServiceProviderSideNav
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        disableNav={disableNav}
      />

      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu size={24} className="text-gray-300" />
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-6 space-y-6">
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

          {/* --- BANNER 1: TRIAL ATIVO (CONTAGEM REGRESSIVA) --- */}
          {isTrial && !isSubscriptionPage && (
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in-down">
              <div className="flex items-center gap-3 text-center md:text-left">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 hidden sm:block">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center justify-center md:justify-start gap-2">
                    <span className="sm:hidden">
                      <Clock size={18} />
                    </span>
                    Período de Teste Gratuito
                  </h3>
                  <p className="text-indigo-200 text-sm">
                    Você tem
                    <strong className="text-white text-base">
                      {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                    </strong>
                    restantes para testar todas as funcionalidades Premium.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/subscription")}
                className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-indigo-900/20 shadow-lg w-full md:w-auto"
              >
                Assinar Agora
              </Button>
            </div>
          )}

          {/* --- BANNER 2: TRIAL EXPIRADO (BLOQUEIO) --- */}
          {isExpired && !isSubscriptionPage && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 text-center md:text-left">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 hidden sm:block">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-red-100 flex items-center justify-center md:justify-start gap-2">
                    <span className="sm:hidden">
                      <AlertTriangle size={18} />
                    </span>
                    Seu período de teste acabou
                  </h3>
                  <p className="text-red-300 text-sm">
                    Seus agendamentos públicos estão bloqueados. Assine um plano
                    para continuar recebendo clientes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/subscription")}
                variant="destructive"
                className="w-full md:w-auto font-bold"
              >
                Ver Planos
              </Button>
            </div>
          )}

          {/* --- BANNER 3: PROBLEMA NO PAGAMENTO (MANTIDO) --- */}
          {subscriptionProblem && !isSubscriptionPage && (
            <div className="bg-destructive/20 border border-destructive/30 text-destructive p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <span className="text-sm sm:text-base">
                Há um problema com sua assinatura.{" "}
                <Link
                  to="/dashboard/subscription"
                  className="underline font-bold hover:text-white transition-colors"
                >
                  Regularizar agora
                </Link>
              </span>
            </div>
          )}

          {/* Renderização das Sub-rotas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full overflow-hidden"
            >
              <Outlet context={{ userProfile: profile }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
