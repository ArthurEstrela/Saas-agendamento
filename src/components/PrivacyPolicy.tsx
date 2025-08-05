// src/components/PrivacyPolicy.tsx
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 md:p-12 rounded-xl border border-gray-700">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Política de Privacidade da Stylo</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 04 de agosto de 2025</p>

        <div className="space-y-6 prose prose-invert prose-lg max-w-none">
          <p>A sua privacidade é importante para nós. É política da Stylo respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar na nossa plataforma.</p>
          
          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">1. Informações que Coletamos</h2>
          <p>Coletamos informações que você nos fornece diretamente, como quando cria uma conta, preenche um formulário ou se comunica conosco. As informações podem incluir:</p>
          <ul>
            <li><strong>Informações da Conta:</strong> Nome, endereço de e-mail, número de telefone e senha.</li>
            <li><strong>Informações do Perfil do Profissional:</strong> Nome do negócio, endereço, serviços oferecidos, preços e horários de funcionamento.</li>
            <li><strong>Informações de Agendamento:</strong> Informações sobre os serviços que você agenda através da nossa plataforma.</li>
            <li><strong>Informações de Pagamento:</strong> Processamos pagamentos através de parceiros seguros. Não armazenamos os detalhes completos do seu cartão de crédito.</li>
          </ul>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">2. Como Usamos as Suas Informações</h2>
          <p>Usamos as informações que coletamos para operar, manter e melhorar a nossa plataforma. Os usos incluem:</p>
          <ul>
            <li>Facilitar o agendamento e a comunicação entre Clientes e Profissionais.</li>
            <li>Processar transações e enviar informações relacionadas, como confirmações e faturas.</li>
            <li>Enviar notificações técnicas, atualizações, alertas de segurança e mensagens de suporte e administrativas.</li>
            <li>Personalizar a sua experiência na plataforma.</li>
            <li>Monitorizar e analisar tendências, uso e atividades em conexão com os nossos serviços.</li>
          </ul>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">3. Compartilhamento de Informações</h2>
          <p>Não compartilhamos as suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:</p>
          <ul>
            <li><strong>Com o seu consentimento:</strong> Podemos compartilhar informações quando você nos dá o seu consentimento explícito para fazê-lo.</li>
            <li><strong>Entre Utilizadores:</strong> Compartilhamos informações entre Clientes e Profissionais conforme necessário para facilitar o agendamento (ex: nome do cliente, serviço agendado).</li>
            <li><strong>Para Cumprimento da Lei:</strong> Podemos divulgar informações se acreditarmos que a divulgação é exigida por lei, regulamento ou processo legal.</li>
            <li><strong>Prestadores de Serviços:</strong> Trabalhamos com prestadores de serviços terceirizados que nos ajudam a operar a plataforma (ex: processamento de pagamentos, análise de dados).</li>
          </ul>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">4. Segurança dos Dados</h2>
          <p>Empregamos medidas de segurança técnicas e organizacionais para proteger as suas informações contra acesso, alteração, divulgação ou destruição não autorizados. No entanto, nenhum sistema de segurança é impenetrável e não podemos garantir a segurança absoluta das suas informações.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">5. Seus Direitos e Escolhas</h2>
          <p>Você pode rever, corrigir ou excluir as informações da sua conta a qualquer momento, fazendo login na sua conta. Se desejar desativar a sua conta, entre em contato conosco, mas saiba que podemos reter certas informações conforme exigido por lei ou para fins comerciais legítimos.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">6. Cookies</h2>
          <p>Usamos cookies e tecnologias de rastreamento semelhantes para acessar ou armazenar informações. Os cookies ajudam-nos a analisar o tráfego da web e a melhorar a sua experiência no site.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">7. Alterações a Esta Política</h2>
          <p>Podemos atualizar esta política de privacidade de tempos em tempos. Notificaremos sobre quaisquer alterações publicando a nova política de privacidade nesta página. Aconselhamos que você reveja esta política periodicamente para quaisquer alterações.</p>
          
          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">8. Contato</h2>
          <p>Se tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco em: <a href="mailto:privacidade@stylo.com" className="text-yellow-500 hover:underline">privacidade@stylo.com</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
