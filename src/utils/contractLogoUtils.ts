export interface ContractLogoConfig {
  imageUrl?: string;
  showBox: boolean;
  boxColor: string;
}

export const DEFAULT_CONTRACT_LOGO_CONFIG: ContractLogoConfig = {
  imageUrl: '',
  showBox: true,
  boxColor: '#ea580c',
};

const STORAGE_KEY_LOGO_CONFIG = 'arena_contract_logo_config';

export function getContractLogoConfig(): ContractLogoConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOGO_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONTRACT_LOGO_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Erro ao ler arena_contract_logo_config:', e);
  }
  return DEFAULT_CONTRACT_LOGO_CONFIG;
}

export function saveContractLogoConfig(config: ContractLogoConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGO_CONFIG, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('arena_contract_logo_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error('Erro ao salvar arena_contract_logo_config:', e);
  }
}
