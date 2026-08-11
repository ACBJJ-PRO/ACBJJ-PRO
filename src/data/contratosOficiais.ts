import { OfficialContract } from '../types';

export const CONTRATOS_INICIAIS: OfficialContract[] = [
  {
    id: 'doc_matricula_regulamento',
    titulo: 'Contrato Oficial de Matrícula e Regulamento Geral da Arena',
    descricao: 'Normas contratuais de prestação de serviços de ensino esportivo, direitos, deveres, exames de graduação e conduta na Arena do Competidor.',
    categoria: 'matricula',
    versao: '1.0',
    status: 'publicado',
    dataAtualizacao: '26/07/2026',
    responsavelNome: 'Mestre / Diretoria Jurídica Arena do Competidor',
    cabecalhoInstitucional: 'ARENA DO COMPETIDOR — SISTEMA OFICIAL DE GESTÃO ESPORTIVA E ARTES MARCIAIS',
    rodapeInstitucional: 'Documento Registrado em Cofre Digital Cryptográfico SHA-256 • Validade Jurídica nos termos da MP 2.200-2/2001 e Lei 14.063/2020.',
    hashSHA256: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
    historicoVersoes: [
      {
        versao: '1.0',
        data: '26/07/2026',
        responsavel: 'Mestre / Diretoria Jurídica',
        hash: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
        descricaoAlteracoes: 'Publicação Inicial da Versão Oficial do Contrato de Matrícula e Regulamento Geral.',
      },
    ],
    capitulos: [
      {
        id: 'cap_1',
        numero: 1,
        titulo: 'CAPÍTULO I — DAS PARTES E DO OBJETO CONTRATUAL',
        subtitulo: 'Cláusula 1ª a 3ª — Qualificação e Finalidade Esportiva',
        conteudo: `Pelo presente instrumento particular de Prestação de Serviços Esportivos e Regulamento Interno, de um lado a ARENA DO COMPETIDOR — CENTRO DE TREINAMENTO E GESTÃO ESPORTIVA, doravante denominada simplesmente "ARENA", e de outro lado o CONTRATANTE/ATLETA, qualificado eletronicamente no ato de seu cadastro na plataforma, acordam e ajustam as seguintes cláusulas:

Cláusula 1ª - Constitui objeto deste contrato a prestação de serviços de instrução, treinamento técnico, preparação física e acompanhamento de graduação nas modalidades de artes marciais oferecidas pela Arena do Competidor.

Cláusula 2ª - A adesão a este contrato dá-se por meio de aceite eletrônico no portal oficial da Arena do Competidor, possuindo pleno valor legal e eficácia executiva extrajudicial.

Cláusula 3ª - O atleta/aluno declara ter ciência de que a prática de artes marciais exige higidez física e mental, responsabilizando-se pela veracidade das informações de saúde prestadas no formulário de anamnese.`,
      },
      {
        id: 'cap_2',
        numero: 2,
        titulo: 'CAPÍTULO II — DAS NORMAS DE CONVIVÊNCIA, ÉTICA E DISCIPLINA NO DOJO',
        subtitulo: 'Cláusula 4ª a 7ª — Código de Conduta e Respeito à Hierarquia Marcial',
        conteudo: `Cláusula 4ª - É dever de todo atleta e praticante respeitar rigorosamente os Mestres, Professores, Instrutores, Árbitros e companheiros de treino, dentro e fora do tatame.

Cláusula 5ª - A utilização do Kimono/Uniforme oficial limpo e devidamente ajustado, bem como a higiene pessoal (unhas cortadas, ausência de adornos metálicos ou rígidos) é condição indispensável para a participação nas sessões de treino.

Cláusula 6ª - Condutas antidesportivas, agressões verbais ou físicas intencionais fora das regras de combate, discriminação de qualquer natureza ou uso indevido do nome da Arena resultarão em sanções disciplinares que variam de advertência por escrito, suspensão temporária até a expulsão sumária.

Cláusula 7ª - A pontualidade nos treinos é obrigatória. O atraso superior a 15 (quinze) minutos sem justificativa prévia impedirá o ingresso na aula correspondente.`,
      },
      {
        id: 'cap_3',
        numero: 3,
        titulo: 'CAPÍTULO III — DO CONTROLE DE FREQUÊNCIA, GRADUAÇÕES E EXAMES DE FAIXA',
        subtitulo: 'Cláusula 8ª a 11ª — Critérios de Evolução e Avaliação Técnica',
        conteudo: `Cláusula 8ª - A evolução de graduação (graus e mudança de faixa) é prerrogativa exclusiva da comissão técnica e do Mestre Responsável da Arena do Competidor, baseada em critérios de assiduidade, desempenho técnico, atitude moral e aprovação em exame oficial.

Cláusula 9ª - O atleta deve manter frequência mínima obrigatória de 75% (setenta e cinco por cento) das aulas ministradas para estar apto à indicação para exame de faixa.

Cláusula 10ª - A emissão de Certificados Oficiais de Graduação é registrada no sistema com selo de autenticidade digital e histórico imutável no perfil do atleta.

Cláusula 11ª - Graduações obtidas em outras academias deverão passar por processo de validação técnica e homologação pela diretoria de arbitragem e ensino da Arena.`,
      },
      {
        id: 'cap_4',
        numero: 4,
        titulo: 'CAPÍTULO IV — DOS DIREITOS E DEVERES DAS PARTES',
        subtitulo: 'Cláusula 12ª a 15ª — Garantias Institucionais e Obrigações do Praticante',
        conteudo: `Cláusula 12ª - São Direitos do Atleta/Aluno:
a) Receber instrução técnica qualificada por professores homologados;
b) Acessar seu histórico de presença, boletim de desempenho e carteira digital de atleta;
c) Participar das seletivas e campeonatos internos promovidos pela Arena do Competidor.

Cláusula 13ª - São Deveres do Atleta/Aluno:
a) Zelar pelas instalações, equipamentos e tatames da Arena;
b) Manter seus dados cadastrais e de contato devidamente atualizados no sistema;
c) Notificar imediatamente a coordenação sobre qualquer lesão ou restrição médica superveniente.`,
      },
      {
        id: 'cap_5',
        numero: 5,
        titulo: 'CAPÍTULO V — DAS MENSALIDADES, CONDIÇÕES FINANCEIRAS E CANCELAMENTO',
        subtitulo: 'Cláusula 16ª a 18ª — Gestão Financeira e Prazos',
        conteudo: `Cláusula 16ª - As mensalidades deverão ser quitadas até a data de vencimento escolhida no ato da matrícula. O inadimplemento superior a 30 (trinta) dias ensejará o bloqueio temporário do check-in nas aulas até a regularização.

Cláusula 17ª - O trancamento de matrícula por razões médicas comprovadas mediante atestado oficial poderá ser efetuado por período máximo de 90 (noventa) dias sem perda da vaga ou prejuízo do plano contratado.

Cláusula 18ª - A solicitação de cancelamento deverá ser formalizada com antecedência mínima de 15 (quinze) dias através dos canais de atendimento ou aba de suporte da plataforma.`,
      },
      {
        id: 'cap_6',
        numero: 6,
        titulo: 'CAPÍTULO VI — DAS DISPOSIÇÕES FINAIS, VALIDADE JURÍDICA E FORO',
        subtitulo: 'Cláusula 19ª a 21ª — Assinatura Digital e Foro de Eleição',
        conteudo: `Cláusula 19ª - As partes reconhecem como válida, eficaz e plenamente vinculante a assinatura deste contrato efetuada mediante aceite eletrônico, confirmação de credenciais ou validação via chave hash SHA-256 gerada pela Arena do Competidor.

Cláusula 20ª - Este contrato vigora a partir do aceite eletrônico e renova-se automaticamente a cada período de matricular ativo.

Cláusula 21ª - Para dirimir quaisquer controvérsias oriundas deste instrumento, as partes elegem o Foro da Comarca da sede da Arena do Competidor, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
      },
    ],
  },
  {
    id: 'doc_lgpd_privacidade',
    titulo: 'Termo de Consentimento para Tratamento de Dados Pessoais (LGPD)',
    descricao: 'Política de privacidade, retenção de dados cadastrais, prontuário esportivo e segurança da informação nos termos da Lei nº 13.709/2018.',
    categoria: 'lgpd',
    versao: '1.0',
    status: 'publicado',
    dataAtualizacao: '26/07/2026',
    responsavelNome: 'Encarregado de Dados (DPO) / Arena do Competidor',
    cabecalhoInstitucional: 'ARENA DO COMPETIDOR — GOVERNANÇA DE DADOS E COMPLIANCE LGPD (LEI 13.709/2018)',
    rodapeInstitucional: 'Termo de Consentimento e Privacidade Armazenado no Cofre Digital • Garantia dos Direitos do Titular de Dados.',
    hashSHA256: 'b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef12345678',
    historicoVersoes: [
      {
        versao: '1.0',
        data: '26/07/2026',
        responsavel: 'DPO / Arena do Competidor',
        hash: 'b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef12345678',
        descricaoAlteracoes: 'Adequação integral às diretrizes da Autoridade Nacional de Proteção de Dados (ANPD).',
      },
    ],
    capitulos: [
      {
        id: 'cap_lgpd_1',
        numero: 1,
        titulo: 'CAPÍTULO I — DO ESCOPO E DAS FINALIDADES DO TRATAMENTO DE DADOS',
        subtitulo: 'Autorização Expressa nos termos dos Artigos 7º e 11 da Lei 13.709/2018',
        conteudo: `O TITULAR DOS DADOS (ou seu responsável legal, no caso de menores de idade) autoriza expressamente a ARENA DO COMPETIDOR a realizar a coleta, armazenamento, processamento, estruturação e utilização de seus dados pessoais e dados pessoais sensíveis (dados de saúde e biometria).

As finalidades exclusivas deste tratamento compreendem:
1. Identificação, autenticação e controle de acesso biométrico/digital às dependências do centro de treinamento;
2. Registro de histórico de graduação, frequência em aulas e pontuação em rankings esportivos;
3. Emissão de certificados, carteiras oficiais de atleta e comprovantes de exame de faixa;
4. Comunicação de horários de treinos, convocações para campeonatos e avisos administrativos urgentes;
5. Cumprimento de obrigações legais, sanitárias e regulatórias da prática esportiva.`,
      },
      {
        id: 'cap_lgpd_2',
        numero: 2,
        titulo: 'CAPÍTULO II — DOS DADOS TRATADOS E MEDIDAS DE SEGURANÇA',
        subtitulo: 'Armazenamento Criptografado e Controle de Acesso',
        conteudo: `Serão objeto de tratamento os seguintes dados:
- Dados Cadastrais: Nome completo, CPF, e-mail, telefone/WhatsApp, data de nascimento, endereço residencial;
- Dados Marciais: Faixa/graduação, professor responsável, data de início nos treinos, pontuação em campeonatos;
- Dados Sensíveis de Saúde: Tipo sanguíneo, alergias declaradas, contatos de emergência e atestados médicos de aptidão física.

A Arena do Competidor compromete-se a adotar medidas de segurança técnicas e administrativas aptas a proteger os dados pessoais contra acessos não autorizados, vazamentos, destruição ou modificação acidental.`,
      },
      {
        id: 'cap_lgpd_3',
        numero: 3,
        titulo: 'CAPÍTULO III — DOS DIREITOS DO TITULAR E REVOGAÇÃO DO CONSENTIMENTO',
        subtitulo: 'Artigo 18 da LGPD — Canal Direto com o Encarregado de Proteção de Dados',
        conteudo: `O Titular tem direito a obter da Arena do Competidor, a qualquer momento e mediante requisição formal através da Central de Suporte / DPO:
a) Confirmação da existência de tratamento e acesso aos dados armazenados;
b) Correção de dados incompletos, inexatos ou desatualizados;
c) Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;
d) Portabilidade dos dados cadastrais a outro prestador de serviço, quando cabível;
e) Revogação do consentimento, ciente de que a revogação poderá inviabilizar a continuidade do acesso aos treinos e participação em campeonatos por razões de segurança regulatória.`,
      },
      {
        id: 'cap_lgpd_4',
        numero: 4,
        titulo: 'CAPÍTULO IV — DO ARMAZENAMENTO NO COFRE DIGITAL E PRAZO DE RETENÇÃO',
        subtitulo: 'Atemporalidade de Registros Históricos e Auditoria',
        conteudo: `Os dados pessoais permanecerão armazenados no Cofre Digital (Google Drive e Firestore Repository da Arena do Competidor) pelo período estritamente necessário ao cumprimento das finalidades esportivas e contratuais.

