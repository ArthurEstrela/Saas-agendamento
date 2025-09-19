import { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";
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
  Image as ImageIcon,
  Crop,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  uploadProviderLogo,
  uploadProviderBanner,
} from "../../firebase/userService";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useViaCep } from "../../hooks/useViaCep";
import { IMaskInput } from "react-imask";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";


// Schema e componentes de Input não mudam...
const profileSchema = z.object({
  businessName: z.string().min(3, "O nome do negócio é obrigatório"),
  name: z.string().min(3, "O nome do responsável é obrigatório"),
  businessPhone: z.string().optional(),
  email: z.string().email("Email inválido"),
  cnpj: z.string(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
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
const InputField = ({
  label,
  id,
  icon: Icon,
  error,
  children,
  ...props
}: any) => (
  <div>
    <label htmlFor={id} className="label-text"></label>

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
    <label htmlFor={name} className="label-text"></label>

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
  const { userProfile, updateUserProfile } = useProfileStore(); // Removido setUserProfile, pois updateUserProfile já faz isso
  const [isSaving, setIsSaving] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerToCrop, setBannerToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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

  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;
      reset(profile); // Popula o formulário
      setLogoPreview(profile.logoUrl || null);
      setBannerPreview(profile.bannerUrl || null);
    }
  }, [userProfile, reset]);

  const handleCepSearch = useCallback(() => {
    /* ... */
  }, []);
  useEffect(() => {
    /* ... */
  }, [address, setValue]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile) {
      setIsUploadingLogo(true);
      const tempUrl = URL.createObjectURL(file);
      setLogoPreview(tempUrl);

      try {
        const photoURL = await uploadProviderLogo(userProfile.id, file);
        // AQUI ESTÁ A MÁGICA: Salva a alteração da logo imediatamente
        await updateUserProfile(userProfile.id, { logoUrl: photoURL });
        // Opcional: mostrar um toast de sucesso
      } catch (error) {
        console.error("Erro no upload do logo:", error);
        setLogoPreview(userProfile.logoUrl || null); // Reverte o preview em caso de erro
      } finally {
        setIsUploadingLogo(false);
        // Não precisamos mais de `URL.revokeObjectURL(tempUrl)` pois o componente vai re-renderizar com a nova URL final
      }
    }
  };

  const onBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBannerToCrop(URL.createObjectURL(file));
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const showCroppedImage = useCallback(async () => {
    if (!bannerToCrop || !croppedAreaPixels || !userProfile) return;

    setIsUploadingBanner(true);
    setBannerToCrop(null);

    try {
      const croppedImageFile = await getCroppedImg(
        bannerToCrop,
        croppedAreaPixels
      );
      const tempUrl = URL.createObjectURL(croppedImageFile);
      setBannerPreview(tempUrl); // Mostra o preview otimista

      const bannerUrl = await uploadProviderBanner(
        userProfile.id,
        croppedImageFile
      );

      // AQUI ESTÁ A MÁGICA: Salva a alteração do banner imediatamente
      await updateUserProfile(userProfile.id, { bannerUrl: bannerUrl });
      // Opcional: mostrar um toast de sucesso
    } catch (e) {
      console.error(e);
      setBannerPreview(userProfile.bannerUrl || null); // Reverte o preview em caso de erro
    } finally {
      setIsUploadingBanner(false);
    }
  }, [bannerToCrop, croppedAreaPixels, userProfile, updateUserProfile]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);
    await updateUserProfile(userProfile.id, data);
    setIsSaving(false);
    reset(data); // Reseta o formulário para o novo estado "limpo", desabilitando o botão
  };

  // ... O resto do JSX continua o mesmo
  if (!userProfile)
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {bannerToCrop && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4">
          <div className="relative flex-1">
            <Cropper
              image={bannerToCrop}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="h-24 flex items-center justify-center gap-4">
            <button
              onClick={() => setBannerToCrop(null)}
              className="secondary-button"
            >
              Cancelar
            </button>
            <button
              onClick={showCroppedImage}
              className="primary-button flex items-center gap-2"
            >
              <Crop size={18} /> Definir Banner
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <header className="relative mb-24">
          <div className="group relative h-48 md:h-64 rounded-2xl bg-gray-900/50 border-2 border-dashed border-gray-700 flex items-center justify-center">
            {isUploadingBanner && (
              <Loader2 className="animate-spin text-white" size={32} />
            )}
            {!isUploadingBanner && bannerPreview && (
              <img
                src={bannerPreview}
                alt="Banner do negócio"
                className="w-full h-full object-cover rounded-2xl"
              />
            )}
            {!isUploadingBanner && !bannerPreview && (
              <div className="text-gray-600 text-center">
                <ImageIcon size={48} />
                <p className="mt-2 text-sm">Adicione um banner</p>
              </div>
            )}

            <label
              htmlFor="banner-upload"
              className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={32} />
            </label>
            <input
              id="banner-upload"
              type="file"
              className="hidden"
              onChange={onBannerFileChange}
              accept="image/*"
            />
          </div>

          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 md:px-8 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full group flex-shrink-0 border-4 border-gray-800 bg-gray-900">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building size={64} className="text-gray-600" />
                </div>
              )}
              <label
                htmlFor="logo-upload"
                className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingLogo ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera size={32} />
                )}
              </label>
              <input
                id="logo-upload"
                type="file"
                className="hidden"
                onChange={handleLogoUpload}
                accept="image/*"
                disabled={isUploadingLogo}
              />
            </div>
            <div className="text-center md:text-left pt-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {watch("businessName") || "Nome do seu Negócio"}
              </h1>
              <p className="text-gray-400 mt-1">
                Gerencie as informações do seu perfil público.
              </p>
            </div>
          </div>
        </header>

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
