export type UserRole = 'admin' | 'professor' | 'aluno' | 'instrutor' | 'arbitro';

export function calculatePersonAge(birthDateString?: string): number {
  if (!birthDateString) return 99;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return 99;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isAdultPerson(person: { dataNascimento?: string; cpf?: string; responsavelNome?: string; contatoEmergenciaNome?: string; tipo?: string }): boolean {
  if (person.tipo === 'admin' || person.tipo === 'professor' || person.tipo === 'instrutor') return true;
  if (person.cpf && person.cpf.startsWith('INF-')) return false;
  if (person.dataNascimento) {
    const age = calculatePersonAge(person.dataNascimento);
    return age >= 18;
  }
  return true;
}

export interface User {
  id: number;
  email: string;
  senha: string;
  nome: string;
  tipo: UserRole;
  aprovado: boolean;
  status?: string;
  fotoPerfil: string;
  whatsapp: string;
  endereco: string;
  tipoSangue: string;
  alergico: string;
  dataNascimento: string;
  genero?: string;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  academia?: string;
  professorResponsavelId?: number;
  professorResponsavelNome?: string;
  perfilLabel?: string;
  dataInicioTreino?: string;
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  cpf?: string;
  rg?: string;
  isCpfProvisorio?: boolean;
  cpfProvisorioDataCriacao?: string;
  cpfProvisorioSubstituidoEm?: string;
  cpfProvisorioSubstituidoPor?: string;
  cpfProvisorioAnterior?: string;
  faixa?: string;
  graduacao?: string;
  turma?: string;
  turmaId?: string;
  statusAnuidade?: string;
  statusMensalidade?: string;
  exameSaudeData?: string;
  peso?: string;
  altura?: string;
  observacoesMedicas?: string;
  cidade?: string;
  estado?: string;
  dataAprovacao?: string;
  dataCadastro?: string;
  createdAt?: string;
  dataInscricao?: string;
}

export interface Student {
  id: number;
  usuarioId: number | null;
  nome: string;
  email?: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  genero?: string;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  academia?: string;
  endereco: string;
  cidade?: string;
  estado?: string;
  whatsapp: string;
  tipoSangue: string;
  alergico: string;
  faixa: string;
  graduacao?: string;
  graus?: number;
  fotoPerfil: string;
  ativo: boolean;
  status?: string;
  presencas?: number;
  checkins: string[]; // dates in YYYY-MM-DD
  pontosCompeticao: number;
  notaAvaliacao: number | null;
  mediaGeral: number;
  medalhasOuro: number;
  medalhasPrata: number;
  medalhasBronze: number;
  professorResponsavelId?: number;
  professorResponsavelNome?: string;
  turma?: string;
  turmaId?: string;
  dataInicioTreino?: string;
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  isCpfProvisorio?: boolean;
  cpfProvisorioDataCriacao?: string;
  cpfProvisorioSubstituidoEm?: string;
  cpfProvisorioSubstituidoPor?: string;
  cpfProvisorioAnterior?: string;
  historicoProvas?: any[];
  historicoGraduacoes?: any[];
  dataAprovacao?: string;
  dataCadastro?: string;
  createdAt?: string;
}

export interface Professor {
  id: number;
  nome: string;
  email: string;
  aprovado: boolean;
  cpf?: string;
  whatsapp?: string;
  faixa?: string;
  grau?: string;
  usuarioId?: number;
  turmasResponsaveis?: string[];
}

export interface CheckinRequest {
  id?: string;
  alunoId: number;
  alunoNome?: string;
  data: string; // YYYY-MM-DD
  turma?: string;
  status?: string;
  dataHora?: string;
  tipoCheckin?: string;
  turmaId?: string;
  userId?: string;
}

export interface ProfessorCheckinRecord {
  id: string;
  usuarioId: number;
  nome: string;
  cargo: 'professor' | 'instrutor' | string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss
  timestamp: number;
  status: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO';
  adminResponsavelNome?: string;
  adminResponsavelId?: number;
  dataConfirmacao?: string;
  motivoRejeicao?: string;
}

export interface Notification {
  id: string;
  texto: string;
  data: string;
  para: string; // 'Todos os alunos', specific name, or category
  de: string;
  titulo?: string;
  hora?: string;
  categoria?: 'Aula' | 'Evento' | 'Campeonato' | 'Aviso' | 'Financeiro' | 'Sistema' | 'IA' | 'Suporte' | 'Personalizado' | string;
  prioridade?: 'Normal' | 'Importante' | 'Urgente';
  status?: 'Enviada' | 'Lida' | 'Não Lida' | 'Pendente' | 'Arquivada' | 'Agendada' | 'Falha';
  visualizacoes?: number;
  lidaPor?: string[]; // Array of user keys/IDs who read this notification
  arquivada?: boolean;
  agendadaPara?: string; // Scheduled date/time
  turma?: string;
  faixaTarget?: string;
  equipeTarget?: string;
  tipo?: 'enviada' | 'recebida' | 'sistema';
}

export interface ClassUnit {
  id: string;
  nome: string;
  horario: string;
  diaSemana?: string;
  status?: 'aguardando' | 'confirmado' | 'cancelado';
  professorId?: number;
  professorNome?: string;
  locked?: boolean;
}

export interface MensalidadeAluno {
  id: string;
  alunoId: string;
  alunoNome?: string;
  valor: number;
  valorOriginal: number;
  desconto: number;
  competencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'Pendente' | 'Em Análise' | 'Pago' | 'Atrasado' | 'Cancelado' | 'Estornado';
  metodoPagamento?: string;
  transactionId?: string;
  pixTxid?: string;
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamQuestion {
  numero: number;
  tipo: 'objetiva' | 'discursiva';
  pergunta: string;
  pontuacao: number;
  opcaoA?: string;
  opcaoB?: string;
  opcaoC?: string;
  opcaoD?: string;
  opcaoE?: string;
  respostaCorreta: string; // Correct letter (A-E) or teacher's key answer
}

export interface SentExam {
  id: number;
  alunoId: number | 'todos';
  tipo: 'objetiva' | 'discursiva';
  tituloProva: string;
  questoes: ExamQuestion[];
  pontuacaoTotal: number;
  data: string;
  enviadoPor: string;
  respostas: {
    [studentId: number]: {
      [questionIndex: number]: string; // A-E or discursive text
    };
  };
  notas: {
    [studentId: number]: number; // graded point value
  };
}

export interface NewsItem {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: 'noticia' | 'aviso' | 'urgente';
  data: string;
  autor: string;
}

export interface VideoItem {
  id: number;
  titulo: string;
  descricao: string;
  url: string;
  videoId: string | null; // YouTube ID if applicable
  arquivoLocal: string | null; // Base64 data if local upload
  tipoFonte: 'youtube' | 'local';
  data: string;
  autor: string;
}

export interface LiveSponsor {
  id: string;
  nome: string;
  imagemUrl: string; // banner URL or base64
  tempoExibicaoSegundos: number; // default e.g. 15
  ativo: boolean;
}

export interface LiveStreamItem {
  id: string;
  titulo: string;
  descricao: string;
  dataHoraAgendada: string; // ISO string
  duracaoMinutos?: number;
  professorId?: number;
  professorNome: string;
  status: 'agendada' | 'ao_vivo' | 'pausada' | 'encerrada' | 'cancelada';
  publicoAlvo: 'todos' | 'professores' | 'instrutores' | 'competidores' | 'turma' | 'categoria' | 'usuarios';
  turmaTarget?: string;
  categoriaTarget?: string;
  usuariosTargetIds?: number[];
  
  // Transmission Provider Architecture
  tipoProvedor?: 'google_meet' | 'estudio_arena' | 'zoom' | 'teams' | 'youtube' | 'vimeo';
  
  // Google Meet integration
  meetUrl: string; // Google Meet URI
  meetSpaceName?: string;
  
  // Google Drive & Recording
  driveFileId?: string;
  driveFolderId?: string;
  gravacaoUrl?: string; // Recording stream or video URL
  gravacaoStatus?: 'processando' | 'disponivel' | 'expirada';
  dataExpiracaoGravacao?: string; // ISO date (15 days default)
  diasRetencao: number; // default 15
  
  // Championship link
  isCampeonato?: boolean;
  campeonatoId?: string | number;
  campeonatoNome?: string;
  
  // Real-time Sponsors
  patrocinadorAtivoId?: string | null;
  patrocinadores: LiveSponsor[];
  
  createdAt: string;
}

export interface CertificateItem {
  id: number;
  alunoId: number;
  alunoNome: string;
  nomeArquivo: string;
  arquivoPDF: string; // Base64 data URL
  data: string;
  enviadoPor: string;
}

export interface BirthdayWishes {
  id: number;
  alunoId: number;
  data: string; // YYYY-MM-DD
  de: string;
  automatico: boolean;
  mensagem: string;
}

export interface EvaluationCycle {
  id: string;
  nome: string; // e.g. "1º Semestre 2026"
  status: 'ativo' | 'encerrado';
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  dataEncerramento?: string;
  encerradoPor?: string;
}

export interface EvaluationCriteriaConfig {
  id: string;
  nome: string;
  peso: number;
  descricao?: string;
}

export interface EvaluationSettings {
  notaMinima: number; // default 7.0
  frequenciaMinima: number; // default 75 (%)
  criterios: EvaluationCriteriaConfig[];
}

export interface StudentEvaluationRecord {
  id: string;
  cicloId: string;
  alunoId: number;
  alunoNome: string;
  alunoCpf?: string;
  alunoFaixa: string;
  alunoTurma?: string;
  professorId?: number;
  professorNome: string;
  dataAvaliacao: string;
  
  // Criteria grades: map of criteria id/key -> grade (0 to 10)
  notas: Record<string, number>;
  
  // Automatic theoretical exam score
  teoriaConceitosNota?: number;

  // Computed evaluation details
  mediaFinal: number;
  presencasConfirmadas: number;
  totalAulasRealizadas: number;
  frequenciaPercent: number; // 0 to 100
  
  // Status
  aprovado: boolean;
  motivoReprovacao?: string; // Reason if reproved
  
  observacoes?: string;
  dataGraduacaoSugerida?: string;
}

export interface TrainingSchedule {
  id: string;
  diaSemana: string;
  horario: string;
  status: 'aguardando' | 'confirmado' | 'cancelado';
  professorId?: number;
  professorNome?: string;
  nomeTurma?: string;
  locked?: boolean;
}

export interface PublicidadeItem {
  id: string;
  imagemUrl: string; // URL or base64
  paginas: string[]; // List of pages where it should appear
  slideNumero?: number;
  nomeEmpresa?: string; // Nome da Empresa / Patrocinador (referência interna)
  linkUrl?: string; // URL da Publicidade (link de destino)
  status?: 'ativa' | 'arquivada'; // Status da campanha
  dataCriacao?: string; // Data de criação
  dataUltimaEdicao?: string; // Data da última alteração
  visualizacoes?: number; // Contador de visualizações
  cliques?: number; // Contador de cliques
  historicoCliques?: { dataHora: string; pagina: string }[]; // Registro detalhado de cliques
}

export interface JustificativaFalta {
  id: string;
  alunoId: number;
  alunoNome: string;
  turma?: string;
  horario?: string;
  professorNome?: string;
  data: string; // YYYY-MM-DD (data da aula)
  dataEnvio?: string;
  motivo: string;
  status: 'pendente' | 'aprovada' | 'rejeitada'; // pendente | aprovada (Presença Justificada) | rejeitada (Falta)
  resposta?: string;
  analisadoPor?: string;
  dataAnalise?: string;
}

export interface RecuperacaoSenha {
  id: string;
  cpf: string;
  email?: string;
  data: string;
  status: 'pendente' | 'resolvido';
}

export interface CarteirinhaConfig {
  corPrincipal: string;
  corSecundaria: string;
  usarGradient: boolean;

  logoPrincipalUrl: string;
  logoUsarBranca: boolean;
  logoPosicao: 'esquerda' | 'centro' | 'direita';

  textoMarcaDagua: string;
  opacidadeMarcaDagua: number;
  posicaoMarcaDagua: 'centro' | 'inferior-direita' | 'superior-esquerda';
  fonteMarcaDagua?: string;
  tamanhoFonteMarcaDagua?: number;
  offsetXMarcaDagua?: number;
  offsetYMarcaDagua?: number;
  rotacaoMarcaDagua?: number;

  nomeInstituicao: string;
  numeroAcademia: string;
  localizacaoTexto: string;
  exibirBandeiraBrasil: boolean;

  exibirFoto: boolean;
  exibirNome: boolean;
  exibirRegistro: boolean;
  exibirProfessor: boolean;
  exibirTurma: boolean;
  exibirGraduacao: boolean;
  exibirValidade: boolean;
  exibirLocalizacao: boolean;
  exibirQrCode: boolean;
  exibirMarcaDagua: boolean;
  exibirStatus: boolean;
  exibirNumeroAcademia: boolean;

  // Personalização do Verso
  versoCorPrincipal?: string;
  versoCorSecundaria?: string;
  versoUsarGradient?: boolean;

  versoLogoExibir?: boolean;
  versoLogoPosicao?: 'esquerda' | 'centro' | 'direita';
  versoLogoTamanho?: number;

  versoMarcaDaguaExibir?: boolean;
  versoMarcaDaguaPosicao?: 'centro' | 'inferior-direita' | 'superior-esquerda';
  versoMarcaDaguaOpacidade?: number;
  versoMarcaDaguaTamanho?: number;
  versoMarcaDaguaOffsetX?: number;
  versoMarcaDaguaOffsetY?: number;
  versoMarcaDaguaRotacao?: number;

  versoQrPosicao?: 'centro' | 'esquerda' | 'direita';
  versoQrTamanho?: number;

  versoCodigoPosicao?: 'centro' | 'esquerda' | 'direita';
  versoCodigoFonte?: string;
  versoCodigoTamanho?: number;

  versoExibirRegistro?: boolean;
  versoExibirValidade?: boolean;
  versoExibirStatus?: boolean;
  versoExibirMensagem?: boolean;
  versoMensagemSeguranca?: string;
}

export interface CarteirinhaCredential {
  id?: string;
  credentialId: string;
  entityType?: 'user' | 'student';
  entityId?: number | string;
  userId: number | string;
  userNome: string;
  userTipo?: string;
  fotoPerfil?: string;
  authCode: string; // e.g. "ACBJJ-7K4P-92XM"
  qrToken: string; // URL or opaque token inside QR code
  registro: string;
  status: 'ativo' | 'inativo' | 'cancelado' | 'revogado';
  validade: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  viasEmitidas?: number;
  rawCarteirinha?: any;
}

export interface CarteirinhaAuthLog {
  id: string;
  credentialId: string;
  entityType?: 'user' | 'student';
  entityId?: number | string;
  userId: number | string;
  userNome: string;
  dataHora: string;
  metodo: 'qr_code' | 'codigo_manual';
  resultado: 'valido' | 'invalido' | 'expirado' | 'cancelado' | 'revogado';
  verificadoPor?: string;
}

export interface UserCarteirinhaData {
  entityType?: 'user' | 'student';
  entityId?: number | string;
  userId: number | string;
  status: 'ativo' | 'inativo' | 'cancelado';
  validade: string;
  dataEmissao: string;
  viasEmitidas: number;
  historicoEmissoes: { id: string; data: string; acao: string; motivo?: string }[];
  credentialId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: number;
  userNome: string;
  userTipo?: string;
  acao: 'CRIACAO' | 'ATUALIZACAO' | 'EXCLUSAO' | 'SINCRONIZACAO' | 'AUTENTICACAO' | 'UPLOAD' | 'ERRO' | 'RESTAURACAO';
  entidade: string;
  detalhes: string;
  ip?: string;
  ipAddress?: string;
  dadosAnt?: any;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

export interface HealthRecord {
  alunoId: number;
  pesoKg?: number;
  alturaCm?: number;
  imc?: number;
  tipoSangue?: string;
  restricoesMedicas?: string;
  lesoesHistorico?: string;
  examesAnexos?: { nome: string; url: string; data: string }[];
  alergias?: string;
  observacoesSaude?: string;
  ultimaAtualizacao: string;
}

export interface AntiEvasionAlert {
  id: string;
  alunoId: number;
  alunoNome: string;
  nivelRisco: 'alto' | 'medio' | 'baixo';
  diasSemFrequencia: number;
  motivoAlerta: string;
  dataAlerta: string;
  status: 'pendente' | 'em_atendimento' | 'resolvido';
  acoesAcompanhamento?: string[];
}

export interface TimelineEvent {
  id: string;
  alunoId: number;
  data: string;
  tipo: 'cadastro' | 'matricula' | 'experimental' | 'presenca' | 'falta' | 'pagamento' | 'campeonato' | 'medalha' | 'graduacao' | 'certificado' | 'avaliacao' | 'notificacao' | 'video' | 'transmissao' | 'documento' | 'carteirinha' | 'ocorrencia';
  titulo: string;
  descricao: string;
  autor: string;
}

export interface TeacherAiAnalysis {
  id: string;
  alunoId: number;
  alunoNome: string;
  dataAnalise: string;
  desempenhoGeral: string;
  frequenciaScore: number; // 0-100
  evolucaoScore: number; // 0-100
  riscoEvasaoScore: number; // 0-100
  prontoParaGraduacao: boolean;
  faixaSugerida?: string;
  recomendacaoFormatada: string;
}

export interface StudentGoal {
  id: string;
  alunoId: number;
  titulo: string;
  descricao: string;
  dataAlvo: string;
  progressoPercent: number; // 0-100
  concluido: boolean;
  dataCriacao: string;
}

export interface StudentAchievement {
  id: string;
  alunoId: number;
  titulo: string;
  descricao: string;
  categoria: 'frequencia' | 'campeonato' | 'tecnica' | 'disciplina';
  icone: string;
  dataConquista: string;
}

export interface CrmInteraction {
  id: string;
  usuarioId: number;
  usuarioNome: string;
  data: string;
  canal: 'whatsapp' | 'ligacao' | 'presencial' | 'email';
  assunto: string;
  descricao: string;
  proximaAcaoData?: string;
  atendidoPor: string;
}

export interface DigitalContract {
  id: string;
  usuarioId: number;
  usuarioNome: string;
  titulo: string;
  tipo: 'contrato_matricula' | 'lgpd_privacidade' | 'autorizacao_imagem' | 'termo_medico';
  status: 'pendente' | 'assinado' | 'recusado';
  dataEmissao: string;
  dataAssinatura?: string;
  hashAssinatura?: string;
  documentoUrl?: string;
}

export interface UserDigitalDocument {
  id: string;
  usuarioId: number;
  usuarioNome: string;
  nomeDocumento: string;
  categoria: 'carteirinha' | 'certificado' | 'contrato' | 'exame' | 'comprovante' | 'outros';
  urlDrive: string;
  dataEnvio: string;
  tamanhoKb?: number;
}

export interface AulaExperimental {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  turma: string;
  horario: string;
  dataAula: string;
  status: 'Pendente' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Ausente' | 'Justificado';
  professorId?: number;
  professorNome?: string;
  observacoes?: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  dataCriacao: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'manual';
  tamanhoKb: number;
  totalEntidades: number;
  criadoPor?: string;
  status?: 'sucesso' | 'falha';
  conteudoJson?: string;
  jsonSnapshot?: string;
  hashIntegridade?: string;
}

export interface ContractChapter {
  id: string;
  numero: number;
  titulo: string;
  subtitulo?: string;
  conteudo: string;
  imagemUrl?: string;
}

export interface OfficialContract {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'matricula' | 'lgpd' | 'imagem' | 'campeonato' | 'outros';
  versao: string;
  status: 'rascunho' | 'publicado';
  dataAtualizacao: string;
  responsavelNome: string;
  cabecalhoInstitucional?: string;
  rodapeInstitucional?: string;
  capitulos: ContractChapter[];
  hashSHA256?: string;
  historicoVersoes?: {
    versao: string;
    data: string;
    responsavel: string;
    hash: string;
    descricaoAlteracoes: string;
  }[];
}

export interface ContractAcceptanceRecord {
  id: string;
  usuarioId?: number;
  usuarioNome: string;
  usuarioCpf?: string;
  documentoId: string;
  documentoTitulo: string;
  versao: string;
  dataHora: string;
  ip: string;
  dispositivo: string;
  navegador: string;
  hashAssinatura: string;
  origem: 'cadastro' | 'campeonato' | 'plataforma';
}





