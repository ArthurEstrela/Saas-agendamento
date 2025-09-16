import { useState } from "react";
import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";

// Importe todas as suas seções refatoradas aqui

import { AgendaView } from "./ServiceProvider/AgendaView";
import { FinancialManagement } from "./ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./ServiceProvider/ProfileManagement";
import { ServicesManagement } from "./ServiceProvider/ServicesManagement";
import { ReviewsManagement } from "./ServiceProvider/ReviewsManagement";
// ... importe as outras seções quando estiverem prontas

// Tipagem para garantir que apenas seções válidas sejam chamadas
export type ProviderDashboardView =
  | "agenda"
  | "profile"
  | "services"
  | "professionals"
  | "availability"
  | "financial"
  | "reviews"
  | "notifications";

const ServiceProviderDashboard = () => {
  const [activeView, setActiveView] = useState<ProviderDashboardView>("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

   const renderContent = () => {
    switch (activeView) {
      case "agenda":
        return <AgendaView />;
      case "financial":
        return <FinancialManagement />;
      case "profile":
        return <ProfileManagement onBack={() => setActiveView("agenda")} />;
      case "professionals":
        return <ProfessionalsManagement />;
      case "availability":
        return <AvailabilityManagement />;
      
      // --- 2. ADICIONAR OS CASES FALTANTES ---
      case "services":
        return <ServicesManagement />;
      case "reviews":
        return <ReviewsManagement />;
      case "notifications":
        // Placeholder enquanto não refatoramos a seção de notificações
        return <div>Em breve: Notificações</div>;

      default:
        return <AgendaView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      <ServiceProviderSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />
      <main className="bg-gray-900/65 flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300">
        
          {/* Botão de menu para mobile */}
          <div className="md:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="text-gray-300"
            >
              {/* Substitua por um ícone se preferir, como <Menu size={28} /> */}
            </button>
            <span className="text-xl font-bold text-white">Stylo</span>
          </div>
          {renderContent()}
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
