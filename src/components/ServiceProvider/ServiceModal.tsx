import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Service } from '../../types';
import { Loader2, X, Scissors, AlignLeft, Clock, DollarSign } from 'lucide-react';

// Schema de validação
const serviceSchema = z.object({
  name: z.string().min(3, 'O nome do serviço é obrigatório'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  duration: z.number().min(5, 'A duração mínima é de 5 minutos'),
  price: z.number().min(0, 'O preço não pode ser negativo'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
  service?: Service | null;
  isLoading: boolean;
}

export const ServiceModal = ({ isOpen, onClose, onSave, service, isLoading }: ServiceModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    if (service) {
      reset(service);
    } else {
      reset({ name: '', description: '', duration: 30, price: 0 });
    }
  }, [service, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700 m-4">
        <form onSubmit={handleSubmit(onSave)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{service ? 'Editar Serviço' : 'Adicionar Serviço'}</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
          </div>

          <div className="space-y-4">
            {/* Nome do Serviço */}
            <div>
                <label className="label-text">Nome do Serviço</label>
                <div className="input-container">
                    <Scissors className="input-icon" />
                    <input {...register('name')} placeholder="Ex: Corte Masculino" className="input-field pl-10" />
                </div>
                {errors.name && <p className="error-message">{errors.name.message}</p>}
            </div>

            {/* Descrição */}
            <div>
                <label className="label-text">Descrição</label>
                <div className="input-container">
                    <AlignLeft className="input-icon" />
                    <textarea {...register('description')} placeholder="Descreva o que está incluso no serviço..." className="input-field pl-10 h-24 resize-none" />
                </div>
                {errors.description && <p className="error-message">{errors.description.message}</p>}
            </div>

            {/* Duração e Preço */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-text">Duração (minutos)</label>
                    <div className="input-container">
                        <Clock className="input-icon" />
                        <input {...register('duration', { valueAsNumber: true })} type="number" className="input-field pl-10" />
                    </div>
                    {errors.duration && <p className="error-message">{errors.duration.message}</p>}
                </div>
                <div>
                    <label className="label-text">Preço (R$)</label>
                    <div className="input-container">
                        <DollarSign className="input-icon" />
                        <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" className="input-field pl-10" />
                    </div>
                    {errors.price && <p className="error-message">{errors.price.message}</p>}
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