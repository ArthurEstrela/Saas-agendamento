import { useEffect, useMemo } from "react";
import {
  Bell,
  Clock,
  Trash2,
  Loader2,
  Inbox,
  CheckCircle2,
  CheckCheck,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationsStore";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card"; // Usando o componente Card padrão
import { cn } from "../../lib/utils/cn";

// --- Card Individual de Notificação ---
const NotificationCard = ({ notification, onMarkAsRead, onDelete }: any) => {
  const dateObj = notification.createdAt?.toDate
    ? notification.createdAt.toDate()
    : new Date(notification.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 border",
          notification.isRead
            ? "bg-gray-900/40 border-gray-800"
            : "bg-gray-900/80 border-primary/40 shadow-[0_0_20px_-10px_rgba(218,165,32,0.15)]"
        )}
      >
        {/* Indicador de não lido (Barra lateral) */}
        {!notification.isRead && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_#daa520]" />
        )}

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
          {/* Ícone e Conteúdo */}
          <div className="flex gap-4 flex-1">
            {/* Ícone Redondo */}
            <div
              className={cn(
                "flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border transition-colors",
                notification.isRead
                  ? "bg-gray-800/50 border-gray-700 text-gray-500"
                  : "bg-primary/10 border-primary/20 text-primary"
              )}
            >
              <Bell
                size={20}
                className={notification.isRead ? "" : "animate-pulse-slow"}
              />
            </div>

            {/* Textos */}
            <div className="flex-grow min-w-0 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                <h4
                  className={cn(
                    "font-bold text-base",
                    notification.isRead ? "text-gray-400" : "text-white"
                  )}
                >
                  {notification.title}
                </h4>
                <span className="text-[10px] text-gray-500 flex items-center bg-black/20 px-2 py-1 rounded-md border border-white/5 w-fit shrink-0">
                  <Clock size={10} className="mr-1.5" />
                  {formatDistanceToNow(dateObj, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Ações (Responsivo) */}
          {/* Mobile: Linha separada abaixo / Desktop: Coluna lateral */}
          <div className="flex sm:flex-col items-center sm:justify-center gap-2 pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-4">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="flex-1 sm:flex-none w-full sm:w-auto h-9 sm:h-8 px-3 text-primary hover:text-primary hover:bg-primary/10 justify-center gap-2 sm:gap-0"
              >
                <CheckCircle2 size={18} />
                <span className="sm:hidden text-xs font-bold uppercase">
                  Marcar Lida
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              className="flex-1 sm:flex-none w-full sm:w-auto h-9 sm:h-8 px-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 justify-center gap-2 sm:gap-0"
            >
              <Trash2 size={18} />
              <span className="sm:hidden text-xs font-bold uppercase">
                Excluir
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// --- Componente Principal ---
export const Notifications = () => {
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
  } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
    return () => clearNotifications();
  }, [user, fetchNotifications, clearNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const handleMarkAllRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else {
      notifications.forEach((n) => {
        if (!n.isRead) markAsRead(n.id);
      });
    }
  };

  return (
    // Removido max-w fixo para alinhar com o design fluido do dashboard
    <div className="space-y-8 pb-10 w-full animate-in fade-in duration-500">
      {/* Header Padrão Stylo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Notificações
            <Bell className="text-primary fill-primary/20" />
          </h1>
          <p className="text-gray-400 mt-1">
            Atualizações sobre seus agendamentos e conta.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white hover:border-primary hover:bg-primary/5 transition-all gap-2"
          >
            <CheckCheck size={16} />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : notifications.length > 0 ? (
        <div className="grid gap-4 w-full">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State Padrão Stylo (Card Dashed) */
        <Card className="bg-gray-900/30 border-dashed border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="bg-gray-800/50 p-4 rounded-full mb-4 ring-1 ring-white/5">
              <Inbox size={40} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300">
              Tudo limpo por aqui!
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              Você não tem novas notificações no momento. As novidades
              aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
