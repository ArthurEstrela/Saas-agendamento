import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos para os serviços

// Importa o polyfill para crypto.randomUUID se necessário (ambiente Canvas já deve ter)
// if (typeof crypto.randomUUID === 'undefined') {
//   // Polyfill simples para ambientes sem crypto.randomUUID (ex: Node.js mais antigo)
//   // Em ambientes de navegador modernos, crypto.randomUUID é geralmente disponível.
//   // Para o Canvas, v4 as uuidv4 é mais seguro.
// }


const ServicesManagement = () => {
  const { userProfile, updateUserProfile, loading, message, clearMessage } = useAuth();
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState(''); // Em minutos
  const [servicePrice, setServicePrice] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        clearMessage();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.userType !== 'serviceProvider') {
      console.error("Apenas prestadores de serviço podem adicionar serviços.");
      return;
    }
    if (!serviceName || !serviceDuration || !servicePrice) {
      // Usar um modal ou mensagem de erro mais amigável em vez de alert
      console.error("Por favor, preencha todos os campos do serviço.");
      return;
    }

    const newService = {
      id: uuidv4(), // Gera um ID único para o serviço
      name: serviceName,
      duration: parseInt(serviceDuration),
      price: parseFloat(servicePrice),
    };

    const updatedServices = userProfile.services ? [...userProfile.services, newService] : [newService];

    await updateUserProfile({ services: updatedServices });

    // Limpa o formulário
    setServiceName('');
    setServiceDuration('');
    setServicePrice('');
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!userProfile || userProfile.userType !== 'serviceProvider') {
      console.error("Apenas prestadores de serviço podem remover serviços.");
      return;
    }

    const updatedServices = userProfile.services?.filter(service => service.id !== serviceId) || [];
    await updateUserProfile({ services: updatedServices });
  };

  if (userProfile?.userType !== 'serviceProvider') {
    return (
      <div className="text-center text-red-400 p-4">
        Você não tem permissão para gerenciar serviços.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl border border-yellow-600">
      <h3 className="text-2xl font-bold text-yellow-500 mb-6 text-center">Gerenciar Serviços</h3>
      {message && (
        <div className="bg-yellow-800 text-yellow-100 p-3 rounded-md mb-4 text-sm text-center">
          {message}
        </div>
      )}

      {/* Formulário para Adicionar Novo Serviço */}
      <form onSubmit={handleAddService} className="space-y-4 mb-8">
        <div>
          <label htmlFor="serviceName" className="block text-gray-300 text-sm font-bold mb-2">
            Nome do Serviço
          </label>
          <input
            type="text"
            id="serviceName"
            className="shadow appearance-none border border-gray-700 rounded-md w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-700"
            placeholder="Ex: Corte Masculino"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceDuration" className="block text-gray-300 text-sm font-bold mb-2">
              Duração (minutos)
            </label>
            <input
              type="number"
              id="serviceDuration"
              className="shadow appearance-none border border-gray-700 rounded-md w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-700"
              placeholder="Ex: 30"
              value={serviceDuration}
              onChange={(e) => setServiceDuration(e.target.value)}
              required
              min="1"
            />
          </div>
          <div>
            <label htmlFor="servicePrice" className="block text-gray-300 text-sm font-bold mb-2">
              Preço (R$)
            </label>
            <input
              type="number"
              id="servicePrice"
              className="shadow appearance-none border border-gray-700 rounded-md w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-700"
              placeholder="Ex: 50.00"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              required
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar Serviço'}
        </button>
      </form>

      {/* Lista de Serviços Cadastrados */}
      <h4 className="text-xl font-bold text-yellow-400 mb-4">Serviços Cadastrados</h4>
      {userProfile?.services && userProfile.services.length > 0 ? (
        <ul className="space-y-3">
          {userProfile.services.map(service => (
            <li key={service.id} className="bg-gray-700 p-4 rounded-md flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
              <div>
                <p className="text-lg font-semibold text-gray-200">{service.name}</p>
                <p className="text-sm text-gray-400">Duração: {service.duration} min | Preço: R$ {service.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleDeleteService(service.id)}
                className="mt-3 sm:mt-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
                disabled={loading}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center">Nenhum serviço cadastrado ainda.</p>
      )}
    </div>
  );
};

export default ServicesManagement;
