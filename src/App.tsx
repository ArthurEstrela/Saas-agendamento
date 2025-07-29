import { AuthProvider } from './context/AuthContext';
import MainAppContent from './components/MainAppContent';

// Main App component that provides AuthContext
const App = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
