import { cn } from "../../lib/utils/cn";
import { Check } from "lucide-react";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepProgressBar = ({ currentStep, totalSteps, stepLabels }: StepProgressBarProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {stepLabels.map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={index} className="flex-1 flex items-center">
              {/* Círculo do Passo */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-2",
                  // Estado Completado
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  // Estado Ativo
                  isActive && "bg-gray-800 border-primary text-primary shadow-[0_0_10px_rgba(218,165,32,0.3)]",
                  // Estado Pendente
                  !isCompleted && !isActive && "bg-gray-800 border-gray-700 text-gray-500"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : stepNumber}
              </div>

              {/* Barra de Progresso (Linha Conectora) */}
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-all duration-500",
                    isCompleted ? "bg-primary" : "bg-gray-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Rótulos dos Passos */}
      <div className="flex justify-between mt-3 px-1">
        {stepLabels.map((label, index) => {
            const isActive = index + 1 === currentStep;
            return (
                <div
                    key={index}
                    className={cn(
                    "text-xs font-semibold text-center w-1/3 transition-colors duration-300",
                    isActive ? "text-primary" : "text-gray-500"
                    )}
                >
                    {label}
                </div>
            )
        })}
      </div>
    </div>
  );
};