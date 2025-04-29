export interface ConnectionInfo {
  host: string;
  port: number;
  url: string;
}

export interface DestinationInfo {
  host: string;
  port: number;
  url: string;
}

export interface SecurityPrincipal {
  principal: string;
  operations: string[];
  group?: string[];
}

export interface Security {
  principals: SecurityPrincipal[];
}

export interface KafkaConfig {
  max_message_bytes: number;
  retention_ms: number;
}

export interface Service {
  id: number;
  service: string;
  type?: string;
  subType?: string;
  configs?: Record<string, string>;
  dnName?: string;
  connectionInfo: ConnectionInfo;
  destinationInfo?: DestinationInfo;
  next?: number | number[];
  selected?: boolean;
  label?: string;
  warn?: number;
  error?: number;
}

export interface Connection {
  url: string;
  port?: number;
}

export interface Principal {
  name: string;
  role: string;
}

export interface Element {
  id: string | number;
  name?: string;
  type: string;
  clusterName?: string;
  labels?: string[];
  // Connection related fields
  connection?: ConnectionInfo;
  connectionInfo?: ConnectionInfo;
  // Service related fields
  services?: Service[];
  // Navigation
  next?: number | number[];
  // Status indicators
  warn?: number;
  error?: number;
  // Kafka specific fields
  kafkaConfig?: KafkaConfig;
  partitions?: number;
  configuration?: Record<string, any>;
  security?: {
    principals: Array<{
      principal: string;
      operations: string[];
      group?: string[];
    }>;
  };
  // Nginx specific fields
  requestType?: string[];
  nginxPort?: number;
  remoteHost?: string;
  modSecurityTurnedOffRules?: string[];
  requestSchemaValidation?: string;
  responseSchemaValidation?: string;
  // GeoBalancer specific fields
  servers?: Array<{
    host: string;
    port: number;
  }>;
  healthCheck?: {
    url: string;
    port: number;
    interval: number;
    rise: number;
    fall: number;
    timeout: number;
    expect: string;
  };
  // Kubernetes specific fields
  namespace?: string;
  subType?: string;
}

export interface Segment {
  segment: string;
  elements: Array<Element>;
}

export interface Integration {
  name: string;
  description?: string;
  stand: string;
  flowName: string;
  segments: Array<{
    segment: string;
    elements: Array<Element>;
  }>;
}

export interface IntegrationFlow {
  integration: Integration;
}

export interface ValidationIssue {
  type: 'warning' | 'error';
  message: string;
  code: string;
}

export interface ElementWithIssues {
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
}

export function isElement(item: Element | Service): item is Element {
  return 'type' in item;
}