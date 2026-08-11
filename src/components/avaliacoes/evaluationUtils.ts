import {
  Student,
  CheckinRequest,
  ClassUnit,
  EvaluationCycle,
  EvaluationSettings,
  StudentEvaluationRecord,
  SentExam,
} from '../../types';

export const DEFAULT_EVALUATION_SETTINGS: EvaluationSettings = {
  notaMinima: 7.0,
  frequenciaMinima: 75,
  criterios: [
    { id: 'tecnica', nome: 'Média Técnica & Posições', peso: 1, descricao: 'Avaliação de domínio técnico e execução das posições' },
    { id: 'defesa', nome: 'Defesa Pessoal & Tática', peso: 1, descricao: 'Conhecimento de saídas e contra-ataques fundamentais' },
    { id: 'desenvolvimento', nome: 'Desenvolvimento & Postura', peso: 1, descricao: 'Evolução constante e atitude no tatame' },
    { id: 'disciplina', nome: 'Disciplina & Assiduidade', peso: 1, descricao: 'Respeito aos colegas, pontualidade e freqüência' },
    { id: 'pratica', nome: 'Prática & Sparring / Luta', peso: 1, descricao: 'Desempenho em lutas de treino e aplicação prática' },
  ],
};

export const DEFAULT_INITIAL_CYCLE: EvaluationCycle = {
  id: 'ciclo-2026-2',
  nome: '2º Semestre 2026',
  status: 'ativo',
  dataInicio: '2026-08-01',
};

export const safeStorageParse = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
  }
  return fallback;
};

/**
 * Calculates student theoretical exam average (Teoria & Conceitos)
 */
export const calculateTeoriaConceitosGrade = (
  studentId: number,
  provasEnviadas: SentExam[] = []
): {
  notaMedia: number;
  totalProvasFeitas: number;
  detalheProvas: Array<{
    titulo: string;
    nota: number;
    pontuacaoTotal: number;
    status: 'CONCLUÍDA' | 'PENDENTE';
  }>;
} => {
  const studentExams = (provasEnviadas || []).filter(
    (p) => p.alunoId === 'todos' || p.alunoId === studentId
  );

  let somaNotas10 = 0;
  let totalFeitas = 0;
  const detalheProvas: Array<{
    titulo: string;
    nota: number;
    pontuacaoTotal: number;
    status: 'CONCLUÍDA' | 'PENDENTE';
  }> = [];

  studentExams.forEach((p) => {
    const notaRaw = p.notas ? p.notas[studentId] : undefined;
    const temResposta = p.respostas && p.respostas[studentId] && Object.keys(p.respostas[studentId]).length > 0;

    if (notaRaw !== undefined) {
      const maxPts = p.pontuacaoTotal || 10;
      const converted0To10 = maxPts > 0 ? (notaRaw / maxPts) * 10 : notaRaw;
      const finalScore = Math.min(10, Math.max(0, converted0To10));
      somaNotas10 += finalScore;
      totalFeitas += 1;
      detalheProvas.push({
        titulo: p.tituloProva,
        nota: finalScore,
        pontuacaoTotal: 10,
        status: 'CONCLUÍDA',
      });
    } else if (temResposta) {
      detalheProvas.push({
        titulo: p.tituloProva,
        nota: 0,
        pontuacaoTotal: 10,
        status: 'PENDENTE',
      });
    } else {
      detalheProvas.push({
        titulo: p.tituloProva,
        nota: 0,
        pontuacaoTotal: 10,
        status: 'PENDENTE',
      });
    }
  });

  const notaMedia = totalFeitas > 0 ? Math.round((somaNotas10 / totalFeitas) * 100) / 100 : 10;

  return {
    notaMedia,
    totalProvasFeitas: totalFeitas,
    detalheProvas,
  };
};

/**
 * Calculates real student attendance and class count without any hardcoded 12 classes logic.
 */
export const calculateStudentAttendance = (
  student: Student,
  checkinsConfirmados: CheckinRequest[] = []
): {
  presencasConfirmadas: number;
  totalAulasRealizadas: number;
  frequenciaPercent: number;
} => {
  if (!student) {
    return { presencasConfirmadas: 0, totalAulasRealizadas: 1, frequenciaPercent: 0 };
  }

  // 1. Unique confirmed check-in dates for this student
  const studentDates = new Set<string>();

  if (Array.isArray(student.checkins)) {
    student.checkins.forEach((d) => {
      if (d && typeof d === 'string') studentDates.add(d);
    });
  }

  checkinsConfirmados.forEach((c) => {
    if (
      c.alunoId === student.id &&
      (c.status === 'confirmado' || !c.status) &&
      c.data
    ) {
      studentDates.add(c.data);
    }
  });

  const presencasConfirmadas = studentDates.size;

  // 2. Calculate unique class dates held for student's turma ON or AFTER entry date
  const studentTurmaClean = ((student as any).turma || student.professorResponsavelNome || '')
    .toLowerCase()
    .trim();

  const rawEntryDate =
    student.dataInicioTreino ||
    student.dataAprovacao ||
    student.dataCadastro ||
    student.createdAt ||
    new Date().toISOString().split('T')[0];
  const cleanEntryDate = rawEntryDate.slice(0, 10);

  const sameTurmaDates = new Set<string>();

  checkinsConfirmados.forEach((c) => {
    if (c.data) {
      // Ignora aulas anteriores à data de entrada do aluno na turma/sistema
      if (c.data < cleanEntryDate) return;

      const isMatch =
        !studentTurmaClean ||
        !c.turma ||
        c.turma.toLowerCase().trim() === studentTurmaClean;

      if (isMatch) {
        sameTurmaDates.add(c.data);
      }
    }
  });

  // Ensure student's own attendance dates are included in total classes
  studentDates.forEach((d) => sameTurmaDates.add(d));

  const totalAulasRealizadas = Math.max(presencasConfirmadas, sameTurmaDates.size);

  let frequenciaPercent = 100;
  if (totalAulasRealizadas > 0) {
    frequenciaPercent = Math.min(
      100,
      Math.round((presencasConfirmadas / totalAulasRealizadas) * 100)
    );
  } else if (presencasConfirmadas === 0) {
    frequenciaPercent = 0;
  }

  return {
    presencasConfirmadas,
    totalAulasRealizadas: Math.max(1, totalAulasRealizadas),
    frequenciaPercent,
  };
};

/**
 * Computes average grade based on active criteria and weights, including automatic Teoria & Conceitos.
 */
export const calculateMediaFinal = (
  notas: Record<string, number>,
  settings: EvaluationSettings,
  teoriaConceitosNota?: number
): number => {
  const criterios = settings.criterios || DEFAULT_EVALUATION_SETTINGS.criterios;

  let soma = 0;
  let totalPeso = 0;

  criterios.forEach((crit) => {
    const val = Number(notas[crit.id] ?? 8);
    const peso = crit.peso || 1;
    soma += val * peso;
    totalPeso += peso;
  });

  if (typeof teoriaConceitosNota === 'number' && !isNaN(teoriaConceitosNota)) {
    soma += teoriaConceitosNota * 1;
    totalPeso += 1;
  }

  if (totalPeso <= 0) return 0;
  const media = soma / totalPeso;
  return Math.round(media * 100) / 100;
};

/**
 * Checks dual criteria approval: Media >= notaMinima AND Frequencia >= frequenciaMinima
 */
export const evaluateApproval = (
  mediaFinal: number,
  frequenciaPercent: number,
  settings: EvaluationSettings
): {
  aprovado: boolean;
  motivoReprovacao: string;
} => {
  const notaMin = settings.notaMinima ?? 7.0;
  const freqMin = settings.frequenciaMinima ?? 75;

  const passedNota = mediaFinal >= notaMin;
  const passedFreq = frequenciaPercent >= freqMin;

  const aprovado = passedNota && passedFreq;

  let motivoReprovacao = '';
  if (!aprovado) {
    if (!passedNota && !passedFreq) {
      motivoReprovacao = `Média e Frequência insuficientes (Nota: ${mediaFinal.toFixed(1).replace('.', ',')} < ${notaMin.toFixed(1).replace('.', ',')}; Frequência: ${frequenciaPercent}% < ${freqMin}%)`;
    } else if (!passedNota) {
      motivoReprovacao = `Nota insuficiente (Média: ${mediaFinal.toFixed(1).replace('.', ',')} < ${notaMin.toFixed(1).replace('.', ',')})`;
    } else {
      motivoReprovacao = `Frequência insuficiente (Frequência: ${frequenciaPercent}% < ${freqMin}%)`;
    }
  }

  return { aprovado, motivoReprovacao };
};

export const formatGrade = (num: number): string => {
  if (isNaN(num)) return '0,00';
  if (num === 10) return '10,00';
  return num.toFixed(2).replace('.', ',');
};
