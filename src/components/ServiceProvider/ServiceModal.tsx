import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Service } from '../../types';
import { X, Save, Loader2 } from 'lucide-react';
import { useServiceManagementStore } from '../../store/serviceManagementStore';
import { useProfileStore } from '../../store/profileStore';

// Esquema de validação com os tipos corretos
const serviceSchema = z.object({
  name: z.string().min(3, { message: "Nome do serviço é obrigatório." }),
  description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
  duration: z.coerce.number().int().min(5, { message: "A duração mínima é de 5 minutos." }),
  price: z.coerce.number().min(0.01, { message: "O preço deve ser maior que zero." }),
});

// O tipo para os dados do formulário
type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceModalProps {
  service?: Service | null;
  onClose: () => void;
}

export const ServiceModal = ({ service, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useServiceManagementStore();
  const { userProfile } = useProfileStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service || { name: '', description: '', duration: 30, price: 50 },
  });

  const onSubmit: SubmitHandler<ServiceFormData> = async (data) => {
    if (!userProfile?.id) return;

    if (service?.id) { // Editando um serviço existente
      await updateService(userProfile.id, service.id, data);
    } else { // Criando um novo serviço
      await addService(userProfile.id, data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg animate-fade-in-down border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{service ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
            <input {...register('name')} id="name" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea {...register('description')} id="description" rows={3} className="w-full bg-gray-900 p-3 rounded-md border border-gray-700"></textarea>
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duração (minutos)</label>
                <input {...register('duration')} id="duration" type="number" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration.message}</p>}
            </div>
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
                <input {...register('price')} id="price" type="number" step="0.01" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] flex items-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};