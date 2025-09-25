import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  type InputHTMLAttributes,
  type ElementType,
} from "react";
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
  type LucideProps,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  uploadProviderLogo,
  uploadProviderBanner,
} from "../../firebase/userService";
import {
  useForm,
  type SubmitHandler,
  Controller,
  type FieldError,
  type FieldValues,
  type Control,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useViaCep } from "../../hooks/useViaCep";
import { IMaskInput } from "react-imask";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLng } from "leaflet";

// @ts-expect-error - O Vite pode ter problemas com o carregamento de assets do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ElementType<LucideProps>;
  error?: FieldError;
}

interface MaskedInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  mask: string; // A máscara é geralmente uma string
  icon: ElementType<LucideProps>;
  error?: FieldError;
  placeholder?: string;
  onBlur?: () => void; // Função opcional de onBlur
}

interface MapEventsProps {
  onLocationSelect: (latlng: LatLng) => void;
}

const ChangeView = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapEvents = ({ onLocationSelect }: MapEventsProps) => {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
};

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

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, icon: Icon, error, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="relative flex flex-col">
        <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-300">
          {label}
        </label>
        <div className="relative">
          {/* Adicionamos uma verificação para só renderizar o ícone se ele for passado */}
          {Icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon
                className={`h-5 w-5 ${
                  hasError ? "text-red-400" : "text-gray-400"
                }`}
                aria-hidden="true"
              />
            </span>
          )}
          <input
            id={id}
            ref={ref}
            // Adiciona padding à esquerda somente se houver um ícone
            className={`block w-full rounded-md border-0 bg-white/5 py-3 ${
              Icon ? "pl-10" : "pl-3"
            } pr-3 text-white shadow-sm ring-1 ring-inset ${
              hasError
                ? "ring-red-500 focus:ring-red-500"
                : "ring-gray-600 focus:ring-amber-500"
            } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400" id={`${id}-error`}>
            {error.message}
          </p>
        )}
      </div>
    );
  }
);

// Definir um displayName é uma boa prática para depuração
Input.displayName = "Input";

export const MaskedInputField = <T extends FieldValues>({
  control,
  name,
  label,
  mask,
  icon: Icon,
  error,
  placeholder,
  onBlur,
}: MaskedInputFieldProps<T>) => {
  const hasError = !!error;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="relative flex flex-col">
          <label
            htmlFor={name}
            className="mb-2 text-sm font-medium text-gray-300"
          >
            {label}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon
                className={`h-5 w-5 ${
                  hasError ? "text-red-400" : "text-gray-400"
                }`}
                aria-hidden="true"
              />
            </span>
            <IMaskInput
              mask={mask}
              id={name}
              value={field.value || ""}
              onAccept={(value: unknown) => field.onChange(value)} // 3. Usar onAccept para compatibilidade
              onBlur={() => {
                field.onBlur();
                if (onBlur) {
                  onBlur();
                }
              }}
              placeholder={placeholder}
              className={`block w-full rounded-md border-0 bg-white/5 py-3 pl-10 pr-3 text-white shadow-sm ring-1 ring-inset ${
                hasError
                  ? "ring-red-500 focus:ring-red-500"
                  : "ring-gray-600 focus:ring-amber-500"
              } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200`}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400" id={`${name}-error`}>
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};

export const ProfileManagement = () => {
  const { userProfile, updateUserProfile } = useProfileStore();

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Estados do Cropper
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

  // Estados do Mapa
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -15.79, -47.88,
  ]);
  const [mapZoom, setMapZoom] = useState(4);

  // Observadores para endereço e CEP
  const cepValue = watch("businessAddress.zipCode");
  const streetValue = watch("businessAddress.street");
  const numberValue = watch("businessAddress.number");
  const cityValue = watch("businessAddress.city");
  const {
    address,
    loading: cepLoading,
    error: cepError,
    fetchAddress,
  } = useViaCep();

  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;
      reset(profile);
      setLogoPreview(profile.logoUrl || null);
      setBannerPreview(profile.bannerUrl || null);

      const { lat, lng } = profile.businessAddress;
      if (lat && lng) {
        const initialPos = new L.LatLng(lat, lng);
        setPosition(initialPos);
        setMapCenter([lat, lng]);
        setMapZoom(17);
      }
    }
  }, [userProfile, reset]);

  const fetchCoordinates = useCallback(async () => {
    if (streetValue && numberValue && cityValue) {
      try {
        const query = encodeURIComponent(
          `${streetValue}, ${numberValue}, ${cityValue}`
        );
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));
          setPosition(newPos);
          setMapCenter([newPos.lat, newPos.lng]);
          setMapZoom(17);
        }
      } catch (error) {
        console.error("Erro ao buscar geolocalização:", error);
      }
    }
  }, [streetValue, numberValue, cityValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCoordinates();
    }, 1200);
    return () => clearTimeout(handler);
  }, [streetValue, numberValue, cityValue, fetchCoordinates]);

  const handleMapClick = (latlng: L.LatLng) => {
    setPosition(latlng);
  };

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
      });
      setValue("businessAddress.neighborhood", address.bairro, {
        shouldValidate: true,
      });
      setValue("businessAddress.city", address.localidade, {
        shouldValidate: true,
      });
      setValue("businessAddress.state", address.uf, { shouldValidate: true });
    }
  }, [address, setValue]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Adicionamos a verificação de 'role' aqui
    if (file && userProfile && userProfile.role === "serviceProvider") {
      setIsUploadingLogo(true);
      const tempUrl = URL.createObjectURL(file);
      setLogoPreview(tempUrl);

      try {
        const photoURL = await uploadProviderLogo(userProfile.id, file);
        await updateUserProfile(userProfile.id, { logoUrl: photoURL });
        // Opcional: mostrar um toast de sucesso
      } catch (error) {
        console.error("Erro no upload do logo:", error);

        // Correção: Envolvemos a linha em outra verificação para garantir
        // que o TypeScript entenda o tipo de userProfile aqui também.
        if (userProfile.role === "serviceProvider") {
          setLogoPreview(userProfile.logoUrl || null); // Reverte o preview em caso de erro
        }
      } finally {
        setIsUploadingLogo(false);
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
      if (userProfile.role === "serviceProvider") {
        setBannerPreview(userProfile.bannerUrl || null);
      }
    } finally {
      setIsUploadingBanner(false);
    }
  }, [bannerToCrop, croppedAreaPixels, userProfile, updateUserProfile]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);

    const updatedData = {
      ...data,
      businessAddress: {
        ...data.businessAddress,
        lat: position?.lat,
        lng: position?.lng,
      },
    };

    await updateUserProfile(userProfile.id, updatedData);
    setIsSaving(false);
    reset(updatedData);
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
            <Input
              label="Nome do Negócio"
              id="businessName"
              icon={Building}
              error={errors.businessName}
              {...register("businessName")}
            />
            <Input
              label="CNPJ"
              id="cnpj"
              icon={UserCheck}
              {...register("cnpj")}
              disabled
            />
            <Input
              label="Nome do Responsável"
              id="name"
              icon={User}
              error={errors.name}
              {...register("name")}
            />
            <Input
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
              <Input
                label="Rua / Logradouro"
                id="street"
                error={errors.businessAddress?.street}
                {...register("businessAddress.street")}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Número"
                id="number"
                error={errors.businessAddress?.number}
                {...register("businessAddress.number")}
              />
            </div>
            <div className="md:col-span-4">
              <Input
                label="Bairro"
                id="neighborhood"
                error={errors.businessAddress?.neighborhood}
                {...register("businessAddress.neighborhood")}
              />
            </div>
            <div className="md:col-span-4">
              <Input
                label="Cidade"
                id="city"
                error={errors.businessAddress?.city}
                {...register("businessAddress.city")}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Estado (UF)"
                id="state"
                error={errors.businessAddress?.state}
                {...register("businessAddress.state")}
              />
            </div>
            <div className="md:col-span-6 mt-4">
              <label className="label-text">Localização no Mapa</label>
              <p className="text-xs text-gray-400 mb-2">
                A posição será atualizada automaticamente. Clique no mapa para
                ajustar.
              </p>
              <div className="h-80 w-full rounded-lg overflow-hidden border-2 border-gray-700">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <ChangeView center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapEvents onLocationSelect={handleMapClick} />
                  {position && <Marker position={position}></Marker>}
                </MapContainer>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-black/30 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Redes Sociais & Website
          </h2>
          <div className="space-y-4">
            <Input
              label="Instagram"
              id="instagram"
              icon={Instagram}
              error={errors.socialLinks?.instagram}
              {...register("socialLinks.instagram")}
              placeholder="https://instagram.com/seu_negocio"
            />
            <Input
              label="Facebook"
              id="facebook"
              icon={Facebook}
              error={errors.socialLinks?.facebook}
              {...register("socialLinks.facebook")}
              placeholder="https://facebook.com/seu_negocio"
            />
            <Input
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
