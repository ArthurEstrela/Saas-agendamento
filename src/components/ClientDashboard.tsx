import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import Booking from './Booking'; // Componente de agendamento separado
import type { ProfessionalProfile, Appointment } from '../types'; // Tipos centralizados

const ClientDashboard = () => {
  const { currentUser, userProfile, logout, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState<ProfessionalProfile[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'myAppointments'>('search');

  // Busca agendamentos do cliente
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'appointments'), where('clientId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      // Adicionar lógica para buscar nomes de profissionais, se necessário
      setClientAppointments(appointments);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query(
      collection(db, 'users'),
      where('userType', '==', 'serviceProvider'),
      // Adicionar filtros de busca (podem exigir índices no Firestore)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => doc.data() as ProfessionalProfile);
    setSearchResults(results);
  };

  if (selectedProfessional) {
    return <Booking professional={selectedProfessional} onBack={() => setSelectedProfessional(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-500">Bem-vindo, {userProfile?.displayName}!</h2>
        <button onClick={logout} className="text-red-500">Sair</button>
      </div>

      {/* Abas de Navegação */}
      <div className="flex justify-center border-b border-yellow-700 mb-8">
        <button onClick={() => setActiveTab('search')} className={`py-2 px-4 ${activeTab === 'search' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>
          Buscar Profissional
        </button>
        <button onClick={() => setActiveTab('myAppointments')} className={`py-2 px-4 ${activeTab === 'myAppointments' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>
          Meus Agendamentos
        </button>
      </div>

      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="space-y-4 max-w-lg mx-auto mb-8">
            {/* Campos de busca */}
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nome do profissional" className="w-full p-2 bg-gray-800 rounded"/>
            <input type="text" value={searchCategory} onChange={e => setSearchCategory(e.target.value)} placeholder="Categoria" className="w-full p-2 bg-gray-800 rounded"/>
            <input type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} placeholder="Localização" className="w-full p-2 bg-gray-800 rounded"/>
            <button type="submit" className="w-full bg-yellow-600 p-2 rounded">Buscar</button>
          </form>
          <div className="space-y-4">
            {searchResults.map(prof => (
              <div key={prof.uid} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="text-xl">{prof.displayName}</h3>
                  <p>{prof.segment} - {prof.address}</p>
                </div>
                <button onClick={() => setSelectedProfessional(prof)} className="bg-yellow-500 text-black px-4 py-2 rounded">
                  Agendar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'myAppointments' && (
        <div className="max-w-lg mx-auto">
          <h3 className="text-2xl font-bold text-yellow-500 mb-4">Meus Agendamentos</h3>
          <div className="space-y-4">
            {clientAppointments.map(app => (
              <div key={app.id} className="bg-gray-800 p-4 rounded-lg">
                <p>Data: {app.date} às {app.time}</p>
                <p>Status: {app.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;