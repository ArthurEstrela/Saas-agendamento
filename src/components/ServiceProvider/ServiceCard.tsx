import type { Service } from '../../types';
import { Edit, Trash2, Clock, DollarSign, AlignLeft } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

export const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  return (
    <div className="bg-black/30 rounded-2xl flex flex-col justify-between transition-all duration-300 border border-transparent hover:border-amber-500/50">
      {/* Corpo do Card */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
        
        <div className="flex items-center gap-4 text-amber-400 mb-4">
          <span className="flex items-center gap-1.5 text-sm">
            <Clock size={16} /> {service.duration} min
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <DollarSign size={16} /> R$ {service.price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <p className="text-gray-400 text-sm line-clamp-3">
            {service.description}
        </p>
      </div>

      {/* Rodapé com Ações */}
      <div className="bg-black/20 p-3 border-t border-gray-700/50 flex justify-end items-center gap-2">
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={18} /></button>
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-amber-400 transition-colors" title="Editar"><Edit size={18} /></button>
      </div>
    </div>
  );
};