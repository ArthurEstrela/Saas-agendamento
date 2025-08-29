// src/components/PublicBookingPage.tsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { UserProfile } from "../types";
import { useAuthStore } from "../store/authStore";

import Booking from "./Booking";
import LoginPrompt from "./Common/LoginPrompt"; // Componente para solicitar login

import {
  Loader2,
  MapPin,
  Phone,
  Star,
  AlertCircle,
  Calendar,
} from "lucide-react";
import Footer from "./Footer"; // Opcional: para uma página mais completa

const PublicBookingPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthStore(); // Pega o usuário logado do store

  const [establishment, setEstablishment] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  useEffect(() => {
    const fetchEstablishment = async () => {
      if (!username) {
        setError("Nenhum perfil especificado.");
        setIsLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("username", "==", username),
          where("isServiceProvider", "==", true)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Perfil de agendamento não encontrado.");
        } else {
          // Pega o primeiro resultado (nomes de usuário devem ser únicos)
          const docData = querySnapshot.docs[0].data() as UserProfile;
          setEstablishment(docData);
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        setError("Ocorreu um erro ao carregar o perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishment();
  }, [username]);

  const handleOpenBookingModal = () => {
    if (user) {
      setIsBookingModalOpen(true);
    } else {
      setIsLoginPromptOpen(true);
    }
  };

  // Estado de Carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
        <p className="mt-4 text-lg">Carregando perfil...</p>
      </div>
    );
  }

  // Estado de Erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="mt-4 text-2xl font-bold">Oops! Algo deu errado.</h1>
        <p className="mt-2 text-gray-400">{error}</p>
        <Link
          to="/"
          className="mt-6 bg-[#daa520] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#c8961e]"
        >
          Voltar para a Página Inicial
        </Link>
      </div>
    );
  }

  if (!establishment) return null; // Retorno de segurança

  // Renderização da Página
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Container Principal */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header do Perfil */}
        <header className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-[-80px]">
          <img
            src={
              establishment.coverPhotoURL ||
              "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
            }
            alt="Foto de capa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </header>

        <div className="relative bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <img
              src={
                establishment.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  establishment.displayName
                )}&background=1f2937&color=daa520&size=128`
              }
              alt={establishment.displayName}
              className="h-32 w-32 rounded-full object-cover border-4 border-[#daa520] -mt-24 sm:-mt-16"
            />
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {establishment.displayName}
              </h1>
              <p className="text-gray-400 mt-1">
                {establishment.businessType || "Prestador de Serviço"}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-gray-300">
                {establishment.address && (
                  <span className="flex items-center gap-2">
                    <MapPin size={16} /> {establishment.address.city},{" "}
                    {establishment.address.state}
                  </span>
                )}
                {establishment.phoneNumber && (
                  <span className="flex items-center gap-2">
                    <Phone size={16} /> {establishment.phoneNumber}
                  </span>
                )}
                {/* Você pode adicionar um sistema de avaliação aqui */}
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" /> 5.0 (23
                  avaliações)
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenBookingModal}
              className="bg-[#daa520] hover:bg-[#c8961e] text-black font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#daa520]/20 w-full sm:w-auto"
            >
              <Calendar size={20} />
              Agendar Agora
            </button>
          </div>
        </div>

        {/* Conteúdo da Página (Sobre, Serviços, Galeria, etc.) */}
        <main className="mt-8 space-y-8">
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-3">Sobre Nós</h2>
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {establishment.bio ||
                "Este estabelecimento ainda não adicionou uma descrição."}
            </p>
          </div>
          {/* Você pode adicionar seções de Galeria de Fotos, Lista de Serviços, etc. aqui */}
        </main>
      </div>

      {/* Opcional: Adiciona um rodapé para uma aparência mais completa */}
      <Footer />

      {/* MODAL DE AGENDAMENTO (PERFEITAMENTE CENTRALIZADO) */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-down">
          <Booking
            professional={establishment}
            onBack={() => setIsBookingModalOpen(false)}
          />
        </div>
      )}

      {/* PROMPT DE LOGIN */}
      <LoginPrompt
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
        onLoginSuccess={() => {
          setIsLoginPromptOpen(false);
          setIsBookingModalOpen(true); // Abre o agendamento após o login
        }}
      />
    </div>
  );
};

export default PublicBookingPage;
