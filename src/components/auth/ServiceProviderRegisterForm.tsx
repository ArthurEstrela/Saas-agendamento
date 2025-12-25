import { useState, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IMaskInput } from "react-imask";
import L from "leaflet";
import {
  Loader2,
  Instagram,
  Facebook,
  Globe,
  CreditCard,
  Landmark,
  Banknote,
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  Home,
} from "lucide-react";
import type { PaymentMethod, ServiceProviderProfile } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { useViaCep } from "../../hooks/useViaCep";
import { StepProgressBar } from "./StepProgressBar";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Novos Componentes UI
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { cn } from "../../lib/utils/cn";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

// --- Correção do Ícone Padrão do Leaflet ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// --- COMPONENTES AUXILIARES DO MAPA ---
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapEvents = ({
  onLocationSelect,
}: {
  onLocationSelect: (latlng: L.LatLng) => void;
}) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// --- Estilos Base do Input (para replicar no IMaskInput) ---
const inputBaseClasses =
  "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

// --- VALIDAÇÃO COM ZOD ---
const schema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  businessName: z.string().min(2, "O nome do negócio é obrigatório"),
  cnpj: z
    .string()
    .refine((cnpj) => cnpj.replace(/\D/g, "").length === 14, "CNPJ inválido"),
  businessPhone: z.string().min(14, "O telefone/WhatsApp é obrigatório"),
  areaOfWork: z.string().min(3, "A área de atuação é obrigatória"),
  instagram: z.string().url("URL inválida").optional().or(z.literal("")),
  facebook: z.string().url("URL inválida").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  paymentMethods: z.array(z.string()).optional(),
  zipCode: z
    .string()
    .refine((zip) => zip.replace(/\D/g, "").length === 8, "CEP inválido"),
  street: z.string().min(1, "A rua é obrigatória"),
  number: z.string().min(1, "O número é obrigatório"),
  neighborhood: z.string().min(1, "O bairro é obrigatório"),
  city: z.string().min(1, "A cidade é obrigatória"),
  state: z.string().min(2, "O estado (UF) é obrigatório"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type ProviderFormData = z.infer<typeof schema>;

const paymentOptions: {
  id: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "pix", label: "Pix", icon: Landmark },
  { id: "credit_card", label: "Cartão", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

export const ServiceProviderRegisterForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { signup, isSubmitting, error: authError } = useAuthStore();
  const navigate = useNavigate();
  const {
    address,
    loading: cepLoading,
    error: cepError,
    fetchAddress,
  } = useViaCep();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
    control,
  } = useForm<ProviderFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -15.79, -47.88,
  ]);
  const [mapZoom, setMapZoom] = useState(4);

  const zipCodeValue = watch("zipCode");
  const streetValue = watch("street");
  const numberValue = watch("number");
  const cityValue = watch("city");

  useEffect(() => {
    if (address) {
      setValue("street", address.logradouro, { shouldValidate: true });
      setValue("neighborhood", address.bairro, { shouldValidate: true });
      setValue("city", address.localidade, { shouldValidate: true });
      setValue("state", address.uf, { shouldValidate: true });
    }
  }, [address, setValue]);

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

  const handleCepBlur = () => {
    const cleanedZip = zipCodeValue?.replace(/\D/g, "") || "";
    if (cleanedZip.length === 8) {
      fetchAddress(cleanedZip);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof ProviderFormData)[] = [];
    if (currentStep === 1) fieldsToValidate = ["name", "email", "password"];
    if (currentStep === 2)
      fieldsToValidate = [
        "businessName",
        "cnpj",
        "businessPhone",
        "areaOfWork",
      ];
    if (currentStep === 3)
      fieldsToValidate = ["instagram", "facebook", "website"];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const onSubmit: SubmitHandler<ProviderFormData> = async (data) => {
    const additionalData: Partial<ServiceProviderProfile> = {
      businessName: data.businessName,
      cnpj: data.cnpj,
      businessPhone: data.businessPhone,
      areaOfWork: data.areaOfWork,
      socialLinks: {
        instagram: data.instagram,
        facebook: data.facebook,
        website: data.website,
      },
      paymentMethods: data.paymentMethods as PaymentMethod[],
      businessAddress: {
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        lat: position?.lat,
        lng: position?.lng,
      },
      subscriptionStatus: "trial",
    };
    try {
      await signup(
        data.email,
        data.password,
        data.name,
        "serviceProvider",
        additionalData
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Falha no cadastro:", error);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepProgressBar
        currentStep={currentStep}
        totalSteps={4}
        stepLabels={["Acesso", "Seu Negócio", "Divulgação", "Endereço"]}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 mt-8 animate-fade-in"
      >
        {/* STEP 1: Acesso */}
        {currentStep === 1 && (
          <section className="space-y-4">
            <Typography variant="h3" className="text-center">
              Informações de Acesso
            </Typography>

            <Input
              icon={<User className="h-5 w-5" />}
              error={errors.name?.message}
              {...register("name")}
              placeholder="Seu nome completo"
            />

            <Input
              icon={<Mail className="h-5 w-5" />}
              error={errors.email?.message}
              {...register("email")}
              placeholder="Seu melhor email"
              type="email"
            />

            <Input
              icon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
              {...register("password")}
              placeholder="Crie uma senha forte"
              type="password"
            />
          </section>
        )}

        {/* STEP 2: Negócio */}
        {currentStep === 2 && (
          <section className="space-y-4">
            <Typography variant="h3" className="text-center">
              Sobre o seu Negócio
            </Typography>

            <Input
              icon={<Building2 className="h-5 w-5" />}
              error={errors.businessName?.message}
              {...register("businessName")}
              placeholder="Nome do estabelecimento"
            />

            <Input
              icon={<Briefcase className="h-5 w-5" />}
              error={errors.areaOfWork?.message}
              {...register("areaOfWork")}
              placeholder="Área de atuação (Ex: Barbearia)"
            />

            {/* CNPJ Mask Input styled to look like ui/input */}
            <Controller
              name="cnpj"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Home className="h-5 w-5" />
                    </div>
                    <IMaskInput
                      {...field}
                      mask="00.000.000/0000-00"
                      placeholder="CNPJ"
                      className={cn(
                        inputBaseClasses,
                        "pl-10",
                        errors.cnpj
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      )}
                    />
                  </div>
                  {errors.cnpj && (
                    <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                      {errors.cnpj.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Phone Mask Input */}
            <Controller
              name="businessPhone"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Phone className="h-5 w-5" />
                    </div>
                    <IMaskInput
                      {...field}
                      mask="(00) 00000-0000"
                      placeholder="Telefone / WhatsApp"
                      className={cn(
                        inputBaseClasses,
                        "pl-10",
                        errors.businessPhone
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      )}
                    />
                  </div>
                  {errors.businessPhone && (
                    <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                      {errors.businessPhone.message}
                    </p>
                  )}
                </div>
              )}
            />
          </section>
        )}

        {/* STEP 3: Divulgação */}
        {currentStep === 3 && (
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <Typography variant="h3">Sua Presença Online</Typography>
              <Typography variant="small" className="text-gray-400">
                Links opcionais para seus clientes te encontrarem.
              </Typography>
            </div>

            <Input
              icon={<Instagram className="h-5 w-5" />}
              error={errors.instagram?.message}
              {...register("instagram")}
              placeholder="https://instagram.com/seu_negocio"
            />

            <Input
              icon={<Facebook className="h-5 w-5" />}
              error={errors.facebook?.message}
              {...register("facebook")}
              placeholder="https://facebook.com/seu_negocio"
            />

            <Input
              icon={<Globe className="h-5 w-5" />}
              error={errors.website?.message}
              {...register("website")}
              placeholder="https://seunegocio.com.br"
            />

            <div>
              <Label className="block mb-3 text-center">
                Formas de Pagamento Aceitas
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {paymentOptions.map((option) => (
                  <Controller
                    key={option.id}
                    name="paymentMethods"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => {
                      const isChecked = field.value?.includes(option.id);
                      return (
                        <label
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                            isChecked
                              ? "border-primary bg-primary/10"
                              : "border-gray-700 bg-gray-800 hover:border-gray-600"
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value || []),
                                  option.id,
                                ]);
                              } else {
                                field.onChange(
                                  field.value?.filter(
                                    (val) => val !== option.id
                                  )
                                );
                              }
                            }}
                            className="sr-only" // Esconde o checkbox real, usamos o card como trigger
                          />
                          <option.icon
                            className={cn(
                              "h-6 w-6",
                              isChecked ? "text-primary" : "text-gray-300"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isChecked ? "text-primary" : "text-white"
                            )}
                          >
                            {option.label}
                          </span>
                        </label>
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* STEP 4: Endereço */}
        {currentStep === 4 && (
          <section className="space-y-4">
            <Typography variant="h3" className="text-center">
              Endereço do Estabelecimento
            </Typography>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <Controller
                  name="zipCode"
                  control={control}
                  render={({ field }) => (
                    <div className="w-full">
                      <IMaskInput
                        {...field}
                        mask="00000-000"
                        placeholder="CEP"
                        className={cn(
                          inputBaseClasses,
                          errors.zipCode
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        )}
                        onBlur={(e) => {
                          field.onBlur(e);
                          handleCepBlur();
                        }}
                      />
                      {errors.zipCode && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.zipCode.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  icon={<MapPin className="h-5 w-5" />}
                  error={errors.street?.message}
                  {...register("street")}
                  placeholder="Endereço"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Input
                  error={errors.number?.message}
                  {...register("number")}
                  placeholder="Nº"
                />
              </div>
              <div className="col-span-2">
                <Input
                  error={errors.neighborhood?.message}
                  {...register("neighborhood")}
                  placeholder="Bairro"
                  disabled={cepLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <Input
                  error={errors.city?.message}
                  {...register("city")}
                  placeholder="Cidade"
                  disabled={cepLoading}
                />
              </div>
              <div className="col-span-2">
                <Input
                  error={errors.state?.message}
                  {...register("state")}
                  placeholder="UF"
                  disabled={cepLoading}
                />
              </div>
            </div>

            {cepError && (
              <p className="text-sm text-destructive text-center">{cepError}</p>
            )}

            <div className="mt-4">
              <Label>Localização no Mapa</Label>
              <Typography variant="small" className="text-gray-400 mb-2 block">
                A posição será encontrada automaticamente. Clique no mapa para
                ajustar.
              </Typography>
              <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-700 shadow-sm">
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
            </div>
          </section>
        )}

        {authError && (
          <p className="text-sm text-destructive text-center">{authError}</p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center pt-4 gap-4">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="w-1/3"
            >
              Voltar
            </Button>
          ) : (
            <div className="w-1/3"></div>
          )}

          {currentStep < 4 && (
            <Button type="button" onClick={nextStep} className="w-2/3">
              Avançar
            </Button>
          )}

          {currentStep === 4 && (
            <Button type="submit" disabled={isSubmitting} className="w-2/3">
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : null}
              Finalizar Cadastro
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
