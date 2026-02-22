import { format, isBefore, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Scissors,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Star,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CancelAppointmentModal } from "../Common/CancelAppointmentModal";
import { useUserAppointmentsStore } from "../../store/userAppointmentsStore";
import ReviewModal from "../Common/ReviewModal";
import { useReviewStore } from "../../store/reviewStore";
import { FaWhatsapp } from "react-icons/fa";

// Componentes UI Primitivos
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

// ✨ IMPORTAÇÕES ESTRITAS
import type {
  Appointment,
  AppointmentItem,
  ServiceProviderProfile,
} from "../../types";

// Tipagem exata das variantes permitidas pelo componente Badge do Shadcn UI
type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

// Mapeamento de Status para Componentes Badge
const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.toLowerCase() as keyof typeof statusConfig;

  const statusConfig: Record<
    string,
    { label: string; variant: BadgeVariant; icon: React.ElementType }
  > = {
    scheduled: { label: "Confirmado", variant: "success", icon: CheckCircle },
    pending: { label: "Pendente", variant: "warning", icon: MoreHorizontal },
    completed: { label: "Concluído", variant: "secondary", icon: CheckCircle },
    cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
    no_show: {
      label: "Não Compareceu",
      variant: "destructive",
      icon: AlertCircle,
    },
    blocked: { label: "Bloqueado", variant: "outline", icon: XCircle },
  };

  const config = statusConfig[normalizedStatus] || {
    label: "Desconhecido",
    variant: "outline",
    icon: AlertCircle,
  };
  const Icon = config.icon;

  return (
    // ✨ REMOVIDO O 'as any' AQUI
    <Badge variant={config.variant} className="gap-1.5">
      <Icon size={12} /> {config.label}
    </Badge>
  );
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
};

// ✨ TIPAGEM SUPER ESTRITA PARA O ENRICHED APPOINTMENT
type EnrichedAppointment = Appointment & {
  professionalAvatarUrl?: string;
  providerAvatarUrl?: string;
  // ✨ REMOVIDO O 'any' AQUI. Usando Partial para aceitar que algumas props falhem no join.
  provider?: Partial<ServiceProviderProfile>;
  totalDuration?: number;
  totalPrice?: number;
};

