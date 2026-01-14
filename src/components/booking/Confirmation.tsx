import { useState, useMemo, useEffect } from "react";
import { useBookingProcessStore } from "../../store/bookingProcessStore";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import {
  Loader2,
  Calendar,
  User,
  Scissors,
  QrCode,
  CreditCard,
  Copy,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { ClientProfile, PaymentMethod } from "../../types";
import { FaWhatsapp } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "../../lib/utils/cn";

// UI Components
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { motion } from "framer-motion";

// ... (Funções auxiliares de Pix mantidas no final) ...

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
    resetBookingState,
  } = useBookingProcessStore();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { userProfile } = useProfileStore();

  const availableMethods = useMemo(() => {
    const methods = provider?.paymentMethods || [];
    const hasPix = methods.includes("pix") && !!provider?.pixKey;
    const hasOnSite =
      methods.includes("cash") || methods.includes("credit_card");

    return { hasPix, hasOnSite };
  }, [provider]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    if (availableMethods.hasPix) return "pix";
    if (availableMethods.hasOnSite) return "cash";
    return "cash";
  });

  const [showPixModal, setShowPixModal] = useState(false);

  useEffect(() => {
    if (
      paymentMethod === "pix" &&
      !availableMethods.hasPix &&
      availableMethods.hasOnSite
    ) {
      setPaymentMethod("cash");
    }
  }, [availableMethods, paymentMethod]);

  const { totalPrice } = useMemo(
    () =>
      selectedServices.reduce(
        (acc, s) => ({
          totalDuration: acc.totalDuration + s.duration,
          totalPrice: acc.totalPrice + s.price,
        }),
        { totalDuration: 0, totalPrice: 0 }
      ),
    [selectedServices]
  );

  const pixPayload = useMemo(() => {
    if (!provider?.pixKey) return "";
    let key = provider.pixKey.trim();

    if (provider.pixKeyType === "phone") {
      const numbersOnly = key.replace(/\D/g, "");
      if (numbersOnly.length === 11) {
        key = `+55${numbersOnly}`;
      } else if (numbersOnly.length === 13 && !key.startsWith("+")) {
        key = `+${numbersOnly}`;
      }
    } else if (provider.pixKeyType === "cpf" || provider.pixKeyType === "cnpj") {
      key = key.replace(/\D/g, "");
    } else {
      key = key.replace(/\s+/g, "");
    }

    return generatePixPayload({
      key: key,
      name: provider.businessName || provider.name,
      city: provider.businessAddress?.city || "Brasil",
      amount: totalPrice,
      txid: "SAAS" + Math.floor(Math.random() * 1000),
    });
  }, [provider, totalPrice]);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      if (provider?.id) {
        setRedirectUrlAfterLogin(`/book/${provider.id}`);
        navigate(`/login`);
      }
      return;
    }
    if (!userProfile || userProfile.role !== "client") {
      toast.error("Apenas clientes podem agendar.");
      return;
    }
    await confirmBooking(userProfile as ClientProfile, paymentMethod);
    if (useBookingProcessStore.getState().status.isSuccess) {
      if (paymentMethod === "pix") setShowPixModal(true);
      else {
        setTimeout(() => {
          resetBookingState(true);
          navigate("/dashboard");
        }, 1000);
      }
    }
  };

  const copyPixCode = () => {
    const code = pixPayload || provider?.pixKey;
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("Código copiado!");
    }
  };

  const openWhatsApp = () => {
    const phone = (
      provider?.socialLinks?.whatsapp ||
      provider?.businessPhone ||
      ""
    ).replace(/\D/g, "");
    if (!phone) return toast.error("WhatsApp indisponível.");
    const msg = `Olá! Agendei *${selectedServices
      .map((s) => s.name)
      .join(", ")}* para *${
      selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : ""
    } às ${selectedTimeSlot}*. Segue o comprovante!`;
    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pb-24 md:pb-10" // Padding extra no mobile para o footer não cobrir
    >
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 px-2 md:px-0">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Quase lá!</h2>
          <p className="text-gray-400 text-sm md:text-base">
            Confira os detalhes e escolha como pagar.
          </p>
        </div>

        {/* Card Principal Otimizado */}
        <Card className="bg-[#18181b] md:bg-gray-900/60 border-white/5 md:backdrop-blur-md md:shadow-2xl overflow-hidden">
          {/* Header do Card (Total) */}
          <div className="bg-[#27272a] md:bg-primary/10 p-4 md:p-6 flex justify-between items-center border-b border-white/5">
            <div>
              <p className="text-[10px] md:text-xs text-primary font-bold uppercase tracking-wider">
                Valor Total
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-white">
                R$ {totalPrice.toFixed(2)}
              </p>
            </div>
            <div className="bg-black/20 p-2 md:p-3 rounded-full">
              <CreditCard size={20} className="text-primary md:w-6 md:h-6" />
            </div>
          </div>

          <CardContent className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Resumo do Serviço */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Scissors size={12} className="md:w-[14px] md:h-[14px]" /> Serviços Selecionados
              </h3>
              <div className="bg-[#27272a] md:bg-black/20 rounded-xl p-3 md:p-4 space-y-3 border border-white/5">
                {selectedServices.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center text-sm group"
                  >
                    <span className="text-gray-300 group-hover:text-white transition-colors font-medium text-xs md:text-sm">
                      {s.name}
                    </span>
                    <span className="text-gray-400 text-xs md:text-sm">
                      R$ {s.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data e Profissional (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={12} className="md:w-[14px] md:h-[14px]" /> Quando?
                </h3>
                <div className="bg-[#27272a] md:bg-black/20 p-3 md:p-4 rounded-xl border border-white/5">
                  <div className="text-white font-bold capitalize text-base md:text-lg">
                    {formattedDate}
                  </div>
                  <div className="text-primary font-bold text-lg md:text-xl mt-1">
                    às {selectedTimeSlot}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={12} className="md:w-[14px] md:h-[14px]" /> Com quem?
                </h3>
                <div className="bg-[#27272a] md:bg-black/20 p-3 md:p-4 rounded-xl border border-white/5 flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
                    {selectedProfessional?.photoURL ? (
                      <img
                        src={selectedProfessional.photoURL}
                        alt="Profissional"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} className="md:w-5 md:h-5" />
                    )}
                  </div>
                  <span className="text-white font-bold text-base md:text-lg">
                    {selectedProfessional?.name}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Pagamento */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                Forma de Pagamento
              </h3>

              {!availableMethods.hasPix && !availableMethods.hasOnSite && (
                <div className="text-red-400 text-xs md:text-sm bg-red-400/10 p-3 md:p-4 rounded-lg border border-red-400/20">
                  Este prestador não configurou métodos de pagamento.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {/* Botão Pix */}
                {availableMethods.hasPix && (
                  <Button
                    variant="outline"
                    className={cn(
                      "h-auto p-4 md:p-5 justify-start border-2 relative hover:bg-gray-800 transition-all active:scale-[0.98]",
                      paymentMethod === "pix"
                        ? "border-primary bg-primary/10"
                        : "border-gray-700 bg-[#27272a] md:bg-gray-900/50"
                    )}
                    onClick={() => setPaymentMethod("pix")}
                  >
                    <div className="flex items-center gap-3 md:gap-4 w-full">
                      <div
                        className={cn(
                          "p-2 md:p-3 rounded-full transition-colors",
                          paymentMethod === "pix"
                            ? "bg-primary text-black"
                            : "bg-gray-800 text-gray-400"
                        )}
                      >
                        <QrCode size={20} className="md:w-6 md:h-6" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-white text-sm md:text-base">
                          Pix
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                          Aprovação imediata
                        </div>
                      </div>
                      {paymentMethod === "pix" && (
                        <CheckCircle2 className="text-primary md:w-6 md:h-6" size={20} />
                      )}
                    </div>
                  </Button>
                )}

                {/* Botão Pagar no Local */}
                {availableMethods.hasOnSite && (
                  <Button
                    variant="outline"
                    className={cn(
                      "h-auto p-4 md:p-5 justify-start border-2 hover:bg-gray-800 transition-all active:scale-[0.98]",
                      paymentMethod === "cash"
                        ? "border-primary bg-primary/10"
                        : "border-gray-700 bg-[#27272a] md:bg-gray-900/50"
                    )}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <div className="flex items-center gap-3 md:gap-4 w-full">
                      <div
                        className={cn(
                          "p-2 md:p-3 rounded-full transition-colors",
                          paymentMethod === "cash"
                            ? "bg-primary text-black"
                            : "bg-gray-800 text-gray-400"
                        )}
                      >
                        <CreditCard size={20} className="md:w-6 md:h-6" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-white text-sm md:text-base">
                          Pagar no Local
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate max-w-[120px] md:max-w-none">
                          {[
                            provider?.paymentMethods?.includes("cash") && "Dinheiro",
                            provider?.paymentMethods?.includes("credit_card") && "Cartão",
                          ]
                            .filter(Boolean)
                            .join(" ou ") || "No balcão"}
                        </div>
                      </div>
                      {paymentMethod === "cash" && (
                        <CheckCircle2 className="text-primary md:w-6 md:h-6" size={20} />
                      )}
                    </div>
                  </Button>
                )}
              </div>
            </div>

            {/* Botões Desktop (Escondidos no mobile para usar o footer fixo) */}
            <div className="hidden md:flex gap-4 pt-6">
              <Button
                variant="ghost"
                onClick={goToPreviousStep}
                className="flex-1 border border-white/5 hover:bg-white/5"
                disabled={status.isConfirming}
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-[2] font-bold text-base h-12 shadow-lg shadow-primary/20"
                disabled={
                  status.isConfirming ||
                  (!availableMethods.hasPix && !availableMethods.hasOnSite)
                }
              >
                {status.isConfirming ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="mr-2" />
                )}{" "}
                Confirmar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Fixo Mobile Otimizado */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-2 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto bg-[#121214] border-t border-white/10 shadow-2xl p-3 flex justify-between items-center gap-3 ring-1 ring-white/5 rounded-xl">
           <Button
            variant="ghost"
            onClick={goToPreviousStep}
            className="hover:bg-white/5 px-2"
            disabled={status.isConfirming}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 font-bold text-sm h-10 shadow-lg shadow-primary/10"
            disabled={
              status.isConfirming ||
              (!availableMethods.hasPix && !availableMethods.hasOnSite)
            }
          >
             {status.isConfirming ? (
                  <Loader2 className="animate-spin mr-2 w-4 h-4" />
                ) : (
                  <CheckCircle2 className="mr-2 w-4 h-4" />
                )}
            Confirmar
          </Button>
        </div>
      </div>

      {/* Modal Pix Otimizado */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="w-[90%] rounded-xl sm:max-w-md bg-[#18181b] border-gray-800 shadow-2xl px-4 py-6">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-4">
              <div className="h-14 w-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
                <CheckCircle2 size={32} />
              </div>
              <span className="text-lg md:text-xl font-bold text-white">Agendamento Realizado!</span>
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 text-sm">
              Escaneie o QR Code abaixo para pagar.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center my-4">
            {pixPayload ? (
              <QRCodeCanvas value={pixPayload} size={180} />
            ) : (
              <div className="h-32 w-32 bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                Chave não configurada
              </div>
            )}
            <div className="mt-4 text-center text-gray-900 border-t border-gray-200 pt-3 w-full">
              <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                Valor a Pagar
              </p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                R$ {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              variant="outline"
              className="w-full h-10 border-gray-700 hover:bg-gray-800 text-gray-300 text-sm"
              onClick={copyPixCode}
            >
              <Copy size={16} className="mr-2" /> Copiar Código
            </Button>
            <Button
              className="w-full h-10 bg-[#25D366] hover:bg-[#128C7E] text-white border-none font-bold shadow-lg shadow-green-900/10 text-sm"
              onClick={openWhatsApp}
            >
              <FaWhatsapp size={18} className="mr-2" /> Enviar Comprovante
            </Button>
            <Button
              variant="ghost"
              className="w-full h-8 text-xs text-gray-500 hover:text-gray-300"
              onClick={() => {
                resetBookingState(true);
                navigate("/dashboard");
              }}
            >
              Fechar e Pagar Depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ... Funções auxiliares mantidas ...
interface PixData {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid?: string;
}
function generatePixPayload({
  key,
  name,
  city,
  amount,
  txid = "***",
}: PixData): string {
  const formatText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  const formatAmount = (val: number) => val.toFixed(2);
  const nameFormatted = formatText(name).substring(0, 25);
  const cityFormatted = formatText(city).substring(0, 15);
  const txidFormatted = formatText(txid).substring(0, 25);
  const payloadKey = `0014br.gov.bcb.pix01${key.length
    .toString()
    .padStart(2, "0")}${key}`;
  const merchantAccountInfo = `26${payloadKey.length
    .toString()
    .padStart(2, "0")}${payloadKey}`;
  const transactionAmount = `54${formatAmount(amount)
    .length.toString()
    .padStart(2, "0")}${formatAmount(amount)}`;
  const merchantName = `59${nameFormatted.length
    .toString()
    .padStart(2, "0")}${nameFormatted}`;
  const merchantCity = `60${cityFormatted.length
    .toString()
    .padStart(2, "0")}${cityFormatted}`;
  const additionalDataField = `62${(txidFormatted.length + 4)
    .toString()
    .padStart(2, "0")}05${txidFormatted.length
    .toString()
    .padStart(2, "0")}${txidFormatted}`;
  const payloadNoCrc = `000201${merchantAccountInfo}520400005303986${transactionAmount}5802BR${merchantName}${merchantCity}${additionalDataField}6304`;
  const crc = calculateCRC16(payloadNoCrc);
  return `${payloadNoCrc}${crc}`;
}
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        // Aplique o & 0xFFFF aqui para manter o valor em 16 bits
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}