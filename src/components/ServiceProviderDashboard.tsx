import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu, ShieldAlert, Sparkles } from "lucide-react";

import { useProfileStore } from "../store/profileStore";
// Importe o tipo ProviderDashboardView daqui agora
import type { ServiceProviderProfile, ProviderDashboardView } from "../types";

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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="animate-spin text-amber-500" size={64} />
      </div>
    );
  }

  const disableNav = !isSubscriptionOk && activeView === "subscription";

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      <ServiceProviderSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        disableNav={disableNav}
      />
      <main className="bg-gray-900/65 flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300 flex flex-col">
        {/* Botão de menu para mobile */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 p-2"
          >
            <Menu size={28} />
          </button>
          <span className="text-xl font-bold text-white">Stylo</span>
        </div>

        {needsSubscription && activeView !== "subscription" && (
          <div className="bg-amber-600 text-black p-3 rounded-lg mb-4 text-center font-semibold flex items-center justify-center gap-2">
            <Sparkles size={20} />
            Seu período de teste está ativo.
            <button
              onClick={() => setActiveView("subscription")}
              className="underline font-bold"
            >
              Assine agora
            </button>
            para liberar todos os recursos.
          </div>
        )}

        {subscriptionProblem && activeView !== "subscription" && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center font-semibold flex items-center justify-center gap-2">
            <ShieldAlert size={20} />
            Há um problema com sua assinatura.
            <button
              onClick={() => setActiveView("subscription")}
              className="underline font-bold"
            >
              Regularizar agora
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-grow flex flex-col"
          >
            <ActiveComponent userProfile={profile} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
