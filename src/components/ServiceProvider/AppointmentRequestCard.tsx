import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, Check, X, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Componentes Primitivos
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AppointmentRequestCardProps {
  appointment: EnrichedProviderAppointment;
  onAccept: (id: string, status: 'scheduled') => void;
  onReject: (id: string, status: 'cancelled') => void;
}

export const AppointmentRequestCard = ({ appointment, onAccept, onReject }: AppointmentRequestCardProps) => {
  const { client, startTime, services, professionalName } = appointment;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Isso já estava correto
    if (!client?.phoneNumber) return;
    const cleanPhone = client.phoneNumber.replace(/\D/g, '');
    const dateString = format(startTime, "dd/MM", { locale: ptBR });
    const timeString = format(startTime, "HH:mm");
    const message = `Olá ${client.name}, vi sua solicitação para ${dateString} às ${timeString}. Posso confirmar?`;
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const MotionCard = motion(Card);

  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="mb-4 bg-gray-900/60 border-gray-800 overflow-hidden"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border border-gray-700">
            <AvatarImage src={client?.profilePictureUrl} alt={client?.name} />
            <AvatarFallback>{client?.name?.substring(0, 2).toUpperCase() || 'CL'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-100 truncate">{client?.name || 'Cliente'}</h4>
                    <p className="text-xs text-gray-500">Solicitado com <span className="text-primary">{professionalName}</span></p>
                </div>
                {client?.phoneNumber && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleWhatsAppClick}
                        className="text-green-500 hover:text-green-400 hover:bg-green-500/10 h-8 w-8 rounded-full"
                        title="Conversar no WhatsApp"
                    >
                        <MessageCircle size={18} />
                    </Button>
                )}
            </div>

            {/* Info Grid */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300 bg-black/20 p-2 rounded-lg border border-gray-800/50">
                    <Calendar size={14} className="text-primary" /> 
                    <span className="capitalize">{format(startTime, "dd MMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 bg-black/20 p-2 rounded-lg border border-gray-800/50">
                    <Clock size={14} className="text-primary" /> 
                    <span>{format(startTime, "HH:mm")}</span>
                </div>
            </div>

            <div className="mt-3 flex items-start gap-2">
                <Scissors size={14} className="mt-1 text-gray-500 shrink-0"/>
                <div className="flex flex-wrap gap-1">
                    {services.map(s => (
                        <Badge key={s.id} variant="secondary" className="text-xs font-normal">
                            {s.name}
                        </Badge>
                    ))}
                     <span className="text-xs text-gray-500 self-center ml-1">({appointment.totalDuration} min)</span>
                </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 bg-black/20 grid grid-cols-2 gap-3 border-t border-gray-800">
        <Button 
          variant="ghost"
          // ADICIONADO: e.stopPropagation()
          onClick={(e) => {
            e.stopPropagation();
            onReject(appointment.id, 'cancelled');
          }} 
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <X size={16} className="mr-2" /> Recusar
        </Button>
        <Button 
          // ADICIONADO: e.stopPropagation()
          onClick={(e) => {
            e.stopPropagation();
            onAccept(appointment.id, 'scheduled');
          }} 
          className="w-full bg-green-600 hover:bg-green-500 text-white"
        >
          <Check size={16} className="mr-2" /> Aceitar
        </Button>
      </CardFooter>
    </MotionCard>
  );
};