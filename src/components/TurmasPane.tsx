import React, { useState } from 'react';
import { ClassUnit, Student, User } from '../types';
import { Calendar, Trash2, Plus, Users, Clock, Shield, Check, Lock, Unlock, AlertTriangle } from 'lucide-react';
import AlunosPane from './AlunosPane';

export function formatDiasSemana(diasStr: string): string {
  if (!diasStr) return '';
  const dias = diasStr.split(', ');
  const formattedDays = dias.map(d => d.replace('-feira', ''));
  if (formattedDays.length === 1) return diasStr; // Keep full name if only 1 day, e.g. "Segunda-feira"
  const lastDay = formattedDays[formattedDays.length - 1];
  const otherDays = formattedDays.slice(0, -1);
  return `${otherDays.join(', ')} e ${lastDay}`;
}

interface TurmasPaneProps {
  user: User;
  turmas: ClassUnit[];
  alunos: Student[];
  onAddTurma: (
    nome: string,
    horario: string,
    diaSemana?: string,
    professorId?: number,
    professorNome?: string
  ) => void;
  onRemoveTurma: (id: string) => void;
  onToggleLockTurma?: (id: string) => void;
  onAddAluno: (
    aluno: Omit<
      Student,
      | 'id'
      | 'usuarioId'
      | 'checkins'
      | 'pontosCompeticao'
      | 'notaAvaliacao'
      | 'mediaGeral'
      | 'medalhasOuro'
      | 'medalhasPrata'
      | 'medalhasBronze'
    >,
    fotoBase64: string
  ) => void;
  onToggleStatus: (id: number) => void;
  onDeletarAluno: (id: number) => void;
  onChangePassword?: (alunoId: number, novaSenha: string) => void;
  usuarios?: User[];
  themeKey?: string;
  onAprovarUsuario?: (id: number) => void;
  onAddAuditLog?: (tipo: any, contexto: string, detalhe: string) => void;
  onUpdateAluno?: (id: number, updatedFields: Partial<Student>) => void;
  onUpdateUsuario?: (id: number, updatedFields: Partial<User>) => void;
}

