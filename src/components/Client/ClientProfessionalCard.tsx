import { Link } from 'react-router-dom';
import type { ServiceProviderProfile, ClientProfile } from '../../types';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa'; 
import { useProfileStore } from '../../store/profileStore';
import { toggleFavoriteProfessional } from '../../firebase/userService';

interface ProfessionalCardProps {
  professional: ServiceProviderProfile;
}

export const ClientProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const { userProfile, fetchUserProfile } = useProfileStore();
  const clientProfile = userProfile as ClientProfile;

  const isFavorite = clientProfile?.favoriteProfessionals?.includes(professional.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!clientProfile?.id) return;
    try {
      await toggleFavoriteProfessional(clientProfile.id, professional.id);
      await fetchUserProfile(clientProfile.id);
    } catch (error) {
      console.error("Erro ao favoritar:", error);
    }
  };

  const address = professional.businessAddress;
  const profileLink = `/agendar/${professional.publicProfileSlug}`;

  return (
    <Link to={profileLink} className="block bg-white rounded-lg shadow-md p-5 border-2 border-transparent hover:border-[#daa520] hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img 
            src={professional.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.businessName)}&background=e2e8f0&color=4a5568`}
            alt={professional.businessName}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-bold text-gray-800">{professional.businessName}</h3>
            <p className="text-sm text-gray-600">{professional.name}</p>
          </div>
        </div>
        <button onClick={handleToggleFavorite} className="text-red-500 text-2xl z-10 p-2">
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 flex items-center mb-4">
          <FaMapMarkerAlt className="mr-2 text-gray-400" />
          {`${address.street}, ${address.city} - ${address.state}`}
        </p>
        <div 
          className="bg-gray-100 group-hover:bg-[#daa520] group-hover:text-black text-gray-700 font-bold py-2 px-4 rounded-lg w-full text-center transition-colors flex items-center justify-center gap-2"
        >
            Ver Perfil e Agendar 
            {/* --- E AQUI --- */}
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};