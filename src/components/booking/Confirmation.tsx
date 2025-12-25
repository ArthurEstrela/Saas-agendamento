import { useState, useMemo } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import type { ClientProfile, PaymentMethod } from "../../types";
import { FaWhatsapp } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "../../lib/utils/cn";

// Primitivos
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

// ... [Funções generatePixPayload e calculateCRC16 permanecem iguais no final do arquivo] ...
// (Vou omitir as funções auxiliares para não ficar gigante, mantenha elas no final do arquivo igual estava)

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [showPixModal, setShowPixModal] = useState(false);

  const { totalPrice } = useMemo(() => {
    return selectedServices.reduce(
      (acc, service) => {
        acc.totalDuration += service.duration;
        acc.totalPrice += service.price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [selectedServices]);

  const pixPayload = useMemo(() => {
    if (!provider?.pixKey) return "";
    return generatePixPayload({
      key: provider.pixKey,
      name: provider.businessName || provider.name,
      city: provider.businessAddress?.city || "Brasil",
      amount: totalPrice,
      txid: "SAAS" + Math.floor(Math.random() * 1000),
    });
  }, [provider, totalPrice]);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      if (provider?.id) {
        const redirectPath = `/book/${provider.id}`;
        setRedirectUrlAfterLogin(redirectPath);
        navigate(`/login`);
      }
      return;
    }
    if (!userProfile || userProfile.role !== "client") {
      toast.error(
        "Apenas usuários do tipo 'Cliente' podem realizar agendamentos."
      );
      return;
    }

    await confirmBooking(userProfile as ClientProfile, paymentMethod);

    if (useBookingProcessStore.getState().status.isSuccess) {
      if (paymentMethod === "pix") {
        setShowPixModal(true);
      } else {
        toast.success("Redirecionando...");
        setTimeout(() => {
          resetBookingState(true);
          navigate("/dashboard");
        }, 2000);
      }
    }
  };

  const copyPixCode = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      toast.success("Código 'Pix Copia e Cola' copiado!");
    } else if (provider?.pixKey) {
      navigator.clipboard.writeText(provider.pixKey);
      toast.success("Chave Pix copiada!");
    }
  };

  const openWhatsApp = () => {
    if (!provider?.socialLinks?.whatsapp && !provider?.businessPhone) {
      toast.error("Número de WhatsApp não disponível.");
      return;
    }
    let phone = provider.socialLinks?.whatsapp || provider.businessPhone || "";
    phone = phone.replace(/\D/g, "");
    const message = `Olá! Acabei de agendar *${selectedServices
      .map((s) => s.name)
      .join(", ")}* para *${
      selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : ""
    }* às *${selectedTimeSlot}*. Segue o comprovante do Pix!`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : "Data não selecionada";

  return (
    <>
      <div className="max-w-2xl mx-auto bg-black/30 p-8 rounded-2xl">
        <Typography variant="h2" className="text-center mb-6">
          Confirme os Detalhes
        </Typography>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <Scissors size={18} /> Serviços Selecionados
            </h3>
            <ul className="space-y-2">
              {selectedServices.map((service) => (
                <li
                  key={service.id}
                  className="flex justify-between items-center text-gray-300"
                >
                  <span>{service.name}</span>
                  <span className="font-mono">
                    R$ {service.price.toFixed(2)}
                  </span>
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
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Calendar size={18} /> Início do Atendimento
              </h3>
              <p className="text-white capitalize">{formattedDate}</p>
              <p className="text-white font-bold text-lg">{selectedTimeSlot}</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <User size={18} /> Profissional
              </h3>
              <p className="text-white">
                {selectedProfessional?.name || "Não selecionado"}
              </p>
            </div>
          </div>

          {/* SELEÇÃO DE PAGAMENTO */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <Typography variant="h4" className="mb-4">
              Como deseja pagar?
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Botão Pix Customizado com Button Primitive */}
              <Button
                variant="outline"
                onClick={() => setPaymentMethod("pix")}
                className={cn(
                  "h-auto p-4 flex items-center justify-start gap-3 border-2 relative",
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/10 hover:bg-primary/20"
                    : "border-gray-700 bg-gray-800/30"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    paymentMethod === "pix"
                      ? "border-primary"
                      : "border-gray-500"
                  )}
                >
                  {paymentMethod === "pix" && (
                    <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-white font-semibold flex items-center gap-2">
                    <QrCode size={18} /> Pix
                  </span>
                  <span className="text-xs text-gray-400">
                    QR Code instantâneo
                  </span>
                </div>
                <span className="absolute -top-3 -right-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  AGILIZAR
                </span>
              </Button>

              {/* Botão Dinheiro Customizado */}
              <Button
                variant="outline"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "h-auto p-4 flex items-center justify-start gap-3 border-2",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/10 hover:bg-primary/20"
                    : "border-gray-700 bg-gray-800/30"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    paymentMethod === "cash"
                      ? "border-primary"
                      : "border-gray-500"
                  )}
                >
                  {paymentMethod === "cash" && (
                    <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-white font-semibold flex items-center gap-2">
                    <CreditCard size={18} /> No Local
                  </span>
                  <span className="text-xs text-gray-400">
                    Dinheiro ou Cartão
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-8">
          <Button
            variant="secondary"
            onClick={goToPreviousStep}
            className="w-full"
            disabled={status.isConfirming}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={status.isConfirming}
            className="w-full"
          >
            {status.isConfirming ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Confirmando...
              </>
            ) : (
              "Confirmar Agendamento"
            )}
          </Button>
        </div>
      </div>

      {/* MODAL PIX COM PRIMITIVO DIALOG */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-primary">
          <DialogHeader>
            <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <DialogTitle className="text-center text-xl text-white">
              Agendamento Confirmado!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Escaneie o QR Code ou copie o código abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center shadow-inner my-2">
            {pixPayload ? (
              <QRCodeCanvas value={pixPayload} size={200} />
            ) : (
              <div className="h-[200px] w-[200px] flex items-center justify-center text-gray-400 bg-gray-100 rounded">
                Sem Chave Pix
              </div>
            )}
            <div className="mt-3 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase">
                Valor a pagar
              </p>
              <p className="text-gray-900 text-2xl font-bold">
                R$ {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={copyPixCode}
              className="w-full border-primary/50 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Copy size={16} className="mr-2" /> Copiar "Pix Copia e Cola"
            </Button>

            <div className="text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
                Chave Pix Manual ({provider?.pixKeyType || "Aleatória"})
              </span>
              <code className="text-gray-300 font-mono text-xs break-all bg-black/30 p-2 rounded block">
                {provider?.pixKey || "Chave não cadastrada"}
              </code>
            </div>

            <Button
              onClick={openWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-0"
            >
              <FaWhatsapp size={20} className="mr-2" /> Enviar Comprovante
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                resetBookingState(true);
                navigate("/dashboard");
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Pagar depois / Ver meus agendamentos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ... MANTER AS FUNÇÕES AUXILIARES DE PIX AQUI ...
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

  // Montagem dos campos EMV
  const payloadKey = `0014br.gov.bcb.pix01${key.length
    .toString()
    .padStart(2, "0")}${key}`;

  const merchantAccountInfo = `26${payloadKey.length
    .toString()
    .padStart(2, "0")}${payloadKey}`;

  const merchantCategoryCode = "52040000";
  const transactionCurrency = "5303986"; // BRL
  const transactionAmount = `54${formatAmount(amount)
    .length.toString()
    .padStart(2, "0")}${formatAmount(amount)}`;
  const countryCode = "5802BR";
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

  const payloadNoCrc = `000201${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${merchantName}${merchantCity}${additionalDataField}6304`;

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
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
