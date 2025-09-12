import { useState, useEffect, forwardRef } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import InputMask from 'react-input-mask';
import { 
  Loader2, 
  Instagram, 
  Facebook, 
  Globe, 
  CreditCard, 
  Landmark, // Ícone para Pix
  Banknote, // Ícone para Dinheiro
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  Home
} from 'lucide-react';
import type { PaymentMethod, ServiceProviderProfile } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useViaCep } from '../../hooks/useViaCep';
import { StepProgressBar } from './StepProgressBar';


// Validação com Zod, agora com mensagens mais amigáveis em português.
const schema = z.object({
  // Etapa 1: Dados Pessoais
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Por favor, insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),

  // Etapa 2: Detalhes do Negócio
  businessName: z.string().min(2, "O nome do negócio é obrigatório"),
  cnpj: z.string().refine(cnpj => cnpj.replace(/\D/g, '').length === 14, "CNPJ inválido"),
  businessPhone: z.string().min(14, "O telefone/WhatsApp é obrigatório"),
  areaOfWork: z.string().min(3, "A área de atuação é obrigatória"),

  // Etapa 3: Presença Online
  instagram: z.string().url("Insira uma URL válida para o Instagram").optional().or(z.literal('')),
  facebook: z.string().url("Insira uma URL válida para o Facebook").optional().or(z.literal('')),
  website: z.string().url("Insira uma URL válida para o seu website").optional().or(z.literal('')),
  paymentMethods: z.array(z.string()).optional(),

  // Etapa 4: Endereço
  zipCode: z.string().refine(zip => zip.replace(/\D/g, '').length === 8, "CEP inválido"),
  street: z.string().min(1, "A rua é obrigatória"),
  number: z.string().min(1, "O número é obrigatório"),
  neighborhood: z.string().min(1, "O bairro é obrigatório"),
  city: z.string().min(1, "A cidade é obrigatória"),
  state: z.string().min(2, "O estado (UF) é obrigatório"),
});

type ProviderFormData = z.infer<typeof schema>;

const paymentOptions: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'pix', label: 'Pix', icon: Landmark },
  { id: 'credit_card', label: 'Cartão', icon: CreditCard },
  { id: 'cash', label: 'Dinheiro', icon: Banknote },
];

