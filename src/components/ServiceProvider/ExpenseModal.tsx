import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Tag, Calendar, Repeat, X, Save } from "lucide-react";
import type { Expense } from "../../types";
import { Button } from "../ui/button";
import { Timestamp } from "firebase/firestore";

const expenseSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  category: z.string().min(1, "A categoria é obrigatória."),
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(["one-time", "recurring"]),
  frequency: z.enum(["monthly"]).optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const expenseCategories = [
  "Aluguel",
  "Marketing",
  "Produtos e Estoque",
  "Salários e Comissões",
  "Contas (Água, Luz, etc.)",
  "Impostos",
  "Manutenção",
  "Outros",
];

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, "id">, id?: string) => void;
  expenseToEdit?: Expense | null;
}

const ExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}: ExpenseModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: "one-time",
    },
  });

  const expenseType = watch("type");

  useEffect(() => {
    if (expenseToEdit) {
      const date =
        expenseToEdit.date instanceof Timestamp
          ? expenseToEdit.date.toDate()
          : (expenseToEdit.date as Date);
      reset({ ...expenseToEdit, date });
    } else {
      reset({
        description: "",
        amount: 0,
        category: "",
        date: new Date(),
        type: "one-time",
      });
    }
  }, [expenseToEdit, isOpen, reset]);

  const onSubmit = (data: ExpenseFormData) => {
    const expenseData: Omit<Expense, "id"> = {
      ...data,
      date: Timestamp.fromDate(data.date),
    };
    if (data.type !== "recurring") {
      delete expenseData.frequency;
    } else {
      expenseData.frequency = "monthly"; // Hardcoded por enquanto
    }
    onSave(expenseData, expenseToEdit?.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {expenseToEdit ? "Editar Despesa" : "Adicionar Despesa"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Description */}
              <div className="relative">
                <input
                  {...register("description")}
                  placeholder="Ex: Aluguel do espaço"
                  className="input-field pl-10"
                />
                <Tag className="input-icon" />
                {errors.description && (
                  <p className="error-message">{errors.description.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="relative">
                <input
                  {...register("amount")}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="input-field pl-10"
                />
                <DollarSign className="input-icon" />
                {errors.amount && (
                  <p className="error-message">{errors.amount.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="relative">
                <select {...register("category")} className="input-field pl-10">
                  <option value="">Selecione uma categoria</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Tag className="input-icon" />
                {errors.category && (
                  <p className="error-message">{errors.category.message}</p>
                )}
              </div>

              {/* Date */}
              <div className="relative">
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className="input-field pl-10"
                    />
                  )}
                />
                <Calendar className="input-icon" />
                {errors.date && (
                  <p className="error-message">{errors.date.message}</p>
                )}
              </div>

              {/* Type */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="one-time"
                    {...register("type")}
                    className="form-radio"
                  />
                  <span className="text-white">Puntual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="recurring"
                    {...register("type")}
                    className="form-radio"
                  />
                  <span className="text-white">Recorrente</span>
                </label>
              </div>

              {/* Frequency (Conditional) */}
              {expenseType === "recurring" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="relative">
                    <select
                      {...register("frequency")}
                      className="input-field pl-10"
                    >
                      <option value="monthly">Mensal</option>
                    </select>
                    <Repeat className="input-icon" />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Salvar Despesa"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpenseModal;
