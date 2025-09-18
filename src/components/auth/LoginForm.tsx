import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import type { UserProfile } from "../../types";

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
      // 3. Assumindo que a função 'login' da sua store retorna o UserProfile
      const user = await login(data.email, data.password);
      
      // Se o login deu certo e retornou os dados do usuário...
      if (user) {
        // ...executa a função que veio da LoginPage, passando os dados do usuário.
        onLoginSuccess(user);
      }
    } catch (error) {
      // A LoginPage vai cuidar de exibir o erro para o usuário
      console.error("Falha no login:", error);
    }
  };

  // AGORA O RETURN É APENAS O FORMULÁRIO
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campo de E-mail */}
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          {...register("email")}
          type="email"
          placeholder="Seu e-mail"
          className={`input-field pl-10 ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="error-message mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Campo de Senha */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          {...register("password")}
          type="password"
          placeholder="Sua senha"
          className={`input-field pl-10 ${errors.password ? "border-red-500" : ""}`}
        />
        {errors.password && (
          <p className="error-message mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Botão de Login */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="primary-button w-full flex items-center justify-center"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Entrar"}
      </button>
    </form>
  );
};