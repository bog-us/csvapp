// src/services/enhancedLLMService.ts
import axios from 'axios';

// Define provider interfaces
interface LLMProvider {
  id: string;
  name: string;
  sendRequest: (prompt: string, options: RequestOptions) => Promise<string>;
  getUsage: () => Promise<{ tokens: number, cost: number }>;
  supportsStreaming: boolean;
  maxContextLength: number;
}

interface RequestOptions {
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  onStreamingUpdate?: (text: string) => void;
  systemPrompt?: string;
}

class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private fallbackOrder: string[] = [];
  private usageStats: Record<string, { requests: number, tokens: number, cost: number }> = {};
  
  constructor() {
    // Initialize usage tracking
    this.resetUsageStats();
  }
  
  registerProvider(provider: LLMProvider, isFallback: boolean = false) {
    this.providers.set(provider.id, provider);
    if (isFallback) {
      this.fallbackOrder.push(provider.id);
    }
  }
  
  async sendRequest(prompt: string, options: RequestOptions & { provider?: string }): Promise<string> {
    // Try specific provider if requested
    if (options.provider && this.providers.has(options.provider)) {
      try {
        const result = await this.executeRequest(options.provider, prompt, options);
        return result;
      } catch (error) {
        console.error(`Error with provider ${options.provider}:`, error);
        // Fall through to fallbacks
      }
    }
    
    // Try fallbacks in order
    for (const providerId of this.fallbackOrder) {
      try {
        const result = await this.executeRequest(providerId, prompt, options);
        return result;
      } catch (error) {
        console.error(`Error with fallback provider ${providerId}:`, error);
        continue;
      }
    }
    
    throw new Error("All LLM providers failed");
  }
  
  private async executeRequest(providerId: string, prompt: string, options: RequestOptions): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    
    // Track usage
    this.usageStats[providerId].requests++;
    
    const result = await provider.sendRequest(prompt, options);
    
    // Update usage stats
    const usage = await provider.getUsage();
    this.usageStats[providerId].tokens += usage.tokens;
    this.usageStats[providerId].cost += usage.cost;
    
    return result;
  }
  
  getUsageStats() {
    return this.usageStats;
  }
  
  resetUsageStats() {
    this.providers.forEach((provider, id) => {
      this.usageStats[id] = { requests: 0, tokens: 0, cost: 0 };
    });
  }
}

// Create singleton instance
export const llmRouter = new LLMRouter();

// Register providers
llmRouter.registerProvider(new ClaudeProvider(), true);
llmRouter.registerProvider(new OpenAIProvider(), true);
llmRouter.registerProvider(new DeepSeekProvider(), true);

export default llmRouter;