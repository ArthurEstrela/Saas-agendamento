import { useState } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IMaskInput } from "react-imask";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  UserCheck,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { uploadProfilePicture } from "../../firebase/userService";
import type { ClientProfile } from "../../types";

// Novos Componentes UI
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// --- Estilos Base do Input (para replicar no IMaskInput) ---
const inputBaseClasses =
  "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

// --- Função de Validação Forte de CPF ---
// Verifica o algoritmo matemático oficial (dígitos verificadores)
const validateCPF = (cpf: string) => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]+/g, "");

  // Verifica tamanho padrão e se todos os dígitos são iguais (ex: 111.111.111-11)
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  let soma = 0;
  let resto;

  // Validação do 1º Dígito Verificador
  for (let i = 1; i <= 9; i++)
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  // Validação do 2º Dígito Verificador
  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

// --- Schema Zod Atualizado ---
const schema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  phoneNumber: z.string().min(14, "O telefone/WhatsApp é obrigatório"),
  
  // Aqui aplicamos a validação forte
  cpf: z
    .string()
    .refine((val) => validateCPF(val), "CPF inválido"),

  dateOfBirth: z.string().min(10, "Data de nascimento é obrigatória"),
  gender: z.string().min(1, "Selecione um gênero"),
});

type ClientFormData = z.infer<typeof schema>;

export const ClientRegisterForm = () => {
  const navigate = useNavigate();
  const { signup, isSubmitting, error: authError } = useAuthStore();

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit: SubmitHandler<ClientFormData> = async (data) => {
    try {
      await signup(data.email, data.password, data.name, "client", {
        phoneNumber: data.phoneNumber,
        cpf: data.cpf,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as ClientProfile["gender"],
      });

      if (profileImage) {
        const user = useAuthStore.getState().user;
        if (user) {
          await uploadProfilePicture(user.uid, profileImage);
        }
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Falha no cadastro do cliente:", error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 animate-fade-in"
      >
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center space-y-4">
          <label htmlFor="profile-picture" className="cursor-pointer group">
            <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600 group-hover:border-primary transition-all overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon
                  className="text-gray-400 group-hover:text-primary transition-colors"
                  size={48}
                />
              )}
            </div>
          </label>
          <input
            id="profile-picture"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-sm text-gray-400">
            Clique no ícone para enviar uma foto
          </p>
        </div>

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

        {/* Telefone Mask Input */}
        <Controller
          name="phoneNumber"
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
                    errors.phoneNumber
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          )}
        />

        {/* CPF Mask Input */}
        <Controller
          name="cpf"
          control={control}
          render={({ field }) => (
            <div className="w-full">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <UserCheck className="h-5 w-5" />
                </div>
                <IMaskInput
                  {...field}
                  mask="000.000.000-00"
                  placeholder="CPF"
                  className={cn(
                    inputBaseClasses,
                    "pl-10",
                    errors.cpf
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                />
              </div>
              {errors.cpf && (
                <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                  {errors.cpf.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Data e Gênero */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <div className="w-full">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <IMaskInput
                    {...field}
                    mask="00/00/0000"
                    placeholder="Nascimento"
                    className={cn(
                      inputBaseClasses,
                      "pl-10",
                      errors.dateOfBirth
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    )}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Select Refatorado com Radix UI */}
          <div className="w-full">
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger
                    className={errors.gender ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                    <SelectItem value="Prefiro não dizer">
                      Prefiro não dizer
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="mt-1 text-sm text-destructive animate-fade-in-down">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>

        {authError && (
          <p className="text-sm text-destructive text-center">{authError}</p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
          ) : null}
          Finalizar Cadastro
        </Button>
      </form>
    </div>
  );
};