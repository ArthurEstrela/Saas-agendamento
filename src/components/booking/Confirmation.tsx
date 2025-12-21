// src/components/booking/Confirmation.tsx
import { useState, useMemo } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { 
  Loader2, Calendar, User, Scissors, Clock, 
  QrCode, CreditCard, Copy, CheckCircle2 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { ClientProfile, PaymentMethod } from "../../types";
import { FaWhatsapp } from "react-icons/fa";

export const Confirmation = () => {
  const {
    selectedServices,
    provider,
    selectedProfessional,
    selectedDate,
    selectedTimeSlot,
    status,
    confirmBooking,
    goToPreviousStep,
    setRedirectUrlAfterLogin,
    resetBookingState, // Usado para resetar ao finalizar
  } = useBookingProcessStore();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { userProfile } = useProfileStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [showPixModal, setShowPixModal] = useState(false);

  const { totalDuration, totalPrice } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalDuration += service.duration;
        acc.totalPrice += service.price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  const handleConfirm = async () => {
    // 1. Verificação de Autenticação
    if (!isAuthenticated) {
      if (provider?.id) {
        const redirectPath = `/book/${provider.id}`;
        setRedirectUrlAfterLogin(redirectPath);
        navigate(`/login`);
      }
      return;
    }

    // 2. Verificação de Perfil
    if (!userProfile || userProfile.role !== "client") {
      toast.error("Apenas usuários do tipo 'Cliente' podem realizar agendamentos.");
      return;
    }

    // 3. Executa a confirmação
    await confirmBooking(userProfile as ClientProfile, paymentMethod);

    // 4. Se for Pix e deu certo, mostra o Modal
    if (useBookingProcessStore.getState().status.isSuccess) {
      if (paymentMethod === "pix") {
        setShowPixModal(true);
      } else {
        // Se for dinheiro/cartão, redireciona para dashboard ou sucesso
        toast.success("Redirecionando...");
        setTimeout(() => {
            resetBookingState(true); // Mantém o provider carregado mas limpa seleção
            navigate("/client/appointments");
        }, 2000);
      }
    }
  };

  const copyPixKey = () => {
    if (provider?.pixKey) {
      navigator.clipboard.writeText(provider.pixKey);
      toast.success("Chave Pix copiada!");
    }
  };

  const openWhatsApp = () => {
    if (!provider?.socialLinks?.whatsapp && !provider?.businessPhone) {
        toast.error("Número de WhatsApp não disponível.");
        return;
    }
    
    // Pega o número disponível
    let phone = provider.socialLinks?.whatsapp || provider.businessPhone || "";
    phone = phone.replace(/\D/g, ""); // Remove caracteres não numéricos

    const message = `Olá! Acabei de agendar *${selectedServices.map(s => s.name).join(", ")}* para *${selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : ""}* às *${selectedTimeSlot}*. Segue o comprovante do Pix!`;
    
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "Data não selecionada";

  // --- RENDERIZAÇÃO DO MODAL DE PIX ---
  if (showPixModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-[#daa520] p-6 rounded-2xl max-w-md w-full shadow-2xl relative">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Agendamento Realizado!</h2>
            <p className="text-gray-400 mt-2">Para confirmar, faça o Pix agora.</p>
          </div>

          <div className="bg-white/5 p-6 rounded-xl border border-dashed border-gray-600 mb-6 flex flex-col items-center">
            <span className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Chave Pix ({provider?.pixKeyType || "Aleatória"})</span>
            <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg w-full max-w-[280px]">
                <code className="text-[#daa520] font-mono text-sm truncate flex-1 text-center select-all">
                    {provider?.pixKey || "Chave não cadastrada"}
                </code>
            </div>
            <button 
                onClick={copyPixKey}
                className="mt-4 text-sm flex items-center gap-2 text-white hover:text-[#daa520] transition-colors"
            >
                <Copy size={16} /> Copiar Chave
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={openWhatsApp}
              className="w-full py-4 rounded-xl font-bold bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#25D366]/20"
            >
              <FaWhatsapp size={24} />
              Enviar Comprovante no WhatsApp
            </button>
            
            <button
              onClick={() => {
                resetBookingState(true);
                navigate("/client/appointments");
              }}
              className="w-full py-3 text-gray-400 hover:text-white text-sm"
            >
              Já enviei, ver meus agendamentos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-black/30 p-8 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Confirme os Detalhes
      </h2>

      <div className="space-y-4">
        {/* Resumo (Sem alterações visuais drásticas) */}
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="font-semibold text-[#daa520] mb-3 flex items-center gap-2">
            <Scissors size={18} /> Serviços Selecionados
          </h3>
          <ul className="space-y-2">
            {selectedServices.map((service) => (
              <li
                key={service.id}
                className="flex justify-between items-center text-gray-300"
              >
                <span>{service.name}</span>
                <span className="font-mono">R$ {service.price.toFixed(2)}</span>
              </li>
            ))}
            <li className="flex justify-between items-center text-white font-bold border-t border-gray-700 pt-3 mt-3">
              <span>Total</span>
              <span className="font-mono">R$ {totalPrice.toFixed(2)}</span>
            </li>
          </ul>
        </div>

        {/* Info Data/Profissional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#daa520] mb-2 flex items-center gap-2">
              <Calendar size={18} /> Início do Atendimento
            </h3>
            <p className="text-white capitalize">{formattedDate}</p>
            <p className="text-white font-bold text-lg">{selectedTimeSlot}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-[#daa520] mb-2 flex items-center gap-2">
              <User size={18} /> Profissional
            </h3>
            <p className="text-white">
              {selectedProfessional?.name || "Não selecionado"}
            </p>
          </div>
        </div>

        {/* --- SELEÇÃO DE PAGAMENTO --- */}
        <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Como deseja pagar?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção Pix */}
                <button
                    onClick={() => setPaymentMethod("pix")}
                    className={`relative p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        paymentMethod === "pix"
                        ? "border-[#daa520] bg-[#daa520]/10"
                        : "border-gray-700 hover:border-gray-600 bg-gray-800/30"
                    }`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "pix" ? "border-[#daa520]" : "border-gray-500"}`}>
                        {paymentMethod === "pix" && <div className="w-2.5 h-2.5 bg-[#daa520] rounded-full" />}
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-semibold flex items-center gap-2">
                             <QrCode size={18} /> Pix
                        </span>
                        <span className="text-xs text-gray-400">Pague agora e envie o comprovante</span>
                    </div>
                    {/* Badge Recomendado */}
                    <span className="absolute -top-3 -right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        AGILIZAR
                    </span>
                </button>

                {/* Opção No Local */}
                <button
                    onClick={() => setPaymentMethod("cash")} // ou credit_card
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        paymentMethod === "cash"
                        ? "border-[#daa520] bg-[#daa520]/10"
                        : "border-gray-700 hover:border-gray-600 bg-gray-800/30"
                    }`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-[#daa520]" : "border-gray-500"}`}>
                        {paymentMethod === "cash" && <div className="w-2.5 h-2.5 bg-[#daa520] rounded-full" />}
                    </div>
                    <div className="text-left">
                        <span className="block text-white font-semibold flex items-center gap-2">
                             <CreditCard size={18} /> No Local
                        </span>
                        <span className="text-xs text-gray-400">Pague com dinheiro ou cartão na hora</span>
                    </div>
                </button>
            </div>
        </div>

      </div>

      {/* Ações */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button
          onClick={goToPreviousStep}
          className="secondary-button w-full"
          disabled={status.isConfirming}
        >
          Voltar
        </button>
        <button
          onClick={handleConfirm}
          disabled={status.isConfirming}
          className="primary-button w-full flex justify-center items-center gap-2"
        >
          {status.isConfirming ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Confirmando...</span>
            </>
          ) : (
            "Confirmar Agendamento"
          )}
        </button>
      </div>
    </div>
  );
};