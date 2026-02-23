import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, Tag, Calendar, Repeat, Save, Loader2 } from "lucide-react";
import type { Expense } from "../../types";
// ✨ REMOVIDO: import { Timestamp } from "firebase/firestore";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// --- Funções Utilitárias ---
// ✨ Tratamento seguro de strings ISO para objeto Date nativo
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  return new Date(dateValue as string | number);
};

const expenseSchema = z.object({
  description: z.string().min(3, "Descrição obrigatória."),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero."),
  category: z.string().min(1, "Categoria obrigatória."),
  date: z.date({ message: "Data inválida." }),
  type: z.enum(["one-time", "recurring", "ONE_TIME", "RECURRING"]),
  frequency: z.enum(["monthly", "MONTHLY"]).optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const expenseCategories = [
  "Aluguel",
  "Marketing",
  "Produtos/Estoque",
  "Salários",
  "Contas (Luz/Água)",
  "Impostos",
  "Manutenção",
  "Outros",
];

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseModal = ({
  isOpen,
  onClose,
  expenseToEdit,
}: ExpenseModalProps) => {
  const { addExpense } = useFinanceStore(); // ✨ Atualizado para addExpense do store
  const { user } = useAuthStore(); // ✨ Trazendo o Provider ID do Auth

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormData>,
    defaultValues: { type: "one-time", date: new Date() },
  });

  const expenseType = watch("type");

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        // Usa o normalizador nativo sem o Firebase Timestamp
        const dateToEdit = normalizeDate(expenseToEdit.date);
        
        // ✨ Normaliza o enum que vem da API Java (UpperCase) para o React Hook Form (LowerCase)
        const typeNormalized = (expenseToEdit.type || "ONE_TIME").toLowerCase() as "one-time" | "recurring";
        const freqNormalized = expenseToEdit.frequency ? expenseToEdit.frequency.toLowerCase() as "monthly" : undefined;

        reset({ 
            ...expenseToEdit, 
            date: dateToEdit,
            type: typeNormalized,
            frequency: freqNormalized
        });
      } else {
        reset({
          description: "",
          amount: 0,
          category: "",
          date: new Date(),
          type: "one-time",
        });
      }
    }
  }, [expenseToEdit, isOpen, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.id) {
        console.error("Usuário não autenticado");
        return;
    }

    // ✨ Prepara o payload convertendo a Data para ISO String conforme pede a API Java
    const expenseData: Omit<Expense, "id" | "providerId"> = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date.toISOString(), // Envia como String ISO
        type: data.type === "one-time" ? "ONE_TIME" : "RECURRING", // Envia Maiúsculo para o Java
        frequency: data.type === "recurring" ? "MONTHLY" : undefined
    };

    try {
      if (expenseToEdit?.id) {
        // ✨ NOTA: Na sua definition do financeStore você não tem a action editExpense.
        // Se a API tiver PUT, implemente-o lá. Por enquanto, loga um erro seguro.
        console.error("Endpoint de edição de despesa não está mapeado no financeStore");
        // await editExpense(expenseToEdit.id, expenseData);
      } else {
        await addExpense(user.id, expenseData); // Passando o providerId corretamente
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {expenseToEdit ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="expense-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 py-2"
        >
          <div className="space-y-2">
            <Label>Descrição</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                {...register("description")}
                placeholder="Ex: Aluguel"
                className="pl-9 bg-gray-950 border-gray-800 focus:ring-primary text-white"
              />
              {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  {...register("amount")}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9 bg-gray-950 border-gray-800 focus:ring-primary text-white"
                />
              </div>
              {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 z-10" />
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <Input
                      type="date"
                      className="pl-9 block w-full bg-gray-950 border-gray-800 focus:ring-primary text-white scheme-dark"
                      value={
                        field.value instanceof Date &&
                        !isNaN(field.value.getTime())
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value
                            .split("-")
                            .map(Number);
                          field.onChange(new Date(y, m - 1, d));
                        }
                      }}
                    />
                  )}
                />
              </div>
              {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger className="w-full bg-gray-950 border-gray-800 text-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    {expenseCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Despesa</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-950 p-3 rounded-lg border border-gray-800 flex-1 hover:border-primary/50 transition-colors text-white">
                <input
                  type="radio"
                  value="one-time"
                  {...register("type")}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Pontual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-950 p-3 rounded-lg border border-gray-800 flex-1 hover:border-primary/50 transition-colors text-white">
                <input
                  type="radio"
                  value="recurring"
                  {...register("type")}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Recorrente</span>
              </label>
            </div>
          </div>

          {expenseType === "recurring" && (
            <div className="bg-primary/10 p-3 rounded-lg flex items-center gap-2 text-primary text-sm border border-primary/20 animate-fade-in">
              <Repeat size={16} /> Frequência definida automaticamente como{" "}
              <b>Mensal</b>.
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-white">
            Cancelar
          </Button>
          <Button type="submit" form="expense-form" disabled={isSubmitting} className="bg-primary text-black font-bold">
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;