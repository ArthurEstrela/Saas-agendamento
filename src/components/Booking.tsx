// src/components/Booking.tsx

import React, { useEffect } from 'react';
import { useBookingStore } from '../store/bookingStore';
import type { UserProfile } from '../types';
import { 
  ArrowLeft, 
  ChevronRight,
  ListTodo,      // Ícone para Serviços
  Users,         // Ícone para Profissional
  CalendarClock, // Ícone para Data e Hora
  CheckCircle    // Ícone para Confirmação
} from 'lucide-react';

// Importe os componentes de cada etapa
import ServiceSelection from './booking/ServiceSelection';
import ProfessionalSelection from './booking/ProfessionalSelection';
import DateTimeSelection from './booking/DateTimeSelection';
import Confirmation from './booking/Confirmation';

interface BookingProps {
  professional: UserProfile; // Este é o UserProfile do estabelecimento/prestador
  onBack: () => void; // Esta é a função para fechar o modal
}

const Booking = ({ professional: establishment, onBack }: BookingProps) => {
  const {
    currentStep,
    selectedServices,
    selectedProfessional,
    selectedDate,
    selectedTime,
    setServiceProvider,
    goToNextStep,
    goToPreviousStep,
    resetBooking
  } = useBookingStore();

  // Define os ícones para cada etapa
  const bookingSteps = [
    { step: 1, title: 'Serviços', icon: ListTodo },
    { step: 2, title: 'Profissional', icon: Users },
    { step: 3, title: 'Data e Hora', icon: CalendarClock },
    { step: 4, title: 'Confirmação', icon: CheckCircle }
  ];

  useEffect(() => {
    resetBooking();
    if (establishment) {
      setServiceProvider(establishment);
    }
    return () => {
        resetBooking();
    }
  }, [establishment, setServiceProvider, resetBooking]);

  const isNextStepEnabled = () => {
    switch (currentStep) {
      case 1:
        return selectedServices.length > 0;
      case 2:
        return !!selectedProfessional || selectedProfessional === null;
      case 3:
        return !!selectedDate && !!selectedTime;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelection />;
      case 2:
        return <ProfessionalSelection />;
      case 3:
        return <DateTimeSelection />;
      case 4:
        return <Confirmation onBookingConfirmed={onBack} />;
      default:
        return <div>Etapa não encontrada</div>;
    }
  };

  return (
    <div className="bg-gray-900/80 p-6 sm:p-8 rounded-2xl w-full max-w-3xl border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
      <div className="mb-8">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Faça seu Agendamento</h2>
          
          {/* FOTO E NOME DO PRESTADOR */}
          <div className="flex items-center justify-center gap-3 mb-6">
              <img
                  src={establishment.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(establishment.displayName)}&background=2d3748&color=ffffff`}
                  alt={establishment.displayName}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#daa520]"
              />
              <span className="text-xl font-semibold text-white">{establishment.displayName}</span>
          </div>

          {/* INDICADOR DE ETAPAS (AGORA COM ÍCONES) */}
          <div className="flex justify-between items-center max-w-md mx-auto">
              {bookingSteps.map((step, index) => {
                  const IconComponent = step.icon; // Pega o componente do ícone
                  return (
                      <React.Fragment key={step.step}>
                          <div className="flex flex-col items-center text-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${currentStep >= step.step ? 'bg-[#daa520] text-black border-[#daa520]' : 'bg-gray-700 text-white border-gray-600'}`}>
                                  <IconComponent size={20} /> {/* Renderiza o ícone */}
                              </div>
                              <p className={`mt-2 text-sm font-semibold transition-all duration-300 ${currentStep >= step.step ? 'text-white' : 'text-gray-500'}`}>{step.title}</p>
                          </div>
                          {index < bookingSteps.length - 1 && <div className={`flex-1 h-1 mx-2 ${currentStep > index + 1 ? 'bg-[#daa520]' : 'bg-gray-700'}`}></div>}
                      </React.Fragment>
                  );
              })}
          </div>
      </div>
      
      <div className="mt-8 min-h-[450px]">
        {renderStepContent()}
      </div>

      <div className="flex justify-between mt-8">
        <button
            onClick={currentStep === 1 ? onBack : goToPreviousStep}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
            <ArrowLeft size={20} />
            {currentStep === 1 ? "Cancelar" : "Voltar"}
        </button>

        {currentStep < bookingSteps.length && (
            <button
                onClick={goToNextStep}
                disabled={!isNextStepEnabled()}
                className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
                Próximo <ChevronRight size={20} />
            </button>
        )}
      </div>
    </div>
  );
};

export default Booking;