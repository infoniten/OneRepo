import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useViewport,
  Panel,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import { motion } from 'framer-motion';
import dagre from '@dagrejs/dagre';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { Integration, Element, Service } from '../../types/integration';
import 'reactflow/dist/style.css';

interface IntegrationFlowProps {
  integration: Integration;
  onElementClick: (elementId: string | number) => void;
  selectedElementId: string | number | null;
}

interface K8sNodeData {
  id: string;
  label: string;
  type: string;
  services: Service[];
  onServiceClick: (id: number | string) => void;
  selected?: boolean;
  selectedElementId?: string | number | null;
  element?: Element;
}

// Кастомная нода для обычного элемента
const CustomNode = ({ data, isConnectable, selected: flowSelected }: NodeProps) => {
  const getNodeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'kafka':
        return '#4CAF50';
      case 'k8s':
        return '#2196F3';
      case 'nginx':
        return '#FF9800';
      case 'geo-load-balancer':
        return '#9C27B0';
      default:
        return '#607D8B';
    }
  };

  const isSelected = flowSelected || data.selected;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.3 
      }}
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: `2px solid ${getNodeColor(data.type)}`,
        background: isSelected ? '#f8f9fa' : 'white',
        minWidth: '200px',
        boxShadow: isSelected 
          ? `0 8px 16px rgba(0,0,0,0.1), 0 0 0 4px ${getNodeColor(data.type)}22` 
          : '0 4px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable}
        style={{ 
          background: getNodeColor(data.type),
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          left: '-7px',
          boxShadow: `0 0 0 2px ${getNodeColor(data.type)}`,
          transition: 'all 0.2s ease',
          opacity: 0.8
        }}
      />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: getNodeColor(data.type),
            fontSize: '1.1rem',
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.875rem',
            opacity: 0.8,
          }}
        >
          {data.type}
        </Typography>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable}
        style={{ 
          background: getNodeColor(data.type),
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          right: '-7px',
          boxShadow: `0 0 0 2px ${getNodeColor(data.type)}`,
          transition: 'all 0.2s ease',
          opacity: 0.8
        }}
      />
    </motion.div>
  );
};

const getNodeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'kafka':
      return '#4CAF50';
    case 'k8s':
      return '#2196F3';
    case 'nginx':
      return '#FF9800';
    case 'geo-load-balancer':
      return '#9C27B0';
    case 'input':
      return '#00BCD4';  // Голубой для input
    case 'output':
      return '#009688';  // Бирюзовый для output
    case 'llm-service':
      return '#E91E63';  // Розовый для LLM сервиса
    default:
      return '#607D8B';
  }
};

const nodeStyles = {
  container: {
    padding: '15px',
    borderRadius: '12px',
    minWidth: '300px',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1rem',
    marginBottom: '8px',
  },
  subtitle: {
    color: 'text.secondary',
    display: 'block',
    fontSize: '0.875rem',
    marginBottom: '16px',
  },
  servicesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    padding: '8px 24px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  serviceItem: {
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  }
};

// Компонент для отображения сервиса внутри k8s блока
const ServiceNode = ({ data }: NodeProps) => {
  return (
    <Box
      sx={{
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #2196F3',
        backgroundColor: data.selected ? '#e3f2fd' : 'white',
        minWidth: '150px',
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
          backgroundColor: '#e3f2fd',
          boxShadow: '0 4px 8px rgba(33, 150, 243, 0.15)',
        },
        transition: 'all 0.2s ease',
      }}
      onClick={data.onClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#2196F3',
          width: '10px',
          height: '10px',
          border: '2px solid white',
          top: 0,
          transform: 'translateY(-50%)',
          boxShadow: '0 0 0 2px #2196F3',
          opacity: 0.8,
          zIndex: 1,
        }}
      />
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          color: '#2196F3',
          fontSize: '0.875rem',
        }}
      >
        {data.label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          display: 'block',
          fontSize: '0.75rem',
        }}
      >
        {data.subType || 'service'}
      </Typography>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#2196F3',
          width: '10px',
          height: '10px',
          border: '2px solid white',
          bottom: 0,
          transform: 'translateY(50%)',
          boxShadow: '0 0 0 2px #2196F3',
          opacity: 0.8,
          zIndex: 1,
        }}
      />
    </Box>
  );
};

