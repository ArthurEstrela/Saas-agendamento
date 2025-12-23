// src/components/AppLayout.tsx

import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore"; // Import correto do store de perfil
import type { UserProfile } from "../types"; // Importamos o tipo original

const AppLayout = () => {
  // 1. Corrigido: 'isLoading' é o nome correto no authStore
  const { user, isLoading } = useAuthStore();
  
  // 2. Corrigido: 'userProfile' vem do profileStore
  const { userProfile } = useProfileStore();
  
  const navigate = useNavigate();

  // NOVO USEEFFECT PARA VERIFICAR AGENDAMENTO PENDENTE
  useEffect(() => {
    if (!isLoading && user && userProfile) {
      // ✅ CORREÇÃO: Removemos o 'any'.
      // Criamos uma tipagem local que une UserProfile com a propriedade opcional pendingBooking.
      const profileWithBooking = userProfile as UserProfile & { pendingBooking?: boolean };

      if (profileWithBooking.pendingBooking) {
        navigate("/booking");
      }
    }
  }, [user, userProfile, isLoading, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-200">
      <Header />
      <main className="flex-grow">
        {/* O Outlet renderiza a rota filha (Dashboard, etc.) */}
        <Outlet />
      </main>
      <Footer />
      
      {/* OBS: O <AppointmentDetailsModal /> foi removido daqui pois ele exige propriedades 
          (isOpen, appointment, etc.) que não estão disponíveis neste contexto global.
          Ele deve ser usado apenas dentro das telas de agendamento/dashboard onde esses dados existem.
      */}
    </div>
  );
};

export default AppLayout;