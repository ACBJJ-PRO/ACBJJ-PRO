import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Check, Eye, EyeOff, PlusCircle, X, Upload, Image as ImageIcon } from 'lucide-react';
import { getAuthHeaders } from '../utils/authHeaders';

interface Championship {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  horario: string;
  location: string;
  city: string;
  modalidades: string[];
  disputa: string;
  price: number;
  status: 'Inscrições Abertas' | 'Oculto' | 'Em Preparação' | 'Inscrições Encerradas';
  limitDate: string;
  maxInscritos?: number;
  whatsapp: string;
  banner: string;
  allowedFaixas?: string[];
  allowedCategories?: string[];
  allowedGeneros?: string[];
  allowedPesos?: string[];
}

interface ConfrontoAdminCampeonatosProps {
  confrontoCampeonatos: Championship[];
  onUpdateCampeonatos: (updated: Championship[]) => void;
  addAuditLog: (action: string, details: string) => void;
  confrontoInscricoes?: any[];
}

export default function ConfrontoAdminCampeonatos({
  confrontoCampeonatos,
  onUpdateCampeonatos,
  addAuditLog,
  confrontoInscricoes = []
}: ConfrontoAdminCampeonatosProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingChamp, setEditingChamp] = useState<Partial<Championship> | null>(null);
  const [newModality, setNewModality] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Apenas formatos compatíveis são aceitos: PNG, JPG, JPEG ou WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 562;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          if (editingChamp) {
            setEditingChamp({
              ...editingChamp,
              banner: optimizedBase64
            });
            setImageError(false);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    if (editingChamp) {
      setEditingChamp({
        ...editingChamp,
        banner: ''
      });
    }
  };

  const handleStartCreate = () => {
    setEditingChamp({
      id: `ch-${Date.now()}`,
      title: '',
      subtitle: '',
      date: '',
      horario: '09:00',
      location: '',
      city: '',
      modalidades: ['Gi (Kimono)', 'No-Gi'],
      disputa: 'Absoluto',
      price: 150.0,
      status: 'Em Preparação',
      limitDate: '',
      whatsapp: '(98) 97014-9967',
      banner: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop',
      allowedFaixas: ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'],
      allowedCategories: [
        'Mirim (6-7 anos)',
        'Infantil (8-9 anos)',
        'Infanto-Juvenil (10-14 anos)',
        'Juvenil (15-17 anos)',
        'Adulto (18-29 anos)',
        'Master 1 (30-35 anos)',
        'Master 2 (Acima de 36)'
      ],
      allowedGeneros: ['Masculino', 'Feminino'],
      allowedPesos: [
        'Pena (-64kg)',
        'Leve (-70kg)',
        'Médio (-76kg)',
        'Meio-Pesado (-82.3kg)',
        'Pesado (-88.3kg)',
        'Super-Pesado (-94.3kg)',
        'Pesadíssimo (+94.3kg)',
        'Absoluto'
      ]
    });
    setIsEditing(true);
  };

  const handleStartEdit = (champ: Championship) => {
    setEditingChamp({ ...champ });
    setIsEditing(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Deseja realmente deletar o campeonato "${title}"? Esta ação é irreversível!`)) {
      try {
        const res = await fetch(`/api/cloudsql/campeonatos/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Erro ao deletar campeonato');
        }
        const updated = confrontoCampeonatos.filter(c => c.id !== id);
        onUpdateCampeonatos(updated);
        addAuditLog('Campeonato Deletado', `Deletou o campeonato: "${title}" (ID: ${id})`);
      } catch (err: any) {
        alert(`Erro ao excluir no banco: ${err?.message || err}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChamp || !editingChamp.title || !editingChamp.date || !editingChamp.location || !editingChamp.city) {
      alert('Por favor, preencha todos os campos obrigatórios (Título, Data, Local e Cidade)!');
      return;
    }

    try {
      const payload = {
        id: editingChamp.id,
        nome: editingChamp.title,
        data: editingChamp.date,
        local: editingChamp.location,
        status: editingChamp.status || 'Em Preparação',
        bannerUrl: editingChamp.banner,
        ...editingChamp
      };
      const res = await fetch('/api/cloudsql/campeonatos/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ campeonato: payload })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar no banco');
      }

      const exists = confrontoCampeonatos.some(c => c.id === editingChamp.id);
      let updated: Championship[];

      if (exists) {
        updated = confrontoCampeonatos.map(c => c.id === editingChamp.id ? (editingChamp as Championship) : c);
        addAuditLog('Campeonato Editado', `Editou o campeonato: "${editingChamp.title}"`);
      } else {
        updated = [...confrontoCampeonatos, editingChamp as Championship];
        addAuditLog('Campeonato Criado', `Criou o campeonato: "${editingChamp.title}"`);
      }

      onUpdateCampeonatos(updated);
      setIsEditing(false);
      setEditingChamp(null);
    } catch (err: any) {
      alert(`Erro ao salvar campeonato: ${err?.message || err}`);
    }
  };

  const handleAddModality = () => {
    if (!newModality.trim() || !editingChamp) return;
    const currentMods = editingChamp.modalidades || [];
    if (!currentMods.includes(newModality.trim())) {
      setEditingChamp({
        ...editingChamp,
        modalidades: [...currentMods, newModality.trim()]
      });
    }
    setNewModality('');
  };

  const handleRemoveModality = (index: number) => {
    if (!editingChamp) return;
    const currentMods = editingChamp.modalidades || [];
    const updatedMods = currentMods.filter((_, i) => i !== index);
    setEditingChamp({
      ...editingChamp,
      modalidades: updatedMods
    });
  };

  const toggleStatus = async (champ: Championship) => {
    const nextStatusMap: { [key: string]: 'Inscrições Abertas' | 'Oculto' | 'Em Preparação' | 'Inscrições Encerradas' } = {
      'Em Preparação': 'Inscrições Abertas',
      'Inscrições Abertas': 'Oculto',
      'Oculto': 'Inscrições Encerradas',
      'Inscrições Encerradas': 'Em Preparação'
    };
    const nextStatus = nextStatusMap[champ.status] || 'Inscrições Abertas';
    const updatedChamp = { ...champ, status: nextStatus };

    try {
      const payload = {
        id: updatedChamp.id,
        nome: updatedChamp.title,
        data: updatedChamp.date,
        local: updatedChamp.location,
        status: updatedChamp.status,
        bannerUrl: updatedChamp.banner,
        ...updatedChamp
      };
      const res = await fetch('/api/cloudsql/campeonatos/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ campeonato: payload })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar status');
      }

      const updated = confrontoCampeonatos.map(c => c.id === champ.id ? updatedChamp : c);
      onUpdateCampeonatos(updated);
      addAuditLog('Status Campeonato Alterado', `Alterou o status do campeonato "${champ.title}" para: "${nextStatus}"`);
    } catch (err: any) {
      alert(`Erro ao atualizar status: ${err?.message || err}`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2.5">
            <span className="text-xs font-black text-white uppercase tracking-wider">Campeonatos Cadastrados ({confrontoCampeonatos.length})</span>
            <button
              onClick={handleStartCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black uppercase py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/15"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Campeonato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confrontoCampeonatos.map((champ) => (
              <div key={champ.id} className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-750 transition duration-200">
                <div className="flex gap-4 items-start">
                  <img
                    src={champ.banner || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop'}
                    alt={champ.title}
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-800 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <strong className="text-white text-xs block truncate uppercase font-black tracking-wide">{champ.title}</strong>
                    {champ.subtitle && <span className="text-[10px] text-neutral-400 block truncate">{champ.subtitle}</span>}
                    <span className="text-[10px] text-neutral-500 block truncate">📅 {champ.date} às {champ.horario} • {champ.city}</span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(() => {
                        const confirmedCount = (confrontoInscricoes || []).filter(
                          r => r.campeonatoId === champ.id && r.status === 'Pagamento Confirmado'
                        ).length;
                        const isFull = champ.maxInscritos ? (confirmedCount >= champ.maxInscritos) : false;
                        
                        let hasExpired = false;
                        if (champ.limitDate) {
                          try {
                            const parts = champ.limitDate.split('/');
                            if (parts.length === 3) {
                              const limit = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59);
                              if (new Date() > limit) {
                                hasExpired = true;
                              }
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }

                        const isClosed = (champ.status as string) === 'Inscrições Encerradas' || (champ.status as string) === 'Encerrado' || isFull || hasExpired;
                        const isPrep = (champ.status as string) === 'Em Preparação' || (champ.status as string) === 'Em preparação';
                        
                        const statusText = isPrep 
                          ? 'Em Preparação' 
                          : isClosed 
                          ? 'Inscrições Encerradas' 
                          : champ.status === 'Oculto' 
                          ? 'Oculto' 
                          : 'Inscrições Abertas';
                        
                        const statusBg = isPrep 
                          ? 'bg-orange-500' 
                          : isClosed 
                          ? 'bg-red-600' 
                          : champ.status === 'Oculto' 
                          ? 'bg-neutral-700' 
                          : 'bg-emerald-600';

                        return (
                          <span className={`text-[9px] font-black uppercase py-1 px-2 rounded text-white shadow-md ${statusBg}`}>
                            {statusText}
                          </span>
                        );
                      })()}
                      <span className="text-[9px] text-orange-500 font-bold">R$ {champ.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-neutral-900">
                  <button
                    onClick={() => toggleStatus(champ)}
                    className="p-1.5 bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Mudar Status"
                  >
                    {champ.status === 'Inscrições Abertas' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleStartEdit(champ)}
                    className="p-1.5 bg-neutral-950 border border-neutral-850 hover:border-neutral-700 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(champ.id, champ.title)}
                    className="p-1.5 bg-neutral-950 border border-neutral-850 hover:border-red-900 rounded-lg text-neutral-500 hover:text-red-500 transition cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        editingChamp && (
          <form onSubmit={handleSave} className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-3xl space-y-6">
            <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-neutral-950 pb-3">
              {editingChamp.id ? '✏️ Editar Campeonato' : '🏆 Criar Campeonato'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Nome do Campeonato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Copa Sul-Americana ACBJJ Pro 2026"
                  value={editingChamp.title}
                  onChange={(e) => setEditingChamp({ ...editingChamp, title: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Subtítulo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Edição Especial de Primavera"
                  value={editingChamp.subtitle || ''}
                  onChange={(e) => setEditingChamp({ ...editingChamp, subtitle: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Data do Campeonato</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 15/11/2026"
                  value={editingChamp.date}
                  onChange={(e) => setEditingChamp({ ...editingChamp, date: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Horário de Início</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 09:00"
                  value={editingChamp.horario}
                  onChange={(e) => setEditingChamp({ ...editingChamp, horario: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Local (Ginásio/Arena)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arena Carioca 1"
                  value={editingChamp.location}
                  onChange={(e) => setEditingChamp({ ...editingChamp, location: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Cidade - UF</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rio de Janeiro - RJ"
                  value={editingChamp.city}
                  onChange={(e) => setEditingChamp({ ...editingChamp, city: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Valor da Inscrição (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingChamp.price || 0}
                  onChange={(e) => setEditingChamp({ ...editingChamp, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Situação</label>
                <select
                  value={editingChamp.status}
                  onChange={(e) => setEditingChamp({ ...editingChamp, status: e.target.value as any })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none cursor-pointer"
                >
                  <option value="Em Preparação">Em Preparação</option>
                  <option value="Inscrições Abertas">Inscrições Abertas</option>
                  <option value="Oculto">Oculto</option>
                  <option value="Inscrições Encerradas">Inscrições Encerradas</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Data Limite de Inscrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 10/11/2026"
                  value={editingChamp.limitDate}
                  onChange={(e) => setEditingChamp({ ...editingChamp, limitDate: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Quantidade Máxima de Inscritos (Opcional)</label>
                <input
                  type="number"
                  placeholder="Ex: 200 (deixe vazio para ilimitado)"
                  value={editingChamp.maxInscritos || ''}
                  onChange={(e) => setEditingChamp({ ...editingChamp, maxInscritos: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Contato WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (98) 97014-9967"
                  value={editingChamp.whatsapp}
                  onChange={(e) => setEditingChamp({ ...editingChamp, whatsapp: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider">Tipo de Disputa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Absoluto, Não Absoluto, Absoluto Opcional"
                  value={editingChamp.disputa}
                  onChange={(e) => setEditingChamp({ ...editingChamp, disputa: e.target.value })}
                  className="w-full bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-3 px-4 outline-none"
                />
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider block">Foto de Capa (Upload)</label>
                <div className="border border-neutral-850 rounded-xl p-3 bg-[#1c1c1c] flex flex-col items-center justify-center gap-3 min-h-[140px] relative overflow-hidden group">
                  {editingChamp.banner ? (
                    <div className="w-full h-36 relative rounded-lg overflow-hidden border border-neutral-800">
                      <img 
                        src={editingChamp.banner} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1 transition">
                          <Upload className="w-3 h-3" />
                          Substituir
                          <input 
                            type="file" 
                            accept=".png,.jpg,.jpeg,.webp" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={handleRemoveImage}
                          className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center gap-2 py-4 border border-dashed border-neutral-800 hover:border-orange-500/50 rounded-lg cursor-pointer transition text-center group">
                      <div className="p-2.5 rounded-full bg-neutral-900 group-hover:bg-orange-500/10 text-neutral-500 group-hover:text-orange-500 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">Escolha uma imagem</span>
                        <span className="text-[9px] text-neutral-500 block">PNG, JPG, JPEG, WEBP • Otimização automática</span>
                      </div>
                      <input 
                        type="file" 
                        accept=".png,.jpg,.jpeg,.webp" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Modalities sub-management */}
            <div className="space-y-2 border-t border-neutral-850 pt-4">
              <label className="text-[9px] uppercase font-black text-neutral-400 tracking-wider block">Modalidades do Campeonato</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: No-Gi, Kids, Juvenil"
                  value={newModality}
                  onChange={(e) => setNewModality(e.target.value)}
                  className="flex-1 bg-[#1c1c1c] text-white text-xs border border-neutral-850 focus:border-orange-500 rounded-xl py-2 px-3 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddModality}
                  className="bg-neutral-850 hover:bg-neutral-850 border border-neutral-800 text-orange-500 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {(editingChamp.modalidades || []).map((mod, idx) => (
                  <span key={idx} className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                    {mod}
                    <button type="button" onClick={() => handleRemoveModality(idx)} className="text-red-500 hover:text-red-400 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Authorized Categories Filters */}
            <div className="space-y-4 border-t border-neutral-850 pt-6">
              <div>
                <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-wider flex items-center gap-1">
                  <span>🔒 Filtros de Categorias Autorizadas</span>
                </h5>
                <p className="text-[10px] text-neutral-400">Marque apenas as opções que estarão habilitadas para inscrição dos atletas neste campeonato.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-neutral-950/60 border border-neutral-850 p-5 rounded-2xl">
                {/* Gêneros */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-900 pb-1.5">Gêneros</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {['Masculino', 'Feminino'].map((gen) => {
                      const list = editingChamp.allowedGeneros || ['Masculino', 'Feminino'];
                      const checked = list.includes(gen);
                      return (
                        <label key={gen} className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newList = checked ? list.filter(g => g !== gen) : [...list, gen];
                              setEditingChamp({ ...editingChamp, allowedGeneros: newList });
                            }}
                            className="accent-orange-500 h-3.5 w-3.5 rounded border-neutral-800 bg-[#1c1c1c] text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <span>{gen}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Faixas */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-900 pb-1.5">Graduações (Faixas)</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'].map((faixa) => {
                      const list = editingChamp.allowedFaixas || ['Branca', 'Cinza', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Roxa', 'Marrom', 'Preta'];
                      const checked = list.includes(faixa);
                      return (
                        <label key={faixa} className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newList = checked ? list.filter(f => f !== faixa) : [...list, faixa];
                              setEditingChamp({ ...editingChamp, allowedFaixas: newList });
                            }}
                            className="accent-orange-500 h-3.5 w-3.5 rounded border-neutral-800 bg-[#1c1c1c] text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <span>{faixa}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Categorias de Idade */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-900 pb-1.5">Idades</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {[
                      'Mirim (6-7 anos)',
                      'Infantil (8-9 anos)',
                      'Infanto-Juvenil (10-14 anos)',
                      'Juvenil (15-17 anos)',
                      'Adulto (18-29 anos)',
                      'Master 1 (30-35 anos)',
                      'Master 2 (Acima de 36)'
                    ].map((cat) => {
                      const list = editingChamp.allowedCategories || [
                        'Mirim (6-7 anos)',
                        'Infantil (8-9 anos)',
                        'Infanto-Juvenil (10-14 anos)',
                        'Juvenil (15-17 anos)',
                        'Adulto (18-29 anos)',
                        'Master 1 (30-35 anos)',
                        'Master 2 (Acima de 36)'
                      ];
                      const checked = list.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newList = checked ? list.filter(c => c !== cat) : [...list, cat];
                              setEditingChamp({ ...editingChamp, allowedCategories: newList });
                            }}
                            className="accent-orange-500 h-3.5 w-3.5 rounded border-neutral-800 bg-[#1c1c1c] text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Categorias de Peso */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-black text-neutral-300 tracking-wider block border-b border-neutral-900 pb-1.5">Pesos</span>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {[
                      'Pena (-64kg)',
                      'Leve (-70kg)',
                      'Médio (-76kg)',
                      'Meio-Pesado (-82.3kg)',
                      'Pesado (-88.3kg)',
                      'Super-Pesado (-94.3kg)',
                      'Pesadíssimo (+94.3kg)',
                      'Absoluto'
                    ].map((peso) => {
                      const list = editingChamp.allowedPesos || [
                        'Pena (-64kg)',
                        'Leve (-70kg)',
                        'Médio (-76kg)',
                        'Meio-Pesado (-82.3kg)',
                        'Pesado (-88.3kg)',
                        'Super-Pesado (-94.3kg)',
                        'Pesadíssimo (+94.3kg)',
                        'Absoluto'
                      ];
                      const checked = list.includes(peso);
                      return (
                        <label key={peso} className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newList = checked ? list.filter(p => p !== peso) : [...list, peso];
                              setEditingChamp({ ...editingChamp, allowedPesos: newList });
                            }}
                            className="accent-orange-500 h-3.5 w-3.5 rounded border-neutral-800 bg-[#1c1c1c] text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <span>{peso}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-neutral-950">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingChamp(null);
                }}
                className="bg-neutral-950 border border-neutral-850 text-neutral-300 hover:text-white font-extrabold text-xs py-3 px-6 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition cursor-pointer shadow-md shadow-orange-500/15"
              >
                Salvar Campeonato
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
}
