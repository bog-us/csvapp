import axios from 'axios';
import { ProviderLLM } from '../llmServiceImbunatatit';

class OpenRouterProvider implements ProviderLLM {
  id = 'openrouter';
  nume = 'OpenRouter';
  suportaStreaming = true;
  lungimeMaximaContext = 100000; // Variază în funcție de modelul specific
  
  private apiKey: string;
  private url = 'https://openrouter.ai/api/v1/chat/completions';
  private consum = { tokeni: 0, cost: 0 };
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouter API key nu este configurat');
    }
  }
  
  async trimiteRequest(prompt: string, optiuni: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key nu este configurat');
    }
    
    try {
      // Configurare model 
      const model = optiuni.model || 'anthropic/claude-3-opus-20240229'; // Model implicit
      
      const requestData = {
        model: model,
        messages: [
          {
            role: 'system',
            content: optiuni.promptSistem || 'Ești un asistent specializat în analiza datelor despre case de schimb valutar din România.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: optiuni.tokeniMaximi || 1000,
        temperature: optiuni.temperatura || 0.7,
        stream: optiuni.streaming || false
      };
      
      if (optiuni.streaming && optiuni.laActualizareStreaming) {
        // Implementare streaming
        const response = await axios.post(
          this.url,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': window.location.href, // OpenRouter necesită acest header
              'X-Title': 'Case Schimb Valutar App' // Numele aplicației tale
            },
            responseType: 'stream'
          }
        );
        
        let acumulat = '';
        
        return new Promise((resolve) => {
          response.data.on('data', (chunk: Buffer) => {
            try {
              const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.substring(6);
                  
                  if (data === '[DONE]') {
                    resolve(acumulat);
                    return;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      acumulat += content;
                      optiuni.laActualizareStreaming(content);
                    }
                  } catch (e) {
                    console.error('Eroare la parsarea răspunsului OpenRouter:', e);
                  }
                }
              }
            } catch (error) {
              console.error('Eroare streaming OpenRouter:', error);
            }
          });
          
          response.data.on('end', () => {
            resolve(acumulat);
          });
        });
      } else {
        // Cerere standard (non-streaming)
        const response = await axios.post(
          this.url,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': window.location.href, // OpenRouter necesită acest header
              'X-Title': 'Case Schimb Valutar App' // Numele aplicației tale
            }
          }
        );
        
        // Actualizează contorul de tokeni
        if (response.data.usage) {
          this.consum.tokeni += response.data.usage.prompt_tokens + response.data.usage.completion_tokens;
          this.consum.cost += (response.data.usage.total_tokens) * 0.000015; // Cost aproximativ
        }
        
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      console.error('Eroare la comunicarea cu OpenRouter API:', error.response?.data || error.message);
      throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async getConsum(): Promise<{ tokeni: number; cost: number }> {
    return this.consum;
  }
}

export default OpenRouterProvider;