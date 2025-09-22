// src/components/ServiceProvider/Agenda/AgendaView.tsx
import { useState, useMemo, useEffect } from 'react';
import { useProviderAppointmentsStore, type EnrichedProviderAppointment } from '../../../store/providerAppointmentsStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAuthStore } from '../../../store/authStore'; // <-- 1. Importar o authStore
import { usePersistentState } from '../../../hooks/usePersistentState'; // <-- 2. Importar nosso novo hook
import type { ServiceProviderProfile } from '../../../types';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { RequestsTab } from '../RequestsTab';
import { ScheduledAppointmentsTab } from './ScheduledAppointmentsTab';
import { HistoryTab } from '../HistoryTab';
import { AgendaToolbar } from './AgendaToolbar';
import { AgendaListView } from './AgendaListView';
import { AgendaColumnView } from './AgendaColumnView';

type AgendaTab = 'requests' | 'scheduled' | 'history';
export type ViewMode = 'card' | 'list' | 'column';

export const AgendaView = () => {
  const [activeTab, setActiveTab] = useState<AgendaTab>('requests');
  const [viewMode, setViewMode] = usePersistentState<ViewMode>('agenda_view_mode', 'card'); // Persiste o modo de visualização também!
  
  const { user } = useAuthStore(); // Obter o usuário logado
  const { userProfile } = useProfileStore();
  const provider = userProfile as ServiceProviderProfile;
  
  // <-- 3. Lógica de inicialização inteligente para o filtro -->
  const getInitialProfessionalId = (): string | null => {
    // Se o usuário logado for um profissional (não o dono), o padrão é ele mesmo.
    if (user?.role === 'professional' && provider?.professionals?.some(p => p.id === user.id)) {
        return user.id;
    }
    // Caso contrário, o padrão é "Todos"
    return null; 
  };
  
  const [selectedProfessionalId, setSelectedProfessionalId] = usePersistentState<string | null>(
    'agenda_professional_filter',
    getInitialProfessionalId()
  );

  const { appointments, isLoading, fetchAppointments, updateStatus } = useProviderAppointmentsStore();

  useEffect(() => {
    if (provider?.id) {
      fetchAppointments(provider.id);
    }
  }, [provider?.id, fetchAppointments]);
  
  const filteredAppointments = useMemo(() => {
    // ... a lógica de filtragem continua a mesma e funciona perfeitamente
    const statusMap: Record<AgendaTab, Array<EnrichedProviderAppointment['status']>> = {
      requests: ['pending'],
      scheduled: ['scheduled'],
      history: ['completed', 'cancelled'],
    };
    
    let filtered = appointments.filter(appt => statusMap[activeTab].includes(appt.status));

    if (selectedProfessionalId) {
      filtered = filtered.filter(appt => appt.professionalId === selectedProfessionalId);
    }
    
    return filtered.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [appointments, activeTab, selectedProfessionalId]);

  const professionalsForColumnView = useMemo(() => {
    const allProfessionals = (userProfile as ServiceProviderProfile)?.professionals || [];
    if (selectedProfessionalId) {
      return allProfessionals.filter(p => p.id === selectedProfessionalId);
    }
    return allProfessionals;
  }, [userProfile, selectedProfessionalId]);
  
  const pendingCount = useMemo(() => appointments.filter(a => a.status === 'pending').length, [appointments]);

  const renderScheduledContent = () => {
    // ...
    switch (viewMode) {
      case 'card':
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
      case 'list':
        return <AgendaListView appointments={filteredAppointments} />;
      case 'column':
        return <AgendaColumnView appointments={filteredAppointments} professionals={professionalsForColumnView} />;
      default:
        return <ScheduledAppointmentsTab appointments={filteredAppointments} />;
    }
  };

  const renderContent = () => {
    // <-- 4. Renderiza a toolbar para 'requests' E 'scheduled' -->
    const showToolbar = activeTab === 'requests' || activeTab === 'scheduled';

    return (
        <>
            {showToolbar && (
                <AgendaToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    selectedProfessionalId={selectedProfessionalId}
                    onSelectProfessional={setSelectedProfessionalId}
                />
            )}
            
            {activeTab === 'requests' && <RequestsTab appointments={filteredAppointments} onUpdateStatus={updateStatus} />}
            {activeTab === 'scheduled' && renderScheduledContent()}
            {activeTab === 'history' && <HistoryTab appointments={filteredAppointments} />}
        </>
    );
  };

  if (isLoading && appointments.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 size={48} className="animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="h-full flex flex-col bg-black/30 rounded-2xl text-white p-4 sm:p-6 border border-gray-800">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-gray-800">
         {/* O Header continua o mesmo */}
         <h1 className="text-2xl font-bold text-white">Minha Agenda</h1>
        <div className="flex items-center bg-gray-900 rounded-lg p-1 space-x-1">
          <button onClick={() => setActiveTab('requests')} className={`relative px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'requests' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}>
            Solicitações
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{pendingCount}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('scheduled')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'scheduled' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}>
            Agenda
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'history' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}>
            Histórico
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto mt-6 pr-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};