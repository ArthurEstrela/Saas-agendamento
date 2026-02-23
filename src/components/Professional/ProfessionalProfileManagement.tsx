import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore"; // ✨ Usar AuthStore
import type { ProfessionalProfile } from "../../types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Camera, Save, Loader2, User, FileText, Mail } from "lucide-react";
import toast from "react-hot-toast";
import {api} from "../../lib/api"; // ✨ Importar a API conectada ao Spring Boot

// UI
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";
import Cropper, { type Area } from "react-easy-crop";
import getCroppedImg from "../../lib/utils/cropImage";

const professionalSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  bio: z.string().max(300, "Máximo de 300 caracteres").optional(),
});
type ProfessionalFormData = z.infer<typeof professionalSchema>;

export const ProfessionalProfileManagement = () => {
  const [avatarToCrop, setAvatarToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // ✨ Puxando o usuário da AuthStore
  const { user } = useAuthStore();
  
  // Usamos um truque aqui: se a API retornar um objeto atualizado, não precisamos do initAuth.
  // Vamos atualizar o estado recarregando a janela temporariamente ou apenas avisando.
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Cast seguro
  const profile = user as ProfessionalProfile;

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande! Escolha uma de até 5MB.");
        return;
      }
      setAvatarToCrop(URL.createObjectURL(file));
    }
  };

  const saveCroppedAvatar = useCallback(async () => {
    if (!avatarToCrop || !croppedAreaPixels || !profile) return;
    setIsUploading(true);
    const loadingToast = toast.loading("Processando foto...");

    try {
      const croppedFile = await getCroppedImg(
        avatarToCrop,
        croppedAreaPixels,
        0.8,
        512, // Tamanho ideal para foto de perfil
        512
      );

      // ✨ Upload migrado para o Spring Boot (via API formData)
      const formData = new FormData();
      formData.append("file", croppedFile);

      // Assumindo que a sua API de profile image siga esta estrutura:
      await api.post("/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setAvatarToCrop(null);
      toast.success("Foto atualizada com sucesso! Recarregue a página para ver. 👨‍🎨");
      
      // Opcional: Se quiser que atualize logo na tela sem F5:
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar foto.");
    } finally {
      setIsUploading(false);
      toast.dismiss(loadingToast);
    }
  }, [avatarToCrop, croppedAreaPixels, profile]);

  const onSubmit: SubmitHandler<ProfessionalFormData> = async (data) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      // ✨ Atualizando perfil via API Java (Endpoint de exemplo, ajuste se necessário)
      await api.put(`/professionals/${profile.id}`, data);
      
      toast.success("Perfil atualizado! Recarregue a página para ver.");
      reset(data);
      
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto pb-10"
    >
      {/* --- AVATAR CROPPER MODAL --- */}
      {avatarToCrop && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xl h-[50vh] bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
            <Cropper
              image={avatarToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1 / 1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="mt-6 flex gap-4">
            <Button variant="secondary" onClick={() => setAvatarToCrop(null)} className="px-8">
              Cancelar
            </Button>
            <Button onClick={saveCroppedAvatar} className="font-bold px-8">
              Salvar Foto
            </Button>
          </div>
          <div className="mt-4 w-full max-w-md px-4">
            <input
              type="range"
              value={zoom} min={1} max={3} step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}
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
                    // error={errors.name?.message} (O componente Input do shadcn puro não costuma ter prop error, ajuste se o seu UI modificado tiver)
                  />
                </div>
                {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
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