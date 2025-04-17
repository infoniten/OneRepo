import { Integration } from '../types/integration';
import YAML from 'yaml';

interface Segment {
  segment: string;
  elements: any[];
}

export function getIntegrationNameFromPath(path: string): string {
  const match = path.match(/([^/]+)\/integration\.yaml$/);
  return match ? match[1].replace(/-/g, ' ') : 'Unknown Integration';
}

const getIntegrationDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'Sigma Delta Sigmaboy': 'Интеграция между системами Sigma и Delta для обработки Sigmaboy',
    'Delta Sigma Trades': 'Интеграция между системами Delta и Sigma для обработки trades',
  };
  return descriptions[name] || 'Описание интеграции';
};

export function normalizeSegmentName(name: string): string {
  const segmentMap: Record<string, string> = {
    'source': 'Source',
    'processing': 'Processing',
    'destination': 'Destination'
  };
  return segmentMap[name.toLowerCase()] || name;
}

export async function loadIntegrations(): Promise<Integration[]> {
  try {
    const integrationFiles = [
      '/delta-sigma-trades/integration.yaml',
      '/sigma-delta-sigmaboy/integration.yaml'
    ];
    
    const integrations: Integration[] = [];
    
    for (const path of integrationFiles) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.warn(`Failed to load integration file ${path}: ${response.statusText}`);
          continue;
        }
        
        const yamlText = await response.text();
        const parsed = YAML.parse(yamlText);
        
        if (!parsed || !parsed.integration || !parsed.integration.segments) {
          console.warn(`Invalid or empty integration file: ${path}`);
          continue;
        }
        
        const integrationName = getIntegrationNameFromPath(path);
        console.log('Parsed integration name:', integrationName);
        
        const integration: Integration = {
          name: integrationName,
          description: parsed.integration.description || '',
          segments: parsed.integration.segments.map((segment: any) => ({
            segment: normalizeSegmentName(segment.segment),
            elements: segment.elements || []
          }))
        };
        
        integrations.push(integration);
      } catch (error) {
        console.error(`Error processing integration file ${path}:`, error);
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