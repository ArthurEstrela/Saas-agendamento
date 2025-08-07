// src/components/Client/ClientSearchSection.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { Search, SlidersHorizontal, MapPin, Tag, X, Heart, Calendar } from 'lucide-react'; // Adicionado Calendar
import { db } from '../../firebase/config'; // Ajuste o caminho
import type { UserProfile } from '../../types'; // Ajuste o caminho
import ClientProfessionalCard from './ClientProfessionalCard'; // Importa o novo componente

interface ClientSearchSectionProps {
  currentUser: any; // Firebase User
  userProfile: UserProfile | null;
  handleProtectedAction: (action: () => void) => void;
  toggleFavorite: (professionalId: string) => Promise<void>;
  handleSelectProfessionalForBooking: (prof: UserProfile) => void;
}

const ClientSearchSection: React.FC<ClientSearchSectionProps> = ({
  currentUser,
  userProfile,
  handleProtectedAction,
  toggleFavorite,
  handleSelectProfessionalForBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProviders, setAllProviders] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ segment: '', city: '', date: '' });

  // Fetch de todos os prestadores (público)
  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      const q = query(collection(db, 'users'), where('userType', '==', 'serviceProvider'));
      const querySnapshot = await getDocs(q);
      const providersData = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setAllProviders(providersData);
      setIsLoading(false);
    };
    fetchProviders();
  }, []);

  const filteredResults = useMemo(() => {
    let results = allProviders;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      results = results.filter(provider =>
        provider.establishmentName?.toLowerCase().includes(lowerCaseSearchTerm) ||
        provider.segment?.toLowerCase().includes(lowerCaseSearchTerm) ||
        provider.professionals?.some(p => p.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        provider.professionals?.some(p => p.services.some(s => s.name.toLowerCase().includes(lowerCaseSearchTerm)))
      );
    }

    if (filters.segment) {
      results = results.filter(provider => provider.segment === filters.segment);
    }
    if (filters.city) {
      results = results.filter(provider => provider.address?.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.date) {
      const selectedDay = new Date(filters.date).toDateString();
      results = results.filter(provider =>
        provider.professionals?.some(p =>
          p.availability?.some(a =>
            // Nota: a.date é um campo que você precisaria ter em Professional.availability para este filtro funcionar.
            // Se a disponibilidade é por dia da semana, este filtro de data específica precisaria de uma lógica mais complexa.
            // Assumindo que 'a.date' existe para simplificar.
            new Date(a.date).toDateString() === selectedDay && a.availableTimes.length > 0
          )
        )
      );
    }
    return results;
  }, [searchTerm, filters, allProviders]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const clearFilters = () => { setSearchTerm(''); setFilters({ segment: '', city: '', date: '' }); };

  return (
    <div className="animate-fade-in-down">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white tracking-tight">Encontre o <span className="text-[#daa520]">Stylo</span> perfeito para você</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">Busque por serviços, profissionais ou estabelecimentos e agende o seu horário com facilidade.</p>
      </div>

      <div className="sticky top-0 z-10 bg-gray-900/50 backdrop-blur-md p-4 rounded-xl mb-8 border border-gray-800">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Search className="h-5 w-5 text-gray-400" /></div>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Procure por barbearia, corte de cabelo, nome do profissional..." className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#daa520]" />
        </div>
        <details className="mt-4">
          <summary className="font-semibold text-white cursor-pointer flex items-center gap-2">
            <SlidersHorizontal size={16}/>
            Filtros Avançados
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><Tag size={14}/>Área de Atuação</label><select name="segment" value={filters.segment} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]"><option value="">Todas</option><option>Barbearia</option><option>Salão de Beleza</option><option>Manicure/Pedicure</option><option>Esteticista</option><option>Maquiagem</option><option>Outro</option></select></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><MapPin size={14}/>Cidade</label><input type="text" name="city" placeholder="Ex: Brasília" value={filters.city} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><Calendar size={14}/>Disponível em</label><input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full bg-gray-800 text-white border-gray-700 rounded-md p-2 focus:ring-[#daa520] focus:border-[#daa520]" /></div>
            <div className="flex items-end"><button onClick={clearFilters} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"><X size={16}/>Limpar</button></div>
          </div>
        </details>
      </div>

      {isLoading ? <p className="text-center text-gray-400 py-10">A carregar profissionais...</p> : filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResults.map(prof => (
            <ClientProfessionalCard
              key={prof.uid}
              prof={prof}
              isFavorite={userProfile?.favoriteProfessionals?.includes(prof.uid) || false}
              handleProtectedAction={handleProtectedAction}
              toggleFavorite={toggleFavorite}
              handleSelectProfessionalForBooking={handleSelectProfessionalForBooking}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
          <Search size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">Nenhum resultado encontrado</h3>
          <p className="text-sm mt-2">Tente ajustar a sua busca ou limpar os filtros.</p>
        </div>
      )}
    </div>
  );
};

export default ClientSearchSection;
