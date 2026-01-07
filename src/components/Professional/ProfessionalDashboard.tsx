import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react";
import logo from "../../assets/stylo-logo.png";

import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";

// UI
import { Button } from "../ui/button";
import { ProfessionalSideNav } from "./ProfessionalSideNav";

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  const profile = userProfile as ProfessionalProfile | null;

  // Mantivemos a verificação de perfil, pois o dashboard profissional
  // geralmente depende estritamente dos dados do prestador carregados.
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* --- BACKGROUND (Efeito Aurora Sutil - Igual ao Client) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* --- SIDENAV --- */}
      {/* Observação: Certifique-se de que o seu ProfessionalSideNav 
          agora use componentes <Link to="..."> em vez de onClick={() => setActiveView(...)}
          e aceite apenas as props de controle de abertura mobile.
      */}
      <ProfessionalSideNav
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        {/* Header Mobile Padronizado */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/professional/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </Button>
        </header>

        {/* Wrapper de Conteúdo */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="w-full min-h-full space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname} // A chave única força a animação na troca de rota
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* O Outlet renderiza o componente filho definido nas rotas (App.tsx) */}
                <Outlet context={{ userProfile: profile }} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
