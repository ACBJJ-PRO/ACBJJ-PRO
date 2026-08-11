import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Palette, Check, X, ShieldCheck, Eye, RotateCcw, Sparkles } from 'lucide-react';
import {
  ContractLogoConfig,
  getContractLogoConfig,
  saveContractLogoConfig,
  DEFAULT_CONTRACT_LOGO_CONFIG,
} from '../utils/contractLogoUtils';
import { ContractLogoHeader } from './ContractLogoHeader';

interface ContractLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: ContractLogoConfig) => void;
}

const COLOR_PRESETS = [
  { name: 'Laranja', hex: '#ea580c' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Preto', hex: '#000000' },
  { name: 'Branco', hex: '#ffffff' },
  { name: 'Vermelho', hex: '#dc2626' },
  { name: 'Cinza Escuro', hex: '#1c1c1e' },
];

export default function ContractLogoModal({ isOpen, onClose, onSaved }: ContractLogoModalProps) {
  const [config, setConfig] = useState<ContractLogoConfig>(DEFAULT_CONTRACT_LOGO_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getContractLogoConfig());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem selecionada excede o limite de 5MB. Por favor escolha um arquivo menor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setConfig((prev) => ({
        ...prev,
        imageUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setConfig((prev) => ({
      ...prev,
      imageUrl: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_CONTRACT_LOGO_CONFIG);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    saveContractLogoConfig(config);
    setSavedSuccess(true);
    if (onSaved) {
      onSaved(config);
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#141414] border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left">
        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Logomarca dos Contratos
              </h3>
              <p className="text-xs text-neutral-400">
                Gerenciamento global da identidade visual aplicada a todos os documentos oficiais
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERT/STATUS DE PERSISTÊNCIA GLOBAL */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2.5 text-xs text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Configuração Global:</strong> A logomarca e estilos configurados aqui serão utilizados automaticamente em <strong>todos os contratos existentes, novos documentos, exibições na tela e PDFs gerados.</strong>
          </span>
        </div>

        {/* SEÇÃO 1: UPLOAD DA LOGOMARCA */}
        <div className="space-y-3 bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" />
              Upload da Logomarca Oficial
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">PNG, SVG, JPG, WEBP</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/svg+xml, image/jpeg, image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {config.imageUrl ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#121212] rounded-xl border border-neutral-800">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center p-2 shadow border border-neutral-800 shrink-0"
                  style={{ backgroundColor: config.showBox ? config.boxColor : 'transparent' }}
                >
                  <img
                    src={config.imageUrl}
                    alt="Preview Upload"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Logomarca Carregada</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" /> Imagem Ativa no Sistema
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl border border-neutral-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-orange-400" /> Trocar Imagem
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-orange-500/60 bg-[#121212] hover:bg-neutral-900/60 p-6 rounded-xl text-center cursor-pointer transition space-y-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-white block">Clique para selecionar a logomarca</span>
                <span className="text-[11px] text-neutral-400 block mt-1">
                  Recomendado: PNG com fundo transparente ou SVG
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: PERSONALIZAÇÃO DA CAIXA E CORES */}
        <div className="space-y-4 bg-[#1a1a1a] p-5 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-400" />
              Personalização da Caixa da Logomarca
            </label>
          </div>

          {/* TOGGLE DA CAIXA DE FUNDO */}
          <label className="flex items-center justify-between p-3.5 bg-[#121212] rounded-xl border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
            <div className="space-y-0.5 text-left">
              <span className="text-xs font-bold text-white block">Exibir caixa atrás da logomarca</span>
              <span className="text-[11px] text-neutral-400 block">
                Cria um container colorido ao fundo. Desative caso prefira exibir apenas a imagem PNG transparente direta.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.showBox}
              onChange={(e) => setConfig((prev) => ({ ...prev, showBox: e.target.checked }))}
              className="w-5 h-5 accent-orange-500 rounded cursor-pointer shrink-0"
            />
          </label>

          {/* SELETOR DE COR DA CAIXA */}
          {config.showBox && (
            <div className="space-y-3 pt-2 text-left animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Cor de Fundo da Caixa:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.boxColor || '#ea580c'}
                    onChange={(e) => setConfig((prev) => ({ ...prev, boxColor: e.target.value }))}
                    className="w-8 h-8 rounded-lg bg-transparent border border-neutral-700 cursor-pointer"
                    title="Escolher cor personalizada"
                  />
                  <input
                    type="text"
                    value={config.boxColor}
                    onChange={(e) => setConfig((prev) => ({ ...prev, boxColor: e.target.value }))}
                    placeholder="#ea580c"
                    className="w-24 bg-[#121212] border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-white text-center focus:border-orange-500 outline-none uppercase"
                  />
                </div>
              </div>

              {/* PALETA DE CORES RÁPIDAS */}
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, boxColor: preset.hex }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                      config.boxColor.toLowerCase() === preset.hex.toLowerCase()
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-neutral-800 bg-[#121212] text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 3: PRÉ-VISUALIZAÇÃO AO VIVO NO CONTRATO */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            Pré-visualização do Cabeçalho Oficial
          </label>

          <div className="bg-white p-6 rounded-2xl border border-neutral-300 shadow-md text-center space-y-2">
            <ContractLogoHeader config={config} />
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              PLATAFORMA OFICIAL DE GESTÃO ESPORTIVA E ARTES MARCIAIS
            </p>
            <span className="text-[9px] font-mono text-emerald-700 font-bold block bg-emerald-50 py-1 px-3 rounded-full inline-block border border-emerald-200">
              ✓ Visualização em Papel de Contrato / PDF Oficial
            </span>
          </div>
        </div>

        {/* RODAPÉ E BOTÕES DE AÇÃO */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-neutral-500 hover:text-neutral-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer border border-neutral-700"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`font-extrabold text-xs py-2.5 px-5 rounded-xl shadow transition cursor-pointer flex items-center gap-2 ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Salvo com Sucesso!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Salvar Configuração Global
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
