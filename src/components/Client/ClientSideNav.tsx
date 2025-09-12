import { Search, Calendar, Heart, User, LogOut, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import logo from '../../assets/stylo-logo.png';
import { Link } from 'react-router-dom';

interface ClientSideNavProps {
  activeSection: string;
  setActiveSection: (section: 'search' | 'appointments' | 'favorites' | 'profile') => void;
}

// 1. AJUSTES NOS ITENS DE NAVEGAÇÃO
const navItems = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'appointments', label: 'Agendamentos', icon: Calendar }, // Texto encurtado
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  // O item "Meu Perfil" foi removido daqui
];

export const ClientSideNav = ({ activeSection, setActiveSection }: ClientSideNavProps) => {
  const { logout } = useAuthStore();
  const { userProfile } = useProfileStore();

  return (
    <div className="flex flex-col justify-between h-full text-white">
      <div>
        {/* Logo */}
        <div className="mb-12 px-2">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-10" />
          </Link>
        </div>

        {/* Itens de Navegação */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-base font-medium
                ${
                  activeSection === item.id
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <item.icon className="mr-3 flex-shrink-0" size={22} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Seção do Usuário e Logout */}
      <div className="border-t border-gray-700/50 pt-4">
        {/* 2. ÁREA DO PERFIL AGORA É UM BOTÃO */}
        <button
          onClick={() => setActiveSection('profile')}
          className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 text-base font-medium
            ${
              activeSection === 'profile'
                ? 'bg-amber-500/10' // Estilo quando a seção de perfil está ativa
                : 'hover:bg-gray-800/50'
            }`}
        >
          <div className="relative mr-3">
            {/* 3. FOTO COM BORDA DOURADA */}
            {userProfile?.profilePictureUrl ? (
              <img
                src={userProfile.profilePictureUrl}
                alt="Foto do perfil"
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                <ImageIcon size={20} className="text-gray-400" />
              </div>
            )}
          </div>
          <span className={`truncate ${activeSection === 'profile' ? 'text-amber-400' : 'text-white'}`}>
            {userProfile?.name || userProfile?.email}
          </span>
        </button>

        {/* Botão de Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center p-3 mt-2 rounded-lg transition-all duration-200 text-gray-400 hover:bg-red-500/10 hover:text-red-400 text-base font-medium"
        >
          <LogOut className="mr-3" size={22} />
          Sair
        </button>
      </div>
    </div>
  );
};