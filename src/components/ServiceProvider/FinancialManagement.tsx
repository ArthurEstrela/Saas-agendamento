import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { getTransactions } from '../../firebase/financeService';
import { getExpenses, addExpense, deleteExpense } from '../../firebase/expenseService';
import type { Transaction, Expense, Professional, Service } from '../../types';
import { Loader2, DollarSign, Calendar, BarChart2, AlertCircle, ArrowDownCircle, TrendingUp, PlusCircle, Trash2, Users, Tag } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, sub, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmationModal from '../Common/ConfirmationModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componentes de estado (sem alterações)
const ErrorState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-red-400 bg-red-900/20 p-8 rounded-lg">
        <AlertCircle size={48} className="mb-4" />
        <h3 className="text-xl font-semibold text-white">Ocorreu um Erro</h3>
        <p>{message}</p>
    </div>
);
const LoadingState = () => (
    <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-[#daa520]" size={40} />
    </div>
);

// Novo Componente para Gerenciar Despesas (Adicionado aqui para simplicidade)
const ExpensesSection = ({ userId, professionals }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    const fetchExpenses = async () => {
        setLoading(true);
        const fetchedExpenses = await getExpenses(userId);
        setExpenses(fetchedExpenses);
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !date) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        setIsSubmitting(true);
        await addExpense(userId, { description, amount: parseFloat(amount), date: new Date(date) });
        // Reset form
        setDescription('');
        setAmount('');
        await fetchExpenses(); // Recarrega a lista
        setIsSubmitting(false);
    };

    const handleDeleteConfirm = async () => {
        if (expenseToDelete) {
            await deleteExpense(userId, expenseToDelete.id);
            setExpenseToDelete(null);
            await fetchExpenses();
        }
    };

    return (
        <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Controle de Despesas</h3>
            {/* Formulário para Adicionar Despesa */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="text-xs text-gray-400">Descrição</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Aluguel do espaço" className="w-full bg-gray-900/50 rounded-md p-2 mt-1 border border-gray-600 focus:border-[#daa520] focus:ring-[#daa520]" required />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Valor (R$)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500.00" className="w-full bg-gray-900/50 rounded-md p-2 mt-1 border border-gray-600 focus:border-[#daa520] focus:ring-[#daa520]" required />
                </div>
                <button type="submit" disabled={isSubmitting} className="flex justify-center items-center gap-2 bg-[#daa520] text-black font-bold p-2 rounded-md hover:bg-amber-400 transition-colors disabled:bg-gray-500">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
                    Adicionar
                </button>
            </form>

            {/* Lista de Despesas */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Descrição</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></td></tr> :
                            expenses.length > 0 ? (
                                expenses.map((exp) => (
                                    <tr key={exp.id} className="border-t border-gray-700 hover:bg-gray-700/40">
                                        <td className="px-6 py-4">{format(exp.date, 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-white">{exp.description}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-400">
                                            - R$ {exp.amount.toFixed(2).replace('.', ',')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setExpenseToDelete(exp)} className="text-gray-400 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-400">Nenhuma despesa registrada.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal
                isOpen={!!expenseToDelete}
                onClose={() => setExpenseToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja remover a despesa "${expenseToDelete?.description}"?`}
            />
        </div>
    );
};

// Componente Principal
const FinancialManagement = () => {
    const { userProfile } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- NOVOS ESTADOS PARA OS FILTROS ---
    const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'year'>('month');
    const [professionalFilter, setProfessionalFilter] = useState<string | 'all'>('all');
    
    const professionals: Professional[] = useMemo(() => userProfile?.professionals || [], [userProfile?.professionals]);
    const services: Service[] = useMemo(() => userProfile?.services || [], [userProfile?.services]);

    useEffect(() => {
        const fetchFinancials = async () => {
            if (!userProfile?.uid) {
                setLoading(false);
                setError("Usuário não autenticado.");
                return;
            }
            try {
                setLoading(true);
                const [fetchedTransactions, fetchedExpenses] = await Promise.all([
                    getTransactions(userProfile.uid),
                    getExpenses(userProfile.uid)
                ]);
                setTransactions(fetchedTransactions);
                setExpenses(fetchedExpenses);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Falha ao carregar dados financeiros.');
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, [userProfile?.uid]);

    const { filteredTransactions, filteredExpenses, totalRevenue, totalExpenses, netProfit, monthlyRevenue, revenueByProfessional, revenueByService } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (dateFilter) {
            case 'week':
                startDate = startOfWeek(now, { locale: ptBR });
                endDate = endOfWeek(now, { locale: ptBR });
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'year':
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
        }

        const filteredTransactions = transactions.filter(tr => 
            isWithinInterval(tr.completedAt, { start: startDate, end: endDate }) &&
            (professionalFilter === 'all' || tr.professionalId === professionalFilter)
        );

        const filteredExpenses = expenses.filter(exp => 
            isWithinInterval(exp.date, { start: startDate, end: endDate })
        );

        const totalRevenue = filteredTransactions.reduce((sum, tr) => sum + tr.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const monthlyRevenue = filteredTransactions.reduce((acc, tr) => {
            const month = format(tr.completedAt, 'yyyy-MM');
            acc[month] = (acc[month] || 0) + tr.amount;
            return acc;
        }, {} as Record<string, number>);

        const revenueByProfessional = filteredTransactions.reduce((acc, tr) => {
            const prof = acc.find(p => p.id === tr.professionalId);
            if (prof) {
                prof.revenue += tr.amount;
                prof.appointments += 1;
            } else {
                acc.push({
                    id: tr.professionalId,
                    name: tr.professionalName,
                    revenue: tr.amount,
                    appointments: 1
                });
            }
            return acc;
        }, [] as { id: string, name: string, revenue: number, appointments: number }[]);
        
        const revenueByService = filteredTransactions.reduce((acc, tr) => {
            const service = acc.find(s => s.id === tr.serviceId);
            if (service) {
                service.revenue += tr.amount;
                service.appointments += 1;
            } else {
                acc.push({
                    id: tr.serviceId,
                    name: tr.serviceName,
                    revenue: tr.amount,
                    appointments: 1
                });
            }
            return acc;
        }, [] as { id: string, name: string, revenue: number, appointments: number }[]);
        
        return { filteredTransactions, filteredExpenses, totalRevenue, totalExpenses, netProfit, monthlyRevenue, revenueByProfessional, revenueByService };
    }, [transactions, expenses, dateFilter, professionalFilter]);

    const chartData = useMemo(() => {
        const sortedMonths = Object.keys(monthlyRevenue).sort();
        const labels = sortedMonths.map(month => format(new Date(`${month}-02`), 'MMM/yy', { locale: ptBR }));
        const data = sortedMonths.map(month => monthlyRevenue[month]);

        return {
            labels,
            datasets: [{
                label: 'Faturamento Mensal',
                data,
                backgroundColor: 'rgba(218, 165, 32, 0.6)',
                borderColor: 'rgba(218, 165, 32, 1)',
                borderWidth: 1,
            }],
        };
    }, [monthlyRevenue]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Gestão Financeira</h2>

            {/* --- NOVOS FILTROS --- */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800 p-1">
                    <button onClick={() => setDateFilter('week')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${dateFilter === 'week' ? 'bg-[#daa520] text-black' : 'text-gray-300'}`}>Semana</button>
                    <button onClick={() => setDateFilter('month')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${dateFilter === 'month' ? 'bg-[#daa520] text-black' : 'text-gray-300'}`}>Mês</button>
                    <button onClick={() => setDateFilter('year')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${dateFilter === 'year' ? 'bg-[#daa520] text-black' : 'text-gray-300'}`}>Ano</button>
                </div>
                <select onChange={(e) => setProfessionalFilter(e.target.value)} value={professionalFilter} className="w-full sm:w-auto bg-gray-800 border border-gray-700 p-2 rounded-lg text-white">
                    <option value="all">Todos os Profissionais</option>
                    {professionals.map(prof => (
                        <option key={prof.id} value={prof.id}>{prof.name}</option>
                    ))}
                </select>
            </div>
            
            {/* Cards de Resumo Atualizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-full"><DollarSign className="text-green-400" size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-400">Faturamento Bruto</p>
                            <p className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full"><ArrowDownCircle className="text-red-400" size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-400">Total de Despesas</p>
                            <p className="text-2xl font-bold text-white">R$ {totalExpenses.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full"><TrendingUp className="text-blue-400" size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-400">Lucro Líquido</p>
                            <p className="text-2xl font-bold text-white">R$ {netProfit.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NOVAS SEÇÕES DE RELATÓRIOS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users size={20}/> Desempenho por Profissional</h3>
                    {revenueByProfessional.length > 0 ? (
                        <div className="space-y-4">
                            {revenueByProfessional.sort((a, b) => b.revenue - a.revenue).map(prof => (
                                <div key={prof.id} className="flex justify-between items-center text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{prof.name}</span>
                                        <span className="text-xs text-gray-400">({prof.appointments} atend.)</span>
                                    </div>
                                    <span className="font-bold text-white">R$ {prof.revenue.toFixed(2).replace('.', ',')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400">Sem dados para este período/profissional.</p>
                    )}
                </div>
                <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Tag size={20}/> Lucratividade por Serviço</h3>
                    {revenueByService.length > 0 ? (
                        <div className="space-y-4">
                            {revenueByService.sort((a, b) => b.revenue - a.revenue).map(serv => (
                                <div key={serv.id} className="flex justify-between items-center text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{serv.name}</span>
                                        <span className="text-xs text-gray-400">({serv.appointments} atend.)</span>
                                    </div>
                                    <span className="font-bold text-white">R$ {serv.revenue.toFixed(2).replace('.', ',')}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-400">Sem dados para este período/profissional.</p>
                    )}
                </div>
            </div>

            {/* Seção de Despesas */}
            <ExpensesSection userId={userProfile!.uid} professionals={professionals} />

            {/* Gráfico (sem alterações) */}
            <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={20} /> Desempenho Mensal (Bruto)</h3>
                {transactions.length > 0 ? (<Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#9ca3af' } }, x: { ticks: { color: '#9ca3af' } } } }} />) : (<p className="text-center text-gray-400 py-8">Ainda não há dados para exibir o gráfico.</p>)}
            </div>

            {/* Tabela de Transações Recentes (sem alterações) */}
            <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden">
                <h3 className="text-lg font-semibold text-white p-6">Histórico de Faturamento</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Serviço</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (filteredTransactions.map((tr) => (<tr key={tr.id} className="border-t border-gray-700 hover:bg-gray-700/40"><td className="px-6 py-4">{format(tr.completedAt, 'dd/MM/yyyy HH:mm')}</td><td className="px-6 py-4 font-medium text-white">{tr.clientName}</td><td className="px-6 py-4">{tr.serviceName}</td><td className="px-6 py-4 text-right font-bold text-green-400">R$ {tr.amount.toFixed(2).replace('.', ',')}</td></tr>))) : (<tr><td colSpan={4} className="text-center py-10 text-gray-400">Nenhuma transação encontrada no período/filtro selecionado.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialManagement;