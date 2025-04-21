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
import { Element, Integration } from '../../types/integration';
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
  services: Array<{
    id: string;
    label: string;
    type: string;
    selected: boolean;
  }>;
  onServiceClick: (id: string) => void;
}

// Кастомная нода для обычного элемента
const CustomNode = ({ data, isConnectable, selected }: NodeProps) => {
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
        background: selected ? '#f8f9fa' : 'white',
        minWidth: '200px',
        boxShadow: selected 
          ? `0 8px 16px rgba(0,0,0,0.1), 0 0 0 4px ${getNodeColor(data.type)}22` 
          : '0 4px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: selected ? 'translateY(-2px)' : 'none',
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
          boxShadow: '0 0 0 2px ' + getNodeColor(data.type)
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
          boxShadow: '0 0 0 2px ' + getNodeColor(data.type)
        }}
      />
    </motion.div>
  );
};

// Компонент горизонтальной стрелки
const HorizontalArrow = ({ direction }: { direction: 'left' | 'right' }) => (
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      ...(direction === 'left' ? { left: '-24px' } : { right: '-24px' }),
      transform: 'translateY(-50%)',
      width: '24px',
      height: '12px',
      display: 'flex',
      alignItems: 'center',
      color: '#2196F3',
      '&::after': {
        content: '""',
        position: 'absolute',
        height: '2px',
        width: '24px',
        backgroundColor: '#2196F3',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        ...(direction === 'left' ? { right: 0 } : { right: 0 }),
        width: '8px',
        height: '8px',
        borderRight: '2px solid #2196F3',
        borderBottom: '2px solid #2196F3',
        transform: direction === 'left' 
          ? 'rotate(-45deg) translate(-3px, -3px)'
          : 'rotate(-45deg) translate(-3px, -3px)',
      }
    }}
  />
);

// Компонент вертикальной стрелки
const ServiceArrow = () => (
  <Box
    sx={{
      position: 'absolute',
      left: '50%',
      bottom: '-12px',
      transform: 'translateX(-50%)',
      width: '12px',
      height: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#2196F3',
      '&::after': {
        content: '""',
        position: 'absolute',
        width: '2px',
        height: '24px',
        backgroundColor: '#2196F3',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        width: '8px',
        height: '8px',
        borderRight: '2px solid #2196F3',
        borderBottom: '2px solid #2196F3',
        transform: 'rotate(45deg) translate(-2px, -2px)',
      }
    }}
  />
);

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

const K8sNode = ({ data, isConnectable, selected }: NodeProps<K8sNodeData>) => {
  const color = useMemo(() => getNodeColor('k8s'), []);
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20 
      }}
      style={{
        ...nodeStyles.container,
        border: `2px solid ${color}`,
        background: selected ? '#f8f9fa' : 'white',
        boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.05)',
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
            ...nodeStyles.title,
            color
          }}
        >
          {data.label}
        </Typography>
        <Typography
          variant="caption"
          sx={nodeStyles.subtitle}
        >
          {data.type}
        </Typography>

        <Box
          sx={{
            ...nodeStyles.servicesContainer,
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
            }
          }}
        >
          {data.services?.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.1 
              }}
              style={{ position: 'relative' }}
            >
              {index === 0 && <HorizontalArrow direction="left" />}
              <Box
                sx={{
                  ...nodeStyles.serviceItem,
                  border: `1px solid ${color}`,
                  backgroundColor: service.selected ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(33, 150, 243, 0.15)',
                  },
                }}
                onClick={() => data.onServiceClick(service.id)}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    color: color,
                    fontSize: '0.875rem',
                  }}
                >
                  {service.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    display: 'block',
                    fontSize: '0.75rem',
                  }}
                >
                  {service.type}
                </Typography>
              </Box>
              {index < data.services.length - 1 && <ServiceArrow />}
              {index === data.services.length - 1 && <HorizontalArrow direction="right" />}
            </motion.div>
          ))}
        </Box>
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
  
  // Уменьшаем отступы между узлами вдвое
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,  // Было 200
    ranksep: 125,  // Было 250
    edgesep: 40,   // Было 80
    marginx: 25,   // Было 50
    marginy: 25    // Было 50
  });

  nodes.forEach((node: Node) => {
    // Оптимизируем размеры узлов в зависимости от типа
    const nodeConfig = (() => {
      switch (node.type) {
        case 'k8s':
          return {
            width: 350,    // Было 400
            height: 250    // Было 300
          };
        case 'custom':
          // Для Kafka топиков делаем узлы пошире
          if (node.data?.type?.toLowerCase() === 'kafka') {
            return {
              width: 240,  // Было 280
              height: 90   // Было 100
            };
          }
          // Для остальных типов (nginx, geo-load-balancer и т.д.)
          return {
            width: 180,    // Было 220
            height: 90     // Было 100
          };
        default:
          return {
            width: 180,    // Было 220
            height: 90     // Было 100
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
        x: nodeWithPosition.x - width / 2,   // Центрируем узел
        y: nodeWithPosition.y - height / 2    // Центрируем узел
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

  const { initialNodes, initialEdges, segmentGroups } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 1;
    const segments: Record<string, { minX: number; maxX: number; minY: number; maxY: number; nodes: Node[] }> = {};

    integration.segments.forEach((segment) => {
      const segmentNodes: Node[] = [];
      
      segment.elements.forEach((element: Element) => {
        const elementNodeId = String(element.id);
        
        if (element.type === 'k8s' && element.services) {
          const node = {
            id: elementNodeId,
            type: 'k8s',
            data: {
              label: element.name || element.type,
              type: element.type,
              services: element.services.map(service => ({
                id: service.id,
                label: service.service,
                type: service.service,
                selected: selectedElementId === service.id
              })),
              onServiceClick: onElementClick
            },
            position: { x: 0, y: 0 },
          };
          nodes.push(node);
          segmentNodes.push(node);
        } else {
          const node = {
            id: elementNodeId,
            type: 'custom',
            data: {
              label: element.name || element.type,
              type: element.type,
            },
            position: { x: 0, y: 0 },
          };
          nodes.push(node);
          segmentNodes.push(node);
        }

        if (element.next) {
          edges.push({
            id: `e${nodeId++}`,
            source: String(element.id),
            target: String(element.next),
            type: 'smoothstep',
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
  }, [integration, selectedElementId]);

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

  const edgeOptions = useMemo(() => ({
    style: {
      strokeWidth: 2,
      stroke: '#2196F3',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#2196F3',
      width: 20,
      height: 20,
    },
    animated: true,
  }), []);

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
          },
          '& .react-flow__handle:hover': {
            transform: 'scale(1.2)',
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