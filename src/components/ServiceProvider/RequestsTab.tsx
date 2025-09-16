// src/components/ServiceProvider/RequestsTab.tsx

import type { EnrichedProviderAppointment } from '../../store/providerAppointmentsStore';
import { AppointmentRequestCard } from './AppointmentRequestCard';
import { Inbox } from 'lucide-react';

interface RequestsTabProps {
  appointments: EnrichedProviderAppointment[];
  onUpdateStatus: (id: string, status: 'scheduled' | 'cancelled') => void;
}

export const RequestsTab = ({ appointments, onUpdateStatus }: RequestsTabProps) => {
  const sortedAppointments = [...appointments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Novas Solicitações de Agendamento</h2>
      {sortedAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAppointments.map((appt) => (
            <AppointmentRequestCard
              key={appt.id}
              appointment={appt}
              onAccept={() => onUpdateStatus(appt.id, 'scheduled')}
              onReject={() => onUpdateStatus(appt.id, 'cancelled')}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-600 mt-16">
          <Inbox size={48} />
          <p className="mt-4 font-semibold">Nenhuma solicitação pendente</p>
          <p className="text-sm">Sua caixa de entrada está em dia!</p>
        </div>
      )}
    </div>
  );
};