import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import logo from "../assets/stylo-logo.png";

// Componentes
import { ClientSideNav } from "./Client/ClientSideNav";

// UI
import { Button } from "./ui/button";

export const ClientDashboard = () => {
  // Controle apenas do menu mobile.
  // O conteúdo agora é controlado pela URL (React Router).
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Hook necessário para identificar mudança de rota e disparar a animação
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* --- BACKGROUND (Efeito Aurora Sutil) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* --- SIDENAV --- */}
      {/* Não passamos mais activeSection, pois o SideNav agora usa Link e useLocation */}
      <ClientSideNav isOpen={isMobileNavOpen} setIsOpen={setIsMobileNavOpen} />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        {/* Header Mobile */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/dashboard">
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
                {/* O Outlet renderiza o componente filho definido no App.tsx */}
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};
