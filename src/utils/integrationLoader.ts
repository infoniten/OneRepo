import { Integration } from '../types/integration';
import YAML from 'yaml';

export function getIntegrationNameFromPath(path: string): string {
  const match = path.match(/([^/]+)\/integration\.yaml$/);
  return match ? match[1].replace(/-/g, ' ') : 'Unknown Integration';
}

export function normalizeSegmentName(name: string): string {
  const segmentMap: Record<string, string> = {
    'source': 'Source',
    'processing': 'Processing',
    'destination': 'Destination'
  };
  return segmentMap[name.toLowerCase()] || name;
}

// Функция для получения списка доступных интеграций
async function getAvailableIntegrations(): Promise<string[]> {
  try {
    const response = await fetch('/api/integrations/list');
    if (!response.ok) {
      throw new Error('Failed to fetch integration list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching integration list:', error);
    return [];
  }
}

// Функция для загрузки конкретной интеграции
async function loadIntegration(path: string): Promise<Integration | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load integration file ${path}: ${response.statusText}`);
      return null;
    }
    
    const yamlText = await response.text();
    const parsed = YAML.parse(yamlText);
    
    if (!parsed || !parsed.integration || !parsed.integration.segments) {
      console.warn(`Invalid or empty integration file: ${path}`);
      return null;
    }
    
    const integrationName = getIntegrationNameFromPath(path);
    console.log('Parsed integration name:', integrationName);
    
    return {
      name: integrationName,
      description: parsed.integration.description || '',
      segments: parsed.integration.segments.map((segment: any) => ({
        segment: normalizeSegmentName(segment.segment),
        elements: segment.elements || []
      }))
    };
  } catch (error) {
    console.error(`Error processing integration file ${path}:`, error);
    return null;
  }
}

// Основная функция загрузки интеграций с поддержкой поллинга
export async function loadIntegrations(): Promise<Integration[]> {
  try {
    const paths = await getAvailableIntegrations();
    const integrations: Integration[] = [];
    
    for (const path of paths) {
      const integration = await loadIntegration(path);
      if (integration) {
        integrations.push(integration);
      }
    }
    
    if (integrations.length === 0) {
      console.warn('No integration files found or processed successfully');
    }
    
    return integrations;
  } catch (error) {
    console.error('Error loading integrations:', error);
    return [];
  }
}

// Функция для создания поллинга интеграций
export function createIntegrationPolling(
  onUpdate: (integrations: Integration[]) => void,
  interval: number = 5000
): () => void {
  let isPolling = true;
  
  const poll = async () => {
    if (!isPolling) return;
    
    try {
      const integrations = await loadIntegrations();
      onUpdate(integrations);
    } catch (error) {
      console.error('Error during integration polling:', error);
    }
    
    setTimeout(poll, interval);
  };
  
  poll();
  
  return () => {
    isPolling = false;
  };
}

// Временное решение для демонстрации, если файлы не найдутся
export const sampleIntegration = `
integration:
  name: test
  description: это тестовый интеграционный тест
  segments:
  - segment: delta
    elements:
    - type: kafka
      name: DELTA.TOPIC.EVENT.V1
      partitions: 10
      configuration:
        max.message.bytes: 4194304
        retention.ms: 432000000
      security:
        principals:
        - principal: CN=SomeDick, OUI=Test
          operations:
          - read
          - describe
          group:
          - someGroup
        - principal: CN=SomeDick2, OUI=Test
          operations:
          - write
          - describe
      connectionInfo:
        host: node0.host.local
        port: 80
        url: https://node0.host.local/api
      id: 0
      next: 1
`; 