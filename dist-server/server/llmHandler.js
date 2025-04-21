import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LLM_HOST = process.env.LLM_HOST || 'localhost';
const LLM_PORT = process.env.LLM_PORT || '1234';
const LLM_URL = `http://${LLM_HOST}:${LLM_PORT}/v1/chat/completions`;
export async function getAvailableStands() {
    const integrationDir = path.join(path.dirname(path.dirname(__dirname)), 'integration');
    try {
        const stands = await fs.promises.readdir(integrationDir, { withFileTypes: true });
        return stands
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }
    catch (err) {
        console.error('Error reading stands directory:', err);
        return [];
    }
}
export async function handleLLMRequest(request) {
    try {
        if (!request.question) {
            throw new Error('Question is required');
        }
        // Load all integration files from the specified stand directory
        const integrationDir = path.join(path.dirname(path.dirname(__dirname)), 'integration', request.stand || 'IFT');
        console.log('Loading integrations from:', integrationDir);
        let integrations = [];
        try {
            // Get all flow directories in the stand directory
            const flowDirs = await fs.promises.readdir(integrationDir, { withFileTypes: true });
            for (const flowDir of flowDirs) {
                if (flowDir.isDirectory()) {
                    const yamlPath = path.join(integrationDir, flowDir.name, 'integration.yaml');
                    try {
                        const content = await fs.promises.readFile(yamlPath, 'utf8');
                        const parsed = yaml.load(content);
                        if (parsed && parsed.integration) {
                            // Add the flow name to the integration data
                            const integrationWithFlow = {
                                ...parsed.integration,
                                flowName: flowDir.name
                            };
                            integrations.push(integrationWithFlow);
                        }
                    }
                    catch (err) {
                        console.warn(`Error reading integration file ${yamlPath}:`, err);
                    }
                }
            }
        }
        catch (err) {
            console.error('Error reading integration directory:', err);
        }
        console.log('Loaded integrations:', integrations.length);
        console.log('Integration names:', integrations.map(i => i.name));
        console.log('Flow names:', integrations.map(i => i.flowName));
        // Construct context for the LLM
        const integrationSummary = integrations.map(i => ({
            name: i.name,
            description: i.description,
            flowName: i.flowName,
            segments: i.segments.map(s => s.name)
        }));
        const context = `Available integrations in stand ${request.stand || 'IFT'}: ${JSON.stringify(integrationSummary, null, 2)}`;
        const systemPrompt = `You are an AI assistant helping with integration flows. Always respond in Russian language only. Answer questions about the following integrations: ${context}`;
        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: request.question
                }
            ],
            model: "lmstudio-community/gemma-3-27b-it-GGUF",
            temperature: 0.7
        };
        console.log('Sending request to LLM at:', LLM_URL);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        // Send request to LM Studio
        const response = await fetch(LLM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('LLM response error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`LLM request failed with status: ${response.status}. ${errorText}`);
        }
        const data = await response.json();
        console.log('LLM response:', JSON.stringify(data, null, 2));
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from LLM');
        }
        return data.choices[0].message.content;
    }
    catch (error) {
        console.error('Error handling LLM request:', error);
        throw new Error('Failed to process LLM request');
    }
}
