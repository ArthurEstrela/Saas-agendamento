import { Link } from 'react-router-dom';
import type { ServiceProviderProfile } from '../../types';
import { MapPin, Sparkles } from 'lucide-react';

interface Props {
  provider: ServiceProviderProfile;
}

export const ClientProfessionalCard = ({ provider }: Props) => {
  return (
    <Link 
      to={`/provider/${provider.publicProfileSlug}`} 
      className="block bg-black/30 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500 border border-transparent"
    >
      {/* Imagem/Logo */}
      <div className="h-40 bg-gray-800 flex items-center justify-center">
        {provider.logoUrl ? (
          <img src={provider.logoUrl} alt={provider.businessName} className="h-full w-full object-cover" />
        ) : (
          <Sparkles className="text-amber-500/50" size={48} />
        )}
      </div>

      {/* Informações */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-white truncate group-hover:text-amber-400 transition-colors">
          {provider.businessName}
        </h3>
        <p className="text-gray-400 mt-1 text-sm">{provider.areaOfWork}</p>
        
        <div className="flex items-center text-gray-500 mt-4 text-xs">
          <MapPin size={14} className="mr-2 flex-shrink-0" />
          <span>{`${provider.businessAddress.city}, ${provider.businessAddress.state}`}</span>
        </div>
      </div>
    </Link>
  );
};