// src/components/booking/ServiceSelection.tsx

import React, { useMemo } from 'react';
import  useBookingStore  from '../../store/bookingStore';
import type { Service } from '../../types';
import { Tag, Loader2, CheckCircle2, Clock, DollarSign, List } from 'lucide-react';

const ServiceSelection = () => {
  // CORREÇÃO: Pedimos `toggleService` do store
  const { serviceProvider, selectedServices, toggleService } = useBookingStore();

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const selectionSummary = useMemo(() => {
    const totalServices = selectedServices.length;
    const totalDuration = selectedServices.reduce((acc, service) => acc + service.duration, 0);
    const totalPrice = selectedServices.reduce((acc, service) => acc + service.price, 0);
    return { totalServices, totalDuration, totalPrice };
  }, [selectedServices]);
  
  if (!serviceProvider) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <Loader2 className="animate-spin text-[#daa520] h-12 w-12 mb-4" />
        <p className="text-white">A carregar serviços disponíveis...</p>
      </div>
    );
  }

  const { services = [] } = serviceProvider;

  if (services.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
        <Tag size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white">Nenhum serviço disponível</h3>
        <p className="text-sm mt-2">Este estabelecimento ainda não cadastrou nenhum serviço.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-down flex flex-col h-full">
      <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">Selecione os Serviços</h2>
          <p className="text-gray-400 mt-1">Você pode escolher um ou mais serviços.</p>
      </div>
      
      <div className="space-y-3 flex-grow max-h-[45vh] overflow-y-auto pr-2 -mr-2">
        {services.map((service) => (
          <div
            key={service.id}
            // CORREÇÃO: Chamando a função correta
            onClick={() => toggleService(service)} 
            className={`relative flex justify-between items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              isServiceSelected(service.id)
                ? 'border-[#daa520] bg-[#daa520]/10 shadow-lg shadow-[#daa520]/10' 
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }`}
          >
            {isServiceSelected(service.id) && (
              <div className="absolute top-2 right-2 text-[#daa520]">
                <CheckCircle2 size={20} />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-lg pr-8">{service.name}</h3>
              <p className="text-gray-400 text-sm">{service.duration} minutos</p>
            </div>
            <div className="font-bold text-white text-lg">
              R$ {service.price.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      {selectionSummary.totalServices > 0 && (
          <div className="mt-6 p-4 bg-gray-800/70 rounded-lg border border-gray-700 animate-fade-in-down">
              <h4 className="text-lg font-semibold text-white mb-3">Resumo da Seleção</h4>
              <div className="flex justify-between items-center text-gray-300">
                  <div className="flex items-center gap-2"><List size={16} /> Total de Serviços:</div>
                  <span className="font-bold text-white">{selectionSummary.totalServices}</span>
              </div>
              <div className="flex justify-between items-center text-gray-300 mt-2">
                  <div className="flex items-center gap-2"><Clock size={16} /> Duração Total:</div>
                  <span className="font-bold text-white">{selectionSummary.totalDuration} min</span>
              </div>
              <div className="border-t border-gray-700 my-3"></div>
              <div className="flex justify-between items-center text-white font-bold text-lg">
                  <div className="flex items-center gap-2"><DollarSign size={18} /> Valor Total:</div>
                  <span className="text-[#daa520]">R$ {selectionSummary.totalPrice.toFixed(2)}</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default ServiceSelection;