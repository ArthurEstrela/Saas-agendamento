import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import { toast } from "react-hot-toast";
import logo from "../assets/stylo-logo.png";

// Stores
import { useAuthStore } from "../store/authStore"; 
import { useUserAppointmentsStore } from "../store/userAppointmentsStore";
import { useReviewStore } from "../store/reviewStore";
import type { Appointment } from "../types"; 

// Componentes
import { ClientSideNav } from "./Client/ClientSideNav";
import ReviewModal from "./Common/ReviewModal";

// UI
import { Button } from "./ui/button";

export const ClientDashboard = () => {
  // Controle do menu mobile e navegação
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✨ Hooks atualizados para as novas definições das Stores
  const { user } = useAuthStore();
  const { appointments, fetchUserAppointments } = useUserAppointmentsStore(); // ✨ Alterado de fetchAppointments
  const { submitReview, loading: isSubmittingReview } = useReviewStore(); // ✨ Alterado de isSubmitting

  // Estados locais para o Modal de Avaliação
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState<Appointment | null>(null);
  
  // Refs de controle
  const fetchInitiated = useRef(false);
  const toastDisplayedRef = useRef(false);

  // --- EFEITO: Detectar Deep Link de Avaliação na URL ---
  useEffect(() => {
    const action = searchParams.get("action");
    const appointmentId = searchParams.get("appointmentId");

    // Reseta flags se não estiver em modo review
    if (action !== "review") {
      toastDisplayedRef.current = false;
      return;
    }

    // Só ativa se tivermos um ID e o perfil carregado
    if (appointmentId && user?.id) {
      
      const foundAppointment = appointments.find((a) => a.id === appointmentId);

      if (foundAppointment) {
        
        // 🔒 TRAVA DE SEGURANÇA: Verifica se já existe avaliação
        // A API Java envia 'reviewId' se a avaliação já tiver sido feita
        if ((foundAppointment as any).review || foundAppointment.reviewId) {
          
          // O 'id' impede duplicidade visual mesmo que o React execute 2x (Strict Mode)
          toast.error("Você já avaliou este agendamento!", {
            id: "review-already-exists" 
          });
          
          setSearchParams({}); // Limpa a URL
          setIsReviewModalOpen(false);
          setAppointmentToReview(null);
          return;
        }

        // Se passar na validação, abre o modal
        setAppointmentToReview(foundAppointment);
        setIsReviewModalOpen(true);

      } else if (appointments.length === 0 && !fetchInitiated.current) {
        // Se a lista está vazia, busca os dados da API Java
        fetchInitiated.current = true;
        fetchUserAppointments(); // ✨ Usando a nova função sem argumentos
      }
    }
  }, [searchParams, appointments, user, fetchUserAppointments, setSearchParams]);

  // Handler: Enviar a Avaliação
  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!appointmentToReview || !user) return;

    // ✨ Atualizado para os 3 argumentos exigidos pelo Java (o backend faz o resto sozinho)
    await submitReview(
      appointmentToReview.id, 
      rating, 
      comment
    );

    setIsReviewModalOpen(false);
    setAppointmentToReview(null);
    setSearchParams({});
    
    // Opcional: fetchUserAppointments() já não é estritamente obrigatório porque o Store
    // de avaliações (como vimos no código dele) já atualiza os appointments via Zustand setState!
    // Mas não faz mal se quiser forçar o fetch novamente. Vamos confiar na "mágica do Zustand" lá do store.
  };

  // Handler: Cancelar/Fechar Modal
  const handleCloseReview = () => {
    setIsReviewModalOpen(false);
    setAppointmentToReview(null);
    setSearchParams({});
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      
      {/* --- BACKGROUND (Efeito Aurora) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* --- SIDENAV --- */}
      <ClientSideNav isOpen={isMobileNavOpen} setIsOpen={setIsMobileNavOpen} />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        
        {/* Header Mobile Otimizado */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/95 backdrop-blur-sm sticky top-0 z-30">
          <Link to="/client/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white active:scale-95 transition-transform"
          >
            <Menu size={24} />
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-6">
          <div className="w-full min-h-full space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- MODAL GLOBAL DE AVALIAÇÃO --- */}
      {appointmentToReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={handleCloseReview}
          appointment={appointmentToReview}
          onSubmit={handleReviewSubmit}
          isLoading={isSubmittingReview}
        />
      )}
    </div>
  );
};