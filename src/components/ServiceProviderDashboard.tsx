import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ServicesManagement from './ServiceProvider/ServicesManagement';
import AvailabilityManagement from './ServiceProvider/AvailabilityManagement';
import type { Appointment } from '../types';

const ServiceProviderDashboard = () => {
  const { userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'availability'>('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!userProfile) return;
    const q = query(collection(db, 'appointments'), where('serviceProviderId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      setAppointments(appts);
    });
    return unsubscribe;
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-500">Painel do Profissional</h2>
        <p>Bem-vindo, {userProfile?.displayName}!</p>
        <button onClick={logout} className="text-red-500">Sair</button>
      </div>

      <div className="flex justify-center border-b border-yellow-700 mb-8">
        <button onClick={() => setActiveTab('calendar')} className={`py-2 px-4 ${activeTab === 'calendar' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>
          Agenda
        </button>
        <button onClick={() => setActiveTab('services')} className={`py-2 px-4 ${activeTab === 'services' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>
          Serviços
        </button>
        <button onClick={() => setActiveTab('availability')} className={`py-2 px-4 ${activeTab === 'availability' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>
          Horários
        </button>
      </div>

      {activeTab === 'calendar' && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl text-yellow-500 mb-4">Meus Agendamentos</h3>
          {/* Aqui você pode adicionar um calendário completo ou uma lista simples */}
          <div className="space-y-4">
            {appointments.map(app => (
              <div key={app.id} className="bg-gray-800 p-4 rounded-lg">
                <p>Data: {app.date} às {app.time}</p>
                <p>Cliente ID: {app.clientId}</p>
                <p>Status: {app.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && <ServicesManagement />}
      {activeTab === 'availability' && <AvailabilityManagement />}
    </div>
  );
};

export default ServiceProviderDashboard;