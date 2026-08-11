import React, { useState, useEffect, useRef } from 'react';
import { PublicidadeItem } from '../types';
import { ExternalLink } from 'lucide-react';

interface PublicidadeCarouselProps {
  pagina: string;
  publicidades: PublicidadeItem[];
  onRegistrarClique?: (campaignId: string, pagina: string) => void;
  onRegistrarVisualizacao?: (campaignId: string) => void;
}

export default function PublicidadeCarousel({
  pagina,
  publicidades,
  onRegistrarClique,
  onRegistrarVisualizacao,
}: PublicidadeCarouselProps) {
  // Filter active campaigns matching the current page or set to 'todas'
  const pagePubs = publicidades
    .filter((pub) => {
      if (pub.status === 'arquivada') return false;
      if (Array.isArray(pub.paginas)) {
        return pub.paginas.includes(pagina) || pub.paginas.includes('todas') || pub.paginas.includes('todas_paginas');
      }
      return (pub as any).pagina === pagina || (pub as any).pagina === 'todas';
    })
    .slice(0, 10); // Limit to 10 active items

  const [currentIndex, setCurrentIndex] = useState(0);
  const trackedViewsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (currentIndex >= pagePubs.length) {
      setCurrentIndex(0);
    }
  }, [pagePubs, currentIndex]);

  // Automatic slide rotation every 10 seconds
  useEffect(() => {
    if (pagePubs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pagePubs.length);
    }, 10000); // 10s transition for active carousel
    return () => clearInterval(interval);
  }, [pagePubs.length]);

  // Track impression/view when slide comes into view
  useEffect(() => {
    if (pagePubs.length === 0) return;
    const currentPub = pagePubs[currentIndex];
    if (currentPub && onRegistrarVisualizacao) {
      const viewKey = `${currentPub.id}_${pagina}_${Date.now().toString().slice(0, -4)}`; // debounce per 10s
      if (!trackedViewsRef.current.has(viewKey)) {
        trackedViewsRef.current.add(viewKey);
        onRegistrarVisualizacao(currentPub.id);
      }
    }
  }, [currentIndex, pagePubs, pagina, onRegistrarVisualizacao]);

  if (pagePubs.length === 0) return null;

  const currentPub = pagePubs[currentIndex];

  const hasValidLink = (pub?: PublicidadeItem) => {
    return Boolean(pub?.linkUrl && pub.linkUrl.trim() !== '' && pub.linkUrl.trim() !== '#');
  };

  const handleBannerClick = (pub: PublicidadeItem) => {
    if (!hasValidLink(pub)) return; // Do not register click or navigate if there is no valid URL

    if (onRegistrarClique) {
      onRegistrarClique(pub.id, pagina);
    }

    let formattedUrl = pub.linkUrl!.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  const isClickable = hasValidLink(currentPub);

  return (
    <div className="bg-[#141414] p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-md space-y-3 text-left my-4 sm:my-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
        <span className="text-[10px] sm:text-xs text-neutral-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          📢 Publicidade Patrocinada
        </span>
        {pagePubs.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 font-mono">
              {currentIndex + 1} de {pagePubs.length}
            </span>
            <div className="flex gap-1">
              {pagePubs.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'bg-orange-500 w-3.5' : 'bg-neutral-700 hover:bg-neutral-500 w-1.5'
                  }`}
                  title={`Ir para o anúncio ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        onClick={() => currentPub && handleBannerClick(currentPub)}
        className={`relative w-full aspect-[16/9] max-w-4xl mx-auto bg-neutral-950 rounded-xl overflow-hidden border border-neutral-850 group transition-all ${
          isClickable
            ? 'cursor-pointer hover:border-orange-500/80 shadow-lg hover:shadow-orange-500/10'
            : 'cursor-default select-none'
        }`}
        title={isClickable ? `Clique para acessar: ${currentPub?.linkUrl}` : 'Banner patrocinado (Apenas exibição)'}
      >
        <div
          className="flex flex-row flex-nowrap h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)`, width: '100%' }}
        >
          {pagePubs.map((pub) => (
            <div
              key={pub.id}
              className="h-full w-full flex-shrink-0 shrink-0 bg-contain bg-center bg-no-repeat relative bg-neutral-950"
              style={{ backgroundImage: `url('${pub.imagemUrl}')` }}
            >
              {hasValidLink(pub) && (
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white border border-neutral-700 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg group-hover:bg-orange-500 group-hover:text-black group-hover:border-orange-400 transition-all">
                  <span>Acessar</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
