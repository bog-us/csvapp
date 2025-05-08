// src/services/llmServiceImbunatatit.ts
import axios from 'axios';
import ClaudeProvider from './providers/ClaudeProvider';
import OpenAIProvider from './providers/OpenAIProvider';
import DeepSeekProvider from './providers/DeepSeekProvider';
import OpenRouterProvider from './providers/OpenRouterProvider';

// Definește interfețele pentru provideri
export interface ProviderLLM {
  id: string;
  nume: string;
  trimiteRequest: (prompt: string, optiuni: OptiuniRequest) => Promise<string>;
  getConsum: () => Promise<{ tokeni: number, cost: number }>;
  suportaStreaming: boolean;
  lungimeMaximaContext: number;
}

export interface OptiuniRequest {
  temperatura?: number;
  tokeniMaximi?: number;
  streaming?: boolean;
  laActualizareStreaming?: (text: string) => void;
  promptSistem?: string;
  model?: string;
}

class RutatorLLM {
  private provideri: Map<string, ProviderLLM> = new Map();
  private ordineAlternativa: string[] = [];
  private statisticiUtilizare: Record<string, { cereri: number, tokeni: number, cost: number }> = {};
  
  constructor() {
    // Inițializează urmărirea utilizării
    this.reseteazaStatistici();
  }
  
  inregistreazaProvider(provider: ProviderLLM, esteAlternativa: boolean = false) {
    this.provideri.set(provider.id, provider);
    if (esteAlternativa) {
      this.ordineAlternativa.push(provider.id);
    }
    // Inițializăm statisticile pentru noul provider
    this.statisticiUtilizare[provider.id] = { cereri: 0, tokeni: 0, cost: 0 };
  }
  
  async trimiteRequest(prompt: string, optiuni: OptiuniRequest & { provider?: string }): Promise<string> {
    // Încearcă provider-ul specific dacă este solicitat
    if (optiuni.provider && this.provideri.has(optiuni.provider)) {
      try {
        const rezultat = await this.executaCerere(optiuni.provider, prompt, optiuni);
        return rezultat;
      } catch (eroare) {
        console.error(`Eroare cu provider-ul ${optiuni.provider}:`, eroare);
        // Continuă cu alternative
      }
    }
    
    // Încearcă alternative în ordine
    for (const providerId of this.ordineAlternativa) {
      try {
        const rezultat = await this.executaCerere(providerId, prompt, optiuni);
        return rezultat;
      } catch (eroare) {
        console.error(`Eroare cu provider-ul alternativ ${providerId}:`, eroare);
        continue;
      }
    }
    
    throw new Error("Toți providerii LLM au eșuat");
  }
  
  private async executaCerere(providerId: string, prompt: string, optiuni: OptiuniRequest): Promise<string> {
    const provider = this.provideri.get(providerId);
    if (!provider) throw new Error(`Provider-ul ${providerId} nu a fost găsit`);
    
    // Urmărește utilizarea
    this.statisticiUtilizare[providerId].cereri++;
    
    const rezultat = await provider.trimiteRequest(prompt, optiuni);
    
    // Actualizează statisticile de utilizare
    const utilizare = await provider.getConsum();
    this.statisticiUtilizare[providerId].tokeni += utilizare.tokeni;
    this.statisticiUtilizare[providerId].cost += utilizare.cost;
    
    return rezultat;
  }
  
  getStatisticiUtilizare() {
    return this.statisticiUtilizare;
  }
  
  reseteazaStatistici() {
    this.provideri.forEach((provider, id) => {
      this.statisticiUtilizare[id] = { cereri: 0, tokeni: 0, cost: 0 };
    });
  }
  
  getProviderNames() {
    return Array.from(this.provideri.keys());
  }
  
  getDefaultProvider() {
    return this.ordineAlternativa.length > 0 ? this.ordineAlternativa[0] : null;
  }
}

// Creează instanță singleton
export const rutatorLLM = new RutatorLLM();

// Înregistrează providerii
try {
  rutatorLLM.inregistreazaProvider(new ClaudeProvider(), true);
  console.log('Provider Claude înregistrat cu succes');
} catch (error) {
  console.warn('Nu s-a putut înregistra provider-ul Claude:', error);
}

try {
  rutatorLLM.inregistreazaProvider(new OpenAIProvider(), true);
  console.log('Provider OpenAI înregistrat cu succes');
} catch (error) {
  console.warn('Nu s-a putut înregistra provider-ul OpenAI:', error);
}

try {
  rutatorLLM.inregistreazaProvider(new DeepSeekProvider(), true);
  console.log('Provider DeepSeek înregistrat cu succes');
} catch (error) {
  console.warn('Nu s-a putut înregistra provider-ul DeepSeek:', error);
}

try {
  rutatorLLM.inregistreazaProvider(new OpenRouterProvider(), true);
  console.log('Provider OpenRouter înregistrat cu succes');
} catch (error) {
  console.warn('Nu s-a putut înregistra provider-ul OpenRouter:', error);
}

export default rutatorLLM;