const InputField = forwardRef(({ icon: Icon, error, ...props }: any, ref) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="text-gray-400" size={20} />
    </div>
    <input 
      {...props}
      ref={ref}
      className={`input-field pl-10 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} 
    />
    {error && <p className="error-message mt-1">{error.message}</p>}
  </div>
));
InputField.displayName = 'InputField';


export const ServiceProviderRegisterForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { signup, isSubmitting, error: authError } = useAuthStore();
  const { address, loading: cepLoading, error: cepError, fetchAddress } = useViaCep();

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, control } = useForm<ProviderFormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched'
  });

  const zipCodeValue = watch('zipCode');

  useEffect(() => {
    if (address) {
      setValue('street', address.logradouro, { shouldValidate: true });
      setValue('neighborhood', address.bairro, { shouldValidate: true });
      setValue('city', address.localidade, { shouldValidate: true });
      setValue('state', address.uf, { shouldValidate: true });
    }
  }, [address, setValue]);

  const handleCepBlur = () => {
    const cleanedZip = zipCodeValue?.replace(/\D/g, '') || '';
    if (cleanedZip.length === 8) {
      fetchAddress(cleanedZip);
    }
  };
  
  const nextStep = async () => {
    let fieldsToValidate: (keyof ProviderFormData)[] = [];
    if (currentStep === 1) fieldsToValidate = ['name', 'email', 'password'];
    if (currentStep === 2) fieldsToValidate = ['businessName', 'cnpj', 'businessPhone', 'areaOfWork'];
    if (currentStep === 3) fieldsToValidate = ['instagram', 'facebook', 'website'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const onSubmit: SubmitHandler<ProviderFormData> = (data) => {
    const additionalData: Partial<ServiceProviderProfile> = {
        businessName: data.businessName,
        cnpj: data.cnpj,
        businessPhone: data.businessPhone,
        areaOfWork: data.areaOfWork,
        socialLinks: {
          instagram: data.instagram,
          facebook: data.facebook,
          website: data.website,
        },
        paymentMethods: data.paymentMethods as PaymentMethod[],
        businessAddress: {
          zipCode: data.zipCode,
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        }
    };
    signup(data.email, data.password, data.name, 'serviceProvider', additionalData);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepProgressBar 
        currentStep={currentStep} 
        totalSteps={4} 
        stepLabels={["Acesso", "Seu Negócio", "Divulgação", "Endereço"]} 
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8 animate-fade-in">
        
        {currentStep === 1 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white text-center">Informações de Acesso</h2>
            <InputField icon={User} error={errors.name} {...register('name')} placeholder="Seu nome completo" />
            <InputField icon={Mail} error={errors.email} {...register('email')} placeholder="Seu melhor email" type="email" />
            <InputField icon={Lock} error={errors.password} {...register('password')} placeholder="Crie uma senha forte" type="password" />
          </section>
        )}

        {currentStep === 2 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white text-center">Sobre o seu Negócio</h2>
            <InputField icon={Building2} error={errors.businessName} {...register('businessName')} placeholder="Nome do estabelecimento" />
            <InputField icon={Briefcase} error={errors.areaOfWork} {...register('areaOfWork')} placeholder="Área de atuação (Ex: Barbearia)" />
            <Controller
              name="cnpj"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Home className="text-gray-400" size={20} /></div>
                  <InputMask
                    {...field}
                    mask="99.999.999/9999-99"
                    placeholder="CNPJ"
                    className={`input-field pl-10 ${errors.cnpj ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.cnpj && <p className="error-message mt-1">{errors.cnpj.message}</p>}
                </div>
              )}
            />
            <Controller
              name="businessPhone"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="text-gray-400" size={20} /></div>
                   <InputMask
                    {...field}
                    mask="(99) 99999-9999"
                    placeholder="Telefone / WhatsApp"
                    className={`input-field pl-10 ${errors.businessPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.businessPhone && <p className="error-message mt-1">{errors.businessPhone.message}</p>}
                </div>
              )}
            />
          </section>
        )}

        {currentStep === 3 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white text-center">Sua Presença Online</h2>
            <p className="text-center text-gray-400 text-sm">Links opcionais para seus clientes te encontrarem.</p>
            <InputField icon={Instagram} error={errors.instagram} {...register('instagram')} placeholder="https://instagram.com/seu_negocio" />
            <InputField icon={Facebook} error={errors.facebook} {...register('facebook')} placeholder="https://facebook.com/seu_negocio" />
            <InputField icon={Globe} error={errors.website} {...register('website')} placeholder="https://seunegocio.com.br" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Formas de Pagamento Aceitas</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentOptions.map(option => (
                  <label key={option.id} className="flex flex-col items-center justify-center gap-2 bg-gray-800 p-4 rounded-lg border-2 border-gray-700 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 transition-all">
                    <input type="checkbox" {...register('paymentMethods')} value={option.id} className="sr-only" />
                    <option.icon className="text-gray-300" size={24} />
                    <span className="text-white text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="space-y-4">
             <h2 className="text-xl font-semibold text-white text-center">Endereço do Estabelecimento</h2>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 sm:col-span-1">
                    <Controller 
                      name="zipCode" 
                      control={control} 
                      render={({ field }) => (
                        <InputMask 
                          {...field}
                          mask="99999-999"
                          placeholder="CEP" 
                          className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
                          onBlur={(e) => {
                            field.onBlur(e);
                            handleCepBlur();
                          }}
                        />
                      )} 
                    />
                    {errors.zipCode && <p className="error-message mt-1">{errors.zipCode.message}</p>}
                </div>
                <div className="col-span-3 sm:col-span-2 relative">
                    <input {...register('street')} placeholder="Rua" className={`input-field ${errors.street ? 'border-red-500' : ''}`} disabled={cepLoading} />
                    {cepLoading && <Loader2 size={18} className="absolute right-3 top-3 animate-spin text-amber-500" />}
                </div>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1"><input {...register('number')} placeholder="Nº" className={`input-field ${errors.number ? 'border-red-500' : ''}`} /></div>
                <div className="col-span-2"><input {...register('neighborhood')} placeholder="Bairro" className={`input-field ${errors.neighborhood ? 'border-red-500' : ''}`} disabled={cepLoading} /></div>
             </div>
             <div className="grid grid-cols-5 gap-4">
                 <div className="col-span-3"><input {...register('city')} placeholder="Cidade" className={`input-field ${errors.city ? 'border-red-500' : ''}`} disabled={cepLoading} /></div>
                 <div className="col-span-2"><input {...register('state')} placeholder="UF" className={`input-field ${errors.state ? 'border-red-500' : ''}`} disabled={cepLoading} /></div>
             </div>
             {cepError && <p className="error-message text-center">{cepError}</p>}
          </section>
        )}
        
        {authError && <p className="error-message text-center">{authError}</p>}

        <div className="flex items-center pt-4 gap-4">
          {currentStep > 1 ? (
            <button type="button" onClick={prevStep} className="secondary-button w-1/3">Voltar</button>
          ) : <div className="w-1/3"></div>}

          {currentStep < 4 && <button type="button" onClick={nextStep} className="primary-button w-2/3">Avançar</button>}
          
          {currentStep === 4 && (
            <button type="submit" disabled={isSubmitting} className="primary-button w-2/3 flex items-center justify-center">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

