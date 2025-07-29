import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

const ServicesManagement = () => {
  const { userProfile, updateUserProfile, loading } = useAuth();
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !serviceName || !serviceDuration || !servicePrice) return;

    const newService = {
      id: uuidv4(),
      name: serviceName,
      duration: parseInt(serviceDuration),
      price: parseFloat(servicePrice),
    };

    const updatedServices = [...(userProfile.services || []), newService];
    await updateUserProfile({ services: updatedServices });

    setServiceName('');
    setServiceDuration('');
    setServicePrice('');
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!userProfile) return;
    const updatedServices = userProfile.services?.filter(s => s.id !== serviceId) || [];
    await updateUserProfile({ services: updatedServices });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Serviços</h2>
      <form onSubmit={handleAddService} className="bg-gray-700 p-6 rounded-lg mb-8 space-y-4">
        <h3 className="text-lg font-semibold text-yellow-400">Adicionar Novo Serviço</h3>
        <div>
          <label htmlFor="serviceName" className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
          <input type="text" id="serviceName" value={serviceName} onChange={e => setServiceName(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceDuration" className="block text-sm font-medium text-gray-300 mb-1">Duração (minutos)</label>
            <input type="number" id="serviceDuration" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
          </div>
          <div>
            <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
            <input type="number" step="0.01" id="servicePrice" value={servicePrice} onChange={e => setServicePrice(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
          {loading ? 'Adicionando...' : 'Adicionar Serviço'}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Serviços Cadastrados</h3>
        {userProfile?.services && userProfile.services.length > 0 ? (
          <ul className="space-y-3">
            {userProfile.services.map(service => (
              <li key={service.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{service.name}</p>
                  <p className="text-sm text-gray-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                </div>
                <button onClick={() => handleDeleteService(service.id)} disabled={loading} className="text-red-500 hover:text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">Nenhum serviço cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default ServicesManagement;
