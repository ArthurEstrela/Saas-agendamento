import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Professional, Service, ServiceProviderProfile } from '../../types';
import { X, Save, Loader2 } from 'lucide-react';
import { useProfessionalsManagementStore } from '../../store/professionalsManagementStore';
import { useProfileStore } from '../../store/profileStore';

const professionalSchema = z.object({
  name: z.string().min(3, { message: "Nome do profissional é obrigatório." }),
  serviceIds: z.array(z.string()).min(1, { message: "Selecione pelo menos um serviço." }),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalModalProps {
  professional?: Professional | null;
  onClose: () => void;
}

export const ProfessionalModal = ({ professional, onClose }: ProfessionalModalProps) => {
  const { addProfessional, updateProfessional } = useProfessionalsManagementStore();
  const { userProfile } = useProfileStore();
  const providerServices = (userProfile as ServiceProviderProfile)?.services || [];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
        name: professional?.name || '',
        serviceIds: professional?.services.map(s => s.id) || [],
    },
  });

  const onSubmit: SubmitHandler<ProfessionalFormData> = async (data) => {
    if (!userProfile?.id) return;
    
    // Converte os IDs de serviço de volta para objetos de serviço completos
    const selectedServices: Service[] = data.serviceIds.map(id => 
        providerServices.find(s => s.id === id)
    ).filter((s): s is Service => s !== undefined);

    const professionalData = {
        name: data.name,
        services: selectedServices,
        // A disponibilidade será gerenciada em outra tela
        availability: professional?.availability || [], 
    };

    if (professional) {
        await updateProfessional(userProfile.id, { ...professional, ...professionalData });
    } else {
        await addProfessional(userProfile.id, professionalData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg animate-fade-in-down border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{professional ? 'Editar Profissional' : 'Novo Profissional'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Profissional</label>
            <input {...register('name')} id="name" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Serviços Realizados</label>
            <div className="bg-gray-900 p-3 rounded-md border border-gray-700 max-h-40 overflow-y-auto space-y-2">
                {providerServices.map(service => (
                    <label key={service.id} className="flex items-center gap-3 text-white">
                        <input type="checkbox" {...register('serviceIds')} value={service.id} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-[#daa520] focus:ring-[#daa520]" />
                        <span>{service.name}</span>
                    </label>
                ))}
            </div>
            {errors.serviceIds && <p className="text-red-400 text-sm mt-1">{errors.serviceIds.message}</p>}
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