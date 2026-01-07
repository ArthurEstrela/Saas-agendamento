import { useMemo } from "react";
import { useProfileStore } from "../../store/profileStore"; // Adicionado
import {
  useProviderAppointmentsStore,
  type EnrichedProviderAppointment,
} from "../../store/providerAppointmentsStore";
import type { ProfessionalProfile, Appointment } from "../../types";
import {
  TrendingUp,
  Users,
  Star,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Clock,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FaWhatsapp } from "react-icons/fa";

// UI
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export const ProfessionalHome = () => {
  const { userProfile } = useProfileStore(); // Hook da Store
  const { appointments } = useProviderAppointmentsStore();

  const profile = userProfile as ProfessionalProfile | null;

  const tomorrowAppointments = useMemo(() => {
    if (!profile) return [];
    const tomorrow = addDays(new Date(), 1);
    return appointments
      .filter(
        (app) =>
          app.professionalId === profile.professionalId &&
          app.status === "scheduled" &&
          isSameDay(new Date(app.startTime), tomorrow)
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }, [appointments, profile]);

  const generateWhatsAppLink = (appointment: Appointment) => {
    const phone =
      appointment.clientPhone ||
      (appointment as EnrichedProviderAppointment).client?.phoneNumber ||
      "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return null;
    const time = format(new Date(appointment.startTime), "HH:mm");
    const message = `Olá ${appointment.clientName}, confirmando seu horário amanhã às ${time}. Tudo certo?`;
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const metrics = useMemo(() => {
    if (!profile)
      return {
        todayCount: 0,
        completedCount: 0,
        revenue: 0,
        rating: 0,
        nextAppointment: null,
      };

    const myAppointments = appointments.filter(
      (a) => a.professionalId === profile.professionalId
    );
    const today = new Date();
    const todayAppointments = myAppointments.filter(
      (a) => isSameDay(new Date(a.startTime), today) && a.status === "scheduled"
    );
    const completed = myAppointments.filter((a) => a.status === "completed");
    const estimatedRevenue = completed.reduce(
      (acc, curr) => acc + (curr.totalPrice || 0),
      0
    );
    const reviewedAppts = myAppointments.filter((a) => a.review);
    const avgRating =
      reviewedAppts.length > 0
        ? reviewedAppts.reduce(
            (acc, curr) => acc + (curr.review?.rating || 0),
            0
          ) / reviewedAppts.length
        : 5.0;

    return {
      todayCount: todayAppointments.length,
      completedCount: completed.length,
      revenue: estimatedRevenue,
      rating: avgRating,
      nextAppointment: todayAppointments.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )[0],
    };
  }, [appointments, profile]);

  const MotionCard = motion(Card);

  if (!profile) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Olá, <span className="text-primary">{profile.name}</span>! 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Resumo da sua performance e agenda.
          </p>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 bg-gray-900 border-gray-700 text-gray-400 gap-2 h-9"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
          Sistema Online
        </Badge>
      </div>

      {tomorrowAppointments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-green-900/20 to-gray-900/50 border-green-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <FaWhatsapp size={100} />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
                    <FaWhatsapp /> Confirmar Agenda de Amanhã
                  </h2>
                  <p className="text-sm text-gray-400">
                    Envie lembretes para reduzir faltas.
                  </p>
                </div>
                <Badge className="bg-green-600 text-white hover:bg-green-600">
                  {tomorrowAppointments.length} clientes
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 relative z-10">
                {tomorrowAppointments.map((app) => {
                  const waLink = generateWhatsAppLink(app);
                  return (
                    <div
                      key={app.id}
                      className="bg-gray-900/80 p-3 rounded-xl flex items-center justify-between border border-gray-700 hover:border-green-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                          <Clock size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-sm truncate">
                            {app.clientName}
                          </p>
                          <p className="text-xs text-green-400 font-mono">
                            {format(new Date(app.startTime), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      {waLink ? (
                        <Button
                          size="sm"
                          asChild
                          className="bg-green-600 hover:bg-green-500 text-white h-8 text-xs font-bold gap-2"
                        >
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaWhatsapp /> Avisar
                          </a>
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled
                          className="h-8 w-8"
                        >
                          <FaWhatsapp size={16} className="text-gray-600" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Faturamento Estimado",
            value: new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(metrics.revenue),
            icon: DollarSign,
            color: "text-green-500",
            bg: "bg-green-500/10",
          },
          {
            title: "Realizados",
            value: metrics.completedCount,
            icon: CheckCircle2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Agenda Hoje",
            value: metrics.todayCount,
            icon: CalendarClock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            title: "Sua Nota",
            value: metrics.rating.toFixed(1),
            icon: TrendingUp,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            subIcon: (
              <Star
                size={14}
                className="text-yellow-500 fill-yellow-500 ml-1"
              />
            ),
          },
        ].map((item, i) => (
          <MotionCard
            key={i}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-900/50 border-gray-800"
          >
            <CardContent className="p-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 font-medium">
                  {item.title}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1 flex items-center">
                  {item.value} {item.subIcon}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
            </CardContent>
          </MotionCard>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Users size={150} />
        </div>
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CalendarClock className="text-primary" /> Próximo Cliente
          </h2>
          {metrics.nextAppointment ? (
            <div className="flex flex-col md:flex-row items-center gap-6 bg-black/20 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm relative z-10">
              <div className="text-center md:text-left min-w-[100px]">
                <p className="text-4xl font-bold text-white">
                  {format(new Date(metrics.nextAppointment.startTime), "HH:mm")}
                </p>
                <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mt-1">
                  {format(new Date(metrics.nextAppointment.startTime), "EEEE", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="w-px h-16 bg-gray-700 hidden md:block"></div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-1">
                  {metrics.nextAppointment.clientName}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
                >
                  {metrics.nextAppointment.serviceName}
                </Badge>
              </div>
              {(() => {
                const link = generateWhatsAppLink(metrics.nextAppointment);
                return (
                  link && (
                    <Button
                      asChild
                      className="bg-green-600 hover:bg-green-500 text-white font-bold gap-2"
                    >
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <FaWhatsapp size={18} /> Confirmar
                      </a>
                    </Button>
                  )
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <CheckCircle2 size={48} className="mb-4 text-gray-700" />
              <p className="text-lg font-medium">Agenda de hoje concluída!</p>
              <p className="text-sm">Bom descanso. ☕</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
