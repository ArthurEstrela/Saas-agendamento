import { Search, Calendar, Heart, User, LogOut, Image as ImageIcon, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import logo from '../../assets/stylo-logo.png';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationsStore';

interface ClientSideNavProps {
  activeSection: string;
  // ✨ CORREÇÃO AQUI: A função agora aceita 'notifications'
  setActiveSection: (section: 'search' | 'appointments' | 'favorites' | 'profile' | 'notifications') => void;
}

export const ClientSideNav = ({ activeSection, setActiveSection }: ClientSideNavProps) => {
  const { logout } = useAuthStore();
  const { userProfile } = useProfileStore();
  const { unreadCount } = useNotificationStore();

  // ✨ CORREÇÃO AQUI: Movido para dentro do componente para ter acesso a 'unreadCount'
  const navItems = [
    { id: 'search', label: 'Buscar', icon: Search, count: 0 },
    { id: 'appointments', label: 'Agendamentos', icon: Calendar, count: 0 },
    { id: 'favorites', label: 'Favoritos', icon: Heart, count: 0 },
    { id: 'notifications', icon: Bell, label: 'Notificações', count: unreadCount },
  ];

  return (
    <div className="flex flex-col justify-between h-full text-white">
      <div>
        <div className="mb-12 px-2">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-10" />
          </Link>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              // ✨ CORREÇÃO AQUI: Removemos o 'as any', pois os tipos agora estão corretos
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-base font-medium ${
                activeSection === item.id
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 flex-shrink-0" size={22} />
                <span>{item.label}</span>
              </div>
              {/* ✨ CORREÇÃO AQUI: Adicionamos a lógica para renderizar o contador */}
              {item.count > 0 && (
                <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-700/50 pt-4">
        <button
          onClick={() => setActiveSection('profile')}
          className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 text-base font-medium ${
            activeSection === 'profile'
              ? 'bg-amber-500/10'
              : 'hover:bg-gray-800/50'
          }`}
        >
          <div className="relative mr-3">
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