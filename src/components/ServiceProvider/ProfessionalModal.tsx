import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Professional, Service } from "../../types";
import { Loader2, User, Image as ImageIcon, Mail, Key } from "lucide-react";

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

const professionalSchema = z.object({
  name: z.string().min(3, "O nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
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
      <DialogContent className="sm:max-w-[550px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {isEditMode ? "Editar Profissional" : "Novo Profissional"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="pro-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 py-2"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Upload Foto */}
            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer group relative"
              >
                <Avatar className="h-24 w-24 border-2 border-dashed border-gray-600 group-hover:border-primary transition-colors">
                  <AvatarImage
                    src={previewUrl || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-800">
                    <ImageIcon className="text-gray-500 group-hover:text-primary transition-colors" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium">
                    Alterar
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
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    {...register("name")}
                    className="pl-9"
                    error={errors.name?.message}
                  />
                </div>
              </div>

              {!isEditMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de Acesso</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        {...register("email")}
                        className="pl-9"
                        placeholder="email@exemplo.com"
                        error={errors.email?.message}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Provisória</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        className="pl-9"
                        placeholder="••••••••"
                        error={errors.password?.message}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Seleção de Serviços */}
          <div className="space-y-3">
            <Label>Serviços Realizados</Label>
            {availableServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-950/50 p-4 rounded-xl border border-gray-800 max-h-48 overflow-y-auto custom-scrollbar">
                <Controller
                  name="serviceIds"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <>
                      {availableServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-800/50 transition-colors"
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
                          <label
                            htmlFor={`srv-${service.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-300"
                          >
                            {service.name}
                          </label>
                        </div>
                      ))}
                    </>
                  )}
                />
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-800/50 rounded-lg text-sm text-gray-500">
                Nenhum serviço cadastrado.
              </div>
            )}
            {errors.serviceIds && (
              <p className="text-xs text-destructive">
                {errors.serviceIds.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" form="pro-form" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Salvar Profissional
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
