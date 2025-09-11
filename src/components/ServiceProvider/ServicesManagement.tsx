import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useServiceManagementStore } from '../../store/serviceManagementStore';
import type { Service, ServiceProviderProfile } from '../../types';
import { PlusCircle, Edit, Trash2, Scissors, Loader2 } from 'lucide-react';
import { ServiceModal } from './ServiceModal'; // Importa o nosso novo modal

export const ServicesManagement = () => {
  const { userProfile } = useProfileStore();
  const { removeService, isSubmitting } = useServiceManagementStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const services = (userProfile as ServiceProviderProfile)?.services || [];

  const handleOpenModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };
  
  const handleDelete = (service: Service) => {
      if (window.confirm(`Tem certeza que deseja remover o serviço "${service.name}"?`)) {
          if (userProfile?.id) {
              removeService(userProfile.id, service);
          }
      }
  }

  return (
    <>
      <div className="animate-fade-in-down">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Scissors /> Meus Serviços</h1>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">
            <PlusCircle size={20} /> Adicionar Serviço
          </button>
        </div>
        
        {isSubmitting && <div className="flex justify-center my-4"><Loader2 className="animate-spin text-[#daa520]" /></div>}

        <div className="bg-gray-800/70 rounded-xl border border-gray-700">
          <ul className="divide-y divide-gray-700">
            {services.length > 0 ? services.map(service => (
              <li key={service.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{service.name}</p>
                  <p className="text-sm text-gray-400">{service.description}</p>
                  <div className="text-xs text-gray-300 mt-1">
                    <span>{service.duration} min</span>
                    <span className="mx-2">·</span>
                    <span>R$ {service.price.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleOpenModal(service)} className="text-gray-400 hover:text-[#daa520]"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(service)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </li>
            )) : (
              <p className="p-8 text-center text-gray-500">Você ainda não cadastrou nenhum serviço.</p>
            )}
          </ul>
        </div>
      </div>

      {isModalOpen && <ServiceModal service={editingService} onClose={handleCloseModal} />}
    </>
  );
};