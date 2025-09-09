// Integration of Leiden Algorithm with Three.js Network

import { detectCommunitiesWithLeiden, leidenToClusterInfo, LeidenCluster } from './leidenClustering';
import * as THREE from 'three';

interface ProcessedNetworkData {
  nodes: string[];
  correlations: Array<{
    gene1: string;
    gene2: string;
    correlation: number;
  }>;
  originalCorrelations?: Array<{
    gene1: string;
    gene2: string;
    correlation: number;
  }>;
  clusterCorrelations?: Array<{
    gene1: string;
    gene2: string;
    correlation: number;
  }>;
}

/**
 * Create a text label sprite for a gene
 */
function createGeneLabel(geneId: string, position: THREE.Vector3, color: THREE.Color): THREE.Sprite {
  // Create simple canvas for text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 128;
  canvas.height = 32;
  
  // Clear canvas
  context.clearRect(0, 0, 128, 32);
  
  // Simple text style
  context.font = '12px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
  
  // Draw simple text
  context.fillText(geneId, 64, 16);
  
  // Create sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  
  // Position above node
  sprite.position.copy(position).add(new THREE.Vector3(0, 1, 0));
  sprite.scale.set(2, 0.5, 1);
  
  return sprite;
}

/**
 * Apply Leiden clustering with sphere layout
 */
export async function applyLeidenClusterLayout(
  processedNetworkData: ProcessedNetworkData,
  nodesRef: React.MutableRefObject<Map<string, any>>,
  sceneRef: React.MutableRefObject<THREE.Scene | null>,
  correlationThreshold: number = 0.1,
  resolution: number = 1.0,
  radius: number = 30,
  updateEdgesCallback?: () => void,
  instancedMeshRef?: React.MutableRefObject<THREE.InstancedMesh | null>,
  clusterMeshesRef?: React.MutableRefObject<any[]>,
  labelsRef?: React.MutableRefObject<any[]>
): Promise<LeidenCluster[]> {
  
  console.log('🚀 LEIDEN CLUSTERING + 3D LAYOUT');
  console.log(`📊 Input: ${processedNetworkData.nodes.length} genes`);
  console.log(`🎚️ Correlation threshold: ${correlationThreshold}`);
  console.log(`🔧 Resolution parameter: ${resolution}`);
  
  const startTime = performance.now();
  
  // Step 1: Run Leiden clustering
  console.log('\n🧠 Step 1: Leiden community detection...');
//   const clusters = detectCommunitiesWithLeiden(
//     processedNetworkData, 
//     correlationThreshold, 
//     resolution
//   );

  const clusters = await detectCommunitiesWithLeiden(
    processedNetworkData,
    correlationThreshold,
    resolution
  );
  
  // ✅ FALLBACK: If no clusters found, create artificial clusters
  let finalClusters = clusters;
  if (clusters.length === 0) {
    console.log('⚠️ No clusters found by Leiden - creating fallback clusters...');
    finalClusters = createFallbackClusters(processedNetworkData.nodes);
    console.log(`✅ Created ${finalClusters.length} fallback clusters`);
  }
  
  
  // Step 2: Create gene-to-cluster mapping
//   const geneToCluster = leidenToClusterInfo(clusters);
  
  // Step 3: Position clusters on sphere
  console.log('\n🌍 Step 2: Positioning clusters on sphere...');
  const clusterPositions = positionClustersOnSphere(finalClusters, radius);
  
  // Step 4: Position genes within clusters
  console.log('\n📍 Step 3: Positioning genes within clusters...');
  const nodePositions = positionGenesInClusters(finalClusters, clusterPositions, radius);
  
  // Step 5: Apply to Three.js scene
  console.log('\n🎨 Step 4: Applying to 3D scene...');
  console.log(`   🔍 Clusters: ${clusters.length}`);
  console.log(`   🔍 NodePositions: ${Object.keys(nodePositions).length}`);
  console.log(`   🔍 Scene available: ${!!sceneRef.current}`);
  console.log(`   🔍 InstancedMesh: ${!!instancedMeshRef?.current}`);
  
  applyPositionsToThreeJS(finalClusters, nodePositions, nodesRef, updateEdgesCallback, instancedMeshRef, sceneRef.current, clusterMeshesRef, labelsRef);
  
  // Step 6: Add cluster visualization 
  if (sceneRef.current) {
    addLeidenClusterVisualization(sceneRef.current, finalClusters, nodePositions, nodesRef);
  }
  
  const totalTime = performance.now() - startTime;
  console.log(`\n✅ LEIDEN LAYOUT COMPLETE in ${totalTime.toFixed(1)}ms`);
  console.log(`🏘️ Created ${finalClusters.length} clusters with ${Object.keys(nodePositions).length} positioned genes`);
  
  return finalClusters;
}

/**
 * Position clusters on a sphere using golden spiral distribution
 */