export default function TurmasPane({
  user,
  turmas,
  alunos,
  onAddTurma,
  onRemoveTurma,
  onToggleLockTurma,
  onAddAluno,
  onToggleStatus,
  onDeletarAluno,
  onChangePassword,
  usuarios = [],
  themeKey = 'orange',
  onAprovarUsuario,
  onAddAuditLog,
  onUpdateAluno,
  onUpdateUsuario,
}: TurmasPaneProps) {
  const [subTab, setSubTab] = useState<'turmas' | 'alunos'>('turmas');
  const [turmaToDelete, setTurmaToDelete] = useState<string | null>(null);

  // New form fields matching training schedule
  const [nomeTurma, setNomeTurma] = useState('');
  const [diaSemana, setDiaSemana] = useState('Segunda-feira');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(['Segunda-feira']);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [horarioTurma, setHorarioTurma] = useState('');
  const [professorIdStr, setProfessorIdStr] = useState('');

  const WEEKDAYS = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];

  const toggleDia = (dia: string) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia) 
        : [...prev, dia]
    );
  };

  const availableProfs = usuarios.filter(
    (u) =>
      u.aprovado &&
      (u.tipo === 'professor' || u.tipo === 'instrutor' || u.tipo === 'admin' || u.email === 'admin@admin.com')
  );

  const getThemeColorClass = (key?: string) => {
    switch (key) {
      case 'blue': return { text: 'text-blue-500', border: 'border-blue-500/20', focus: 'focus:border-blue-500', bg: 'bg-blue-500', from: 'from-blue-500 to-indigo-600' };
      case 'emerald': return { text: 'text-emerald-500', border: 'border-emerald-500/20', focus: 'focus:border-emerald-500', bg: 'bg-emerald-500', from: 'from-emerald-500 to-teal-600' };
      case 'purple': return { text: 'text-purple-500', border: 'border-purple-500/20', focus: 'focus:border-purple-500', bg: 'bg-purple-500', from: 'from-purple-500 to-fuchsia-600' };
      case 'red': return { text: 'text-red-500', border: 'border-red-500/20', focus: 'focus:border-red-500', bg: 'bg-red-500', from: 'from-red-500 to-rose-600' };
      case 'yellow': return { text: 'text-yellow-500', border: 'border-yellow-500/20', focus: 'focus:border-yellow-500', bg: 'bg-yellow-500', from: 'from-yellow-500 to-amber-600' };
      case 'white': return { text: 'text-white', border: 'border-white/20', focus: 'focus:border-white', bg: 'bg-white', from: 'from-white to-neutral-200' };
      case 'orange':
      default: return { text: 'text-orange-500', border: 'border-orange-500/20', focus: 'focus:border-orange-500', bg: 'bg-orange-500', from: 'from-orange-500 to-red-600' };
    }
  };

  const themeStyles = getThemeColorClass(themeKey);

  const handleAddTurmaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTurma) {
      alert('Preencha o nome da turma!');
      return;
    }
    if (!horarioTurma || horarioTurma.length < 5) {
      alert('Preencha o horário corretamente (Ex: 19:30)!');
      return;
    }
    if (diasSelecionados.length === 0) {
      alert('Selecione pelo menos um dia da semana!');
      return;
    }

    const matchedProf = availableProfs.find((p) => p.id === Number(professorIdStr));

    // Save the combined days as a comma-separated string
    const finalDias = diasSelecionados.join(', ');

    onAddTurma(
      nomeTurma,
      horarioTurma,
      finalDias,
      matchedProf?.id,
      matchedProf?.nome
    );

    setNomeTurma('');
    setHorarioTurma('');
    setProfessorIdStr('');
    setDiasSelecionados(['Segunda-feira']);
    setDiaSemana('Segunda-feira');
    alert('Turma e horário adicionados com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DE SUB-TABS INTERNAS */}
      <div className="flex border-b border-neutral-900 gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSubTab('turmas')}
          className={`pb-2.5 px-3 sm:px-5 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            subTab === 'turmas'
              ? `border-orange-500 ${themeStyles.text}`
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Horários & Turmas
        </button>
        <button
          onClick={() => setSubTab('alunos')}
          className={`pb-2.5 px-3 sm:px-5 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            subTab === 'alunos'
              ? `border-orange-500 ${themeStyles.text}`
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestão de Cadastrados
        </button>
      </div>

      {subTab === 'turmas' ? (
        <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
            <Calendar className={`w-5.5 h-5.5 ${themeStyles.text}`} />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Gestão de Horários & Turmas</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Cadastre e remova divisões de turmas (100% integrado ao Cronograma da Semana)</p>
            </div>
          </div>

          {/* FORMULARIO DE ADICIONAR TURMA */}
          <form onSubmit={handleAddTurmaSubmit} className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-850/60 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              {/* NOME DA TURMA */}
              <div className="md:col-span-3 space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Nome da Turma</label>
                <input
                  type="text"
                  required
                  placeholder="Adulto No-Gi Avançado"
                  value={nomeTurma}
                  onChange={(e) => setNomeTurma(e.target.value)}
                  className={`w-full bg-[#1a1a1a] text-white text-xs border border-neutral-800 rounded-lg py-2 px-3 outline-none transition ${themeStyles.focus}`}
                />
              </div>

              {/* DIA DA SEMANA */}
              <div className="md:col-span-3 space-y-1 text-left relative">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Dias da Semana</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-lg py-2 px-3 text-xs outline-none transition cursor-pointer text-left flex justify-between items-center h-[34px] ${themeStyles.focus}`}
                  >
                    <span className="truncate">
                      {diasSelecionados.length > 0 
                        ? formatDiasSemana(diasSelecionados.join(', ')) 
                        : 'Selecione os dias'}
                    </span>
                    <span className="text-neutral-500 text-[10px]">▼</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#141414] border border-neutral-800 rounded-lg shadow-xl z-[100] p-3 space-y-2.5 animate-fade-in max-h-[280px] overflow-y-auto">
                      <div className="space-y-1.5">
                        {WEEKDAYS.map((dia) => {
                          const isSelected = diasSelecionados.includes(dia);
                          return (
                            <label
                              key={dia}
                              className="flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white cursor-pointer select-none py-1 px-1.5 rounded hover:bg-white/5 transition"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleDia(dia)}
                                className={`rounded border-neutral-800 bg-[#1a1a1a] text-orange-500 focus:ring-0 focus:ring-offset-0 h-4.5 w-4.5 cursor-pointer accent-orange-500`}
                              />
                              <span>{dia}</span>
                            </label>
                          );
                        })}
                      </div>
                      
                      <div className="pt-2 border-t border-neutral-850 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (diasSelecionados.length === 0) {
                              alert('Selecione pelo menos um dia da semana!');
                              return;
                            }
                            setDiaSemana(diasSelecionados.join(', '));
                            setDropdownOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white transition ${themeStyles.bg}`}
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HORARIO (FORMATADO AUTOMATICAMENTE) */}
              <div className="md:col-span-2 space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Horário</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 19:30"
                  maxLength={5}
                  value={horarioTurma}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    if (digits.length <= 2) {
                      setHorarioTurma(digits);
                    } else {
                      setHorarioTurma(`${digits.slice(0, 2)}:${digits.slice(2, 4)}`);
                    }
                  }}
                  className={`w-full bg-[#1a1a1a] text-white text-xs border border-neutral-800 rounded-lg py-2 px-3 outline-none transition ${themeStyles.focus}`}
                />
              </div>

              {/* PROFESSOR RESPONSAVEL */}
              <div className="md:col-span-3 space-y-1 text-left">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Professor Responsável</label>
                <select
                  value={professorIdStr}
                  onChange={(e) => setProfessorIdStr(e.target.value)}
                  className={`w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-lg py-2 px-3 text-xs outline-none transition cursor-pointer ${themeStyles.focus}`}
                >
                  <option value="">Selecionar Professor</option>
                  {availableProfs.map((p) => {
                    const isUri = p.tipo === 'admin' || p.email === 'admin@admin.com' || p.nome.toLowerCase().includes('admin') || p.nome.toLowerCase().includes('uri cruz') || p.nome.toLowerCase().includes('yuri cruz');
                    return (
                      <option key={p.id} value={p.id}>
                        {isUri ? 'PROFESSOR YURI CRUZ' : `${p.nome} (${p.tipo === 'professor' ? 'Prof' : 'Instr'})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* ADICIONAR BUTTON */}
              <div className="md:col-span-1 flex justify-center w-full">
                <button
                  type="submit"
                  className="w-full md:w-9 h-11 md:h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95 gap-2"
                  title="Confirmar e Adicionar Turma"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span className="md:hidden text-xs font-bold uppercase tracking-wider">Adicionar Turma</span>
                </button>
              </div>

            </div>
          </form>

          {/* LISTA TURMAS */}
          <div className="space-y-2.5">
            {turmas.length > 0 ? (
              turmas.map((t: ClassUnit) => (
                <div
                  key={t.id}
                  className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800/80 flex justify-between items-center text-left hover:border-neutral-700 transition"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-white text-sm block">
                      🥋 {t.nome}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {formatDiasSemana(t.diaSemana || 'Segunda-feira')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        {t.horario}
                      </span>
                      {t.professorNome && (
                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold ${themeStyles.text}`}>
                          <Shield className="w-3.5 h-3.5" />
                          Mestre/Prof: {t.professorNome.replace(/Y+URI/gi, 'YURI').replace(/\bURI\b/gi, 'YURI')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleLockTurma?.(t.id)}
                      className={`p-2 rounded-lg transition active:scale-95 cursor-pointer ${
                        t.locked
                          ? 'text-orange-500 hover:bg-orange-500/10'
                          : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
                      }`}
                      title={t.locked ? 'Destravar Turma' : 'Travar Turma'}
                    >
                      {t.locked ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (t.locked) {
                          alert('Esta turma está protegida contra exclusão! Desative o cadeado para excluí-la.');
                          return;
                        }
                        setTurmaToDelete(t.id);
                      }}
                      className={`p-2 rounded-lg transition cursor-pointer active:scale-95 ${
                        t.locked
                          ? 'text-neutral-600 opacity-40 cursor-not-allowed'
                          : 'text-neutral-500 hover:text-red-500 hover:bg-red-500/10'
                      }`}
                      title="Remover Turma"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-50 text-sm">Nenhuma turma cadastrada no calendário</div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <AlunosPane
            currentUser={user}
            alunos={alunos}
            onAddAluno={onAddAluno}
            onToggleStatus={onToggleStatus}
            onDeletarAluno={onDeletarAluno}
            onChangePassword={onChangePassword}
            usuarios={usuarios}
            isAdmin={user?.tipo === 'admin'}
            onAprovarUsuario={onAprovarUsuario}
            onAddAuditLog={onAddAuditLog}
            onUpdateAluno={onUpdateAluno}
            onUpdateUsuario={onUpdateUsuario}
          />
        </div>
      )}

      {turmaToDelete !== null && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirmar Exclusão
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6">
              Deseja realmente excluir este horário/turma?
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setTurmaToDelete(null)}
                className="bg-[#1a1a1a] hover:bg-neutral-800 text-neutral-300 font-semibold text-xs py-2 px-4 rounded-xl transition cursor-pointer border border-neutral-800"
              >
                Não
              </button>
              <button
                onClick={() => {
                  onRemoveTurma(turmaToDelete);
                  setTurmaToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-600/15 transition cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
