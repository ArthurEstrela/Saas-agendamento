import React, { useMemo } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import type { UserProfile, Service, Professional } from '../../types';
import { Check, DollarSign, Clock as DurationIcon } from 'lucide-react';

// Define as propriedades que o componente vai receber
interface ServiceSelectionProps {
  establishment: UserProfile; // O perfil do estabelecimento, que contém os profissionais e serviços
}

const ServiceSelection = ({ establishment }: ServiceSelectionProps) => {
  // Pega o estado e as ações necessárias do nosso store de agendamento
  const { selectedServices, toggleService } = useBookingStore();

  // Lógica para extrair todos os serviços únicos do estabelecimento
  const allServices = useMemo(() => {
    if (!establishment?.professionals) return [];
    const serviceMap = new Map<string, Service>();
    (establishment.professionals as Professional[]).forEach((prof) => {
      (prof.services || []).forEach((service) => {
        if (!serviceMap.has(service.id)) {
          serviceMap.set(service.id, service);
        }
      });
    });
    return Array.from(serviceMap.values());
  }, [establishment]);

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-6">
        1. Escolha o(s) Serviço(s)
      </h2>
      <div className="space-y-4">
        {allServices.length > 0 ? (
          allServices.map((service) => (
            <button
              key={service.id}
              onClick={() => toggleService(service)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 flex justify-between items-center ${
                selectedServices.some((s) => s.id === service.id)
                  ? "bg-[#daa520]/20 border-[#daa520] shadow-lg shadow-[#daa520]/10"
                  : "bg-gray-800 border-gray-700 hover:border-[#daa520]/50"
              }`}
            >
              <div>
                <p className="font-semibold text-white text-lg">{service.name}</p>
                <div className="flex items-center text-sm text-gray-400 gap-2 mt-1">
                  <DurationIcon size={16} /> <span>{service.duration} min</span>
                  <DollarSign size={16} /> <span>R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
              {selectedServices.some((s) => s.id === service.id) && (
                <Check className="text-[#daa520] h-6 w-6" />
              )}
            </button>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            Este estabelecimento ainda não registou serviços.
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
