// src/components/ServiceProvider/RequestsTab.tsx

import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import type { Appointment } from '../../types'; // Importar Appointment
import { AppointmentRequestCard } from './AppointmentRequestCard';
import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface RequestsTabProps {
  appointments: EnrichedProviderAppointment[];
  onUpdateStatus: (id: string, status: 'scheduled' | 'cancelled') => void;
  // Adicionamos esta prop para permitir abrir o modal de detalhes
  onAppointmentSelect: (appointment: Appointment) => void; 
}

export const RequestsTab = ({ 
  appointments, 
  onUpdateStatus, 
  onAppointmentSelect 
}: RequestsTabProps) => {
  
  // Filtra apenas pendentes (segurança extra) e ordena por data
  const sortedAppointments = appointments
    .filter(a => a.status === 'pending')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (sortedAppointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-16">
        <Inbox size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Tudo limpo por aqui!</h3>
        <p className="text-sm">Você não tem novas solicitações pendentes.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-amber-400">Novas Solicitações</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {sortedAppointments.map((appt) => (
          <motion.div
            key={appt.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            // Ao clicar no wrapper, abre detalhes
            onClick={() => onAppointmentSelect(appt)}
            className="cursor-pointer"
          >
            <AppointmentRequestCard
              appointment={appt}
              // Os botões de ação dentro do card param a propagação do clique
              // então onAccept/onReject não disparam onAppointmentSelect
              onAccept={(id, status) => onUpdateStatus(id, status)}
              onReject={(id, status) => onUpdateStatus(id, status)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};