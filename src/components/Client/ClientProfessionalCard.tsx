// src/components/Client/ClientProfessionalCard.tsx
import React from 'react';
import { Heart, Instagram, Star } from 'lucide-react';
import type { UserProfile } from '../../types'; // Ajuste o caminho conforme a localização real dos tipos

interface ClientProfessionalCardProps {
  prof: UserProfile;
  isFavorite: boolean;
  handleProtectedAction: (action: () => void) => void;
  toggleFavorite: (professionalId: string) => Promise<void>;
  handleSelectProfessionalForBooking: (prof: UserProfile) => void;
}

const ClientProfessionalCard: React.FC<ClientProfessionalCardProps> = ({
  prof,
  isFavorite,
  handleProtectedAction,
  toggleFavorite,
  handleSelectProfessionalForBooking,
}) => {
  const getInstagramUrl = (usernameOrUrl: string) =>
    usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://instagram.com/${usernameOrUrl.replace('@', '')}`;

  return (
    <div key={prof.uid} className="bg-gray-800/80 p-4 rounded-xl flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-[#daa520]/10 hover:border-[#daa520]/50 hover:-translate-y-1 gap-4 border border-gray-700">
      <div className="flex items-center flex-grow min-w-0 w-full">
        <img src={prof.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt={`Foto de ${prof.establishmentName}`} className="h-20 w-20 rounded-full object-cover mr-4 border-2 border-gray-600" />
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-white truncate">{prof.establishmentName}</h3>
          <p className="text-gray-400 truncate">{prof.segment} - {prof.address?.city || 'Endereço não informado'}</p>
          {prof.reviewCount && prof.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor"/>
              <span className="text-sm font-bold text-white">{prof.averageRating?.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({prof.reviewCount} avaliações)</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end mt-2 border-t border-gray-700 pt-3">
        {prof.instagram && <a href={getInstagramUrl(prof.instagram)} target="_blank" rel="noopener noreferrer" title="Ver no Instagram" className="p-2 rounded-full bg-gray-600 hover:bg-pink-600 transition-colors"><Instagram className="w-6 h-6 text-white"/></a>}
        <button onClick={() => handleProtectedAction(() => toggleFavorite(prof.uid))} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
          <Heart className={`h-7 w-7 transition-all duration-200 transform hover:scale-110 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => handleSelectProfessionalForBooking(prof)} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">Agendar</button>
      </div>
    </div>
  );
};

export default ClientProfessionalCard;
