import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import { onMessageListener } from '../context/AuthContext'; // Importar o listener

const MainAppContent = () => {
  const { currentUser, loading, requestFCMToken } = useAuth();

  // Efeito para solicitar permissão de notificação e obter o token FCM
  // assim que o usuário estiver autenticado.
  useEffect(() => {
    if (currentUser) {
      const requestToken = async () => {
        // Solicita a permissão do navegador para mostrar notificações
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Permissão para notificação concedida.');
          // Chama a função do contexto para obter e salvar o token
          await requestFCMToken();
        } else {
          console.log('Permissão para notificação negada.');
        }
      };
      requestToken();
    }
  }, [currentUser, requestFCMToken]);

  // Efeito para escutar mensagens do FCM quando o app está em primeiro plano
  useEffect(() => {
    const unsubscribe = onMessageListener()
      .then((payload: any) => { // Tipagem any para flexibilidade do payload
        // Ação ao receber uma notificação em primeiro plano.
        // Em um app real, você usaria um componente de Toast ou notificação customizado.
        alert(
          `Nova Notificação:\n${payload.notification.title}\n${payload.notification.body}`
        );
        console.log('Mensagem recebida em primeiro plano: ', payload);
      })
      .catch((err) => console.log('Falha ao receber mensagem em primeiro plano: ', err));
    
    // Retorna uma função de limpeza para o useEffect
    return () => {
      // Aqui você pode adicionar lógica para "desinscrever" o listener se necessário,
      // mas para o onMessageListener, a estrutura da Promise já lida com uma única mensagem.
      // Para um listener contínuo, a abordagem seria um pouco diferente.
    };
  }, []);

  // Exibe uma mensagem de carregamento enquanto o status de autenticação é verificado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500 text-xl">
        Carregando...
      </div>
    );
  }

  // Renderiza o Dashboard se o usuário estiver logado, caso contrário, a tela de Login
  return currentUser ? <Dashboard /> : <Login />;
};

export default MainAppContent;
