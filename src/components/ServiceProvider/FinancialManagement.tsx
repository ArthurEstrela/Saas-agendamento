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
import { subDays, format } from "date-fns";
import ExpenseModal from "./ExpenseModal";
import type { Appointment, Expense } from "../../types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Timestamp } from "firebase/firestore";
import { updateExpense, deleteExpense } from "../../firebase/expenseService";
import { ConfirmationModal } from "../Common/ConfirmationModal";
import { exportTransactionsToCsv } from "../../lib/utils/exportToCsv";
import { PerformanceRanking } from "./PerformanceRanking";

// --- Funções Utilitárias e Componentes Internos ---
const normalizeTimestamp = (dateValue: unknown): Date => {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  return new Date(dateValue as string | number | Date);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Cartão de Estatística
const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 flex flex-col justify-between"
  >
    <div className="flex items-center justify-between text-gray-400">
      <span className="text-sm font-medium">{title}</span>
      <Icon className="w-6 h-6" />
    </div>
    <div className="mt-4">
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
  </motion.div>
);

// Tabela de Transações
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800/60">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Data
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Descrição
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800/30 divide-y divide-gray-700/50">
          {transactions.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                {format(
                  normalizeTimestamp(
                    "date" in item ? item.date : item.startTime
                  ),
                  "dd/MM/yyyy"
                )}
              </td>
              <td className="px-6 py-4 text-sm text-white">
                {"serviceName" in item
                  ? `Serviço: ${item.serviceName} (${item.clientName})` // Adicionado nome do cliente para clareza
                  : item.description}
              </td>
              <td className="px-6 py-4 text-sm">
                {"totalPrice" in item ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-900 text-emerald-300">
                    Receita
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-300">
                    Despesa
                  </span>
                )}
              </td>
              <td
                className={`px-6 py-4 text-sm text-right font-medium ${
                  "totalPrice" in item ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {"totalPrice" in item
                  ? `+ ${formatCurrency(item.totalPrice)}`
                  : `- ${formatCurrency(item.amount)}`}
              </td>
              <td className="px-6 py-4 text-right">
                {"amount" in item && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      // Casting necessário para Expense, garantido pela checagem "amount" in item
                      onClick={() => onEditExpense(item as Expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteExpense(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Container de Gráfico
const ChartContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="h-80">{children}</div>
  </div>
);

// --- Componente Principal ---

export const FinancialManagement = () => {
  // 1. Extração robusta do estado (Seletores Individuais)
  const user = useAuthStore((state) => state.user);

  const financialData = useFinanceStore((state) => state.financialData);
  const loading = useFinanceStore((state) => state.loading);
  const error = useFinanceStore((state) => state.error);
  const fetchFinancialData = useFinanceStore(
    (state) => state.fetchFinancialData
  );
  const addExpense = useFinanceStore((state) => state.addExpense);

  // 2. Estado de Período e Modais
  const [startDate, setStartDate] = useState<Date | undefined>(
    subDays(new Date(), 29)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState<string | null>(
    null
  );

  // 3. Efeito para buscar dados sempre que o período ou o usuário mudar
  useEffect(() => {
    if (user?.uid && startDate && endDate) {
      fetchFinancialData(user.uid, startDate, endDate);
    }
  }, [user?.uid, startDate, endDate, fetchFinancialData]);

  const handleOpenEditModal = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (data: Omit<Expense, "id">, id?: string) => {
    if (!user?.uid || !startDate || !endDate) return;
    if (id) {
      await updateExpense(user.uid, id, data);
    } else {
      await addExpense(user.uid, data);
    }
    // Recarrega os dados após salvar/atualizar
    fetchFinancialData(user.uid, startDate, endDate);
    setIsExpenseModalOpen(false);
    setExpenseToEdit(null);
  };

  const executeDeleteExpense = async () => {
    if (user?.uid && expenseIdToDelete && startDate && endDate) {
      await deleteExpense(user.uid, expenseIdToDelete);
      fetchFinancialData(user.uid, startDate, endDate);
      setExpenseIdToDelete(null);
    }
  };

  const handleExportCSV = () => {
    // Melhoria de UX: Usar a Toast/Modal de confirmação, mas mantendo o alert por falta do contexto Toast aqui
    if (
      !allTransactions ||
      allTransactions.length === 0 ||
      !startDate ||
      !endDate
    ) {
      // Usar console.error ou uma modal customizada aqui seria melhor, mas mantemos o alert por limitação
      alert("Nenhuma transação para exportar no período selecionado.");
      return;
    }

    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    const filename = `relatorio_financeiro_${start}_a_${end}.csv`;

    exportTransactionsToCsv(filename, allTransactions);
  };

  // 4. Memoização das transações combinadas
  const allTransactions = useMemo(() => {
    if (!financialData) return [];
    const combined = [
      ...(financialData.appointments || []),
      ...(financialData.expenses || []),
    ];
    // Ordena por data (mais recente primeiro)
    return combined.sort(
      (a, b) =>
        normalizeTimestamp("date" in b ? b.date : b.startTime).getTime() -
        normalizeTimestamp("date" in a ? a.date : a.startTime).getTime()
    );
  }, [financialData]);

  // 5. Memoização dos dados do gráfico de barras (Receita vs Despesa)
  const barChartData = useMemo(() => {
    if (!financialData) return [];
    const dailyData: Record<string, { revenue: number; expenses: number }> = {};
    financialData.appointments.forEach((appt) => {
      const dateSource = appt.completedAt || appt.startTime;
      const date = normalizeTimestamp(dateSource);
      const day = format(date, "yyyy-MM-dd");
      if (!dailyData[day]) dailyData[day] = { revenue: 0, expenses: 0 };
      dailyData[day].revenue += appt.totalPrice;
    });
    financialData.expenses.forEach((exp) => {
      const date = normalizeTimestamp(exp.date);
      const day = format(date, "yyyy-MM-dd");
      if (!dailyData[day]) dailyData[day] = { revenue: 0, expenses: 0 };
      dailyData[day].expenses += exp.amount;
    });
    return Object.entries(dailyData)
      .map(([date, values]) => ({
        date: format(new Date(date), "dd/MM"),
        Receita: values.revenue,
        Despesa: values.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Ordena por data (string)
  }, [financialData]);

  // 6. Memoização dos dados do gráfico de pizza (Despesas por Categoria)
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
    "#FFC107", // Amarelo
    "#FF8F00", // Laranja Claro
    "#FF6F00", // Laranja
    "#F57C00", // Laranja Escuro
    "#EF6C00",
    "#E65100",
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-amber-500" size={48} />
        <p className="ml-4 text-gray-400">Carregando dados financeiros...</p>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center">
        <AlertCircle className="mr-3" />
        <p>Erro ao carregar dados: {error}</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Financeiro</h1>
          <p className="text-gray-400 mt-1">
            Acompanhe a saúde financeira do seu negócio.
          </p>
        </div>

        {/* Seletor de data */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Popover/Calendar Trigger (Start Date) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[140px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yy") : <span>De</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={endDate ? { after: endDate } : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-gray-400 hidden sm:block">até</span>
          {/* Popover/Calendar Trigger (End Date) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[140px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yy") : <span>Até</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={endDate ? { after: endDate } : undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Receita Bruta"
          value={formatCurrency(financialData?.totalRevenue || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(financialData?.totalExpenses || 0)}
          icon={ArrowDown}
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(financialData?.netIncome || 0)}
          icon={DollarSign}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4">
          Análise de Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceRanking
            title="Serviços Mais Rentáveis"
            icon={ClipboardList}
            data={financialData?.topServices || []}
          />
          <PerformanceRanking
            title="Profissionais com Maior Rendimento"
            icon={Users}
            data={financialData?.topProfessionals || []}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Receitas vs. Despesas">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="date" stroke="#A0AEC0" />
                <YAxis
                  stroke="#A0AEC0"
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A202C",
                    borderColor: "#4A5568",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar
                  dataKey="Receita"
                  fill="#48BB78"
                  name="Receita"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Despesa"
                  fill="#F56565"
                  name="Despesa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Sem dados para exibir o gráfico.
            </div>
          )}
        </ChartContainer>
        <ChartContainer title="Despesas por Categoria">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhuma despesa registrada no período.
            </div>
          )}
        </ChartContainer>
      </section>

      <section className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-white">
            Extrato Financeiro
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          </div>
        </div>
        {allTransactions.length > 0 ? (
          <FinancialTransactionsTable
            transactions={allTransactions}
            onEditExpense={handleOpenEditModal}
            onDeleteExpense={setExpenseIdToDelete}
          />
        ) : (
          <div className="text-center py-12 text-gray-500">
            Nenhuma transação encontrada para este período.
          </div>
        )}
      </section>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />
      <ConfirmationModal
        isOpen={!!expenseIdToDelete}
        onClose={() => setExpenseIdToDelete(null)}
        onConfirm={executeDeleteExpense}
        title="Confirmar Exclusão"
        message="Você tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
      />
    </motion.div>
  );
};
