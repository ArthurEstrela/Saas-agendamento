import { format, isBefore, subHours, differenceInMinutes } from "date-fns";
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

// IMPORTAÇÕES ESTRITAS
import type { Appointment, ServiceProviderProfile } from "../../types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status?.toUpperCase() || "PENDING";

  const statusConfig: Record<
    string,
    { label: string; variant: BadgeVariant; icon: React.ElementType }
  > = {
    PENDING: { label: "Pendente", variant: "warning", icon: MoreHorizontal },
    SCHEDULED: { label: "Agendado", variant: "success", icon: CheckCircle },
    CONFIRMED: { label: "Confirmado", variant: "success", icon: CheckCircle },
    COMPLETED: { label: "Concluído", variant: "secondary", icon: CheckCircle },
    CANCELLED: { label: "Cancelado", variant: "destructive", icon: XCircle },
    NO_SHOW: { label: "Faltou", variant: "destructive", icon: AlertCircle },
    BLOCKED: { label: "Bloqueado", variant: "outline", icon: XCircle },
  };

  const config = statusConfig[normalizedStatus] || {
    label: "Desconhecido",
    variant: "outline",
    icon: AlertCircle,
  };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon size={12} /> {config.label}
    </Badge>
  );
};

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
};

const parseJavaDate = (dateString: string | Date | undefined): Date => {
  if (!dateString) return new Date();
  if (dateString instanceof Date) return dateString;
  const safeString = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
  return new Date(safeString);
};

export type EnrichedAppointment = Appointment & {
  professionalAvatarUrl?: string;
  providerAvatarUrl?: string;
  provider?: Partial<ServiceProviderProfile> & { address?: any };
  totalDuration?: number;
  totalPrice?: number;
  serviceNames?: string[];
  endTime?: string | Date;
  finalPrice?: number;
  price?: number;
  services?: Array<{ id?: string; name: string; duration?: number }>;
  totalAmount?: number;
  finalAmount?: number;
  items?: Array<{ id?: string; referenceId?: string; name: string }>;
  address?: any;
};

