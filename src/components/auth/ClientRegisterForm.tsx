import { useState } from "react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IMaskInput } from "react-imask";
import {
  Loader2,
  User,
  Mail, // Ícone de Email
  Lock, // Ícone de Senha
  Phone,
  Calendar,
  UserCheck,
  Image as ImageIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { uploadProfilePicture } from "../../firebase/userService";
import type { ClientProfile } from "../../types";

// Schema de validação completo
const schema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  phoneNumber: z.string().min(14, "O telefone/WhatsApp é obrigatório"),
  cpf: z
    .string()
    .refine((cpf) => cpf.replace(/\D/g, "").length === 11, "CPF inválido"),
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
        gender: data.gender as  ClientProfile['gender'],
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
          <label htmlFor="profile-picture" className="cursor-pointer">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-500 hover:border-amber-500 transition-all">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <ImageIcon className="text-gray-400" size={48} />
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

        {/* Nome Completo */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register("name")}
            placeholder="Seu nome completo"
            className={`input-field pl-10 ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="error-message">{errors.name.message}</p>
          )}
        </div>

        {/* E-mail - ADICIONADO DE VOLTA */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register("email")}
            placeholder="Seu melhor email"
            type="email"
            className={`input-field pl-10 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>
        
        {/* Senha - ADICIONADO DE VOLTA */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register("password")}
            placeholder="Crie uma senha forte"
            type="password"
            className={`input-field pl-10 ${errors.password ? "border-red-500" : ""}`}
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}
        </div>

        {/* Telefone */}
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <IMaskInput
                {...field}
                mask="(00) 00000-0000"
                placeholder="Telefone / WhatsApp"
                className={`input-field pl-10 ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
              />
              {errors.phoneNumber && (
                <p className="error-message">{errors.phoneNumber.message}</p>
              )}
            </div>
          )}
        />

        {/* CPF */}
        <Controller
          name="cpf"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <IMaskInput
                {...field}
                mask="000.000.000-00"
                placeholder="CPF"
                className={`input-field pl-10 ${errors.cpf ? "border-red-500" : ""}`}
              />
              {errors.cpf && (
                <p className="error-message">{errors.cpf.message}</p>
              )}
            </div>
          )}
        />

        {/* Data de Nascimento e Gênero */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <IMaskInput
                  {...field}
                  mask="00/00/0000"
                  placeholder="Nascimento"
                  className={`input-field pl-10 ${
                    errors.dateOfBirth ? "border-red-500" : ""
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="error-message">{errors.dateOfBirth.message}</p>
                )}
              </div>
            )}
          />
          <div className="relative">
            <select
              {...register("gender")}
              className={`input-field ${errors.gender ? "border-red-500" : ""}`}
            >
              <option value="">Gênero...</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
              <option value="Prefiro não dizer">Prefiro não dizer</option>
            </select>
            {errors.gender && (
              <p className="error-message">{errors.gender.message}</p>
            )}
          </div>
        </div>

        {authError && <p className="error-message text-center">{authError}</p>}

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-button w-full flex items-center justify-center"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Finalizar Cadastro"
          )}
        </button>
      </form>
    </div>
  );
};