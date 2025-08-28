// src/components/ServiceProvider/FinancialManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import type { Appointment, Professional, Expense } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Scissors, Loader, ArrowUp, ArrowDown, Plus, X, Users, Award } from 'lucide-react';

// --- Componente Principal do Dashboard Financeiro ---
const FinancialManagement = () => {
  const { userProfile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Efeito para buscar dados em tempo real ---
  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('serviceProviderId', '==', userProfile.uid),
      where('status', '==', 'concluido')
    );
    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const fetchedAppointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
      setAppointments(fetchedAppointments);
    });

    const expensesQuery = query(collection(db, 'expenses'), where('serviceProviderId', '==', userProfile.uid));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(fetchedExpenses);
      setLoading(false);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeExpenses();
    };
  }, [userProfile]);

  // --- Cálculos e Memoização dos Dados ---
  const { filteredAppointments, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (timeRange === '7d') startDate = subDays(now, 6);
    else if (timeRange === '30d') startDate = subDays(now, 29);
    else startDate = startOfMonth(now);
    
    return {
      filteredAppointments: appointments.filter(a => parseISO(a.date) >= startDate),
      filteredExpenses: expenses.filter(e => parseISO(e.date) >= startDate)
    };
  }, [appointments, expenses, timeRange]);

  const { totalRevenue, totalExpenses, balance, averageTicket, professionalRevenue, topServices } = useMemo(() => {
    const revenue = filteredAppointments.reduce((acc, app) => acc + app.price, 0);
    const expenseTotal = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    const profRevenue = (userProfile?.professionals || []).map(prof => ({
      name: prof.name,
      total: filteredAppointments
        .filter(a => a.professionalId === prof.id)
        .reduce((acc, app) => acc + app.price, 0),
    }));

    const servicesMap = new Map<string, number>();
    filteredAppointments.forEach(app => {
      servicesMap.set(app.serviceName, (servicesMap.get(app.serviceName) || 0) + app.price);
    });
    const sortedServices = Array.from(servicesMap, ([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

    return {
      totalRevenue: revenue,
      totalExpenses: expenseTotal,
      balance: revenue - expenseTotal,
      averageTicket: filteredAppointments.length > 0 ? revenue / filteredAppointments.length : 0,
      professionalRevenue: profRevenue,
      topServices: sortedServices.slice(0, 3),
    };
  }, [filteredAppointments, filteredExpenses, userProfile?.professionals]);

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'serviceProviderId'>) => {
    if (!userProfile?.uid) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        ...expenseData,
        serviceProviderId: userProfile.uid,
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar despesa: ", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão Financeira</h1>
          <p className="text-gray-400 mt-1">Sua receita, despesas e balanço em um só lugar.</p>
        </div>
        <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={ArrowUp} title="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2).replace('.', ',')}`} color="text-green-400" />
        <StatCard icon={ArrowDown} title="Total de Despesas" value={`R$ ${totalExpenses.toFixed(2).replace('.', ',')}`} color="text-red-400" />
        <StatCard icon={DollarSign} title="Balanço do Período" value={`R$ ${balance.toFixed(2).replace('.', ',')}`} color={balance >= 0 ? "text-green-400" : "text-red-400"} />
        <StatCard icon={TrendingUp} title="Ticket Médio" value={`R$ ${averageTicket.toFixed(2).replace('.', ',')}`} color="text-amber-400" />
      </div>
      
      {/* Navegação por Abas */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Visão Geral</button>
          <button onClick={() => setActiveTab('expenses')} className={`${activeTab === 'expenses' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Despesas</button>
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'overview' && <OverviewContent appointments={filteredAppointments} professionalRevenue={professionalRevenue} topServices={topServices} />}
      {activeTab === 'expenses' && <ExpensesContent expenses={filteredExpenses} onAddExpense={() => setIsModalOpen(true)} />}
      
      {isModalOpen && <AddExpenseModal onClose={() => setIsModalOpen(false)} onSave={handleAddExpense} />}
    </div>
  );
};

// --- Componentes de Conteúdo das Abas ---
const OverviewContent = ({ appointments, professionalRevenue, topServices }) => {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    appointments.forEach(app => {
      const day = format(parseISO(app.date), 'dd/MM');
      dataMap.set(day, (dataMap.get(day) || 0) + app.price);
    });
    return Array.from(dataMap, ([name, faturamento]) => ({ name, faturamento })).sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Evolução do Faturamento</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} /><YAxis stroke="#A0AEC0" fontSize={12} tickFormatter={(value) => `R$${value}`} /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', borderRadius: '0.5rem' }} labelStyle={{ color: '#CBD5E0' }} formatter={(value) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Faturamento']} /><Bar dataKey="faturamento" fill="#F59E0B" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-6">
        <ProfessionalRevenueCard data={professionalRevenue} />
        <TopServicesCard data={topServices} />
      </div>
    </div>
  );
};

const ExpensesContent = ({ expenses, onAddExpense }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">Registro de Despesas</h2>
      <button onClick={onAddExpense} className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 font-semibold transition-colors text-sm"><Plus size={16} /> Adicionar Despesa</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left"><thead className="text-xs text-gray-400 uppercase"><tr><th className="py-3 px-4">Descrição</th><th className="py-3 px-4 hidden md:table-cell">Categoria</th><th className="py-3 px-4 hidden md:table-cell">Data</th><th className="py-3 px-4 text-right">Valor</th></tr></thead>
        <tbody className="divide-y divide-gray-700">
          {expenses.map(exp => (
            <tr key={exp.id} className="hover:bg-gray-700/50">
              <td className="py-4 px-4 font-medium">{exp.description}</td>
              <td className="py-4 px-4 text-gray-300 hidden md:table-cell"><span className="bg-gray-700 px-2 py-1 rounded-full text-xs">{exp.category}</span></td>
              <td className="py-4 px-4 text-gray-300 hidden md:table-cell">{format(parseISO(exp.date), 'dd/MM/yyyy')}</td>
              <td className="py-4 px-4 text-right font-semibold text-red-400">R$ {exp.amount.toFixed(2).replace('.', ',')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {expenses.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma despesa registrada no período.</p>}
    </div>
  </div>
);

// --- Componentes Auxiliares ---
const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-start justify-between">
    <div><p className="text-sm text-gray-400 mb-1">{title}</p><p className={`text-3xl font-bold ${color}`}>{value}</p></div>
    <div className={`bg-gray-700 p-3 rounded-lg`}><Icon className={color} size={24} /></div>
  </div>
);

const TimeRangeSelector = ({ selected, onSelect }) => {
  const options = [{ key: '7d', label: '7 dias' }, { key: '30d', label: '30 dias' }, { key: 'month', label: 'Este Mês' }];
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1">
      {options.map(opt => (<button key={opt.key} onClick={() => onSelect(opt.key)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${selected === opt.key ? 'bg-amber-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>{opt.label}</button>))}
    </div>
  );
};

const AddExpenseModal = ({ onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ description, category, amount: parseFloat(amount), date });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-700"><h2 className="text-xl font-bold text-white">Adicionar Nova Despesa</h2><button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="text-sm font-medium text-gray-300">Descrição</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
          <div><label className="text-sm font-medium text-gray-300">Categoria</label><input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ex: Produtos, Aluguel" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-300">Valor (R$)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
            <div><label className="text-sm font-medium text-gray-300">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" required /></div>
          </div>
          <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors">Salvar Despesa</button></div>
        </form>
      </div>
    </div>
  );
};

const ProfessionalRevenueCard = ({ data }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={20} /> Faturamento por Profissional</h3>
    <div className="space-y-3">
      {data.map((prof, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-gray-300">{prof.name}</span>
          <span className="font-bold text-white">R$ {prof.total.toFixed(2).replace('.', ',')}</span>
        </div>
      ))}
    </div>
  </div>
);

const TopServicesCard = ({ data }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Award size={20} /> Serviços Mais Rentáveis</h3>
    <div className="space-y-3">
      {data.map((service, index) => (
        <div key={index} className="flex justify-between items-center text-sm">
          <span className="text-gray-300">{service.name}</span>
          <span className="font-bold text-white">R$ {service.total.toFixed(2).replace('.', ',')}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-gray-500">Nenhum serviço concluído no período.</p>}
    </div>
  </div>
);

export default FinancialManagement;
