import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import Booking from './Booking';
import type { Appointment, UserProfile } from '../types';

// Componente de Ícone para o cabeçalho
const HeaderIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gray-700 p-2 rounded-lg mr-4">
        {children}
    </div>
);

const ClientDashboard = () => {
  // Puxa todas as funções necessárias do contexto
  const { userProfile, logout, toggleFavorite, cancelAppointment } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'myAppointments' | 'favorites'>('search');
  
  // Estados para a busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para os agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  
  // Estado para o fluxo de agendamento
  const [selectedProfessional, setSelectedProfessional] = useState<UserProfile | null>(null);

  // Estados para os favoritos
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<UserProfile[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

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
          professionalPhotoURL: professionalProfile?.photoURL, 
          cancellationPolicyMinutes: professionalProfile?.cancellationPolicyMinutes,
        };
      }));
      appointmentsWithDetails.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      setAppointments(appointmentsWithDetails);
      setLoadingAppointments(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  // Efeito para buscar os perfis dos profissionais favoritos
  useEffect(() => {
    const fetchFavorites = async () => {
        if (!userProfile?.favoriteProfessionals || userProfile.favoriteProfessionals.length === 0) {
            setFavoriteProfessionals([]);
            return;
        }
        setLoadingFavorites(true);
        try {
            const q = query(collection(db, 'users'), where(documentId(), 'in', userProfile.favoriteProfessionals));
            const querySnapshot = await getDocs(q);
            const favsData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
            setFavoriteProfessionals(favsData);
        } catch (error) {
            console.error("Erro ao buscar favoritos:", error);
            setFavoriteProfessionals([]);
        } finally {
            setLoadingFavorites(false);
        }
    };
    if (activeTab === 'favorites') {
        fetchFavorites();
    }
  }, [userProfile, activeTab]);

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

  // Função para checar se o agendamento pode ser cancelado
  const canCancelAppointment = (appDate: string, appTime: string, policyMinutes?: number) => {
    // Se o profissional não definiu uma regra, usamos 30 minutos como padrão
    const cancellationMinutes = policyMinutes ?? 30;
    const appointmentDateTime = new Date(`${appDate}T${appTime}`);
    const now = new Date();
    const policyInMillis = cancellationMinutes * 60 * 1000;
    return (appointmentDateTime.getTime() - now.getTime()) > policyInMillis;
  };

  // Função para renderizar um card de profissional (evita repetição de código)
  const renderProfessionalCard = (prof: UserProfile) => {
    const isFavorite = userProfile?.favoriteProfessionals?.includes(prof.uid);
    return (
        <div key={prof.uid} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between transition-all hover:shadow-lg hover:bg-gray-600">
            <div className="flex items-center flex-grow min-w-0">
              <img 
                src={prof.photoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
                alt={`Foto de ${prof.establishmentName}`}
                className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-600"
              />
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{prof.establishmentName}</h3>
                <p className="text-gray-400 truncate">{prof.segment} - {prof.address || 'Endereço não informado'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-4">
                <button onClick={() => toggleFavorite(prof.uid)} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-all duration-200 transform hover:scale-110 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
                <button onClick={() => setSelectedProfessional(prof)} className="bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors">
                    Agendar
                </button>
            </div>
        </div>
    );
  };

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
            <button onClick={() => setActiveTab('search')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'search' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Buscar</button>
            <button onClick={() => setActiveTab('myAppointments')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'myAppointments' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Agendamentos</button>
            <button onClick={() => setActiveTab('favorites')} className={`py-3 px-4 font-semibold transition-colors duration-300 ${activeTab === 'favorites' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Favoritos</button>
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
                {isSearching ? <p className="text-center text-gray-400">Buscando...</p> : searchResults.map(renderProfessionalCard)}
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
                  {appointments.map(app => {
                    const isCancellable = canCancelAppointment(app.date, app.time, app.cancellationPolicyMinutes) && app.status !== 'cancelled';
                    return (
                      <li key={app.id} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex items-center mb-3 sm:mb-0 flex-grow">
                          <img 
                            src={app.professionalPhotoURL || 'https://placehold.co/150x150/1F2937/4B5563?text=Foto'} 
                            alt={`Foto de ${app.professionalName}`}
                            className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-gray-600"
                          />
                          <div>
                            <p className="font-semibold text-white">{app.serviceName} às {app.time}</p>
                            <p className="text-sm text-gray-400">com {app.professionalName}</p>
                            <p className="text-sm text-gray-500">{new Date(`${app.date}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                              app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                          }`}>
                              {app.status === 'cancelled' ? 'Cancelado' : app.status}
                          </span>
                          {isCancellable && (
                            <button 
                              onClick={() => {
                                if (window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
                                  cancelAppointment(app.id);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-gray-400 py-8">Você ainda não possui agendamentos.</p>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Meus Favoritos</h2>
              {loadingFavorites ? (
                  <p className="text-center text-gray-400">Carregando favoritos...</p>
              ) : favoriteProfessionals.length > 0 ? (
                  <div className="space-y-4">
                      {favoriteProfessionals.map(renderProfessionalCard)}
                  </div>
              ) : (
                  <p className="text-center text-gray-400 py-8">Você ainda não adicionou profissionais aos seus favoritos.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
