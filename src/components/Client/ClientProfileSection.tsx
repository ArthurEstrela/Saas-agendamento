import { useState, useEffect, useCallback } from "react"; // [1] Adicionado useCallback
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
  Crop, // [2] Importado ícone de Crop
} from "lucide-react";
import { IMaskInput } from "react-imask";
import { motion, AnimatePresence } from "framer-motion";
import type { ClientProfile } from "../../types";

// Otimização de Imagem
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "../../lib/utils/cropImage";

// UI Components
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";

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
  
  // Estados de Imagem
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // [3] Estados do Cropper
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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

  // [4] Nova lógica de seleção de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("A imagem é muito grande! Escolha uma de até 5MB.");
        return;
      }
      setImageToCrop(URL.createObjectURL(file));
    }
  };

  // [5] Função para processar o corte e otimizar
  const onCropComplete = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const optimizedFile = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        0.8, // Qualidade
        512, // Largura alvo
        512  // Altura alvo
      );

      setProfileImageFile(optimizedFile);
      setPreviewUrl(URL.createObjectURL(optimizedFile));
      setImageToCrop(null); // Fecha o modal
    } catch (e) {
      console.error(e);
      showError("Erro ao processar imagem.");
    }
  }, [imageToCrop, croppedAreaPixels, showError]);

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
        gender: data.gender as ClientProfile["gender"],
        profilePictureUrl: newProfilePictureUrl,
      };

      await updateUserProfile(userProfile.id, updatedProfileData);
      setUserProfile({ ...userProfile, ...updatedProfileData });
      showSuccess("Perfil atualizado!");
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      showError("Erro ao atualizar perfil.");
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

  if (!userProfile)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  const initials = userProfile.name.substring(0, 2).toUpperCase();
  const inputBaseClasses = cn(
    "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors",
    "placeholder:text-gray-500",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:text-gray-400 pl-10"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* [6] MODAL DE RECORTE DO CLIENTE */}
      <AnimatePresence>
        {imageToCrop && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-xl h-[50vh] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-2xl"
            >
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1 / 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </motion.div>
            <div className="mt-6 flex gap-4">
              <Button variant="secondary" onClick={() => setImageToCrop(null)} className="px-8">
                Cancelar
              </Button>
              <Button onClick={onCropComplete} className="font-bold px-8">
                <Crop size={18} className="mr-2" /> Recortar Foto
              </Button>
            </div>
            <div className="mt-4 w-full max-w-md px-4 text-center">
              <Label className="text-gray-400 text-xs uppercase mb-2 block font-medium">Ajustar Zoom</Label>
              <input
                type="range"
                value={zoom} min={1} max={3} step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 size={16} /> Editar
          </Button>
        )}
      </div>

      <div className="bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-gray-900 w-full relative">
          <div className="absolute inset-0 bg-grid-white/5" />
        </div>

        <div className="px-8 pb-8 relative">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-6 -mt-12 mb-8 relative z-10">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-gray-900 shadow-2xl">
                  <AvatarImage
                    src={previewUrl || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl bg-gray-800 font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <label
                    htmlFor="pf-upload"
                    className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <Camera size={24} className="text-white mb-1" />
                    <span className="text-[10px] text-white font-bold uppercase">Alterar</span>
                    <input
                      id="pf-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              <div className="mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {userProfile.name}
                </h2>
                <p className="text-gray-400 text-sm font-medium">Cliente ✨</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input {...register("name")} disabled={!isEditing} className="pl-10" />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input value={userProfile.email} disabled className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Celular / WhatsApp</Label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <IMaskInput
                        {...field}
                        mask="(00) 00000-0000"
                        className={inputBaseClasses}
                        disabled={!isEditing}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  )}
                />
                {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <IMaskInput {...field} mask="000.000.000-00" className={inputBaseClasses} disabled={!isEditing} />
                    </div>
                  )}
                />
                {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <IMaskInput {...field} mask="00/00/0000" className={inputBaseClasses} disabled={!isEditing} />
                    </div>
                  )}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gênero</Label>
<Controller
  name="gender"
  control={control}
  render={({ field }) => (
    <Select 
      key={field.value} // ✨ Adicione esta linha!
      disabled={!isEditing} 
      onValueChange={field.onChange} 
      value={field.value}
    >
      <SelectTrigger className="w-full pl-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-500" />
          <SelectValue placeholder="Selecione" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Masculino">Masculino</SelectItem>
        <SelectItem value="Feminino">Feminino</SelectItem>
        <SelectItem value="Outro">Outro</SelectItem>
        <SelectItem value="Prefiro não dizer">Prefiro não dizer</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
              </div>
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-3"
              >
                <Button variant="ghost" type="button" onClick={cancelEdit} disabled={isSubmitting}>
                  <X size={18} className="mr-2" /> Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px] font-bold">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                  Salvar Perfil
                </Button>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};