import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Mail, Loader2, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config"; // Importa a instância de autenticação do Firebase
import logo from "../assets/stylo-logo.png";
import { motion, AnimatePresence } from "framer-motion";

// Schema de validação
const schema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido"),
});

type ForgotPasswordFormData = z.infer<typeof schema>;

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, data.email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Erro ao enviar e-mail de redefinição:", err);
      let errorMessage = "Ocorreu um erro ao tentar redefinir a senha.";

      // Mapeamento de erros comuns do Firebase
      if (typeof err === "object" && err !== null && "code" in err) {
        const firebaseError = err as { code: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
          case "auth/invalid-email":
            errorMessage = "Usuário não encontrado ou e-mail inválido.";
            break;
          default:
            errorMessage = "Falha no envio. Tente novamente mais tarde.";
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Stylo" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Esqueci a Senha</h1>
          <p className="text-gray-400">
            Informe seu e-mail para receber um link de redefinição.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6"
            >
              <CheckCircle size={64} className="text-green-400 mx-auto" />
              <p className="text-lg text-white font-semibold">
                E-mail Enviado!
              </p>
              <p className="text-gray-400">
                Verifique sua caixa de entrada (e spam) para encontrar o link de
                redefinição.
              </p>
              <Link
                to="/login"
                className="primary-button flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Voltar para o Login
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error && (
                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-center border border-red-500/30">
                  {error}
                </div>
              )}

              {/* Campo de E-mail */}
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Seu e-mail cadastrado"
                  className={`input-field pl-10 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="error-message mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send size={20} /> Enviar Link
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-gray-400">
          <Link
            to="/login"
            className="font-semibold text-[#daa520] hover:text-yellow-400 flex items-center justify-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar para o login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
