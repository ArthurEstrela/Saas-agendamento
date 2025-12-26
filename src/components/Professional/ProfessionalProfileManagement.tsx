import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { UserProfile, ProfessionalProfile } from "../../types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Camera, Save, Loader2, User, FileText, Mail } from "lucide-react";
import { uploadProfilePicture } from "../../firebase/userService";
import toast from "react-hot-toast";

// UI
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";

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

  const profile = userProfile as ProfessionalProfile;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: profile?.name || "", bio: profile?.bio || "" },
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

      <Card className="bg-gray-900/50 border-gray-800 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-amber-900/20 border-b border-gray-800"></div>
        <CardContent className="px-8 pb-8 relative">
          {/* Avatar Upload */}
          <div className="-mt-16 mb-8 flex">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-gray-900 bg-gray-800 shadow-xl">
                <AvatarImage
                  src={profile.profilePictureUrl}
                  className="object-cover"
                />
                <AvatarFallback>
                  <User size={40} className="text-gray-500" />
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all z-10">
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
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <Input
                    id="name"
                    {...register("name")}
                    className="pl-10"
                    error={errors.name?.message}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Login)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-10 opacity-60"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText size={16} /> Sobre mim (Bio)
              </Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Escreva um pouco sobre sua experiência e especialidades..."
                className="min-h-[120px] bg-gray-950 border-gray-700 resize-none"
              />
              <p className="text-xs text-gray-500 text-right">
                {watch("bio")?.length || 0}/300
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800">
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                className="font-bold px-6"
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
        </CardContent>
      </Card>
    </motion.div>
  );
};
