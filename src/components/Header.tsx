import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import logo from "../assets/stylo-logo.png";
import { Menu, X, LayoutDashboard, LogOut, User } from "lucide-react"; // Ícones Lucide

// Componentes UI
import { Button } from "./ui/button";
import { cn } from "../lib/utils/cn";

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Otimização: só atualiza o estado se o valor mudar
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== hasScrolled) {
        setHasScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled]);

  // Fecha o menu mobile ao mudar de rota
  useEffect(() => setIsOpen(false), [location]);

  // Bloqueia o scroll do body quando o menu mobile está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { name: "Sobre Nós", path: "/about-us" },
    { name: "Contato", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b",
        hasScrolled || isOpen
          ? "bg-[#09090b]/95 md:bg-background/80 md:backdrop-blur-md shadow-sm border-white/10" // Mobile: Solido / Desktop: Blur
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 z-50">
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
              <img
                className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105"
                src={logo}
                alt="Stylo"
                width={120} // Ajuda o navegador a reservar espaço
                height={40}
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-primary hover:bg-transparent text-sm font-medium transition-colors"
                >
                  {link.name}
                </Button>
              </Link>
            ))}
            
            <div className="h-6 w-px bg-white/10 mx-2" /> {/* Separator */}
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button
                    variant="default"
                    className="gap-2 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sair"
                  className="text-gray-400 hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link to="/register-type">
                  <Button variant="default" className="font-bold shadow-lg shadow-primary/10">
                    Cadastre-se
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-100 touch-manipulation active:bg-white/10"
              aria-label="Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Otimizado */}
      {/* Usamos 'fixed inset-0' para cobrir a tela toda, evitando bugs de scroll */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[64px] bg-[#09090b] z-40 animate-in fade-in slide-in-from-top-5 duration-200 flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="block">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-lg text-gray-300 hover:text-primary hover:bg-white/5 h-12"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Button>
              </Link>
            ))}

            <div className="border-t border-white/10 my-6 pt-6 flex flex-col gap-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 gap-2 justify-center font-bold text-base shadow-none">
                      <LayoutDashboard size={18} />
                      Acessar Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full h-12 gap-2 justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 border-none text-base"
                  >
                    <LogOut size={18} />
                    Sair da conta
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full h-12 border-gray-700 text-gray-300 text-base hover:bg-white/5"
                    >
                      <User size={18} className="mr-2" /> Entrar
                    </Button>
                  </Link>
                  <Link to="/register-type" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 font-bold text-base shadow-none">
                      Começar agora
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;