import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import type { Appointment, Professional } from "../types";
import logo from "../assets/stylo-logo.png";
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
  Check,
  X,
  UserX,
  CheckCircle,
  AlertTriangle,
  Menu,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "../context/ToastContext";
import AgendaView from "./ServiceProvider/AgendaView";

// Importando os seus componentes de gerenciamento existentes
import ProfileManagement from "./ServiceProvider/ProfileManagement";
import ServicesManagement from "./ServiceProvider/ServicesManagement";
import ProfessionalsManagement from "./ServiceProvider/ProfessionalsManagement";
import AvailabilityManagement from "./ServiceProvider/AvailabilityManagement";
import FinancialManagement from "./ServiceProvider/FinancialManagement";
import ReviewsManagement from "./ServiceProvider/ReviewsManagement";
import Notifications from "./common/Notifications"; // Corrigido o caminho
import ServiceProviderSideNav from "./ServiceProvider/ServiceProviderSideNav";

// --- Subcomponente de Modal de Confirmação ---
const ConfirmationModal = ({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-300 mb-8">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

// --- Subcomponente de Modal para Confirmar Serviço com Preço ---
const CompleteServiceModal = ({ isOpen, appointment, onClose, onConfirm }) => {
  const [price, setPrice] = useState<string>("");
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && appointment?.totalPrice) {
      setPrice(appointment.totalPrice.toFixed(2));
    } else if (isOpen) {
      setPrice("");
    }
  }, [isOpen, appointment]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      showToast("Por favor, insira um valor de preço válido.", "error");
      return;
    }
    onConfirm(appointment, finalPrice);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">
          Confirmar Serviço Concluído
        </h3>
        <p className="text-gray-300 mb-4">
          Serviço:{" "}
          <span className="font-semibold">{appointment?.serviceName}</span>
        </p>
        <p className="text-gray-300 mb-4">
          Cliente:{" "}
          <span className="font-semibold">{appointment?.clientName}</span>
        </p>
        <div className="mb-6">
          <label
            htmlFor="price"
            className="block text-left text-gray-300 text-sm font-semibold mb-2"
          >
            Valor Final do Serviço (R$):
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-[#daa520] focus:border-transparent"
            placeholder="Ex: 50.00"
          />
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Concluir e Registar
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfessionalSelector = ({
  professionals,
  selectedProfId,
  setSelectedProfId,
  includeAllOption = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProfessionalName =
    selectedProfId === "todos"
      ? "Todos os Profissionais"
      : professionals.find((p) => p.id === selectedProfId)?.name ||
        "Selecione um Profissional";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg flex justify-between items-center text-left focus:ring-2 focus:ring-[#daa520] focus:border-[#daa520] transition-all"
      >
        <span className="flex items-center gap-3">
          <User className="text-[#daa520]" size={20} />
          <span className="font-semibold text-white">
            {selectedProfessionalName}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 animate-fade-in-down max-h-60 overflow-y-auto">
          {includeAllOption && (
            <div
              onClick={() => {
                setSelectedProfId("todos");
                setIsOpen(false);
              }}
              className="p-3 hover:bg-gray-700 cursor-pointer flex items-center gap-3 text-white"
            >
              <Users size={20} />
              Todos os Profissionais
            </div>
          )}
          {professionals.map((prof) => (
            <div
              key={prof.id}
              onClick={() => {
                setSelectedProfId(prof.id);
                setIsOpen(false);
              }}
              className="p-3 hover:bg-gray-700 cursor-pointer flex items-center gap-3 text-white"
            >
              {prof.photoURL ? (
                <img
                  src={prof.photoURL}
                  alt={prof.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 p-1 bg-gray-600 rounded-full" />
              )}
              {prof.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Componente Principal do Dashboard ---
const ServiceProviderDashboard = () => {
  const [activeView, setActiveView] = useState("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case "agenda":
        return <AgendaView />;
      case "profile":
        return <ProfileManagement onBack={() => setActiveView("agenda")} />;
      case "services":
        return <ServicesManagement />;
      case "professionals":
        return <ProfessionalsManagement />;
      case "availability":
        return <AvailabilityManagement />;
      case "financial":
        return <FinancialManagement />;
      case "reviews":
        return <ReviewsManagement />;
      case "notifications":
        return <Notifications />;
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
          <div className="md:hidden flex justify-between items-center mb-6">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="text-gray-300"
            >
              <Menu size={28} />
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
