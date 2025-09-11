import { FaCalendarAlt, FaUser, FaHeart, FaSearch, FaSignOutAlt } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import type { ClientDashboardView } from '../../pages/DashboardPage'; // Atualize o caminho

interface ClientSideNavProps {
  activeView: ClientDashboardView;
  setActiveView: (view: ClientDashboardView) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: ClientDashboardView;
  activeView: ClientDashboardView;
  setActiveView: (view: ClientDashboardView) => void;
}

const NavItem = ({ icon, label, view, activeView, setActiveView }: NavItemProps) => {
    const isActive = activeView === view;
    return (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-md transition-colors ${
                isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </button>
    );
};


export const ClientSideNav = ({ activeView, setActiveView }: ClientSideNavProps) => {
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Meu Painel</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavItem icon={<FaCalendarAlt />} label="Meus Agendamentos" view="appointments" activeView={activeView} setActiveView={setActiveView} />
        <NavItem icon={<FaSearch />} label="Buscar" view="search" activeView={activeView} setActiveView={setActiveView} />
        <NavItem icon={<FaUser />} label="Meu Perfil" view="profile" activeView={activeView} setActiveView={setActiveView} />
        <NavItem icon={<FaHeart />} label="Favoritos" view="favorites" activeView={activeView} setActiveView={setActiveView} />
      </nav>
      <div className="p-4 border-t mt-auto">
        <button
          onClick={logout}
          className="flex items-center justify-center w-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 font-bold py-2 px-4 rounded transition-colors"
        >
          <FaSignOutAlt className="mr-2"/>
          Sair
        </button>
      </div>
    </aside>
  );
};