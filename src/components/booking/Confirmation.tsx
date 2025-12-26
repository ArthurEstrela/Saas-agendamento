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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [showPixModal, setShowPixModal] = useState(false);

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
        toast.success("Agendado com sucesso!");
        setTimeout(() => {
          resetBookingState(true);
          navigate("/dashboard");
        }, 2000);
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
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Quase lá!</h2>
          <p className="text-gray-400">
            Confira os detalhes e escolha como pagar.
          </p>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 space-y-6">
            {/* Resumo do Serviço */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Scissors size={14} /> Serviços
              </h3>
              <div className="bg-black/20 rounded-lg p-3 space-y-2 border border-gray-800">
                {selectedServices.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between text-sm text-gray-200"
                  >
                    <span>{s.name}</span>
                    <span>R$ {s.price.toFixed(2)}</span>
                  </div>
                ))}
                <Separator className="bg-gray-700" />
                <div className="flex justify-between font-bold text-primary text-lg">
                  <span>Total</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Data e Profissional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Data
                </h3>
                <div className="text-white font-medium capitalize">
                  {formattedDate}
                </div>
                <div className="text-2xl font-bold text-white">
                  {selectedTimeSlot}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User size={14} /> Profissional
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                    <User size={16} />
                  </div>
                  <span className="text-white font-medium">
                    {selectedProfessional?.name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Forma de Pagamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start border-2 relative hover:bg-gray-800",
                paymentMethod === "pix"
                  ? "border-primary bg-primary/5"
                  : "border-gray-700 bg-gray-900"
              )}
              onClick={() => setPaymentMethod("pix")}
            >
              <div className="flex items-center gap-4 w-full">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    paymentMethod === "pix"
                      ? "bg-primary text-black"
                      : "bg-gray-800 text-gray-400"
                  )}
                >
                  <QrCode size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white">Pix</div>
                  <div className="text-xs text-gray-400">
                    Aprovação imediata
                  </div>
                </div>
                {paymentMethod === "pix" && (
                  <div className="h-4 w-4 rounded-full bg-primary border-2 border-black" />
                )}
              </div>
              {paymentMethod === "pix" && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  RÁPIDO
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start border-2 hover:bg-gray-800",
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5"
                  : "border-gray-700 bg-gray-900"
              )}
              onClick={() => setPaymentMethod("cash")}
            >
              <div className="flex items-center gap-4 w-full">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    paymentMethod === "cash"
                      ? "bg-primary text-black"
                      : "bg-gray-800 text-gray-400"
                  )}
                >
                  <CreditCard size={20} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-white">Pagar no Local</div>
                  <div className="text-xs text-gray-400">
                    Dinheiro ou Cartão
                  </div>
                </div>
                {paymentMethod === "cash" && (
                  <div className="h-4 w-4 rounded-full bg-primary border-2 border-black" />
                )}
              </div>
            </Button>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={goToPreviousStep}
            className="flex-1"
            disabled={status.isConfirming}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-[2] font-bold text-base"
            disabled={status.isConfirming}
          >
            {status.isConfirming ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="mr-2" />
            )}{" "}
            Confirmar Agendamento
          </Button>
        </div>
      </div>

      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <div className="h-12 w-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <span>Agendamento Realizado!</span>
            </DialogTitle>
            <DialogDescription className="text-center">
              Realize o pagamento para garantir seu horário.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white p-6 rounded-xl flex flex-col items-center justify-center my-2 shadow-inner">
            {pixPayload ? (
              <QRCodeCanvas value={pixPayload} size={180} />
            ) : (
              <div className="h-40 w-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                Sem chave Pix
              </div>
            )}
            <div className="mt-4 text-center text-gray-900">
              <p className="text-xs font-bold uppercase text-gray-500">
                Valor Total
              </p>
              <p className="text-2xl font-extrabold">
                R$ {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={copyPixCode}>
              <Copy size={16} className="mr-2" /> Copiar Código Pix
            </Button>
            <Button
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
              onClick={openWhatsApp}
            >
              <FaWhatsapp size={18} className="mr-2" /> Enviar Comprovante
            </Button>
            <Button
              variant="ghost"
              className="w-full text-xs text-gray-500"
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
    </>
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
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ polynomial;
      else crc = crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
