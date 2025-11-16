// Em src/components/Professional/ProfessionalProfileManagement.tsx

import { useState, useEffect } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { UserProfile, ProfessionalProfile } from "../../types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Camera, Save, Loader2, User } from "lucide-react";
import { Input } from "../ServiceProvider/ProfileManagement"; // Reutiliza o 'Input'
import { uploadProfilePicture } from "../../firebase/userService";

// 1. Schema Zod SIMPLES para o profissional
const professionalSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  // Adicione outros campos que o profissional pode editar, ex:
  // bio: z.string().optional(),
});
type ProfessionalFormData = z.infer<typeof professionalSchema>;

// Props que o componente recebe do ProfessionalDashboard
interface ProfessionalProfileProps {
  userProfile: UserProfile | null;
}

export const ProfessionalProfileManagement = ({
  userProfile,
}: ProfessionalProfileProps) => {
  const { updateUserProfile, setUserProfile } = useProfileStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
  });

  // Carrega os dados do profissional no formulário
  useEffect(() => {
    if (userProfile && userProfile.role === "professional") {
      reset(userProfile);
      setAvatarPreview(userProfile.profilePictureUrl || null);
    }
  }, [userProfile, reset]);

  // Handler para salvar dados do formulário
  const onSubmit: SubmitHandler<ProfessionalFormData> = async (data) => {
    if (!userProfile || !isDirty) return;
    setIsSaving(true);

    await updateUserProfile(userProfile.id, data);

    setIsSaving(false);
    reset(data); // Reseta o 'isDirty'
  };

  // Handler para upload de avatar (simplificado)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    setIsUploading(true);
    const tempUrl = URL.createObjectURL(file);
    setAvatarPreview(tempUrl); // Mostra o preview

    try {
      // 3. TODO Resolvido: Chame a função de upload
      const avatarUrl = await uploadProfilePicture(userProfile.id, file);

      // 4. Atualize o perfil no Firestore
      await updateUserProfile(userProfile.id, { profilePictureUrl: avatarUrl });

      // 5. Atualize o estado local (Zustand) para refletir na UI sem recarregar
      setUserProfile({ ...userProfile, profilePictureUrl: avatarUrl });
    } catch (error) {
      console.error("Erro no upload do avatar:", error);
      // Reverte para a imagem antiga se der erro
      if (userProfile.role === "professional") {
        setAvatarPreview(userProfile.profilePictureUrl || null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!userProfile || userProfile.role !== "professional") {
    return <Loader2 className="animate-spin text-amber-500" size={48} />;
  }

  const profile = userProfile as ProfessionalProfile;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Cabeçalho do Perfil */}
        <header className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 rounded-full group flex-shrink-0 border-4 border-gray-800 bg-gray-900">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={64} className="text-gray-600" />
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Camera size={32} />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              className="hidden"
              onChange={handleAvatarUpload}
              accept="image/*"
              disabled={isUploading}
            />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {watch("name") || profile.name}
            </h1>
            <p className="text-gray-400 mt-1">
              Gerencie suas informações pessoais.
            </p>
          </div>
        </header>

        {/* Seção de Informações */}
        <section className="bg-black/30 p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6">
            Meus Dados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Meu Nome"
              id="name"
              icon={User}
              error={errors.name}
              {...register("name")}
            />
            <Input
              label="E-mail de Acesso"
              id="email"
              icon={User}
              defaultValue={profile.email}
              disabled // Email (login) não deve ser trocado aqui
            />
            {/* Adicione outros campos aqui, como 'bio' ou 'telefone' */}
          </div>
        </section>

        {/* Botão Salvar */}
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
