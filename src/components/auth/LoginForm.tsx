import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import type { UserProfile } from "../../types";

// UI Components
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 animate-fade-in"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-gray-500 pointer-events-none z-10">
            <Mail className="h-5 w-5" />
          </div>
          <Input
            placeholder="Seu e-mail"
            type="email"
            className="pl-10 h-11 bg-gray-800/50 border-gray-700 focus:bg-gray-800 transition-colors"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="relative">
          <div className="absolute left-3 top-2.5 text-gray-500 pointer-events-none z-10">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            placeholder="Sua senha"
            type="password"
            className="pl-10 h-11 bg-gray-800/50 border-gray-700 focus:bg-gray-800 transition-colors"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-base font-bold shadow-lg shadow-primary/10 mt-2"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
        ) : (
          <div className="flex items-center gap-2">
            <LogIn size={18} /> Entrar
          </div>
        )}
      </Button>
    </form>
  );
};
