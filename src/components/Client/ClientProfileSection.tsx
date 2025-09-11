import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProfileStore } from '../../store/profileStore';
import type { ClientProfile } from '../../types';
import { ProfilePictureUploader } from './ProfilePictureUploader';

const profileSchema = z.object({
  name: z.string().min(3, { message: "O nome é obrigatório." }),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ClientProfileSection = () => {
  const { userProfile, isLoadingProfile, updateUserProfile } = useProfileStore();
  
  const clientProfile = userProfile as ClientProfile;

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: clientProfile?.name || '',
      phoneNumber: clientProfile?.phoneNumber || '',
    }
  });

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!clientProfile?.id) return;
    await updateUserProfile(clientProfile.id, data);
  };

  if (isLoadingProfile) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        <ProfilePictureUploader />
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Nome Completo</label>
            <input {...register("name")} id="name" type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
            {errors.name && <p className="text-red-500 text-xs italic">{errors.name.message}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input id="email" type="email" value={clientProfile.email} disabled className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 cursor-not-allowed" />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">Telefone</label>
            <input {...register("phoneNumber")} id="phoneNumber" type="tel" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
          </div>
          <button 
            disabled={!isDirty || isSubmitting} 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </section>
  );
};