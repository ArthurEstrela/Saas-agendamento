import { useState, useEffect } from 'react';
import { useProfileStore } from '../../store/profileStore';
import type { ServiceProviderProfile } from '../../types';
import { Camera, Building, Save, Loader2, Instagram, Facebook, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
// 1. Importamos o nosso novo especialista
import { uploadProviderLogo } from '../../firebase/userService'; 
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useViaCep } from '../../hooks/useViaCep';

type FormInputs = Omit<ServiceProviderProfile, 'id' | 'role' | 'createdAt' | 'lastLogin' | 'services' | 'professionals' | 'reviews'>;

export const ProfileManagement = () => {
  const { userProfile, updateUserProfile, setUserProfile } = useProfileStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormInputs>();
  
  const cep = watch('businessAddress.zipCode');
  const { address, loading: cepLoading } = useViaCep(cep);

  useEffect(() => {
    if (userProfile) {
      const profile = userProfile as ServiceProviderProfile;
      Object.keys(profile).forEach(key => {
        setValue(key as keyof FormInputs, profile[key as keyof FormInputs]);
      });
      setPreviewImage(profile.logoUrl || null);
    }
  }, [userProfile, setValue]);
  
  useEffect(() => {
    if (address) {
      setValue('businessAddress.street', address.logradouro, { shouldDirty: true });
      setValue('businessAddress.city', address.localidade, { shouldDirty: true });
      setValue('businessAddress.state', address.uf, { shouldDirty: true });
    }
  }, [address, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile) {
      setIsUploading(true);
      setPreviewImage(URL.createObjectURL(file));
      
      // 2. Chamamos o especialista. A lógica de upload e update do perfil está encapsulada lá.
      const photoURL = await uploadProviderLogo(userProfile.id, file);
      
      // 3. Apenas atualizamos o estado local da store para reatividade imediata.
      setUserProfile({ ...userProfile, logoUrl: photoURL });

      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);
    await updateUserProfile(userProfile.id, data);
    setUserProfile({ ...userProfile, ...data });
    setIsSaving(false);
  };
  
  if (!userProfile) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-[#daa520]" size={48} /></div>;
  }

  // O JSX do formulário continua exatamente o mesmo
  return (
    <motion.div 
        className="animate-fade-in-down"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-800 pb-8">
            <div className="relative w-32 h-32 rounded-full group flex-shrink-0">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                        <img src={previewImage} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <Building size={64} className="text-gray-600" />
                    )}
                </div>
                <label htmlFor="logo-upload" className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploading ? <Loader2 className="animate-spin" /> : <Camera size={32} />}
                </label>
                <input id="logo-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-white">Gerenciar Perfil</h1>
                <p className="text-gray-400 mt-2">Mantenha as informações do seu negócio sempre atualizadas para seus clientes.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="businessName" className="label-stylo">Nome do Negócio</label>
                <input id="businessName" {...register('businessName', { required: "Campo obrigatório" })} className="input-stylo" />
                {errors.businessName && <p className="error-stylo">{errors.businessName.message}</p>}
            </div>
             <div>
                <label htmlFor="name" className="label-stylo">Seu Nome (Responsável)</label>
                <input id="name" {...register('name', { required: "Campo obrigatório" })} className="input-stylo" />
                {errors.name && <p className="error-stylo">{errors.name.message}</p>}
            </div>
             <div>
                <label htmlFor="businessPhone" className="label-stylo">Telefone do Negócio</label>
                <input id="businessPhone" {...register('businessPhone')} className="input-stylo" placeholder="(XX) XXXXX-XXXX" />
            </div>
             <div>
                <label htmlFor="cnpj" className="label-stylo">CNPJ</label>
                <input id="cnpj" {...register('cnpj', { required: "Campo obrigatório" })} className="input-stylo" placeholder="XX.XXX.XXX/0001-XX" />
                {errors.cnpj && <p className="error-stylo">{errors.cnpj.message}</p>}
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-white mb-4 border-l-4 border-[#daa520] pl-3">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label htmlFor="zipCode" className="label-stylo">CEP</label>
                    <div className="relative">
                        <input id="zipCode" {...register('businessAddress.zipCode')} className="input-stylo" />
                        {cepLoading && <Loader2 className="animate-spin absolute right-3 top-3 text-gray-400" />}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="street" className="label-stylo">Rua / Logradouro</label>
                    <input id="street" {...register('businessAddress.street')} className="input-stylo" />
                </div>
                <div>
                    <label htmlFor="city" className="label-stylo">Cidade</label>
                    <input id="city" {...register('businessAddress.city')} className="input-stylo" />
                </div>
                <div>
                    <label htmlFor="state" className="label-stylo">Estado</label>
                    <input id="state" {...register('businessAddress.state')} className="input-stylo" />
                </div>
            </div>
        </div>
        
        <div>
            <h3 className="text-xl font-semibold text-white mb-4 border-l-4 border-[#daa520] pl-3">Redes Sociais e Website</h3>
            <div className="space-y-4">
                 <div className="relative">
                    <Instagram size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input {...register('socialLinks.instagram')} className="input-stylo pl-10" placeholder="instagram.com/seu-negocio" />
                </div>
                <div className="relative">
                    <Facebook size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input {...register('socialLinks.facebook')} className="input-stylo pl-10" placeholder="facebook.com/seu-negocio" />
                </div>
                <div className="relative">
                    <LinkIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input {...register('socialLinks.website')} className="input-stylo pl-10" placeholder="www.seunegocio.com.br" />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-gray-800">
            <button type="submit" disabled={isSaving || !isDirty} className="primary-button flex items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                Salvar Alterações
            </button>
        </div>
      </form>
    </motion.div>
  );
};