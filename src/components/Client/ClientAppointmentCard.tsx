import type { EnrichedAppointment } from "../../store/userAppointmentsStore";
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

// Componentes UI Primitivos
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";

// Mapeamento de Status para Componentes Badge
const StatusBadge = ({ status }: { status: EnrichedAppointment["status"] }) => {
  const statusConfig = {
    scheduled: { label: "Confirmado", variant: "success", icon: CheckCircle },
    pending: { label: "Pendente", variant: "warning", icon: MoreHorizontal },
    completed: { label: "Concluído", variant: "secondary", icon: CheckCircle }, // Secondary (Cinza) para itens passados
    cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
  } as const;

  const config = statusConfig[status] || {
    label: "Desconhecido",
    variant: "outline",
    icon: AlertCircle,
  };
  const Icon = config.icon;

  // @ts-ignore - Variant string mapping is correct based on your badge.tsx
  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon size={12} /> {config.label}
    </Badge>
  );
};

export const ClientAppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedAppointment;
}) => {
  const {
    professionalName,
    startTime,
    services,
    provider,
    professionalAvatarUrl,
    providerAvatarUrl,
    status,
  } = appointment;

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const { submitReview, isSubmitting } = useReviewStore();
  const { cancelAppointment, isLoading: isCancelling } =
    useUserAppointmentsStore();

  const formattedDate = format(startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = format(startTime, "HH:mm");

  const handleNavigation = () => {
    if (provider?.businessAddress) {
      const { street, city, state } = provider.businessAddress;
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${street}, ${city}, ${state}`
        )}`,
        "_blank"
      );
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    await submitReview(appointment.id, {
      rating,
      comment,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      serviceProviderId: appointment.providerId,
      professionalId: appointment.professionalId,
      professionalName: appointment.professionalName,
      appointmentId: appointment.id,
    });
    setReviewModalOpen(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    await cancelAppointment(appointment.id, reason);
    setCancelModalOpen(false);
  };

  const cancellationDeadline = subHours(appointment.startTime, 2);
  const now = new Date();
  const canCancel =
    (status === "scheduled" || status === "pending") &&
    isBefore(now, cancellationDeadline);
  const hasCancellationTimeExpired =
    (status === "scheduled" || status === "pending") &&
    !isBefore(now, cancellationDeadline) &&
    isBefore(now, appointment.startTime);

  // Lógica de Imagem
  const displayImage =
    professionalAvatarUrl || providerAvatarUrl || provider?.logoUrl;
  const initials = professionalName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Motion Wrapper para o Card
  const MotionCard = motion(Card);

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
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <span className="font-medium text-primary">
                {provider?.businessName}
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
              {services.map((service) => (
                <Badge
                  key={service.id}
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 font-normal border-gray-700"
                >
                  {service.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4 border-t border-gray-800/50 bg-black/20">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-gray-400">Total estimado</span>
            <span className="text-xl font-bold text-primary">
              R$ {appointment.totalPrice.toFixed(2)}
            </span>
          </div>

          {(status === "completed" && !appointment.review) || canCancel ? (
            <div className="flex gap-3 w-full">
              {status === "completed" && !appointment.review && (
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

          {hasCancellationTimeExpired && (
            <div className="w-full flex items-center justify-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
              <AlertCircle size={14} /> Cancelamento online expirado
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
