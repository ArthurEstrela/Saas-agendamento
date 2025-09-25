import { useEffect, useMemo, useState } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useProfileStore } from "../../store/profileStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  ArrowDown,
  ArrowUp,
  PlusCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Expense } from "../../types";
import { ExpenseModal } from "./ExpenseModal";

// Card para exibir métricas principais (sem alterações)
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-${color}-500/20 text-${color}-400`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// -- Componente Principal do Financeiro --
export const FinancialManagement = () => {
  const { userProfile } = useProfileStore();
  const {
    financialData,
    isLoading,
    error,
    fetchFinancialData,
    removeExpense,
    addNewExpense,
  } = useFinanceStore();
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      fetchFinancialData(userProfile.id);
    }
  }, [userProfile, fetchFinancialData]);

  const handleSaveExpense = async (
    expenseData: Omit<Expense, "id" | "date">
  ) => {
    if (userProfile?.id) {
      await addNewExpense(userProfile.id, expenseData);
      setExpenseModalOpen(false);
    }
  };

  const chartData = useMemo(() => {
    if (!financialData?.monthlyRevenue) return [];
    return Object.entries(financialData.monthlyRevenue)
      .map(([month, revenue]) => ({ name: month, Faturamento: revenue }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [financialData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#daa520]" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-10 bg-red-500/10 rounded-lg">
        {error}
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center text-gray-500">
        Não há dados financeiros para exibir.
      </div>
    );
  }

  return (
    <div className="animate-fade-in-down">
      <h1 className="text-3xl font-bold text-white mb-8">Visão Financeira</h1>

      {/* Seção de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(financialData.totalRevenue)}
          icon={ArrowUp}
          color="green"
        />
        <StatCard
          title="Total de Despesas"
          value={formatCurrency(financialData.totalExpenses)}
          icon={ArrowDown}
          color="red"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(financialData.netIncome)}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Seção do Gráfico */}
      <div className="bg-gray-800/70 p-4 sm:p-6 rounded-xl border border-gray-700 mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          Faturamento Mensal
        </h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #4B5563",
                }}
                labelStyle={{ color: "#F9FAFB" }}
              />
              <Legend />
              <Bar dataKey="Faturamento" fill="#daa520" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seção de Despesas com Layout Responsivo */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">
            Registro de Despesas
          </h2>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors w-full sm:w-auto"
          >
            <PlusCircle size={20} /> Adicionar Despesa
          </button>
        </div>
        
        {/* Tabela para telas maiores */}
        <div className="hidden md:block bg-gray-800/70 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="p-4">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Data</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {financialData.expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-gray-700">
                  <td className="p-4">{expense.description}</td>
                  <td className="p-4 text-gray-400">{expense.category}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(expense.date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-4 text-right font-mono text-red-400">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        userProfile?.id &&
                        removeExpense(userProfile.id, expense.id)
                      }
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Lista de Cards para telas menores */}
        <div className="md:hidden space-y-4">
            {financialData.expenses.map((expense) => (
                 <div key={expense.id} className="bg-gray-800/70 p-4 rounded-xl border border-gray-700">
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="font-semibold text-white">{expense.description}</p>
                             <p className="text-sm text-gray-400">{expense.category}</p>
                         </div>
                         <button
                            onClick={() => userProfile?.id && removeExpense(userProfile.id, expense.id)}
                            className="text-gray-500 hover:text-red-400 p-1"
                         >
                             <Trash2 size={18} />
                         </button>
                     </div>
                     <div className="flex justify-between items-end mt-2">
                         <span className="text-xs text-gray-500">
                             {new Date(expense.date).toLocaleDateString("pt-BR")}
                         </span>
                         <span className="font-bold text-red-400 text-lg">
                             {formatCurrency(expense.amount)}
                         </span>
                     </div>
                 </div>
            ))}
        </div>

      </div>
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        isLoading={isLoading}
      />
    </div>
  );
};