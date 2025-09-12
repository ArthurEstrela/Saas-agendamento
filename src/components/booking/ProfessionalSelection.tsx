import { useBookingProcessStore } from '../../store/bookingProcessStore';
import { CheckCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfessionalSelection = () => {
  const { provider, service, professional: selectedProfessional, selectProfessional, goToPreviousStep } = useBookingProcessStore();

  const availableProfessionals = provider?.professionals.filter(p =>
    p.services.some(s => s.id === service?.id)
  ) || [];
  
  if (availableProfessionals.length === 0) {
    return (
        <div className="text-center">
            <p className="text-gray-400 mb-4">Nenhum profissional disponível para o serviço selecionado.</p>
            <button onClick={goToPreviousStep} className="secondary-button">Voltar aos Serviços</button>
        </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-8">Escolha o Profissional</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <button
              key={professional.id}
              onClick={() => selectProfessional(professional)} // A store já avança
              className={`relative p-4 flex flex-col items-center gap-4 bg-black/30 rounded-2xl border-2 transition-all duration-300
                ${isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 hover:border-gray-600'}
              `}
            >
              {isSelected && <CheckCircle size={24} className="absolute top-2 right-2 text-amber-500" />}
              <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                {professional.photoURL ? (
                  <img src={professional.photoURL} alt={professional.name} className="w-full h-full rounded-full object-cover"/>
                ) : (
                  <User size={48} className="text-gray-500"/>
                )}
              </div>
              <h3 className={`text-lg font-semibold text-center ${isSelected ? 'text-amber-400' : 'text-white'}`}>{professional.name}</h3>
            </button>
          );
        })}
      </div>
      <div className="text-center mt-8">
        <button onClick={goToPreviousStep} className="secondary-button">Voltar</button>
      </div>
    </motion.div>
  );
};