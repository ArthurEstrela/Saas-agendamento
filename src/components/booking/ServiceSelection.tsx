import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { Clock, DollarSign, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ServiceSelection = () => {
  const { provider, service: selectedService, selectService } = useBookingProcessStore();

  if (!provider?.services || provider.services.length === 0) {
    return <p className="text-center text-gray-400">Este estabelecimento não possui serviços cadastrados.</p>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-8">Selecione um Serviço</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {provider.services.map((service) => {
          const isSelected = selectedService?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => selectService(service)} // A store já cuida de avançar a etapa
              className={`relative p-6 bg-black/30 rounded-2xl text-left border-2 transition-all duration-300
                ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 hover:border-gray-600'}
              `}
            >
              {isSelected && <CheckCircle size={24} className="absolute top-4 right-4 text-amber-500" />}
              <h3 className={`text-xl font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>{service.name}</h3>
              <div className="flex items-center gap-4 text-gray-400 mt-2 mb-4">
                <span className="flex items-center gap-1.5 text-sm"><Clock size={16} /> {service.duration} min</span>
                <span className="flex items-center gap-1.5 text-sm"><DollarSign size={16} /> R$ {service.price.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-gray-500 text-sm line-clamp-2">{service.description}</p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};