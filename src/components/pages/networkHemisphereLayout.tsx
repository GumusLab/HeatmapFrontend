import * as THREE from 'three';

interface ProcessedNetworkData {
  nodes: string[];
  correlations: Array<{
    gene1: string;
    gene2: string;
    correlation: number;
  }>;
}

interface ClusterInfo {
  id: number;
  nodes: string[];
  center: THREE.Vector3;
  radius: number;
  color: THREE.Color;
}

/**
 * Advanced community detection using Louvain-like algorithm
 */
class CommunityDetection {
  private adjacencyMap: Map<string, Map<string, number>>;
  private nodes: string[];
  
  constructor(processedNetworkData: ProcessedNetworkData) {
    this.nodes = processedNetworkData.nodes;
    this.adjacencyMap = new Map();
    
    // Initialize adjacency map
    this.nodes.forEach(node => {
      this.adjacencyMap.set(node, new Map());
    });
    
    // Build weighted adjacency matrix
    processedNetworkData.correlations.forEach(corr => {
      const weight = Math.abs(corr.correlation);
      if (weight > 0.1) { // Only consider significant correlations
        this.adjacencyMap.get(corr.gene1)?.set(corr.gene2, weight);
        this.adjacencyMap.get(corr.gene2)?.set(corr.gene1, weight);
      }
    });
  }
  
  /**
   * Find communities using greedy modularity optimization
   */
  findCommunities(): Map<string, number> {
    const communities = new Map<string, number>();
    const nodeStrengths = new Map<string, number>();
    
    // Calculate node strengths (sum of edge weights)
    this.nodes.forEach(node => {
      const neighbors = this.adjacencyMap.get(node)!;
      const strength = Array.from(neighbors.values()).reduce((sum, weight) => sum + weight, 0);
      nodeStrengths.set(node, strength);
    });
    
    // Initialize each node in its own community
    this.nodes.forEach((node, index) => {
      communities.set(node, index);
    });
    
    let improved = true;
    let iteration = 0;
    
    while (improved && iteration < 10) {
      improved = false;
      iteration++;
      
      // Shuffle nodes for better optimization
      const shuffledNodes = [...this.nodes].sort(() => Math.random() - 0.5);
      
      for (const node of shuffledNodes) {
        const currentCommunity = communities.get(node)!;
        const neighborCommunities = new Map<number, number>();
        
        // Find neighboring communities and their connection strengths
        const neighbors = this.adjacencyMap.get(node)!;
        neighbors.forEach((weight, neighbor) => {
          const neighborCommunity = communities.get(neighbor)!;
          if (neighborCommunity !== currentCommunity) {
            const current = neighborCommunities.get(neighborCommunity) || 0;
            neighborCommunities.set(neighborCommunity, current + weight);
          }
        });
        
        // Find the best community to move to
        let bestCommunity = currentCommunity;
        let bestGain = 0;
        
        neighborCommunities.forEach((connectionStrength, communityId) => {
          // Simple gain calculation based on connection strength
          const gain = connectionStrength;
          if (gain > bestGain) {
            bestGain = gain;
            bestCommunity = communityId;
          }
        });
        
        // Move node if beneficial
        if (bestCommunity !== currentCommunity && bestGain > 0) {
          communities.set(node, bestCommunity);
          improved = true;
        }
      }
    }
    
    // Renumber communities to be consecutive
    const uniqueCommunities = Array.from(new Set(communities.values()));
    const communityMapping = new Map<number, number>();
    uniqueCommunities.forEach((oldId, newId) => {
      communityMapping.set(oldId, newId);
    });
    
    communities.forEach((oldId, node) => {
      communities.set(node, communityMapping.get(oldId)!);
    });
    
    console.log(`🔍 Found ${uniqueCommunities.length} communities in ${iteration} iterations`);
    return communities;
  }
}

/**
 * Create explicit cluster layout on full sphere
 */
// export function createClusteredSphereLayout(
//   processedNetworkData: ProcessedNetworkData,
//   radius: number = 30
// ): { 
//   nodePositions: { [nodeId: string]: THREE.Vector3 },
//   clusters: ClusterInfo[]
// } {
//   console.log('🎯 Starting clustered sphere layout...');
  
//   // Step 1: Detect communities
//   const communityDetector = new CommunityDetection(processedNetworkData);
//   const nodeCommunities = communityDetector.findCommunities();
  
