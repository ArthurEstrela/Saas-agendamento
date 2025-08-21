import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext'; // Verifique se o caminho está correto

const AppLayout = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  // NOVO USEEFFECT PARA VERIFICAR AGENDAMENTO PENDENTE
  useEffect(() => {
    // Só executa se o usuário estiver logado e o perfil carregado
    if (currentUser && userProfile) {
      const pendingBookingRaw = localStorage.getItem('pendingBooking');
      
      if (pendingBookingRaw) {
        try {
          const pendingBooking = JSON.parse(pendingBookingRaw);
          
          // Se existir um agendamento pendente, redireciona para a página correta
          if (pendingBooking && pendingBooking.serviceProviderId) {
            console.log('Agendamento pendente encontrado, redirecionando...');
            // A página PublicBookingPage espera o ID do estabelecimento na URL
            navigate(`/agendamento/${pendingBooking.serviceProviderId}`);
          }
        } catch (error) {
          console.error("Erro ao processar agendamento pendente:", error);
          // Limpa o item caso esteja corrompido
          localStorage.removeItem('pendingBooking');
        }
      }
    }
    // Roda sempre que o status do usuário mudar
  }, [currentUser, userProfile, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <Header />
      <main className="flex-grow">
        {/* O Outlet renderiza a rota filha (Dashboard, etc.) */}
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;