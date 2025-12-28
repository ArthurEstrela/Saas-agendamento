// src/components/ServiceProviderDashboard.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu, ShieldAlert, Sparkles } from "lucide-react";

import { useProfileStore } from "../store/profileStore";
import type { ServiceProviderProfile, ProviderDashboardView } from "../types";

// Componentes internos (mantendo os imports originais)
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

interface DashboardViewProps {
  userProfile: ServiceProviderProfile | null;
}

// Mapeamento de Views (mantido)
const viewComponents: Record<
  ProviderDashboardView,
  React.ComponentType<DashboardViewProps>
> = {
  agenda: AgendaView as React.ComponentType<DashboardViewProps>,
  financial: FinancialManagement as React.ComponentType<DashboardViewProps>,
  profile: ProfileManagement as React.ComponentType<DashboardViewProps>,
  professionals:
    ProfessionalsManagement as React.ComponentType<DashboardViewProps>,
  availability:
    AvailabilityManagement as React.ComponentType<DashboardViewProps>,
  services: ServicesManagement as React.ComponentType<DashboardViewProps>,
  reviews: ReviewsManagement as React.ComponentType<DashboardViewProps>,
  notifications: Notifications as React.ComponentType<DashboardViewProps>,
  subscription:
    SubscriptionManagement as React.ComponentType<DashboardViewProps>,
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
      // MUDANÇA: h-[100dvh] para garantir centro exato no mobile
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  const disableNav = !isSubscriptionOk && activeView === "subscription";

  return (
    // MUDANÇA: min-h-[100dvh] ao invés de min-h-screen
    <div className="flex min-h-[100dvh] bg-background text-gray-200 font-sans relative overflow-hidden">
      {/* Background Decorativo */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(218,165,32,0.08),transparent)] pointer-events-none"
        aria-hidden="true"
      />

      <ServiceProviderSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        disableNav={disableNav}
      />

      {/* Conteúdo Principal */}
      <main className="flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300 flex flex-col z-10 relative">
        {/* Header Mobile */}
        <div className="md:hidden flex justify-between items-center mb-6 p-4 -mx-4 -mt-4 bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-primary transition-colors p-2"
          >
            <Menu size={28} />
          </button>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Stylo
          </span>
        </div>

        {/* --- BANNER DE TESTE (RESPONSIVO) --- */}
        {needsSubscription && activeView !== "subscription" && (
          // MUDANÇA: flex-col no mobile, flex-row no sm. Text-center no mobile.
          <div className="bg-primary/20 border border-primary/30 text-primary-hover p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
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

        {/* --- BANNER DE PROBLEMA (RESPONSIVO) --- */}
        {subscriptionProblem && activeView !== "subscription" && (
          // MUDANÇA: Mesma lógica de responsividade do banner acima
          <div className="bg-destructive/20 border border-destructive/30 text-destructive p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
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

        {/* Área de Conteúdo da View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-grow flex flex-col w-full max-w-full overflow-hidden" // overflow-hidden previne que tabelas estourem a largura
          >
            <ActiveComponent userProfile={profile} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
