import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard'; // Importa o novo Dashboard unificado

const MainAppContent = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500 text-xl">
        Carregando...
      </div>
    );
  }

  return currentUser ? <Dashboard /> : <Login />;
};

export default MainAppContent;