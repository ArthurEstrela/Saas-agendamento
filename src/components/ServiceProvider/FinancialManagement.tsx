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
    >
      <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
            <div
              className={cn("p-3 rounded-xl border", variantStyles[variant])}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FinancialTransactionsTable = ({
  transactions,
  onEditExpense,
  onDeleteExpense,
}: {
  transactions: (Appointment | Expense)[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
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
            const date = normalizeTimestamp(
              "date" in item ? item.date : item.startTime
            );

            return (
              <tr
                key={item.id}
                className="hover:bg-gray-800/50 transition-colors group"
              >
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                  {format(date, "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4 text-gray-200">
                  {"serviceName" in item ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.serviceName}</span>
                      <span className="text-xs text-gray-500">
                        {item.clientName}
                      </span>
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
                <td
                  className={cn(
                    "px-6 py-4 text-right font-bold",
                    isIncome ? "text-green-500" : "text-red-500"
                  )}
                >
                  {isIncome ? "+" : "-"}{" "}
                  {formatCurrency(
                    isIncome ? item.finalPrice ?? item.totalPrice : item.amount
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {!isIncome && (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEditExpense(item as Expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteExpense(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {isIncome && <div className="h-8" />}{" "}
                  {/* Espaçador para manter altura */}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(
    null
  );

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

  const handleExportCSV = () => {
    if (!allTransactions || allTransactions.length === 0) {
      alert("Nenhuma transação para exportar no período selecionado.");
      return;
    }
    const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
    const filename = `relatorio_financeiro_${start}_a_${end}.csv`;
    exportTransactionsToCsv(filename, allTransactions);
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
    if (!financialData?.expenses || financialData.expenses.length === 0)
      return [];
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

  const PIE_CHART_COLORS = [
    "#DAA520",
    "#B8860B",
    "#F59E0B",
    "#D97706",
    "#92400E",
    "#78350F",
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl flex items-center justify-center gap-3">
        <AlertCircle size={24} />
        <p>Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header e Filtro de Data */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Financeiro</h1>
          <p className="text-gray-400 mt-1">
            Visão geral do desempenho do seu negócio.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-[240px] justify-start text-left font-normal bg-gray-900 border-gray-700 hover:bg-gray-800"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800">
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

      {/* Cards de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Receita Bruta"
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
          title="Lucro Líquido"
          value={formatCurrency(financialData?.netIncome || 0)}
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tickFormatter={(v) => `R$${v}`}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#374151",
                      borderRadius: "8px",
                      color: "#F3F4F6",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: "#1F2937" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="Receita"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="Despesa"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sem dados para exibir.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
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
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Nenhuma despesa registrada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceRanking
          title="Serviços Mais Rentáveis"
          icon={ClipboardList}
          data={financialData?.topServices || []}
        />
        <PerformanceRanking
          title="Profissionais em Destaque"
          icon={Users}
          data={financialData?.topProfessionals || []}
        />
      </div>

      {/* Extrato */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            Extrato Detalhado
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-gray-700 text-gray-300 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              className="gap-2 bg-primary text-black hover:bg-primary/90"
            >
              <PlusCircle size={16} /> Nova Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allTransactions.length > 0 ? (
            <FinancialTransactionsTable
              transactions={allTransactions}
              onEditExpense={handleOpenEditModal}
              onDeleteExpense={setExpenseIdToDelete}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Nenhuma transação neste período.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
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
        message="Tem certeza que deseja excluir esta despesa? O valor será removido dos cálculos."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
};
