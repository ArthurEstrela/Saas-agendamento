import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../context/ToastContext';
import type { Service, Professional } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Edit, Trash2, Tag, Clock, DollarSign, X, Users, AlertTriangle, Loader2 } from 'lucide-react';

// --- TIPOS E INTERFACES ---
type ModalMode = 'add' | 'edit' | 'delete';

interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  service?: Service;
}

// --- VALORES INICIAIS ---
const INITIAL_SERVICE_STATE: Omit<Service, 'id'> = {
  name: '',
  description: '',
  price: 0,
  duration: 0,
  assignedProfessionals: [],
};

// --- COMPONENTE DO MODAL (MAIS INTELIGENTE) ---
const ServiceModal = ({
  state,
  onClose,
  onConfirm,
  isLoading,
  availableProfessionals,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirm: (service: Service | string) => void;
  isLoading: boolean;
  availableProfessionals: Professional[];
}) => {
  const [serviceData, setServiceData] = useState<Omit<Service, 'id'>>(INITIAL_SERVICE_STATE);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);

  useEffect(() => {
    if (state.isOpen) {
      if ((state.mode === 'edit' || state.mode === 'delete') && state.service) {
        setServiceData(state.service);
        setSelectedProfessionals(state.service.assignedProfessionals || []);
      } else {
        setServiceData(INITIAL_SERVICE_STATE);
        setSelectedProfessionals([]);
      }
    }
  }, [state]);

  if (!state.isOpen) return null;

  const handleProfessionalToggle = (professionalId: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação
    if (!serviceData.name.trim() || serviceData.price <= 0 || serviceData.duration <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios com valores válidos.");
      return;
    }

    const finalService: Service = {
      id: state.mode === 'edit' && state.service ? state.service.id : uuidv4(),
      ...serviceData,
      price: Number(serviceData.price),
      duration: Number(serviceData.duration),
      assignedProfessionals: selectedProfessionals,
    };
    onConfirm(finalService);
  };

  const renderContent = () => {
    if (state.mode === 'delete' && state.service) {
      return (
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Confirmar Exclusão</h3>
          <p className="text-gray-300 mb-6">
            Tem certeza que deseja excluir o serviço <strong>"{state.service.name}"</strong>?
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={onClose} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={() => onConfirm(state.service!.id)} disabled={isLoading} className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{state.mode === 'add' ? 'Adicionar Novo Serviço' : 'Editar Serviço'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome, Preço, Duração... */}
          <div className="grid grid-cols-1 gap-4">
            {/* Nome */}
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="text" placeholder="Nome do Serviço" value={serviceData.name} onChange={e => setServiceData(s => ({...s, name: e.target.value}))} required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
            </div>
            {/* Preço */}
            <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="number" placeholder="Preço (R$)" min="0.01" step="0.01" value={serviceData.price || ''} onChange={e => setServiceData(s => ({...s, price: Number(e.target.value)}))} required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
            </div>
             {/* Duração */}
            <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input type="number" placeholder="Duração (minutos)" min="5" step="5" value={serviceData.duration || ''} onChange={e => setServiceData(s => ({...s, duration: Number(e.target.value)}))} required className="w-full bg-gray-800 p-3 pl-10 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
            </div>
          </div>
          {/* Descrição */}
          <div>
            <textarea placeholder="Descrição do serviço (opcional)" value={serviceData.description} onChange={e => setServiceData(s => ({...s, description: e.target.value}))} className="w-full bg-gray-800 p-3 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700 min-h-[80px]"></textarea>
          </div>
          {/* Profissionais */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Users size={20}/> Profissionais que realizam</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-800 rounded-md border border-gray-700">
                {availableProfessionals.length > 0 ? availableProfessionals.map(prof => (
                    <label key={prof.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={selectedProfessionals.includes(prof.id)} onChange={() => handleProfessionalToggle(prof.id)} className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-[#daa520] focus:ring-[#c8961e]" />
                        <span className="text-white">{prof.name}</span>
                    </label>
                )) : <p className="text-gray-400 text-center p-4">Nenhum profissional cadastrado.</p>}
            </div>
          </div>
          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className="bg-[#daa520] hover:bg-[#c8961e] text-black font-semibold px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar'}
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
      <div className="bg-gray-900/80 p-6 sm:p-8 rounded-2xl w-full max-w-lg border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
        {renderContent()}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const ServicesManagement = () => {
  const { userProfile, manageServices } = useAuthStore();
  const { showToast } = useToast();
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: 'add' });
  const [isLoading, setIsLoading] = useState(false);

  // Memoize para evitar re-cálculos desnecessários
  const services = useMemo(() => userProfile?.services || [], [userProfile?.services]);
  const professionals = useMemo(() => userProfile?.professionals || [], [userProfile?.professionals]);

  // Função unificada que lida com salvar, editar e deletar
  const handleModalConfirm = async (data: Service | string) => {
    if (modalState.mode === 'delete') {
      await handleDeleteService(data as string);
    } else {
      await handleSaveService(data as Service);
    }
  };

  const handleSaveService = async (serviceData: Service) => {
    setIsLoading(true);
    try {
      const isEditing = modalState.mode === 'edit';
      const updatedServices = isEditing
        ? services.map(s => (s.id === serviceData.id ? serviceData : s))
        : [...services, serviceData];

      await manageServices(updatedServices);

      showToast(`Serviço ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
      setModalState({ isOpen: false, mode: 'add' });
    } catch (error) {
      showToast('Ocorreu um erro ao salvar o serviço.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const updatedServices = services.filter(s => s.id !== serviceId);
      await manageServices(updatedServices);
      showToast('Serviço excluído com sucesso!', 'success');
      setModalState({ isOpen: false, mode: 'add' });
    } catch (error) {
      showToast('Ocorreu um erro ao excluir o serviço.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <ServiceModal
        state={modalState}
        onClose={() => setModalState({ isOpen: false, mode: 'add' })}
        onConfirm={handleModalConfirm}
        isLoading={isLoading}
        availableProfessionals={professionals}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-white">Gerenciamento de Serviços</h2>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'add' })}
          className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20"
        >
          <PlusCircle className="h-5 w-5" />
          Adicionar Serviço
        </button>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map(service => {
            const assignedProfObjects = professionals.filter(p => 
                service.assignedProfessionals?.includes(p.id)
            );

            return (
              <div key={service.id} className="group relative bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-[#daa520]/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{service.name}</h3>
                        <p className="text-sm text-gray-400 max-w-xs truncate">{service.description || 'Sem descrição'}</p>
                    </div>
                    <div className="text-lg font-bold text-[#daa520]">
                        R${service.price.toFixed(2)}
                    </div>
                </div>
                <div className="border-t border-gray-700 my-4"></div>
                <div className="flex justify-between items-center text-sm text-gray-300">
                    <span className="flex items-center gap-2"><Clock size={16}/> {service.duration} min</span>
                    
                    <div className="flex items-center">
                        {assignedProfObjects.length > 0 ? (
                            <div className="flex items-center -space-x-3">
                                {assignedProfObjects.slice(0, 3).map(prof => (
                                    <img
                                        key={prof.id}
                                        src={prof.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=1f2937&color=daa520`}
                                        alt={prof.name}
                                        title={prof.name}
                                        className="h-8 w-8 rounded-full object-cover border-2 border-gray-900"
                                    />
                                ))}
                                {assignedProfObjects.length > 3 && (
                                    <div className="h-8 w-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white z-10">
                                        +{assignedProfObjects.length - 3}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-gray-500">Nenhum prof.</span>
                        )}
                    </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => setModalState({ isOpen: true, mode: 'edit', service })} className="p-2 bg-blue-600/80 hover:bg-blue-600 rounded-md text-white"><Edit size={16} /></button>
                  <button onClick={() => setModalState({ isOpen: true, mode: 'delete', service })} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-md text-white"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-16 bg-black/30 rounded-xl border border-dashed border-gray-700">
          <Tag size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">Nenhum serviço cadastrado</h3>
          <p className="text-sm mt-2">Comece adicionando os serviços que você oferece.</p>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
