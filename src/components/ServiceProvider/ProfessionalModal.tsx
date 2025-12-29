import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Professional, Service } from "../../types";
import { Loader2, User, Image as ImageIcon, Mail, Key, ShieldAlert } from "lucide-react";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";

const professionalSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .optional(),
  serviceIds: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

const professionalEditSchema = professionalSchema.extend({
  password: z.string().optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfessionalFormData, photoFile: File | null) => void;
  professional?: Professional | null;
  availableServices: Service[];
  isLoading: boolean;
}

export const ProfessionalModal = ({
  isOpen,
  onClose,
  onSave,
  professional,
  availableServices,
  isLoading,
}: ProfessionalModalProps) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    professional?.photoURL || null
  );
  const isEditMode = !!professional;
  // Verifica se é o dono para bloquear edição de email/senha
  const isOwner = professional?.isOwner; 

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(
      isEditMode ? professionalEditSchema : professionalSchema
    ),
  });

  useEffect(() => {
    if (isOpen) {
      if (professional) {
        reset({
          name: professional.name,
          serviceIds: professional.services.map((s) => s.id),
          email: professional.email || "",
        });
        setPreviewUrl(professional.photoURL || null);
      } else {
        reset({ name: "", email: "", password: "", serviceIds: [] });
        setPreviewUrl(null);
      }
      setPhotoFile(null);
    }
  }, [professional, reset, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = (data: ProfessionalFormData) => onSave(data, photoFile);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            {isEditMode ? "Editar Profissional" : "Novo Profissional"}
            {isOwner && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-normal">
                Perfil Principal
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Alerta para o Dono */}
        {isOwner && (
          <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 py-2">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Para alterar seu e-mail de acesso ou senha, utilize as configurações da sua conta. Aqui você edita apenas seus dados públicos de atendimento.
            </AlertDescription>
          </Alert>
        )}

        <form
          id="pro-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 py-2"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Upload Foto */}
            <div className="flex flex-col items-center gap-3">
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer group relative"
              >
                <Avatar className="h-28 w-28 border-2 border-dashed border-gray-600 group-hover:border-primary transition-colors">
                  <AvatarImage
                    src={previewUrl || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-800">
                    <ImageIcon className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <span className="text-xs text-white font-medium">
                    Alterar Foto
                  </span>
                </div>
              </Label>
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Dados Pessoais */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    {...register("name")}
                    className="pl-9 bg-gray-950/50 border-gray-800"
                    error={errors.name?.message}
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>

              {/* Campos de Login (Email/Senha) - Bloqueados ou Ocultos para o Dono */}
              {!isOwner && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        {...register("email")}
                        className="pl-9 bg-gray-950/50 border-gray-800"
                        placeholder="email@exemplo.com"
                        error={errors.email?.message}
                        disabled={isEditMode} // Email não editável após criação para evitar conflitos de Auth
                      />
                    </div>
                    {isEditMode && <p className="text-[10px] text-gray-500">O e-mail não pode ser alterado após a criação.</p>}
                  </div>
                  
                  {/* Senha só aparece na criação */}
                  {!isEditMode && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha Provisória</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          id="password"
                          type="password"
                          {...register("password")}
                          className="pl-9 bg-gray-950/50 border-gray-800"
                          placeholder="••••••••"
                          error={errors.password?.message}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Seleção de Serviços */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Serviços Realizados</Label>
              <span className="text-xs text-gray-500">Selecione o que este profissional faz</span>
            </div>
            
            {availableServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-950/30 p-3 rounded-xl border border-gray-800 max-h-48 overflow-y-auto custom-scrollbar">
                <Controller
                  name="serviceIds"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <>
                      {availableServices.map((service) => (
                        <label
                          key={service.id}
                          htmlFor={`srv-${service.id}`}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer border border-transparent hover:border-gray-700"
                        >
                          <Checkbox
                            id={`srv-${service.id}`}
                            checked={field.value.includes(service.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, service.id])
                                : field.onChange(
                                    field.value.filter(
                                      (value) => value !== service.id
                                    )
                                  );
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200 leading-none">
                              {service.name}
                            </span>
                            <span className="text-[10px] text-gray-500 mt-0.5">
                              {service.duration} min • R$ {service.price}
                            </span>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                />
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-950/30 border border-dashed border-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">
                  Você ainda não cadastrou serviços no sistema.
                </p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0">
                  Ir para Serviços
                </Button>
              </div>
            )}
            {errors.serviceIds && (
              <p className="text-xs text-destructive animate-pulse">
                {errors.serviceIds.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="pro-form" disabled={isLoading} className="shadow-lg shadow-primary/10">
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};