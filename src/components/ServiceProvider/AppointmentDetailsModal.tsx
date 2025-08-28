// src/components/ServiceProvider/AppointmentDetailsModal.tsx
import React, { useState } from 'react';
import { X, Clock, User, Scissors, DollarSign, Calendar, Edit, Trash2, Info, Check, Loader } from 'lucide-react';
import type { Appointment, Professional } from '../../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

// --- Tipos e Constantes ---
const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmado: { label: 'Confirmado', color: 'bg-green-500/20 text-green-400' },
  concluido: { label: 'Concluído', color: 'bg-blue-500/20 text-blue-400' },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
  nao_compareceu: { label: 'Não Compareceu', color: 'bg-gray-500/20 text-gray-400' },
};

interface ModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  professionals: Professional[];
}

const AppointmentDetailsModal = ({ appointment, onClose, professionals }: ModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  if (!appointment) return null;

  const professionalName = professionals.find(p => p.id === appointment.professionalId)?.name || 'Profissional não encontrado';
  const status = statusConfig[appointment.status] || statusConfig.pendente;

  const handleStatusUpdate = async (newStatus: Appointment['status']) => {
    if(newStatus === 'confirmado') setIsConfirming(true);
    if(newStatus === 'cancelado') setIsCanceling(true);

    try {
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, { status: newStatus });
      onClose();
    } catch (error) {
      console.error(`Erro ao atualizar status para ${newStatus}:`, error);
    } finally {
      setIsConfirming(false);
      setIsCanceling(false);
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
        onClick={handleModalContentClick}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Detalhes do Agendamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-amber-400">{appointment.clientName}</h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${status.color}`}>{status.label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoItem icon={Calendar} label="Data" value={format(parseISO(appointment.date), "dd 'de' MMMM, yyyy", { locale: ptBR })} />
            <InfoItem icon={Clock} label="Horário" value={appointment.startTime} />
            <InfoItem icon={Scissors} label="Serviço" value={appointment.serviceName} />
            <InfoItem icon={DollarSign} label="Valor" value={`R$ ${appointment.price.toFixed(2).replace('.', ',')}`} />
            <InfoItem icon={User} label="Profissional" value={professionalName} />
          </div>
          
          {appointment.notes && (
            <div>
              <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2"><Info size={16}/> Observações</h4>
              <p className="text-gray-400 bg-gray-900/50 p-3 rounded-lg text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end items-center p-5 border-t border-gray-700 gap-3">
          <button 
            onClick={() => handleStatusUpdate('cancelado')}
            disabled={isCanceling || appointment.status === 'cancelado' || appointment.status === 'concluido'}
            className="px-4 py-2 text-sm font-semibold bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCanceling ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Cancelar
          </button>
          
          {appointment.status === 'pendente' && (
            <button 
              onClick={() => handleStatusUpdate('confirmado')}
              disabled={isConfirming}
              className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              Confirmar
            </button>
          )}

          <button className="px-4 py-2 text-sm font-semibold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2">
            <Edit size={16} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
    <Icon className="text-amber-400 mt-1 flex-shrink-0" size={18} />
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

export default AppointmentDetailsModal;
