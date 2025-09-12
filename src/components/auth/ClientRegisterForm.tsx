// src/components/auth/ClientRegisterForm.tsx
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';

const clientSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientRegisterForm = () => {
  const { signup, isSubmitting, error } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema)
  });

  const onSubmit: SubmitHandler<ClientFormData> = (data) => {
    signup(data.email, data.password, data.fullName, 'client');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Inputs para nome, email e senha */}
      <input {...register('fullName')} placeholder="Nome Completo" className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700" />
      {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}

      <input {...register('email')} placeholder="E-mail" className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700" />
      {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

      <input {...register('password')} type="password" placeholder="Senha" className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700" />
      {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

      {error && <p className="text-red-500 text-center">{error}</p>}
      
      <button type="submit" disabled={isSubmitting} className="w-full bg-[#daa520] text-black font-bold p-3 rounded-lg hover:bg-yellow-400 transition-colors">
        {isSubmitting ? 'Criando...' : 'Criar Conta'}
      </button>
    </form>
  );
};