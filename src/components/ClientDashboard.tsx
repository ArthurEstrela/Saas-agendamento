import { useState } from "react";
import { ClientSideNav } from "./Client/ClientSideNav";
import { ClientMyAppointmentsSection } from "./Client/ClientMyAppointmentsSection";
import { ClientProfileSection } from "./Client/ClientProfileSection";
import { ClientFavoritesSection } from "./Client/ClientFavoritesSection";
import { ClientSearchSection } from "./Client/ClientSearchSection";

export type ClientDashboardView =
  | "appointments"
  | "profile"
  | "favorites"
  | "search";

const ClientDashboard = () => {
  const [activeView, setActiveView] =
    useState<ClientDashboardView>("appointments");

  const renderActiveView = () => {
    switch (activeView) {
      case "appointments":
        return <ClientMyAppointmentsSection />;
      case "profile":
        return <ClientProfileSection />;
      case "favorites":
        return <ClientFavoritesSection />;
      case "search":
        return <ClientSearchSection />;
      default:
        return <ClientMyAppointmentsSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSideNav activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 p-6 md:p-10">{renderActiveView()}</main>
    </div>
  );
};

export default ClientDashboard;
