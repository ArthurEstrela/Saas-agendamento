import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config'; 
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Appointment, Professional, Service } from '../../types';

interface RevenueData {
  totalRevenue: number;
  totalAppointments: number;
  professionals: {
    [key: string]: {
      name: string;
      revenue: number;
      appointments: number;
    }
  }
}

const RevenueManagement = () => {
  const { userProfile } = useAuthStore();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Início do mês atual
    end: new Date().toISOString().split('T')[0], // Hoje
  });

  useEffect(() => {
    if (!userProfile?.uid) return;

    const fetchCompletedAppointments = async () => {
      setLoading(true);
      const q = query(
        collection(db, 'appointments'),
        where('serviceProviderId', '==', userProfile.uid),
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);
      const apptsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setCompletedAppointments(apptsData);
      setLoading(false);
    };

    fetchCompletedAppointments();
  }, [userProfile]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredData: RevenueData = useMemo(() => {
    const startDate = new Date(dateRange.start + 'T00:00:00');
    const endDate = new Date(dateRange.end + 'T23:59:59');

    const filteredAppts = completedAppointments.filter(appt => {
      const apptDate = new Date(appt.date + 'T00:00:00');
      return apptDate >= startDate && apptDate <= endDate;
    });

    const revenueData: RevenueData = {
      totalRevenue: 0,
      totalAppointments: filteredAppts.length,
      professionals: {},
    };

    filteredAppts.forEach(appt => {
      const professional = userProfile?.professionals?.find(p => p.id === appt.professionalId);
      const price = appt.totalPrice || 0;

      revenueData.totalRevenue += price;

      if (professional) {
        if (!revenueData.professionals[professional.id]) {
          revenueData.professionals[professional.id] = {
            name: professional.name,
            revenue: 0,
            appointments: 0,
          };
        }
        revenueData.professionals[professional.id].revenue += price;
        revenueData.professionals[professional.id].appointments += 1;
      }
    });

    return revenueData;
  }, [completedAppointments, dateRange, userProfile?.professionals]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Relatório de Receita</h2>
      
      {/* Filtros de Data */}
      <div className="bg-gray-700 p-4 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label htmlFor="start" className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label>
          <input type="date" name="start" id="start" value={dateRange.start} onChange={handleDateChange} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="end" className="block text-sm font-medium text-gray-300 mb-1">Data de Fim</label>
          <input type="date" name="end" id="end" value={dateRange.end} onChange={handleDateChange} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Carregando dados...</p>
      ) : (
        <>
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-400">Faturamento Total no Período</p>
              <p className="text-3xl font-bold text-green-400">R$ {filteredData.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-400">Atendimentos Realizados</p>
              <p className="text-3xl font-bold text-yellow-400">{filteredData.totalAppointments}</p>
            </div>
          </div>

          {/* Detalhes por Profissional */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Desempenho por Profissional</h3>
            <div className="space-y-3">
              {Object.keys(filteredData.professionals).length > 0 ? (
                Object.values(filteredData.professionals).map(prof => (
                  <div key={prof.name} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <p className="font-semibold text-white">{prof.name}</p>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">R$ {prof.revenue.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{prof.appointments} atendimentos</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhum atendimento concluído no período selecionado.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueManagement;
