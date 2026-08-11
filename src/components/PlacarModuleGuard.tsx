import React from 'react';
import { Trophy, Timer, ExternalLink, ArrowLeft } from 'lucide-react';

interface PlacarModuleGuardProps {
  isTelao?: boolean;
  onBack?: () => void;
}

export default function PlacarModuleGuard({ onBack }: PlacarModuleGuardProps) {
  const handleOpenPlacar = () => {
    window.open('https://arenadocompetidor.ai.studio', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#141414] border border-orange-500/30 p-6 sm:p-8 rounded-3xl text-center space-y-5 max-w-xl w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/10">
          <Trophy className="w-8 h-8 text-orange-500" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full inline-block mb-1">
            SISTEMA INDEPENDENTE
          </span>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            Placar e Cronômetro (CBJJ)
          </h3>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
          O Placar, Cronômetro Oficial e Telão de Exibição agora operam de forma 100% independente em um ambiente exclusivo de altíssima performance.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleOpenPlacar}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-black font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest transition cursor-pointer shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            <Timer className="w-4 h-4 text-black" />
            <span>Acessar Placar em Nova Aba</span>
            <ExternalLink className="w-3.5 h-3.5 text-black" />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


