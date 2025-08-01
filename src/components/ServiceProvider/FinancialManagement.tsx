import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, db } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../../context/ToastContext';
import type { Appointment, Expense, Professional, Service } from '../../types';

// Tipos e Interfaces locais
type FinancialView = 'geral' | 'profissionais' | 'servicos' | 'lancamentos';
type ExpenseModalMode = 'add' | 'edit';
interface ExpenseFormData {
    description: string;
    amount: string;
    category: Expense['category'];
    date: string;
    isFixed: boolean;
}

// Componente do Modal para Adicionar/Editar Despesa
const ExpenseModal = ({ isOpen, mode, expense, onClose, onSave }: { isOpen: boolean; mode: ExpenseModalMode; expense?: Expense; onClose: () => void; onSave: (data: ExpenseFormData, id?: string) => void; }) => {
    const [formData, setFormData] = useState<ExpenseFormData>({
        description: '', amount: '', category: 'Outros', date: new Date().toISOString().split('T')[0], isFixed: false
    });

    useEffect(() => {
        if (mode === 'edit' && expense) {
            setFormData({
                description: expense.description,
                amount: String(expense.amount),
                category: expense.category,
                date: expense.date,
                isFixed: expense.isFixed,
            });
        } else {
            setFormData({ description: '', amount: '', category: 'Outros', date: new Date().toISOString().split('T')[0], isFixed: false });
        }
    }, [mode, expense, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, expense?.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-down">
            <div className="bg-gray-800 p-8 rounded-xl w-full max-w-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6">{mode === 'add' ? 'Adicionar Nova Despesa' : 'Editar Despesa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="description" value={formData.description} onChange={handleChange} placeholder="Descrição da despesa" required className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Valor (R$)" required className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500">
                            <option>Aluguel</option> <option>Água</option> <option>Luz</option> <option>Salários</option> <option>Produtos</option> <option>Marketing</option> <option>Outros</option>
                        </select>
                    </div>
                    <input name="date" type="date" value={formData.date} onChange={handleChange} required className="w-full bg-gray-700 p-3 rounded-md focus:ring-2 focus:ring-yellow-500" />
                    <label className="flex items-center gap-3 text-white cursor-pointer">
                        <input name="isFixed" type="checkbox" checked={formData.isFixed} onChange={handleChange} className="h-5 w-5 rounded bg-gray-700 text-yellow-500 focus:ring-yellow-500 border-gray-600" />
                        É uma despesa fixa/recorrente?
                    </label>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-semibold px-6 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-green-600 hover:bg-green-700 font-semibold px-6 py-2 rounded-lg">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const FinancialManagement = () => {
    const { userProfile } = useAuth();
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<(Appointment | Expense)[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<FinancialView>('geral');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [modal, setModal] = useState<{ isOpen: boolean; mode: ExpenseModalMode; expense?: Expense }>({ isOpen: false, mode: 'add' });

    const fetchTransactions = async () => {
        if (!userProfile?.uid) return;
        setLoading(true);

        const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('serviceProviderId', '==', userProfile.uid),
            where('status', '==', 'completed')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const revenues = appointmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));

        const expensesQuery = query(
            collection(db, `users/${userProfile.uid}/expenses`)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const expenses = expensesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense));

        setTransactions([...revenues, ...expenses]);
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [userProfile]);

    const handleSaveExpense = async (data: ExpenseFormData, id?: string) => {
        if (!userProfile) return;
        const expenseData = {
            serviceProviderId: userProfile.uid,
            description: data.description,
            category: data.category,
            amount: parseFloat(data.amount),
            date: data.date,
            isFixed: data.isFixed,
            createdAt: Timestamp.now(),
        };

        try {
            if (modal.mode === 'edit' && id) {
                await updateDoc(doc(db, `users/${userProfile.uid}/expenses`, id), expenseData);
                showToast('Despesa atualizada com sucesso!', 'success');
            } else {
                await addDoc(collection(db, `users/${userProfile.uid}/expenses`), expenseData);
                showToast('Despesa adicionada com sucesso!', 'success');
            }
            setModal({ isOpen: false, mode: 'add' });
            fetchTransactions();
        } catch (error) {
            showToast('Ocorreu um erro ao guardar a despesa.', 'error');
            console.error(error);
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!userProfile) return;
        if (window.confirm("Tem a certeza de que pretende eliminar esta despesa?")) {
            try {
                await deleteDoc(doc(db, `users/${userProfile.uid}/expenses`, id));
                showToast('Despesa eliminada com sucesso!', 'success');
                fetchTransactions();
            } catch (error) {
                showToast('Ocorreu um erro ao eliminar a despesa.', 'error');
                console.error(error);
            }
        }
    };

    const setDatePreset = (preset: 'month' | '30days' | 'year') => {
        const end = new Date();
        let start = new Date();
        if (preset === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1);
        if (preset === '30days') start.setDate(end.getDate() - 30);
        if (preset === 'year') start = new Date(end.getFullYear(), 0, 1);
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    };

    const { totalRevenue, totalExpense, totalProfit, barChartData, pieChartData, professionalReport, serviceReport, filteredTransactions } = useMemo(() => {
        const startDate = new Date(dateRange.start + 'T00:00:00');
        const endDate = new Date(dateRange.end + 'T23:59:59');

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date + 'T00:00:00');
            return tDate >= startDate && tDate <= endDate;
        });

        let totalRevenue = 0, totalExpense = 0;
        const dailyData: { [key: string]: { Receita: number; Despesa: number } } = {};
        const categoryData: { [key: string]: number } = {};
        const profReportData: { [id: string]: { name: string; revenue: number; appointments: number } } = {};
        const serviceReportData: { [id: string]: { name: string; revenue: number; count: number } } = {};

        filtered.forEach(t => {
            const day = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!dailyData[day]) dailyData[day] = { Receita: 0, Despesa: 0 };

            if ('status' in t && t.status === 'completed') {
                const revenueAmount = t.totalPrice || 0;
                totalRevenue += revenueAmount;
                dailyData[day].Receita += revenueAmount;

                const prof = userProfile?.professionals?.find(p => p.id === t.professionalId);
                if (prof) {
                    if (!profReportData[prof.id]) profReportData[prof.id] = { name: prof.name, revenue: 0, appointments: 0 };
                    profReportData[prof.id].revenue += revenueAmount;
                    profReportData[prof.id].appointments += 1;
                }

                t.serviceIds.forEach(serviceId => {
                    const service = userProfile?.professionals?.flatMap(p => p.services).find(s => s.id === serviceId);
                    if (service) {
                        if (!serviceReportData[service.id]) serviceReportData[service.id] = { name: service.name, revenue: 0, count: 0 };
                        serviceReportData[service.id].revenue += service.price;
                        serviceReportData[service.id].count += 1;
                    }
                });

            } else if ('amount' in t) {
                const expenseAmount = t.amount || 0;
                totalExpense += expenseAmount;
                dailyData[day].Despesa += expenseAmount;
                if (!categoryData[t.category]) categoryData[t.category] = 0;
                categoryData[t.category] += expenseAmount;
            }
        });
        
        const barChartData = Object.entries(dailyData).map(([name, values]) => ({ name, ...values })).sort((a, b) => a.name.localeCompare(b.name));
        const pieChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
        const professionalReport = Object.values(profReportData).sort((a, b) => b.revenue - a.revenue);
        const serviceReport = Object.values(serviceReportData).sort((a, b) => b.revenue - a.revenue);
        
        return { totalRevenue, totalExpense, totalProfit: totalRevenue - totalExpense, barChartData, pieChartData, professionalReport, serviceReport, filteredTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [transactions, dateRange, userProfile]);

    const PIE_COLORS = ['#48BB78', '#F56565', '#4299E1', '#ED8936', '#9F7AEA', '#ECC94B'];

    return (
        <div>
            <ExpenseModal isOpen={modal.isOpen} mode={modal.mode} expense={modal.expense} onClose={() => setModal({ isOpen: false, mode: 'add' })} onSave={handleSaveExpense} />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Painel Financeiro</h2>
                <button onClick={() => setModal({ isOpen: true, mode: 'add' })} className="bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors">+ Adicionar Despesa</button>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg mb-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setDatePreset('month')} className="bg-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-500">Este Mês</button>
                    <button onClick={() => setDatePreset('30days')} className="bg-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-500">Últimos 30 dias</button>
                    <button onClick={() => setDatePreset('year')} className="bg-gray-600 px-3 py-1 rounded-md text-sm hover:bg-gray-500">Este Ano</button>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <input type="date" name="start" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} className="w-full bg-gray-600 p-2 rounded-md" />
                    <input type="date" name="end" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} className="w-full bg-gray-600 p-2 rounded-md" />
                </div>
            </div>

            {loading ? <p className="text-center text-gray-400">A carregar dados...</p> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Faturação Bruta</p><p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</p></div>
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Total de Despesas</p><p className="text-3xl font-bold text-red-400">R$ {totalExpense.toFixed(2)}</p></div>
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Lucro Líquido</p><p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-yellow-400' : 'text-red-500'}`}>R$ {totalProfit.toFixed(2)}</p></div>
                    </div>

                    <div className="mb-8 flex space-x-2 border-b border-gray-700">
                        <button onClick={() => setView('geral')} className={`py-2 px-4 font-semibold ${view === 'geral' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Visão Geral</button>
                        <button onClick={() => setView('profissionais')} className={`py-2 px-4 font-semibold ${view === 'profissionais' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Por Profissional</button>
                        <button onClick={() => setView('servicos')} className={`py-2 px-4 font-semibold ${view === 'servicos' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Por Serviço</button>
                        <button onClick={() => setView('lancamentos')} className={`py-2 px-4 font-semibold ${view === 'lancamentos' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}>Lançamentos</button>
                    </div>

                    {view === 'geral' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-down">
                            <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg font-semibold text-yellow-400 mb-4">Receitas vs Despesas</h3><ResponsiveContainer width="100%" height={300}><BarChart data={barChartData}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="name" stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" /><Tooltip contentStyle={{ backgroundColor: '#2D3748' }} /><Legend /><Bar dataKey="Receita" fill="#48BB78" name="Receita" /><Bar dataKey="Despesa" fill="#F56565" name="Despesa" /></BarChart></ResponsiveContainer></div>
                            <div className="bg-gray-700 p-6 rounded-lg"><h3 className="text-lg font-semibold text-yellow-400 mb-4">Categorias de Despesa</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.name}: R$${entry.value.toFixed(2)}`}>{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#2D3748' }} /></PieChart></ResponsiveContainer></div>
                        </div>
                    )}

                    {view === 'profissionais' && (<div className="bg-gray-700 p-6 rounded-lg animate-fade-in-down"><h3 className="text-lg font-semibold text-yellow-400 mb-4">Desempenho por Profissional</h3><ul className="space-y-3">{professionalReport.map(p => <li key={p.name} className="flex justify-between items-center bg-gray-800 p-3 rounded-md"><span>{p.name}</span><span className="font-bold">R$ {p.revenue.toFixed(2)} ({p.appointments} atendimentos)</span></li>)}</ul></div>)}
                    {view === 'servicos' && (<div className="bg-gray-700 p-6 rounded-lg animate-fade-in-down"><h3 className="text-lg font-semibold text-yellow-400 mb-4">Desempenho por Serviço</h3><ul className="space-y-3">{serviceReport.map(s => <li key={s.name} className="flex justify-between items-center bg-gray-800 p-3 rounded-md"><span>{s.name}</span><span className="font-bold">R$ {s.revenue.toFixed(2)} ({s.count} vezes)</span></li>)}</ul></div>)}
                    {view === 'lancamentos' && (<div className="bg-gray-700 p-6 rounded-lg animate-fade-in-down"><h3 className="text-lg font-semibold text-yellow-400 mb-4">Todos os Lançamentos no Período</h3><ul className="space-y-3">{filteredTransactions.map(t => (<li key={t.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-md"><div><p className="font-semibold">{'status' in t ? t.serviceName || 'Receita de Serviço' : t.description}</p><p className="text-xs text-gray-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}{'status' in t ? ` - ${t.professionalName}` : ` - ${t.category}`}</p></div><div className="flex items-center gap-4"><span className={`font-bold ${'status' in t ? 'text-green-400' : 'text-red-400'}`}>{'status' in t ? `+ R$ ${t.totalPrice?.toFixed(2)}` : `- R$ ${t.amount.toFixed(2)}`}</span>{'amount' in t && (<div className="flex gap-2"><button onClick={() => setModal({isOpen: true, mode: 'edit', expense: t})} className="text-blue-400 hover:text-blue-300">Editar</button><button onClick={() => handleDeleteExpense(t.id)} className="text-red-400 hover:text-red-300">Eliminar</button></div>)}</div></li>))}</ul></div>)}
                </>
            )}
        </div>
    );
};

export default FinancialManagement;
