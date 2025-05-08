// src/services/llmService.ts
import axios from 'axios';

// Tipuri pentru LLM
export interface LLMProviderConfig {
  name: string;
  apiEndpoint: string;
  apiKey: string;
  models: string[];
  maxTokens: number;
  streamingSupport: boolean;
  priority: number; // Prioritate pentru selecția automată (mai mic = prioritate mai mare)
}

export interface LLMRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string; // Pentru a specifica un anumit provider
  streaming?: boolean;
  onStreamingUpdate?: (text: string) => void;
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// Configurări pentru diferite API-uri de LLM
const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  openai: {
    name: 'OpenAI',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    models: ['gpt-4-turbo', 'gpt-3.5-turbo'],
    maxTokens: 4096,
    streamingSupport: true,
    priority: 1
  },
  claude: {
    name: 'Claude',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
    models: ['claude-3-5-sonnet'],
    maxTokens: 4096,
    streamingSupport: true,
    priority: 2
  },
  deepseek: {
    name: 'DeepSeek',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
    models: ['deepseek-chat'],
    maxTokens: 2048,
    streamingSupport: false,
    priority: 3
  }
};

// Funcții principale pentru serviciul LLM
export const LLMService = {
  // Obține lista de provideri disponibili
  getAvailableProviders(): LLMProviderConfig[] {
    return Object.values(LLM_PROVIDERS)
      .filter(provider => provider.apiKey)
      .sort((a, b) => a.priority - b.priority);
  },
  
  // Trimite o cerere către un LLM
  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    const { prompt, provider: requestedProvider } = request;
    
    // Simulare răspuns pentru prototip
    return {
      text: `Analiză pentru: "${prompt}".\n\nAceasta este o simulare de răspuns în această etapă de dezvoltare.`,
      provider: requestedProvider || 'simulat',
      model: 'prototip'
    };
  },
  
  // Generează un raport narativ din date
  async generateReport(
    dataContext: any, 
    promptTemplate: string,
    options: Partial<LLMRequest> = {}
  ): Promise<string> {
    // Construiește promptul cu contextul datelor
    const dataContextStr = JSON.stringify(dataContext);
    
    const prompt = `
${promptTemplate}

Date de analizat:
${dataContextStr}

Formatează răspunsul ca un raport scurt, clar și informativ.
`;
    
    // Trimite cererea către LLM
    const response = await this.sendRequest({
      prompt,
      ...options
    });
    
    return response.text;
  },
  
  // Interpretează o întrebare în limbaj natural despre date
  async interpretQuestion(
    question: string,
    dataContext: any,
    options: Partial<LLMRequest> = {}
  ): Promise<string> {
    // Construiește promptul pentru LLM
    const dataContextStr = JSON.stringify(dataContext);
    
    const prompt = `
Întrebarea utilizatorului: "${question}"

Date disponibile pentru a răspunde la întrebare:
${dataContextStr}

Răspunde la întrebarea utilizatorului în mod direct și concis, bazat pe datele furnizate.
`;
    
    // Trimite cererea către LLM
    const response = await this.sendRequest({
      prompt,
      ...options
    });
    
    return response.text;
  },
  
  // Identifică și sugerează insights în date
  async suggestInsights(
    dataContext: any,
    options: Partial<LLMRequest> = {}
  ): Promise<string[]> {
    // Construiește promptul pentru LLM
    const dataContextStr = JSON.stringify(dataContext);
    
    const prompt = `
Analizează următoarele date despre casele de schimb valutar și identifică 3-5 insights valoroase sau tendințe interesante:

${dataContextStr}

Răspunde cu o listă de insights separate prin newline, fără numerotare sau marcatori. Fiecare insight trebuie să fie o propoziție concisă și informativă.
`;
    
    // Trimite cererea către LLM
    const response = await this.sendRequest({
      prompt,
      ...options
    });
    
    // Parsează răspunsul în insights separate
    const insights = response.text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return insights;
  }
};

export default LLMService;