const K8sNode = ({ data, isConnectable, selected: flowSelected }: NodeProps<K8sNodeData>) => {
  const getNodeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'kafka':
        return '#4CAF50';
      case 'k8s':
        return '#2196F3';
      case 'nginx':
        return '#FF9800';
      case 'geo-load-balancer':
        return '#9C27B0';
      default:
        return '#607D8B';
    }
  };

  const isSelected = flowSelected || data.selected;
  const nodeColor = getNodeColor('k8s');

  // Преобразуем сервисы в узлы и рёбра для вложенного графа
  const { serviceNodes, serviceEdges } = useMemo(() => {
    if (!data.services || data.services.length === 0) {
      return { serviceNodes: [], serviceEdges: [] };
    }

    const nodes: Node[] = data.services.map(service => ({
      id: service.id.toString(),
      type: 'service',
      position: { x: 0, y: 0 },
      data: {
        label: service.service,
        subType: service.subType,
        selected: service.id.toString() === data.selectedElementId?.toString(),
        onClick: () => data.onServiceClick(service.id),
      },
      style: {
        zIndex: service.id.toString() === data.selectedElementId?.toString() ? 1 : 0,
      },
    }));

    const edges: Edge[] = data.services
      .filter(service => service.next)
      .map(service => {
        const nextIds = Array.isArray(service.next) ? service.next : [service.next];
        return nextIds.filter((id): id is number => id !== undefined).map(nextId => ({
          id: `e${service.id}-${nextId}`,
          source: service.id.toString(),
          target: nextId.toString(),
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#2196F3', 
            strokeWidth: 2,
            opacity: 0.8,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#2196F3',
            width: 12,
            height: 12,
          },
        }));
      })
      .flat();

    // Используем dagre для расчета позиций
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'TB',
      align: 'DL',
      nodesep: 40,
      ranksep: 60,
      marginx: 20,
      marginy: 20,
    });

    // Добавляем узлы в граф
    nodes.forEach(node => {
      dagreGraph.setNode(node.id, { width: 170, height: 50 });
    });

    // Добавляем рёбра
    edges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Выполняем layout
    dagre.layout(dagreGraph);

    // Обновляем позиции узлов
    const layoutedNodes = nodes.map(node => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
      };
    });

    return {
      serviceNodes: layoutedNodes,
      serviceEdges: edges,
    };
  }, [data.services, data.selectedElementId, data.onServiceClick]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.3 
      }}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: `2px solid ${nodeColor}`,
        background: isSelected ? '#f8f9fa' : 'white',
        width: '400px',
        height: '300px',
        boxShadow: isSelected 
          ? '0 8px 16px rgba(0,0,0,0.1), 0 0 0 4px rgba(33,150,243,0.2)' 
          : '0 4px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        isConnectable={isConnectable}
        style={{ 
          background: nodeColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          left: '-7px',
          boxShadow: `0 0 0 2px ${nodeColor}`,
          transition: 'all 0.2s ease',
          opacity: 0.8,
          zIndex: 100
        }}
      />
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="subtitle2"
          sx={{
            ...nodeStyles.title,
            color: nodeColor,
            mb: 1,
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            ...nodeStyles.subtitle,
            mb: 2,
          }}
        >
          {data.element?.clusterName || 'k8s'}
        </Typography>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            borderRadius: '8px',
            padding: '16px',
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
            },
            '& .react-flow__renderer': {
              height: '100%',
              width: '100%',
            },
            '& .react-flow__viewport': {
              height: '100%',
              width: '100%',
            },
            '& .react-flow__edge-path': {
              strokeWidth: 2,
              stroke: '#2196F3',
            },
            '& .react-flow__edge-path:hover': {
              strokeWidth: 3,
              stroke: '#1976D2',
            },
            '& .react-flow__edge.animated path': {
              strokeDasharray: 5,
              animation: 'dashdraw 1s linear infinite',
            },
            '& .react-flow__handle': {
              opacity: 0.3,
            },
            '& .react-flow__handle:hover': {
              opacity: 1,
            },
            '@keyframes dashdraw': {
              '0%': {
                strokeDashoffset: 10,
              },
              '100%': {
                strokeDashoffset: 0,
              },
            },
          }}
        >
          <ReactFlowProvider>
            <div style={{ height: '100%', width: '100%' }}>
              <ReactFlow
                nodes={serviceNodes}
                edges={serviceEdges}
                nodeTypes={{ service: ServiceNode }}
                fitView
                maxZoom={1}
                minZoom={0.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={false}
                panOnScroll={false}
                preventScrolling={true}
              >
                <Background color="#99999911" gap={16} size={1} />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </Box>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        isConnectable={isConnectable}
        style={{ 
          background: nodeColor,
          width: '12px',
          height: '12px',
          border: '2px solid white',
          top: '50%',
          transform: 'translateY(-50%)',
          right: '-7px',
          boxShadow: `0 0 0 2px ${nodeColor}`,
          transition: 'all 0.2s ease',
          opacity: 0.8,
          zIndex: 100
        }}
      />
    </motion.div>
  );
};

