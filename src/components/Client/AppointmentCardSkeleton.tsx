export const AppointmentCardSkeleton = () => (
  // Fundo escuro sólido para mobile (performance) e levemente translúcido para desktop
  <div className="bg-[#18181b] md:bg-gray-900/40 border border-white/5 rounded-2xl p-5 animate-pulse">
    
    {/* Título e Subtítulo */}
    <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-white/5 rounded w-1/2 mb-5"></div>
    
    {/* Seção do Profissional (Avatar + Texto) */}
    <div className="flex items-center mb-5">
      <div className="w-10 h-10 rounded-full bg-white/10 mr-4 shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-full"></div>
        <div className="h-3 bg-white/5 rounded w-5/6"></div>
      </div>
    </div>
    
    {/* Botão de Ação / Footer */}
    <div className="h-10 bg-white/5 rounded-xl w-full mt-2"></div>
  </div>
);