//   // Step 2: Group nodes by community
//   const clusterMap = new Map<number, string[]>();
//   nodeCommunities.forEach((communityId, nodeId) => {
//     if (!clusterMap.has(communityId)) {
//       clusterMap.set(communityId, []);
//     }
//     clusterMap.get(communityId)!.push(nodeId);
//   });
  
//   const clusters = Array.from(clusterMap.entries()).map(([id, nodes]) => ({ id, nodes }));
//   console.log(`📊 Cluster sizes:`, clusters.map(c => `Cluster ${c.id}: ${c.nodes.length} nodes`));
  
//   // Step 3: Position clusters on sphere surface
//   const clusterCenters = new Map<number, THREE.Vector3>();
//   const clusterColors = [
//     new THREE.Color(0x2196F3), // Blue
//     new THREE.Color(0x4CAF50), // Green  
//     new THREE.Color(0xFF9800), // Orange
//     new THREE.Color(0x9C27B0), // Purple
//     new THREE.Color(0xF44336), // Red
//     new THREE.Color(0x00BCD4), // Cyan
//     new THREE.Color(0xFF5722), // Deep Orange
//     new THREE.Color(0x8BC34A), // Light Green
//     new THREE.Color(0x673AB7), // Deep Purple
//     new THREE.Color(0xFFC107), // Amber
//   ];
  
//   // Distribute cluster centers evenly on sphere using spiral method
//   clusters.forEach((cluster, index) => {
//     const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle
//     const y = 1 - (2 * index) / (clusters.length - 1); // y from 1 to -1 (full sphere)
//     const radiusAtY = Math.sqrt(1 - y * y);
//     const theta = goldenAngle * index;
    
//     const x = Math.cos(theta) * radiusAtY;
//     const z = Math.sin(theta) * radiusAtY;
    
//     const center = new THREE.Vector3(x, y, z).multiplyScalar(radius * 0.7); // Slightly inside sphere
//     clusterCenters.set(cluster.id, center);
//   });
  
//   // Step 4: Position nodes within each cluster
//   const nodePositions: { [nodeId: string]: THREE.Vector3 } = {};
//   const clusterInfos: ClusterInfo[] = [];
  
//   clusters.forEach((cluster, clusterIndex) => {
//     const clusterCenter = clusterCenters.get(cluster.id)!;
//     const clusterRadius = Math.min(8, Math.max(3, Math.sqrt(cluster.nodes.length) * 2));
//     const color = clusterColors[clusterIndex % clusterColors.length];
    
//     // Position nodes in cluster using spiral pattern
//     cluster.nodes.forEach((nodeId, nodeIndex) => {
//       if (cluster.nodes.length === 1) {
//         // Single node - place at cluster center
//         nodePositions[nodeId] = clusterCenter.clone();
//       } else {
//         // Multiple nodes - spiral around cluster center
//         const nodeGoldenAngle = Math.PI * (3 - Math.sqrt(5));
//         const localY = 1 - (2 * nodeIndex) / (cluster.nodes.length - 1);
//         const localRadiusAtY = Math.sqrt(1 - localY * localY);
//         const localTheta = nodeGoldenAngle * nodeIndex;
        
//         const localX = Math.cos(localTheta) * localRadiusAtY;
//         const localZ = Math.sin(localTheta) * localRadiusAtY;
        
//         const localPosition = new THREE.Vector3(localX, localY, localZ)
//           .multiplyScalar(clusterRadius);
        
//         const worldPosition = clusterCenter.clone().add(localPosition);
        
//         // Project back to sphere surface to maintain spherical layout
//         const distanceFromOrigin = worldPosition.length();
//         if (distanceFromOrigin > 0) {
//           const targetRadius = radius + (Math.random() - 0.5) * 4; // Add slight randomness
//           worldPosition.normalize().multiplyScalar(targetRadius);
//         }
        
//         nodePositions[nodeId] = worldPosition;
//       }
//     });
    
//     clusterInfos.push({
//       id: cluster.id,
//       nodes: cluster.nodes,
//       center: clusterCenter,
//       radius: clusterRadius,
//       color: color
//     });
//   });
  
//   console.log(`✅ Positioned ${Object.keys(nodePositions).length} nodes in ${clusters.length} clusters`);
  
//   return {
//     nodePositions,
//     clusters: clusterInfos
//   };
// }

