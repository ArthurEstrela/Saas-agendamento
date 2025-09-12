// src/components/auth/StepProgressBar.tsx
interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepProgressBar = ({ currentStep, totalSteps, stepLabels }: StepProgressBarProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={index} className="flex-1 flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                ${isCompleted ? 'bg-[#daa520] text-black' : ''}
                ${isActive ? 'bg-gray-700 border-2 border-[#daa520] text-[#daa520]' : ''}
                ${!isCompleted && !isActive ? 'bg-gray-800 border-2 border-gray-700 text-gray-500' : ''}
                transition-all duration-300
              `}>
                {isCompleted ? '✔' : stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${isCompleted ? 'bg-[#daa520]' : 'bg-gray-700'}
                  transition-all duration-300
                `}></div>
              )}
            </div>
          );
        })}
      </div>
       <div className="flex justify-between mt-2">
        {stepLabels.map((label, index) => (
          <div key={index} className={`
            text-xs font-semibold text-center w-1/3
            ${index + 1 === currentStep ? 'text-[#daa520]' : 'text-gray-400'}
          `}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};