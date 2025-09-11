import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProfileStore } from '../../store/profileStore';
import type { ServiceProviderProfile } from '../../types';
import { User, Save, Loader2 } from 'lucide-react';
import { ProfilePictureUploader } from '../Client/ProfilePictureUploader';


// Esquema de validação robusto para o perfil do prestador
const profileSchema = z.object({
  businessName: z.string().min(3, { message: "Nome do negócio é obrigatório." }),
  businessPhone: z.string().optional(),
  businessAddress: z.object({
    street: z.string().min(3, { message: "Rua é obrigatória." }),
    city: z.string().min(3, { message: "Cidade é obrigatória." }),
    state: z.string().min(2, { message: "Estado é obrigatório." }),
    zipCode: z.string().min(8, { message: "CEP é obrigatório." }),
  })
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileManagementProps {
    onBack: () => void; // Para o botão de voltar
}

export const ProfileManagement = ({ onBack }: ProfileManagementProps) => {
  const { userProfile, isLoadingProfile, updateUserProfile } = useProfileStore();
  
  const providerProfile = userProfile as ServiceProviderProfile;

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: providerProfile?.businessName || '',
      businessPhone: providerProfile?.businessPhone || '',
      businessAddress: providerProfile?.businessAddress || { street: '', city: '', state: '', zipCode: '' },
    }
  });

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!providerProfile?.id) return;
    try {
      await updateUserProfile(providerProfile.id, data);
      // Idealmente, mostrar um toast de sucesso aqui
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      // E um toast de erro aqui
    }
  };

  if (isLoadingProfile) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-[#daa520]" size={40} /></div>;
  }

  return (
    <div className="animate-fade-in-down">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><User /> Meu Perfil</h1>
      
      <div className="bg-gray-800/70 p-8 rounded-xl border border-gray-700 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna da Foto */}
            <div className="md:col-span-1 flex flex-col items-center">
                <ProfilePictureUploader />
                <p className="text-gray-400 text-sm mt-4 text-center">Clique na imagem para alterar a foto do seu negócio.</p>
            </div>

            {/* Coluna do Formulário */}
            <div className="md:col-span-2">
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="businessName">Nome do Estabelecimento</label>
                            <input {...register('businessName')} id="businessName" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                            {errors.businessName && <p className="text-red-400 text-sm mt-1">{errors.businessName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="businessPhone">Telefone de Contato</label>
                            <input {...register('businessPhone')} id="businessPhone" type="tel" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white pt-4 border-t border-gray-700">Endereço</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="street">Rua</label>
                                <input {...register('businessAddress.street')} id="street" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                                {errors.businessAddress?.street && <p className="text-red-400 text-sm mt-1">{errors.businessAddress.street.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="city">Cidade</label>
                                <input {...register('businessAddress.city')} id="city" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                                {errors.businessAddress?.city && <p className="text-red-400 text-sm mt-1">{errors.businessAddress.city.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="state">Estado</label>
                                <input {...register('businessAddress.state')} id="state" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                                {errors.businessAddress?.state && <p className="text-red-400 text-sm mt-1">{errors.businessAddress.state.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="zipCode">CEP</label>
                                <input {...register('businessAddress.zipCode')} id="zipCode" className="w-full bg-gray-900 p-3 rounded-md border border-gray-700" />
                                {errors.businessAddress?.zipCode && <p className="text-red-400 text-sm mt-1">{errors.businessAddress.zipCode.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-gray-700">
                        <button type="button" onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">Voltar</button>
                        <button 
                            type="submit" 
                            disabled={!isDirty || isSubmitting}
                            className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};