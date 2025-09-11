import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuthStore } from '../../store/authStore';
import { createUserProfile } from '../../firebase/userService';
import type { UserRole } from '../../types';

const registerSchema = z.object({
  fullName: z.string().min(3, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
  confirmPassword: z.string(),
  userType: z.enum(['client', 'serviceProvider']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  setAuthError: (error: string | null) => void;
}

export const RegisterForm = ({ setAuthError }: RegisterFormProps) => {
  const isLoading = useAuthStore((state) => state.isLoading);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onRegister: SubmitHandler<RegisterFormData> = async (data) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await createUserProfile(userCredential.user.uid, data.email, data.fullName, data.userType as UserRole);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as AuthError;
        if (firebaseError.code === 'auth/email-already-in-use') {
          setAuthError("Este email já está em uso.");
        } else {
          setAuthError("Ocorreu um erro ao criar a conta.");
        }
      } else {
        setAuthError("Ocorreu um erro inesperado.");
      }
      console.error("Register error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onRegister)} noValidate>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">Nome Completo</label>
        <input {...register("fullName")} id="fullName" type="text" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        {errors.fullName && <p className="text-red-500 text-xs italic">{errors.fullName.message}</p>}
      </div>
       {/* ... Cole o resto dos campos do formulário de cadastro aqui ... */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="register-email">Email</label>
        <input {...register("email")} id="register-email" type="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="register-password">Senha</label>
        <input {...register("password")} id="register-password" type="password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        {errors.password && <p className="text-red-500 text-xs italic">{errors.password.message}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirmar Senha</label>
        <input {...register("confirmPassword")} id="confirmPassword" type="password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" />
        {errors.confirmPassword && <p className="text-red-500 text-xs italic">{errors.confirmPassword.message}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">Eu sou</label>
        <select {...register("userType")} className="shadow border rounded w-full py-2 px-3 text-gray-700">
          <option value="client">Cliente</option>
          <option value="serviceProvider">Prestador de Serviço</option>
        </select>
      </div>
      <button disabled={isLoading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline disabled:bg-blue-300">
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>
  );
};