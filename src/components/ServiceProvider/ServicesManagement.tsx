// src/components/ServiceProvider/ServicesManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Service, Professional } from '../../types';
import { Plus, Loader, Scissors, Clock, DollarSign, Users, Trash2, Edit, X } from 'lucide-react';

// --- Componente Principal de Gestão de Serviços ---
const ServicesManagement = () => {
  const { userProfile } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const professionals = useMemo(() => userProfile?.professionals || [], [userProfile]);

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const servicesQuery = collection(db, 'services');
    const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      const fetchedServices = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Service))
        .filter(service => service.serviceProviderId === userProfile.uid);
      setServices(fetchedServices);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleOpenModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSaveService = async (serviceData: Omit<Service, 'id' | 'serviceProviderId'>) => {
    if (!userProfile?.uid) return;
    try {
      if (editingService) {
        // Atualizar serviço existente
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, serviceData);
      } else {
        // Adicionar novo serviço
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          serviceProviderId: userProfile.uid,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    // Usando um modal customizado em vez de window.confirm
    // A lógica de confirmação deve ser implementada em um componente de modal
    try {
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de Serviços</h1>
          <p className="text-gray-400 mt-1">Crie e gerencie os serviços oferecidos no seu estabelecimento.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 font-semibold transition-colors">
          <Plus size={20} /> Criar Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            professionals={professionals} 
            onEdit={() => handleOpenModal(service)}
            onDelete={() => handleDeleteService(service.id)}
          />
        ))}
      </div>

      {services.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <Scissors size={48} className="mx-auto" />
          <h3 className="mt-4 text-xl font-semibold">Nenhum serviço cadastrado</h3>
          <p className="mt-1">Clique em "Criar Serviço" para começar.</p>
        </div>
      )}

      {isModalOpen && (
        <ServiceModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveService}
          professionals={professionals}
          initialData={editingService}
        />
      )}
    </div>
  );
};

// --- Componente Card do Serviço ---
const ServiceCard = ({ service, professionals, onEdit, onDelete }) => {
  const assignedProfessionals = useMemo(() => {
    return professionals.filter(p => service.professionalIds.includes(p.id));
  }, [service, professionals]);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col justify-between p-6 transition-all hover:border-amber-500 hover:shadow-lg">
      <div>
        <h3 className="text-xl font-bold text-white mb-3">{service.name}</h3>
        <div className="flex items-center text-gray-400 text-sm mb-2 gap-4">
          <span className="flex items-center gap-1.5"><DollarSign size={14} /> R$ {service.price.toFixed(2).replace('.', ',')}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} /> {service.duration} min</span>
        </div>
        <p className="text-gray-400 text-sm mb-4 h-10">{service.description}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Users size={16} /> Profissionais</h4>
          <div className="flex items-center space-x-2">
            {assignedProfessionals.map(p => (
              <div key={p.id} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold" title={p.name}>
                {p.name.charAt(0)}
              </div>
            ))}
            {assignedProfessionals.length === 0 && <p className="text-xs text-gray-500">Nenhum</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 border-t border-gray-700 pt-4">
        <button onClick={onDelete} className="w-full text-sm font-semibold text-red-400 hover:text-red-300 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
        <button onClick={onEdit} className="w-full text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors"><Edit size={16} /> Editar</button>
      </div>
    </div>
  );
};

// --- Componente Modal de Serviço ---
const ServiceModal = ({ isOpen, onClose, onSave, professionals, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(initialData?.professionalIds || []);

  const handleProfessionalToggle = (id: string) => {
    setSelectedProfessionals(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, price: parseFloat(price), duration: parseInt(duration), description, professionalIds: selectedProfessionals });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Serviço' : 'Criar Novo Serviço'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="text-sm font-medium text-gray-300">Nome do Serviço</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-300">Preço (R$)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
            <div><label className="text-sm font-medium text-gray-300">Duração (minutos)</label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
          </div>
          <div><label className="text-sm font-medium text-gray-300">Descrição</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea></div>
          <div>
            <label className="text-sm font-medium text-gray-300">Profissionais que realizam este serviço</label>
            <div className="mt-2 grid grid-cols-2 gap-2 p-3 bg-gray-900/50 rounded-lg">
              {professionals.map(prof => (
                <label key={prof.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                  <input type="checkbox" checked={selectedProfessionals.includes(prof.id)} onChange={() => handleProfessionalToggle(prof.id)} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-amber-500 focus:ring-amber-500" />
                  <span className="text-white">{prof.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-700 mt-6"><button type="submit" className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors">Salvar</button></div>
        </form>
      </div>
    </div>
  );
};

export default ServicesManagement;