/**
 * Create explicit cluster layout on full sphere
 */
export function createClusteredSphereLayout(
  processedNetworkData: ProcessedNetworkData,
  radius: number = 30
): { 
  nodePositions: { [nodeId: string]: THREE.Vector3 },
  clusters: ClusterInfo[]
} {
  console.log('🎯 Starting clustered sphere layout...');
  
  // Step 1: Detect communities
  const communityDetector = new CommunityDetection(processedNetworkData);
  const nodeCommunities = communityDetector.findCommunities();
  
  // Step 2: Group nodes by community
  const clusterMap = new Map<number, string[]>();
  nodeCommunities.forEach((communityId, nodeId) => {
    if (!clusterMap.has(communityId)) {
      clusterMap.set(communityId, []);
    }
    clusterMap.get(communityId)!.push(nodeId);
  });
  
  const clusters = Array.from(clusterMap.entries()).map(([id, nodes]) => ({ id, nodes }));
  console.log(`📊 Cluster sizes:`, clusters.map(c => `Cluster ${c.id}: ${c.nodes.length} nodes`));
  
  // Step 3: Position clusters on sphere surface
  const clusterCenters = new Map<number, THREE.Vector3>();
  const clusterColors = [
    new THREE.Color(0x2196F3), // Blue
    new THREE.Color(0x4CAF50), // Green  
    new THREE.Color(0xFF9800), // Orange
    new THREE.Color(0x9C27B0), // Purple
    new THREE.Color(0xF44336), // Red
    new THREE.Color(0x00BCD4), // Cyan
    new THREE.Color(0xFF5722), // Deep Orange
    new THREE.Color(0x8BC34A), // Light Green
    new THREE.Color(0x673AB7), // Deep Purple
    new THREE.Color(0xFFC107), // Amber
  ];
  
  // Distribute cluster centers evenly on sphere using spiral method
  clusters.forEach((cluster, index) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const y = 1 - (2 * index) / (clusters.length - 1); // y from 1 to -1 (full sphere)
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * index;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    const center = new THREE.Vector3(x, y, z).multiplyScalar(radius * 0.7); // Slightly inside sphere
    clusterCenters.set(cluster.id, center);
  });
  
  // Step 4: Position nodes within each cluster
  const nodePositions: { [nodeId: string]: THREE.Vector3 } = {};
  const clusterInfos: ClusterInfo[] = [];
  
  clusters.forEach((cluster, clusterIndex) => {
    const clusterCenter = clusterCenters.get(cluster.id)!;
    const clusterRadius = Math.min(8, Math.max(3, Math.sqrt(cluster.nodes.length) * 2));
    const color = clusterColors[clusterIndex % clusterColors.length];
    
    // Collect all node positions for this cluster first
    const clusterNodePositions: THREE.Vector3[] = [];
    
    // Position nodes in cluster using spiral pattern
    cluster.nodes.forEach((nodeId, nodeIndex) => {
      if (cluster.nodes.length === 1) {
        // Single node - place at cluster center projected to main sphere surface
        const singleNodePos = clusterCenter.clone().normalize().multiplyScalar(radius);
        nodePositions[nodeId] = singleNodePos;
        clusterNodePositions.push(singleNodePos);
      } else {
        // Multiple nodes - spiral around cluster center
        const nodeGoldenAngle = Math.PI * (3 - Math.sqrt(5));
        const localY = 1 - (2 * nodeIndex) / (cluster.nodes.length - 1);
        const localRadiusAtY = Math.sqrt(1 - localY * localY);
        const localTheta = nodeGoldenAngle * nodeIndex;
        
        const localX = Math.cos(localTheta) * localRadiusAtY;
        const localZ = Math.sin(localTheta) * localRadiusAtY;
        
        const localPosition = new THREE.Vector3(localX, localY, localZ)
          .multiplyScalar(clusterRadius);
        
        const worldPosition = clusterCenter.clone().add(localPosition);
        
        // Project back to sphere surface to maintain spherical layout
        const distanceFromOrigin = worldPosition.length();
        if (distanceFromOrigin > 0) {
          const targetRadius = radius + (Math.random() - 0.5) * 2; // Less randomness
          worldPosition.normalize().multiplyScalar(targetRadius);
        }
        
        nodePositions[nodeId] = worldPosition;
        clusterNodePositions.push(worldPosition);
      }
    });
    
    // Calculate the ACTUAL center of positioned nodes (centroid)
    const actualCenter = new THREE.Vector3();
    clusterNodePositions.forEach(pos => {
      actualCenter.add(pos);
    });
    actualCenter.divideScalar(clusterNodePositions.length);
    
    // Calculate the actual radius (max distance from actual center to any node)
    let actualRadius = 0;
    clusterNodePositions.forEach(pos => {
      const distance = actualCenter.distanceTo(pos);
      actualRadius = Math.max(actualRadius, distance);
    });
    actualRadius = Math.max(actualRadius + 1, 3); // Add padding, minimum radius
    
    console.log(`📍 Cluster ${cluster.id}: Planned center vs Actual center`);
    console.log(`   Planned: (${clusterCenter.x.toFixed(1)}, ${clusterCenter.y.toFixed(1)}, ${clusterCenter.z.toFixed(1)})`);
    console.log(`   Actual:  (${actualCenter.x.toFixed(1)}, ${actualCenter.y.toFixed(1)}, ${actualCenter.z.toFixed(1)})`);
    console.log(`   Actual radius: ${actualRadius.toFixed(1)}`);
    
    clusterInfos.push({
      id: cluster.id,
      nodes: cluster.nodes,
      center: actualCenter, // Use ACTUAL center, not planned center
      radius: actualRadius, // Use ACTUAL radius
      color: color
    });
  });
  
  console.log(`✅ Positioned ${Object.keys(nodePositions).length} nodes in ${clusters.length} clusters`);
  
  return {
    nodePositions,
    clusters: clusterInfos
  };
}

