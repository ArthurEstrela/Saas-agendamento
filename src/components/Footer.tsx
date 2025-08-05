// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Ícones SVG para Instagram e TikTok
  const InstagramIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2.315a1 1 0 011.37 0l.707.707a1 1 0 010 1.37l-.707.707a1 1 0 01-1.37 0l-.707-.707a1 1 0 010-1.37l.707-.707zM12.315 17.685a1 1 0 011.37 0l.707.707a1 1 0 010 1.37l-.707.707a1 1 0 01-1.37 0l-.707-.707a1 1 0 010-1.37l.707-.707zM9.192 5.192a1 1 0 011.37 0l.707.707a1 1 0 010 1.37l-.707.707a1 1 0 01-1.37 0L8.485 7.27a1 1 0 010-1.37l.707-.707zM15.808 13.808a1 1 0 011.37 0l.707.707a1 1 0 010 1.37l-.707.707a1 1 0 01-1.37 0l-.707-.707a1 1 0 010-1.37l.707-.707z" clipRule="evenodd" />
      <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zM12 7.5c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5z" />
    </svg>
  );

  const TikTokIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4">
            <div className="flex items-center mb-4">
              <img className="h-10" src="/src/assets/stylo-logo.png" alt="Stylo Logo" />
            </div>
            <p className="text-sm">
              Simplificamos a gestão e o agendamento para negócios de beleza e bem-estar, conectando profissionais e clientes de forma eficiente.
            </p>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Produto</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="/booking" className="text-base text-gray-400 hover:text-yellow-400">Agendar Horário</Link></li>
                <li><a href="/#pricing" className="text-base text-gray-400 hover:text-yellow-400">Preços</a></li>
                <li><a href="/#features" className="text-base text-gray-400 hover:text-yellow-400">Funcionalidades</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Empresa</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="/sobre-nos" className="text-base text-gray-400 hover:text-yellow-400">Sobre Nós</Link></li>
                <li><Link to="/contato" className="text-base text-gray-400 hover:text-yellow-400">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link to="/termos-de-uso" className="text-base text-gray-400 hover:text-yellow-400">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="text-base text-gray-400 hover:text-yellow-400">Privacidade</Link></li>
                <li><Link to="/faq" className="text-base text-gray-400 hover:text-yellow-400">FAQ</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col sm:flex-row-reverse items-center justify-between">
          <div className="flex space-x-6">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300">
              <span className="sr-only">Instagram</span>
              <InstagramIcon />
            </a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300">
              <span className="sr-only">TikTok</span>
              <TikTokIcon />
            </a>
          </div>
          <div className="mt-8 sm:mt-0 text-sm text-center sm:text-left">
            <p>&copy; {currentYear} Stylo. Todos os direitos reservados.</p>
            <p>CNPJ: 00.000.000/0001-00</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
