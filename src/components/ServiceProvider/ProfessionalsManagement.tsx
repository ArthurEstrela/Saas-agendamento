import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useProfessionalsManagementStore } from '../../store/professionalsManagementStore';
import type { Professional, ServiceProviderProfile } from '../../types';
import { PlusCircle, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { ProfessionalModal } from './ProfessionalModal';

export const ProfessionalsManagement = () => {
  const { userProfile } = useProfileStore();
  const { removeProfessional, isSubmitting } = useProfessionalsManagementStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);

  const professionals = (userProfile as ServiceProviderProfile)?.professionals || [];

  const handleOpenModal = (professional: Professional | null = null) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
  };
  
  const handleDelete = (professional: Professional) => {
      if (window.confirm(`Tem certeza que deseja remover ${professional.name}?`)) {
          if (userProfile?.id) {
              removeProfessional(userProfile.id, professional);
          }
      }
  }

  return (
    <>
      <div className="animate-fade-in-down">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Users /> Meus Profissionais</h1>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e]">
            <PlusCircle size={20} /> Adicionar Profissional
          </button>
        </div>
        
        {isSubmitting && <div className="flex justify-center my-4"><Loader2 className="animate-spin text-[#daa520]" /></div>}

        <div className="bg-gray-800/70 rounded-xl border border-gray-700">
          <ul className="divide-y divide-gray-700">
            {professionals.length > 0 ? professionals.map(prof => (
              <li key={prof.id} className="p-4 flex items-center gap-4">
                <img 
                  src={prof.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=1f2937&color=daa520`}
                  alt={prof.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-gray-700"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-white">{prof.name}</p>
                  <p className="text-sm text-gray-400">
                    {prof.services.map(s => s.name).join(', ')}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleOpenModal(prof)} className="text-gray-400 hover:text-[#daa520]"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(prof)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </li>
            )) : (
              <p className="p-8 text-center text-gray-500">Nenhum profissional cadastrado.</p>
            )}
          </ul>
        </div>
      </div>

      {isModalOpen && <ProfessionalModal professional={editingProfessional} onClose={handleCloseModal} />}
    </>
  );
};