O histórico de graduações e títulos esportivos será mantido de forma perpétua no acervo histórico da modalidade para salvaguarda da memória desportiva do atleta, salvo expressa oposição do titular nos termos da lei.`,
      },
    ],
  },
  {
    id: 'doc_imagem_voz',
    titulo: 'Termo de Autorização de Uso de Imagem, Voz e Transmissão',
    descricao: 'Cessão de direitos de imagem, fotografia, filmagem e transmissões ao vivo para divulgação institucional e torneios da Arena do Competidor.',
    categoria: 'imagem',
    versao: '1.0',
    status: 'publicado',
    dataAtualizacao: '26/07/2026',
    responsavelNome: 'Departamento de Comunicação e Eventos Arena do Competidor',
    cabecalhoInstitucional: 'ARENA DO COMPETIDOR — DIREITOS DE IMAGEM, TRANSMISSÃO E DIVULGAÇÃO ESPORTIVA',
    rodapeInstitucional: 'Autorização Gratuita e Sem Exclusividade para Cobertura de Eventos e Redes Sociais da Arena.',
    hashSHA256: 'c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    historicoVersoes: [
      {
        versao: '1.0',
        data: '26/07/2026',
        responsavel: 'Depto. de Comunicação & Eventos',
        hash: 'c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        descricaoAlteracoes: 'Adequação para transmissões digitais, streaming e redes sociais da Arena do Competidor.',
      },
    ],
    capitulos: [
      {
        id: 'cap_img_1',
        numero: 1,
        titulo: 'CAPÍTULO I — DO OBJETO E ABRANGÊNCIA DA CESSÃO DE DIREITOS',
        subtitulo: 'Autorização para Fotografias, Vídeos e Depoimentos',
        conteudo: `Pelo presente instrumento, o ATLETA/PARTICIPANTE autoriza a ARENA DO COMPETIDOR, de forma gratuita, irrestrita e sem limitação de território, a fixar, utilizar, reproduzir, transmitir e divulgar sua imagem, voz, nome, biografia esportiva e som em fotografias, gravações audiovisuais, matérias jornalísticas e transmissões ao vivo de treinos, exames de faixa, cerimoniais e campeonatos promovidos pela Arena.`,
      },
      {
        id: 'cap_img_2',
        numero: 2,
        titulo: 'CAPÍTULO II — DOS MEIOS E MÍDIAS DE DIVULGAÇÃO',
        subtitulo: 'Plataformas Digitais, Redes Sociais e Transmissões de Torneios',
        conteudo: `A presente autorização abrange a veiculação do material em:
1. Redes sociais oficiais da Arena do Competidor (Instagram, YouTube, TikTok, Facebook, LinkedIn);
2. Portal web e aplicativo oficial da Arena do Competidor;
3. Transmissões via streaming e canais parceiros de eventos de lutas;
4. Materiais impressos, banners, faixas, troféus e publicações institucionais sem fins comerciais diretos terceirizados.`,
      },
      {
        id: 'cap_img_3',
        numero: 3,
        titulo: 'CAPÍTULO III — DA GRATUIDADE E AUSÊNCIA DE VÍNCULO EMPREGATÍCIO',
        subtitulo: 'Cessão Não Onerosa e Respeito à Dignidade da Pessoa Humana',
        conteudo: `O participante declara que a cessão aqui outorgada é efetuada a título gratuito, não cabendo qualquer remuneração, indenização ou royalties presentes ou futuros pelo uso de sua imagem e voz nos termos acordados.

A Arena do Competidor compromete-se a utilizar as imagens de forma respeitosa, valorizando os princípios morais do esporte e a dignidade humana dos atletas.`,
      },
    ],
  },
];
