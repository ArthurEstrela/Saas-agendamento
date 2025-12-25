import * as React from "react";
import { cn } from "../../lib/utils/cn"; // Ajuste o caminho conforme sua estrutura

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode; // Aceita qualquer ícone (Lucide, SVG, etc)
  error?: string;         // Mensagem de erro para exibir embaixo
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {/* Se tiver ícone, renderiza ele posicionado absolutamente */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              // Estilos Base (Baseado no seu tema dark/gold)
              "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-gray-500",
              
              // Estados de Foco (Usa o anel dourado do tema)
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
              
              // Estado Desabilitado
              "disabled:cursor-not-allowed disabled:opacity-50",
              
              // Se tiver ícone, adiciona padding na esquerda para o texto não ficar em cima
              icon ? "pl-10" : "",
              
              // Se tiver erro, a borda fica vermelha
              error ? "border-destructive focus-visible:ring-destructive" : "",
              
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        
        {/* Renderiza a mensagem de erro automaticamente se existir */}
        {error && (
          <p className="mt-1 text-sm text-destructive animate-fade-in-down">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };