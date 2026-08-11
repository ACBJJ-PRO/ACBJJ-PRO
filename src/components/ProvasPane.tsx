import React, { useState } from 'react';
import { Student, SentExam, ExamQuestion } from '../types';
import { ClipboardList, Plus, Trash2, CheckCircle, Send, HelpCircle, Users } from 'lucide-react';

interface ProvasPaneProps {
  alunos: Student[];
  provasEnviadas: SentExam[];
  onEnviarProva: (novaProva: SentExam) => void;
  onRemoverProva: (id: number) => void;
  onLancarNotaProva?: (provaId: number, alunoId: number, nota: number) => void;
}

export default function ProvasPane({
  alunos,
  provasEnviadas,
  onEnviarProva,
  onRemoverProva,
  onLancarNotaProva,
}: ProvasPaneProps) {
  const [targetAlunoId, setTargetAlunoId] = useState<number | 'todos'>('todos');
  const [tipo, setTipo] = useState<'objetiva' | 'discursiva'>('objetiva');
  const [questoes, setQuestoes] = useState<Omit<ExamQuestion, 'numero'>[]>([]);
  const [expandedProvaId, setExpandedProvaId] = useState<number | null>(null);

  // Checklist of answered exams states
  const [selectedStudentIdForChecklist, setSelectedStudentIdForChecklist] = useState<number | null>(null);
  const [selectedExamIdForChecklist, setSelectedExamIdForChecklist] = useState<number | null>(null);
  const [discursiveGradeInput, setDiscursiveGradeInput] = useState<string>('');

  // Deleting exam confirmation modal state
  const [examToDelete, setExamToDelete] = useState<SentExam | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  const handleConfirmDeleteExam = () => {
    if (!examToDelete) return;
    if (deleteConfirmText.trim() !== 'EXCLUIR') return;
    onRemoverProva(examToDelete.id);
    setExamToDelete(null);
    setDeleteConfirmText('');
  };

  const handleAddQuestao = () => {
    if (tipo === 'objetiva') {
      setQuestoes([
        ...questoes,
        {
          tipo: 'objetiva',
          pergunta: '',
          pontuacao: 1,
          opcaoA: '',
          opcaoB: '',
          opcaoC: '',
          opcaoD: '',
          opcaoE: '',
          respostaCorreta: '',
        },
      ]);
    } else {
      setQuestoes([
        ...questoes,
        {
          tipo: 'discursiva',
          pergunta: '',
          pontuacao: 1,
          respostaCorreta: '',
        },
      ]);
    }
  };

  const handleQuestaoChange = (index: number, key: keyof Omit<ExamQuestion, 'numero'>, value: any) => {
    const updated = [...questoes];
    updated[index] = { ...updated[index], [key]: value };
    setQuestoes(updated);
  };

  const handleRemoveQuestao = (index: number) => {
    const updated = [...questoes];
    updated.splice(index, 1);
    setQuestoes(updated);
  };

  const handleEnviarProva = (e: React.FormEvent) => {
    e.preventDefault();
    if (questoes.length === 0) {
      alert('Adicione ao menos uma questão para enviar a prova!');
      return;
    }

    // Validation
    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      if (!q.pergunta.trim()) {
        alert(`Por favor, preencha a pergunta da questão nº ${i + 1}`);
        return;
      }
      if (q.tipo === 'objetiva') {
        if (!q.opcaoA?.trim() || !q.opcaoB?.trim() || !q.opcaoC?.trim() || !q.opcaoD?.trim() || !q.opcaoE?.trim()) {
          alert(`Por favor, preencha todas as opções (A a E) da questão nº ${i + 1}`);
          return;
        }
        if (!q.respostaCorreta) {
          alert(`Por favor, selecione o gabarito (Alternativa Correta) da questão nº ${i + 1}`);
          return;
        }
      } else {
        if (!q.respostaCorreta.trim()) {
          alert(`Por favor, preencha a resposta esperada da questão nº ${i + 1}`);
          return;
        }
      }
    }

    const compiledQuestoes: ExamQuestion[] = questoes.map((q, idx) => ({
      numero: idx + 1,
      tipo: q.tipo as 'objetiva' | 'discursiva',
      pergunta: q.pergunta,
      pontuacao: q.pontuacao,
      opcaoA: q.opcaoA,
      opcaoB: q.opcaoB,
      opcaoC: q.opcaoC,
      opcaoD: q.opcaoD,
      opcaoE: q.opcaoE,
      respostaCorreta: q.respostaCorreta,
    }));

    const pontuacaoTotal = compiledQuestoes.reduce((s, q) => s + q.pontuacao, 0);

    const novaProva: SentExam = {
      id: Date.now(),
      alunoId: targetAlunoId,
      tipo,
      tituloProva: `Desafio Teórico - ${tipo === 'objetiva' ? 'Objetivo' : 'Discursivo'}`,
      questoes: compiledQuestoes,
      pontuacaoTotal,
      data: new Date().toLocaleString('pt-BR'),
      enviadoPor: 'PROFESSOR YURI CRUZ',
      respostas: {},
      notas: {},
    };

    onEnviarProva(novaProva);
    alert(`Prova enviada com sucesso! Pontuação total: ${pontuacaoTotal} pts.`);

    // Clear Form
    setQuestoes([]);
    setTargetAlunoId('todos');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ELABORAR PROVA CARD */}
        <div className="xl:col-span-2 bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
            <ClipboardList className="w-5.5 h-5.5 text-orange-500" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Elaborar Prova / Desafio</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Crie testes teóricos de regras, filosofia do jiu-jitsu e golpes</p>
            </div>
          </div>

          <form onSubmit={handleEnviarProva} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase block">Atleta Alvo *</label>
                <select
                  value={targetAlunoId}
                  onChange={(e) => setTargetAlunoId(e.target.value === 'todos' ? 'todos' : parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 px-4 text-sm focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="todos">Enviar para todos</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      🥋 {a.nome} ({a.faixa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-neutral-400 uppercase block">Tipo de Prova *</label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value as 'objetiva' | 'discursiva');
                    setQuestoes([]); // Reset questions when changing type
                  }}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 px-4 text-sm focus:border-orange-500 outline-none cursor-pointer"
                >
                  <option value="objetiva">Múltipla Escolha (Objetiva)</option>
                  <option value="discursiva">Resposta Escrita (Discursiva)</option>
                </select>
              </div>
            </div>

            {/* QUESTÕES CONTAINER */}
            <div className="space-y-4 pt-3">
              {questoes.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-[#1a1a1a] p-5 rounded-xl border border-neutral-800 text-left relative animate-scale-in"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestao(idx)}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-orange-500/10 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-md">
                      Questão {idx + 1}
                    </span>
                    <span className="text-neutral-500 text-xs uppercase font-semibold">
                      - {q.tipo === 'objetiva' ? 'Múltipla Escolha' : 'Discursiva'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold block">Pergunta / Enunciado</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Qual é a pontuação correta para uma passagem de guarda?"
                        value={q.pergunta}
                        onChange={(e) => handleQuestaoChange(idx, 'pergunta', e.target.value)}
                        className="w-full bg-[#141414] text-white border border-neutral-800 rounded-lg py-2 px-3 text-xs focus:border-orange-500 outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold block">Pontuação (Peso)</label>
                      <select
                        value={q.pontuacao}
                        onChange={(e) => handleQuestaoChange(idx, 'pontuacao', parseFloat(e.target.value))}
                        className="w-full bg-[#141414] text-white border border-neutral-800 rounded-lg py-2 px-3 text-xs focus:border-orange-500 outline-none cursor-pointer"
                      >
                        <option value="1">1.0 Ponto</option>
                        <option value="1.5">1.5 Pontos</option>
                        <option value="2">2.0 Pontos</option>
                        <option value="2.5">2.5 Pontos</option>
                        <option value="3">3.0 Pontos</option>
                      </select>
                    </div>
                  </div>

                  {q.tipo === 'objetiva' ? (
                    <div className="space-y-2 pt-2 border-t border-neutral-900">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Alternativas</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                          <div key={letter} className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-bold text-neutral-500">{letter})</span>
                            <input
                              type="text"
                              required
                              placeholder={`Texto da opção ${letter}`}
                              value={(q as any)[`opcao${letter}`] || ''}
                              onChange={(e) => handleQuestaoChange(idx, `opcao${letter}` as any, e.target.value)}
                              className="w-full bg-[#141414] text-white border border-neutral-800 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:border-orange-500 outline-none transition"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 pt-3 max-w-[150px]">
                        <label className="text-[10px] text-orange-400 uppercase font-bold block">Gabarito Correto</label>
                        <select
                          value={q.respostaCorreta}
                          onChange={(e) => handleQuestaoChange(idx, 'respostaCorreta', e.target.value)}
                          className="w-full bg-[#141414] text-white border border-neutral-800 rounded-lg py-1.5 px-3 text-xs focus:border-orange-500 outline-none cursor-pointer"
                        >
                          <option value="">Selecione</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 pt-2 border-t border-neutral-900">
                      <label className="text-[10px] text-orange-400 uppercase font-bold block">Critério de Resposta Esperada (Gabarito)</label>
                      <textarea
                        required
                        placeholder="Ex: Espera-se que o aluno cite que a montada pelas costas concede 4 pontos de acordo com a IBJJF."
                        value={q.respostaCorreta}
                        onChange={(e) => handleQuestaoChange(idx, 'respostaCorreta', e.target.value)}
                        className="w-full bg-[#141414] text-white border border-neutral-800 rounded-lg py-2 px-3 text-xs focus:border-orange-500 outline-none transition min-h-[60px]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-3 border-t border-neutral-900/50">
              <button
                type="button"
                onClick={handleAddQuestao}
                className="flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                Adicionar Questão
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-md cursor-pointer transition ml-auto"
              >
                <Send className="w-4 h-4" />
                Enviar Prova Elaborada
              </button>
            </div>
          </form>
        </div>

        {/* PROVAS ENVIADAS LIST */}
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
          <div className="flex items-center gap-2 mb-4 text-orange-500 border-b border-neutral-900 pb-3 text-left">
            <ClipboardList className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Desafios Enviados</h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {provasEnviadas.length > 0 ? (
              provasEnviadas.slice().reverse().map((p) => {
                const targetAluno = p.alunoId === 'todos' ? 'Todos os Alunos' : alunos.find((a) => a.id === p.alunoId)?.nome || 'Aluno';
                const respondidosCount = p.respostas ? Object.keys(p.respostas).length : 0;

                return (
                  <div
                    key={p.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 text-left hover:border-neutral-700 transition space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setExamToDelete(p);
                        setDeleteConfirmText('');
                      }}
                      className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition cursor-pointer"
                      title="Remover Prova"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <span className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest bg-orange-500/10 py-0.5 px-2 rounded-md">
                      {p.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                    </span>

                    <h4 className="font-bold text-white text-sm pt-1">{p.tituloProva}</h4>

                    <div className="text-xs text-neutral-400 space-y-0.5">
                      <p>Para: <strong className="text-neutral-300">{targetAluno}</strong></p>
                      <p>Questões: <strong className="text-neutral-300">{p.questoes.length}</strong> | Pontos: <strong className="text-neutral-300">{p.pontuacaoTotal} pts</strong></p>
                      <p>Respondidas: <strong className="text-neutral-300">{respondidosCount} atleta(s)</strong></p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-neutral-500 font-mono">📅 {p.data}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedProvaId(expandedProvaId === p.id ? null : p.id)}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer bg-orange-500/5 hover:bg-orange-500/10 py-1 px-2.5 rounded-lg border border-orange-500/15 transition-all"
                      >
                        {expandedProvaId === p.id ? 'Ocultar Questões 🔼' : 'Ver Questões e Gabarito 🔽'}
                      </button>
                    </div>

                    {expandedProvaId === p.id && (
                      <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2.5 animate-fade-in">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Questões & Gabarito:</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {p.questoes.map((q, qidx) => (
                            <div key={qidx} className="bg-neutral-900/40 p-3 rounded-lg border border-neutral-850 space-y-2 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="bg-orange-500/15 text-orange-400 font-bold text-[10px] py-0.5 px-1.5 rounded h-fit block">
                                  Q{qidx + 1}
                                </span>
                                <p className="font-semibold text-neutral-200 leading-relaxed text-left flex-1">{q.pergunta}</p>
                              </div>
                              {q.tipo === 'objetiva' ? (
                                <div className="space-y-1 pl-7 text-[11px] text-neutral-400">
                                  <p className={q.respostaCorreta === 'A' ? 'text-emerald-400 font-bold' : ''}>A) {q.opcaoA}</p>
                                  <p className={q.respostaCorreta === 'B' ? 'text-emerald-400 font-bold' : ''}>B) {q.opcaoB}</p>
                                  <p className={q.respostaCorreta === 'C' ? 'text-emerald-400 font-bold' : ''}>C) {q.opcaoC}</p>
                                  <p className={q.respostaCorreta === 'D' ? 'text-emerald-400 font-bold' : ''}>D) {q.opcaoD}</p>
                                  <p className={q.respostaCorreta === 'E' ? 'text-emerald-400 font-bold' : ''}>E) {q.opcaoE}</p>
                                </div>
                              ) : null}
                              <div className="pl-7">
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/15 font-bold">
                                  🎯 Gabarito Esperado: {q.respostaCorreta}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 opacity-50 text-sm">Nenhum desafio teórico enviado ainda</div>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO COMPLEMENTAR: CHECKLIST DE RESPOSTAS POR ATLETA */}
      <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex items-center gap-2 mb-4 text-orange-500 border-b border-neutral-900 pb-3 text-left">
          <CheckCircle className="w-5 h-5 text-orange-500 animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Acompanhamento e Checklist de Respostas</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Veja quais atletas já responderam aos desafios teóricos e suas respectivas notas e respostas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LIST OF STUDENTS */}
          <div className="lg:col-span-1 border-r border-neutral-800 pr-0 lg:pr-6 space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Selecione um Atleta</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {alunos.map((a) => {
                // Find exams assigned to this student
                const assignedExams = provasEnviadas.filter((p) => p.alunoId === 'todos' || p.alunoId === a.id);
                const answeredCount = assignedExams.filter((p) => p.respostas && p.respostas[a.id]).length;
                
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedStudentIdForChecklist(a.id);
                      setSelectedExamIdForChecklist(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center gap-3 ${
                      selectedStudentIdForChecklist === a.id
                        ? 'bg-orange-500/10 border-orange-500 text-white'
                        : 'bg-neutral-900/60 border-neutral-850 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {a.fotoPerfil ? (
                        <img src={a.fotoPerfil} alt={a.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        a.nome.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold truncate text-white">{a.nome}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                        <span className="bg-neutral-850 px-1.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wider text-orange-400">{a.faixa}</span>
                        <span>•</span>
                        <span>{answeredCount}/{assignedExams.length} Provas</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LIST OF ASSIGNED EXAMS AND SUBMISSIONS FOR SELECTED STUDENT */}
          <div className="lg:col-span-2 space-y-4">
            {selectedStudentIdForChecklist ? (
              (() => {
                const student = alunos.find((a) => a.id === selectedStudentIdForChecklist);
                if (!student) return null;

                const assignedExams = provasEnviadas.filter((p) => p.alunoId === 'todos' || p.alunoId === student.id);

                return (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <h4 className="text-sm font-extrabold text-white">
                        Desafios de <span className="text-orange-500">{student.nome}</span>
                      </h4>
                      <span className="text-[10px] text-neutral-400 uppercase font-mono">
                        {assignedExams.length} provas vinculadas
                      </span>
                    </div>

                    {assignedExams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignedExams.map((p) => {
                          const hasAnswered = p.respostas && p.respostas[student.id];
                          const score = p.notas && p.notas[student.id] !== undefined ? p.notas[student.id] : null;

                          return (
                            <div
                              key={p.id}
                              className={`p-4 rounded-xl border text-left space-y-3 transition ${
                                selectedExamIdForChecklist === p.id
                                  ? 'bg-orange-500/5 border-orange-500/30'
                                  : 'bg-[#1a1a1a] border-neutral-800'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800">
                                  {p.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                                </span>
                                {hasAnswered ? (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
                                    ✓ Respondida
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded border border-amber-500/20">
                                    Pendente
                                  </span>
                                )}
                              </div>

                              <div>
                                <h5 className="text-xs font-bold text-white truncate">{p.tituloProva}</h5>
                                <p className="text-[10px] text-neutral-400 mt-1">
                                  Questões: <strong>{p.questoes.length}</strong> | Máximo: <strong>{p.pontuacaoTotal} pts</strong>
                                </p>
                              </div>

                              {hasAnswered && (
                                <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850 flex items-center justify-between">
                                  <span className="text-[11px] text-neutral-400">Nota obtida:</span>
                                  <span className="text-xs font-black text-emerald-400">
                                    {score !== null ? `${score} / ${p.pontuacaoTotal} pts` : 'Aguardando nota'}
                                  </span>
                                </div>
                              )}

                              {hasAnswered ? (
                                <button
                                  onClick={() => setSelectedExamIdForChecklist(p.id)}
                                  className="w-full text-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold text-[10px] py-1.5 rounded-lg transition"
                                >
                                  {selectedExamIdForChecklist === p.id ? 'Visualizando Respostas 👁️' : 'Ver Respostas do Atleta 🔍'}
                                </button>
                              ) : (
                                <div className="text-center py-2 text-[10px] text-neutral-500 italic">
                                  Atleta ainda não iniciou este desafio.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 opacity-50 text-xs text-neutral-400">
                        Nenhum desafio teórico atribuído a este atleta.
                      </div>
                    )}

                    {/* DETAILED RESPONSES VIEW */}
                    {selectedExamIdForChecklist && (() => {
                      const exam = assignedExams.find((e) => e.id === selectedExamIdForChecklist);
                      if (!exam) return null;

                      const studentAnswersForExam = exam.respostas && exam.respostas[student.id] ? exam.respostas[student.id] : {};

                      return (
                        <div className="mt-4 p-4 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                            <div>
                              <h5 className="text-xs font-black text-orange-400 uppercase tracking-wider">Gabarito & Respostas do Aluno</h5>
                              <p className="text-[10px] text-neutral-400 mt-0.5">{exam.tituloProva}</p>
                            </div>
                            <button
                              onClick={() => setSelectedExamIdForChecklist(null)}
                              className="text-[9px] text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 py-1 px-2 rounded"
                            >
                              Fechar Detalhes
                            </button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {exam.questoes.map((q, qidx) => {
                              const answer = studentAnswersForExam[qidx];
                              const isCorrect = exam.tipo === 'objetiva' && answer === q.respostaCorreta;

                              return (
                                <div key={qidx} className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-850 text-xs space-y-2">
                                  <div className="flex items-start gap-2">
                                    <span className="bg-neutral-800 text-neutral-300 font-bold text-[9px] py-0.5 px-1.5 rounded h-fit block shrink-0">
                                      Questão {qidx + 1}
                                    </span>
                                    <p className="font-semibold text-neutral-200 flex-1 leading-relaxed">{q.pergunta}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 pt-1">
                                    <div className="p-2 bg-neutral-950/50 rounded border border-neutral-900">
                                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Resposta do Atleta:</span>
                                      {exam.tipo === 'objetiva' ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className={`font-black uppercase text-xs px-1.5 py-0.5 rounded ${
                                            isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                          }`}>
                                            {answer || 'Sem Resposta'}
                                          </span>
                                          {answer && <span className="text-[11px] text-neutral-300">{(q as any)[`opcao${answer}`]}</span>}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-neutral-200 italic whitespace-pre-wrap">
                                          {answer || 'Sem Resposta'}
                                        </p>
                                      )}
                                    </div>

                                    <div className="p-2 bg-neutral-950/50 rounded border border-neutral-900">
                                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Gabarito / Critério:</span>
                                      {exam.tipo === 'objetiva' ? (
                                        <div className="flex items-center gap-1.5">
                                          <span className="bg-emerald-500/10 text-emerald-400 font-black uppercase text-xs px-1.5 py-0.5 rounded">
                                            {q.respostaCorreta}
                                          </span>
                                          <span className="text-[11px] text-neutral-300">{(q as any)[`opcao${q.respostaCorreta}`]}</span>
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-emerald-400 font-semibold whitespace-pre-wrap">
                                          {q.respostaCorreta}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {exam.tipo === 'objetiva' && (
                                    <div className="pl-2 pt-1 flex items-center gap-1">
                                      {isCorrect ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 py-0.5 px-2 rounded border border-emerald-500/20">
                                          ✓ Resposta Correta (+{q.pontuacao} pts)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[9px] text-red-400 font-bold bg-red-500/10 py-0.5 px-2 rounded border border-red-500/20">
                                          ✗ Resposta Incorreta (0 pts)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Subjective/Discursiva Grading Tool */}
                          {exam.tipo === 'discursiva' && (
                            <div className="bg-neutral-900/80 p-3.5 rounded-lg border border-neutral-800 space-y-3">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block">Lançar / Corrigir Nota da Prova Discursiva</span>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="text-[9px] text-neutral-400 uppercase font-semibold block mb-1">Nota do Atleta (Máx: {exam.pontuacaoTotal} pts)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max={exam.pontuacaoTotal}
                                    step="0.5"
                                    placeholder="Ex: 8.5"
                                    value={discursiveGradeInput}
                                    onChange={(e) => setDiscursiveGradeInput(e.target.value)}
                                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-orange-500 transition"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (discursiveGradeInput === '') {
                                      alert('Preencha um valor de nota!');
                                      return;
                                    }
                                    const parsedNota = parseFloat(discursiveGradeInput);
                                    if (isNaN(parsedNota) || parsedNota < 0 || parsedNota > exam.pontuacaoTotal) {
                                      alert(`A nota deve ser um número entre 0 e ${exam.pontuacaoTotal}`);
                                      return;
                                    }
                                    onLancarNotaProva?.(exam.id, student.id, parsedNota);
                                    alert('Nota registrada com sucesso!');
                                    setDiscursiveGradeInput('');
                                  }}
                                  className="self-end bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] py-2 px-4 rounded-lg transition"
                                >
                                  Lançar Nota
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-50 space-y-2">
                <Users className="w-10 h-10 text-neutral-600" />
                <p className="text-sm text-neutral-400">Selecione um atleta na lista ao lado para ver o status dos desafios e corrigir respostas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PROVA TEÓRICA */}
      {examToDelete && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#141414] border border-red-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-left">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Excluir Desafio Teórico?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Confirmar exclusão permanente da prova teórica.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-300 leading-relaxed bg-[#181818] p-3.5 rounded-2xl border border-neutral-850">
                Tem certeza de que deseja excluir a prova <strong className="text-white font-bold">"{examToDelete.tituloProva}"</strong>? Esta ação apagará permanentemente todas as respostas dos alunos e notas associadas.
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-neutral-300 block">
                  Para confirmar, digite <span className="text-red-400 font-extrabold">EXCLUIR</span> no campo abaixo:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Digite EXCLUIR para confirmar..."
                  className="w-full bg-black border border-neutral-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
              <button
                type="button"
                onClick={() => {
                  setExamToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'EXCLUIR'}
                onClick={handleConfirmDeleteExam}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Prova</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
