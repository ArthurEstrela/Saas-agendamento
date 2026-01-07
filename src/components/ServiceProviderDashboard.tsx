import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ShieldAlert, Sparkles } from "lucide-react";
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
  const isSubscriptionOk = status === "active";
  const needsSubscription = !status || status === "trial" || status === "free";
  const subscriptionProblem = status === "past_due" || status === "cancelled";

  // Check English routes
  const isSubscriptionPage = location.pathname.includes("/subscription");
  const isAgendaPage = location.pathname.includes("/agenda");

  useEffect(() => {
    if (profile && !isSubscriptionOk && !isSubscriptionPage) {
      navigate("/dashboard/subscription");
    }
  }, [profile, isSubscriptionOk, isSubscriptionPage, navigate]);

  const disableNav = !isSubscriptionOk && isSubscriptionPage;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden">
      {/* ... Background code (same as before) ... */}
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
                // Map internal View IDs to English Routes
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

          {needsSubscription && !isSubscriptionPage && (
            <div className="bg-primary/20 border border-primary/30 text-primary-hover p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-down text-center sm:text-left">
              <Sparkles size={20} className="animate-pulse flex-shrink-0" />
              <span className="text-sm sm:text-base">
                Seu período de teste está ativo.{" "}
                <Link
                  to="/dashboard/subscription"
                  className="underline font-bold hover:text-white transition-colors"
                >
                  Assine agora
                </Link>{" "}
                para liberar recursos.
              </span>
            </div>
          )}

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
