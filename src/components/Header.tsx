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
    const handleScroll = () => setHasScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fecha o menu mobile ao mudar de rota
  useEffect(() => setIsOpen(false), [location]);

  const handleLogout = async () => {
    await logout();
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
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-transparent",
        hasScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md border-gray-800"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                className="h-10 w-auto transition-transform group-hover:scale-105"
                src={logo}
                alt="Stylo"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-primary hover:bg-transparent text-sm font-medium"
                >
                  {link.name}
                </Button>
              </Link>
            ))}
            <div className="h-6 w-px bg-gray-800 mx-2" /> {/* Separator */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button
                    variant="default"
                    className="gap-2 font-bold shadow-[0_0_15px_rgba(218,165,32,0.2)] hover:shadow-[0_0_20px_rgba(218,165,32,0.4)]"
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
                    className="text-gray-300 hover:text-white"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link to="/register-type">
                  <Button variant="default" className="font-bold">
                    Cadastre-se
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-gray-800 animate-fade-in-down">
          <nav className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="block">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-primary"
                >
                  {link.name}
                </Button>
              </Link>
            ))}

            <div className="border-t border-gray-800 my-4 pt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="w-full">
                    <Button className="w-full gap-2 justify-center font-bold">
                      <LayoutDashboard size={16} />
                      Acessar Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full gap-2 justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 border-none"
                  >
                    <LogOut size={16} />
                    Sair da conta
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border-gray-700 text-gray-300"
                    >
                      <User size={16} className="mr-2" /> Entrar
                    </Button>
                  </Link>
                  <Link to="/register-type" className="w-full">
                    <Button className="w-full font-bold">Começar agora</Button>
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