function positionClustersOnSphere(
  clusters: LeidenCluster[],
  radius: number
): Map<number, THREE.Vector3> {
  
  const clusterPositions = new Map<number, THREE.Vector3>();
  
  console.log('🌍 POSITIONING CLUSTERS ON SPHERE:');
  console.log(`   - Clusters to position: ${clusters.length}`);
  console.log(`   - Sphere radius: ${radius}`);
  
  // ✅ VALIDATE INPUTS
  if (!clusters || clusters.length === 0) {
    console.error('❌ No clusters provided for sphere positioning');
    return clusterPositions;
  }
  
  if (typeof radius !== 'number' || isNaN(radius) || radius <= 0) {
    console.error('❌ Invalid sphere radius:', radius);
    return clusterPositions;
  }
  
  // Use golden spiral for even distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle ≈ 2.4 radians
  
  // ✅ VALIDATE GOLDEN ANGLE
  if (isNaN(goldenAngle)) {
    console.error('❌ Golden angle calculation failed:', goldenAngle);
    return clusterPositions;
  }
  
  console.log(`   - Golden angle: ${goldenAngle.toFixed(4)} radians`);
  
  clusters.forEach((cluster, index) => {
    console.log(`\n🎯 Positioning cluster ${cluster.id} (${index + 1}/${clusters.length}):`);
    console.log(`   - Cluster size: ${cluster.nodes.length} genes`);
    
    // ✅ VALIDATE CLUSTER
    if (!cluster || typeof cluster.id !== 'number') {
      console.error(`❌ Invalid cluster at index ${index}:`, cluster);
      return;
    }
    
    // Golden spiral distribution
    const y = 1 - (2 * index) / (clusters.length - 1); // y goes from 1 to -1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y)); // Radius at this y level
    const theta = goldenAngle * index; // Angle around y-axis
    
    // ✅ VALIDATE INTERMEDIATE CALCULATIONS
    if (isNaN(y)) {
      console.error(`❌ y coordinate is NaN for cluster ${cluster.id}:`);
      console.error(`   - Index: ${index}`);
      console.error(`   - Clusters length: ${clusters.length}`);
      return;
    }
    
    if (isNaN(radiusAtY)) {
      console.error(`❌ radiusAtY is NaN for cluster ${cluster.id}:`);
      console.error(`   - y: ${y}`);
      console.error(`   - 1 - y*y: ${1 - y * y}`);
      return;
    }
    
    if (isNaN(theta)) {
      console.error(`❌ theta is NaN for cluster ${cluster.id}:`);
      console.error(`   - Golden angle: ${goldenAngle}`);
      console.error(`   - Index: ${index}`);
      return;
    }
    
    // Convert to Cartesian coordinates
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    // ✅ VALIDATE CARTESIAN COORDINATES
    if (isNaN(x) || isNaN(z)) {
      console.error(`❌ Cartesian coordinates have NaN for cluster ${cluster.id}:`);
      console.error(`   - x: ${x}, z: ${z}`);
      console.error(`   - theta: ${theta}, radiusAtY: ${radiusAtY}`);
      return;
    }
    
    // Scale to sphere radius
    const position = new THREE.Vector3(x, y, z).multiplyScalar(radius);
    
    // ✅ VALIDATE FINAL POSITION
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error(`❌ Final position has NaN for cluster ${cluster.id}:`, position);
      console.error(`   - Before scaling: (${x}, ${y}, ${z})`);
      console.error(`   - Radius: ${radius}`);
      
      // Create fallback position
      const fallbackPosition = new THREE.Vector3(
        (Math.random() - 0.5) * radius,
        (Math.random() - 0.5) * radius,
        (Math.random() - 0.5) * radius
      ).normalize().multiplyScalar(radius);
      
      clusterPositions.set(cluster.id, fallbackPosition);
      console.log(`   - Using fallback position: (${fallbackPosition.x.toFixed(2)}, ${fallbackPosition.y.toFixed(2)}, ${fallbackPosition.z.toFixed(2)})`);
    } else {
      clusterPositions.set(cluster.id, position);
      console.log(`   - Positioned at: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
    }
  });
  
  console.log(`\n📊 CLUSTER POSITIONING SUMMARY:`);
  console.log(`   - Clusters positioned: ${clusterPositions.size}/${clusters.length}`);
  
  // ✅ VALIDATE ALL FINAL POSITIONS
  let validPositions = 0;
  let nanPositions = 0;
  
  clusterPositions.forEach((position, clusterId) => {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error(`❌ Final position check failed for cluster ${clusterId}:`, position);
      nanPositions++;
    } else {
      validPositions++;
    }
  });
  
  console.log(`   - Valid positions: ${validPositions}`);
  console.log(`   - NaN positions: ${nanPositions}`);
  
  if (nanPositions > 0) {
    console.error(`❌ ${nanPositions} clusters have NaN positions!`);
  }
  
  return clusterPositions;
}

/**
 * Position genes within their clusters
 */
function positionGenesInClusters(
  clusters: LeidenCluster[],
  clusterPositions: Map<number, THREE.Vector3>,
  mainRadius: number
): { [geneId: string]: THREE.Vector3 } {
  
  const nodePositions: { [geneId: string]: THREE.Vector3 } = {};
  
  console.log('📍 POSITIONING GENES IN CLUSTERS:');
  console.log(`   - Clusters to process: ${clusters.length}`);
  console.log(`   - Main radius: ${mainRadius}`);
  console.log(`   - Cluster positions available: ${clusterPositions.size}`);
  
  // ✅ VALIDATE INPUTS
  if (!clusters || clusters.length === 0) {
    console.error('❌ No clusters provided for positioning');
    return nodePositions;
  }
  
  if (!clusterPositions || clusterPositions.size === 0) {
    console.error('❌ No cluster positions provided');
    return nodePositions;
  }
  
  if (typeof mainRadius !== 'number' || isNaN(mainRadius) || mainRadius <= 0) {
    console.error('❌ Invalid main radius:', mainRadius);
    return nodePositions;
  }
  
  clusters.forEach((cluster, clusterIndex) => {
    console.log(`\n🎯 Processing cluster ${cluster.id} (${clusterIndex + 1}/${clusters.length}):`);
    console.log(`   - Genes in cluster: ${cluster.nodes.length}`);
    console.log(`   - Sample genes: ${cluster.nodes.slice(0, 5).join(', ')}`);
    
    // ✅ VALIDATE CLUSTER DATA
    if (!cluster.nodes || !Array.isArray(cluster.nodes) || cluster.nodes.length === 0) {
      console.warn(`❌ Cluster ${cluster.id} has no valid nodes`);
      return;
    }
    
    const clusterCenter = clusterPositions.get(cluster.id);
    if (!clusterCenter) {
      console.error(`❌ No position found for cluster ${cluster.id}`);
      return;
    }
    
    // ✅ VALIDATE CLUSTER CENTER
    if (isNaN(clusterCenter.x) || isNaN(clusterCenter.y) || isNaN(clusterCenter.z)) {
      console.error(`❌ Cluster ${cluster.id} center has NaN values:`, clusterCenter);
      return;
    }
    
    const clusterRadius = calculateClusterRadius(cluster.nodes.length);
    console.log(`   - Cluster center: (${clusterCenter.x.toFixed(2)}, ${clusterCenter.y.toFixed(2)}, ${clusterCenter.z.toFixed(2)})`);
    console.log(`   - Cluster radius: ${clusterRadius.toFixed(2)}`);
    
    // ✅ VALIDATE CLUSTER RADIUS
    if (isNaN(clusterRadius) || clusterRadius <= 0) {
      console.error(`❌ Invalid cluster radius for cluster ${cluster.id}:`, clusterRadius);
      return;
    }
    
    if (cluster.nodes.length === 1) {
      // Single gene: place at cluster center, projected to main sphere
      const position = clusterCenter.clone().normalize().multiplyScalar(mainRadius);
      
      // ✅ VALIDATE SINGLE GENE POSITION
      if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        console.error(`❌ Single gene position has NaN values for ${cluster.nodes[0]}:`, position);
        console.error(`   - Original center:`, clusterCenter);
        console.error(`   - Normalized:`, clusterCenter.clone().normalize());
        console.error(`   - Main radius:`, mainRadius);
        
        // Fallback position
        const fallbackPosition = new THREE.Vector3(
          (Math.random() - 0.5) * mainRadius,
          (Math.random() - 0.5) * mainRadius,
          (Math.random() - 0.5) * mainRadius
        ).normalize().multiplyScalar(mainRadius);
        
        nodePositions[cluster.nodes[0]] = fallbackPosition;
        console.log(`   - Using fallback position:`, fallbackPosition);
      } else {
        nodePositions[cluster.nodes[0]] = position;
        console.log(`   - Single gene positioned at:`, position);
      }
      
    } else {
      // Multiple genes: distribute around cluster center
      console.log(`   - Distributing ${cluster.nodes.length} genes around cluster center...`);
      
      cluster.nodes.forEach((geneId, geneIndex) => {
        // Use golden spiral for even distribution within cluster
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        
        // ✅ SAFE DIVISION - avoid division by zero
        const localY = cluster.nodes.length > 1 
          ? 1 - (2 * geneIndex) / (cluster.nodes.length - 1)
          : 0;
        
        // ✅ VALIDATE localY
        if (isNaN(localY)) {
          console.error(`❌ localY is NaN for gene ${geneId} (index ${geneIndex})`);
          console.error(`   - Cluster size: ${cluster.nodes.length}`);
          console.error(`   - Gene index: ${geneIndex}`);
          return;
        }
        
        const localRadiusAtY = Math.sqrt(Math.max(0, 1 - localY * localY));
        
        // ✅ VALIDATE localRadiusAtY
        if (isNaN(localRadiusAtY)) {
          console.error(`❌ localRadiusAtY is NaN for gene ${geneId}:`, localRadiusAtY);
          console.error(`   - localY: ${localY}`);
          return;
        }
        
        const localTheta = goldenAngle * geneIndex;
        
        // ✅ VALIDATE localTheta
        if (isNaN(localTheta)) {
          console.error(`❌ localTheta is NaN for gene ${geneId}:`, localTheta);
          console.error(`   - goldenAngle: ${goldenAngle}`);
          console.error(`   - geneIndex: ${geneIndex}`);
          return;
        }
        
        const localX = Math.cos(localTheta) * localRadiusAtY;
        const localZ = Math.sin(localTheta) * localRadiusAtY;
        
        // ✅ VALIDATE LOCAL COORDINATES
        if (isNaN(localX) || isNaN(localZ)) {
          console.error(`❌ Local coordinates have NaN for gene ${geneId}:`);
          console.error(`   - localX: ${localX}, localZ: ${localZ}`);
          console.error(`   - localTheta: ${localTheta}, localRadiusAtY: ${localRadiusAtY}`);
          return;
        }
        
        // Create local position within cluster
        const localPosition = new THREE.Vector3(localX, localY, localZ)
          .multiplyScalar(clusterRadius);
        
        // ✅ VALIDATE LOCAL POSITION
        if (isNaN(localPosition.x) || isNaN(localPosition.y) || isNaN(localPosition.z)) {
          console.error(`❌ Local position has NaN for gene ${geneId}:`, localPosition);
          console.error(`   - Before scaling: (${localX}, ${localY}, ${localZ})`);
          console.error(`   - Cluster radius: ${clusterRadius}`);
          return;
        }
        
        // Transform to world position
        const worldPosition = clusterCenter.clone().add(localPosition);
        
        // ✅ VALIDATE WORLD POSITION
        if (isNaN(worldPosition.x) || isNaN(worldPosition.y) || isNaN(worldPosition.z)) {
          console.error(`❌ World position has NaN for gene ${geneId}:`, worldPosition);
          console.error(`   - Cluster center: ${clusterCenter}`);
          console.error(`   - Local position: ${localPosition}`);
          return;
        }
        
        // Project to main sphere surface with small randomization
        const jitter = 1 + (Math.random() - 0.5) * 0.1; // ±5% randomization
        
        // ✅ VALIDATE JITTER
        if (isNaN(jitter) || jitter <= 0) {
          console.error(`❌ Invalid jitter value for gene ${geneId}:`, jitter);
          return;
        }
        
        const normalizedWorld = worldPosition.normalize();
        
        // ✅ VALIDATE NORMALIZED WORLD
        if (isNaN(normalizedWorld.x) || isNaN(normalizedWorld.y) || isNaN(normalizedWorld.z)) {
          console.error(`❌ Normalized world position has NaN for gene ${geneId}:`, normalizedWorld);
          console.error(`   - Original world position: ${worldPosition}`);
          console.error(`   - World position length: ${worldPosition.length()}`);
          
          // Fallback to a simple position on sphere
          const fallbackPosition = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5, 
            Math.random() - 0.5
          ).normalize().multiplyScalar(mainRadius);
          
          nodePositions[geneId] = fallbackPosition;
          console.log(`   - Using fallback position for ${geneId}:`, fallbackPosition);
          return;
        }
        
        const finalPosition = normalizedWorld.multiplyScalar(mainRadius * jitter);
        
        // ✅ FINAL VALIDATION
        if (isNaN(finalPosition.x) || isNaN(finalPosition.y) || isNaN(finalPosition.z)) {
          console.error(`❌ Final position has NaN for gene ${geneId}:`, finalPosition);
          console.error(`   - Normalized world: ${normalizedWorld}`);
          console.error(`   - Main radius: ${mainRadius}`);
          console.error(`   - Jitter: ${jitter}`);
          
          // Fallback to a simple position on sphere
          const fallbackPosition = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5, 
            Math.random() - 0.5
          ).normalize().multiplyScalar(mainRadius);
          
          nodePositions[geneId] = fallbackPosition;
          console.log(`   - Using fallback position for ${geneId}:`, fallbackPosition);
        } else {
          nodePositions[geneId] = finalPosition;
          
          // Log first few positions for debugging
          if (geneIndex < 3) {
            console.log(`   - Gene ${geneId} positioned at: (${finalPosition.x.toFixed(2)}, ${finalPosition.y.toFixed(2)}, ${finalPosition.z.toFixed(2)})`);
          }
        }
      });
    }
  });
  
  console.log(`\n📊 POSITIONING SUMMARY:`);
  console.log(`   - Total genes positioned: ${Object.keys(nodePositions).length}`);
  console.log(`   - Expected genes: ${clusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0)}`);
  
  // ✅ VALIDATE ALL FINAL POSITIONS
  let validPositions = 0;
  let nanPositions = 0;
  
  Object.entries(nodePositions).forEach(([geneId, position]) => {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error(`❌ Final position check failed for ${geneId}:`, position);
      nanPositions++;
    } else {
      validPositions++;
    }
  });
  
  console.log(`   - Valid positions: ${validPositions}`);
  console.log(`   - NaN positions: ${nanPositions}`);
  
  if (nanPositions > 0) {
    console.error(`❌ ${nanPositions} genes have NaN positions!`);
  }
  
  return nodePositions;
}

/**
 * Calculate appropriate cluster radius based on number of genes
 */
function calculateClusterRadius(geneCount: number): number {
  // Adaptive radius: larger clusters get more space
  const baseRadius = 3;
  const scaleFactor = Math.sqrt(geneCount) * 0.8;
  return Math.min(baseRadius + scaleFactor, 12); // Cap at reasonable size
}

/**
 * Create fallback clusters when Leiden fails to find any
 */
function createFallbackClusters(nodes: string[]): LeidenCluster[] {
  console.log(`🔄 Creating fallback clusters for ${nodes.length} genes...`);
  
  if (!nodes || nodes.length === 0) {
    console.error('❌ No nodes provided for fallback clusters');
    return [];
  }
  
  const fallbackClusters: LeidenCluster[] = [];
  const colors = [
    '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', 
    '#00BCD4', '#FF5722', '#8BC34A', '#673AB7', '#FFC107',
    '#E91E63', '#009688', '#795548', '#607D8B', '#3F51B5'
  ];
  
  // ✅ STRATEGY 1: For small datasets, create multiple small clusters
  if (nodes.length <= 20) {
    console.log('📊 Small dataset detected - creating multiple small clusters');
    
    // Create clusters of 3-5 nodes each
    const clusterSize = Math.min(5, Math.max(2, Math.ceil(nodes.length / 4)));
    
    for (let i = 0; i < nodes.length; i += clusterSize) {
      const clusterNodes = nodes.slice(i, i + clusterSize);
      if (clusterNodes.length > 0) {
        fallbackClusters.push({
          id: fallbackClusters.length,
          nodes: clusterNodes,
          quality: 0.6, // Moderate quality for small clusters
          color: colors[fallbackClusters.length % colors.length]
        });
      }
    }
    
    console.log(`✅ Created ${fallbackClusters.length} small clusters`);
  }
  
  // ✅ STRATEGY 2: For medium datasets, create balanced clusters  
  else if (nodes.length <= 100) {
    console.log('📊 Medium dataset detected - creating balanced clusters');
    
    // Create 3-5 clusters with roughly equal sizes
    const numClusters = Math.min(5, Math.max(3, Math.ceil(nodes.length / 20)));
    const clusterSize = Math.ceil(nodes.length / numClusters);
    
    for (let i = 0; i < numClusters; i++) {
      const startIdx = i * clusterSize;
      const endIdx = Math.min(startIdx + clusterSize, nodes.length);
      const clusterNodes = nodes.slice(startIdx, endIdx);
      
      if (clusterNodes.length > 0) {
        fallbackClusters.push({
          id: i,
          nodes: clusterNodes,
          quality: 0.5, // Moderate quality for balanced clusters
          color: colors[i % colors.length]
        });
      }
    }
    
    console.log(`✅ Created ${fallbackClusters.length} balanced clusters`);
  }
  
  // ✅ STRATEGY 3: For large datasets, create size-based clusters
  else {
    console.log('📊 Large dataset detected - creating size-based clusters');
    
    // Create clusters with decreasing sizes (mimicking natural clustering)
    const remainingNodes = [...nodes];
    let clusterId = 0;
    
    // Large cluster (30-40% of nodes)
    const largeClusterSize = Math.floor(nodes.length * 0.35);
    if (largeClusterSize > 0) {
      const largeCluster = remainingNodes.splice(0, largeClusterSize);
      fallbackClusters.push({
        id: clusterId++,
        nodes: largeCluster,
        quality: 0.7, // Higher quality for large cluster
        color: colors[0]
      });
    }
    
    // Medium clusters (20-25% each)
    const mediumClusterSize = Math.floor(nodes.length * 0.22);
    for (let i = 0; i < 2 && remainingNodes.length >= mediumClusterSize; i++) {
      const mediumCluster = remainingNodes.splice(0, mediumClusterSize);
      fallbackClusters.push({
        id: clusterId++,
        nodes: mediumCluster,
        quality: 0.6, // Medium quality
        color: colors[clusterId % colors.length]
      });
    }
    
    // Small clusters (remaining nodes)
    const smallClusterSize = Math.max(10, Math.ceil(remainingNodes.length / 3));
    while (remainingNodes.length > 0) {
      const clusterSize = Math.min(smallClusterSize, remainingNodes.length);
      const smallCluster = remainingNodes.splice(0, clusterSize);
      
      fallbackClusters.push({
        id: clusterId++,
        nodes: smallCluster,
        quality: 0.4, // Lower quality for small clusters
        color: colors[clusterId % colors.length]
      });
    }
    
    console.log(`✅ Created ${fallbackClusters.length} size-based clusters`);
  }
  
  // ✅ VALIDATION: Ensure all nodes are included
  const totalNodesInClusters = fallbackClusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0);
  if (totalNodesInClusters !== nodes.length) {
    console.error(`❌ Fallback cluster validation failed: ${totalNodesInClusters} clustered vs ${nodes.length} input nodes`);
    
    // Emergency fallback - single cluster with all nodes
    return [{
      id: 0,
      nodes: [...nodes],
      quality: 0.5,
      color: colors[0]
    }];
  }
  
  // ✅ LOG RESULTS
  console.log(`📊 Fallback clusters summary:`);
  fallbackClusters.forEach(cluster => {
    console.log(`   - Cluster ${cluster.id}: ${cluster.nodes.length} genes (quality: ${cluster.quality.toFixed(3)})`);
    console.log(`     Sample genes: ${cluster.nodes.slice(0, 3).join(', ')}${cluster.nodes.length > 3 ? '...' : ''}`);
  });
  
  return fallbackClusters;
}

/**
 * Apply positions and colors to Three.js objects
 */
function applyPositionsToThreeJS(
  clusters: LeidenCluster[],
  nodePositions: { [geneId: string]: THREE.Vector3 },
  nodesRef: React.MutableRefObject<Map<string, any>>,
  updateEdgesCallback?: () => void,
  instancedMeshRef?: React.MutableRefObject<THREE.InstancedMesh | null>,
  scene?: THREE.Scene,
  clusterMeshesRef?: React.MutableRefObject<any[]>,
  labelsRef?: React.MutableRefObject<any[]>
): void {
  console.log('🎨 Step 4: Applying to 3D scene...');
  
  let appliedCount = 0;
  
  // Check if we have an instanced mesh (global view) or need to create individual meshes (cluster view)
  const instancedMesh = instancedMeshRef?.current;
  
  if (instancedMesh) {
    console.log('🔄 Updating existing instanced mesh...');
    // Use instanced mesh approach (for global view updates)
    const matrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    
    clusters.forEach((cluster, clusterIndex) => {
      const clusterColor = new THREE.Color(cluster.color);
      
      cluster.nodes.forEach(nodeId => {
        const nodeData = nodesRef.current.get(nodeId);
        const position = nodePositions[nodeId];
        
        if (nodeData && position && typeof nodeData.instanceIndex === 'number') {
          // Update position in the instanced mesh
          matrix.setPosition(position.x, position.y, position.z);
          instancedMesh.setMatrixAt(nodeData.instanceIndex, matrix);
          
          // Update color based on cluster
          tempColor.copy(clusterColor);
          instancedMesh.setColorAt(nodeData.instanceIndex, tempColor);
          
          // Scale based on cluster quality
          const scale = 1 + cluster.quality * 0.3;
          matrix.makeScale(scale, scale, scale);
          matrix.setPosition(position.x, position.y, position.z);
          instancedMesh.setMatrixAt(nodeData.instanceIndex, matrix);
          
          appliedCount++;
        }
      });
    });
    
    // Mark for GPU update
    if (instancedMesh.instanceMatrix) {
      instancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    
    console.log(`   ✅ Updated ${appliedCount} gene instances in instanced mesh`);
    
  } else {
    console.log('🆕 Creating individual meshes for cluster view...');
    console.log('   - Scene available:', !!scene);
    console.log('   - Number of clusters:', clusters.length);
    console.log('   - Total nodes to create:', clusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0));
    // Create individual meshes approach (for cluster view)
    
    if (!scene) {
      console.error('❌ No scene reference available for creating individual meshes');
      return;
    }
    
    // Create shared geometry and materials
    const nodeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    
    clusters.forEach((cluster, clusterIndex) => {
      const clusterColor = new THREE.Color(cluster.color);
      const clusterMaterial = new THREE.MeshBasicMaterial({ color: clusterColor });
      
      console.log(`   🎨 Creating meshes for cluster ${cluster.id}: ${cluster.nodes.length} nodes`);
      
      cluster.nodes.forEach(nodeId => {
        const position = nodePositions[nodeId];
        
        if (position) {
          // Create individual mesh for this node
          const nodeMesh = new THREE.Mesh(nodeGeometry, clusterMaterial.clone());
          nodeMesh.position.copy(position);
          
          // Scale based on cluster quality
          const scale = 1 + cluster.quality * 0.3;
          nodeMesh.scale.setScalar(scale);
          
          // Add to scene
          scene.add(nodeMesh);
          
          // ✅ Create gene label
          const geneLabel = createGeneLabel(nodeId, position, clusterColor);
          scene.add(geneLabel);
          
          // ✅ Store in clusterMeshesRef for cleanup
          if (clusterMeshesRef) {
            clusterMeshesRef.current.push(nodeMesh);
            clusterMeshesRef.current.push(geneLabel); // Also store label for cleanup
          }
          
          // ✅ Store label in labelsRef for visibility control
          if (labelsRef) {
            labelsRef.current.push(geneLabel);
          }
          
          // Store in nodesRef for edge creation
          nodesRef.current.set(nodeId, { 
            mesh: nodeMesh,
            label: geneLabel,
            cluster: cluster,
            position: position
          });
          
          appliedCount++;
        } else {
          console.log(`   ❌ No position for node ${nodeId}`);
        }
      });
    });
    
    console.log(`   ✅ Created ${appliedCount} individual meshes for cluster view`);
    console.log(`   📊 Final nodesRef size: ${nodesRef.current.size}`);
    
    // ✅ IMPORTANT: Create edges immediately after creating nodes
    // console.log('🔗 COMMENTED OUT: Edge creation for cluster view disabled');
    
    // ✅ EDGE CREATION COMMENTED OUT FOR CLUSTER VIEW
    
    // ✅ TEST: Create a simple test edge to verify the system works
    // if (clusters.length >= 2 && clusters[0].nodes.length >= 1 && clusters[1].nodes.length >= 1) {
    //   console.log('🧪 Creating test edge between first nodes of first two clusters...');
    //   const testNode1 = clusters[0].nodes[0];
    //   const testNode2 = clusters[1].nodes[0];
    //   const testNode1Data = nodesRef.current.get(testNode1);
    //   const testNode2Data = nodesRef.current.get(testNode2);
      
    //   if (testNode1Data && testNode2Data && testNode1Data.mesh && testNode2Data.mesh) {
    //     const pos1 = testNode1Data.mesh.position;
    //     const pos2 = testNode2Data.mesh.position;
        
    //     // Create simple line geometry
    //     const testLineGeometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
    //     const testLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    //     const testLine = new THREE.Line(testLineGeometry, testLineMaterial);
        
    //     scene.add(testLine);
    //     console.log('✅ Test edge created successfully');
    //   } else {
    //     console.log('❌ Test edge failed - missing node data');
    //   }
    // }
    
    // if (updateEdgesCallback) {
    //   updateEdgesCallback();
    // } else {
    //   console.warn('⚠️ No updateEdgesCallback provided - edges may not appear');
    // }
  
  }
}

/**
 * Add cluster boundary visualization - FIXED VERSION
 */
function addLeidenClusterVisualization(
  scene: THREE.Scene,
  clusters: LeidenCluster[],
  nodePositions: { [geneId: string]: THREE.Vector3 },
  nodesRef: React.MutableRefObject<Map<string, any>>
): void {
  
  // Remove existing cluster visualization
  const existing = scene.getObjectByName('leidenClusterVisualization');
  if (existing) {
    scene.remove(existing);
  }
  
  const clusterGroup = new THREE.Group();
  clusterGroup.name = 'leidenClusterVisualization';
  
  clusters.forEach(cluster => {
    const clusterColor = new THREE.Color(cluster.color);
    
    // Calculate ACTUAL cluster center from positioned nodes
    const actualCenter = new THREE.Vector3();
    let validNodeCount = 0;
    
    cluster.nodes.forEach(nodeId => {
      const nodeData = nodesRef.current.get(nodeId);
      if (nodeData && nodeData.mesh) {
        actualCenter.add(nodeData.mesh.position);
        validNodeCount++;
      }
    });
    
    if (validNodeCount === 0) return; // Skip if no valid nodes
    
    actualCenter.divideScalar(validNodeCount); // Average position
    
    // Calculate actual radius (max distance from center to any node)
    let actualRadius = 0;
    cluster.nodes.forEach(nodeId => {
      const nodeData = nodesRef.current.get(nodeId);
      if (nodeData && nodeData.mesh) {
        const distance = actualCenter.distanceTo(nodeData.mesh.position);
        actualRadius = Math.max(actualRadius, distance);
      }
    });
    actualRadius = Math.max(actualRadius + 2, 4); // Add padding, minimum radius
    
    console.log(`   🎨 Cluster ${cluster.id}: Actual center (${actualCenter.x.toFixed(1)}, ${actualCenter.y.toFixed(1)}, ${actualCenter.z.toFixed(1)}), radius: ${actualRadius.toFixed(1)}`);
    
    // Create wireframe boundary sphere at ACTUAL position
    // const boundaryGeometry = new THREE.SphereGeometry(actualRadius, 16, 16);
    // const boundaryMaterial = new THREE.MeshBasicMaterial({
    //   color: clusterColor,
    //   transparent: true,
    //   opacity: 0.15,
    //   wireframe: true
    // });
    
    // const boundarySphere = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    // boundarySphere.position.copy(actualCenter);
    // clusterGroup.add(boundarySphere);
    
    // Create cluster label at actual position
    const labelCanvas = document.createElement('canvas');
    const labelContext = labelCanvas.getContext('2d');
    labelCanvas.width = 256;
    labelCanvas.height = 80;
    
    labelContext.clearRect(0, 0, 256, 80);
    labelContext.fillStyle = cluster.color;
    labelContext.font = 'bold 20px Arial';
    labelContext.textAlign = 'center';
    labelContext.fillText(`Cluster ${cluster.id}`, 128, 25);
    labelContext.fillText(`${cluster.nodes.length} genes`, 128, 45);
    labelContext.fillText(`Q=${cluster.quality.toFixed(2)}`, 128, 65);
    
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
    const labelSprite = new THREE.Sprite(labelMaterial);
    
    labelSprite.position.copy(actualCenter).add(new THREE.Vector3(0, actualRadius + 3, 0));
    labelSprite.scale.set(8, 2.5, 1);
    clusterGroup.add(labelSprite);
  });
  
  scene.add(clusterGroup);
  console.log(`   🎨 Added visualization for ${clusters.length} clusters`);
}

/**
 * Performance-optimized function for large networks
 */
export async function applyLeidenClusterLayoutOptimized(
  processedNetworkData: ProcessedNetworkData,
  nodesRef: React.MutableRefObject<Map<string, any>>,
  sceneRef: React.MutableRefObject<THREE.Scene | null>,
  options: {
    correlationThreshold?: number;
    resolution?: number;
    radius?: number;
    maxGenes?: number;
    updateEdgesCallback?: () => void;
    instancedMeshRef?: React.MutableRefObject<THREE.InstancedMesh | null>;
    clusterMeshesRef?: React.MutableRefObject<any[]>;
  } = {}
): Promise<LeidenCluster[]> {
  
  const {
    correlationThreshold = 0.1,
    resolution = 1.0,
    radius = 30,
    maxGenes = 5000,
    updateEdgesCallback,
    instancedMeshRef,
    clusterMeshesRef
  } = options;

  console.log('🔬 Starting Leiden clustering with optimizations...');
  console.log(`   📊 Input: ${processedNetworkData.nodes.length} genes, ${processedNetworkData.correlations.length} correlations`);
  console.log(`   🎯 Correlation threshold: ${correlationThreshold}`);
  console.log(`   🧬 Resolution: ${resolution}`);
  console.log(`   🔍 MaxGenes: ${maxGenes}`);
  console.log(`   🔍 NodesRef size: ${nodesRef.current.size}`);
  console.log(`   🔍 Scene available: ${!!sceneRef.current}`);

  // Step 1: Pre-filter genes if dataset is too large
  const filteredData = maxGenes < processedNetworkData.nodes.length 
    ? preFilterGenes(processedNetworkData, maxGenes)
    : processedNetworkData;

  console.log(`   ✂️ After filtering: ${filteredData.nodes.length} genes, ${filteredData.correlations.length} correlations`);
  console.log(`   📊 Sample filtered genes:`, filteredData.nodes.slice(0, 10));
  console.log(`   📊 Sample filtered correlations:`, filteredData.correlations.slice(0, 3));

  // Step 2: Apply Leiden clustering
  console.log('🔄 Calling applyLeidenClusterLayout...');
  const clusters = await applyLeidenClusterLayout(
    filteredData,
    nodesRef,
    sceneRef,
    correlationThreshold,
    resolution,
    radius,
    updateEdgesCallback,
    instancedMeshRef,
    clusterMeshesRef
  );
  console.log(`🔄 applyLeidenClusterLayout returned ${clusters.length} clusters`);

  // ✅ Step 3: Update processedNetworkData with filtered correlations for cluster view
  console.log('🔄 Updating processedNetworkData with cluster-specific correlations...');
  
  // Get all genes that are actually in clusters
  const clusterGenes = new Set<string>();
  clusters.forEach(cluster => {
    cluster.nodes.forEach(nodeId => clusterGenes.add(nodeId));
  });
  
  // Filter correlations to only include edges between cluster genes
  const clusterCorrelations = filteredData.correlations.filter(corr => 
    clusterGenes.has(corr.gene1) && clusterGenes.has(corr.gene2)
  );
  
  console.log(`   📊 Cluster correlations: ${clusterCorrelations.length} (from ${filteredData.correlations.length} total)`);
  
  // ✅ FIXED: Store cluster correlations separately, don't overwrite original
  // Store original correlations if not already stored
  if (!processedNetworkData.originalCorrelations) {
    processedNetworkData.originalCorrelations = processedNetworkData.correlations;
  }
  
  // Set cluster-specific correlations for edge creation
  processedNetworkData.clusterCorrelations = clusterCorrelations;
  processedNetworkData.correlations = clusterCorrelations; // For updateEdgePositions to use
  
  console.log('✅ Leiden clustering completed successfully');
  console.log(`   🎯 Generated ${clusters.length} clusters`);
  console.log(`   📊 Final data: ${processedNetworkData.nodes.length} genes, ${processedNetworkData.correlations.length} correlations`);

  return clusters;
}

/**
 * Pre-filter genes for large networks (keep most connected)
 */
function preFilterGenes(
  data: ProcessedNetworkData,
  maxGenes: number
): ProcessedNetworkData {
  
  // Calculate connectivity for each gene
  const geneConnectivity = new Map<string, number>();
  data.nodes.forEach(gene => {
    geneConnectivity.set(gene, 0);
  });
  
  data.correlations.forEach(corr => {
    const weight = Math.abs(corr.correlation);
    if (weight > 0.1) { // Only count significant correlations
      const count1 = geneConnectivity.get(corr.gene1) || 0;
      const count2 = geneConnectivity.get(corr.gene2) || 0;
      geneConnectivity.set(corr.gene1, count1 + weight);
      geneConnectivity.set(corr.gene2, count2 + weight);
    }
  });
  
  // Sort genes by connectivity and keep top N
  const sortedGenes = Array.from(geneConnectivity.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxGenes)
    .map(([gene]) => gene);
  
  const geneSet = new Set(sortedGenes);
  
  // Filter correlations to only include selected genes
  const filteredCorrelations = data.correlations.filter(corr =>
    geneSet.has(corr.gene1) && geneSet.has(corr.gene2)
  );
  
  console.log(`   📊 Filtered: ${sortedGenes.length} genes, ${filteredCorrelations.length} correlations`);
  
  // ✅ DEBUG: Show what genes were kept vs filtered out
  console.log(`   📊 Sample filtered genes:`, sortedGenes.slice(0, 10));
  console.log(`   📊 Sample filtered correlations:`, filteredCorrelations.slice(0, 3));
  
  return {
    nodes: sortedGenes,
    correlations: filteredCorrelations
  };
}

/**
 * Toggle cluster visualization visibility
 */
export function toggleLeidenVisualization(
  scene: THREE.Scene,
  visible: boolean
): void {
  const clusterViz = scene.getObjectByName('leidenClusterVisualization');
  if (clusterViz) {
    clusterViz.visible = visible;
    console.log(`🎨 Leiden cluster visualization ${visible ? 'shown' : 'hidden'}`);
  }
}

/**
 * Remove Leiden cluster visualization
 */
export function removeLeidenVisualization(scene: THREE.Scene): void {
  const existing = scene.getObjectByName('leidenClusterVisualization');
  if (existing) {
    scene.remove(existing);
    
    // Dispose of materials and geometries
    existing.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child.geometry) {
        child.geometry.dispose();
      }
    });
  }
}

// ================================================================================================
// 🆕 NEW FORCE-DIRECTED APPROACH WITH SPHERICAL CAPS
// ================================================================================================

/**
 * Interface for spherical cap definition
 */
interface SphericalCap {
  id: number;
  center: THREE.Vector3;
  height: number;
  radius: number;
  area: number;
  geneCount: number;
}

/**
 * 🆕 NEW: Allocate spherical caps based on cluster sizes
 * This replaces positionClustersOnSphere() for the force-directed approach
 */
function allocateSphericalCaps(
  clusters: LeidenCluster[],
  sphereRadius: number
): Map<number, SphericalCap> {
  
  console.log('🏔️ ALLOCATING SPHERICAL CAPS:');
  console.log(`   - Clusters to allocate: ${clusters.length}`);
  console.log(`   - Sphere radius: ${sphereRadius}`);
  
  const sphericalCaps = new Map<number, SphericalCap>();
  
  // Calculate total genes across all clusters
  const totalGenes = clusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0);
  console.log(`   - Total genes: ${totalGenes}`);
  
  // Calculate total sphere surface area
  const totalSphereArea = 4 * Math.PI * sphereRadius * sphereRadius;
  console.log(`   - Total sphere area: ${totalSphereArea.toFixed(2)}`);
  
  // Sort clusters by size (largest first) for better allocation
  const sortedClusters = [...clusters].sort((a, b) => b.nodes.length - a.nodes.length);
  
  // Use golden spiral to distribute cap centers
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  
  sortedClusters.forEach((cluster, index) => {
    // Calculate area fraction for this cluster
    const areaFraction = cluster.nodes.length / totalGenes;
    const allocatedArea = totalSphereArea * areaFraction;
    
    // Calculate cap height from area: Area = 2πR*h, so h = Area/(2πR)
    const capHeight = allocatedArea / (2 * Math.PI * sphereRadius);
    
    // Position cap center using golden spiral
    const y = 1 - (2 * index) / (sortedClusters.length - 1); // y from 1 to -1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    
    const capCenter = new THREE.Vector3(
      Math.cos(theta) * radiusAtY,
      y,
      Math.sin(theta) * radiusAtY
    ).multiplyScalar(sphereRadius);
    
    const cap: SphericalCap = {
      id: cluster.id,
      center: capCenter,
      height: capHeight,
      radius: sphereRadius,
      area: allocatedArea,
      geneCount: cluster.nodes.length
    };
    
    sphericalCaps.set(cluster.id, cap);
    
    console.log(`   📍 Cluster ${cluster.id}:`);
    console.log(`      - Genes: ${cluster.nodes.length} (${(areaFraction * 100).toFixed(1)}%)`);
    console.log(`      - Area: ${allocatedArea.toFixed(2)} (${(areaFraction * 100).toFixed(1)}% of sphere)`);
    console.log(`      - Cap height: ${capHeight.toFixed(2)}`);
    console.log(`      - Center: (${capCenter.x.toFixed(2)}, ${capCenter.y.toFixed(2)}, ${capCenter.z.toFixed(2)})`);
  });
  
  console.log(`\n✅ Allocated ${sphericalCaps.size} spherical caps`);
  return sphericalCaps;
}

/**
 * 🆕 NEW: Check if a point is within a spherical cap
 */
function isPointInSphericalCap(point: THREE.Vector3, cap: SphericalCap): boolean {
  // Normalize point to sphere surface
  const pointOnSphere = point.clone().normalize().multiplyScalar(cap.radius);
  
  // Calculate distance from cap center along sphere surface
  const dotProduct = pointOnSphere.dot(cap.center.clone().normalize());
  const angleFromCenter = Math.acos(Math.max(-1, Math.min(1, dotProduct / cap.radius)));
  
  // Calculate maximum angle for this cap
  const maxAngle = Math.acos(1 - cap.height / cap.radius);
  
  return angleFromCenter <= maxAngle;
}

/**
 * 🆕 NEW: Constrain a position to stay within a spherical cap
 */
function constrainToSphericalCap(position: THREE.Vector3, cap: SphericalCap): THREE.Vector3 {
  // Project to sphere surface first
  const onSphere = position.clone().normalize().multiplyScalar(cap.radius);
  
  // Check if already in cap
  if (isPointInSphericalCap(onSphere, cap)) {
    return onSphere;
  }
  
  // If outside cap, project to cap boundary
  const capCenterNormalized = cap.center.clone().normalize();
  const maxAngle = Math.acos(1 - cap.height / cap.radius);
  
  // Calculate direction from cap center to point
  const pointDirection = onSphere.clone().normalize();
  
  // Find the closest point on the cap boundary
  const cross = capCenterNormalized.clone().cross(pointDirection).normalize();
  const boundaryDirection = capCenterNormalized.clone()
    .multiplyScalar(Math.cos(maxAngle))
    .add(cross.cross(capCenterNormalized).multiplyScalar(Math.sin(maxAngle)));
  
  return boundaryDirection.multiplyScalar(cap.radius);
}

/**
 * 🆕 NEW: Calculate forces between genes based on correlations
 */
function calculateCorrelationForces(
  geneId: string,
  genePositions: Map<string, THREE.Vector3>,
  correlations: Array<{gene1: string, gene2: string, correlation: number}>,
  cap: SphericalCap
): THREE.Vector3 {
  
  const currentPos = genePositions.get(geneId);
  if (!currentPos) return new THREE.Vector3(0, 0, 0);
  
  const totalForce = new THREE.Vector3(0, 0, 0);
  
  // 🆕 STRONG repulsion forces between ALL genes to spread them out naturally
  genePositions.forEach((otherPos, otherId) => {
    if (otherId === geneId) return;
    
    const distance = currentPos.distanceTo(otherPos);
    if (distance === 0) return;
    
    const direction = currentPos.clone().sub(otherPos).normalize();
    
    // Strong repulsion force to spread genes throughout the cap
    const minDistance = 2.5; // Minimum distance between genes
    if (distance < minDistance) {
      const repulsionStrength = 6.0 * (minDistance - distance) / minDistance;
      const repulsionForce = direction.multiplyScalar(repulsionStrength);
      totalForce.add(repulsionForce);
    }
  });
  
  // 🆕 NATURAL SPACE-FILLING: Push genes toward less crowded areas
  const capCenterNormalized = cap.center.clone().normalize();
  const capCenterWorld = capCenterNormalized.multiplyScalar(cap.radius);
  const distanceFromCapCenter = currentPos.distanceTo(capCenterWorld);
  const maxCapRadius = cap.height * 0.85; // Use 85% of cap height
  
  // Encourage spreading outward if too clustered near center
  if (distanceFromCapCenter < maxCapRadius * 0.4) {
    const directionFromCenter = currentPos.clone().sub(capCenterWorld).normalize();
    const spreadForce = directionFromCenter.multiplyScalar(1.0); // Gentle outward push
    totalForce.add(spreadForce);
  }
  
  // 🆕 DENSITY-BASED SPREADING: Move away from high-density areas
  let localDensity = 0;
  const densityRadius = 4.0;
  
  genePositions.forEach((otherPos, otherId) => {
    if (otherId === geneId) return;
    const distance = currentPos.distanceTo(otherPos);
    if (distance < densityRadius) {
      localDensity += (densityRadius - distance) / densityRadius;
    }
  });
  
  // If in high-density area, add force toward less dense areas
  if (localDensity > 1.5) {
    const densityAvoidanceForce = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(localDensity * 0.8);
    totalForce.add(densityAvoidanceForce);
  }
  
  // Weak correlation-based attraction (secondary to space-filling)
  const relevantCorrelations = correlations.filter(corr => 
    corr.gene1 === geneId || corr.gene2 === geneId
  );
  
  relevantCorrelations.forEach(corr => {
    const otherId = corr.gene1 === geneId ? corr.gene2 : corr.gene1;
    const otherPos = genePositions.get(otherId);
    
    if (!otherPos) return;
    
    const distance = currentPos.distanceTo(otherPos);
    if (distance === 0) return;
    
    const direction = otherPos.clone().sub(currentPos).normalize();
    const correlation = Math.abs(corr.correlation);
    
    // Very weak attraction (don't interfere with natural spreading)
    const attractionStrength = correlation * 0.2; // Even weaker
    const idealCorrelationDistance = 3.5;
    
    if (distance > idealCorrelationDistance && correlation > 0.7) {
      const attractionForce = direction.multiplyScalar(attractionStrength * 0.05);
      totalForce.add(attractionForce);
    }
  });
  
  // Boundary constraint (prevent going outside cap)
  if (!isPointInSphericalCap(currentPos, cap)) {
    const constrainedPos = constrainToSphericalCap(currentPos, cap);
    const constraintForce = constrainedPos.clone().sub(currentPos).multiplyScalar(4.0);
    totalForce.add(constraintForce);
  }
  
  return totalForce;
}

/**
 * 🆕 NEW: Simulate force-directed layout within a spherical cap
 */
function simulateForceDirectedInCap(
  cluster: LeidenCluster,
  correlations: Array<{gene1: string, gene2: string, correlation: number}>,
  cap: SphericalCap,
  maxIterations: number = 150 // Increased iterations for better spreading
): Map<string, THREE.Vector3> {
  
  console.log(`🔬 FORCE SIMULATION for cluster ${cluster.id}:`);
  console.log(`   - Genes: ${cluster.nodes.length}`);
  console.log(`   - Cap height: ${cap.height.toFixed(2)}`);
  console.log(`   - Target: Fill entire allocated area`);
  console.log(`   - Iterations: ${maxIterations}`);
  
  // 🆕 IMPROVED: Strategic initial distribution to fill the entire cap
  const genePositions = new Map<string, THREE.Vector3>();
  
  cluster.nodes.forEach((geneId, index) => {
    // Use layered spherical distribution to fill the entire cap volume
    const layer = Math.floor(index / 8); // 8 genes per layer
    const indexInLayer = index % 8;
    
    // Layer radius (from center to edge of cap)
    const layerRadius = (cap.height * 0.8) * Math.sqrt((layer + 1) / Math.ceil(cluster.nodes.length / 8));
    
    // Angular position within layer
    const theta = (indexInLayer / 8) * 2 * Math.PI;
    const phi = Math.acos(1 - 2 * Math.random()); // Random polar angle
    
    // Convert to Cartesian coordinates
    const x = layerRadius * Math.sin(phi) * Math.cos(theta);
    const y = layerRadius * Math.sin(phi) * Math.sin(theta);
    const z = layerRadius * Math.cos(phi);
    
    const localPos = new THREE.Vector3(x, y, z);
    const worldPos = cap.center.clone().add(localPos);
    const constrainedPos = constrainToSphericalCap(worldPos, cap);
    
    genePositions.set(geneId, constrainedPos);
  });
  
  // Run force simulation with emphasis on space-filling
  const velocities = new Map<string, THREE.Vector3>();
  
  // Initialize velocities
  cluster.nodes.forEach(geneId => {
    velocities.set(geneId, new THREE.Vector3(0, 0, 0));
  });
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Adaptive parameters - start with strong space-filling, then stabilize
    const dampening = 0.92 - (iteration / maxIterations) * 0.15; // 0.92 -> 0.77
    const forceMultiplier = 0.08 - (iteration / maxIterations) * 0.05; // 0.08 -> 0.03
    
    cluster.nodes.forEach(geneId => {
      const force = calculateCorrelationForces(geneId, genePositions, correlations, cap);
      const currentVel = velocities.get(geneId) || new THREE.Vector3(0, 0, 0);
      
      // Update velocity with force and adaptive dampening
      const newVel = currentVel.multiplyScalar(dampening).add(force.multiplyScalar(forceMultiplier));
      velocities.set(geneId, newVel);
      
      // Update position
      const currentPos = genePositions.get(geneId)!;
      const newPos = currentPos.clone().add(newVel);
      
      // Always constrain to cap
      const constrainedPos = constrainToSphericalCap(newPos, cap);
      genePositions.set(geneId, constrainedPos);
    });
    
    // Log progress every 30 iterations
    if (iteration % 30 === 0) {
      console.log(`   - Iteration ${iteration}/${maxIterations} - spreading genes`);
    }
  }
  
  console.log(`   ✅ Simulation complete - genes distributed throughout allocated area`);
  return genePositions;
}

/**
 * 🆕 NEW: Apply force-directed layout within allocated spherical caps
 * This replaces positionGenesInClusters() for the force-directed approach
 */
function applyForceDirectedWithinCaps(
  clusters: LeidenCluster[],
  correlations: Array<{gene1: string, gene2: string, correlation: number}>,
  sphericalCaps: Map<number, SphericalCap>,
  sphereRadius: number
): { [geneId: string]: THREE.Vector3 } {
  
  console.log('🚀 APPLYING FORCE-DIRECTED WITHIN CAPS:');
  console.log(`   - Clusters: ${clusters.length}`);
  console.log(`   - Total correlations: ${correlations.length}`);
  
  const allGenePositions: { [geneId: string]: THREE.Vector3 } = {};
  
  clusters.forEach((cluster, index) => {
    console.log(`\n🎯 Processing cluster ${cluster.id} (${index + 1}/${clusters.length})`);
    
    const cap = sphericalCaps.get(cluster.id);
    if (!cap) {
      console.error(`❌ No cap found for cluster ${cluster.id}`);
      return;
    }
    
    // Filter correlations to only include genes in this cluster
    const clusterGenes = new Set(cluster.nodes);
    const clusterCorrelations = correlations.filter(corr => 
      clusterGenes.has(corr.gene1) && clusterGenes.has(corr.gene2)
    );
    
    console.log(`   - Cluster correlations: ${clusterCorrelations.length}`);
    
    if (cluster.nodes.length === 1) {
      // Single gene - place at cap center
      allGenePositions[cluster.nodes[0]] = cap.center.clone();
      console.log(`   - Single gene positioned at cap center`);
    } else {
      // Multiple genes - run force simulation
      const genePositions = simulateForceDirectedInCap(cluster, clusterCorrelations, cap);
      
      // Add to overall positions
      genePositions.forEach((position, geneId) => {
        allGenePositions[geneId] = position;
      });
      
      console.log(`   - ${genePositions.size} genes positioned via force simulation`);
    }
  });
  
  console.log(`\n✅ Force-directed positioning complete: ${Object.keys(allGenePositions).length} genes positioned`);
  return allGenePositions;
}

/**
 * 🆕 NEW: Main function using force-directed approach with spherical caps
 * Alternative to applyLeidenClusterLayout() - keeps old function intact
 */
export async function applyLeidenClusterLayoutWithForces(
  processedNetworkData: ProcessedNetworkData,
  nodesRef: React.MutableRefObject<Map<string, any>>,
  sceneRef: React.MutableRefObject<THREE.Scene | null>,
  options: {
    correlationThreshold?: number;
    resolution?: number;
    radius?: number;
    maxGenes?: number;
    updateEdgesCallback?: () => void;
  } = {},
  clusterMeshesRef?: React.MutableRefObject<any[]>,
  labelsRef?: React.MutableRefObject<any[]>
): Promise<LeidenCluster[]> {
  
  // Extract options with defaults
  const {
    correlationThreshold = 0.1,
    resolution = 1.0,
    radius = 30,
    maxGenes = 5000,
    updateEdgesCallback
  } = options;

  console.log('🚀 LEIDEN CLUSTERING + FORCE-DIRECTED LAYOUT');
  console.log(`📊 Input: ${processedNetworkData.nodes.length} genes`);
  console.log(`🎚️ Correlation threshold: ${correlationThreshold}`);
  console.log(`🔧 Resolution parameter: ${resolution}`);
  console.log(`🆕 Using NEW force-directed approach with spherical caps`);
  
  const startTime = performance.now();
  
  // Step 1: Run Leiden clustering (same as before)
  console.log('\n🧠 Step 1: Leiden community detection...');
  const clusters = await detectCommunitiesWithLeiden(
    processedNetworkData,
    correlationThreshold,
    resolution
  );
  
  // ✅ FALLBACK: If no clusters found, create artificial clusters
  let finalClusters = clusters;
  if (clusters.length === 0) {
    console.log('⚠️ No clusters found by Leiden - creating fallback clusters...');
    finalClusters = createFallbackClusters(processedNetworkData.nodes);
    console.log(`✅ Created ${finalClusters.length} fallback clusters`);
  }
  
  // 🆕 Step 2: Allocate spherical caps based on cluster sizes
  console.log('\n🏔️ Step 2: Allocating spherical caps...');
  const sphericalCaps = allocateSphericalCaps(finalClusters, radius);
  
  // 🆕 Step 3: Apply force-directed layout within each cap
  console.log('\n🚀 Step 3: Force-directed positioning within caps...');
  const nodePositions = applyForceDirectedWithinCaps(
    finalClusters, 
    processedNetworkData.correlations, 
    sphericalCaps, 
    radius
  );
  
  // Step 4: Apply to Three.js scene (same as before)
  console.log('\n🎨 Step 4: Applying to 3D scene...');
  console.log(`   🔍 Clusters: ${finalClusters.length}`);
  console.log(`   🔍 NodePositions: ${Object.keys(nodePositions).length}`);
  console.log(`   🔍 Scene available: ${!!sceneRef.current}`);
  console.log(`   🔍 InstancedMesh: Not used in force-directed layout`);
  
  applyPositionsToThreeJS(finalClusters, nodePositions, nodesRef, updateEdgesCallback, undefined, sceneRef.current, clusterMeshesRef, labelsRef);
  
  // Step 5: Add cluster visualization (same as before)
  if (sceneRef.current) {
    addLeidenClusterVisualization(sceneRef.current, finalClusters, nodePositions, nodesRef);
  }
  
  const totalTime = performance.now() - startTime;
  console.log(`\n✅ FORCE-DIRECTED LEIDEN LAYOUT COMPLETE in ${totalTime.toFixed(1)}ms`);
  console.log(`🏘️ Created ${finalClusters.length} clusters with ${Object.keys(nodePositions).length} positioned genes`);
  console.log(`🆕 Used spherical caps + force-directed approach`);
  
  return finalClusters;
}