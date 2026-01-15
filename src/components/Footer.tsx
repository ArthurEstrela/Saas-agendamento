import { Link } from "react-router-dom";
import logo from "../assets/stylo-logo.png"; // Caminho relativo para garantir que funcione

// Ícones "Top" para as Redes Sociais (SVG)
const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z"></path>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#18181b] border-t border-[#daa520]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna da Logo e Descrição */}
          <div className="lg:col-span-4">
            <div className="flex items-center space-x-2 mb-4">
              <img className="h-10 w-auto" src={logo} alt="Stylo" />
            </div>
            <p className="text-gray-400 max-w-xs">
              A plataforma definitiva para automatizar seus agendamentos e
              impulsionar seu negócio.
            </p>
          </div>

          {/* Colunas de Links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Soluções
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to="/features"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Preços
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Empresa
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to="/about-us"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to="/terms"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                Suporte
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to="/faq"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:stylo.suporte.agenda@gmail.com"
                    className="text-base text-gray-400 hover:text-[#daa520] transition-colors"
                  >
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Copyright e Redes Sociais */}
        <div className="mt-16 pt-8 border-t border-[#daa520]/10 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} Stylo Agendamentos. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center space-x-5 mt-4 sm:mt-0">
            <a
              href="https://x.com/StyloAgenda"
              target="_blank"
              className="text-gray-400 hover:text-[#daa520] transition-transform hover:scale-110"
            >
              <TwitterIcon />
            </a>
            <a
              href="#"
              target="_blank"
              className="text-gray-400 hover:text-[#daa520] transition-transform hover:scale-110"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/stylo_agenda/"
              target="_blank"
              className="text-gray-400 hover:text-[#daa520] transition-transform hover:scale-110"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.tiktok.com/@styloagenda"
              target="_blank"
              className="text-gray-400 hover:text-[#daa520] transition-transform hover:scale-110"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
