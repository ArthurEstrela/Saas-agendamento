// Em src/components/Professional/ProfessionalDashboard.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types"; // <-- Importa o tipo correto

// 1. Importar a nova SideNav que vamos criar

// 2. Importar apenas os componentes de vista que o profissional usará
//    (Podemos reutilizar os do ServiceProvider, mas vamos filtrá-los por dentro na Fase 4)
import { AgendaView } from "../ServiceProvider/Agenda/AgendaView";
import { AvailabilityManagement } from "../ServiceProvider/AvailabilityManagement";
import { ReviewsManagement } from "../ServiceProvider/ReviewsManagement";
import { Notifications } from "../Common/Notifications";
import { ProfessionalSideNav } from "./ProfessionalSideNav";
import { ProfessionalProfileManagement } from "./ProfessionalProfileManagement";

// 3. Definir as vistas *limitadas* do profissional
export type ProfessionalDashboardView =
  | "agenda"
  | "availability"
  | "reviews"
  | "notifications"
  | "profile";

// 4. Mapear as vistas
const viewComponents: Record<ProfessionalDashboardView, React.ComponentType> = {
  agenda: AgendaView,
  availability: AvailabilityManagement,
  reviews: ReviewsManagement,
  notifications: Notifications,
  profile: ProfessionalProfileManagement,
};

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();
  const [activeView, setActiveView] = useState<ProfessionalDashboardView>("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // 5. Usar o tipo de perfil correto
  const profile = userProfile as ProfessionalProfile | null;

  const ActiveComponent = viewComponents[activeView];

  // 6. Manter um loading simples para o caso de o perfil não estar pronto
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="animate-spin text-amber-500" size={64} />
      </div>
    );
  }

  // 7. LÓGICA DE SUBSCRIÇÃO REMOVIDA (useEffect, status, banners...)

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      
      {/* 8. Usar a nova SideNav */}
      <ProfessionalSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
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

        {/* 9. BANNERS DE SUBSCRIÇÃO REMOVIDOS */}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-grow flex flex-col"
          >
            {/* 10. Passar o perfil para o componente filho (IMPORTANTE para Fase 4) */}
            <ActiveComponent userProfile={profile} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;