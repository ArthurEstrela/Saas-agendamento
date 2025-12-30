import { useState } from "react";
import { Link } from "react-router-dom"; // Adicionado
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react";
import logo from "../../assets/stylo-logo.png"; // Adicionado para padronizar

import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";

// Componentes
import { AgendaView } from "../ServiceProvider/Agenda/AgendaView";
import { AvailabilityManagement } from "../ServiceProvider/AvailabilityManagement";
import { ReviewsManagement } from "../ServiceProvider/ReviewsManagement";
import { Notifications } from "../Common/Notifications";


// UI
import { Button } from "../ui/button";
import { ProfessionalHome } from "./ProfessionalHome";
import { ProfessionalProfileManagement } from "./ProfessionalProfileManagement";
import { ProfessionalSideNav } from "./ProfessionalSideNav";

export type ProfessionalDashboardView =
  | "home"
  | "agenda"
  | "availability"
  | "reviews"
  | "notifications"
  | "profile";

interface DashboardViewProps {
  userProfile: ProfessionalProfile;
}

const viewComponents: Record<
  ProfessionalDashboardView,
  React.ComponentType<DashboardViewProps>
> = {
  home: ProfessionalHome,
  agenda: AgendaView as React.ComponentType<DashboardViewProps>,
  availability: AvailabilityManagement as React.ComponentType<DashboardViewProps>,
  reviews: ReviewsManagement as React.ComponentType<DashboardViewProps>,
  notifications: Notifications as React.ComponentType<DashboardViewProps>,
  profile: ProfessionalProfileManagement,
};

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();
  const [activeView, setActiveView] = useState<ProfessionalDashboardView>("home");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const profile = userProfile as ProfessionalProfile | null;
  const ActiveComponent = viewComponents[activeView];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* Background Sutil */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-30" />
      </div>

      <ProfessionalSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      {/* Conteúdo Principal Padronizado */}
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

        {/* Wrapper de Conteúdo */}
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ActiveComponent userProfile={profile} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;