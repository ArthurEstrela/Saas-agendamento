import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Expense } from '../../types';
import { Loader2, X, DollarSign, Edit2, Tag } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(3, 'A descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  category: z.string().min(3, 'A categoria é obrigatória'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'date'>) => void;
  isLoading: boolean;
}

export const ExpenseModal = ({ isOpen, onClose, onSave, isLoading }: ExpenseModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ description: '', amount: 0, category: '' });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700 m-4">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Adicionar Despesa</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
          </div>

          <div className="space-y-4">
            <div>
                <label className="label-text">Descrição</label>
                <div className="input-container">
                    <Edit2 className="input-icon" />
                    <input {...register('description')} placeholder="Ex: Compra de produtos" className="input-field pl-10" />
                </div>
                {errors.description && <p className="error-message">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-text">Valor (R$)</label>
                    <div className="input-container">
                        <DollarSign className="input-icon" />
                        <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" className="input-field pl-10" />
                    </div>
                    {errors.amount && <p className="error-message">{errors.amount.message}</p>}
                </div>
                 <div>
                    <label className="label-text">Categoria</label>
                    <div className="input-container">
                        <Tag className="input-icon" />
                        <input {...register('category')} placeholder="Ex: Produtos" className="input-field pl-10" />
                    </div>
                    {errors.category && <p className="error-message">{errors.category.message}</p>}
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="secondary-button">Cancelar</button>
            <button type="submit" disabled={isLoading} className="primary-button w-36 flex justify-center">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};