import type { ServiceProviderProfile, ClientProfile } from '../../types';
import { FaHeart, FaRegHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { useProfileStore } from '../../store/profileStore';
import { toggleFavoriteProfessional } from '../../firebase/userService';

interface ProfessionalCardProps {
  professional: ServiceProviderProfile;
}

export const ClientProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const { userProfile, fetchUserProfile } = useProfileStore();
  const clientProfile = userProfile as ClientProfile;

  const isFavorite = clientProfile?.favoriteProfessionals?.includes(professional.id);

  const handleToggleFavorite = async () => {
    if (!clientProfile?.id) return;
    try {
      await toggleFavoriteProfessional(clientProfile.id, professional.id);
      // Re-busca o perfil do cliente para atualizar a lista de IDs de favoritos
      await fetchUserProfile(clientProfile.id); 
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      // Aqui você pode mostrar um toast de erro
    }
  };

  const address = professional.businessAddress;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-transparent hover:border-blue-500 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{professional.businessName}</h3>
          <p className="text-sm text-gray-600">{professional.name}</p>
        </div>
        <button onClick={handleToggleFavorite} className="text-red-500 text-2xl">
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 flex items-center">
          <FaMapMarkerAlt className="mr-2 text-gray-400" />
          {`${address.street}, ${address.city} - ${address.state}`}
        </p>
        {/* Outras informações como nota média, etc. */}
      </div>
    </div>
  );
};