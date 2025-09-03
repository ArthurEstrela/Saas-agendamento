import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";
import {
  LayoutDashboard,
  User,
  Scissors,
  Users,
  Clock,
  DollarSign,
  Bell,
  Star,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const NavItem = ({ icon: Icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
      active
        ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
        : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
    }`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
      {text}
    </span>
  </button>
);

const ServiceProviderSideNav = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  const { logout, userProfile } = useAuthStore();
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <div
        className={`w-72 h-screen bg-black p-4 flex flex-col border-r border-gray-800 fixed top-0 left-0 z-40
                       transition-transform duration-300 ease-in-out
                       md:translate-x-0
                       ${isOpen ? "translate-x-0" : "-translate-x-full"}
                      `}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          <Link to="/">
            <img className="h-10 w-auto" src={logo} alt="Stylo" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-grow flex flex-col space-y-2">
          <NavItem
            icon={LayoutDashboard}
            text="Agenda"
            active={activeView === "agenda"}
            onClick={() => setActiveView("agenda")}
          />
          <NavItem
            icon={Scissors}
            text="Serviços"
            active={activeView === "services"}
            onClick={() => setActiveView("services")}
          />
          <NavItem
            icon={Users}
            text="Profissionais"
            active={activeView === "professionals"}
            onClick={() => setActiveView("professionals")}
          />
          <NavItem
            icon={Clock}
            text="Disponibilidade"
            active={activeView === "availability"}
            onClick={() => setActiveView("availability")}
          />
          <NavItem
            icon={Bell}
            text="Notificações"
            active={activeView === "notifications"}
            onClick={() => setActiveView("notifications")}
          />
          <NavItem
            icon={DollarSign}
            text="Financeiro"
            active={activeView === "financial"}
            onClick={() => setActiveView("financial")}
          />
          <NavItem
            icon={Star}
            text="Avaliações"
            active={activeView === "reviews"}
            onClick={() => setActiveView("reviews")}
          />
        </nav>
        <div className="mt-auto">
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center px-2 mb-4">
              <img
                src={
                  userProfile?.photoURL ||
                  "https://placehold.co/150x150/111827/4B5563?text=Foto"
                }
                alt="Sua foto de perfil"
                className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700"
              />
              <div>
                <p className="text-sm font-semibold text-white truncate">
                  {userProfile?.establishmentName || "Nome do Salão"}
                </p>
                <p className="text-xs text-gray-400">Prestador de Serviço</p>
              </div>
            </div>
            <NavItem
              icon={User}
              text="Meu Perfil"
              active={activeView === "profile"}
              onClick={() => setActiveView("profile")}
            />
            <button
              onClick={logout}
              className="flex items-center w-full h-12 px-4 mt-1 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 ease-in-out group"
            >
              <LogOut className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
                Sair
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceProviderSideNav;
