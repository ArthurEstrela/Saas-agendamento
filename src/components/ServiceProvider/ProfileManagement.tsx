import { useState, useEffect, useCallback, useRef } from "react";
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
  Instagram,
  Facebook,
  Image as ImageIcon,
  Crop,
  QrCode,
  Clock,
  Info,
  FileText, // Ícone genérico para documento
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
import getCroppedImg from "../../lib/utils/cropImage";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLng } from "leaflet";
import { FaWhatsapp } from "react-icons/fa";

// UI Components
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// Leaflet Fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

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

const MapEvents = ({
  onLocationSelect,
}: {
  onLocationSelect: (latlng: LatLng) => void;
}) => {
  const [position, setPosition] = useState<LatLng | null>(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

// --- SCHEMA ATUALIZADO ---
const profileSchema = z.object({
  businessName: z.string().min(3, "O nome do negócio é obrigatório"),
  publicProfileSlug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hifens.")
    .optional(),
  name: z.string().min(3, "Nome do responsável é obrigatório"),
  businessPhone: z.string().optional(),
  email: z.string().email("Email inválido"),

  // Alteração: Suporte a CPF/CNPJ
  documentType: z.enum(["cpf", "cnpj"]),
  documentNumber: z.string(), // Validação simplificada pois é read-only na edição

  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),

  cancellationMinHours: z.coerce
    .number()
    .min(0, "Não pode ser negativo")
    .max(720, "Máximo de 30 dias (720h)")
    .default(2),

  pixKey: z.string().optional(),
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
  businessAddress: z.object({
    zipCode: z.string().min(9, "CEP obrigatório"),
    street: z.string().min(1, "Rua obrigatória"),
    number: z.string().min(1, "Número obrigatório"),
    neighborhood: z.string().min(1, "Bairro obrigatório"),
    city: z.string().min(1, "Cidade obrigatória"),
    state: z.string().min(2, "UF obrigatório"),
  }),
  socialLinks: z
    .object({
      instagram: z.string().url("URL inválida").optional().or(z.literal("")),
      facebook: z.string().url("URL inválida").optional().or(z.literal("")),
      website: z.string().url("URL inválida").optional().or(z.literal("")),
      whatsapp: z.string().optional(),
    })
    .optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileManagement = () => {
  const { userProfile, updateUserProfile } = useProfileStore();
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
      pixKeyType: "cpf",
      cancellationMinHours: 2,
    },
  });

  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -15.79, -47.88,
  ]);
  const [mapZoom, setMapZoom] = useState(4);
  const lastSearchedAddressRef = useRef("");

  const cepValue = watch("businessAddress.zipCode");
  const streetValue = watch("businessAddress.street");
  const numberValue = watch("businessAddress.number");
  const cityValue = watch("businessAddress.city");

  // Monitorar o tipo de documento para exibir a label correta
  const documentType = watch("documentType");

  const {
    address,
    loading: cepLoading,
    error: cepError,
    fetchAddress,
  } = useViaCep();

  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;

      // Determinar qual documento exibir
      const docType = profile.documentType || (profile.cpf ? "cpf" : "cnpj");
      const docNumber = profile.cpf || profile.cnpj || "";

      const defaultValues = {
        ...profile,
        documentType: docType,
        documentNumber: docNumber,
        cancellationMinHours: profile.cancellationMinHours ?? 2,
      };

      // @ts-ignore - Ignorando erro de tipagem estrita do Zod no reset inicial
      reset(defaultValues);

      setLogoPreview(profile.logoUrl || null);
      setBannerPreview(profile.bannerUrl || null);
      const { lat, lng } = profile.businessAddress;
      if (lat && lng) {
        const initialPos = new L.LatLng(lat, lng);
        setPosition(initialPos);
        setMapCenter([lat, lng]);
        setMapZoom(17);
        lastSearchedAddressRef.current = `${profile.businessAddress.street}, ${profile.businessAddress.number}, ${profile.businessAddress.city}`;
      }
    }
  }, [userProfile, reset]);

  const fetchCoordinates = useCallback(async () => {
    if (streetValue && numberValue && cityValue) {
      const currentQuery = `${streetValue}, ${numberValue}, ${cityValue}`;
      if (currentQuery === lastSearchedAddressRef.current) return;

      try {
        const query = encodeURIComponent(currentQuery);
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
          lastSearchedAddressRef.current = currentQuery;
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

  const handleMapClick = (latlng: L.LatLng) => setPosition(latlng);
  const handleCepSearch = useCallback(() => {
    const cleanedCep = cepValue?.replace(/\D/g, "");
    if (cleanedCep && cleanedCep.length === 8) fetchAddress(cleanedCep);
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
    if (file && userProfile && userProfile.role === "serviceProvider") {
      setIsUploadingLogo(true);
      const tempUrl = URL.createObjectURL(file);
      setLogoPreview(tempUrl);
      try {
        const photoURL = await uploadProviderLogo(userProfile.id, file);
        await updateUserProfile(userProfile.id, { logoUrl: photoURL });
      } catch (error) {
        console.error(error);
        setLogoPreview(userProfile.logoUrl || null);
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const onBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0)
      setBannerToCrop(URL.createObjectURL(e.target.files[0]));
  };

  const showCroppedImage = useCallback(async () => {
    if (!bannerToCrop || !croppedAreaPixels || !userProfile) return;
    setIsUploadingBanner(true);
    setBannerToCrop(null);
    try {
      const croppedImageFile = await getCroppedImg(
        bannerToCrop,
        croppedAreaPixels
      );
      const bannerUrl = await uploadProviderBanner(
        userProfile.id,
        croppedImageFile
      );
      setBannerPreview(URL.createObjectURL(croppedImageFile));
      await updateUserProfile(userProfile.id, { bannerUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingBanner(false);
    }
  }, [bannerToCrop, croppedAreaPixels, userProfile, updateUserProfile]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);

    // Preparar dados para salvar, removendo campos apenas de visualização se necessário
    const updatedData = {
      ...data,
      // Garante que mantemos os campos originais de cpf/cnpj atualizados se o usuário mudar algo (embora esteja disabled)
      cpf: data.documentType === "cpf" ? data.documentNumber : undefined,
      cnpj: data.documentType === "cnpj" ? data.documentNumber : undefined,
      businessAddress: {
        ...data.businessAddress,
        lat: position?.lat,
        lng: position?.lng,
      },
    };

    await updateUserProfile(userProfile.id, updatedData);
    setIsSaving(false);
    // @ts-ignore
    reset(updatedData);
  };

  const inputBaseClasses = cn(
    "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors",
    "placeholder:text-gray-500",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-50 pl-10"
  );

  if (!userProfile)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              onCropComplete={setCroppedAreaPixels}
            />
          </div>
          <div className="h-24 flex items-center justify-center gap-4">
            <Button variant="ghost" onClick={() => setBannerToCrop(null)}>
              Cancelar
            </Button>
            <Button onClick={showCroppedImage}>
              <Crop size={18} className="mr-2" /> Definir Banner
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
        {/* Banner e Logo (MANTIDO IGUAL) */}
        <header className="relative mb-24">
          <div className="group relative h-48 md:h-64 rounded-2xl bg-gray-900/50 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden">
            {/* ... (código do banner mantido igual) ... */}
            {isUploadingBanner && (
              <Loader2 className="animate-spin text-white" size={32} />
            )}
            {!isUploadingBanner && bannerPreview && (
              <img
                src={bannerPreview}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            )}
            {!isUploadingBanner && !bannerPreview && (
              <div className="text-gray-600 text-center">
                <ImageIcon size={48} className="mx-auto" />
                <p className="mt-2 text-sm">Adicione um banner para sua loja</p>
              </div>
            )}
            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              <Camera size={32} />
              <input
                type="file"
                className="hidden"
                onChange={onBannerFileChange}
                accept="image/*"
              />
            </label>
          </div>

          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 md:px-8 flex flex-col md:flex-row items-center gap-6">
            {/* ... (código do logo mantido igual) ... */}
            <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full group flex-shrink-0 border-4 border-gray-900 bg-gray-900 shadow-xl">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building size={64} className="text-gray-700" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {isUploadingLogo ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera size={24} />
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleLogoUpload}
                  accept="image/*"
                  disabled={isUploadingLogo}
                />
              </label>
            </div>
            <div className="text-center md:text-left pt-2">
              <h1 className="text-3xl font-bold text-white">
                {watch("businessName") || "Nome do seu Negócio"}
              </h1>
              <p className="text-gray-400">Gerencie seu perfil público.</p>
            </div>
          </div>
        </header>

        {/* Dados Gerais */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Building size={20} /> Dados do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Nome Fantasia (Exibido aos clientes)
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="businessName"
                  className="pl-10"
                  {...register("businessName")}
                  placeholder="Ex: Barbearia do João"
                  error={errors.businessName?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="publicProfileSlug"
                className="flex items-center gap-1"
              >
                Link do Perfil{" "}
                <span className="text-xs text-gray-500">(Slug na URL)</span>
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="publicProfileSlug"
                  className="pl-10"
                  {...register("publicProfileSlug")}
                  placeholder="ex: barbearia-do-joao"
                  error={errors.publicProfileSlug?.message}
                />
              </div>
            </div>

            {/* CAMPO DE DOCUMENTO DINÂMICO (CPF ou CNPJ) */}
            <div className="space-y-2">
              <Label htmlFor="documentNumber">
                {documentType === "cpf" ? "CPF" : "CNPJ"}
              </Label>
              <Controller
                name="documentNumber"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                    <IMaskInput
                      {...field}
                      id="documentNumber"
                      mask={
                        documentType === "cpf"
                          ? "000.000.000-00"
                          : "00.000.000/0000-00"
                      }
                      className={cn(inputBaseClasses, "opacity-70")}
                      placeholder={documentType === "cpf" ? "CPF" : "CNPJ"}
                      disabled // Documento geralmente não se edita
                    />
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Responsável</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="name"
                  className="pl-10"
                  {...register("name")}
                  placeholder="Seu nome completo"
                  error={errors.name?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail de Login</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  className="pl-10 opacity-70"
                  {...register("email")}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Telefone de Contato</Label>
              <Controller
                name="businessPhone"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                    <IMaskInput
                      {...field}
                      id="businessPhone"
                      mask="(00) 00000-0000"
                      className={inputBaseClasses}
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ... Restante do código (Regras de Agendamento, Pix, Endereço e Redes Sociais) permanece idêntico ... */}
        {/* Estou mantendo o restante para garantir que a estrutura não quebre, mas o foco da mudança foi acima */}

        {/* NOVA SEÇÃO: Regras de Agendamento */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Clock size={20} /> Regras de Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="cancellationMinHours"
                  className="flex items-center gap-2"
                >
                  Antecedência para Cancelamento (Horas)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={14} className="text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                        <p>
                          Define quanto tempo antes do agendamento o cliente
                          ainda pode cancelar pelo app.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input
                    id="cancellationMinHours"
                    type="number"
                    min="0"
                    className="pl-10"
                    {...register("cancellationMinHours")}
                    placeholder="Ex: 2"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Ex: Se colocar <strong>2</strong>, o cliente só pode cancelar
                  se faltar mais de 2 horas para o serviço. Coloque{" "}
                  <strong>0</strong> para permitir sempre.
                </p>
                {errors.cancellationMinHours && (
                  <span className="text-red-500 text-xs">
                    {errors.cancellationMinHours.message}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pix - Com Labels */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <QrCode size={20} /> Dados Bancários (Pix)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-2">
              <Label>Tipo da Chave</Label>
              <Controller
                name="pixKeyType"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Celular</SelectItem>
                      <SelectItem value="random">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="pixKey">Chave Pix</Label>
              <div className="relative">
                <QrCode className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="pixKey"
                  className="pl-10"
                  {...register("pixKey")}
                  placeholder="Digite sua chave pix"
                  error={errors.pixKey?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço - Com Labels */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <MapPin size={20} /> Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="relative">
                <Controller
                  name="businessAddress.zipCode"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      {...field}
                      id="zipCode"
                      mask="00000-000"
                      className={inputBaseClasses}
                      placeholder="00000-000"
                      onBlur={handleCepSearch}
                    />
                  )}
                />
                {cepLoading && (
                  <span className="text-xs text-primary ml-1 absolute right-0 -bottom-5">
                    Buscando...
                  </span>
                )}
              </div>
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label htmlFor="street">Rua / Logradouro</Label>
              <Input
                id="street"
                {...register("businessAddress.street")}
                placeholder="Nome da rua"
                error={errors.businessAddress?.street?.message}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                {...register("businessAddress.number")}
                placeholder="Nº"
                error={errors.businessAddress?.number?.message}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                {...register("businessAddress.neighborhood")}
                placeholder="Bairro"
                error={errors.businessAddress?.neighborhood?.message}
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register("businessAddress.city")}
                placeholder="Cidade"
                error={errors.businessAddress?.city?.message}
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                {...register("businessAddress.state")}
                placeholder="UF"
                error={errors.businessAddress?.state?.message}
              />
            </div>

            <div className="md:col-span-6 h-80 rounded-lg overflow-hidden border border-gray-700 mt-4 relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
              >
                <ChangeView center={mapCenter} zoom={mapZoom} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapEvents onLocationSelect={handleMapClick} />
                {position && <Marker position={position}></Marker>}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais - Com Labels */}
        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle className="text-amber-500 flex items-center gap-2">
              <Instagram size={20} /> Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="instagram"
                  className="pl-10"
                  {...register("socialLinks.instagram")}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <div className="relative">
                <Facebook className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="facebook"
                  className="pl-10"
                  {...register("socialLinks.facebook")}
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (Link)</Label>
              <Controller
                name="socialLinks.whatsapp"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <FaWhatsapp className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                    <IMaskInput
                      {...field}
                      id="whatsapp"
                      mask="(00) 00000-0000"
                      className={inputBaseClasses}
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website / Outro Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="website"
                  className="pl-10"
                  {...register("socialLinks.website")}
                  placeholder="https://seusite.com.br"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            className="shadow-lg shadow-black/50 font-bold px-8"
          >
            {isSaving ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Save className="mr-2" />
            )}{" "}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
