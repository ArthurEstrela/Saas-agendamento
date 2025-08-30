import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { getServiceProviderAppointments } from "../../firebase/bookingService";
import {
  getExpenses,
  addExpense,
  deleteExpense,
} from "../../firebase/financeService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Trash2,
  X as IconX,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

// --- MODAL PARA ADICIONAR DESPESA (sem alterações) ---
const AddExpenseModal = ({ isOpen, onClose, onAdd }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) return;
    setIsLoading(true);
    await onAdd({ description, amount: parseFloat(amount) });
    setIsLoading(false);
    setDescription("");
    setAmount("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-[#daa520]/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white">Nova Despesa</h3>
          <button onClick={onClose}>
            <IconX className="text-gray-500 hover:text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (ex: Aluguel, Produtos)"
            required
            className="w-full bg-gray-800 p-3 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (R$)"
            min="0.01"
            step="0.01"
            required
            className="w-full bg-gray-800 p-3 rounded-md focus:ring-2 focus:ring-[#daa520] border border-gray-700"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#daa520] text-black rounded-lg font-semibold hover:bg-[#c8961e] flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const FinancialManagement = () => {
  const { userProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["providerAppointments", userProfile?.uid],
    queryFn: () => getServiceProviderAppointments(userProfile!.uid),
    enabled: !!userProfile,
  });
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["providerExpenses", userProfile?.uid],
    queryFn: () => getExpenses(userProfile!.uid),
    enabled: !!userProfile,
  });

  const addExpenseMutation = useMutation({
    // --- CORREÇÃO AQUI ---
    mutationFn: (newExpense: any) =>
      addExpense(userProfile!.uid, {
        ...newExpense,
        date: format(new Date(), "yyyy-MM-dd"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerExpenses"] });
      showToast("Despesa adicionada!", "success");
    },
    onError: () => showToast("Erro ao adicionar despesa.", "error"),
  });

  const deleteExpenseMutation = useMutation({
    // --- CORREÇÃO AQUI ---
    mutationFn: (expenseId: string) =>
      deleteExpense(userProfile!.uid, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerExpenses"] });
      showToast("Despesa removida.", "success");
    },
    onError: () => showToast("Erro ao remover despesa.", "error"),
  });

  // --- CORREÇÃO AQUI ---
  const financialData = useMemo(() => {
    // Garante que sempre teremos um array, mesmo que vazio, para evitar o erro.
    const validAppointments = appointments || [];
    const validExpenses = expenses || [];

    const completedAppointments = validAppointments.filter(
      (a) => a.status === "completed"
    );

    const totalRevenue = completedAppointments.reduce(
      (sum, app) => sum + app.price,
      0
    );
    const totalExpenses = validExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const netProfit = totalRevenue - totalExpenses;

    const monthlyData = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    }).map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthKey = format(monthStart, "MMM/yy", { locale: ptBR });

      const revenue = completedAppointments
        .filter(
          (a) => new Date(a.date) >= monthStart && new Date(a.date) <= monthEnd
        )
        .reduce((sum, app) => sum + app.price, 0);

      // Agora, esta linha usa `validExpenses`, que é um array seguro.
      const expense = validExpenses
        .filter(
          (e) => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
        )
        .reduce((sum, exp) => sum + exp.amount, 0);

      return { name: monthKey, Faturamento: revenue, Despesas: expense };
    });

    return { totalRevenue, totalExpenses, netProfit, monthlyData };
  }, [appointments, expenses]);

  if (isLoadingAppointments || isLoadingExpenses) {
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addExpenseMutation.mutateAsync}
      />

      <h1 className="text-4xl font-bold text-white">Painel Financeiro</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <TrendingUp size={18} /> Faturamento Total
          </h3>
          <p className="text-4xl font-bold text-white mt-2">
            R$ {financialData.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <TrendingDown size={18} /> Despesas Totais
          </h3>
          <p className="text-4xl font-bold text-white mt-2">
            R$ {financialData.totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-sm font-semibold text-[#daa520] flex items-center gap-2">
            <DollarSign size={18} /> Lucro Líquido
          </h3>
          <p className="text-4xl font-bold text-white mt-2">
            R$ {financialData.netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          Receita vs Despesas (Últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #4b5563",
              }}
              cursor={{ fill: "rgba(218, 165, 32, 0.1)" }}
            />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Bar dataKey="Faturamento" radius={[4, 4, 0, 0]}>
              {financialData.monthlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={"#22c55e"} />
              ))}
            </Bar>
            <Bar dataKey="Despesas" radius={[4, 4, 0, 0]}>
              {financialData.monthlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={"#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gerenciamento de Despesas */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Registro de Despesas</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#daa520] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#c8961e] transition-colors"
          >
            <PlusCircle size={18} /> Adicionar Despesa
          </button>
        </div>
        <div className="bg-gray-800 rounded-2xl border border-gray-700">
          <div className="max-h-96 overflow-y-auto">
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center p-4 border-b border-gray-700 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {expense.description}
                    </p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(expense.date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-red-400">
                      R$ {expense.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                      disabled={deleteExpenseMutation.isPending}
                      className="p-2 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 p-8">
                Nenhuma despesa registrada.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;
