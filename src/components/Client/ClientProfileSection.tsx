import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Crop,
} from "lucide-react";
import { IMaskInput } from "react-imask";
import { motion, AnimatePresence } from "framer-motion";

// 🔥 Nossos novos stores refatorados
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";

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
import type { ClientProfile } from "../../types";

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
  // 🔥 Lemos o usuário logado do AuthStore
  const { user } = useAuthStore();

  // 🔥 Usamos o ProfileStore apenas para disparar as chamadas para a API Java
  const {
    updateProfile,
    uploadAvatar,
    loading: isSubmitting,
  } = useProfileStore();

  const [isEditing, setIsEditing] = useState(false);
  const { showSuccess, showError } = useToast();

  // Estados de Imagem
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados do Cropper
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
    // Preenche o formulário com os dados do AuthStore quando o componente monta
    if (user && (user.role === "CLIENT")) {
      // ✨ SEM ANY: Cast tipado e seguro para ClientProfile
      const clientData = user as ClientProfile;

      reset({
        name: clientData.name || "",
        phoneNumber: clientData.phoneNumber || "",
        cpf: clientData.cpf || "",
        dateOfBirth: clientData.dateOfBirth || "",
        gender: clientData.gender || "Prefiro não dizer",
      });
      setPreviewUrl(clientData.profilePictureUrl || null);
    }
  }, [user, reset]);

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

  const onCropComplete = useCallback(async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const optimizedFile = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        0.8, // Qualidade
        512, // Largura alvo
        512, // Altura alvo
      );

      setProfileImageFile(optimizedFile);
      setPreviewUrl(URL.createObjectURL(optimizedFile));
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      showError("Erro ao processar imagem.");
    }
  }, [imageToCrop, croppedAreaPixels, showError]);

  // 🔥 Lógica refatorada: Chama a API Java via Store
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      // 1. Envia a foto primeiro (se houver)
      // Como a função uploadAvatar no store não retorna a URL, nós apenas a chamamos.
      // O próprio store se encarregará de atualizar a foto do user global no Zustand.
      if (profileImageFile) {
        await uploadAvatar(user.id, profileImageFile);
      }

      // 2. Monta o objeto com os dados de texto do perfil
      const updatedProfileData: Partial<ClientProfile> = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        cpf: data.cpf,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
      };

      // 3. Envia para a API Java
      // O store também já atualizará os dados de texto globalmente após o sucesso.
      await updateProfile(user.id, updatedProfileData);

      showSuccess("Perfil atualizado com sucesso!");
      setIsEditing(false);
      setProfileImageFile(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      showError("Falha ao atualizar o perfil. Tente novamente.");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      // ✨ SEM ANY
      const clientData = user as ClientProfile;
      reset({
        name: clientData.name || "",
        phoneNumber: clientData.phoneNumber || "",
        cpf: clientData.cpf || "",
        dateOfBirth: clientData.dateOfBirth || "",
        gender: clientData.gender || "Prefiro não dizer",
      });
      setPreviewUrl(clientData.profilePictureUrl || null);
      setProfileImageFile(null);
    }
  };

  if (!user)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  const initials = user.name.substring(0, 2).toUpperCase();
  const inputBaseClasses = cn(
    "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 shadow-sm transition-colors",
    "placeholder:text-gray-500",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:text-gray-400 pl-10",
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* MODAL DE RECORTE DO CLIENTE */}
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
              <Button
                variant="secondary"
                onClick={() => setImageToCrop(null)}
                className="px-8"
              >
                Cancelar
              </Button>
              <Button onClick={onCropComplete} className="font-bold px-8">
                <Crop size={18} className="mr-2" /> Recortar Foto
              </Button>
            </div>
            <div className="mt-4 w-full max-w-md px-4 text-center">
              <Label className="text-gray-400 text-xs uppercase mb-2 block font-medium">
                Ajustar Zoom
              </Label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
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
                    <span className="text-[10px] text-white font-bold uppercase">
                      Alterar
                    </span>
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
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-gray-400 text-sm font-medium">Cliente ✨</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input
                    {...register("name")}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input value={user.email} disabled className="pl-10" />
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
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <IMaskInput
                        {...field}
                        mask="000.000.000-00"
                        className={inputBaseClasses}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                />
                {errors.cpf && (
                  <p className="text-xs text-red-500">{errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-500 z-10" />
                      <IMaskInput
                        {...field}
                        mask="00/00/0000"
                        className={inputBaseClasses}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-500">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gênero</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
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
                        <SelectItem value="Prefiro não dizer">
                          Prefiro não dizer
                        </SelectItem>
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
                <Button
                  variant="ghost"
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                >
                  <X size={18} className="mr-2" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[140px] font-bold"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
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
