import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  setAuthError: (error: string | null) => void;
}

export const LoginForm = ({ setAuthError }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isLoading = useAuthStore((state) => state.isLoading);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onLogin: SubmitHandler<LoginFormData> = async (data) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error) {
      setAuthError("Email ou senha inválidos.");
      console.error("Login error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onLogin)} noValidate>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login-email">Email</label>
        <input {...register("email")} id="login-email" type="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
      </div>
      <div className="mb-6 relative">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login-password">Senha</label>
        <input {...register("password")} id="login-password" type={showPassword ? 'text' : 'password'} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 top-6">
          {showPassword ? <FaEyeSlash onClick={() => setShowPassword(false)} className="cursor-pointer" /> : <FaEye onClick={() => setShowPassword(true)} className="cursor-pointer" />}
        </div>
        {errors.password && <p className="text-red-500 text-xs italic">{errors.password.message}</p>}
      </div>
      <button disabled={isLoading} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline disabled:bg-blue-300">
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};