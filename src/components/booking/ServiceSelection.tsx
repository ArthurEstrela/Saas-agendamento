import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { motion } from 'framer-motion';
import { Check, Plus, ShoppingCart, Clock, DollarSign } from 'lucide-react';
import { useMemo } from 'react';

export const ServiceSelection = () => {
  const { provider, selectedServices, toggleService, goToNextStep } = useBookingProcessStore();

  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalDuration += service.duration;
        acc.totalPrice += service.price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  const hasServices = (provider?.services?.length ?? 0) > 0;
  const isServiceSelected = selectedServices.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-2">Selecione os Serviços</h2>
      <p className="text-center text-gray-400 mb-8">Você pode escolher um ou mais serviços.</p>
      
      <div className="max-w-4xl mx-auto">
        {hasServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {provider!.services!.map((service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleService(service)}
                  className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-200
                    ${isSelected ? 'border-[#daa520] bg-amber-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white pr-2">{service.name}</h3>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                      ${isSelected ? 'bg-[#daa520]' : 'bg-gray-700'}
                    `}>
                      {isSelected ? <Check size={16} className="text-black" /> : <Plus size={16} className="text-gray-400" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                  <div className="flex justify-between items-center mt-4 text-sm">
                    <span className="text-[#daa520] font-semibold">R$ {service.price.toFixed(2)}</span>
                    <span className="text-gray-400">{service.duration} min</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <ShoppingCart size={48} className="mx-auto text-gray-600" />
            <p className="mt-4 text-gray-400">Nenhum serviço disponível no momento.</p>
          </div>
        )}

        {/* --- Resumo e Botão de Avançar --- */}
        <div className="sticky bottom-0 mt-8 py-4 px-6 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className='text-center md:text-left'>
                <h4 className='font-bold text-white'>Resumo do Agendamento</h4>
                <div className='flex items-center gap-4 text-gray-300 mt-1'>
                    <div className='flex items-center gap-1.5'><Clock size={16}/> <span>{totalDuration} min</span></div>
                    <div className='flex items-center gap-1.5'><DollarSign size={16}/> <span>R$ {totalPrice.toFixed(2)}</span></div>
                </div>
            </div>
            <button
                onClick={goToNextStep}
                disabled={!isServiceSelected}
                className="primary-button w-full md:w-auto"
            >
                Avançar
            </button>
        </div>
      </div>
    </motion.div>
  );
};