import { useState } from "react";
import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";

// Importe todas as suas seções refatoradas aqui

import { AgendaView } from "./ServiceProvider/AgendaView";
import { FinancialManagement } from "./ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./ServiceProvider/ProfileManagement";
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
    // A lógica de qual componente renderizar fica centralizada aqui
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
      <main className="flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300">
        <div className="bg-gray-900/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800 min-h-full">
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
        </div>
      </main>
    </div>
  );
};

export default ServiceProviderDashboard;
