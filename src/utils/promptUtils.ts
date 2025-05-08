// src/utils/promptUtils.ts
import { CasaSchimbType, PunctSchimbType, DateFinanciareType } from '../types';

export function genereazaPromptAnalizaDate(
  intrebare: string,
  date: {
    caseSchimb?: CasaSchimbType[],
    puncteSchimb?: PunctSchimbType[],
    dateFinanciare?: DateFinanciareType[]
  },
  filtre: any
): string {
  // Formatează datele disponibile pentru context
  const contextDate = JSON.stringify({
    numarInregistrari: {
      caseSchimb: date.caseSchimb?.length || 0,
      puncteSchimb: date.puncteSchimb?.length || 0,
      dateFinanciare: date.dateFinanciare?.length || 0
    },
    filtre: filtre,
    // Include date eșantion truncate (primele 3 elemente din fiecare)
    exemple: {
      caseSchimb: date.caseSchimb?.slice(0, 3) || [],
      puncteSchimb: date.puncteSchimb?.slice(0, 3) || [],
      dateFinanciare: date.dateFinanciare?.slice(0, 3) || []
    }
  });

  // Construiește un prompt cu instrucțiuni clare
  return `
  Analizează datele despre casele de schimb valutar din România și răspunde la următoarea întrebare:
  "${intrebare}"
  
  Date disponibile pentru analiză:
  ${contextDate}
  
  Instrucțiuni:
  1. Folosește doar datele furnizate pentru a răspunde.
  2. Răspunde direct și concis, în limba română.
  3. Dacă nu există suficiente date pentru a răspunde complet, specifică acest lucru.
  4. Dacă identifici alte informații relevante din date, care ar putea interesa utilizatorul, menționează-le la final.
  
  Răspunsul tău:
  `;
}