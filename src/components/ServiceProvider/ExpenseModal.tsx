// src/components/ServiceProvider/ExpenseModal.tsx

import { useEffect } from "react";
// 1. Importar 'Resolver' do react-hook-form para tipagem correta
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Tag, Calendar, Repeat, X, Save } from "lucide-react";
import type { Expense } from "../../types";
import { Button } from "../ui/button";
import { Timestamp } from "firebase/firestore";

import { useFinanceStore } from "../../store/financeStore";

const expenseSchema = z.object({
  description: z.string().min(3, "A descrição é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  category: z.string().min(1, "A categoria é obrigatória."),
  
  // 2. CORREÇÃO: Usar 'message' em vez de 'invalid_type_error'
  // Baseado no erro que você recebeu, sua versão do Zod aceita 'message' como erro genérico.
  date: z.date({ 
    message: "Formato de data inválido." 
  }),
  
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
  expenseToEdit?: Expense | null;
}

const ExpenseModal = ({
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
    // 3. CORREÇÃO: Cast para 'Resolver<ExpenseFormData>' em vez de 'any'
    // Isso satisfaz o TypeScript e a regra do ESLint.
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormData>,
    defaultValues: {
      type: "one-time",
      date: new Date(),
    },
  });

  const expenseType = watch("type");

  useEffect(() => {
    if (expenseToEdit) {
      const dateToEdit = (expenseToEdit.date instanceof Timestamp) 
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
  }, [expenseToEdit, isOpen, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    const expenseData: Omit<Expense, "id"> = {
      ...data,
      date: data.date,
    };
    
    if (data.type !== "recurring") {
      delete expenseData.frequency;
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
      console.error("Falha ao salvar despesa:", error);
    }
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
                        field.value instanceof Date && !isNaN(field.value.getTime())
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                           const [year, month, day] = e.target.value.split('-').map(Number);
                           field.onChange(new Date(year, month - 1, day));
                        } else {
                           field.onChange(null);
                        }
                      }}
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
                  <span className="text-white">Pontual</span>
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

              {/* Frequency */}
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