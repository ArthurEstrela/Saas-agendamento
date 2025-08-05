// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-lg sticky top-0 z-40 w-full border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8" src="/src/assets/stylo-logo.png" alt="Stylo Logo" />
            </Link>
            <nav className="hidden md:flex md:ml-10 md:space-x-8">
              <a href="/#features" className="text-gray-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium">Funcionalidades</a>
              <a href="/#pricing" className="text-gray-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium">Preços</a>
              <a href="/#contact" className="text-gray-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium">Contato</a>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="bg-yellow-500 text-black hover:bg-yellow-400 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
              >
                Painel
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="text-gray-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Entrar
                </button>
                <button
                  onClick={() => handleNavigation('/login')} // Pode levar para uma view de registro específica depois
                  className="bg-yellow-500 text-black hover:bg-yellow-400 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                >
                  Registrar
                </button>
              </>
            )}
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="/#features" className="text-gray-300 hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium">Funcionalidades</a>
            <a href="/#pricing" className="text-gray-300 hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium">Preços</a>
            <a href="/#contact" className="text-gray-300 hover:text-yellow-400 block px-3 py-2 rounded-md text-base font-medium">Contato</a>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
             {currentUser ? (
                <div className="px-2">
                    <button onClick={() => handleNavigation('/dashboard')} className="w-full text-left block bg-yellow-500 text-black hover:bg-yellow-400 px-3 py-2 rounded-md text-base font-semibold transition-colors">Painel</button>
                </div>
             ) : (
                <div className="px-2 space-y-2">
                    <button onClick={() => handleNavigation('/login')} className="w-full text-left block text-gray-300 hover:text-yellow-400 px-3 py-2 rounded-md text-base font-medium">Entrar</button>
                    <button onClick={() => handleNavigation('/login')} className="w-full text-left block bg-yellow-500 text-black hover:bg-yellow-400 px-3 py-2 rounded-md text-base font-semibold transition-colors">Registrar</button>
                </div>
             )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
