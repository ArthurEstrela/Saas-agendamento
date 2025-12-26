import { Link } from "react-router-dom";
import { User, Briefcase, ArrowRight } from "lucide-react";
import logo from "../assets/stylo-logo.png";

// UI
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const RegisterTypeSelection = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black -z-10" />

      <div className="text-center mb-12 animate-fade-in-down">
        <Link to="/">
          <img
            src={logo}
            alt="Stylo"
            className="h-14 mx-auto mb-6 hover:scale-105 transition-transform"
          />
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          Como você usará a Stylo?
        </h1>
        <p className="text-gray-400 text-lg">
          Escolha o perfil que combina com seus objetivos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Card Cliente */}
        <Link to="/register/client" className="group">
          <Card className="h-full bg-gray-900/40 border-gray-700 hover:border-primary hover:bg-gray-900/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(218,165,32,0.15)] group">
            <CardContent className="p-8 flex flex-col items-center text-center h-full">
              <div className="p-4 bg-gray-800 rounded-full mb-6 group-hover:bg-primary/20 transition-colors">
                <User className="h-12 w-12 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Sou Cliente
              </h2>
              <p className="text-gray-400 mb-8 flex-grow">
                Quero descobrir novos estilos, encontrar profissionais top e
                agendar serviços com facilidade.
              </p>
              <div className="flex items-center text-primary font-bold text-sm group-hover:gap-2 transition-all">
                Criar conta Cliente <ArrowRight size={16} className="ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card Profissional */}
        <Link to="/register/provider" className="group">
          <Card className="h-full bg-gray-900/40 border-gray-700 hover:border-primary hover:bg-gray-900/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(218,165,32,0.15)] group">
            <CardContent className="p-8 flex flex-col items-center text-center h-full">
              <div className="p-4 bg-gray-800 rounded-full mb-6 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="h-12 w-12 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Sou Profissional
              </h2>
              <p className="text-gray-400 mb-8 flex-grow">
                Quero gerenciar minha agenda, organizar meu negócio e fidelizar
                mais clientes.
              </p>
              <div className="flex items-center text-primary font-bold text-sm group-hover:gap-2 transition-all">
                Criar conta Profissional{" "}
                <ArrowRight size={16} className="ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-12 text-center text-gray-500">
        <p>
          Já tem uma conta?{" "}
          <Link to="/login">
            <Button
              variant="link"
              className="text-primary font-bold text-base p-0 h-auto hover:text-white"
            >
              Fazer Login
            </Button>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterTypeSelection;
