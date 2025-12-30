import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Adicionado
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu, ShieldAlert, Sparkles } from "lucide-react";
import logo from "../assets/stylo-logo.png"; // Adicionado para padronizar

import { useProfileStore } from "../store/profileStore";
import type { ServiceProviderProfile, ProviderDashboardView } from "../types";

// Componentes internos
import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";
import { AgendaView } from "./ServiceProvider/Agenda/AgendaView";
import { FinancialManagement } from "./ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./ServiceProvider/ProfileManagement";
import { ServicesManagement } from "./ServiceProvider/ServicesManagement";
import { ReviewsManagement } from "./ServiceProvider/ReviewsManagement";
import { Notifications } from "./Common/Notifications";
import { SubscriptionManagement } from "./ServiceProvider/SubscriptionManagement";
import { OnboardingChecklist } from "./ServiceProvider/OnboardingChecklist";

// UI
import { Button } from "./ui/button"; // Adicionado para padronizar o botão do menu

interface DashboardViewProps {
  userProfile: ServiceProviderProfile | null;
}

const viewComponents: Record<
  ProviderDashboardView,
  React.ComponentType<DashboardViewProps>
> = {
  agenda: AgendaView as React.ComponentType<DashboardViewProps>,
  financial: FinancialManagement as React.ComponentType<DashboardViewProps>,
  profile: ProfileManagement as React.ComponentType<DashboardViewProps>,
  professionals: ProfessionalsManagement as React.ComponentType<DashboardViewProps>,
  availability: AvailabilityManagement as React.ComponentType<DashboardViewProps>,
  services: ServicesManagement as React.ComponentType<DashboardViewProps>,
  reviews: ReviewsManagement as React.ComponentType<DashboardViewProps>,
  notifications: Notifications as React.ComponentType<DashboardViewProps>,
  subscription: SubscriptionManagement as React.ComponentType<DashboardViewProps>,
};

const ServiceProviderDashboard = () => {
  const { userProfile } = useProfileStore();
  const [activeView, setActiveView] = useState<ProviderDashboardView>("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const profile = userProfile as ServiceProviderProfile | null;
  const status = profile?.subscriptionStatus;
  const isSubscriptionOk = status === "active";
  const needsSubscription = !status || status === "trial" || status === "free";
  const subscriptionProblem = status === "past_due" || status === "cancelled";

  useEffect(() => {
    if (profile && !isSubscriptionOk && activeView !== "subscription") {
      setActiveView("subscription");
    }
  }, [profile, isSubscriptionOk, activeView]);

  const ActiveComponent = viewComponents[activeView];

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  const disableNav = !isSubscriptionOk && activeView === "subscription";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* Background Decorativo */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[radial-gradient(circle_at_50%_-20%,rgba(218,165,32,0.08),transparent)]"
        aria-hidden="true"
      />

      <ServiceProviderSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        disableNav={disableNav}
      />

      {/* Conteúdo Principal - Estrutura idêntica ao Client */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        
        {/* Header Mobile Padronizado */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </Button>
        </header>

        {/* Wrapper de Conteúdo com Padding Padronizado */}
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          
          {/* --- CHECKLIST DE ONBOARDING --- */}
          {activeView === "agenda" && (
            <OnboardingChecklist onChangeView={setActiveView} />
          )}

          {/* --- BANNER DE TESTE --- */}
          {needsSubscription && activeView !== "subscription" && (
            <div className="bg-primary/20 border border-primary/30 text-primary-hover p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
              <Sparkles size={20} className="animate-pulse flex-shrink-0" />
              <span className="text-sm sm:text-base">
                Seu período de teste está ativo.{" "}
                <button
                  onClick={() => setActiveView("subscription")}
                  className="underline font-bold hover:text-white transition-colors"
                >
                  Assine agora
                </button>{" "}
                para liberar recursos.
              </span>
            </div>
          )}

          {/* --- BANNER DE PROBLEMA --- */}
          {subscriptionProblem && activeView !== "subscription" && (
            <div className="bg-destructive/20 border border-destructive/30 text-destructive p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <span className="text-sm sm:text-base">
                Há um problema com sua assinatura.{" "}
                <button
                  onClick={() => setActiveView("subscription")}
                  className="underline font-bold hover:text-white transition-colors"
                >
                  Regularizar agora
                </button>
              </span>
            </div>
          )}

          {/* Área da View Dinâmica */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full overflow-hidden"
            >
              <ActiveComponent userProfile={profile} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;