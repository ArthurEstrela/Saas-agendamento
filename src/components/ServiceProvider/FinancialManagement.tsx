// src/components/ServiceProvider/FinancialManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Appointment, Professional } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Scissors, Users, Loader, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

// --- Componente Principal do Dashboard Financeiro ---
const FinancialManagement = () => {
  const { userProfile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', 'month'

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'appointments'),
      where('serviceProviderId', '==', userProfile.uid),
      where('status', '==', 'concluido')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      setAppointments(fetchedAppointments);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar dados financeiros:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const professionals = useMemo(() => userProfile?.professionals || [], [userProfile]);

  // --- Cálculos e Memoização dos Dados ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (timeRange === '7d') {
      startDate = subDays(now, 6);
    } else if (timeRange === '30d') {
      startDate = subDays(now, 29);
    } else { // 'month'
      startDate = startOfMonth(now);
    }
    return appointments.filter(a => parseISO(a.date) >= startDate);
  }, [appointments, timeRange]);

  const { totalRevenue, completedAppointments, averageTicket, professionalRevenue } = useMemo(() => {
    const revenue = filteredData.reduce((acc, app) => acc + app.price, 0);
    const profRevenue = professionals.map(prof => {
      const total = filteredData
        .filter(a => a.professionalId === prof.id)
        .reduce((acc, app) => acc + app.price, 0);
      return { name: prof.name, total };
    });

    return {
      totalRevenue: revenue,
      completedAppointments: filteredData.length,
      averageTicket: filteredData.length > 0 ? revenue / filteredData.length : 0,
      professionalRevenue: profRevenue,
    };
  }, [filteredData, professionals]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    filteredData.forEach(app => {
      const day = format(parseISO(app.date), 'dd/MM');
      dataMap.set(day, (dataMap.get(day) || 0) + app.price);
    });
    return Array.from(dataMap, ([name, faturamento]) => ({ name, faturamento })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);


  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Visão Financeira</h1>
          <p className="text-gray-400 mt-1">Acompanhe a saúde financeira do seu negócio.</p>
        </div>
        <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={DollarSign} title="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2).replace('.', ',')}`} />
        <StatCard icon={Scissors} title="Agendamentos Concluídos" value={completedAppointments.toString()} />
        <StatCard icon={TrendingUp} title="Ticket Médio" value={`R$ ${averageTicket.toFixed(2).replace('.', ',')}`} />
      </div>
      
      {/* Gráfico e Faturamento por Profissional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Evolução do Faturamento</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                <YAxis stroke="#A0AEC0" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#CBD5E0' }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Faturamento']}
                />
                <Bar dataKey="faturamento" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Faturamento por Profissional</h2>
          <div className="space-y-4">
            {professionalRevenue.map((prof, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300">{prof.name}</span>
                <span className="font-bold text-white">R$ {prof.total.toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Transações Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-400 uppercase">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Serviço</th>
                <th className="py-3 px-4 hidden md:table-cell">Data</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredData.slice(0, 5).map(app => (
                <tr key={app.id} className="hover:bg-gray-700/50">
                  <td className="py-4 px-4 font-medium">{app.clientName}</td>
                  <td className="py-4 px-4 text-gray-300">{app.serviceName}</td>
                  <td className="py-4 px-4 text-gray-300 hidden md:table-cell">{format(parseISO(app.date), 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-4 text-right font-semibold text-green-400">R$ {app.price.toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma transação no período selecionado.</p>}
        </div>
      </div>
    </div>
  );
};

// --- Componentes Auxiliares ---
const StatCard = ({ icon: Icon, title, value }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    <div className="bg-amber-500/10 p-3 rounded-lg">
      <Icon className="text-amber-500" size={24} />
    </div>
  </div>
);

const TimeRangeSelector = ({ selected, onSelect }) => {
  const options = [
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'month', label: 'Este Mês' },
  ];
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            selected === opt.key ? 'bg-amber-500 text-black' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default FinancialManagement;
