import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useViaCep } from '../../hooks/useViaCep';
import { StepProgressBar } from './StepProgressBar';
import { IMaskInput } from 'react-imask';
import { Loader2 } from 'lucide-react';

const fullSchema = z.object({
  // Step 1
  fullName: z.string().min(3, "Seu nome completo é obrigatório"),
  businessName: z.string().min(3, "Nome do negócio é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  // Step 2
  cnpj: z.string().refine(cnpj => cnpj.replace(/\D/g, '').length === 14, "CNPJ inválido"),
  // Step 3
  zipCode: z.string().refine(zip => zip.replace(/\D/g, '').length === 8, "CEP inválido"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF é obrigatório"),
});

type ProviderFormData = z.infer<typeof fullSchema>;

export const ServiceProviderRegisterForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { signup, isSubmitting, error: authError } = useAuthStore();
  const { address, loading: cepLoading, error: cepError, fetchAddress } = useViaCep();

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, control } = useForm<ProviderFormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange'
  });

  const zipCodeValue = watch('zipCode');
  
  const handleCepBlur = async (cep: string) => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
        await fetchAddress(cep);
    }
  };

  useEffect(() => {
    if (address) {
      setValue('street', address.logradouro, { shouldValidate: true });
      setValue('neighborhood', address.bairro, { shouldValidate: true });
      setValue('city', address.localidade, { shouldValidate: true });
      setValue('state', address.uf, { shouldValidate: true });
    }
  }, [address, setValue]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof ProviderFormData)[] = [];
    if(currentStep === 1) fieldsToValidate = ['fullName', 'businessName', 'email', 'password'];
    if(currentStep === 2) fieldsToValidate = ['cnpj'];
    
    const isValid = await trigger(fieldsToValidate);
    if(isValid) setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const onSubmit: SubmitHandler<ProviderFormData> = (data) => {
    signup(data.email, data.password, data.fullName, 'serviceProvider', {
        businessName: data.businessName,
        cnpj: data.cnpj,
        address: {
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state
        }
    });
  };

  return (
    <>
      <StepProgressBar currentStep={currentStep} totalSteps={3} stepLabels={["Dados Pessoais", "Negócio", "Endereço"]} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Etapa 1: Dados Pessoais e de Acesso */}
        {currentStep === 1 && (
          <>
            <input {...register('fullName')} placeholder="Seu Nome Completo" className="input-field" />
            {errors.fullName && <p className="error-message">{errors.fullName.message}</p>}
            
            <input {...register('businessName')} placeholder="Nome do Negócio" className="input-field" />
            {errors.businessName && <p className="error-message">{errors.businessName.message}</p>}

            <input {...register('email')} placeholder="E-mail de Acesso" className="input-field" />
            {errors.email && <p className="error-message">{errors.email.message}</p>}

            <input {...register('password')} type="password" placeholder="Senha de Acesso" className="input-field" />
            {errors.password && <p className="error-message">{errors.password.message}</p>}
          </>
        )}

        {/* Etapa 2: Documentos */}
        {currentStep === 2 && (
          <>
            <Controller
              name="cnpj"
              control={control}
              render={({ field }) => (
                <IMaskInput
                  {...field}
                  mask="00.000.000/0000-00"
                  placeholder="CNPJ"
                  className="input-field"
                  onAccept={(value) => field.onChange(value)}
                />
              )}
            />
            {errors.cnpj && <p className="error-message">{errors.cnpj.message}</p>}
          </>
        )}

        {/* Etapa 3: Endereço com ViaCEP */}
        {currentStep === 3 && (
         <>
            <div className="relative">
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <IMaskInput
                    {...field}
                    mask="00000-000"
                    placeholder="CEP"
                    className="input-field"
                    onBlur={(e) => {
                      field.onBlur();
                      handleCepBlur(e.target.value);
                    }}
                    onAccept={(value) => field.onChange(value)}
                  />
                )}
              />
              {cepLoading && <Loader2 className="animate-spin h-5 w-5 text-[#daa520] absolute right-3 top-3" />}
            </div>
            {errors.zipCode && <p className="error-message">{errors.zipCode.message}</p>}
            {cepError && <p className="error-message">{cepError}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input {...register('street')} placeholder="Rua / Avenida" className="input-field" />
                {errors.street && <p className="error-message">{errors.street.message}</p>}
              </div>
              <div>
                <input {...register('number')} placeholder="Nº" className="input-field" />
                {errors.number && <p className="error-message">{errors.number.message}</p>}
              </div>
            </div>

            <input {...register('neighborhood')} placeholder="Bairro" className="input-field" />
            {errors.neighborhood && <p className="error-message">{errors.neighborhood.message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input {...register('city')} placeholder="Cidade" className="input-field" />
                {errors.city && <p className="error-message">{errors.city.message}</p>}
              </div>
              <div>
                <input {...register('state')} placeholder="UF" className="input-field" />
                {errors.state && <p className="error-message">{errors.state.message}</p>}
              </div>
            </div>
          </>
        )}
        
        {authError && <p className="error-message text-center">{authError}</p>}

        <div className="flex justify-between items-center pt-4">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="secondary-button">
              Voltar
            </button>
          )}
          <div className="flex-1"></div>
          {currentStep < 3 && (
            <button type="button" onClick={nextStep} className="primary-button ml-auto max-w-[50%]">
              Próximo
            </button>
          )}
          {currentStep === 3 && (
            <button type="submit" disabled={isSubmitting} className="primary-button ml-auto max-w-[50%]">
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Finalizar Cadastro'}
            </button>
          )}
        </div>
      </form>
    </>
  );
};