// Добавляем новые компоненты для input и output
const InputNode = ({ data, isConnectable }: NodeProps) => {
  const color = useMemo(() => getNodeColor('input'), []);
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: `2px solid ${color}`,
        background: 'white',
        minWidth: '180px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable}
        style={{ background: color }}
      />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: color,
            fontSize: '1.1rem',
            mb: 0.5,
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.875rem',
          }}
        >
          {data.type}
        </Typography>
      </div>
    </motion.div>
  );
};

const OutputNode = ({ data, isConnectable }: NodeProps) => {
  const color = useMemo(() => getNodeColor('output'), []);
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: `2px solid ${color}`,
        background: 'white',
        minWidth: '180px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable}
        style={{ background: color }}
      />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: color,
            fontSize: '1.1rem',
            mb: 0.5,
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.875rem',
          }}
        >
          {data.type}
        </Typography>
      </div>
    </motion.div>
  );
};

const LLMServiceNode = ({ data, isConnectable }: NodeProps) => {
  const color = useMemo(() => getNodeColor('llm-service'), []);
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{
        padding: '15px',
        borderRadius: '12px',
        border: `2px solid ${color}`,
        background: 'white',
        minWidth: '220px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable}
        style={{ background: color }}
      />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: color,
            fontSize: '1.1rem',
            mb: 0.5,
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            fontSize: '0.875rem',
            mb: 1,
          }}
        >
          {data.type}
        </Typography>
        {data.connectionInfo && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'rgba(233, 30, 99, 0.05)',
              borderRadius: 1,
              fontSize: '0.75rem',
            }}
          >
            <Typography variant="caption" sx={{ color: color }}>
              URL: {data.connectionInfo.url}
            </Typography>
          </Box>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable}
        style={{ background: color }}
      />
    </motion.div>
  );
};

