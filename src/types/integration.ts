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
  connection?: ConnectionInfo;
  connectionInfo?: ConnectionInfo;
  security?: Security;
  kafkaConfig?: KafkaConfig;
  services?: Service[];
  next?: number | number[];
  clusterName?: string;
  warn?: number;
  error?: number;
  partitions?: number;
  configuration?: {
    max_message_bytes?: number;
    retention_ms?: number;
    [key: string]: any;
  };
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