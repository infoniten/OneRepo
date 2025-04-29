import { Integration } from '../types/integration';
import yaml from 'js-yaml';

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

interface IntegrationFile {
  stand: string;
  flow: string;
  path: string;
}

export async function loadIntegrations(): Promise<Integration[]> {
  try {
    // Получаем список файлов интеграций
    const response = await fetch('/api/integrations/list');
    const files = await response.json() as IntegrationFile[];

    // Загружаем каждую интеграцию
    const integrations = await Promise.all(
      files.map(async (file) => {
        try {
          const response = await fetch(file.path);
          const yamlContent = await response.text();
          const parsed = yaml.load(yamlContent) as { integration: Integration };
          
          // Добавляем информацию о стенде и потоке
          return {
            ...parsed.integration,
            stand: file.stand,
            flowName: file.flow
          };
        } catch (error) {
          console.error(`Error loading integration from ${file.path}:`, error);
          return null;
        }
      })
    );

    // Фильтруем null значения (неудачные загрузки)
    return integrations.filter((integration): integration is Integration => integration !== null);
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

export async function updateIntegration(stand: string, flow: string, integration: Integration): Promise<void> {
  const yamlContent = yaml.dump({ integration });
  const response = await fetch('/api/integrations/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stand, flow, content: yamlContent }),
  });
  if (!response.ok) {
    throw new Error('Failed to update integration');
  }
} 