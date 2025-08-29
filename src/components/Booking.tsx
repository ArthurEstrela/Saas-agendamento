// src/components/Booking.tsx
import React, { useEffect } from "react";
import { useBookingStore } from "../store/bookingStore";
import type { UserProfile } from "../types";

// Importa os novos componentes de cada etapa
import ServiceSelection from "./booking/ServiceSelection";
import ProfessionalSelection from "./booking/ProfessionalSelection";
import DateTimeSelection from "./booking/DateTimeSelection";
import Confirmation from "./booking/Confirmation";

import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

// Propriedades do componente Booking
interface BookingProps {
  professional: UserProfile; // O perfil do estabelecimento
  onBack?: () => void;
}

// Definição das etapas
const bookingSteps = [
  { id: 1, name: "Serviços", icon: Scissors },
  { id: 2, name: "Profissional", icon: User },
  { id: 3, name: "Data & Hora", icon: CalendarIcon },
  { id: 4, name: "Confirmar", icon: CheckCircle },
];

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  const {
    currentStep,
    resetBooking,
    goToNextStep,
    goToPreviousStep,
    setServiceProvider,
  } = useBookingStore();

  useEffect(() => {
    resetBooking();
    if (establishment) {
      setServiceProvider(establishment);
    }
  }, [establishment, resetBooking, setServiceProvider]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection onNext={goToNextStep} />;
      case 2:
        return <ProfessionalSelection establishment={establishment} />;
      case 3:
        return <DateTimeSelection />;
      case 4:
        return <Confirmation establishment={establishment} />;
      default:
        return null;
    }
  };

  const progressPercentage =
    ((currentStep - 1) / (bookingSteps.length - 1)) * 100;

  return (
    // Adiciona o fade-in na página inteira
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8 animate-fade-in-down">
      {onBack && (
        <header className="flex items-center mb-10">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[#daa520] hover:text-yellow-300 font-semibold"
          >
            <ArrowLeft className="h-6 w-6" />
            <span>Voltar</span>
          </button>
        </header>
      )}

      <main className="max-w-3xl mx-auto bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-800">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center">
            {/* Foto do Prestador de Serviço */}
            <img
              src={
                establishment.photoURL ||
                "https://placehold.co/120x120/1f2937/d1d5db?text=Logo"
              }
              alt={`Foto de ${establishment.companyName}`}
              className="h-24 w-24 rounded-full object-cover border-4 border-yellow-500 shadow-md mb-4"
            />
            {/* Título e nome do estabelecimento centralizados e bem-organizados */}
            <h1 className="text-xl font-semibold text-gray-400">Agendar em</h1>
            <p className="text-3xl text-yellow-500 font-bold mt-1">
              {establishment.companyName}
            </p>
          </div>
        </div>

        <div className="mb-10 relative flex justify-between items-center after:absolute after:inset-x-0 after:top-1/2 after:-translate-y-1/2 after:h-1 after:bg-gray-700 after:z-0">
          <div
            className="absolute top-1/2 left-0 h-1 bg-yellow-500 z-10 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          {bookingSteps.map((step) => {
            const isActive = currentStep >= step.id;
            return (
              <div key={step.id} className="flex flex-col items-center z-20">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-yellow-500 text-gray-900"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <p
                  className={`text-xs mt-2 font-semibold ${
                    isActive ? "text-yellow-500" : "text-gray-400"
                  }`}
                >
                  {step.name}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-700 min-h-[400px]">
          {renderStepContent()}
        </div>

        {currentStep < bookingSteps.length && (
          <div className="flex justify-between mt-8">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Anterior
            </button>
            <button
              onClick={goToNextStep}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              Próximo <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
