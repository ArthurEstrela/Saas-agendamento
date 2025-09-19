import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfileStore } from "../../store/profileStore";
import {
  updateUserProfile,
  uploadProfilePicture,
} from "../../firebase/userService";

import {
  Loader2,
  User,
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Edit,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { IMaskInput } from "react-imask";
import type { ClientProfile } from "../../types";

// Schema de validação para a edição do perfil
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para o upload da foto
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

  // Popula o formulário com os dados do perfil quando o componente carrega ou o perfil muda
  useEffect(() => {
    if (userProfile && userProfile.role === 'client') {
      reset({
        name: userProfile.name,
        phoneNumber: userProfile.phoneNumber,
        cpf: userProfile.cpf,
        dateOfBirth: userProfile.dateOfBirth,
        gender: userProfile.gender,
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
    setSuccessMessage(null);

    try {
      let newProfilePictureUrl = userProfile.profilePictureUrl;

      // 1. Faz o upload da nova foto, se houver
      if (profileImageFile) {
        newProfilePictureUrl = await uploadProfilePicture(
          userProfile.id,
          profileImageFile
        );
      }

      // 2. Prepara os dados para atualização
      const updatedProfileData: Partial<ClientProfile> = {
        // ... outras propriedades
      name: data.name,
      phoneNumber: data.phoneNumber,
      cpf: data.cpf,
      dateOfBirth: data.dateOfBirth,
      // 1. Faça a correção aqui
      gender: data.gender as ClientProfile['gender'],
        profilePictureUrl: newProfilePictureUrl,
      };

      // 3. Atualiza o perfil no Firestore
      await updateUserProfile(userProfile.id, updatedProfileData);

      // 4. Atualiza o estado local na store
      setUserProfile({ ...userProfile, ...updatedProfileData });

      setSuccessMessage("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      // Aqui você pode adicionar uma notificação de erro (toast)
    } finally {
      setIsSubmitting(false);
      setProfileImageFile(null); // Limpa o arquivo após o envio
    }
  };

  // Função para cancelar a edição
  const cancelEdit = () => {
    setIsEditing(false);
    // Reseta o formulário para os valores originais
    if (userProfile && userProfile.role === 'client') {
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
    return <Loader2 className="animate-spin text-amber-500" size={48} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
      </div>

      {successMessage && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-lg mb-6 flex items-center gap-3">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-black/30 p-8 rounded-2xl">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Informações Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Coluna da Foto */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gray-700 flex items-center justify-center border-4 border-amber-500/50">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-gray-400" size={64} />
                  )}
                </div>
                {isEditing && (
                  <label
                    htmlFor="profile-picture-upload"
                    className="absolute -bottom-2 -right-2 bg-amber-500 p-3 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                  >
                    <Edit size={20} className="text-gray-900" />
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
            </div>

            {/* Coluna de Dados */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="label-text">Nome Completo</label>
                <div className="input-container">
                  <User className="input-icon" />
                  <input
                    {...register("name")}
                    className="input-field pl-10"
                    disabled={!isEditing}
                  />
                </div>
                {errors.name && (
                  <p className="error-message">{errors.name.message}</p>
                )}
              </div>

              {/* Email (não editável) */}
              <div>
                <label className="label-text">Email</label>
                <div className="input-container">
                  <Mail className="input-icon" />
                  <input
                    value={userProfile.email}
                    className="input-field pl-10 bg-gray-800 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="label-text">Telefone</label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <div className="input-container">
                      <Phone className="input-icon" />
                      <IMaskInput
                        {...field}
                        mask="(00) 00000-0000"
                        className="input-field pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                />
                {errors.phoneNumber && (
                  <p className="error-message">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* CPF */}
              <div>
                <label className="label-text">CPF</label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <div className="input-container">
                      <UserCheck className="input-icon" />
                      <IMaskInput
                        {...field}
                        mask="000.000.000-00"
                        className="input-field pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                />
                {errors.cpf && (
                  <p className="error-message">{errors.cpf.message}</p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="label-text">Data de Nascimento</label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div className="input-container">
                      <Calendar className="input-icon" />
                      <IMaskInput
                        {...field}
                        mask="00/00/0000"
                        className="input-field pl-10"
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                />
                {errors.dateOfBirth && (
                  <p className="error-message">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Gênero */}
              <div>
                <label className="label-text">Gênero</label>
                <div className="input-container">
                  <select
                    {...register("gender")}
                    className="input-field"
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
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={cancelEdit}
              className="secondary-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button flex items-center justify-center w-40"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        )}
      </form>
      <div className="mt-5">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 primary-button"
          >
            <Edit size={18} />
            Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
};
