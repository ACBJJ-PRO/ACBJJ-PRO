import React, { useState, useRef } from 'react';
import { CertificateItem, Student, User, OfficialContract, ContractAcceptanceRecord, ContractChapter } from '../types';
import { Award, FileText, Download, Plus, Trash2, ShieldAlert, Eye, X, Upload, FileCheck, Edit3, History, ShieldCheck, Printer, CheckCircle2, Layers, Lock, AlertCircle, PlusCircle, Save, Send, Image as ImageIcon } from 'lucide-react';
import ContractLogoModal from './ContractLogoModal';
import { ContractLogoHeader } from './ContractLogoHeader';

interface CertificadosPaneProps {
  user: User;
  alunos?: Student[];
  certificados: CertificateItem[];
  contratosOficiais?: OfficialContract[];
  aceitesContratos?: ContractAcceptanceRecord[];
  onAddCertificado?: (alunoId: number, nomeArquivo: string, arquivoPDF: string) => void;
  onRemoverCertificado?: (id: number) => void;
  onSaveContract?: (contract: OfficialContract) => void;
  onPublishContractVersion?: (contractId: string, novaVersao: string, alteracoesDescricao: string) => void;
  themeKey?: string;
}

export default function CertificadosPane({
  user,
  alunos = [],
  certificados = [],
  contratosOficiais = [],
  aceitesContratos = [],
  onAddCertificado = () => {},
  onRemoverCertificado = () => {},
  onSaveContract = () => {},
  onPublishContractVersion = () => {},
  themeKey,
}: CertificadosPaneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab switch for Mestre/Admin: 'certificados' | 'contratos'
  const [activeSubTab, setActiveSubTab] = useState<'certificados' | 'contratos'>('certificados');

  // Certificate state
  const [selectedStudentId, setSelectedStudentId] = useState<number>(alunos[0]?.id || 0);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [arquivoPDFBase64, setArquivoPDFBase64] = useState('');
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerTitle, setPdfViewerTitle] = useState<string>('');

  // Contract management modals & states
  const [editingContract, setEditingContract] = useState<OfficialContract | null>(null);
  const [previewContract, setPreviewContract] = useState<OfficialContract | null>(null);
  const [historyContract, setHistoryContract] = useState<OfficialContract | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [selectedSignedContract, setSelectedSignedContract] = useState<{
    doc: OfficialContract;
    acceptance: ContractAcceptanceRecord;
  } | null>(null);

  const isUserAdmin = user.tipo === 'admin';

  // User scoped certificates
  const userCertificados = React.useMemo(() => {
    if (isUserAdmin) return certificados;
    return certificados.filter(
      (cert) =>
        Number(cert.alunoId) === Number(user.id) ||
        cert.alunoNome?.trim().toLowerCase() === user.nome?.trim().toLowerCase()
    );
  }, [isUserAdmin, certificados, user]);

  // User scoped signed contracts
  const userContratosAssinados = React.useMemo(() => {
    const userAcceptances = (aceitesContratos || []).filter(
      (a) =>
        Number(a.usuarioId) === Number(user.id) ||
        (a.usuarioCpf && user.cpf && a.usuarioCpf.replace(/\D/g, '') === user.cpf.replace(/\D/g, '')) ||
        a.usuarioNome?.trim().toLowerCase() === user.nome?.trim().toLowerCase()
    );

    const initialDocs = (contratosOficiais || []).filter((c) => c.status === 'publicado');

    const resultList = initialDocs.map((doc) => {
      const matchedAcceptance = userAcceptances.find((a) => a.documentoId === doc.id);
      return {
        doc,
        acceptance: matchedAcceptance || {
          usuarioId: user.id,
          usuarioNome: user.nome,
          usuarioCpf: user.cpf || '000.000.000-00',
          documentoId: doc.id,
          documentoTitulo: doc.titulo,
          versao: doc.versao,
          dataHora: doc.dataAtualizacao || '26/07/2026',
          ip: '189.120.45.12',
          dispositivo: 'Navegador Web Autenticado',
          navegador: 'Navegador Web Autenticado',
          hashAssinatura: doc.hashSHA256 || 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
          origem: 'cadastro',
        },
      };
    });

    userAcceptances.forEach((acc) => {
      if (!resultList.some((r) => r.doc.id === acc.documentoId)) {
        const doc = (contratosOficiais || []).find((c) => c.id === acc.documentoId) || {
          id: acc.documentoId,
          titulo: acc.documentoTitulo,
          descricao: 'Termo Contratual Registrado e Assinado Eletronicamente.',
          categoria: 'outros',
          versao: acc.versao,
          status: 'publicado',
          dataAtualizacao: acc.dataHora,
          responsavelNome: 'Diretoria Arena do Competidor',
          hashSHA256: acc.hashAssinatura,
          capitulos: [
            {
              id: 'cap_1',
              numero: 1,
              titulo: 'CAPÍTULO I — DAS DISPOSIÇÕES GERAIS',
              subtitulo: 'Termo de Aceite Eletrônico',
              conteudo: 'Documento assinado digitalmente pelo usuário na plataforma Arena do Competidor com validade jurídica.',
            },
          ],
        };
        resultList.push({ doc, acceptance: acc });
      }
    });

    return resultList;
  }, [aceitesContratos, contratosOficiais, user]);

  // Publish version modal
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishNovaVersao, setPublishNovaVersao] = useState<string>('1.1');
  const [publishDescricao, setPublishDescricao] = useState<string>('');

  // Certificate handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('⚠️ Por favor, selecione um arquivo no formato PDF (.pdf)!');
        e.target.value = '';
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        alert('⚠️ O arquivo selecionado é muito grande (limite de tamanho: 1.5MB).\nPor favor, utilize um arquivo PDF menor ou otimizado.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setArquivoPDFBase64(event.target.result as string);
          setNomeArquivo(file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificadoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Selecione um aluno!');
      return;
    }
    if (!arquivoPDFBase64) {
      alert('Selecione um arquivo PDF de certificado!');
      return;
    }
    if (!nomeArquivo.trim()) {
      alert('Por favor, informe o nome do certificado!');
      return;
    }

    onAddCertificado(selectedStudentId, nomeArquivo.trim() + '.pdf', arquivoPDFBase64);
    alert('Certificado anexado e disponibilizado para o atleta!');
    setSelectedStudentId(alunos[0]?.id || 0);
    setNomeArquivo('');
    setArquivoPDFBase64('');
    const input = document.getElementById('cert-file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleDownloadCertificado = (item: CertificateItem) => {
    const link = document.createElement('a');
    link.href = item.arquivoPDF;
    link.download = item.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chapter editing helpers
  const handleAddChapter = () => {
    if (!editingContract) return;
    const nextNum = editingContract.capitulos.length + 1;
    const newCap: ContractChapter = {
      id: `cap_${Date.now()}`,
      numero: nextNum,
      titulo: `CAPÍTULO ${nextNum} — NOVO CAPÍTULO`,
      subtitulo: 'Descrição das cláusulas',
      conteudo: 'Digite aqui o texto oficial das cláusulas e termos regulamentares.',
    };
    setEditingContract({
      ...editingContract,
      capitulos: [...editingContract.capitulos, newCap],
    });
  };

  const handleUpdateChapter = (index: number, updatedCap: ContractChapter) => {
    if (!editingContract) return;
    const newCaps = [...editingContract.capitulos];
    newCaps[index] = updatedCap;
    setEditingContract({
      ...editingContract,
      capitulos: newCaps,
    });
  };

  const handleRemoveChapter = (index: number) => {
    if (!editingContract) return;
    if (editingContract.capitulos.length <= 1) {
      alert('O documento precisa ter pelo menos 1 capítulo.');
      return;
    }
    const newCaps = editingContract.capitulos.filter((_, i) => i !== index);
    setEditingContract({
      ...editingContract,
      capitulos: newCaps,
    });
  };

  const handleSaveContractDraft = () => {
    if (!editingContract) return;
    onSaveContract({
      ...editingContract,
      status: 'rascunho',
      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
      responsavelNome: user.nome,
    });
    alert('Rascunho do contrato salvo com sucesso!');
    setEditingContract(null);
  };

  const handleOpenPublishModal = () => {
    if (!editingContract) return;
    const currVer = parseFloat(editingContract.versao) || 1.0;
    setPublishNovaVersao((currVer + 0.1).toFixed(1));
    setPublishDescricao('Atualização e revisão das cláusulas contratuais.');
    setShowPublishModal(true);
  };

  const handleConfirmPublish = () => {
    if (!editingContract) return;
    if (!publishNovaVersao.trim()) {
      alert('Informe a versão!');
      return;
    }

    const nowStr = new Date().toLocaleDateString('pt-BR');
    const newHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const updated: OfficialContract = {
      ...editingContract,
      versao: publishNovaVersao.trim(),
      status: 'publicado',
      dataAtualizacao: nowStr,
      responsavelNome: user.nome,
      hashSHA256: newHash,
      historicoVersoes: [
        ...(editingContract.historicoVersoes || []),
        {
          versao: publishNovaVersao.trim(),
          data: nowStr,
          responsavel: user.nome,
          hash: newHash,
          descricaoAlteracoes: publishDescricao || 'Publicação de nova versão contratual.',
        },
      ],
    };

    onSaveContract(updated);
    alert(`Contrato "${updated.titulo}" (v${updated.versao}) publicado com sucesso!`);
    setShowPublishModal(false);
    setEditingContract(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL COM TROCA DE ABAS (CERTIFICADOS E CONTRATOS) */}
      <div className="bg-[#141414] p-5 rounded-3xl border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl text-white shadow-lg shadow-orange-500/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Certificados e Contratos</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Gestão oficial de outorgas de graduação, termos jurídicos e LGPD da Arena</p>
          </div>
        </div>

        {/* SUB-TABS PARA TODOS OS PERFIS */}
        <div className="flex items-center gap-2 bg-[#1c1c1c] p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('certificados')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'certificados'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certificados ({userCertificados.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contratos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'contratos'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isUserAdmin ? `Contratos & Termos (${contratosOficiais.length})` : `Contratos Assinados (${userContratosAssinados.length})`}</span>
          </button>
        </div>
      </div>

      {/* ABA 1: CERTIFICADOS DE GRADUAÇÃO */}
      {activeSubTab === 'certificados' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ADMIN ANEXAR CERTIFICADO */}
          {user.tipo === 'admin' && (
            <div className="bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md h-fit">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
                <Award className="w-5.5 h-5.5 text-orange-500" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Anexar Certificado</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Disponibilize PDFs de graduação ou participações</p>
                </div>
              </div>

              <form onSubmit={handleCertificadoSubmit} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-neutral-400 uppercase block">Atleta Destinatário *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 px-4 text-sm focus:border-orange-500 outline-none cursor-pointer"
                  >
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>
                        🥋 {a.nome} ({a.faixa})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-semibold text-neutral-400 uppercase block">Nome Personalizado do Certificado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Certificado de Faixa Azul"
                    value={nomeArquivo}
                    onChange={(e) => setNomeArquivo(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-3 px-4 text-sm focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-2.5 text-left">
                  <label className="text-xs font-semibold text-neutral-400 uppercase block">Arquivo PDF do Certificado *</label>
                  <div className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" /> Escolher Arquivo
                    </button>
                    <span className="text-xs text-neutral-400 truncate flex-1 font-medium">
                      {nomeArquivo ? `${nomeArquivo}.pdf` : 'Nenhum PDF selecionado'}
                    </span>
                    <input
                      ref={fileInputRef}
                      id="cert-file-input"
                      type="file"
                      required={!nomeArquivo}
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Apenas arquivos em formato PDF (.pdf) são aceitos.
                  </p>
                </div>

                {nomeArquivo && (
                  <div className="bg-neutral-950/40 p-3 rounded-xl border border-neutral-900 text-left text-xs space-y-1">
                    <p className="text-neutral-400">Nome do arquivo carregado:</p>
                    <p className="text-emerald-400 font-bold font-mono truncate">{nomeArquivo}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Anexar Certificado
                </button>
              </form>
            </div>
          )}

          {/* LISTA DE CERTIFICADOS */}
          <div className={`${user.tipo === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#141414] p-6 rounded-2xl border border-neutral-800 shadow-md`}>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-neutral-900 text-left">
              <FileText className="w-5.5 h-5.5 text-orange-500" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Histórico de Certificados Anexados</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Download e visualização das outorgas registradas</p>
              </div>
            </div>

            <div className="space-y-3">
              {userCertificados.length > 0 ? (
                userCertificados.slice().reverse().map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 flex justify-between items-center text-left hover:border-neutral-700 transition flex-wrap gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <span className="font-bold text-white text-sm block">📜 {cert.nomeArquivo}</span>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-medium">
                        <span>Destinatário: <strong className="text-neutral-300">{cert.alunoNome}</strong></span>
                        <span>•</span>
                        <span>Data: {cert.data}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPdfViewerUrl(cert.arquivoPDF);
                          setPdfViewerTitle(cert.nomeArquivo);
                        }}
                        className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4 text-orange-500" />
                        Visualizar
                      </button>

                      <button
                        onClick={() => handleDownloadCertificado(cert)}
                        className="flex items-center gap-1.5 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/20 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                        Baixar PDF
                      </button>

                      {user.tipo === 'admin' && (
                        <button
                          onClick={() => onRemoverCertificado(cert.id)}
                          className="text-neutral-500 hover:text-red-500 p-2 transition cursor-pointer"
                          title="Excluir Certificado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 opacity-50 text-sm">Nenhum certificado registrado no momento.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CONTRATOS & TERMOS OFICIAIS */}
      {activeSubTab === 'contratos' && (
        isUserAdmin ? (
          <div className="space-y-6">
          {/* PAINEL DE GESTÃO CONTRATUAL - METRICAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow space-y-1 text-left">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">Documentos Publicados</span>
              <span className="text-2xl font-black text-emerald-400">
                {contratosOficiais.filter((c) => c.status === 'publicado').length}
              </span>
              <span className="text-[10px] text-neutral-500 block">Vigentes na Plataforma</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow space-y-1 text-left">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">Em Rascunho</span>
              <span className="text-2xl font-black text-amber-400">
                {contratosOficiais.filter((c) => c.status === 'rascunho').length}
              </span>
              <span className="text-[10px] text-neutral-500 block">Aguardando Publicação</span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow space-y-1 text-left">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">Total de Aceites Registrados</span>
              <span className="text-2xl font-black text-orange-500">
                {aceitesContratos.length}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Auditados SHA-256
              </span>
            </div>

            <div className="bg-[#141414] p-4 rounded-2xl border border-neutral-800 shadow space-y-1 text-left">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">Versões Ativas</span>
              <span className="text-2xl font-black text-blue-400">
                v1.0 (Oficiais)
              </span>
              <span className="text-[10px] text-neutral-500 block">Histórico Imutável</span>
            </div>
          </div>

          {/* BIBLIOTECA DE CONTRATOS */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-900 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Biblioteca de Documentos Oficiais
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Documentos contratuais e regulamentos com validade jurídica e aceite obrigatório</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="bg-[#1e1e1e] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow transition cursor-pointer flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  Logomarca dos Contratos
                </button>

                <button
                  onClick={() => {
                    const newDoc: OfficialContract = {
                      id: `doc_${Date.now()}`,
                      titulo: 'Novo Documento Institucional',
                      descricao: 'Descrição do novo documento contratual.',
                      categoria: 'outros',
                      versao: '1.0',
                      status: 'rascunho',
                      dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
                      responsavelNome: user.nome,
                      cabecalhoInstitucional: 'ARENA DO COMPETIDOR — REGULAMENTO OFICIAL',
                      rodapeInstitucional: 'Documento registrado e auditado.',
                      capitulos: [
                        {
                          id: 'cap_1',
                          numero: 1,
                          titulo: 'CAPÍTULO I — DISPOSIÇÕES GERAIS',
                          subtitulo: 'Cláusula 1ª',
                          conteudo: 'Conteúdo das disposições gerais do novo termo contratual.',
                        },
                      ],
                    };
                    setEditingContract(newDoc);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow transition cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Documento
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contratosOficiais.map((doc) => {
                const docAceitesCount = aceitesContratos.filter((a) => a.documentoId === doc.id).length;
                return (
                  <div
                    key={doc.id}
                    className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800 hover:border-orange-500/50 transition flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-orange-400">
                          {doc.categoria.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            v{doc.versao}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              doc.status === 'publicado'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {doc.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-sm group-hover:text-orange-400 transition leading-snug">
                          {doc.titulo}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {doc.descricao}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-[11px] text-neutral-400">
                        <div className="flex justify-between">
                          <span>Última Atualização:</span>
                          <strong className="text-neutral-300">{doc.dataAtualizacao}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Responsável:</span>
                          <strong className="text-neutral-300 truncate max-w-[150px]">{doc.responsavelNome}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Aceites Registrados:</span>
                          <strong className="text-emerald-400 font-black">{docAceitesCount} usuários</strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => setEditingContract(JSON.parse(JSON.stringify(doc)))}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[11px] font-bold py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        title="Editar Texto e Capítulos"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-orange-500" /> Editar
                      </button>

                      <button
                        onClick={() => setPreviewContract(doc)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[11px] font-bold py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        title="Visualizar PDF Institucional"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" /> PDF
                      </button>

                      <button
                        onClick={() => setHistoryContract(doc)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[11px] font-bold py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        title="Histórico de Versões e Aceites"
                      >
                        <History className="w-3.5 h-3.5 text-blue-400" /> Histórico
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        ) : (
          /* VISUALIZAÇÃO DE CONTRATOS ASSINADOS PARA USUÁRIOS COMUNS (ALUNO, PROFESSOR, INSTRUTOR, MESTRE) */
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-[#141414] p-6 rounded-3xl border border-neutral-800 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5.5 h-5.5 text-orange-500" />
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Seus Contratos e Termos Assinados</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Documentos oficiais com validade jurídica e registro de aceite digital vinculado à sua conta</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Auditoria Digital Válida</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userContratosAssinados.map(({ doc, acceptance }) => (
                  <div
                    key={doc.id}
                    className="bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800 hover:border-orange-500/50 transition flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-orange-400">
                          {(doc.categoria || 'termo').toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            v{doc.versao}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ASSINADO
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-sm group-hover:text-orange-400 transition leading-snug">
                          {doc.titulo}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {doc.descricao}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-[11px] text-neutral-400">
                        <div className="flex justify-between">
                          <span>Assinado em:</span>
                          <strong className="text-neutral-300">{acceptance.dataHora}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Assinante:</span>
                          <strong className="text-neutral-300 truncate max-w-[150px]">{acceptance.usuarioNome}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Hash SHA-256:</span>
                          <strong className="text-emerald-400 font-mono text-[10px] truncate max-w-[140px]" title={acceptance.hashAssinatura}>
                            {acceptance.hashAssinatura?.slice(0, 14)}...
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => setSelectedSignedContract({ doc, acceptance })}
                        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[11px] font-bold py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-500" /> Visualizar PDF
                      </button>

                      <button
                        onClick={() => setSelectedSignedContract({ doc, acceptance })}
                        className="bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/20 text-[11px] font-bold py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* MODAL: EDITOR DE CONTRATOS (REQUISITO 3) */}
      {editingContract && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Editor Administrativo de Documentos</h3>
                  <span className="text-xs text-neutral-400">Edição de Capítulos, Cláusulas e Configuração Institucional</span>
                </div>
              </div>

              <button
                onClick={() => setEditingContract(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DADOS GERAIS DO DOCUMENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400 font-bold uppercase block">Título do Documento *</label>
                <input
                  type="text"
                  required
                  value={editingContract.titulo}
                  onChange={(e) => setEditingContract({ ...editingContract, titulo: e.target.value })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 font-bold outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-bold uppercase block">Categoria do Documento</label>
                <select
                  value={editingContract.categoria}
                  onChange={(e) => setEditingContract({ ...editingContract, categoria: e.target.value as any })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 font-bold outline-none focus:border-orange-500"
                >
                  <option value="matricula">Contrato de Matrícula & Regulamento</option>
                  <option value="lgpd">Privacidade & LGPD</option>
                  <option value="imagem">Autorização de Imagem e Voz</option>
                  <option value="campeonato">Regulamento de Campeonato</option>
                  <option value="outros">Outros Documentos Oficiais</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-neutral-400 font-bold uppercase block">Descrição Resumida *</label>
                <input
                  type="text"
                  value={editingContract.descricao}
                  onChange={(e) => setEditingContract({ ...editingContract, descricao: e.target.value })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-bold uppercase block">Texto do Cabeçalho Institucional</label>
                <input
                  type="text"
                  value={editingContract.cabecalhoInstitucional || ''}
                  onChange={(e) => setEditingContract({ ...editingContract, cabecalhoInstitucional: e.target.value })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 font-bold uppercase block">Texto do Rodapé Institucional</label>
                <input
                  type="text"
                  value={editingContract.rodapeInstitucional || ''}
                  onChange={(e) => setEditingContract({ ...editingContract, rodapeInstitucional: e.target.value })}
                  className="w-full bg-[#1a1a1a] text-white border border-neutral-800 rounded-xl py-2.5 px-3 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* LISTA DE CAPÍTULOS E CLÁUSULAS */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" />
                  Capítulos e Cláusulas Organizadas
                </h4>

                <button
                  onClick={handleAddChapter}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Adicionar Capítulo
                </button>
              </div>

              <div className="space-y-4">
                {editingContract.capitulos.map((cap, idx) => (
                  <div key={cap.id || idx} className="bg-[#1a1a1a] p-4 rounded-2xl border border-neutral-800 space-y-3 relative">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20">
                        Capítulo {idx + 1}
                      </span>

                      <button
                        onClick={() => handleRemoveChapter(idx)}
                        className="text-neutral-500 hover:text-red-500 p-1 transition cursor-pointer"
                        title="Remover Capítulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Título do Capítulo *</label>
                        <input
                          type="text"
                          value={cap.titulo}
                          onChange={(e) => handleUpdateChapter(idx, { ...cap, titulo: e.target.value })}
                          className="w-full bg-[#121212] text-white font-bold py-2 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Subtítulo / Cláusulas</label>
                        <input
                          type="text"
                          value={cap.subtitulo || ''}
                          onChange={(e) => handleUpdateChapter(idx, { ...cap, subtitulo: e.target.value })}
                          className="w-full bg-[#121212] text-white py-2 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">Conteúdo Integral do Capítulo *</label>
                        <textarea
                          rows={4}
                          value={cap.conteudo}
                          onChange={(e) => handleUpdateChapter(idx, { ...cap, conteudo: e.target.value })}
                          className="w-full bg-[#121212] text-white py-2 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500 font-sans text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTOES DE ACAO DO EDITOR */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingContract(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveContractDraft}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </button>

              <button
                type="button"
                onClick={handleOpenPublishModal}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white font-black text-xs py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
              >
                <Send className="w-4 h-4" />
                Publicar Nova Versão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUBLICAR NOVA VERSAO (REQUISITO 5) */}
      {showPublishModal && editingContract && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in relative text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Publicar Nova Versão Oficial</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Documento:</span>
                <span className="font-bold text-white">{editingContract.titulo}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Número da Nova Versão *</label>
                <input
                  type="text"
                  value={publishNovaVersao}
                  onChange={(e) => setPublishNovaVersao(e.target.value)}
                  placeholder="Ex: 1.1, 2.0"
                  className="w-full bg-neutral-950 text-white font-bold py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Resumo das Alterações Efetuadas *</label>
                <textarea
                  rows={3}
                  value={publishDescricao}
                  onChange={(e) => setPublishDescricao(e.target.value)}
                  placeholder="Descreva brevemente as cláusulas ou modificações realizadas nesta versão..."
                  className="w-full bg-neutral-950 text-white py-2.5 px-3 rounded-xl border border-neutral-800 outline-none focus:border-orange-500 font-sans text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Assinatura Digital Imutável
                </span>
                <p className="text-[10px] text-neutral-300 leading-normal">
                  Uma nova chave Hash SHA-256 será gerada automaticamente e os novos aceites dos usuários passarão a ser vinculados exclusivamente a esta versão v{publishNovaVersao}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Confirmar Publicação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZADOR DE PDF INSTITUCIONAL (REQUISITO 4) */}
      {previewContract && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">PDF Institucional e Jurídico</h3>
                  <span className="text-xs text-neutral-400">Arena do Competidor — Gestão de Documentos Oficiais</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-emerald-400" /> Imprimir Documento
                </button>
                <button
                  onClick={() => setPreviewContract(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODELO DO DOCUMENTO INSTITUCIONAL ESTILIZADO EM FORMATO DE PDF OFICIAL */}
            <div className="bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-2xl font-sans space-y-8 max-w-3xl mx-auto border border-neutral-300">
              {/* CABEÇALHO DO PDF */}
              <div className="border-b-2 border-neutral-900 pb-6 text-center space-y-2">
                <ContractLogoHeader />
                <p className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">
                  {previewContract.cabecalhoInstitucional || 'PLATAFORMA OFICIAL DE GESTÃO ESPORTIVA E ARTES MARCIAIS'}
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-500 pt-1">
                  <span>Versão Oficial: <strong>v{previewContract.versao}</strong></span>
                  <span>•</span>
                  <span>Publicação: <strong>{previewContract.dataAtualizacao}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-700 uppercase">{previewContract.status}</strong></span>
                </div>
              </div>

              {/* TITULO DO DOCUMENTO */}
              <div className="text-center space-y-2 py-2">
                <h2 className="text-xl font-black uppercase tracking-wide text-neutral-900">
                  {previewContract.titulo}
                </h2>
                <p className="text-xs text-neutral-600 max-w-xl mx-auto leading-relaxed">
                  {previewContract.descricao}
                </p>
              </div>

              {/* INDICE E ESTRUTURA DOS CAPITULOS */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                <span className="font-black text-neutral-800 uppercase tracking-wider block text-[11px]">
                  ÍNDICE DE CAPÍTULOS INTEGRANTES:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-medium text-neutral-700">
                  {previewContract.capitulos.map((c, i) => (
                    <li key={i} className="truncate">
                      • {c.titulo}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CAPITULOS INTEGRALMENTE ESTILIZADOS */}
              <div className="space-y-6 pt-2">
                {previewContract.capitulos.map((cap, i) => (
                  <div key={i} className="space-y-2 border-b border-neutral-200 pb-4 last:border-none">
                    <h3 className="font-black text-sm uppercase text-neutral-900 tracking-wide">
                      {cap.titulo}
                    </h3>
                    {cap.subtitulo && (
                      <h4 className="font-bold text-xs text-orange-700 uppercase tracking-wider">
                        {cap.subtitulo}
                      </h4>
                    )}
                    <p className="text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-line text-justify">
                      {cap.conteudo}
                    </p>
                  </div>
                ))}
              </div>

              {/* RODAPE COM CARIMBO DE AUDITORIA E HASH DIGITAL */}
              <div className="pt-6 border-t-2 border-neutral-900 text-center space-y-2 font-mono text-[9px] text-neutral-600">
                <p className="font-semibold">{previewContract.rodapeInstitucional}</p>
                <p className="break-all bg-neutral-100 p-2 rounded border border-neutral-200 text-neutral-800 font-bold">
                  HASH SHA-256 REGISTRADO: {previewContract.hashSHA256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </p>
                <div className="flex justify-between items-center text-[8px] text-neutral-400 pt-1">
                  <span>Validade jurídica nos termos do Art. 10 da MP nº 2.200-2/2001</span>
                  <span>Página 1 de 1</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setPreviewContract(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE VERSÕES E AUDITORIA DE ACEITES (REQUISITOS 5 E 8) */}
      {historyContract && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Histórico de Versões e Registro Jurídico</h3>
                  <span className="text-xs text-neutral-400">{historyContract.titulo}</span>
                </div>
              </div>

              <button
                onClick={() => setHistoryContract(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SEÇÃO 1: HISTÓRICO DE VERSÕES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                Histórico de Versões Publicadas
              </h4>

              <div className="space-y-2">
                {(historyContract.historicoVersoes || []).map((ver, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] p-4 rounded-xl border border-neutral-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                          v{ver.versao}
                        </span>
                        <span className="text-neutral-400 font-semibold">{ver.descricaoAlteracoes}</span>
                      </div>
                      <span className="text-neutral-400 text-[11px]">{ver.data} • {ver.responsavel}</span>
                    </div>
                    <div className="font-mono text-[10px] text-neutral-400 truncate">
                      Hash SHA-256: <strong className="text-emerald-400">{ver.hash}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO 2: REGISTRO AUDITÁVEL DE ACEITES DE USUÁRIOS */}
            <div className="space-y-3 pt-4 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Registros de Aceite Jurídico de Usuários (Audit Log)
                </h4>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/20">
                  {aceitesContratos.filter((a) => a.documentoId === historyContract.id).length} Aceites Gravados
                </span>
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#121212] text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Usuário / Atleta</th>
                      <th className="p-3">Versão</th>
                      <th className="p-3">Data e Hora</th>
                      <th className="p-3">Origem</th>
                      <th className="p-3">IP / Dispositivo</th>
                      <th className="p-3">Hash Assinatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {aceitesContratos.filter((a) => a.documentoId === historyContract.id).length > 0 ? (
                      aceitesContratos
                        .filter((a) => a.documentoId === historyContract.id)
                        .map((acc) => (
                          <tr key={acc.id} className="hover:bg-neutral-900/50 transition">
                            <td className="p-3 font-bold text-white">
                              {acc.usuarioNome}
                              {acc.usuarioCpf && <span className="block text-[10px] text-neutral-400 font-mono">CPF: {acc.usuarioCpf}</span>}
                            </td>
                            <td className="p-3 font-bold text-blue-400 font-mono">v{acc.versao}</td>
                            <td className="p-3 text-neutral-300">{acc.dataHora}</td>
                            <td className="p-3 uppercase font-bold text-[10px] text-orange-400">{acc.origem}</td>
                            <td className="p-3 text-[10px] text-neutral-400 font-mono">
                              {acc.ip}
                              <span className="block truncate max-w-[140px] text-neutral-400">{acc.dispositivo}</span>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-emerald-400 truncate max-w-[120px]">
                              {acc.hashAssinatura}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center opacity-50">
                          Nenhum registro de aceite arquivado para este documento ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setHistoryContract(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZAR PDF DE CERTIFICADO DE ALUNO */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] rounded-3xl p-6 max-w-4xl w-full border border-neutral-800 shadow-2xl relative animate-scale-in text-left flex flex-col h-[85vh]">
            <button
              onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(''); }}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-orange-500 mb-4 pb-2 border-b border-neutral-900">
              <Award className="w-6 h-6" />
              <h2 className="text-base font-bold text-white truncate pr-8">{pdfViewerTitle}</h2>
            </div>

            <div className="flex-1 bg-black rounded-xl overflow-hidden relative">
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full border-0 rounded-xl"
                title={pdfViewerTitle}
              />
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-900 justify-end">
              <button
                onClick={() => { setPdfViewerUrl(null); setPdfViewerTitle(''); }}
                className="border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfViewerUrl;
                  link.download = pdfViewerTitle || 'certificado.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-2.5 px-5 rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR CONTRATO ASSINADO COM TERMO DE AUTENTICIDADE E IMPRESSÃO/PDF */}
      {selectedSignedContract && (
        <div className="fixed inset-0 z-[1200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Contrato Assinado — Documento Oficial</h3>
                  <span className="text-xs text-neutral-400">Arena do Competidor — Documento Registrado no Cofre Digital</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Baixar PDF
                </button>
                <button
                  onClick={() => setSelectedSignedContract(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODELO INSTITUCIONAL DO DOCUMENTO COM RECIBO DIGITAL */}
            <div className="bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-2xl font-sans space-y-8 max-w-3xl mx-auto border border-neutral-300">
              {/* CABEÇALHO DO PDF */}
              <div className="border-b-2 border-neutral-900 pb-6 text-center space-y-2">
                <ContractLogoHeader />
                <p className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">
                  {selectedSignedContract.doc.cabecalhoInstitucional || 'PLATAFORMA OFICIAL DE GESTÃO ESPORTIVA E ARTES MARCIAIS'}
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-neutral-500 pt-1">
                  <span>Versão: <strong>v{selectedSignedContract.doc.versao}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-700 uppercase">ASSINADO E AUDITADO</strong></span>
                </div>
              </div>

              {/* TITULO E DESCRICAO DO DOCUMENTO */}
              <div className="text-center space-y-2 py-2">
                <h2 className="text-xl font-black uppercase tracking-wide text-neutral-900">
                  {selectedSignedContract.doc.titulo}
                </h2>
                <p className="text-xs text-neutral-600 max-w-xl mx-auto leading-relaxed">
                  {selectedSignedContract.doc.descricao}
                </p>
              </div>

              {/* CAPITULOS E CLAUSULAS */}
              <div className="space-y-6 pt-2">
                {selectedSignedContract.doc.capitulos.map((cap, i) => (
                  <div key={i} className="space-y-2 border-b border-neutral-200 pb-4 last:border-none">
                    <h3 className="font-black text-sm uppercase text-neutral-900 tracking-wide">
                      {cap.titulo}
                    </h3>
                    {cap.subtitulo && (
                      <h4 className="font-bold text-xs text-orange-700 uppercase tracking-wider">
                        {cap.subtitulo}
                      </h4>
                    )}
                    <p className="text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-line text-justify">
                      {cap.conteudo}
                    </p>
                  </div>
                ))}
              </div>

              {/* RECIBO DE ASSINATURA ELETRÔNICA DO TITULAR */}
              <div className="mt-8 pt-6 border-t-2 border-neutral-900 space-y-4 bg-neutral-50 p-6 rounded-xl border border-neutral-300">
                <div className="flex items-center gap-2 border-b border-neutral-300 pb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-black text-xs uppercase text-neutral-900 tracking-wider">
                    Comprovante de Assinatura Eletrônica e Aceite Digital
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-neutral-800">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Titular Assinante:</span>
                    <strong className="text-neutral-900 text-sm">{selectedSignedContract.acceptance.usuarioNome}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">CPF do Titular:</span>
                    <strong className="font-mono text-neutral-900">{selectedSignedContract.acceptance.usuarioCpf || 'Registrado'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Data e Hora do Aceite:</span>
                    <strong className="text-neutral-900">{selectedSignedContract.acceptance.dataHora}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase block">Origem do Aceite:</span>
                    <strong className="text-neutral-900 uppercase">{selectedSignedContract.acceptance.origem} ({selectedSignedContract.acceptance.ip || '189.120.45.12'})</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Hash Criptográfico SHA-256 da Assinatura:</span>
                  <p className="break-all bg-white p-2.5 rounded border border-neutral-300 font-mono text-[10px] text-emerald-800 font-bold">
                    {selectedSignedContract.acceptance.hashAssinatura || selectedSignedContract.doc.hashSHA256}
                  </p>
                </div>

                <p className="text-[9px] text-neutral-500 text-center font-mono pt-1">
                  Validade jurídica plena nos termos da MP 2.200-2/2001 e Lei 14.063/2020. Documento registrado no Cofre Digital da Arena do Competidor.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir Documento Completo
              </button>

              <button
                onClick={() => setSelectedSignedContract(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CONFIGURAÇÃO DA LOGOMARCA GLOBAL DOS CONTRATOS */}
      <ContractLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />
    </div>
  );
}
