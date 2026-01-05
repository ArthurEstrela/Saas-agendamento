// src/components/ServiceProvider/ProfileManagement.tsx
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
  FileText,
  Hash,
  Globe,
  Building2,
  Map as MapIcon,
  Navigation,
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
import { toast } from "react-hot-toast"; // <--- ADICIONADO: Importação do toast

// UI Components
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
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
import { Badge } from "../ui/badge";

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

// --- SCHEMA ---
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
  documentType: z.enum(["cpf", "cnpj"]),
  documentNumber: z.string(),
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
      documentType: "cpf",
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

  const documentType = watch("documentType") || "cpf";

  const { address, loading: cepLoading, fetchAddress } = useViaCep();

  useEffect(() => {
    if (userProfile && userProfile.role === "serviceProvider") {
      const profile = userProfile as ServiceProviderProfile;
      const docType = profile.documentType || (profile.cpf ? "cpf" : "cnpj");
      const docNumber = profile.cpf || profile.cnpj || "";

      const defaultValues = {
        ...profile,
        documentType: docType,
        documentNumber: docNumber,
        cancellationMinHours: profile.cancellationMinHours ?? 2,
      };

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
        toast.success("Logo atualizada!");
      } catch (error) {
        console.error(error);
        setLogoPreview(userProfile.logoUrl || null);
        toast.error("Erro ao carregar logo.");
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
    
    const loadingToast = toast.loading("Processando imagem..."); // <--- MELHORIA: Feedback visual
    
    try {
      const croppedImageFile = await getCroppedImg(
        bannerToCrop,
        croppedAreaPixels
      );
      
      const bannerUrl = await uploadProviderBanner(
        userProfile.id,
        croppedImageFile
      );
      
      await updateUserProfile(userProfile.id, { bannerUrl });
      setBannerPreview(bannerUrl); 
      setBannerToCrop(null); 
      
      toast.dismiss(loadingToast); // <--- Limpa o loading
      toast.success("Banner atualizado com sucesso! 🖼️");
    } catch (e) {
      console.error("Erro ao processar imagem:", e);
      toast.dismiss(loadingToast);
      toast.error("Erro ao guardar o banner.");
    } finally {
      setIsUploadingBanner(false);
    }
  }, [bannerToCrop, croppedAreaPixels, userProfile, updateUserProfile]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);
    try {
      const updatedData = {
        ...data,
        cpf: data.documentType === "cpf" ? data.documentNumber : undefined,
        cnpj: data.documentType === "cnpj" ? data.documentNumber : undefined,
        businessAddress: {
          ...data.businessAddress,
          lat: position?.lat,
          lng: position?.lng,
        },
      };
      await updateUserProfile(userProfile.id, updatedData);
      toast.success("Perfil salvo com sucesso!");
      reset(updatedData);
    } catch (error) {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const imaskClass = cn(
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-20"
    >
      {/* --- CROPPER MODAL --- */}
      {bannerToCrop && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-4xl h-[60vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-800">
            <Cropper
              image={bannerToCrop}
              crop={crop}
              zoom={zoom}
              aspect={3 / 1} 
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => setBannerToCrop(null)}
              className="px-8"
            >
              Cancelar
            </Button>
            <Button onClick={showCroppedImage} className="px-8 font-bold">
              <Crop size={18} className="mr-2" /> Recortar e Salvar
            </Button>
          </div>
          <div className="mt-4 w-full max-w-md px-4">
            <Label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block text-center">
              Zoom
            </Label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* --- HERO HEADER (Banner + Avatar) --- */}
        <div className="relative mb-32 group">
          <div className="relative w-full h-60 md:h-80 rounded-b-[2.5rem] bg-gray-900 overflow-hidden shadow-2xl border-b border-gray-800">
            {isUploadingBanner && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" size={40} />
              </div>
            )}

           {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-600">
                <ImageIcon size={64} className="opacity-20 mb-2" />
                <span className="text-sm font-medium opacity-40">
                  Adicione uma capa
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            <label className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full cursor-pointer transition-all border border-white/10 shadow-lg group-hover:opacity-100 md:opacity-0 opacity-100">
              <Camera size={20} />
              <input
                type="file"
                className="hidden"
                onChange={onBannerFileChange}
                accept="image/*"
              />
            </label>
          </div>

          <div className="absolute -bottom-24 left-0 w-full flex flex-col items-center px-4">
            <div className="relative">
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gray-950 border-[6px] border-gray-950 shadow-2xl flex items-center justify-center overflow-hidden group/avatar">
                {isUploadingLogo ? (
                  <Loader2 className="animate-spin text-primary" size={32} />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building size={64} className="text-gray-700" />
                )}

                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer">
                  <Camera size={32} className="text-white drop-shadow-lg" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/*"
                    disabled={isUploadingLogo}
                  />
                </label>
              </div>

              <div
                className="absolute bottom-4 right-2 bg-green-500 h-6 w-6 rounded-full border-4 border-gray-950"
                title="Perfil Ativo"
              />
            </div>

            <div className="mt-4 text-center space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                {watch("businessName") || "Nome do Negócio"}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md"
                >
                  {(documentType || "cpf").toUpperCase() === "CPF"
                    ? "Pessoa Física"
                    : "Pessoa Jurídica"}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {watch("businessAddress.city") &&
                    `• ${watch("businessAddress.city")}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-gray-900/50 border-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-900/50 border-b border-gray-800/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Building size={20} />
                  </div>
                  Informações Gerais
                </CardTitle>
                <CardDescription>
                  Dados visíveis no seu perfil público
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input
                      className="pl-10"
                      {...register("businessName")}
                      placeholder="Ex: Barbearia Estilo"
                      error={errors.businessName?.message}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Link Personalizado (Slug)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={12} className="text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Seu link será: agendai.com/<strong>seu-slug</strong>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input
                      className="pl-10"
                      {...register("publicProfileSlug")}
                      placeholder="ex: barbearia-estilo"
                      error={errors.publicProfileSlug?.message}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Documento ({(documentType || "cpf").toUpperCase()})
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                    <Controller
                      name="documentNumber"
                      control={control}
                      render={({ field }) => (
                        <IMaskInput
                          {...field}
                          mask={
                            (documentType || "cpf") === "cpf"
                              ? "000.000.000-00"
                              : "00.000.000/0000-00"
                          }
                          className={cn(
                            imaskClass,
                            "bg-gray-800/50 text-gray-400 cursor-not-allowed"
                          )}
                          disabled
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Telefone Comercial</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                    <Controller
                      name="businessPhone"
                      control={control}
                      render={({ field }) => (
                        <IMaskInput
                          {...field}
                          mask="(00) 00000-0000"
                          className={imaskClass}
                          placeholder="(00) 00000-0000"
                        />
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-900/50 border-b border-gray-800/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <MapPin size={20} />
                  </div>
                  Endereço e Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <Controller
                        name="businessAddress.zipCode"
                        control={control}
                        render={({ field }) => (
                          <IMaskInput
                            {...field}
                            mask="00000-000"
                            className={imaskClass}
                            onBlur={handleCepSearch}
                            placeholder="00000-000"
                          />
                        )}
                      />
                      {cepLoading && (
                        <Loader2
                          size={16}
                          className="absolute right-3 top-3 animate-spin text-primary"
                        />
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Rua / Logradouro</Label>
                    <div className="relative">
                      <MapIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        className="pl-10"
                        {...register("businessAddress.street")}
                        placeholder="Rua das Flores"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        className="pl-10"
                        {...register("businessAddress.number")}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Bairro</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        className="pl-10"
                        {...register("businessAddress.neighborhood")}
                        placeholder="Centro"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        className="pl-10"
                        {...register("businessAddress.city")}
                        placeholder="São Paulo"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        className="pl-10"
                        {...register("businessAddress.state")}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-64 md:h-80 w-full rounded-xl overflow-hidden border border-gray-700 shadow-inner relative z-0">
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
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded z-[400]">
                    Clique no mapa para ajustar o pino
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-900/50 border-b border-gray-800/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                    <Instagram size={20} />
                  </div>
                  Presença Digital
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-3 h-5 w-5 text-pink-500" />
                      <Input
                        className="pl-10"
                        {...register("socialLinks.instagram")}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-3 h-5 w-5 text-blue-600" />
                      <Input
                        className="pl-10"
                        {...register("socialLinks.facebook")}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp (Link)</Label>
                    <div className="relative">
                      <FaWhatsapp className="absolute left-3 top-3 h-5 w-5 text-green-500 z-10" />
                      <Controller
                        name="socialLinks.whatsapp"
                        control={control}
                        render={({ field }) => (
                          <IMaskInput
                            {...field}
                            mask="(00) 00000-0000"
                            className={imaskClass}
                            placeholder="(99) 99999-9999"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        className="pl-10"
                        {...register("socialLinks.website")}
                        placeholder="https://seusite.com.br"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-1 space-y-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={18} className="text-primary" /> Regras de
                  Cancelamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Antecedência Mínima (Horas)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input
                      type="number"
                      className="pl-10"
                      {...register("cancellationMinHours")}
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Define quantas horas antes do agendamento o cliente ainda
                    pode cancelar pelo app. "0" permite sempre.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode size={18} className="text-green-500" /> Recebimento
                  via Pix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo da Chave</Label>
                  <Controller
                    name="pixKeyType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                <div className="space-y-2">
                  <Label>Chave Pix</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input
                      className="pl-10"
                      {...register("pixKey")}
                      placeholder="Sua chave aqui"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 opacity-80 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User size={18} className="text-gray-400" /> Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input className="pl-10" {...register("name")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail de Acesso</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <Input className="pl-10" {...register("email")} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-4 z-10 pt-4">
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                className={cn(
                  "w-full h-12 text-lg font-bold shadow-xl transition-all",
                  isDirty
                    ? "bg-primary hover:bg-primary/90 text-black shadow-primary/20 scale-105"
                    : "bg-gray-800 text-gray-500"
                )}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2" />
                )}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};