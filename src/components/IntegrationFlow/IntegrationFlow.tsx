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
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import { Box, Paper, Typography } from '@mui/material';
import { Element, Integration } from '../../types/integration';
import 'reactflow/dist/style.css';

interface IntegrationFlowProps {
  integration: Integration;
  onElementClick: (elementId: string | number) => void;
  selectedElementId: string | number | null;
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
    <div
      style={{
        padding: '10px',
        borderRadius: '8px',
        border: `2px solid ${getNodeColor(data.type)}`,
        background: selected ? '#f8f9fa' : 'white',
        minWidth: '180px',
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            color: getNodeColor(data.type),
            fontSize: '1rem',
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
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
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

// Кастомная нода для K8s с сервисами
const K8sNode = ({ data, isConnectable, selected }: NodeProps) => {
  const getNodeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'k8s':
        return '#2196F3';
      default:
        return '#607D8B';
    }
  };

  return (
    <div
      style={{
        padding: '15px',
        borderRadius: '12px',
        border: `2px solid ${getNodeColor('k8s')}`,
        background: selected ? '#f8f9fa' : 'white',
        minWidth: '300px',
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <div>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            color: getNodeColor('k8s'),
            fontSize: '1rem',
            mb: 1,
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
            mb: 2,
          }}
        >
          {data.type}
        </Typography>

        {/* Сервисы */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: 1,
            px: 3, // Добавляем отступы по бокам для стрелок
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            borderRadius: '8px',
          }}
        >
          {data.services?.map((service: any, index: number) => (
            <Box
              key={service.id}
              sx={{
                position: 'relative',
              }}
            >
              {index === 0 && <HorizontalArrow direction="left" />}
              <Box
                sx={{
                  p: 1,
                  borderRadius: '6px',
                  border: '1px solid #2196F3',
                  backgroundColor: service.selected ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  },
                }}
                onClick={() => data.onServiceClick(service.id)}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    color: '#2196F3',
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
            </Box>
          ))}
        </Box>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  k8s: K8sNode,
};

// Функция для автоматического расположения элементов
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.type === 'k8s' ? 300 : 180, height: node.type === 'k8s' ? 200 : 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.type === 'k8s' ? 150 : 90),
        y: nodeWithPosition.y - (node.type === 'k8s' ? 100 : 40),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const NetworkSegments = ({ segments, segmentGroups }: { 
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
};

export const IntegrationFlow: React.FC<IntegrationFlowProps> = React.memo(({
  integration,
  onElementClick,
  selectedElementId,
}) => {
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

  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
    k8s: K8sNode,
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
        }}
      >
        <ReactFlowProvider>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
            >
              <NetworkSegments segments={integration.segments} segmentGroups={segmentGroups} />
              <Background variant={BackgroundVariant.Dots} />
              <Controls />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </Paper>
    </Box>
  );
});

IntegrationFlow.displayName = 'IntegrationFlow';

export default IntegrationFlow; 