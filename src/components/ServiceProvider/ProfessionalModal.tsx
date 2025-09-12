import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Professional, Service } from '../../types';
import { Loader2, User, Image as ImageIcon, X } from 'lucide-react';

// Schema de validação
const professionalSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório'),
  serviceIds: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfessionalFormData, photoFile: File | null) => void;
  professional?: Professional | null; // Profissional existente para edição
  availableServices: Service[];
  isLoading: boolean;
}

export const ProfessionalModal = ({ isOpen, onClose, onSave, professional, availableServices, isLoading }: ProfessionalModalProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(professional?.photoURL || null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
  });

  // Popula o formulário quando o modo de edição é ativado
  useEffect(() => {
    if (professional) {
      reset({
        name: professional.name,
        serviceIds: professional.services.map(s => s.id),
      });
      setPreviewUrl(professional.photoURL || null);
    } else {
      reset({ name: '', serviceIds: [] });
      setPreviewUrl(null);
    }
    setPhotoFile(null);
  }, [professional, reset]);
  
  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = (data: ProfessionalFormData) => {
    onSave(data, photoFile);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg border border-gray-700 m-4">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{professional ? 'Editar Profissional' : 'Adicionar Profissional'}</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            {/* Foto e Nome */}
            <div className='flex items-center gap-6'>
                <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-amber-500">
                    {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full rounded-full object-cover" /> : <ImageIcon size={32} className="text-gray-500" />}
                    </div>
                    <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <div className="flex-1">
                    <label className="label-text">Nome do Profissional</label>
                    <div className="input-container">
                        <User className="input-icon" />
                        <input {...register('name')} className="input-field pl-10" />
                    </div>
                    {errors.name && <p className="error-message">{errors.name.message}</p>}
                </div>
            </div>

            {/* Serviços Associados */}
            <div>
              <label className="label-text">Serviços Realizados</label>
              {availableServices.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-lg max-h-48 overflow-y-auto">
                  {availableServices.map(service => (
                    <label key={service.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800/50 cursor-pointer">
                      <input type="checkbox" {...register('serviceIds')} value={service.id} className="form-checkbox bg-gray-700 border-gray-600 text-amber-500 focus:ring-amber-500" />
                      <span className="text-gray-200">{service.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Você precisa cadastrar serviços primeiro na aba "Meus Serviços".</p>
              )}
              {errors.serviceIds && <p className="error-message">{errors.serviceIds.message}</p>}
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