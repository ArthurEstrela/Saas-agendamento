// src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config'; // Revertido para caminho relativo
import { useAuthStore } from './store/authStore'; // Revertido para caminho relativo
import type { UserProfile } from './types'; // Revertido para caminho relativo

// Importação dos seus componentes de página
import Home from './components/Home'; // Revertido
import Login from './components/Login'; // Revertido
import AppLayout from './components/AppLayout'; // Revertido
import Dashboard from './components/Dashboard'; // Revertido
import TermsOfUse from './components/TermsOfUse'; // Revertido
import PrivacyPolicy from './components/PrivacyPolicy'; // Revertido
import FAQ from './components/FAQ'; // Revertido
import AboutUs from './components/AboutUs'; // Revertido
import Contact from './components/Contact'; // Revertido
import ClientDashboard from './components/ClientDashboard'; // Revertido
import PublicBookingPage from './components/PublicBookingPage'; // Revertido

/**
 * Componente para proteger rotas que exigem autenticação.
 * Ele verifica o estado do usuário no store do Zustand.
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const currentUser = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    // Enquanto verifica a autenticação, não renderiza nada ou mostra um loader
    return null; 
  }

  if (!currentUser) {
    // Se não houver usuário após a verificação, redireciona para o login
    return <Navigate to="/login" replace />;
  }

  // Se o usuário estiver autenticado, renderiza o componente filho
  return children;
};

/**
 * Componente para a rota de login.
 * Se o usuário já estiver logado, redireciona para o dashboard.
 */
const LoginRedirect = () => {
  const currentUser = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return null; // Evita piscar a tela de login enquanto carrega
  }

  if (currentUser) {
    // Se o usuário já estiver logado, redireciona
    return <Navigate to="/dashboard" replace />;
  }

  // Caso contrário, mostra a página de login
  return <Login />;
};

/**
 * Componente principal da aplicação.
 * Gerencia o listener de autenticação e define as rotas.
 */
const App = () => {
  // Pega as ações e o estado de 'loading' do nosso store
  const { setUser, setUserProfile, setLoading, loading } = useAuthStore();

  // Este useEffect é o coração da autenticação.
  // Ele roda apenas uma vez e monitora o estado do usuário.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Usuário está logado. Define o usuário no store.
        setUser(user);
        
        // 2. Busca o perfil do usuário no Firestore.
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          // 3. Se o perfil existe, salva no store.
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Perfil não encontrado (pode ser um novo usuário ou um erro).
          console.warn("Documento do usuário não encontrado no Firestore!");
          setUserProfile(null);
        }
      } else {
        // Usuário deslogou. Limpa todos os dados do usuário no store.
        setUser(null);
        setUserProfile(null);
      }
      // 4. Finaliza o estado de carregamento inicial.
      setLoading(false);
    });

    // Função de limpeza para remover o listener quando o componente desmontar.
    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]); // Dependências do useEffect

  // Mostra um loader global enquanto a verificação inicial está acontecendo.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        Carregando...
      </div>
    );
  }

  // Após a verificação, renderiza as rotas da aplicação.
  return (
    <Routes>
      {/* Rotas Públicas com o layout principal (Header/Footer) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/termos-de-uso" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/sobre-nos" element={<AboutUs />} />
        <Route path="/contato" element={<Contact />} />
      </Route>

      {/* Rotas que não usam o AppLayout padrão */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/booking" element={<ClientDashboard />} />
      <Route path="/agendar/:professionalId" element={<PublicBookingPage />} />
      
      {/* Rota Protegida para o Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;
