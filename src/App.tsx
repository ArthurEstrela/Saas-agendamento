import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainAppContent from './components/MainAppContent';
import PublicBookingPage from './components/PublicBookingPage'; // Novo componente

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Rota para a página de agendamento pública */}
        <Route path="/agendar/:professionalId" element={<PublicBookingPage />} />
        
        {/* Rota principal que lida com login e dashboard */}
        <Route path="/*" element={<MainAppContent />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
