// src/services/llmCacheService.ts
interface RaspunsCachat {
  rezultat: string;
  timestamp: number;
  provider: string;
}

class ServiciuCacheLLM {
  private cache: Map<string, RaspunsCachat> = new Map();
  private readonly TTL: number = 30 * 60 * 1000; // 30 minute
  
  // Creează o cheie de cache deterministă din prompt și opțiuni
  private creazaCheieCache(prompt: string, optiuni: Record<string, any>): string {
    const optiuniStr = JSON.stringify(optiuni);
    return `${prompt}__${optiuniStr}`;
  }
  
  async obtineSauIncarca(
    prompt: string, 
    optiuni: Record<string, any>,
    functieIncarca: () => Promise<string>
  ): Promise<string> {
    const cheieCache = this.creazaCheieCache(prompt, optiuni);
    
    // Verifică dacă avem un răspuns valid în cache
    const cachat = this.cache.get(cheieCache);
    if (cachat && Date.now() - cachat.timestamp < this.TTL) {
      console.log('LLM cache hit');
      return cachat.rezultat;
    }
    
    // Altfel, încarcă rezultat nou
    console.log('LLM cache miss, se încarcă de la API');
    const rezultat = await functieIncarca();
    
    // Stochează noul rezultat în cache
    this.cache.set(cheieCache, {
      rezultat,
      timestamp: Date.now(),
      provider: optiuni.provider || 'default'
    });
    
    return rezultat;
  }
  
  invalideazaCache() {
    this.cache.clear();
  }
  
  // Invalidează doar înregistrările de cache mai vechi decât un timp specificat
  invalideazaInregistrariInvechite(varstMaxima: number = this.TTL) {
    const acum = Date.now();
    for (const [cheie, valoare] of this.cache.entries()) {
      if (acum - valoare.timestamp > varstMaxima) {
        this.cache.delete(cheie);
      }
    }
  }
}

export const cacheLLM = new ServiciuCacheLLM();
export default cacheLLM;