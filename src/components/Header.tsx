import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/stylo-logo.png';

// Ícones para o menu mobile
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = (
    <>
      <Link to="/sobre-nos" className="text-gray-300 hover:text-[#daa520] transition-colors duration-300">Sobre Nós</Link>
      <Link to="/contato" className="text-gray-300 hover:text-[#daa520] transition-colors duration-300">Contato</Link>
      <Link to="/faq" className="text-gray-300 hover:text-[#daa520] transition-colors duration-300">FAQ</Link>
    </>
  );

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        hasScrolled ? 'bg-black/80 backdrop-blur-lg shadow-lg shadow-[#daa520]/5' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img className="h-10 w-auto" src={logo} alt="Stylo" />
              <span className="text-white text-2xl font-bold tracking-tight">Stylo</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks}
            {currentUser ? (
              <>
                <Link to="/dashboard" className="bg-[#daa520] text-black hover:bg-[#c8961e] font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-[#daa520] transition-colors duration-300">
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-[#daa520] text-black hover:bg-[#c8961e] font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                Entrar
              </Link>
            )}
          </nav>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none" aria-label="Abrir menu">
              {isOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg pb-4">
          <nav className="container mx-auto px-4 flex flex-col space-y-4 text-center">
            {navLinks}
            <div className="border-t border-[#daa520]/20 pt-4 flex flex-col space-y-4">
              {currentUser ? (
                <>
                  <Link to="/dashboard" className="bg-[#daa520] text-black hover:bg-[#c8961e] font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-gray-300 hover:text-[#daa520] transition-colors duration-300">
                    Sair
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-[#daa520] text-black hover:bg-[#c8961e] font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                  Entrar
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
