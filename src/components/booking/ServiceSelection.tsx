import { useBookingProcessStore } from '../../store/bookingProcessStore';
import type { Service } from '../../types';

interface ServiceSelectionProps {
  services: Service[];
}

export const ServiceSelection = ({ services }: ServiceSelectionProps) => {
  const { selectService, service: selectedService } = useBookingProcessStore();

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">1. Escolha um Serviço</h2>
      <div className="space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => selectService(service)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedService?.id === service.id
                ? 'border-[#daa520] bg-yellow-50 shadow-md' // Cor do Stylo
                : 'border-gray-200 hover:border-[#daa520]'
            }`}
          >
            <p className="font-bold text-gray-800">{service.name}</p>
            <p className="text-sm text-gray-600">{service.description}</p>
            <div className="text-sm font-semibold mt-2 text-gray-700">
              <span>Duração: {service.duration} min</span>
              <span className="mx-2">|</span>
              <span>Preço: R$ {service.price.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};