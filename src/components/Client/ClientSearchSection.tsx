import { useState, useEffect } from 'react';
import { useSearchStore } from '../../store/searchStore';
import { ClientProfessionalCard } from './ClientProfessionalCard';
import { FaSearch } from 'react-icons/fa';
// Importe um skeleton para o card de profissional
// import { ProfessionalCardSkeleton } from './ProfessionalCardSkeleton';

export const ClientSearchSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, isLoading, error, search, clearSearch } = useSearchStore();

  // Limpa a busca quando o componente é desmontado
  useEffect(() => {
    return () => {
      clearSearch();
    };
  }, [clearSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };

  const renderResults = () => {
    if (isLoading) {
      // return <ProfessionalCardSkeleton count={3} />;
      return <div>Buscando...</div>;
    }
    if (error) {
      return <div className="text-red-500 text-center">{error}</div>;
    }
    if (results.length === 0) {
      return <div className="text-center text-gray-500">Nenhum prestador encontrado.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {results.map((prof) => (
          <ClientProfessionalCard key={prof.id} professional={prof} />
        ))}
      </div>
    );
  };

  return (
    <section>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Buscar Prestadores</h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nome do salão ou profissional..."
          className="flex-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <FaSearch />
        </button>
      </form>
      
      {renderResults()}
    </section>
  );
};