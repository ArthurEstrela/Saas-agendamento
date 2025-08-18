// src/components/ServiceProvider/FinancialManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, addDoc, Timestamp, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../context/ToastContext';
import type { Appointment, Expense } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

// --- Tipos e Interfaces ---
type FinancialView = 'geral' | 'profissionais' | 'servicos' | 'lancamentos';
type ExpenseModalMode = 'add' | 'edit';
interface ExpenseFormData {
    description: string;
    amount: string;
    category: Expense['category'];
    date: string;
    isFixed: boolean;
    recurringDay?: number;
}

// --- Componente do Modal para Despesas ---
const ExpenseModal = ({ isOpen, mode, expense, onClose, onSave }) => {
    const { showToast } = useToast();
    const getInitialState = () => {
        if (mode === 'edit' && expense) {
            return {
                description: expense.description,
                amount: String(expense.amount),
                category: expense.category,
                date: expense.date,
                isFixed: expense.isFixed || false,
                recurringDay: expense.recurringDay,
            };
        }
        return {
            description: '',
            amount: '',
            category: 'Outros' as Expense['category'],
            date: new Date().toISOString().split('T')[0],
            isFixed: false,
            recurringDay: undefined,
        };
    };
    const [formData, setFormData] = useState<ExpenseFormData>(getInitialState());
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => { setFormData(getInitialState()); }, [mode, expense, isOpen]);
    if (!isOpen) return null;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const isChecked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, isFixed: isChecked, recurringDay: isChecked ? prev.recurringDay : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.isFixed && (!formData.recurringDay || formData.recurringDay < 1 || formData.recurringDay > 31)) {
            showToast('Para despesas recorrentes, insira um dia válido (1-31).', 'error');
            return;
        }
        setIsSaving(true);
        await onSave(formData, expense?.id);
        setIsSaving(false);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-900/80 p-6 sm:p-8 rounded-2xl w-full max-w-lg border border-[#daa520]/30 shadow-2xl shadow-[#daa520]/10">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">{mode === 'add' ? 'Adicionar Nova Despesa' : 'Editar Despesa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="description" value={formData.description} onChange={handleChange} placeholder="Descrição da despesa" required className="w-full bg-gray-800 p-3 rounded-lg focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Valor (R$)" required className="w-full bg-gray-800 p-3 rounded-lg focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-800 p-3 rounded-lg focus:ring-2 focus:ring-[#daa520] border border-gray-700 appearance-none">
                            <option>Aluguel</option> <option>Água</option> <option>Luz</option> <option>Salários</option> <option>Produtos</option> <option>Marketing</option> <option>Outros</option>
                        </select>
                    </div>
                    <input name="date" type="date" value={formData.date} onChange={handleChange} required className="w-full bg-gray-800 p-3 rounded-lg focus:ring-2 focus:ring-[#daa520] border border-gray-700" />
                    <label className="flex items-center gap-3 text-white cursor-pointer"><input name="isFixed" type="checkbox" checked={formData.isFixed} onChange={handleChange} className="h-5 w-5 rounded bg-gray-700 text-[#daa520] focus:ring-[#daa520] border-gray-600" />É uma despesa fixa/recorrente?</label>
                    {formData.isFixed && (<div className="animate-fade-in-down"><label htmlFor="recurringDay" className="block text-sm font-medium text-gray-300 mb-2">Dia do vencimento mensal</label><input id="recurringDay" name="recurringDay" type="number" placeholder="Ex: 5" min="1" max="31" value={formData.recurringDay || ''} onChange={(e) => setFormData(prev => ({ ...prev, recurringDay: parseInt(e.target.value) || undefined }))} className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700" /></div>)}
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 font-semibold px-6 py-2 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-500 font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500">{isSaving ? <Loader2 className="animate-spin" /> : 'Salvar'}</button></div>
                </form>
            </div>
        </div>
    );
};

// --- Componentes de UI do Dashboard ---
const StatCard = ({ title, value, icon: Icon, colorClass, prefix = "R$ " }) => (
    <div className={`relative bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-400/10`}>
        <div className={`absolute top-0 left-0 h-1 w-full ${colorClass}`}></div>
        <div className="flex items-start justify-between">
            <div><p className="text-sm text-gray-400">{title}</p><p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-2">{prefix}{value}</p></div>
            <div className={`p-3 rounded-full ${colorClass} shadow-lg`}><Icon className="h-6 w-6 text-black" /></div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-gray-700 shadow-lg">
                <p className="label text-sm font-semibold text-white mb-1">{`${label}`}</p>
                {payload.map((p, i) => (<p key={i} style={{ color: p.color }} className="intro text-xs font-medium">{`${p.name}: R$ ${p.value.toFixed(2).replace('.', ',')}`}</p>))}
            </div>
        );
    }
    return null;
};

