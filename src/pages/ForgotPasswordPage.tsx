import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Mail, Loader2, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import logo from "../assets/stylo-logo.png";
import { motion, AnimatePresence } from "framer-motion";

// UI
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

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
    } catch (err: any) {
      let msg = "Falha no envio. Tente novamente.";
      if (err.code === "auth/user-not-found") msg = "Usuário não encontrado.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white p-4 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src={logo}
              alt="Stylo"
              className="h-10 mx-auto mb-6 opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Recuperar Senha
          </h1>
          <p className="text-gray-400 text-sm">
            Não se preocupe, vamos te ajudar a voltar.
          </p>
        </div>

        <Card className="bg-gray-900/50 backdrop-blur-md border-gray-800 shadow-2xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      E-mail Enviado!
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Verifique sua caixa de entrada (e spam) para redefinir sua
                      senha.
                    </p>
                  </div>
                  <Link to="/login">
                    <Button className="w-full font-bold">
                      <ArrowLeft size={18} className="mr-2" /> Voltar para Login
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center font-medium border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3 text-gray-500 z-10"
                        size={18}
                      />
                      <Input
                        {...register("email")}
                        placeholder="Seu e-mail cadastrado"
                        className="pl-10 bg-gray-950 border-gray-700 h-11"
                        error={errors.email?.message}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-bold h-11"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} className="mr-2" /> Enviar Link de
                        Recuperação
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/login">
            <Button
              variant="link"
              className="text-gray-400 hover:text-white gap-2"
            >
              <ArrowLeft size={16} /> Voltar para o login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
