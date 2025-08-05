// src/components/TermsOfUse.tsx
import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 md:p-12 rounded-xl border border-gray-700">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Termos de Uso da Stylo</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: 04 de agosto de 2025</p>

        <div className="space-y-6 prose prose-invert prose-lg max-w-none">
          <p>Bem-vindo à Stylo! Estes Termos de Uso ("Termos") governam o seu acesso e uso da nossa plataforma de agendamento online. Ao aceder ou usar a nossa plataforma, você concorda em cumprir estes Termos.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">1. Definições</h2>
          <ul>
            <li><strong>"Plataforma"</strong> refere-se ao software, website e serviços fornecidos pela Stylo.</li>
            <li><strong>"Utilizador Cliente"</strong> refere-se a qualquer pessoa que utiliza a Plataforma para encontrar e agendar serviços.</li>
            <li><strong>"Utilizador Profissional"</strong> refere-se a qualquer empresa ou indivíduo que se regista na Plataforma para oferecer os seus serviços.</li>
            <li><strong>"Conteúdo"</strong> refere-se a todo o texto, imagens, dados e outras informações na Plataforma.</li>
          </ul>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">2. Contas de Utilizador</h2>
          <p>Para aceder a certas funcionalidades, você deve registar-se e criar uma conta. Você concorda em fornecer informações precisas, atuais e completas durante o processo de registo. Você é responsável por salvaguardar a sua palavra-passe e por todas as atividades que ocorram na sua conta.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">3. Serviços de Agendamento</h2>
          <p>A Stylo fornece uma plataforma para que Utilizadores Clientes possam agendar serviços com Utilizadores Profissionais. A Stylo não é parte de qualquer acordo de serviço estabelecido entre os utilizadores. Não somos responsáveis pela qualidade, segurança ou legalidade dos serviços prestados pelos Utilizadores Profissionais.</p>
          <p>Os Utilizadores Profissionais são responsáveis por definir a sua própria disponibilidade, preços e políticas de cancelamento, que devem ser claramente comunicadas na sua página de perfil.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">4. Pagamentos e Cancelamentos</h2>
          <p>A Stylo pode facilitar o processamento de pagamentos, mas não armazena informações de cartão de crédito. Todas as transações são processadas através de gateways de pagamento seguros de terceiros.</p>
          <p>As políticas de cancelamento e reembolso são definidas por cada Utilizador Profissional. Os Utilizadores Clientes devem rever estas políticas antes de agendar um serviço.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">5. Conduta do Utilizador</h2>
          <p>Você concorda em não usar a Plataforma para:</p>
          <ul>
            <li>Publicar qualquer conteúdo falso, enganoso, difamatório ou ilegal.</li>
            <li>Violar quaisquer leis locais, estaduais, nacionais ou internacionais.</li>
            <li>Assediar, ameaçar ou prejudicar outro utilizador.</li>
            <li>Tentar obter acesso não autorizado aos nossos sistemas ou redes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">6. Propriedade Intelectual</h2>
          <p>Todo o conteúdo na Plataforma, incluindo o logótipo da Stylo, design e software, é propriedade exclusiva da Stylo e dos seus licenciadores. Você não pode usar, copiar, adaptar ou modificar qualquer parte da nossa Plataforma sem a nossa permissão prévia por escrito.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">7. Rescisão</h2>
          <p>Podemos suspender ou rescindir o seu acesso à Plataforma a qualquer momento, por qualquer motivo, incluindo a violação destes Termos. Após a rescisão, o seu direito de usar a Plataforma cessará imediatamente.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">8. Limitação de Responsabilidade</h2>
          <p>A Stylo não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados ou outras perdas intangíveis, resultantes do seu acesso ou uso, ou incapacidade de aceder ou usar, a Plataforma.</p>

          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">9. Alterações aos Termos</h2>
          <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Se fizermos alterações, iremos notificá-lo publicando os Termos atualizados na Plataforma. O seu uso continuado da Plataforma após a publicação das alterações constitui a sua aceitação dos novos Termos.</p>
          
          <h2 className="text-2xl font-bold text-yellow-400 !mt-10">10. Contato</h2>
          <p>Se tiver alguma dúvida sobre estes Termos, por favor, entre em contato connosco através do email: <a href="mailto:suporte@stylo.com" className="text-yellow-500 hover:underline">suporte@stylo.com</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
