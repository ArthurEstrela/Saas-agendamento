import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DollarSign, Tag, Calendar, Repeat, Save, Loader2 } from "lucide-react";
import type { Expense } from "../../types";
import { Timestamp } from "firebase/firestore";
import { useFinanceStore } from "../../store/financeStore";

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

const expenseSchema = z.object({
  description: z.string().min(3, "Descrição obrigatória."),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero."),
  category: z.string().min(1, "Categoria obrigatória."),
  date: z.date({ message: "Data inválida." }),
  type: z.enum(["one-time", "recurring"]),
  frequency: z.enum(["monthly"]).optional(),
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
  const { addNewExpense, editExpense } = useFinanceStore();

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
        const dateToEdit =
          expenseToEdit.date instanceof Timestamp
            ? expenseToEdit.date.toDate()
            : expenseToEdit.date;
        reset({ ...expenseToEdit, date: dateToEdit as Date });
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
    // ✨ CORREÇÃO AQUI: Tipamos corretamente ignorando o 'providerId', pois a store injeta ele.
    const expenseData: Omit<Expense, "id" | "providerId"> = { ...data, date: data.date };
    
    if (data.type !== "recurring") {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
       delete (expenseData as any).frequency; 
    } else {
       expenseData.frequency = "monthly";
    }

    try {
      if (expenseToEdit?.id) {
        await editExpense(expenseToEdit.id, expenseData);
      } else {
        await addNewExpense(expenseData);
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
                className="pl-9"
                error={errors.description?.message}
              />
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
                  className="pl-9"
                  error={errors.amount?.message}
                />
              </div>
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
                      className="pl-9 block w-full"
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
                  <SelectTrigger className="w-full bg-gray-950 border-gray-700">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
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
              <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-3 rounded-lg border border-gray-700 flex-1 hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  value="one-time"
                  {...register("type")}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Pontual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-800 p-3 rounded-lg border border-gray-700 flex-1 hover:border-primary/50 transition-colors">
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
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="expense-form" disabled={isSubmitting}>
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