/**
 * Apply clustered sphere layout with clear visual separation
 */
export function applyClusteredSphereLayout(
  processedNetworkData: ProcessedNetworkData,
  nodesRef: React.MutableRefObject<Map<string, any>>,
  radius: number = 30
): ClusterInfo[] {
  console.log('🚀 Applying clustered sphere layout...');
  
  const { nodePositions, clusters } = createClusteredSphereLayout(processedNetworkData, radius);
  
  // Apply positions and colors to nodes
  let appliedCount = 0;
  clusters.forEach((cluster, clusterIndex) => {
    cluster.nodes.forEach(nodeId => {
      const nodeData = nodesRef.current.get(nodeId);
      if (nodeData && nodeData.mesh && nodePositions[nodeId]) {
        const pos = nodePositions[nodeId];
        
        // Update position
        nodeData.mesh.position.copy(pos);
        
        // Update color to match cluster
        nodeData.mesh.material.color.copy(cluster.color);
        
        // Make nodes in same cluster slightly larger for better visibility
        const scale = 1 + (cluster.nodes.length > 5 ? 0.3 : 0.1);
        nodeData.mesh.scale.setScalar(scale);
        
        // Update label position
        if (nodeData.sprite) {
          nodeData.sprite.position.set(pos.x, pos.y + 3, pos.z);
        }
        
        appliedCount++;
      }
    });
  });
  
  console.log(`✅ Applied clustered layout to ${appliedCount} nodes in ${clusters.length} clusters`);
  return clusters;
}

/**
 * Add cluster visualization helpers (optional spheres around clusters)
 */
export function addClusterVisualization(
  scene: THREE.Scene,
  clusters: ClusterInfo[],
  radius: number = 30
): THREE.Group {
  const clusterGroup = new THREE.Group();
  clusterGroup.name = 'clusterVisualization';
  
  clusters.forEach(cluster => {
    // Create semi-transparent sphere around each cluster
    const clusterSphereGeometry = new THREE.SphereGeometry(cluster.radius * 1.2, 16, 16);
    const clusterSphereMaterial = new THREE.MeshBasicMaterial({
      color: cluster.color,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });
    
    const clusterSphere = new THREE.Mesh(clusterSphereGeometry, clusterSphereMaterial);
    clusterSphere.position.copy(cluster.center);
    clusterGroup.add(clusterSphere);
    
    // Add cluster label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = `#${cluster.color.getHexString()}`;
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(`Cluster ${cluster.id}`, 128, 32);
    context.fillText(`(${cluster.nodes.length} genes)`, 128, 50);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(cluster.center).add(new THREE.Vector3(0, cluster.radius + 2, 0));
    sprite.scale.set(8, 2, 1);
    clusterGroup.add(sprite);
  });
  
  scene.add(clusterGroup);
  return clusterGroup;
}