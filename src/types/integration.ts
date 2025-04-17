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
  subType?: string;
  configs?: Record<string, string>;
  dnName?: string;
  connectionInfo: ConnectionInfo;
  destinationInfo: DestinationInfo;
  next: number;
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
  security?: Security;
  kafkaConfig?: KafkaConfig;
  services?: Service[];
  next?: number;
}

export interface Segment {
  segment: string;
  elements: Element[];
}

export interface Integration {
  name: string;
  description: string;
  segments: Segment[];
}

export interface IntegrationFlow {
  integration: Integration;
} 