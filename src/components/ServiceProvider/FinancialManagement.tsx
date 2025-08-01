import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import type { Appointment, Expense } from '../../types';

interface FinancialData {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  chartData: {
    name: string;
    Receita: number;
    Despesa: number;
  }[];
}

const FinancialManagement = () => {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<(Appointment | Expense)[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Estados para o formulário de despesa
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Aluguel' | 'Água' | 'Luz' | 'Salários' | 'Produtos' | 'Marketing' | 'Outros'>('Outros');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTransactions = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);

    // Buscar Receitas (agendamentos concluídos)
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('serviceProviderId', '==', userProfile.uid),
      where('status', '==', 'completed')
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const revenues = appointmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'revenue' } as Appointment & { type: 'revenue' }));

    // Buscar Despesas
    const expensesQuery = query(
      collection(db, `users/${userProfile.uid}/expenses`),
      orderBy('date', 'desc')
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'expense' } as Expense & { type: 'expense' }));

    setTransactions([...revenues, ...expenses]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [userProfile]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !expenseDescription || !expenseAmount) return;

    const newExpense: Omit<Expense, 'id'> = {
      serviceProviderId: userProfile.uid,
      description: expenseDescription,
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      date: expenseDate,
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, `users/${userProfile.uid}/expenses`), newExpense);
    
    // Limpa o formulário e atualiza a lista
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseCategory('Outros');
    fetchTransactions();
  };

  const financialData: FinancialData = useMemo(() => {
    const startDate = new Date(dateRange.start + 'T00:00:00');
    const endDate = new Date(dateRange.end + 'T23:59:59');

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date + 'T00:00:00');
      return tDate >= startDate && tDate <= endDate;
    });

    const data: FinancialData = {
      totalRevenue: 0,
      totalExpense: 0,
      totalProfit: 0,
      chartData: [],
    };

    const dailyData: { [key: string]: { Receita: number; Despesa: number } } = {};

    filtered.forEach(t => {
      const day = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[day]) {
        dailyData[day] = { Receita: 0, Despesa: 0 };
      }

      if ('status' in t && t.status === 'completed') { // É uma receita
        const revenueAmount = t.totalPrice || 0;
        data.totalRevenue += revenueAmount;
        dailyData[day].Receita += revenueAmount;
      } else if ('amount' in t) { // É uma despesa
        const expenseAmount = t.amount || 0;
        data.totalExpense += expenseAmount;
        dailyData[day].Despesa += expenseAmount;
      }
    });
    
    data.totalProfit = data.totalRevenue - data.totalExpense;
    data.chartData = Object.entries(dailyData).map(([name, values]) => ({ name, ...values }));

    return data;
  }, [transactions, dateRange]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Painel Financeiro</h2>
      
      <div className="bg-gray-700 p-4 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Filtros de Data */}
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Carregando dados...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-400">Faturamento Bruto</p>
              <p className="text-3xl font-bold text-green-400">R$ {financialData.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-400">Total de Despesas</p>
              <p className="text-3xl font-bold text-red-400">R$ {financialData.totalExpense.toFixed(2)}</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-400">Lucro Líquido</p>
              <p className={`text-3xl font-bold ${financialData.totalProfit >= 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                R$ {financialData.totalProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-gray-700 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Receitas vs Despesas no Período</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={financialData.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="name" stroke="#A0AEC0" />
                  <YAxis stroke="#A0AEC0" />
                  <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                  <Legend />
                  <Bar dataKey="Receita" fill="#48BB78" name="Receita" />
                  <Bar dataKey="Despesa" fill="#F56565" name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Adicionar Nova Despesa</h3>
              <form onSubmit={handleAddExpense} className="bg-gray-700 p-6 rounded-lg space-y-4">
                <input type="text" placeholder="Descrição da despesa" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Valor (R$)" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                  <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as any)} className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500">
                    <option>Aluguel</option>
                    <option>Água</option>
                    <option>Luz</option>
                    <option>Salários</option>
                    <option>Produtos</option>
                    <option>Marketing</option>
                    <option>Outros</option>
                  </select>
                </div>
                <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required className="w-full bg-gray-600 text-white border-gray-500 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" />
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar Despesa</button>
              </form>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Últimos Lançamentos</h3>
              <ul className="space-y-3">
                {/* Lista de transações (receitas e despesas) */}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialManagement;
