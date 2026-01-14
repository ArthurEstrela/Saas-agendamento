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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    // Fundo base consistente com as outras páginas otimizadas
    <div className="flex min-h-screen bg-[#09090b] text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* MOBILE: Gradiente Estático (Leve) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden" />
        
        {/* DESKTOP: Aurora Blur (Bonito, mas pesado) */}
        <div className="hidden md:block">
           <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-40" />
           <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
           <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[120px] opacity-30" />
        </div>
      </div>

      {/* --- SIDENAV --- */}
      <ClientSideNav isOpen={isMobileNavOpen} setIsOpen={setIsMobileNavOpen} />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        
        {/* Header Mobile Otimizado: Fundo sólido em vez de blur */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-[#09090b] sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white active:bg-white/10 touch-manipulation"
          >
            <Menu size={24} />
          </Button>
        </header>

        <div className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="w-full min-h-full space-y-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                // Dica de performance: will-change ajuda o navegador a preparar a GPU
                className="w-full will-change-transform"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};