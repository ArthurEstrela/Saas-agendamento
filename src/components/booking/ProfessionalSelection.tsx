import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { CheckCircle, User, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Professional } from "../../types";

export const ProfessionalSelection = () => {
  // 1. EXTRAÇÃO ROBUSTA: Usando seletores individuais para estabilidade e tipagem.
  // Isso resolve o loop de renderização (Maximum update depth exceeded) e os erros de tipagem.
  const provider = useBookingProcessStore((state) => state.provider);
  const selectedServices = useBookingProcessStore(
    (state) => state.selectedServices
  );
  const selectedProfessional = useBookingProcessStore(
    (state) => state.professional
  );
  const providerProfessionals = useBookingProcessStore(
    (state) => state.providerProfessionals
  );
  const isLoadingProfessionals = useBookingProcessStore(
    (state) => state.isLoadingProfessionals
  );

  // 2. EXTRAÇÃO DE AÇÕES ESTÁVEIS (melhor prática para funções)
  const selectProfessional = useBookingProcessStore(
    (state) => state.selectProfessional
  );
  const goToPreviousStep = useBookingProcessStore(
    (state) => state.goToPreviousStep
  );

  // Early return: se o provider não estiver selecionado, ou se não houver serviços selecionados
  if (!provider || selectedServices.length === 0) return null;

  // Garante que 'professionals' é um array, tratando o caso em que 'providerProfessionals' é null.
  const professionals: Professional[] = providerProfessionals || [];

  // 3. FILTRAGEM
  const availableProfessionals: Professional[] = professionals.filter(
    (professional) => {
      // Pega os IDs dos serviços que o profissional oferece
      const professionalServiceIds = professional.services.map((s) => s.id);
      // Verifica se o profissional oferece TODOS os serviços que foram selecionados
      return selectedServices.every((selectedService) =>
        professionalServiceIds.includes(selectedService.id)
      );
    }
  );

  // 4. ESTADO DE CARREGAMENTO (UX)
  if (isLoadingProfessionals || providerProfessionals === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="text-gray-400 ml-4">
          Buscando profissionais disponíveis...
        </p>
      </div>
    );
  }

  // 5. ESTADO DE NENHUM PROFISSIONAL (UX Aprimorada)
  if (availableProfessionals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center max-w-lg mx-auto bg-black/30 p-8 rounded-2xl border border-red-500/50 shadow-2xl"
      >
        <Users size={48} className="mx-auto text-red-500/50" />

        <h2 className="text-2xl font-bold text-white mt-4 mb-2">
          Nenhum Profissional Disponível
        </h2>

        <p className="text-gray-400 mb-6">
          Não encontramos um único profissional que realize *todos* os serviços
          selecionados. Por favor, volte e altere sua seleção de serviços.
        </p>

        <button
          onClick={goToPreviousStep}
          className="secondary-button transition hover:bg-red-700/50 hover:text-white border-red-500"
        >
          Voltar e alterar serviços
        </button>
      </motion.div>
    );
  }

  // 6. RENDERIZAÇÃO PRINCIPAL com micro-interações
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Escolha o Profissional
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {availableProfessionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          return (
            <motion.button
              key={professional.id}
              onClick={() => selectProfessional(professional)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 flex flex-col items-center gap-4 bg-black/30 rounded-2xl border-2 transition-all duration-300
                ${
                  isSelected
                    ? "border-amber-500 ring-4 ring-amber-500/20 bg-amber-500/10"
                    : "border-gray-700 hover:border-amber-500/50 hover:bg-gray-800/50"
                }
              `}
            >
              {isSelected && (
                <CheckCircle
                  size={24}
                  className="absolute top-2 right-2 text-amber-500 bg-black rounded-full p-0.5"
                />
              )}

              <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-600 transition-all">
                {professional.photoURL ? (
                  <img
                    src={professional.photoURL}
                    alt={professional.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-gray-500" />
                )}
              </div>

              <h3
                className={`text-lg font-semibold text-center ${
                  isSelected ? "text-amber-400" : "text-white"
                }`}
              >
                {professional.name}
              </h3>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <button
          onClick={goToPreviousStep}
          className="secondary-button transition hover:bg-gray-700/50"
        >
          Voltar
        </button>
      </div>
    </motion.div>
  );
};