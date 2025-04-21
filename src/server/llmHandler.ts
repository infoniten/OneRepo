import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import fetch from 'node-fetch';

interface LLMRequest {
  question: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface Integration {
  name: string;
  description?: string;
  segments: Array<{
    name: string;
    elements: Array<{
      name: string;
      type: string;
      [key: string]: unknown;
    }>;
  }>;
}

export async function handleLLMRequest(request: LLMRequest): Promise<string> {
  try {
    // Load all integration files from the integration directory
    const integrationDir = path.join(__dirname, '../../integration');
    const files = fs.readdirSync(integrationDir);
    const integrations: Integration[] = files
      .filter(file => file.endsWith('.yaml'))
      .map(file => {
        const content = fs.readFileSync(path.join(integrationDir, file), 'utf8');
        const parsedContent = yaml.load(content) as Integration;
        return parsedContent;
      })
      .filter((integration): integration is Integration => {
        const isValid = integration && typeof integration === 'object' && 
          'name' in integration && 'segments' in integration &&
          Array.isArray(integration.segments);
        if (!isValid) {
          console.warn('Invalid integration file found and skipped');
        }
        return isValid;
      });

    // Construct context for the LLM
    const context = `Here are the available integrations:\n${JSON.stringify(integrations, null, 2)}`;
    const systemPrompt = `You are an AI assistant helping with integration flows. Use the following context to answer questions:\n${context}`;

    // Send request to LM Studio
    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.question }
        ],
        model: 'local-model',
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status: ${response.status}`);
    }

    const data = await response.json() as LLMResponse;
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from LLM');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error handling LLM request:', error);
    throw new Error('Failed to process LLM request');
  }
} 