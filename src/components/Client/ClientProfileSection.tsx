import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfileStore } from "../../store/profileStore";
import {
  updateUserProfile,
  uploadProfilePicture,
} from "../../firebase/userService";
import { useToast } from "../../hooks/useToast";
import {
  Loader2,
  User,
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Edit2,
  Camera,
  Save,
  X,
  UserCircle,
} from "lucide-react";
import { IMaskInput } from "react-imask";
import { motion } from "framer-motion"; // Adicionei animações suaves
import type { ClientProfile } from "../../types";

// Schema de validação
const profileSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  phoneNumber: z.string().min(14, "O telefone é obrigatório"),
  cpf: z
    .string()
    .refine((cpf) => cpf.replace(/\D/g, "").length === 11, "CPF inválido"),
  dateOfBirth: z.string().min(10, "Data de nascimento é obrigatória"),
  gender: z.string().min(1, "Selecione um gênero"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ClientProfileSection = () => {
  const { userProfile, setUserProfile } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (userProfile && userProfile.role === "client") {
      reset({
        name: userProfile.name,
        phoneNumber: userProfile.phoneNumber || "",
        cpf: userProfile.cpf || "",
        dateOfBirth: userProfile.dateOfBirth || "",
        gender: userProfile.gender || "Prefiro não dizer",
      });
      setPreviewUrl(userProfile.profilePictureUrl || null);
    }
  }, [userProfile, reset]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!userProfile) return;
    setIsSubmitting(true);

    try {
      let newProfilePictureUrl = userProfile.profilePictureUrl;

      if (profileImageFile) {
        newProfilePictureUrl = await uploadProfilePicture(
          userProfile.id,
          profileImageFile
        );
      }

      const updatedProfileData: Partial<ClientProfile> = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        cpf: data.cpf,
        dateOfBirth: data.dateOfBirth,
        // Correção de tipagem segura
        gender: data.gender as ClientProfile["gender"],
        profilePictureUrl: newProfilePictureUrl,
      };

      await updateUserProfile(userProfile.id, updatedProfileData);
      setUserProfile({ ...userProfile, ...updatedProfileData });

      showSuccess("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      showError("Falha ao atualizar o perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setProfileImageFile(null);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (userProfile && userProfile.role === "client") {
      reset({
        name: userProfile.name,
        phoneNumber: userProfile.phoneNumber,
        cpf: userProfile.cpf,
        dateOfBirth: userProfile.dateOfBirth,
        gender: userProfile.gender,
      });
      setPreviewUrl(userProfile.profilePictureUrl || null);
      setProfileImageFile(null);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#daa520]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="primary-button flex items-center gap-2 text-sm px-4 py-2"
          >
            <Edit2 size={16} />
            Editar Dados
          </button>
        )}
      </div>

      <div className="bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        {/* Banner Decorativo */}
        <div className="h-32 bg-gradient-to-r from-[#daa520]/20 to-gray-900 w-full relative">
          <div className="absolute inset-0 bg-grid-white/5" />
        </div>

        <div className="px-8 pb-8 relative">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Seção de Foto (Avatar sobrepondo o banner) */}
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6 -mt-12 mb-8 relative z-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gray-900 border-4 border-gray-800 shadow-2xl overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="text-gray-600 w-20 h-20" />
                  )}

                  {/* Overlay de Edição da Foto */}
                  {isEditing && (
                    <label
                      htmlFor="profile-picture-upload"
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Camera size={24} className="text-white mb-1" />
                      <span className="text-[10px] text-white font-medium uppercase tracking-wide">
                        Alterar
                      </span>
                      <input
                        id="profile-picture-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                {/* Badge de status (opcional) */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-gray-800 rounded-full"></div>
              </div>

              <div className="mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {userProfile.name}
                </h2>
                <p className="text-gray-400 text-sm">Cliente</p>
              </div>
            </div>

            {/* Inputs do Formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Nome Completo
                </label>
                <div
                  className={`input-container transition-colors ${
                    isEditing
                      ? "bg-gray-900"
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <User
                    className={`input-icon ${
                      isEditing ? "text-[#daa520]" : "text-gray-600"
                    }`}
                  />
                  <input
                    {...register("name")}
                    className={`input-field pl-10 ${
                      !isEditing && "text-gray-300"
                    }`}
                    disabled={!isEditing}
                    placeholder="Seu nome"
                  />
                </div>
                {errors.name && (
                  <p className="error-message">{errors.name.message}</p>
                )}
              </div>

              {/* Email (Fixo) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  E-mail
                </label>
                <div className="input-container bg-transparent border-gray-700/50 opacity-70">
                  <Mail className="input-icon text-gray-600" />
                  <input
                    value={userProfile.email}
                    className="input-field pl-10 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Celular / WhatsApp
                </label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field: { onChange, ref, ...fieldProps } }) => (
                    <div
                      className={`input-container transition-colors ${
                        isEditing
                          ? "bg-gray-900"
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      <Phone
                        className={`input-icon ${
                          isEditing ? "text-[#daa520]" : "text-gray-600"
                        }`}
                      />
                      <IMaskInput
                        {...fieldProps} // Passa value, onBlur, name, etc. (MENOS onChange e ref)
                        mask="(00) 00000-0000"
                        inputRef={ref} // IMaskInput usa inputRef em vez de ref
                        className={`input-field pl-10 ${
                          !isEditing && "text-gray-300"
                        }`}
                        disabled={!isEditing}
                        placeholder="(00) 00000-0000"
                        onAccept={(value: string) => {
                          onChange(value);
                        }}
                      />
                    </div>
                  )}
                />
                {errors.phoneNumber && (
                  <p className="error-message">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  CPF
                </label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <div
                      className={`input-container transition-colors ${
                        isEditing
                          ? "bg-gray-900"
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      <UserCheck
                        className={`input-icon ${
                          isEditing ? "text-[#daa520]" : "text-gray-600"
                        }`}
                      />
                      <IMaskInput
                        {...field}
                        mask="000.000.000-00"
                        className={`input-field pl-10 ${
                          !isEditing && "text-gray-300"
                        }`}
                        disabled={!isEditing}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  )}
                />
                {errors.cpf && (
                  <p className="error-message">{errors.cpf.message}</p>
                )}
              </div>

              {/* Nascimento */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Data de Nascimento
                </label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div
                      className={`input-container transition-colors ${
                        isEditing
                          ? "bg-gray-900"
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      <Calendar
                        className={`input-icon ${
                          isEditing ? "text-[#daa520]" : "text-gray-600"
                        }`}
                      />
                      <IMaskInput
                        {...field}
                        mask="00/00/0000"
                        className={`input-field pl-10 ${
                          !isEditing && "text-gray-300"
                        }`}
                        disabled={!isEditing}
                        placeholder="DD/MM/AAAA"
                      />
                    </div>
                  )}
                />
                {errors.dateOfBirth && (
                  <p className="error-message">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Gênero
                </label>
                <div
                  className={`input-container transition-colors ${
                    isEditing
                      ? "bg-gray-900"
                      : "bg-transparent border-transparent"
                  }`}
                >
                  {/* Truque visual para manter ícone alinhado no select */}
                  <User
                    className={`input-icon ${
                      isEditing ? "text-[#daa520]" : "text-gray-600"
                    }`}
                  />
                  <select
                    {...register("gender")}
                    className={`input-field pl-10 appearance-none ${
                      !isEditing && "text-gray-300"
                    }`}
                    disabled={!isEditing}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="error-message">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Rodapé com Ações (Só aparece se estiver editando) */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3"
              >
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="secondary-button flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary-button flex items-center gap-2 w-40 justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
