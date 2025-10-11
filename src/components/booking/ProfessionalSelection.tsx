// src/components/booking/ProfessionalSelection.tsx
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { CheckCircle, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

export const ProfessionalSelection = () => {
  const {
    professionals,
    selectedServices,
    selectedProfessional,
    selectProfessional,
    goToNextStep,
    goToPreviousStep,
  } = useBookingProcessStore();

  const availableProfessionals = useMemo(() => {
    if (!selectedServices || selectedServices.length === 0) return [];
    const selectedServiceIds = selectedServices.map((s) => s.id);
    return professionals.filter((prof) =>
      selectedServiceIds.every((serviceId) =>
        prof.services.some((ps) => ps.id === serviceId)
      )
    );
  }, [professionals, selectedServices]);

  // Seu JSX para o estado de "Nenhum Profissional" está perfeito e foi mantido.
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
          Não encontramos um profissional que realize *todos* os serviços
          selecionados.
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
              // ✅ AÇÃO ATUALIZADA: Apenas seleciona, não avança mais.
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

      {/* ✅ NOVO: Barra de navegação adicionada para consistência */}
      <div className="sticky bottom-0 mt-8 py-4 px-6 bg-gray-900/80 backdrop-blur-sm rounded-t-2xl border-t border-gray-800 flex justify-between items-center gap-4 max-w-4xl mx-auto">
        <button onClick={goToPreviousStep} className="secondary-button">
          Voltar
        </button>
        <button
          onClick={goToNextStep}
          disabled={!selectedProfessional}
          className="primary-button w-full md:w-auto"
        >
          Avançar para Data e Hora
        </button>
      </div>
    </motion.div>
  );
};
