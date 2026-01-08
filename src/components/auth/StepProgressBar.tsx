import { cn } from "../../lib/utils/cn";
import { Check } from "lucide-react";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepProgressBar = ({
  currentStep,
  stepLabels,
}: StepProgressBarProps) => {
  return (
    <div className="w-full mb-12 px-2">
      {" "}
      {/* Margem bottom aumentada para o texto não cortar */}
      <div className="flex items-center w-full">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = index === stepLabels.length - 1;

          return (
            <div
              key={index}
              // O último item não cresce (flex-1), ele só ocupa o espaço da bolinha
              // Isso garante que a linha anterior vá até ele, jogando-o para a ponta direita
              className={cn(
                "flex items-center relative",
                isLast ? "w-auto" : "flex-1"
              )}
            >
              {/* Container da Bolinha + Texto (Posicionado Relativo) */}
              <div className="relative flex flex-col items-center z-10">
                {/* Círculo */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-2 shrink-0 bg-gray-900",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isActive &&
                      "bg-gray-800 border-primary text-primary shadow-[0_0_15px_rgba(218,165,32,0.4)]",
                    !isCompleted && !isActive && "border-gray-700 text-gray-600"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Rótulo (Posicionado Absolutamente para não afetar largura) */}
                <div
                  className={cn(
                    "absolute top-12 left-1/2 -translate-x-1/2 w-32 text-center text-xs font-semibold transition-colors duration-300",
                    isActive ? "text-primary" : "text-gray-500"
                  )}
                >
                  {label}
                </div>
              </div>

              {/* Barra de Progresso (Linha) - Só renderiza se não for o último */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-all duration-500",
                    // A linha acende se o passo ATUAL já passou deste estágio
                    index + 1 < currentStep ? "bg-primary" : "bg-gray-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