export const ClientAppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedAppointment;
}) => {
  const {
    professionalName,
    startTime: rawStartTime,
    items,
    provider,
    professionalAvatarUrl,
    providerAvatarUrl,
    status: rawStatus,
  } = appointment;

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  const { submitReview, loading: isSubmitting } = useReviewStore();
  const { cancelAppointment, loading: isCancelling } =
    useUserAppointmentsStore();

  // Parsing seguro da data da API Java
  const startTime = new Date(rawStartTime);
  const status = rawStatus.toLowerCase();

  const formattedDate = format(startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = format(startTime, "HH:mm");

  const handleNavigation = () => {
    if (provider?.businessAddress) {
      const { street, city, state } = provider.businessAddress;
      const query = encodeURIComponent(`${street}, ${city}, ${state}`);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
      );
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    await submitReview(appointment.id, rating, comment);
    setReviewModalOpen(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    await cancelAppointment(appointment.id, reason);
    setCancelModalOpen(false);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone =
      provider?.businessPhone || provider?.socialLinks?.whatsapp || "";
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) return;

    const time = format(startTime, "HH:mm");
    const date = format(startTime, "dd/MM");
    const message = `Olá, gostaria de falar sobre meu agendamento para o dia ${date} às ${time} com ${professionalName}.`;

    window.open(
      `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const hasPhone = !!(
    provider?.businessPhone || provider?.socialLinks?.whatsapp
  );

  // --- LÓGICA DE CANCELAMENTO MELHORADA ---
  const minHoursNotice = provider?.cancellationMinHours ?? 2;
  const cancellationDeadline = subHours(startTime, minHoursNotice);
  const now = new Date();

  const canCancel =
    (status === "scheduled" ||
      status === "pending" ||
      status === "confirmed") &&
    isBefore(now, cancellationDeadline);

  const hasCancellationTimeExpired =
    (status === "scheduled" ||
      status === "pending" ||
      status === "confirmed") &&
    !isBefore(now, cancellationDeadline) &&
    isBefore(now, startTime);
  // -----------------------------------------

  const displayImage =
    professionalAvatarUrl || providerAvatarUrl || provider?.logoUrl;

  const initials =
    professionalName
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PR";

  const MotionCard = motion(Card);

  const hasReview = !!appointment.reviewId;
  const displayPrice =
    appointment.totalAmount ||
    appointment.finalAmount ||
    appointment.totalPrice ||
    0;

  // Como EnrichedAppointment já traz o totalDuration, usamos direto.
  const displayDuration = appointment.totalDuration || 30;

  return (
    <>
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors"
      >
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4 border-b border-gray-800/50 bg-gray-900/20">
          <Avatar className="h-14 w-14 border border-gray-700">
            <AvatarImage src={displayImage} alt={professionalName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-100">
                {professionalName}
              </h3>

              <div className="flex items-center gap-2">
                {hasPhone && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleWhatsAppClick}
                    className="h-8 w-8 rounded-full text-green-500 hover:text-white hover:bg-green-600 transition-colors"
                  >
                    <FaWhatsapp size={18} />
                  </Button>
                )}
                <StatusBadge status={rawStatus} />
              </div>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <span className="font-medium text-primary">
                {provider?.businessName || "Estabelecimento"}
              </span>
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                Data
              </span>
              <div className="flex items-center gap-2 text-gray-200">
                <Calendar size={16} className="text-primary" />
                <span className="text-sm capitalize font-medium">
                  {formattedDate}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                Horário
              </span>
              <div className="flex items-center gap-2 text-gray-200">
                <Clock size={16} className="text-primary" />
                <span className="text-sm font-medium">{formattedTime}</span>
              </div>
            </div>
          </div>

          {provider?.businessAddress && (
            <div className="bg-black/20 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-300 truncate mr-2">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className="truncate">{`${provider.businessAddress.street}, ${provider.businessAddress.city}`}</span>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={handleNavigation}
                className="h-auto p-0 text-primary hover:text-primary-hover shrink-0"
              >
                <Navigation size={14} className="mr-1" /> Mapa
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Scissors size={12} /> Serviços
            </span>
            <div className="flex flex-wrap gap-2">
              {(items || []).map((item: AppointmentItem) => (
                <Badge
                  key={item.id || item.referenceId}
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 font-normal border-gray-700"
                >
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4 border-t border-gray-800/50 bg-black/20">
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Tempo estimado</span>
              <span className="text-sm font-medium text-gray-200">
                {formatDuration(displayDuration)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-xl font-bold text-primary">
                R$ {displayPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {(status === "completed" && !hasReview) || canCancel ? (
            <div className="flex gap-3 w-full">
              {status === "completed" && !hasReview && (
                <Button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex-1 gap-2 bg-amber-500 text-black hover:bg-amber-600"
                >
                  <Star size={16} /> Avaliar
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelModalOpen(true)}
                  className="flex-1 gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
                >
                  <XCircle size={16} /> Cancelar
                </Button>
              )}
            </div>
          ) : null}

          {/* Mensagem de Erro Melhorada */}
          {hasCancellationTimeExpired && (
            <div className="w-full flex flex-col items-center justify-center gap-1 text-center p-2 rounded border border-yellow-500/20 bg-yellow-500/10">
              <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold">
                <AlertCircle size={14} /> Cancelamento online expirado
              </div>
              <span className="text-[10px] text-yellow-500/80 leading-tight">
                Necessário {minHoursNotice}h de antecedência.
                <br />
                Entre em contato com o estabelecimento.
              </span>
            </div>
          )}
        </CardFooter>
      </MotionCard>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        appointment={appointment}
        onSubmit={handleReviewSubmit}
        isLoading={isSubmitting}
      />

      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
        userType="client"
        appointmentId={appointment.id}
      />
    </>
  );
};
