import { useAuthStore } from '../../store/authStore';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

type LoginFormData = z.infer<typeof loginSchema>;

// A interface de props não é mais necessária, então podemos removê-la.
export const LoginForm = () => {
  const { login, isSubmitting } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  // A função de submit agora é mais limpa.
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    await login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input 
          {...register('email')} 
          type="email"
          placeholder="seu@email.com" 
          className="input-field" 
        />
        {errors.email && <p className="error-message">{errors.email.message}</p>}
      </div>

      <div>
        <input 
          {...register('password')} 
          type="password" 
          placeholder="Sua senha" 
          className="input-field" 
        />
        {errors.password && <p className="error-message">{errors.password.message}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="primary-button flex items-center justify-center"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Entrar'}
      </button>
    </form>
  );
};
