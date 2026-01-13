import { cn } from "../../lib/utils/cn";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

// 1. Seu Spinner Dourado (Stylo)
export const LoadingSpinner = ({ className, size = 32 }: LoadingSpinnerProps) => {
  return (
    <div className="flex justify-center items-center w-full h-full p-4">
      <Loader2
        size={size}
        className={cn("animate-spin text-yellow-500", className)} 
      />
    </div>
  );
};

// 2. O Skeleton restaurado (e ajustado para Dark Mode para combinar com o app)
export const DashboardSkeleton = () => (
    <div className="animate-pulse flex h-screen w-full bg-gray-950">
        {/* Sidebar Fake */}
        <div className="hidden md:block w-64 border-r border-gray-800 bg-gray-900/50 p-4 space-y-4">
            <div className="h-8 bg-gray-800 rounded w-3/4 mb-8"></div>
            <div className="space-y-3">
                <div className="h-10 bg-gray-800 rounded"></div>
                <div className="h-10 bg-gray-800 rounded"></div>
                <div className="h-10 bg-gray-800 rounded"></div>
            </div>
        </div>

        {/* Conteúdo Principal Fake */}
        <div className="flex-1 p-8 space-y-8 overflow-hidden">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-32 bg-gray-800 rounded-xl border border-gray-700"></div>
                <div className="h-32 bg-gray-800 rounded-xl border border-gray-700"></div>
                <div className="h-32 bg-gray-800 rounded-xl border border-gray-700"></div>
            </div>

            <div className="h-64 bg-gray-800 rounded-xl border border-gray-700"></div>
        </div>
    </div>
);