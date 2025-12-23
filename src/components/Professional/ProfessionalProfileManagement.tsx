// Em src/components/Professional/ProfessionalProfileManagement.tsx

import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { UserProfile, ProfessionalProfile } from "../../types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Camera, Save, Loader2, User, FileText } from "lucide-react";
import { Input } from "../ServiceProvider/ProfileManagement";
import { uploadProfilePicture } from "../../firebase/userService";
import toast from "react-hot-toast";

const professionalSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  bio: z.string().max(300, "Máximo de 300 caracteres").optional(),
});
type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalProfileProps {
  userProfile: UserProfile | null;
}

export const ProfessionalProfileManagement = ({
  userProfile,
}: ProfessionalProfileProps) => {
  const { updateUserProfile, setUserProfile } = useProfileStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Certifique-se de ter atualizado src/types.ts com o campo 'bio'
  const profile = userProfile as ProfessionalProfile;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    setIsUploading(true);
    try {
      const avatarUrl = await uploadProfilePicture(userProfile.id, file);
      if (avatarUrl) {
        await updateUserProfile(userProfile.id, {
          profilePictureUrl: avatarUrl,
        });
        setUserProfile({ ...userProfile, profilePictureUrl: avatarUrl });
        toast.success("Foto atualizada!");
      }
    } catch {
      // ✅ CORREÇÃO: Removemos '(error)' pois não estava sendo usado
      toast.error("Erro ao enviar foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<ProfessionalFormData> = async (data) => {
    if (!userProfile) return;
    setIsSaving(true);
    try {
      await updateUserProfile(userProfile.id, data);
      toast.success("Perfil atualizado!");
      reset(data);
    } catch {
      // ✅ CORREÇÃO: Removemos '(e)' pois não estava sendo usado
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Meu Perfil Profissional
        </h1>
        <p className="text-gray-400">Como você aparece para os clientes.</p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Banner Decorativo */}
        <div className="h-32 bg-gradient-to-r from-amber-600/20 to-amber-900/20 border-b border-gray-700"></div>

        <div className="px-8 pb-8 relative">
          {/* Avatar Sobreposto */}
          <div className="-mt-16 mb-6 flex justify-between items-end">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    className="w-full h-full object-cover"
                    alt={profile.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-gray-600" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                {isUploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera />
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome de Exibição"
                id="name"
                icon={User}
                error={errors.name}
                {...register("name")}
              />
              <Input
                label="Email (Login)"
                id="email"
                icon={User}
                value={profile.email}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FileText size={16} /> Sobre mim (Bio)
              </label>
              <textarea
                {...register("bio")}
                rows={4}
                placeholder="Escreva um pouco sobre sua experiência e especialidades..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
              />
              <p className="text-xs text-gray-500 text-right">
                {watch("bio")?.length || 0}/300
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-700/50">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="bg-amber-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};
