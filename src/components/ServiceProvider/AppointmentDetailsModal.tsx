import React, { useState } from 'react';
import type { AppAppointment } from '../../store/providerAppointmentsStore';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, Clock, User, Tag, Phone, DollarSign, Check, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { updateAppointmentStatus } from '../../firebase/bookingService';
import { useToast } from '../../context/ToastContext';

interface AppointmentDetailsModalProps {
  appointment: AppAppointment;
  isOpen: boolean;
  onClose: () => void;
}

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="text-[#daa520] mt-1 flex-shrink-0" size={18} />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, className, isLoading = false }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait ${className}`}
  >
    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Icon size={20} />}
    <span>{label}</span>
  </button>
);

const AppointmentDetailsModal = ({ appointment, isOpen, onClose }: AppointmentDetailsModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !appointment) return null;

  const handleStatusUpdate = async (newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    setIsUpdating(true);
    try {
      await updateAppointmentStatus(appointment.id, newStatus);
      showToast(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'atualizado'}!`, 'success');
      onClose();
    } catch (error) {
      showToast('Erro ao atualizar o agendamento.', 'error');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const canBeCompleted = appointment.status === 'confirmed' && isPast(appointment.startTime!);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md m-4 border border-gray-700 shadow-2xl relative animate-slide-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={appointment.clientPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.clientName)}&background=2d3748&color=ffffff`}
              alt={appointment.clientName}
              className="h-16 w-16 rounded-full object-cover border-2 border-[#daa520]"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{appointment.clientName}</h2>
              <p className="text-gray-300 capitalize">{appointment.status}</p>
            </div>
          </div>
          
          <div className="space-y-4 border-t border-gray-700 pt-6">
            <DetailItem icon={Tag} label="Serviço" value={appointment.serviceName} />
            <DetailItem icon={Calendar} label="Data" value={format(appointment.startTime!, "eeee, dd 'de' MMMM", { locale: ptBR })} />
            <DetailItem icon={Clock} label="Horário" value={`${format(appointment.startTime!, 'HH:mm')} - ${format(appointment.endTime!, 'HH:mm')}`} />
            <DetailItem icon={User} label="Profissional" value={appointment.professionalName} />
            <DetailItem icon={DollarSign} label="Valor" value={`R$ ${appointment.price.toFixed(2)}`} />
            <DetailItem icon={Phone} label="Contato" value={appointment.clientPhone || 'Não informado'} />
          </div>
        </div>

        {/* Botões de Ação Condicionais */}
        <div className="bg-gray-900/50 p-4 rounded-b-2xl">
          {appointment.status === 'pending' && (
            <div className="flex gap-3">
              <ActionButton 
                icon={XCircle} 
                label="Recusar" 
                onClick={() => handleStatusUpdate('cancelled')}
                isLoading={isUpdating}
                className="bg-red-600/20 text-red-400 hover:bg-red-600/40"
              />
              <ActionButton 
                icon={Check} 
                label="Confirmar" 
                onClick={() => handleStatusUpdate('confirmed')}
                isLoading={isUpdating}
                className="bg-green-600 text-white hover:bg-green-500"
              />
            </div>
          )}

          {canBeCompleted && (
            <ActionButton 
              icon={CheckCircle} 
              label="Marcar como Concluído" 
              onClick={() => handleStatusUpdate('completed')}
              isLoading={isUpdating}
              className="bg-blue-600 text-white hover:bg-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
