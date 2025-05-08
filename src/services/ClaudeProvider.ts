import axios from 'axios';
import { ProviderLLM } from '../llmServiceImbunatatit';

class ClaudeProvider implements ProviderLLM {
  id = 'claude';
  nume = 'Claude';
  suportaStreaming = true;
  lungimeMaximaContext = 100000;
  
  private apiKey: string;
  private url = 'https://api.anthropic.com/v1/messages';
  private consum = { tokeni: 0, cost: 0 };
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Claude API key nu este configurat');
    }
  }
  
  async trimiteRequest(prompt: string, optiuni: any): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key nu este configurat');
    }
    
    try {
      const requestData = {
        model: optiuni.model || 'claude-3-opus-20240229',
        max_tokens: optiuni.tokeniMaximi || 1000,
        temperature: optiuni.temperatura || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: optiuni.streaming || false,
        system: optiuni.promptSistem || 'Ești un asistent specializat în analiza datelor despre case de schimb valutar din România.'
      };
      
      if (optiuni.streaming && optiuni.laActualizareStreaming) {
        // Implementarea streaming-ului
        const response = await axios.post(
          this.url,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01'
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
                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                      acumulat += parsed.delta.text;
                      optiuni.laActualizareStreaming(parsed.delta.text);
                    }
                  } catch (e) {
                    console.error('Eroare la parsarea răspunsului Claude:', e);
                  }
                }
              }
            } catch (error) {
              console.error('Eroare streaming Claude:', error);
            }
          });
          
          response.data.on('end', () => {
            resolve(acumulat);
          });
        });
      } else {
        // Cerere standard
        const response = await axios.post(
          this.url,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01'
            }
          }
        );
        
        // Actualizează contorul de tokeni
        if (response.data.usage) {
          this.consum.tokeni += response.data.usage.input_tokens + response.data.usage.output_tokens;
          // Aproximativ $10 per 1M token-i
          this.consum.cost += (response.data.usage.input_tokens + response.data.usage.output_tokens) * 0.00001;
        }
        
        return response.data.content[0].text;
      }
    } catch (error: any) {
      console.error('Eroare la comunicarea cu Claude API:', error.response?.data || error.message);
      throw new Error(`Claude API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
  
  async getConsum(): Promise<{ tokeni: number; cost: number }> {
    return this.consum;
  }
}

export default ClaudeProvider;