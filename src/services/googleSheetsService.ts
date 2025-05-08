// src/services/googleSheetsService.ts
import { CasaSchimbType, PunctSchimbType, DateFinanciareType, DateAngajatiType } from '../types';

// Implementare simplificată pentru a permite build-ul
const GoogleSheetsService = {
  getCaseSchimb: async (): Promise<CasaSchimbType[]> => {
    console.log('getCaseSchimb called - implementare temporară');
    return [];
  },
  getPuncteSchimb: async (): Promise<PunctSchimbType[]> => {
    console.log('getPuncteSchimb called - implementare temporară');
    return [];
  },
  getDateFinanciare: async (): Promise<DateFinanciareType[]> => {
    console.log('getDateFinanciare called - implementare temporară');
    return [];
  },
  getDateAngajati: async (): Promise<DateAngajatiType[]> => {
    console.log('getDateAngajati called - implementare temporară');
    return [];
  },
  invalidateCache: (): void => {
    console.log('invalidateCache called - implementare temporară');
  },
  setupPolling: (intervalMinutes: number = 5, onDataUpdated?: () => void): () => void => {
    console.log('setupPolling called - implementare temporară');
    return () => {};
  }
};

export default GoogleSheetsService;