// --- Componente Principal ---
const FinancialManagement = () => {
    const { userProfile } = useAuth();
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<(Appointment | Expense)[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<FinancialView>('geral');
    const [dateRange, setDateRange] = useState({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [modal, setModal] = useState<{ isOpen: boolean; mode: ExpenseModalMode; expense?: Expense }>({ isOpen: false, mode: 'add' });

    useEffect(() => {
        if (!userProfile?.uid) { setLoading(false); return; }
        setLoading(true);
        const appointmentsQuery = query(collection(db, 'appointments'), where('serviceProviderId', '==', userProfile.uid), where('status', '==', 'completed'));
        const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
            const revenues = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'revenue' } as Appointment & { type: 'revenue' }));
            setTransactions(prev => [...prev.filter(t => t.type !== 'revenue'), ...revenues]);
            setLoading(false);
        }, (error) => { console.error("Erro ao carregar receitas:", error); showToast("Erro ao carregar dados de receita.", 'error'); setLoading(false); });

        const expensesQuery = query(collection(db, 'users', userProfile.uid, 'expenses'));
        const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
            const expenses = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'expense' } as Expense & { type: 'expense' }));
            setTransactions(prev => [...prev.filter(t => t.type !== 'expense'), ...expenses]);
        }, (error) => { console.error("Erro ao carregar despesas:", error); showToast("Erro ao carregar dados de despesa.", 'error'); });

        return () => { unsubscribeAppointments(); unsubscribeExpenses(); };
    }, [userProfile?.uid, showToast]);

    const handleSaveExpense = async (data: ExpenseFormData, id?: string) => {
        if (!userProfile) return;
        const expenseData = {
            serviceProviderId: userProfile.uid,
            description: data.description,
            category: data.category,
            amount: parseFloat(data.amount),
            date: data.date,
            isFixed: data.isFixed,
            recurringDay: data.isFixed ? data.recurringDay : undefined,
        };
        try {
            const expenseCollectionRef = collection(db, 'users', userProfile.uid, 'expenses');
            if (modal.mode === 'edit' && id) {
                await updateDoc(doc(expenseCollectionRef, id), expenseData);
                showToast('Despesa atualizada com sucesso!', 'success');
            } else {
                await addDoc(expenseCollectionRef, { ...expenseData, createdAt: serverTimestamp() });
                showToast('Despesa adicionada com sucesso!', 'success');
            }
            onClose(); // Fechar o modal
        } catch (error) { showToast('Ocorreu um erro ao guardar a despesa.', 'error'); console.error(error); }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!userProfile) return;
        if (window.confirm("Tem a certeza de que pretende eliminar esta despesa?")) {
            try {
                await deleteDoc(doc(db, 'users', userProfile.uid, 'expenses', id));
                showToast('Despesa eliminada com sucesso!', 'success');
            } catch (error) { showToast('Ocorreu um erro ao eliminar a despesa.', 'error'); console.error(error); }
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

    const { totalRevenue, totalExpense, totalProfit, areaChartData, pieChartData, professionalReport, serviceReport, filteredTransactions } = useMemo(() => {
        const startDate = new Date(dateRange.start + 'T00:00:00');
        const endDate = new Date(dateRange.end + 'T23:59:59');
        const filtered = transactions.filter(t => { const tDate = new Date(t.date); return tDate >= startDate && tDate <= endDate; });
        
        let totalRevenue = 0, totalExpense = 0;
        const dailyData: { [key: string]: { Receita: number; Despesa: number } } = {};
        const categoryData: { [key: string]: number } = {};
        const profReportData: { [name: string]: { name: string; revenue: number; appointments: number } } = {};
        const serviceReportData: { [name: string]: { name: string; revenue: number; count: number } } = {};

        filtered.forEach(t => {
            const day = new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (!dailyData[day]) dailyData[day] = { Receita: 0, Despesa: 0 };
            
            if (t.type === 'revenue') {
                const revenueAmount = t.totalPrice || 0;
                totalRevenue += revenueAmount;
                dailyData[day].Receita += revenueAmount;
                
                // CORREÇÃO APLICADA AQUI
                const profName = t.professionalName || 'Não Especificado';
                if (!profReportData[profName]) profReportData[profName] = { name: profName, revenue: 0, appointments: 0 };
                profReportData[profName].revenue += revenueAmount;
                profReportData[profName].appointments += 1;
                
                // CORREÇÃO APLICADA AQUI
                const servName = t.serviceName || 'Não Especificado';
                if (!serviceReportData[servName]) serviceReportData[servName] = { name: servName, revenue: 0, count: 0 };
                serviceReportData[servName].revenue += revenueAmount;
                serviceReportData[servName].count += 1;

            } else if (t.type === 'expense') {
                const expenseAmount = t.amount || 0;
                totalExpense += expenseAmount;
                dailyData[day].Despesa += expenseAmount;
                if (!categoryData[t.category]) categoryData[t.category] = 0;
                categoryData[t.category] += expenseAmount;
            }
        });

        const areaChartData = Object.entries(dailyData).map(([name, values]) => ({ name, ...values })).sort((a, b) => { const [dayA, monthA] = a.name.split('/').map(Number); const [dayB, monthB] = b.name.split('/').map(Number); return (monthA * 100 + dayA) - (monthB * 100 + dayB); });
        const pieChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
        const professionalReport = Object.values(profReportData).sort((a, b) => b.revenue - a.revenue);
        const serviceReport = Object.values(serviceReportData).sort((a, b) => b.revenue - a.revenue);
        
        return { totalRevenue, totalExpense, totalProfit: totalRevenue - totalExpense, areaChartData, pieChartData, professionalReport, serviceReport, filteredTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [transactions, dateRange]);

    const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
    const formatCurrency = (value: number) => value.toFixed(2).replace('.', ',');

    const renderReportList = (reportData, valueKey, valueSuffix) => (
        <ul className="space-y-3">
            {reportData.length > 0 ? reportData.map(p => (
                <li key={p.name} className="flex flex-wrap justify-between items-center bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="font-bold text-green-400">R$ {formatCurrency(p.revenue)} <span className="text-xs text-gray-400 font-normal">({p[valueKey]} {valueSuffix})</span></span>
                </li>
            )) : <p className="text-gray-500 text-center py-4">Nenhum dado de receita para este período.</p>}
        </ul>
    );

    return (
        <div className="p-0 sm:p-4 md:p-6 text-white">
            <ExpenseModal isOpen={modal.isOpen} mode={modal.mode} expense={modal.expense} onClose={() => setModal({ isOpen: false, mode: 'add' })} onSave={handleSaveExpense} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div><h2 className="text-3xl font-bold text-white">Painel Financeiro</h2><p className="text-gray-400 mt-1">Sua visão completa sobre ganhos e despesas.</p></div>
                <button onClick={() => setModal({ isOpen: true, mode: 'add' })} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors shadow-lg shadow-[#daa520]/20"><PlusCircle className="h-5 w-5" />Adicionar Despesa</button>
            </div>
            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl mb-8 space-y-4 border border-gray-800">
                <div className="flex flex-wrap items-center gap-2"><button onClick={() => setDatePreset('month')} className="bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700">Este Mês</button><button onClick={() => setDatePreset('30days')} className="bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700">Últimos 30 dias</button><button onClick={() => setDatePreset('year')} className="bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700">Este Ano</button></div>
                <div className="flex flex-col sm:flex-row items-center gap-4"><input type="date" name="start" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700" /><span className="text-gray-500 hidden sm:block">até</span><input type="date" name="end" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700" /></div>
            </div>

            {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#daa520]" size={48} /></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Faturação Bruta" value={formatCurrency(totalRevenue)} icon={TrendingUp} colorClass="bg-gradient-to-r from-green-500 to-emerald-500" />
                        <StatCard title="Total de Despesas" value={formatCurrency(totalExpense)} icon={TrendingDown} colorClass="bg-gradient-to-r from-red-500 to-rose-500" />
                        <StatCard title="Lucro Líquido" value={formatCurrency(totalProfit)} icon={DollarSign} colorClass="bg-gradient-to-r from-amber-500 to-yellow-500" />
                    </div>
                    <div className="mb-8 flex space-x-1 sm:space-x-2 border-b border-gray-800">
                        <button onClick={() => setView('geral')} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold transition-colors duration-300 ${view === 'geral' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Visão Geral</button>
                        <button onClick={() => setView('profissionais')} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold transition-colors duration-300 ${view === 'profissionais' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Por Profissional</button>
                        <button onClick={() => setView('servicos')} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold transition-colors duration-300 ${view === 'servicos' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Por Serviço</button>
                        <button onClick={() => setView('lancamentos')} className={`py-2 px-3 sm:px-4 text-sm sm:text-base font-semibold transition-colors duration-300 ${view === 'lancamentos' ? 'text-[#daa520] border-b-2 border-[#daa520]' : 'text-gray-500 hover:text-white'}`}>Lançamentos</button>
                    </div>
                    
                    <div className="animate-fade-in">
                        {view === 'geral' && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                <div className="lg:col-span-3 bg-black/30 p-4 sm:p-6 rounded-xl border border-gray-800"><h3 className="text-lg font-semibold text-white mb-4">Receitas vs Despesas</h3><ResponsiveContainer width="100%" height={300}><AreaChart data={areaChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}><defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.7}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient><linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.7}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false}/><YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Receita" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" /><Area type="monotone" dataKey="Despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" /></AreaChart></ResponsiveContainer></div>
                                <div className="lg:col-span-2 bg-black/30 p-4 sm:p-6 rounded-xl border border-gray-800"><h3 className="text-lg font-semibold text-white mb-4">Categorias de Despesa</h3><ResponsiveContainer width="100%" height={300}>{pieChartData.length > 0 ? <PieChart><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} fill="#8884d8" paddingAngle={5} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart> : <div className="flex items-center justify-center h-full text-gray-500">Nenhuma despesa no período.</div>}</ResponsiveContainer></div>
                            </div>
                        )}
                        {view === 'profissionais' && (<div className="bg-black/30 p-4 sm:p-6 rounded-xl border border-gray-800 animate-fade-in"><h3 className="text-lg font-semibold text-white mb-4">Desempenho por Profissional</h3>{renderReportList(professionalReport, 'appointments', 'atendimentos')}</div>)}
                        {view === 'servicos' && (<div className="bg-black/30 p-4 sm:p-6 rounded-xl border border-gray-800 animate-fade-in"><h3 className="text-lg font-semibold text-white mb-4">Desempenho por Serviço</h3>{renderReportList(serviceReport, 'count', 'vezes')}</div>)}
                        {view === 'lancamentos' && (
                            <div className="bg-black/30 p-0 sm:p-6 rounded-xl border-gray-800 animate-fade-in">
                                <h3 className="text-lg font-semibold text-white mb-4 px-4 sm:px-0">Todos os Lançamentos no Período</h3>
                                <div className="hidden sm:block overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-gray-700 text-gray-400 uppercase text-xs"><tr><th className="p-4">Descrição</th><th className="p-4">Data</th><th className="p-4">Categoria/Profissional</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr></thead><tbody>{filteredTransactions.map(t => (<tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50"><td className="p-4 font-medium text-white">{t.type === 'revenue' ? t.serviceName || 'Receita' : t.description}</td><td className="p-4 text-gray-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td><td className="p-4 text-gray-400">{t.type === 'revenue' ? t.professionalName : t.category}</td><td className={`p-4 text-right font-bold ${t.type === 'revenue' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'revenue' ? `+ R$ ${formatCurrency(t.totalPrice || 0)}` : `- R$ ${formatCurrency(t.amount || 0)}`}</td><td className="p-4 text-center">{t.type === 'expense' && (<div className="flex gap-2 justify-center"><button onClick={() => setModal({isOpen: true, mode: 'edit', expense: t as Expense})} className="text-blue-400 hover:text-blue-300"><Edit size={16}/></button><button onClick={() => handleDeleteExpense(t.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button></div>)}</td></tr>))}</tbody></table></div>
                                <ul className="sm:hidden space-y-3">{filteredTransactions.map(t => (<li key={t.id} className="bg-gray-800/50 p-4 rounded-lg"><div className="flex justify-between items-start"><div><p className="font-semibold text-white">{t.type === 'revenue' ? t.serviceName || 'Receita' : t.description}</p><p className="text-xs text-gray-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} - {t.type === 'revenue' ? t.professionalName : t.category}</p></div><span className={`font-bold text-lg ${t.type === 'revenue' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'revenue' ? `+ R$ ${formatCurrency(t.totalPrice || 0)}` : `- R$ ${formatCurrency(t.amount || 0)}`}</span></div>{t.type === 'expense' && (<div className="flex gap-4 justify-end mt-2 border-t border-gray-700 pt-2"><button onClick={() => setModal({isOpen: true, mode: 'edit', expense: t as Expense})} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"><Edit size={14}/> Editar</button><button onClick={() => handleDeleteExpense(t.id)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"><Trash2 size={14}/> Eliminar</button></div>)}</li>))}</ul>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FinancialManagement; 