import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import type { UserProfile } from "../../types";

// Componentes UI Padronizados
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const schema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof schema>;

interface LoginFormProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const { login, isSubmitting } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      const user = await login(data.email, data.password);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (error) {
      console.error("Falha no login:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Input de E-mail */}
      <Input
        icon={<Mail className="h-5 w-5" />}
        placeholder="Seu e-mail"
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Input de Senha */}
      <Input
        icon={<Lock className="h-5 w-5" />}
        placeholder="Sua senha"
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Botão de Login */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Entrar"}
      </Button>
    </form>
  );
};