import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Professional, Service, Availability } from '../../types';

const storage = getStorage();

const defaultAvailability: Availability = {
  monday: { active: true, startTime: '09:00', endTime: '18:00' },
  tuesday: { active: true, startTime: '09:00', endTime: '18:00' },
  wednesday: { active: true, startTime: '09:00', endTime: '18:00' },
  thursday: { active: true, startTime: '09:00', endTime: '18:00' },
  friday: { active: true, startTime: '09:00', endTime: '18:00' },
  saturday: { active: false, startTime: '09:00', endTime: '18:00' },
  sunday: { active: false, startTime: '09:00', endTime: '18:00' },
};

// Sub-componente para gerenciar os serviços de UM profissional
const ProfessionalServiceManager = ({ professional, onUpdate }: { professional: Professional, onUpdate: (updatedProfessional: Professional) => void }) => {
    const [serviceName, setServiceName] = useState('');
    const [serviceDuration, setServiceDuration] = useState('');
    const [servicePrice, setServicePrice] = useState('');

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        const newService: Service = {
            id: uuidv4(),
            name: serviceName,
            duration: parseInt(serviceDuration),
            price: parseFloat(servicePrice),
        };
        const updatedProfessional = {
            ...professional,
            services: [...(professional.services || []), newService],
        };
        onUpdate(updatedProfessional);
        setServiceName('');
        setServiceDuration('');
        setServicePrice('');
    };

    const handleDeleteService = (serviceId: string) => {
        const updatedServices = professional.services.filter(s => s.id !== serviceId);
        const updatedProfessional = { ...professional, services: updatedServices };
        onUpdate(updatedProfessional);
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="text-md font-semibold text-yellow-400 mb-3">Serviços de {professional.name}</h4>
            <div className="space-y-2 mb-4">
                {professional.services && professional.services.length > 0 ? (
                    professional.services.map(service => (
                        <div key={service.id} className="bg-gray-800 p-2 rounded-md flex justify-between items-center">
                            <div>
                                <p className="text-sm text-white">{service.name}</p>
                                <p className="text-xs text-gray-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                            </div>
                            <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-400 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">Nenhum serviço cadastrado para este profissional.</p>
                )}
            </div>
            <form onSubmit={handleAddService} className="space-y-3 bg-gray-800 p-3 rounded-lg">
                <input type="text" placeholder="Nome do Serviço" value={serviceName} onChange={e => setServiceName(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Duração (min)" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                    <input type="number" step="0.01" placeholder="Preço (R$)" value={servicePrice} onChange={e => setServicePrice(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                </div>
                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-1 px-3 text-sm rounded-lg transition-colors">Adicionar Serviço</button>
            </form>
        </div>
    );
};

const ProfessionalsManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [professionalName, setProfessionalName] = useState('');
  const [isUploading, setIsUploading] = useState<string | null>(null); // Armazena o ID do profissional que está fazendo upload

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !professionalName) return;

    const newProfessional: Professional = {
      id: uuidv4(),
      name: professionalName,
      services: [],
      availability: defaultAvailability,
    };

    const updatedProfessionals = [...(userProfile.professionals || []), newProfessional];
    await updateUserProfile({ professionals: updatedProfessionals });
    setProfessionalName('');
  };

  const handleUpdateProfessional = async (updatedProfessional: Professional) => {
    if (!userProfile) return;
    const updatedProfessionals = userProfile.professionals?.map(p => 
      p.id === updatedProfessional.id ? updatedProfessional : p
    ) || [];
    await updateUserProfile({ professionals: updatedProfessionals });
  };
  
  const handleDeleteProfessional = async (professionalId: string) => {
    if (!userProfile || !window.confirm("Tem certeza que deseja remover este profissional e todos os seus serviços?")) return;
    const updatedProfessionals = userProfile.professionals?.filter(p => p.id !== professionalId) || [];
    await updateUserProfile({ professionals: updatedProfessionals });
  };

  const handleImageUpload = async (file: File, professionalId: string) => {
    if (!userProfile) return;
    setIsUploading(professionalId);

    const professional = userProfile.professionals?.find(p => p.id === professionalId);
    if (!professional) {
        setIsUploading(null);
        return;
    }

    const storageRef = ref(storage, `professional_pictures/${userProfile.uid}/${professionalId}`);
    try {
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        const updatedProfessional = { ...professional, photoURL };
        await handleUpdateProfessional(updatedProfessional);
        alert("Foto atualizada!");
    } catch (error) {
        console.error("Erro no upload da imagem:", error);
        alert("Falha ao enviar a foto.");
    } finally {
        setIsUploading(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Profissionais</h2>
      <form onSubmit={handleAddProfessional} className="bg-gray-700 p-6 rounded-lg mb-8 flex items-center gap-4">
        <input 
            type="text" 
            placeholder="Nome do Novo Profissional" 
            value={professionalName} 
            onChange={e => setProfessionalName(e.target.value)} 
            required 
            className="flex-grow bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" 
        />
        <button type="submit" disabled={loading} className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Profissionais Cadastrados</h3>
        {userProfile?.professionals && userProfile.professionals.length > 0 ? (
          <ul className="space-y-4">
            {userProfile.professionals.map(prof => (
              <li key={prof.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <img src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=?'} alt={`Foto de ${prof.name}`} className="h-16 w-16 rounded-full object-cover border-2 border-gray-600" />
                    <div>
                      <p className="font-semibold text-lg text-white">{prof.name}</p>
                      <label className="text-xs text-yellow-400 cursor-pointer hover:underline">
                        {isUploading === prof.id ? 'Enviando...' : 'Alterar foto'}
                        <input type="file" className="hidden" accept="image/*" disabled={isUploading === prof.id} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], prof.id)} />
                      </label>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProfessional(prof.id)} disabled={loading} className="text-red-500 hover:text-red-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <ProfessionalServiceManager professional={prof} onUpdate={handleUpdateProfessional} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">Nenhum profissional cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default ProfessionalsManagement;
