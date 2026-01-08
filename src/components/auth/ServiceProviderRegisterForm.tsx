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
  IdCard,
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

// Componentes UI
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { cn } from "../../lib/utils/cn";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

// --- Correção do Ícone Padrão do Leaflet ---
// @ts-expect-error - Leaflet icon fix involves accessing private property not typed in @types/leaflet
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

const inputBaseClasses =
  "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

// --- ÁREAS DE ATUAÇÃO PRÉ-DEFINIDAS ---
const workAreas = [
  "Barbearia",
  "Salão de Beleza",
  "Manicure e Pedicure",
  "Estética Facial",
  "Estética Corporal",
  "Maquiagem",
  "Massagem",
  "Design de Sobrancelhas",
  "Cílios",
  "Depilação",
  "Tatuagem e Piercing",
  "Podologia",
  "Nutrição",
  "Psicologia",
  "Fisioterapia",
  "Personal Trainer",
  "Outro",
];

// --- FUNÇÕES DE VALIDAÇÃO FORTE ---

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) 
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) 
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
};

// --- VALIDAÇÃO COM ZOD ---
const schema = z
  .object({
    name: z.string().min(3, "Nome completo é obrigatório"),
    email: z.string().email("Por favor, insira um email válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),

    businessName: z.string().min(2, "O nome do negócio é obrigatório"),

    documentType: z.enum(["cpf", "cnpj"]),

    // Validação básica de string aqui, a validação forte ocorre no superRefine
    documentNumber: z.string().min(1, "Documento é obrigatório"),

    businessPhone: z.string().min(14, "O telefone/WhatsApp é obrigatório"),
    areaOfWork: z.string().min(1, "Selecione uma área de atuação"),

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
  })
  .superRefine((data, ctx) => {
    const cleanDoc = data.documentNumber.replace(/\D/g, "");
    
    if (data.documentType === "cpf") {
      if (!validateCPF(cleanDoc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF inválido",
          path: ["documentNumber"],
        });
      }
    } else if (data.documentType === "cnpj") {
      if (!validateCNPJ(cleanDoc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CNPJ inválido",
          path: ["documentNumber"],
        });
      }
    }
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
    clearErrors,
  } = useForm<ProviderFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      documentType: "cnpj",
    },
  });

  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -15.79,
    -47.88,
  ]);
  const [mapZoom, setMapZoom] = useState(4);

  const zipCodeValue = watch("zipCode");
  const streetValue = watch("street");
  const numberValue = watch("number");
  const cityValue = watch("city");
  const documentType = watch("documentType");

  useEffect(() => {
    if (currentStep === 4) {
      const timer = setTimeout(() => {
        clearErrors([
          "zipCode",
          "street",
          "number",
          "neighborhood",
          "city",
          "state",
        ]);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentStep, clearErrors]);

  useEffect(() => {
    if (address && !cepError) {
      if (address.logradouro)
        setValue("street", address.logradouro, { shouldValidate: true });
      if (address.bairro)
        setValue("neighborhood", address.bairro, { shouldValidate: true });
      if (address.localidade)
        setValue("city", address.localidade, { shouldValidate: true });
      if (address.uf) setValue("state", address.uf, { shouldValidate: true });
    }
  }, [address, cepError, setValue]);

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

  const stepsFields: Record<number, (keyof ProviderFormData)[]> = {
    1: ["name", "email", "password"],
    2: [
      "businessName",
      "documentType",
      "documentNumber",
      "businessPhone",
      "areaOfWork",
    ],
    3: ["instagram", "facebook", "website"],
    4: ["zipCode", "street", "number", "neighborhood", "city", "state"],
  };

  const nextStep = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    const fieldsToValidate = stepsFields[currentStep];
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep < 4) {
        nextStep();
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const onSubmit: SubmitHandler<ProviderFormData> = async (data) => {
    if (currentStep !== 4) return;

    const additionalData: Partial<ServiceProviderProfile> = {
      businessName: data.businessName,
      documentType: data.documentType,
      cnpj: data.documentType === "cnpj" ? data.documentNumber : undefined,
      cpf: data.documentType === "cpf" ? data.documentNumber : undefined,
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
        // Assumindo que você já atualizou o types.ts conforme a mensagem anterior
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
        onKeyDown={handleKeyDown}
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

            <Controller
              name="areaOfWork"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger
                      className={errors.areaOfWork ? "border-destructive" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Selecione sua área de atuação" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {workAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.areaOfWork && (
                    <p className="text-sm text-destructive">
                      {errors.areaOfWork.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <Controller
                name="documentType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue("documentNumber", "");
                    }}
                    defaultValue={field.value}
                    className="flex space-x-4 justify-center"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cnpj" id="r-cnpj" />
                      <Label htmlFor="r-cnpj" className="cursor-pointer">
                        Pessoa Jurídica (CNPJ)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cpf" id="r-cpf" />
                      <Label htmlFor="r-cpf" className="cursor-pointer">
                        Pessoa Física (CPF)
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <Controller
              name="documentNumber"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {documentType === "cnpj" ? (
                        <Home className="h-5 w-5" />
                      ) : (
                        <IdCard className="h-5 w-5" />
                      )}
                    </div>
                    <IMaskInput
                      {...field}
                      mask={
                        documentType === "cnpj"
                          ? "00.000.000/0000-00"
                          : "000.000.000-00"
                      }
                      placeholder={documentType === "cnpj" ? "CNPJ" : "CPF"}
                      className={cn(
                        inputBaseClasses,
                        "pl-10",
                        errors.documentNumber
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      )}
                    />
                  </div>
                  {errors.documentNumber && (
                    <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                      {errors.documentNumber.message}
                    </p>
                  )}
                </div>
              )}
            />

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
                Links opcionais.
              </Typography>
            </div>
            <Input
              icon={<Instagram className="h-5 w-5" />}
              error={errors.instagram?.message}
              {...register("instagram")}
              placeholder="Instagram"
            />
            <Input
              icon={<Facebook className="h-5 w-5" />}
              error={errors.facebook?.message}
              {...register("facebook")}
              placeholder="Facebook"
            />
            <Input
              icon={<Globe className="h-5 w-5" />}
              error={errors.website?.message}
              {...register("website")}
              placeholder="Website"
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
                              if (checked)
                                field.onChange([
                                  ...(field.value || []),
                                  option.id,
                                ]);
                              else
                                field.onChange(
                                  field.value?.filter(
                                    (val) => val !== option.id
                                  )
                                );
                            }}
                            className="sr-only"
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
                          errors.zipCode ? "border-destructive" : ""
                        )}
                        onBlur={() => {
                          field.onBlur();
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

            <div className="mt-4">
              <Label>Localização no Mapa</Label>
              <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-700 shadow-sm mt-2">
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
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="w-1/3"
            >
              Voltar
            </Button>
          )}

          <Button
            type={currentStep === 4 ? "submit" : "button"}
            disabled={isSubmitting}
            onClick={currentStep === 4 ? undefined : nextStep}
            className={currentStep === 1 ? "w-full" : "w-2/3"}
          >
            {currentStep === 4 ? (
              <>
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : null}
                Finalizar Cadastro
              </>
            ) : (
              "Avançar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};