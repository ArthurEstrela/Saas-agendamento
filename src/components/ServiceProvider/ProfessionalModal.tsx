import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Professional, Service, ServiceProviderProfile } from '../../types';
import { X, Save, Loader2, Camera } from 'lucide-react';
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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(professional?.photoURL || null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: professional?.name || '',
      serviceIds: professional?.services.map(s => s.id) || [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ProfessionalFormData> = async (data) => {
    if (!userProfile?.id) return;

    const selectedServices: Service[] = data.serviceIds
      .map(id => providerServices.find(s => s.id === id))
      .filter((s): s is Service => s !== undefined);

    const payload = {
      name: data.name,
      services: selectedServices,
      availability: professional?.availability || [],
      photoURL: professional?.photoURL || '',
      photoFile: photoFile,
    };

    if (professional) {
      await updateProfessional(userProfile.id, professional.id, payload);
    } else {
      await addProfessional(userProfile.id, payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg animate-fade-in-down border border-gray-700">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{professional ? 'Editar Profissional' : 'Novo Profissional'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
          </div>

          {/* Campo de Upload de Foto */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600 group">
                <img src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional?.name || '?')}&background=4B5563&color=fff`} alt="Preview" className="w-full h-full object-cover" />
                <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
          </div>

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