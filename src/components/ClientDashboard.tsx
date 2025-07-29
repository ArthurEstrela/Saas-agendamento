import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import Booking from './Booking'; // Componente de agendamento separado
import type { Appointment, UserProfile } from '../types';

// Ícone para o cabeçalho
const HeaderIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gray-700 p-2 rounded-lg mr-4">
        {children}
    </div>
);

const ClientDashboard = () => {
  const { userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'myAppointments'>('search');
  
  // Estado para a busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estado para agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  
  // Estado para o fluxo de agendamento
  const [selectedProfessional, setSelectedProfessional] = useState<UserProfile | null>(null);

  // Efeito para buscar os agendamentos do cliente
  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(collection(db, 'appointments'), where('clientId', '==', userProfile.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoadingAppointments(true);
      const apptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));

      const appointmentsWithDetails = await Promise.all(apptsData.map(async (appt) => {
        const profDoc = await getDoc(doc(db, "users", appt.serviceProviderId));
        const professionalProfile = profDoc.data() as UserProfile;
        const serviceName = professionalProfile?.services?.find(s => s.id === appt.serviceId)?.name || 'Serviço';
        
        return {
          ...appt,
          professionalName: professionalProfile?.establishmentName || 'Profissional',
          serviceName: serviceName,
          // Adicionando a foto do profissional aos dados do agendamento
          professionalPhotoURL: professionalProfile?.photoURL, 
        };
      }));

      appointmentsWithDetails.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      
      setAppointments(appointmentsWithDetails);
      setLoadingAppointments(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    const q = query(collection(db, 'users'), where('userType', '==', 'serviceProvider'));
    const querySnapshot = await getDocs(q);
    
    let results = querySnapshot.docs.map(doc => doc.data() as UserProfile);

    if (searchTerm) {
        results = results.filter(prof => 
            prof.establishmentName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    setSearchResults(results);
    setIsSearching(false);
  };
  
  if (selectedProfessional) {
    return <Booking professional={selectedProfessional} onBack={() => setSelectedProfessional(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 md:p-8">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center">
            <HeaderIcon>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </HeaderIcon>
            <div>
                <h1 className="text-2xl font-bold text-white">Olá, {userProfile?.displayName}</h1>
                <p className="text-gray-400">Encontre os melhores profissionais</p>
            </div>
        </div>
        <button onClick={logout} className="flex items-center space-x-2 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
            <span>Sair</span>
        </button>
      </header>

      <main>
        <div className="mb-8">
          <div className="flex space-x-2 md:space-x-4 border-b border-gray-700">
            <button onClick={() => setActiveTab('search')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'search' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Buscar Profissional</button>
            <button onClick={() => setActiveTab('myAppointments')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'myAppointments' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Meus Agendamentos</button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
          {activeTab === 'search' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Encontre um profissional</h2>
              <form onSubmit={handleSearch} className="flex items-center gap-4 mb-8">
                <div className="relative flex-grow">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                  </div>
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nome do estabelecimento..." className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
                <button type="submit" disabled={isSearching} className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-500">
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </form>
              
              <div className="space-y-4">
                {searchResults.map(prof => (
                  <div key={prof.uid} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between transition-all hover:shadow-lg hover:bg-gray-600">
                    <div className="flex items-center">
                      <img 
                        src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
                        alt={`Foto de ${prof.establishmentName}`}
                        className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-600"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white">{prof.establishmentName}</h3>
                        <p className="text-gray-400">{prof.segment} - {prof.address || 'Endereço não informado'}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedProfessional(prof)} className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">
                      Agendar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'myAppointments' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Meus Agendamentos</h2>
              {loadingAppointments ? (
                <p className="text-center text-gray-400">Carregando agendamentos...</p>
              ) : appointments.length > 0 ? (
                <ul className="space-y-4">
                  {appointments.map(app => (
                    <li key={app.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div className="flex items-center">
                        <img 
                          src={app.professionalPhotoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
                          alt={`Foto de ${app.professionalName}`}
                          className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-gray-600"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-white">{app.serviceName} às {app.time}</p>
                          <p className="text-sm text-gray-400">com {app.professionalName}</p>
                          <p className="text-sm text-gray-500">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                      }`}>
                          {app.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-400 py-8">Você ainda não possui agendamentos.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
