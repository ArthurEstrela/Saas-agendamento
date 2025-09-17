import { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";
// IMPORTAÇÃO CORRIGIDA: Adicionei os ícones que faltavam
import {
  Camera,
  Save,
  Loader2,
  Building,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  User,
  UserCheck,
  Instagram,
  Facebook,
} from "lucide-react";
import { motion } from "framer-motion";
import { uploadProviderLogo } from "../../firebase/userService";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useViaCep } from "../../hooks/useViaCep";
import { IMaskInput } from "react-imask";

// Schema de validação com Zod
const profileSchema = z.object({
  businessName: z.string().min(3, "O nome do negócio é obrigatório"),
  name: z.string().min(3, "O nome do responsável é obrigatório"),
  businessPhone: z.string().optional(),
  email: z.string().email("Email inválido"), // Mantido para exibição
  cnpj: z.string(), // CNPJ não terá validação de input, pois será read-only
  logoUrl: z.string().optional(),

  businessAddress: z.object({
    zipCode: z.string().min(9, "CEP é obrigatório"),
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(2, "UF é obrigatório"),
  }),
  socialLinks: z
    .object({
      instagram: z.string().url("URL inválida").optional().or(z.literal("")),
      facebook: z.string().url("URL inválida").optional().or(z.literal("")),
      website: z.string().url("URL inválida").optional().or(z.literal("")),
    })
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Componente de Input reutilizável no estilo do projeto
const InputField = ({
  label,
  id,
  icon: Icon,
  error,
  children,
  ...props
}: any) => (
  <div>
    <label htmlFor={id} className="label-text">
      {label}
    </label>
    <div className="input-container mt-1">
      {Icon && <Icon className="input-icon" size={18} />}
      <input
        id={id}
        {...props}
        className={`input-field ${Icon ? "pl-10" : ""} ${
          props.disabled ? "bg-gray-800/50 cursor-not-allowed" : ""
        }`}
      />
    </div>
    {error && <p className="error-message mt-1">{error?.message}</p>}
  </div>
);

// Componente de Input com Máscara
const MaskedInputField = ({
  control,
  name,
  label,
  mask,
  icon: Icon,
  error,
  placeholder,
  onBlur,
}: any) => (
  <div>
    <label htmlFor={name} className="label-text">
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="input-container mt-1">
          {Icon && <Icon className="input-icon" size={18} />}
          <IMaskInput
            {...field}
            mask={mask}
            id={name}
            placeholder={placeholder}
            onBlur={onBlur} // Passando o onBlur para o IMaskInput
            className={`input-field pl-10 ${error ? "border-red-500" : ""}`}
          />
        </div>
      )}
    />
    {error && <p className="error-message mt-1">{error.message}</p>}
  </div>
);