export const ClientAppointmentCard = ({
  appointment,
}: {
  appointment: EnrichedAppointment;
}) => {
  console.log("DADOS DO SALÃO VINDO DO JAVA:", appointment.provider);
  const {
    professionalName,
    startTime: rawStartTime,
    endTime: rawEndTime,
    serviceNames,
    services,
    items,
    provider,
    professionalAvatarUrl,
    providerAvatarUrl,
    status: rawStatus,
    totalPrice,
    finalPrice,
    price,
    totalAmount,
    finalAmount,
  } = appointment;

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  const { submitReview, loading: isSubmitting } = useReviewStore();
  const { cancelAppointment, loading: isCancelling } =
    useUserAppointmentsStore();

  const startTime = parseJavaDate(rawStartTime);
  const status = rawStatus?.toUpperCase() || "PENDING";

  const formattedDate = format(startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = format(startTime, "HH:mm");

  const locationAddress =
    provider?.address || provider?.businessAddress || appointment.address;

  // ✨ FUNÇÕES RESTAURADAS AQUI!
  const handleReviewSubmit = async (rating: number, comment: string) => {
    await submitReview(appointment.id, rating, comment);
    setReviewModalOpen(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    await cancelAppointment(appointment.id, reason);
    setCancelModalOpen(false);
  };

  // ✨ GOOGLE MAPS MELHORADO (Sua Ideia: Lat/Lng!)
  const handleNavigation = () => {
    if (locationAddress) {
      // 1. Tentamos usar Lat/Lng primeiro (Mais preciso)
      if (locationAddress.lat && locationAddress.lng) {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${locationAddress.lat},${locationAddress.lng}`,
          "_blank",
        );
        return;
      }

      // 2. Fallback: Se não tiver coordenada, buscamos pelo texto
      const street = locationAddress.street || locationAddress.logradouro || "";
      const city = locationAddress.city || locationAddress.localidade || "";
      const state = locationAddress.state || locationAddress.uf || "";
      const number = locationAddress.number || locationAddress.numero || "";

      const queryParts = [street, number, city, state].filter(Boolean);
      const query = encodeURIComponent(queryParts.join(", "));

      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
      );
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone =
      provider?.phone ||
      provider?.businessPhone ||
      provider?.socialLinks?.whatsapp ||
      "";
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
    provider?.phone ||
    provider?.businessPhone ||
    provider?.socialLinks?.whatsapp
  );

  const minHoursNotice = provider?.cancellationMinHours ?? 2;
  const cancellationDeadline = subHours(startTime, minHoursNotice);
  const now = new Date();

  const canCancel =
    (status === "SCHEDULED" ||
      status === "PENDING" ||
      status === "CONFIRMED") &&
    isBefore(now, cancellationDeadline);

  const hasCancellationTimeExpired =
    (status === "SCHEDULED" ||
      status === "PENDING" ||
      status === "CONFIRMED") &&
    !isBefore(now, cancellationDeadline) &&
    isBefore(now, startTime);

  const displayImage =
    professionalAvatarUrl || providerAvatarUrl || provider?.logoUrl;
  const initials =
    professionalName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PR";

  const hasReview = !!appointment.reviewId;
  const displayPrice =
    totalPrice ?? finalPrice ?? price ?? totalAmount ?? finalAmount ?? 0;

  const displayServices: string[] = [];
  if (serviceNames && Array.isArray(serviceNames) && serviceNames.length > 0) {
    displayServices.push(...serviceNames);
  } else if (services && Array.isArray(services) && services.length > 0) {
    displayServices.push(...services.map((s) => s.name));
  } else if (items && Array.isArray(items) && items.length > 0) {
    displayServices.push(...items.map((i) => i.name));
  }

  let calculatedDuration = 30;
  if (rawEndTime) {
    calculatedDuration = differenceInMinutes(
      parseJavaDate(rawEndTime),
      startTime,
    );
  } else if (services && Array.isArray(services) && services.length > 0) {
    calculatedDuration = services.reduce(
      (acc, s) => acc + (s.duration || 0),
      0,
    );
  }
  const displayDuration = appointment.totalDuration ?? calculatedDuration;

  const streetName =
    locationAddress?.street ||
    locationAddress?.logradouro ||
    "Endereço não informado";
  const cityName = locationAddress?.city || locationAddress?.localidade || "";
  const displayAddressString = cityName
    ? `${streetName}, ${cityName}`
    : streetName;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors">
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
                  <StatusBadge status={status} />
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

            {locationAddress && (
              <div className="bg-black/20 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-300 truncate mr-2">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span className="truncate">{displayAddressString}</span>
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
                {displayServices.length > 0 ? (
                  displayServices.map((name, idx) => (
                    <Badge
                      key={`name-${idx}`}
                      variant="secondary"
                      className="bg-gray-800 text-gray-300 font-normal border-gray-700"
                    >
                      {name}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-gray-800 text-gray-500 font-normal border-gray-700"
                  >
                    Nenhum serviço
                  </Badge>
                )}
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
                  R$ {Number(displayPrice).toFixed(2)}
                </span>
              </div>
            </div>

            {(status === "COMPLETED" && !hasReview) || canCancel ? (
              <div className="flex gap-3 w-full">
                {status === "COMPLETED" && !hasReview && (
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
                    disabled={isCancelling}
                  >
                    <XCircle size={16} /> Cancelar
                  </Button>
                )}
              </div>
            ) : null}

            {hasCancellationTimeExpired && (
              <div className="w-full flex flex-col items-center justify-center gap-1 text-center p-2 rounded border border-yellow-500/20 bg-yellow-500/10">
                <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold">
                  <AlertCircle size={14} /> Cancelamento online expirado
                </div>
                <span className="text-[10px] text-yellow-500/80 leading-tight">
                  Necessário {minHoursNotice}h de antecedência.
                  <br /> Entre em contato com o estabelecimento.
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>

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
