// src/components/ServiceProvider/ServiceCompletionModal.tsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, DollarSign, CheckCircle, Loader2, Info } from "lucide-react";

interface ServiceCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // A função onConfirm agora recebe o valor final como number
  onConfirm: (finalPrice: number) => void;
  initialPrice: number;
  isLoading: boolean;
}

// Helper de formatação (boa prática de reusabilidade)
const formatToBRL = (price: number): string => {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const ServiceCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialPrice,
  isLoading,
}: ServiceCompletionModalProps) => {
  // Inicializa o estado com o preço inicial (formatado para 2 casas decimais)
  const [priceString, setPriceString] = useState(initialPrice.toFixed(2));

  // Converte a string do input para número para validação e submissão
  const finalPriceValue = useMemo(() => parseFloat(priceString), [priceString]);

  const handleConfirm = () => {
    // Garante que a conversão foi bem sucedida e que o valor é maior ou igual a zero
    if (isNaN(finalPriceValue) || finalPriceValue < 0) return;
    onConfirm(finalPriceValue);
  };

  if (!isOpen) return null;

  // Variáveis de UX
  const isPriceValid = !isNaN(finalPriceValue) && finalPriceValue >= 0;
  const displayInitialPrice = formatToBRL(initialPrice);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="text-green-400" />
            Concluir Atendimento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition duration-200"
            aria-label="Fechar Modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Melhoria de UX: Informa o preço agendado */}
        <p className="text-gray-400 mb-4 text-sm flex items-center gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
          <Info className="text-amber-400 min-w-4" size={16} />
          Preço Original Agendado:{" "}
          <strong className="text-white">{displayInitialPrice}</strong>
        </p>

        <p className="text-gray-400 mb-6 text-sm">
          Ajuste o valor final do serviço. Este valor atualizado será registrado
          no seu Relatório Financeiro como Receita.
        </p>

        <div>
          <label
            htmlFor="finalPrice"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Valor Total Cobrado (R$)
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              id="finalPrice"
              type="number"
              value={priceString}
              onChange={(e) => {
                // Permite apenas números e o ponto decimal
                const cleanedValue = e.target.value.replace(/[^0-9.]/g, "");
                setPriceString(cleanedValue);
              }}
              // Adicionei classes de foco aprimoradas para melhor UX/Acessibilidade
              className="input-field pl-10 text-lg w-full bg-gray-800 border-gray-700 focus:ring-2 focus:ring-amber-500 transition duration-200"
              placeholder="0.00"
              step="0.01" // Permite a entrada de centavos
              autoFocus
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="secondary-button w-full"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            // Desabilita se estiver carregando ou se o preço for inválido/negativo
            disabled={isLoading || !isPriceValid}
            // Efeito de desabilitação mais claro com Tailwind
            className={`w-full flex items-center justify-center transition duration-200 ${
              isLoading || !isPriceValid
                ? "bg-amber-700/50 cursor-not-allowed text-gray-400"
                : "primary-button"
            }`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              "Confirmar e Concluir"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
