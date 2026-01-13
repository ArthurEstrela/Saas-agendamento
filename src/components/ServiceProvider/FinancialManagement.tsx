import { useEffect, useMemo, useState } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import {
  AlertCircle,
  ArrowDown,
  Calendar as CalendarIcon,
  DollarSign,
  PlusCircle,
  TrendingUp,
  Edit,
  Trash2,
  Download,
  ClipboardList,
  Users,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  Cell,
  PieChart as RechartsPieChart,
} from "recharts";
import { motion } from "framer-motion";
import "react-day-picker/dist/style.css";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ExpenseModal from "./ExpenseModal";
import type { Appointment, Expense } from "../../types";
import { Timestamp } from "firebase/firestore";
import { exportTransactionsToCsv } from "../../lib/utils/exportToCsv";
import { PerformanceRanking } from "./PerformanceRanking";

// UI Components
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { cn } from "../../lib/utils/cn";
import { Badge } from "../ui/badge";

// --- Funções Utilitárias ---

const normalizeTimestamp = (dateValue: unknown): Date => {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (!dateValue) return new Date();
  return new Date(dateValue as string | number | Date);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// --- Sub-componentes ---

const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "danger";
}) => {
  const variantStyles = {
    default: "text-primary bg-primary/10 border-primary/20",
    success: "text-green-500 bg-green-500/10 border-green-500/20",
    danger: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full"
    >
      <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden h-full">
        <CardContent className="p-5 sm:p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h3>
          </div>
          <div className={cn("p-3 rounded-xl border shrink-0 ml-4", variantStyles[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Componente de Lista de Transações (Híbrido: Card Mobile / Tabela Desktop) ---
const FinancialTransactionsList = ({
  transactions,
  onEditExpense,
  onDeleteExpense,
}: {
  transactions: (Appointment | Expense)[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}) => {
  return (
    <div className="w-full">
      {/* --- VISÃO MOBILE (Cards) --- */}
      <div className="block md:hidden space-y-3">
        {transactions.map((item) => {
          const isIncome = "totalPrice" in item;
          const date = normalizeTimestamp("date" in item ? item.date : item.startTime);
          const isExpense = !isIncome;

          return (
            <div 
              key={item.id} 
              className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    {format(date, "dd 'de' MMM", { locale: ptBR })}
                  </span>
                  <span className="text-white font-medium text-lg mt-1 line-clamp-1">
                    {"serviceName" in item ? item.serviceName : item.description}
                  </span>
                  {"clientName" in item && (
                    <span className="text-xs text-gray-500 mt-0.5">{item.clientName}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                   <span className={cn(
                      "font-bold text-lg",
                      isIncome ? "text-green-400" : "text-red-400"
                    )}>
                      {isIncome ? "+" : "-"} 
                      {formatCurrency(isIncome ? item.finalPrice ?? item.totalPrice : item.amount)}
                   </span>
                   <Badge 
                      variant={isIncome ? "outline" : "destructive"} 
                      className={cn("mt-1 text-[10px] h-5 px-2", isIncome && "border-green-500/50 text-green-500")}
                    >
                      {isIncome ? "Receita" : "Despesa"}
                   </Badge>
                </div>
              </div>

              {/* Ações Mobile (Apenas para Despesas) */}
              {isExpense && (
                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-gray-700/50">
                   <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-gray-400 hover:text-primary hover:bg-primary/10 text-xs"
                      onClick={() => onEditExpense(item as Expense)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-gray-400 hover:text-destructive hover:bg-destructive/10 text-xs"
                      onClick={() => onDeleteExpense(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                    </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- VISÃO DESKTOP (Tabela) --- */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-900 text-gray-400 font-medium border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/30">
            {transactions.map((item) => {
              const isIncome = "totalPrice" in item;
              const date = normalizeTimestamp("date" in item ? item.date : item.startTime);

              return (
                <tr key={item.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                    {format(date, "dd/MM/yyyy")}
                  </td>
                  <td className="px-6 py-4 text-gray-200">
                    {"serviceName" in item ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{item.serviceName}</span>
                        <span className="text-xs text-gray-500">{item.clientName}</span>
                      </div>
                    ) : (
                      <span className="font-medium">{item.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={isIncome ? "success" : "destructive"}
                      className="font-normal"
                    >
                      {isIncome ? "Receita" : "Despesa"}
                    </Badge>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    isIncome ? "text-green-500" : "text-red-500"
                  )}>
                    {isIncome ? "+" : "-"} 
                    {formatCurrency(isIncome ? item.finalPrice ?? item.totalPrice : item.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!isIncome && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-primary"
                          onClick={() => onEditExpense(item as Expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-destructive"
                          onClick={() => onDeleteExpense(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Componente Principal ---

export const FinancialManagement = () => {
  const { user } = useAuthStore();
  const {
    financialData,
    isLoading: loading,
    error,
    fetchFinancialData,
    currentDate,
    setCurrentDate,
    removeExpense,
  } = useFinanceStore();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) fetchFinancialData(user.uid, currentDate);
  }, [user?.uid, currentDate, fetchFinancialData]);

  const handleOpenEditModal = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const executeDeleteExpense = async () => {
    if (expenseIdToDelete) {
      await removeExpense(expenseIdToDelete);
      setExpenseIdToDelete(null);
    }
  };

  const allTransactions = useMemo(() => {
    if (!financialData) return [];
    const combined = [
      ...(financialData.appointments || []),
      ...(financialData.expenses || []),
    ];
    return combined.sort(
      (a, b) =>
        normalizeTimestamp("date" in b ? b.date : b.startTime).getTime() -
        normalizeTimestamp("date" in a ? a.date : a.startTime).getTime()
    );
  }, [financialData]);

  const handleExportCSV = () => {
    if (!allTransactions || allTransactions.length === 0) {
      alert("Nenhuma transação para exportar.");
      return;
    }
    const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
    const filename = `relatorio_${start}_a_${end}.csv`;
    exportTransactionsToCsv(filename, allTransactions);
  };

  const barChartData = useMemo(() => {
    if (!financialData) return [];
    const dailyData: Record<string, { revenue: number; expenses: number }> = {};

    financialData.appointments.forEach((appt) => {
      const dateSource = appt.completedAt || appt.startTime;
      const day = format(normalizeTimestamp(dateSource), "yyyy-MM-dd");
      if (!dailyData[day]) dailyData[day] = { revenue: 0, expenses: 0 };
      dailyData[day].revenue += appt.finalPrice ?? appt.totalPrice;
    });

    financialData.expenses.forEach((exp) => {
      const day = format(normalizeTimestamp(exp.date), "yyyy-MM-dd");
      if (!dailyData[day]) dailyData[day] = { revenue: 0, expenses: 0 };
      dailyData[day].expenses += exp.amount;
    });

    return Object.entries(dailyData)
      .map(([date, values]) => ({
        date: format(new Date(date), "dd/MM"),
        Receita: values.revenue,
        Despesa: values.expenses,
      }))
      .sort((a, b) => {
         const [dayA, monthA] = a.date.split("/");
         const [dayB, monthB] = b.date.split("/");
         return `${monthA}-${dayA}`.localeCompare(`${monthB}-${dayB}`);
      });
  }, [financialData]);

  const pieChartData = useMemo(() => {
    if (!financialData?.expenses || financialData.expenses.length === 0) return [];
    const categoryTotals = financialData.expenses.reduce((acc, expense) => {
      const category = expense.category || "Outros";
      if (!acc[category]) acc[category] = 0;
      acc[category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [financialData?.expenses]);

  const PIE_CHART_COLORS = ["#DAA520", "#B8860B", "#F59E0B", "#D97706", "#92400E", "#78350F"];

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center justify-center gap-3">
            <AlertCircle size={24} />
            <p>Erro ao carregar dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-10 px-0 sm:px-2"> 
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Visão geral do desempenho do seu negócio.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-[240px] justify-start text-left font-normal bg-gray-900 border-gray-700 hover:bg-gray-800 h-12 text-base"
            >
              <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800" align="end">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* --- KPI CARDS (Stack no Mobile) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Receita"
          value={formatCurrency(financialData?.totalRevenue || 0)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(financialData?.totalExpenses || 0)}
          icon={ArrowDown}
          variant="danger"
        />
        <StatCard
          title="Lucro"
          value={formatCurrency(financialData?.netIncome || 0)}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* --- GRÁFICOS (Stack no Mobile, 2 cols no Desktop) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent className="h-72 sm:h-80 w-full pl-0">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" tickLine={false} axisLine={false} dy={10} tick={{fontSize: 12}} />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => `R$${v}`} tickLine={false} axisLine={false} dx={-5} tick={{fontSize: 12}} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", color: "#F3F4F6", fontSize: '14px' }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: "#1F2937" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: '12px' }} />
                  <Bar dataKey="Receita" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Sem dados para este período.</div>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Categorias</CardTitle>
          </CardHeader>
          <CardContent className="h-72 sm:h-80">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: '14px' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px'}} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Nenhuma despesa.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- RANKINGS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRanking
          title="Serviços Rentáveis"
          icon={ClipboardList}
          data={financialData?.topServices || []}
        />
        <PerformanceRanking
          title="Top Profissionais"
          icon={Users}
          data={financialData?.topProfessionals || []}
        />
      </div>

      {/* --- EXTRATO DETALHADO --- */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-bold text-white">Extrato</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-gray-700 text-gray-300 hover:text-white w-full sm:w-auto h-10"
              >
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="gap-2 bg-primary text-black hover:bg-primary/90 w-full sm:w-auto h-10 font-bold"
              >
                <PlusCircle size={16} /> Nova Despesa
              </Button>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          {allTransactions.length > 0 ? (
            <FinancialTransactionsList
              transactions={allTransactions}
              onEditExpense={handleOpenEditModal}
              onDeleteExpense={setExpenseIdToDelete}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">
              Nenhuma movimentação neste mês.
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAIS --- */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <ConfirmationModal
        isOpen={!!expenseIdToDelete}
        onClose={() => setExpenseIdToDelete(null)}
        onConfirm={executeDeleteExpense}
        title="Excluir Despesa"
        message="Tem certeza? O valor será removido dos cálculos."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
};