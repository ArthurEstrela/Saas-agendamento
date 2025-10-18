import type { Professional } from '../../types';
import { Edit, Trash2, Scissors } from 'lucide-react';

interface ProfessionalCardProps {
  professional: Professional;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProfessionalCard = ({ professional, onEdit, onDelete }: ProfessionalCardProps) => {
  return (
    <div className="bg-black/30 rounded-2xl flex flex-col transition-all duration-300 border border-transparent hover:border-amber-500/50 card-hover-effect">
      <div className="p-5 flex-grow">
        {/* Cabeçalho do Card */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={professional.photoURL || `https://ui-avatars.com/api/?name=${professional.name.replace(' ', '+')}&background=1f2937&color=fcd34d`}
            alt={professional.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-amber-500/50"
          />
          <div>
            <h3 className="text-lg font-bold text-white">{professional.name}</h3>
          </div>
        </div>

        {/* Lista de Serviços */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Serviços:</h4>
          <div className="flex flex-wrap gap-2">
            {professional.services.length > 0 ? (
              professional.services.slice(0, 3).map(service => ( // Mostra até 3 serviços
                <span key={service.id} className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-md flex items-center gap-1">
                    <Scissors size={12}/> {service.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">Nenhum serviço associado.</span>
            )}
            {professional.services.length > 3 && (
                <span className="text-xs bg-gray-800 text-amber-400 px-2 py-1 rounded-md">
                    +{professional.services.length - 3} outros
                </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Rodapé com Ações */}
      <div className="bg-black/20 p-3 border-t border-gray-700/50 flex justify-end items-center gap-2">
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={18} /></button>
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-amber-400 transition-colors" title="Editar"><Edit size={18} /></button>
      </div>
    </div>
  );
};