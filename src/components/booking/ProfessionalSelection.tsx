import { useBookingProcessStore } from '../../store/bookingProcessStore';
import type { Professional } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface ProfessionalSelectionProps {
  professionals: Professional[];
}

export const ProfessionalSelection = ({ professionals }: ProfessionalSelectionProps) => {
  const { selectProfessional, professional: selectedProfessional, service, goToPreviousStep } = useBookingProcessStore();

  const availableProfessionals = professionals.filter(p => 
    p.services.some(s => s.id === service?.id)
  );

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">2. Escolha um Profissional</h2>
      <div className="space-y-3">
        {availableProfessionals.map((prof) => (
          <button
            key={prof.id}
            onClick={() => selectProfessional(prof)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 ${
              selectedProfessional?.id === prof.id
                ? 'border-[#daa520] bg-yellow-50 shadow-md'
                : 'border-gray-200 hover:border-[#daa520]'
            }`}
          >
            {/* Adicione a foto do profissional aqui */}
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
            <div>
              <p className="font-bold text-gray-800">{prof.name}</p>
            </div>
          </button>
        ))}
      </div>
      <button onClick={goToPreviousStep} className="mt-6 text-sm text-gray-600 hover:text-black flex items-center gap-2">
        <ArrowLeft size={16} />
        Voltar para Serviços
      </button>
    </div>
  );
};