// Функция для автоматического расположения элементов
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,  // Уменьшенное расстояние между узлами по горизонтали
    ranksep: 125,  // Уменьшенное расстояние между рангами
    edgesep: 40,   // Расстояние между рёбрами
    marginx: 25,   // Отступы от краёв
    marginy: 25,   // Отступы от краёв
    acyclicer: 'greedy',     // Добавляем для лучшей обработки циклов
    ranker: 'network-simplex' // Улучшаем расположение узлов
  });

  nodes.forEach((node: Node) => {
    const nodeConfig = (() => {
      switch (node.type) {
        case 'k8s':
          return {
            width: 350,
            height: 250
          };
        case 'custom':
          if (node.data?.type?.toLowerCase() === 'kafka') {
            return {
              width: 240,
              height: 90
            };
          }
          return {
            width: 180,
            height: 90
          };
        default:
          return {
            width: 180,
            height: 90
          };
      }
    })();

    dagreGraph.setNode(node.id, nodeConfig);
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node: Node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = nodeWithPosition.width;
    const height = nodeWithPosition.height;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const IntegrationFlow: React.FC<IntegrationFlowProps> = React.memo(({
  integration,
  onElementClick,
  selectedElementId,
}) => {
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
    k8s: K8sNode,
    input: InputNode,
    output: OutputNode,
    'llm-service': LLMServiceNode,
  }), []);

  const NetworkSegments = useCallback(({ segments, segmentGroups }: { 
    segments: Integration['segments'];
    segmentGroups: Record<string, { minX: number; maxX: number; minY: number; maxY: number; nodes: Node[] }>;
  }) => {
    const { x, y, zoom } = useViewport();

    const getSegmentColor = (name: string): string => {
      switch (name.toLowerCase()) {
        case 'delta':
          return 'rgba(76, 175, 80, 0.1)';
        case 'omega':
          return 'rgba(255, 152, 0, 0.1)';
        case 'alpha':
          return 'rgba(33, 150, 243, 0.1)';
        default:
          return 'rgba(96, 125, 139, 0.1)';
      }
    };

    return (
      <>
        {segments.map((segment) => {
          const bounds = segmentGroups[segment.segment];
          if (!bounds) return null;

          const width = bounds.maxX - bounds.minX;
          const height = bounds.maxY - bounds.minY;

          const style = {
            transform: `translate(${bounds.minX * zoom + x}px, ${bounds.minY * zoom + y}px)`,
            width: width * zoom,
            height: height * zoom,
            position: 'absolute' as const,
            backgroundColor: getSegmentColor(segment.segment),
            border: `1px solid ${getSegmentColor(segment.segment).replace('0.1', '0.3')}`,
            borderRadius: '16px',
            zIndex: -1,
            pointerEvents: 'none' as const,
            transition: 'transform 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
          };

          const labelStyle = {
            transform: `translate(${(bounds.minX + 20) * zoom + x}px, ${(bounds.minY - 30) * zoom + y}px)`,
            position: 'absolute' as const,
            backgroundColor: '#fff',
            padding: '4px 12px',
            borderRadius: '8px',
            border: `1px solid ${getSegmentColor(segment.segment).replace('0.1', '0.8')}`,
            color: getSegmentColor(segment.segment).replace('0.1', '0.8'),
            fontSize: `${Math.max(0.875 * zoom, 0.7)}rem`,
            fontWeight: 500,
            zIndex: 5,
            pointerEvents: 'none' as const,
            transition: 'transform 0.1s ease-out, font-size 0.1s ease-out',
            whiteSpace: 'nowrap' as const,
          };

          return (
            <React.Fragment key={segment.segment}>
              <div style={style} className="segment-background" />
              <div style={labelStyle} className="segment-label">
                Сегмент: {segment.segment}
              </div>
            </React.Fragment>
          );
        })}
      </>
    );
  }, []);

  const edgeOptions = useMemo(() => ({
    style: {
      strokeWidth: 2,
      stroke: '#2196F3',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#2196F3',
      width: 16,
      height: 16,
    },
    type: 'smoothstep',
    animated: true,
    pathOptions: {
      offset: 15,
      curvature: 0.2,
    }
  }), []);

  const { initialNodes, initialEdges, segmentGroups } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 1;
    const segments: Record<string, { minX: number; maxX: number; minY: number; maxY: number; nodes: Node[] }> = {};

    integration.segments.forEach((segment) => {
      const segmentNodes: Node[] = [];
      
      segment.elements.forEach((element: Element) => {
        if (!element.type) return; // Пропускаем элементы без типа

        const elementNode = {
          id: element.id.toString(),
          type: element.type.toLowerCase() === 'k8s' ? 'k8s' : 'custom',
          position: { x: 0, y: 0 },
          data: { 
            label: element.name || element.type,
            type: element.type,
            element: element,
            services: element.services,
            onServiceClick: onElementClick,
            selected: element.id.toString() === selectedElementId?.toString(),
            selectedElementId,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
        nodes.push(elementNode);
        segmentNodes.push(elementNode);

        if (element.next) {
          const nextIds = Array.isArray(element.next) ? element.next : [element.next];
          nextIds.forEach(nextId => {
            edges.push({
              id: `e${nodeId++}`,
              source: String(element.id),
              target: String(nextId),
              type: 'smoothstep',
              animated: true,
              style: { 
                strokeWidth: 2,
                stroke: '#2196F3',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#2196F3',
                width: 16,
                height: 16,
              },
              sourceHandle: 'right',
              targetHandle: 'left',
            });
          });
        }
      });

      segments[segment.segment] = {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        nodes: segmentNodes,
      };
    });

    return { 
      initialNodes: nodes, 
      initialEdges: edges,
      segmentGroups: segments,
    };
  }, [integration, selectedElementId, onElementClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useLayoutEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    layoutedNodes.forEach((node) => {
      for (const segmentName in segmentGroups) {
        if (segmentGroups[segmentName].nodes.find(n => n.id === node.id)) {
          segmentGroups[segmentName].minX = Math.min(segmentGroups[segmentName].minX, node.position.x - 50);
          segmentGroups[segmentName].maxX = Math.max(segmentGroups[segmentName].maxX, node.position.x + (node.type === 'k8s' ? 350 : 230));
          segmentGroups[segmentName].minY = Math.min(segmentGroups[segmentName].minY, node.position.y - 50);
          segmentGroups[segmentName].maxY = Math.max(segmentGroups[segmentName].maxY, node.position.y + (node.type === 'k8s' ? 250 : 130));
        }
      }
    });

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges, segmentGroups]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onElementClick && node.id) {
        onElementClick(node.id);
      }
    },
    [onElementClick]
  );

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          bgcolor: 'transparent',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 2,
          '& .react-flow__edge-path': {
            stroke: '#2196F3',
            strokeWidth: 2,
            filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.2))',
          },
          '& .react-flow__edge-path:hover': {
            stroke: '#1976D2',
            strokeWidth: 3,
          },
          '& .react-flow__handle': {
            transition: 'all 0.2s ease',
            opacity: 0.8,
            background: '#2196F3',
            width: '12px',
            height: '12px',
            border: '2px solid white',
            boxShadow: '0 0 0 2px #2196F3',
          },
          '& .react-flow__handle:hover': {
            transform: 'scale(1.2)',
            opacity: 1,
          },
          '& .react-flow__handle-left': {
            left: '-7px',
          },
          '& .react-flow__handle-right': {
            right: '-7px',
          },
        }}
      >
        <ReactFlowProvider>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={1.5}
              attributionPosition="bottom-left"
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={true}
              zoomOnScroll={true}
              preventScrolling={true}
              defaultEdgeOptions={edgeOptions}
              fitViewOptions={{
                padding: 0.2,
                duration: 800,
              }}
            >
              <NetworkSegments segments={integration.segments} segmentGroups={segmentGroups} />
              <Background 
                variant={BackgroundVariant.Dots} 
                color="#99999922"
                size={1}
                gap={16}
              />
              <Controls 
                showInteractive={false}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Panel position="top-right" style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title="Уменьшить">
                  <IconButton 
                    onClick={() => zoomOut()}
                    sx={{
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Увеличить">
                  <IconButton 
                    onClick={() => zoomIn()}
                    sx={{
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="По центру">
                  <IconButton 
                    onClick={() => fitView()}
                    sx={{
                      bgcolor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      }
                    }}
                  >
                    <CenterFocusStrongIcon />
                  </IconButton>
                </Tooltip>
              </Panel>
            </ReactFlow>
          </motion.div>
        </ReactFlowProvider>
      </Paper>
    </Box>
  );
});

IntegrationFlow.displayName = 'IntegrationFlow';

export default IntegrationFlow; 