export const ProfileManagement = ({ onBack }: { onBack?: () => void }) => {
  const { userProfile, updateUserProfile, setUserProfile } = useProfileStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      socialLinks: { instagram: "", facebook: "", website: "" },
    },
  });

  const cepValue = watch("businessAddress.zipCode");
  const {
    address,
    loading: cepLoading,
    error: cepError,
    fetchAddress,
  } = useViaCep();

  // Popula o formulário com os dados existentes
  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;
      reset(profile); // `reset` do react-hook-form preenche todos os campos
      setPreviewImage(profile.logoUrl || null);
    }
  }, [userProfile, reset]);

  // Efeito para buscar e preencher o endereço a partir do CEP
  const handleCepSearch = useCallback(() => {
    const cleanedCep = cepValue?.replace(/\D/g, "");
    if (cleanedCep && cleanedCep.length === 8) {
      fetchAddress(cleanedCep);
    }
  }, [cepValue, fetchAddress]);

  useEffect(() => {
    if (address) {
      setValue("businessAddress.street", address.logradouro, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("businessAddress.neighborhood", address.bairro, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("businessAddress.city", address.localidade, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("businessAddress.state", address.uf, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [address, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile) {
      setIsUploading(true);
      setPreviewImage(URL.createObjectURL(file));

      const photoURL = await uploadProviderLogo(userProfile.id, file);

      setUserProfile({ ...userProfile, logoUrl: photoURL });
      setValue("logoUrl", photoURL, { shouldDirty: true });

      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!userProfile || !isDirty) return;

    setIsSaving(true);
    await updateUserProfile(userProfile.id, data);
    // Opcional: mostrar um toast de sucesso
    setIsSaving(false);
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-36 h-36 rounded-full group flex-shrink-0">
            <div className="w-full h-full rounded-full bg-gray-900/50 border-4 border-gray-700 flex items-center justify-center overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building size={64} className="text-gray-600" />
              )}
            </div>
            <label
              htmlFor="logo-upload"
              className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Camera size={32} />
              )}
            </label>
            <input
              id="logo-upload"
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
              disabled={isUploading}
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-white">Gerenciar Perfil</h1>
            <p className="text-gray-400 mt-2">
              Mantenha as informações do seu negócio sempre atualizadas para
              seus clientes.
            </p>
          </div>
        </div>

        {/* Seção de Informações do Negócio */}
        <section className="bg-black/30 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Informações do Negócio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Nome do Negócio"
              id="businessName"
              icon={Building}
              error={errors.businessName}
              {...register("businessName")}
            />
            <InputField
              label="CNPJ"
              id="cnpj"
              icon={UserCheck}
              {...register("cnpj")}
              disabled
            />
            <InputField
              label="Nome do Responsável"
              id="name"
              icon={User}
              error={errors.name}
              {...register("name")}
            />
            <InputField
              label="E-mail de Contato"
              id="email"
              icon={Mail}
              {...register("email")}
              disabled
            />
            <MaskedInputField
              control={control}
              name="businessPhone"
              label="Telefone/WhatsApp"
              mask="(00) 00000-0000"
              icon={Phone}
              error={errors.businessPhone}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
        </section>

        {/* Seção de Endereço */}
        <section className="bg-black/30 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Endereço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2">
              <MaskedInputField
                control={control}
                name="businessAddress.zipCode"
                label="CEP"
                mask="00000-000"
                icon={MapPin}
                error={errors.businessAddress?.zipCode}
                placeholder="00000-000"
                onBlur={handleCepSearch}
              />
              {cepLoading && (
                <p className="text-sm text-amber-400 mt-1">Buscando CEP...</p>
              )}
              {cepError && <p className="error-message mt-1">{cepError}</p>}
            </div>
            <div className="md:col-span-4">
              <InputField
                label="Rua / Logradouro"
                id="street"
                error={errors.businessAddress?.street}
                {...register("businessAddress.street")}
              />
            </div>
            <div className="md:col-span-2">
              <InputField
                label="Número"
                id="number"
                error={errors.businessAddress?.number}
                {...register("businessAddress.number")}
              />
            </div>
            <div className="md:col-span-4">
              <InputField
                label="Bairro"
                id="neighborhood"
                error={errors.businessAddress?.neighborhood}
                {...register("businessAddress.neighborhood")}
              />
            </div>
            <div className="md:col-span-4">
              <InputField
                label="Cidade"
                id="city"
                error={errors.businessAddress?.city}
                {...register("businessAddress.city")}
              />
            </div>
            <div className="md:col-span-2">
              <InputField
                label="Estado (UF)"
                id="state"
                error={errors.businessAddress?.state}
                {...register("businessAddress.state")}
              />
            </div>
          </div>
        </section>

        {/* Seção de Redes Sociais */}
        <section className="bg-black/30 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Redes Sociais & Website
          </h2>
          <div className="space-y-4">
            <InputField
              label="Instagram"
              id="instagram"
              icon={Instagram}
              error={errors.socialLinks?.instagram}
              {...register("socialLinks.instagram")}
              placeholder="https://instagram.com/seu_negocio"
            />
            <InputField
              label="Facebook"
              id="facebook"
              icon={Facebook}
              error={errors.socialLinks?.facebook}
              {...register("socialLinks.facebook")}
              placeholder="https://facebook.com/seu_negocio"
            />
            <InputField
              label="Website"
              id="website"
              icon={LinkIcon}
              error={errors.socialLinks?.website}
              {...register("socialLinks.website")}
              placeholder="https://seunegocio.com.br"
            />
          </div>
        </section>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-6 border-t border-gray-800">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="primary-button w-full md:w-auto md:px-8 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </motion.div>
  );
};
