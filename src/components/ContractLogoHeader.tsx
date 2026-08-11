import React, { useState, useEffect } from 'react';
import {
  ContractLogoConfig,
  getContractLogoConfig,
} from '../utils/contractLogoUtils';

interface ContractLogoHeaderProps {
  config?: ContractLogoConfig;
  title?: string;
  className?: string;
}

export function ContractLogoHeader({
  config: propConfig,
  title = 'ARENA DO COMPETIDOR',
  className = '',
}: ContractLogoHeaderProps) {
  const [config, setConfig] = useState<ContractLogoConfig>(propConfig || getContractLogoConfig());

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
      return;
    }
    const handleUpdate = () => {
      setConfig(getContractLogoConfig());
    };
    window.addEventListener('arena_contract_logo_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('arena_contract_logo_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [propConfig]);

  const activeConfig = propConfig || config;
  const { imageUrl, showBox, boxColor } = activeConfig;

  return (
    <div className={`flex items-center justify-center gap-3 mb-2 ${className}`}>
      {imageUrl ? (
        showBox ? (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center p-1.5 shadow overflow-hidden shrink-0 transition-all"
            style={{ backgroundColor: boxColor || '#ea580c' }}
          >
            <img
              src={imageUrl}
              alt="Logomarca Oficial"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center shrink-0">
            <img
              src={imageUrl}
              alt="Logomarca Oficial"
              className="max-h-12 max-w-[160px] object-contain"
            />
          </div>
        )
      ) : (
        showBox ? (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shadow shrink-0 transition-all"
            style={{ backgroundColor: boxColor || '#ea580c' }}
          >
            AC
          </div>
        ) : (
          <div className="font-black text-2xl text-orange-600 tracking-wider shrink-0">
            AC
          </div>
        )
      )}
      <span className="text-xl font-black tracking-widest text-neutral-900 uppercase">
        {title}
      </span>
    </div>
  );
}
