// Version3

import React, { useEffect, useState } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  Node, 
  Edge,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Components
const PathwayNode = ({ data }) => (
  <div className="pathway-node">
    <div className="pathway-inner">
      <div className="pathway-title">{data.label}</div>
    </div>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const GeneNode = ({ data }) => (
  <div className="gene-node">
    <div className="gene-label">{data.label}</div>
    <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
  </div>
);

const nodeTypes = {
  pathway: PathwayNode,
  gene: GeneNode,
};

interface GenePathwayNetworkProps {
  term: {
    name: string;
    genes: string[];
  };
}

const GenePathwayNetwork: React.FC<GenePathwayNetworkProps> = ({ term }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!term) return;

    setIsAnimating(true);
    
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Create the central pathway node with enhanced styling
    const pathwayNode: Node = {
      id: 'pathway-node',
      type: 'pathway',
      data: { label: term.name },
      position: { x: 500, y: 400 }, // Centered in larger space
      draggable: true,
    };
    initialNodes.push(pathwayNode);

    // Create gene nodes in a beautiful spiral pattern with better spacing
    const totalGenes = term.genes.length;
    const layers = Math.ceil(totalGenes / 8);
    
    term.genes.forEach((gene, index) => {
      const layer = Math.floor(index / 8);
      const indexInLayer = index % 8;
      const genesInLayer = Math.min(8, totalGenes - layer * 8);
      
      // Increased radius for better spacing and larger nodes
      const radius = 280 + layer * 180;
      const angle = (indexInLayer / genesInLayer) * 2 * Math.PI - Math.PI / 2;
      const x = 500 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);

      const geneNode: Node = {
        id: `gene-${gene}`,
        type: 'gene',
        data: { label: gene },
        position: { x, y },
        draggable: true,
      };
      initialNodes.push(geneNode);

      // Create beautiful curved edges
      const edge: Edge = {
        id: `edge-${gene}-to-pathway`,
        source: `gene-${gene}`,
        target: 'pathway-node',
        animated: true,
        style: {
          stroke: `hsl(${(index * 360) / totalGenes}, 70%, 60%)`,
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))',
        },
        type: 'smoothstep',
      };
      initialEdges.push(edge);
    });

    // Animate nodes appearing
    setTimeout(() => {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsAnimating(false);
    }, 100);

  }, [term, setNodes, setEdges]);

  return (
    <div className="gene-pathway-container">
      <style>{`
        .gene-pathway-container {
          height: 100%;
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          position: relative;
          min-height: 700px;
        }

        .pathway-node {
          width: 220px;
          height: 220px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 50%;
          border: 5px solid #ffffff;
          box-shadow: 
            0 12px 30px rgba(59, 130, 246, 0.35),
            0 6px 15px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
        }

        .pathway-node:hover {
          transform: scale(1.05);
          box-shadow: 
            0 18px 40px rgba(59, 130, 246, 0.45),
            0 8px 20px rgba(0, 0, 0, 0.18);
        }

        .pathway-inner {
          text-align: center;
          color: white;
          padding: 25px;
        }

        .pathway-title {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          word-wrap: break-word;
          max-width: 160px;
        }

        .gene-node {
          width: 120px;
          height: 120px;
          background: #ffffff;
          border: 3px solid #bfdbfe;
          border-radius: 50%;
          box-shadow: 
            0 6px 18px rgba(0, 0, 0, 0.12),
            0 3px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .gene-node:hover {
          transform: translateY(-3px) scale(1.08);
          border-color: #3b82f6;
          box-shadow: 
            0 12px 25px rgba(59, 130, 246, 0.25),
            0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .gene-label {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          line-height: 1.2;
          word-wrap: break-word;
          max-width: 100px;
          padding: 0 8px;
        }

        .react-flow__controls {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .react-flow__controls button {
          background: white;
          border: none;
          color: #6b7280;
          transition: all 0.2s ease;
          width: 32px;
          height: 32px;
        }

        .react-flow__controls button:hover {
          background: #f9fafb;
          color: #374151;
        }

        .react-flow__edge {
          stroke: #9ca3af;
          stroke-width: 3;
        }

        .react-flow__edge.animated {
          stroke-dasharray: 8;
          animation: dashdraw 0.8s linear infinite;
        }

        .react-flow__edge.animated path {
          stroke: #6b7280;
        }

        @keyframes dashdraw {
          to {
            stroke-dashoffset: -16;
          }
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border-radius: 12px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Ensure ReactFlow uses full space */
        .react-flow {
          width: 100%;
          height: 100%;
        }

        .react-flow__viewport {
          width: 100%;
          height: 100%;
        }
      `}</style>
      
      {isAnimating && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 0.05,  // Reduced padding to use more space
          minZoom: 0.3,   // Allow more zoom out
          maxZoom: 1.5    // Allow more zoom in
        }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls />
        <Background 
          color="#f8fafc"
          gap={24}
          size={1}
        />
      </ReactFlow>
    </div>
)};

export default GenePathwayNetwork;