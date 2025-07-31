import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../context/AuthContext';
import Booking from './Booking';
import type { UserProfile } from '../types';

const PublicBookingPage = () => {
  const { professionalId } = useParams<{ professionalId: string }>();
  const [professional, setProfessional] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!professionalId) {
      setError("ID do profissional não fornecido.");
      setLoading(false);
      return;
    }

    const fetchProfessionalProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "users", professionalId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().userType === 'serviceProvider') {
          setProfessional(docSnap.data() as UserProfile);
        } else {
          setError("Profissional não encontrado ou link inválido.");
        }
      } catch (err) {
        console.error("Erro ao buscar profissional:", err);
        setError("Ocorreu um erro ao carregar a página.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalProfile();
  }, [professionalId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-yellow-500 text-xl">
        Carregando informações do profissional...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500 text-xl">
        {error}
      </div>
    );
  }

  if (professional) {
    // O componente Booking agora não precisa do botão "Voltar" neste contexto
    return <Booking professional={professional} />;
  }

  return null; // Caso final, embora não deva ser alcançado
};

export default PublicBookingPage;
