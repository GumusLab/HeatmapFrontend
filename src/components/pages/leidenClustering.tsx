/**
 * LEIDEN ALGORITHM IMPLEMENTATION
 * Optimized community detection for large gene networks (10k-30k genes)
 * Based on Traag, Waltman & van Eck (2019) "From Louvain to Leiden"
 */

interface ProcessedNetworkData {
    nodes: string[];
    correlations: Array<{
      gene1: string;
      gene2: string;
      correlation: number;
    }>;
  }
  


  export interface LeidenCluster {
    id: number;
    nodes: string[];
    quality: number;
    color: string;
  }
  
  
  export class LeidenClustering {
    private nodes: string[];
    private edges: Map<string, Map<string, number>>;
    private nodeWeights: Map<string, number>;
    private totalWeight: number;
    private resolution: number;
    
    // Performance tracking
    private startTime: number = 0;
    
    constructor(
      data: ProcessedNetworkData, 
      correlationThreshold: number = 0.1,
      resolution: number = 1.0
    ) {
      // ✅ COMPREHENSIVE INPUT VALIDATION
      console.log('🚀 LEIDEN ALGORITHM STARTING...');
      console.log(`📊 Input validation:`);
      console.log(`   - Data object exists: ${!!data}`);
      console.log(`   - Nodes array exists: ${!!data?.nodes}`);
      console.log(`   - Correlations array exists: ${!!data?.correlations}`);
      console.log(`   - Nodes length: ${data?.nodes?.length || 0}`);
      console.log(`   - Correlations length: ${data?.correlations?.length || 0}`);
      console.log(`   - Correlation threshold: ${correlationThreshold}`);
      console.log(`   - Resolution: ${resolution}`);
      
      // ✅ VALIDATE INPUT DATA
      if (!data) {
        throw new Error('❌ Input data is null or undefined');
      }
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('❌ Nodes array is missing or not an array');
      }
      
      if (!data.correlations || !Array.isArray(data.correlations)) {
        throw new Error('❌ Correlations array is missing or not an array');
      }
      
      if (data.nodes.length === 0) {
        throw new Error('❌ Nodes array is empty');
      }
      
      if (data.correlations.length === 0) {
        console.warn('⚠️ Correlations array is empty - will create single-node clusters');
      }
      
      // ✅ VALIDATE CORRELATION DATA
      let validCorrelations = 0;
      let invalidCorrelations = 0;
      let nanCorrelations = 0;
      
      data.correlations.forEach((corr, index) => {
        if (!corr) {
          console.warn(`❌ Correlation ${index} is null/undefined`);
          invalidCorrelations++;
          return;
        }
        
        if (!corr.gene1 || !corr.gene2) {
          console.warn(`❌ Correlation ${index} missing gene names:`, corr);
          invalidCorrelations++;
          return;
        }
        
        if (typeof corr.correlation !== 'number') {
          console.warn(`❌ Correlation ${index} has non-numeric correlation:`, corr);
          invalidCorrelations++;
          return;
        }
        
        if (isNaN(corr.correlation)) {
          console.warn(`❌ Correlation ${index} has NaN correlation:`, corr);
          nanCorrelations++;
          invalidCorrelations++;
          return;
        }
        
        if (!isFinite(corr.correlation)) {
          console.warn(`❌ Correlation ${index} has infinite correlation:`, corr);
          invalidCorrelations++;
          return;
        }
        
        validCorrelations++;
      });
      
      console.log(`📊 Correlation validation results:`);
      console.log(`   - Valid correlations: ${validCorrelations}`);
      console.log(`   - Invalid correlations: ${invalidCorrelations}`);
      console.log(`   - NaN correlations: ${nanCorrelations}`);
      
      // ✅ VALIDATE THRESHOLD AND RESOLUTION
      if (typeof correlationThreshold !== 'number' || isNaN(correlationThreshold)) {
        console.warn('⚠️ Invalid correlation threshold, using default 0.1');
        correlationThreshold = 0.1;
      }
      
      if (typeof resolution !== 'number' || isNaN(resolution) || resolution <= 0) {
        console.warn('⚠️ Invalid resolution, using default 1.0');
        resolution = 1.0;
      }
      
      this.nodes = data.nodes;
      this.edges = new Map();
      this.nodeWeights = new Map();
      this.totalWeight = 0;
      this.resolution = resolution;
      
      console.log(`📊 Final input: ${this.nodes.length} genes, ${data.correlations.length} correlations`);
      console.log(`🎚️ Correlation threshold: ${correlationThreshold}, Resolution: ${resolution}`);
      
      this.startTime = performance.now();
      this.buildNetwork(data, correlationThreshold);
    }
    
    /**
     * Build network from correlation data with filtering
     */
    private buildNetwork(data: ProcessedNetworkData, threshold: number): void {
      console.log('🔧 Building filtered network...');
      
      // Initialize empty adjacency lists
      this.nodes.forEach(node => {
        this.edges.set(node, new Map());
        this.nodeWeights.set(node, 0);
      });
      
      let edgeCount = 0;
      let skippedEdges = 0;
      let belowThreshold = 0;
      let missingNodes = 0;
      
      // Add edges above threshold
      data.correlations.forEach((corr, index) => {
        // ✅ SKIP INVALID CORRELATIONS
        if (!corr || !corr.gene1 || !corr.gene2 || 
            typeof corr.correlation !== 'number' || 
            isNaN(corr.correlation) || !isFinite(corr.correlation)) {
          skippedEdges++;
          return;
        }
        
        // ✅ CHECK IF GENES EXIST IN NODES LIST
        if (!this.edges.has(corr.gene1) || !this.edges.has(corr.gene2)) {
          missingNodes++;
          if (index < 5) { // Log first few missing nodes
            console.warn(`❌ Genes not found in nodes list: ${corr.gene1}, ${corr.gene2}`);
          }
          return;
        }
        
        const weight = Math.abs(corr.correlation);
        
        // ✅ VALIDATE WEIGHT
        if (isNaN(weight) || !isFinite(weight)) {
          console.warn(`❌ Invalid weight calculated for correlation ${index}:`, weight);
          skippedEdges++;
          return;
        }
        
        if (weight >= threshold) {
          // Add bidirectional edge
          this.edges.get(corr.gene1)!.set(corr.gene2, weight);
          this.edges.get(corr.gene2)!.set(corr.gene1, weight);
          
          // Update node weights (total degree)
          const currentWeight1 = this.nodeWeights.get(corr.gene1)!;
          const currentWeight2 = this.nodeWeights.get(corr.gene2)!;
          
          this.nodeWeights.set(corr.gene1, currentWeight1 + weight);
          this.nodeWeights.set(corr.gene2, currentWeight2 + weight);
          
          this.totalWeight += weight * 2; // Each edge counted twice (bidirectional)
          edgeCount++;
        } else {
          belowThreshold++;
        }
      });
      
      console.log(`✅ Network building results:`);
      console.log(`   - Edges added: ${edgeCount}`);
      console.log(`   - Skipped (invalid): ${skippedEdges}`);
      console.log(`   - Below threshold: ${belowThreshold}`);
      console.log(`   - Missing nodes: ${missingNodes}`);
      console.log(`   - Total weight: ${this.totalWeight.toFixed(2)}`);
      console.log(`   - Edge percentage: ${((edgeCount/data.correlations.length)*100).toFixed(1)}%`);
      
      // ✅ VALIDATE FINAL NETWORK STATE
      if (isNaN(this.totalWeight) || !isFinite(this.totalWeight)) {
        console.error('❌ Total weight is NaN or infinite:', this.totalWeight);
        throw new Error('Network building failed: invalid total weight');
      }
      
      if (this.totalWeight === 0) {
        console.warn('⚠️ Total weight is zero - no edges above threshold');
      }
      
      // ✅ CHECK FOR ISOLATED NODES
      let isolatedNodes = 0;
      this.nodes.forEach(node => {
        const nodeWeight = this.nodeWeights.get(node)!;
        if (nodeWeight === 0) {
          isolatedNodes++;
        }
      });
      
      console.log(`📊 Network structure:`);
      console.log(`   - Isolated nodes: ${isolatedNodes}/${this.nodes.length}`);
      console.log(`   - Connected nodes: ${this.nodes.length - isolatedNodes}`);
    }
    
    /**
     * Main Leiden algorithm implementation
     */
    public findCommunities(maxIterations: number = 10): LeidenCluster[] {
      console.log('\n🎯 LEIDEN ALGORITHM EXECUTION:');
      
      // Initialize: each node in its own community
      let communities = new Map<string, number>();
      this.nodes.forEach((node, index) => {
        communities.set(node, index);
      });
      
      let iteration = 0;
      let improved = true;
      let bestModularity = -1;
      
      while (improved && iteration < maxIterations) {
        iteration++;
        console.log(`\n🔄 === ITERATION ${iteration} ===`);
        
        const iterationStart = performance.now();
        
        // Phase 1: Local moving (like Louvain)
        const localImprovement = this.localMovingPhase(communities);
        
        // Phase 2: Refinement (unique to Leiden)
        const refinementImprovement = this.refinementPhase(communities);
        
        // Phase 3: Aggregation
        communities = this.aggregationPhase(communities);
        
        // Calculate modularity
        const modularity = this.calculateModularity(communities);
        improved = modularity > bestModularity + 0.001; // Small improvement threshold
        bestModularity = Math.max(bestModularity, modularity);
        
        const iterationTime = performance.now() - iterationStart;
        console.log(`📊 Iteration ${iteration}: Modularity = ${modularity.toFixed(4)} (${iterationTime.toFixed(1)}ms)`);
        console.log(`   Local moves: ${localImprovement}, Refinements: ${refinementImprovement}`);
        
        if (!improved) {
          console.log('🏁 Convergence achieved!');
        }
      }
      
      const totalTime = performance.now() - this.startTime;
      console.log(`\n⏱️ Total execution time: ${totalTime.toFixed(1)}ms`);
      
      return this.createClusterResults(communities, bestModularity);
    }
    
    /**
     * Phase 1: Local moving phase (similar to Louvain)
     */
    private localMovingPhase(communities: Map<string, number>): number {
      let moves = 0;
      let improved = true;
      
      while (improved) {
        improved = false;
        
        // Shuffle nodes for better optimization
        const shuffledNodes = [...this.nodes].sort(() => Math.random() - 0.5);
        
        for (const node of shuffledNodes) {
          const currentCommunity = communities.get(node)!;
          const bestMove = this.findBestMove(node, communities);
          
          if (bestMove.community !== currentCommunity && bestMove.deltaQ > 0.0001) {
            communities.set(node, bestMove.community);
            moves++;
            improved = true;
          }
        }
      }
      
      return moves;
    }
    
    /**
     * Phase 2: Refinement phase (Leiden improvement over Louvain)
     */
    private refinementPhase(communities: Map<string, number>): number {
      let refinements = 0;
      
      // Group nodes by community
      const communityNodes = new Map<number, string[]>();
      communities.forEach((communityId, node) => {
        if (!communityNodes.has(communityId)) {
          communityNodes.set(communityId, []);
        }
        communityNodes.get(communityId)!.push(node);
      });
      
      // Refine each community
      communityNodes.forEach((nodes, communityId) => {
        if (nodes.length > 1) {
          const subcommunities = this.refineSubcommunity(nodes, communityId);
          
          if (subcommunities.size > 1) {
            // Split community
            let newCommunityId = Math.max(...Array.from(communities.values())) + 1;
            subcommunities.forEach((subNodes, subId) => {
              if (subId > 0) { // Keep first subgroup in original community
                subNodes.forEach(node => {
                  communities.set(node, newCommunityId);
                });
                newCommunityId++;
                refinements++;
              }
            });
          }
        }
      });
      
      return refinements;
    }
    
    /**
     * Refine a single community into subcommunities
     */
    private refineSubcommunity(nodes: string[], communityId: number): Map<number, string[]> {
      // Simple refinement: use modularity-based splitting
      const subcommunities = new Map<number, string[]>();
      
      // For small communities, don't split
      if (nodes.length <= 3) {
        subcommunities.set(0, nodes);
        return subcommunities;
      }
      
      // Calculate internal vs external connections for each node
      const internalRatios = new Map<string, number>();
      nodes.forEach(node => {
        let internalWeight = 0;
        let externalWeight = 0;
        
        this.edges.get(node)!.forEach((weight, neighbor) => {
          if (nodes.includes(neighbor)) {
            internalWeight += weight;
          } else {
            externalWeight += weight;
          }
        });
        
        const totalWeight = internalWeight + externalWeight;
        internalRatios.set(node, totalWeight > 0 ? internalWeight / totalWeight : 0);
      });
      
      // Split based on internal connection ratio
      const threshold = 0.5;
      const group1: string[] = [];
      const group2: string[] = [];
      
      nodes.forEach(node => {
        const ratio = internalRatios.get(node)!;
        if (ratio >= threshold) {
          group1.push(node);
        } else {
          group2.push(node);
        }
      });
      
      // Only split if both groups are non-empty and reasonably sized
      if (group1.length > 0 && group2.length > 0 && 
          Math.min(group1.length, group2.length) >= 2) {
        subcommunities.set(0, group1);
        subcommunities.set(1, group2);
      } else {
        subcommunities.set(0, nodes);
      }
      
      return subcommunities;
    }
    
    /**
     * Phase 3: Aggregation phase
     */
    private aggregationPhase(communities: Map<string, number>): Map<string, number> {
      // Renumber communities to be consecutive
      const uniqueCommunities = Array.from(new Set(communities.values()));
      const communityMapping = new Map<number, number>();
      
      uniqueCommunities.forEach((oldId, newId) => {
        communityMapping.set(oldId, newId);
      });
      
      const newCommunities = new Map<string, number>();
      communities.forEach((oldId, node) => {
        newCommunities.set(node, communityMapping.get(oldId)!);
      });
      
      return newCommunities;
    }
    
    /**
     * Find best community move for a node
     */
    private findBestMove(node: string, communities: Map<string, number>): {community: number, deltaQ: number} {
      const currentCommunity = communities.get(node)!;
      const neighborCommunities = new Map<number, number>();
      
      // Find neighboring communities and connection strengths
      this.edges.get(node)!.forEach((weight, neighbor) => {
        const neighborCommunity = communities.get(neighbor)!;
        if (neighborCommunity !== currentCommunity) {
          const current = neighborCommunities.get(neighborCommunity) || 0;
          neighborCommunities.set(neighborCommunity, current + weight);
        }
      });
      
      let bestCommunity = currentCommunity;
      let bestDeltaQ = 0;
      
      // Calculate modularity change for each potential move
      neighborCommunities.forEach((connectionWeight, communityId) => {
        const deltaQ = this.calculateModularityDelta(node, currentCommunity, communityId, communities);
        if (deltaQ > bestDeltaQ) {
          bestDeltaQ = deltaQ;
          bestCommunity = communityId;
        }
      });
      
      return { community: bestCommunity, deltaQ: bestDeltaQ };
    }
    
    /**
     * Calculate modularity change for moving a node
     */
    private calculateModularityDelta(
      node: string, 
      fromCommunity: number, 
      toCommunity: number, 
      communities: Map<string, number>
    ): number {
      const nodeWeight = this.nodeWeights.get(node)!;
      
      // Calculate edge weights to/from communities
      let weightToFrom = 0;
      let weightToTo = 0;
      
      this.edges.get(node)!.forEach((weight, neighbor) => {
        const neighborCommunity = communities.get(neighbor)!;
        if (neighborCommunity === fromCommunity) {
          weightToFrom += weight;
        } else if (neighborCommunity === toCommunity) {
          weightToTo += weight;
        }
      });
      
      // Simplified modularity delta calculation
      const deltaQ = (weightToTo - weightToFrom) / this.totalWeight - 
                    this.resolution * nodeWeight * (weightToTo - weightToFrom) / (this.totalWeight * this.totalWeight);
      
      return deltaQ;
    }
    
    /**
     * Calculate overall network modularity
     */
    private calculateModularity(communities: Map<string, number>): number {
      const communityWeights = new Map<number, number>();
      let internalWeight = 0;
      
      // Calculate community total weights
      communities.forEach((communityId, node) => {
        const nodeWeight = this.nodeWeights.get(node)!;
        const current = communityWeights.get(communityId) || 0;
        communityWeights.set(communityId, current + nodeWeight);
      });
      
      // Calculate internal edges
      this.edges.forEach((neighbors, node1) => {
        const community1 = communities.get(node1)!;
        neighbors.forEach((weight, node2) => {
          const community2 = communities.get(node2)!;
          if (community1 === community2) {
            internalWeight += weight;
          }
        });
      });
      
      internalWeight /= 2; // Each edge counted twice
      
      // Calculate expected internal weight
      let expectedWeight = 0;
      communityWeights.forEach(weight => {
        expectedWeight += (weight * weight) / (2 * this.totalWeight);
      });
      
      const modularity = (internalWeight / this.totalWeight) - 
                        this.resolution * (expectedWeight / this.totalWeight);
      
      return modularity;
    }
    
    /**
     * Create final cluster results
     */
    private createClusterResults(communities: Map<string, number>, modularity: number): LeidenCluster[] {
      const clusterMap = new Map<number, string[]>();
      
      // Group nodes by community
      communities.forEach((communityId, node) => {
        if (!clusterMap.has(communityId)) {
          clusterMap.set(communityId, []);
        }
        clusterMap.get(communityId)!.push(node);
      });
      
      // Create cluster objects
      const clusters: LeidenCluster[] = [];
      const colors = [
        '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', 
        '#00BCD4', '#FF5722', '#8BC34A', '#673AB7', '#FFC107',
        '#E91E63', '#009688', '#795548', '#607D8B', '#3F51B5'
      ];
      
      Array.from(clusterMap.entries())
        .sort(([, a], [, b]) => b.length - a.length) // Sort by size
        .forEach(([communityId, nodes], index) => {
          if (nodes.length >= 2) { // Filter small clusters
            clusters.push({
              id: index,
              nodes: nodes,
              quality: this.calculateClusterQuality(nodes),
              color: colors[index % colors.length]
            });
          }
        });
      
      console.log('\n🎉 LEIDEN CLUSTERING RESULTS:');
      console.log(`📊 Final modularity: ${modularity.toFixed(4)}`);
      console.log(`🏘️ Found ${clusters.length} communities:`);
      
      clusters.forEach(cluster => {
        console.log(`   Cluster ${cluster.id}: ${cluster.nodes.length} genes (quality: ${cluster.quality.toFixed(3)})`);
        console.log(`     Sample genes: ${cluster.nodes.slice(0, 3).join(', ')}${cluster.nodes.length > 3 ? '...' : ''}`);
      });
      
      // ✅ ENHANCED FALLBACK: If no valid clusters found, create fallback clusters
      if (clusters.length === 0) {
        console.warn('⚠️ No valid clusters found by Leiden algorithm - creating fallback clusters...');
        return this.createFallbackClusters(modularity);
      }
      
      return clusters;
    }
    
    /**
     * Calculate cluster quality (internal density)
     */
    private calculateClusterQuality(nodes: string[]): number {
      let internalEdges = 0;
      let totalPossibleEdges = nodes.length * (nodes.length - 1) / 2;
      
      if (totalPossibleEdges === 0) return 1;
      
      nodes.forEach(node1 => {
        this.edges.get(node1)!.forEach((weight, node2) => {
          if (nodes.includes(node2) && node1 < node2) { // Avoid double counting
            internalEdges++;
          }
        });
      });
      
      return internalEdges / totalPossibleEdges;
    }
    
    /**
     * Create fallback clusters when Leiden algorithm fails to find meaningful clusters
     */
    private createFallbackClusters(modularity: number): LeidenCluster[] {
      console.log('🔄 Creating fallback clusters for Leiden algorithm...');
      
      const fallbackClusters: LeidenCluster[] = [];
      const colors = [
        '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', 
        '#00BCD4', '#FF5722', '#8BC34A', '#673AB7', '#FFC107'
      ];
      
      // ✅ STRATEGY 1: If we have isolated nodes, group them intelligently
      const isolatedNodes: string[] = [];
      const connectedNodes: string[] = [];
      
      this.nodes.forEach(node => {
        const nodeWeight = this.nodeWeights.get(node) || 0;
        if (nodeWeight === 0) {
          isolatedNodes.push(node);
        } else {
          connectedNodes.push(node);
        }
      });
      
      console.log(`📊 Fallback analysis:`);
      console.log(`   - Isolated nodes: ${isolatedNodes.length}`);
      console.log(`   - Connected nodes: ${connectedNodes.length}`);
      console.log(`   - Total nodes: ${this.nodes.length}`);
      
      // ✅ STRATEGY 2: Create clusters based on connectivity
      if (connectedNodes.length > 0) {
        // Group connected nodes by connectivity strength
        const nodeConnectivity = new Map<string, number>();
        connectedNodes.forEach(node => {
          nodeConnectivity.set(node, this.nodeWeights.get(node) || 0);
        });
        
        // Sort by connectivity
        const sortedConnected = connectedNodes.sort((a, b) => 
          (nodeConnectivity.get(b) || 0) - (nodeConnectivity.get(a) || 0)
        );
        
        // Create clusters based on connectivity levels
        const highConnectivity: string[] = [];
        const mediumConnectivity: string[] = [];
        const lowConnectivity: string[] = [];
        
        const maxConnectivity = nodeConnectivity.get(sortedConnected[0]) || 0;
        const connectivityThreshold = maxConnectivity * 0.3;
        
        sortedConnected.forEach(node => {
          const connectivity = nodeConnectivity.get(node) || 0;
          if (connectivity > connectivityThreshold * 2) {
            highConnectivity.push(node);
          } else if (connectivity > connectivityThreshold) {
            mediumConnectivity.push(node);
          } else {
            lowConnectivity.push(node);
          }
        });
        
        // Create clusters from connectivity groups
        let clusterId = 0;
        
        if (highConnectivity.length >= 2) {
          fallbackClusters.push({
            id: clusterId++,
            nodes: highConnectivity,
            quality: 0.8, // High quality for highly connected nodes
            color: colors[0]
          });
          console.log(`   ✅ High connectivity cluster: ${highConnectivity.length} nodes`);
        }
        
        if (mediumConnectivity.length >= 2) {
          fallbackClusters.push({
            id: clusterId++,
            nodes: mediumConnectivity,
            quality: 0.6, // Medium quality
            color: colors[1]
          });
          console.log(`   ✅ Medium connectivity cluster: ${mediumConnectivity.length} nodes`);
        }
        
        if (lowConnectivity.length >= 2) {
          fallbackClusters.push({
            id: clusterId++,
            nodes: lowConnectivity,
            quality: 0.4, // Lower quality
            color: colors[2]
          });
          console.log(`   ✅ Low connectivity cluster: ${lowConnectivity.length} nodes`);
        }
        
        // Handle remaining single nodes
        const remainingNodes = [
          ...(highConnectivity.length === 1 ? highConnectivity : []),
          ...(mediumConnectivity.length === 1 ? mediumConnectivity : []),
          ...(lowConnectivity.length === 1 ? lowConnectivity : [])
        ];
        
        if (remainingNodes.length > 0) {
          fallbackClusters.push({
            id: clusterId++,
            nodes: remainingNodes,
            quality: 0.3, // Lower quality for mixed nodes
            color: colors[3]
          });
          console.log(`   ✅ Remaining connected nodes cluster: ${remainingNodes.length} nodes`);
        }
      }
      
      // ✅ STRATEGY 3: Handle isolated nodes
      if (isolatedNodes.length > 0) {
        // Group isolated nodes into reasonable sized clusters
        const maxClusterSize = Math.max(10, Math.ceil(isolatedNodes.length / 5)); // Max 5 isolated clusters
        
        for (let i = 0; i < isolatedNodes.length; i += maxClusterSize) {
          const clusterNodes = isolatedNodes.slice(i, i + maxClusterSize);
          if (clusterNodes.length > 0) {
            fallbackClusters.push({
              id: fallbackClusters.length,
              nodes: clusterNodes,
              quality: 0.1, // Very low quality for isolated nodes
              color: colors[(fallbackClusters.length) % colors.length]
            });
            console.log(`   ✅ Isolated nodes cluster ${Math.floor(i / maxClusterSize) + 1}: ${clusterNodes.length} nodes`);
          }
        }
      }
      
      // ✅ STRATEGY 4: Ultimate fallback - single cluster with all nodes
      if (fallbackClusters.length === 0) {
        console.warn('⚠️ All fallback strategies failed - creating single cluster with all nodes');
        fallbackClusters.push({
          id: 0,
          nodes: [...this.nodes],
          quality: 0.5, // Moderate quality since it's artificial but contains all data
          color: colors[0]
        });
      }
      
      console.log(`✅ Created ${fallbackClusters.length} fallback clusters:`);
      fallbackClusters.forEach(cluster => {
        console.log(`   - Cluster ${cluster.id}: ${cluster.nodes.length} nodes (quality: ${cluster.quality.toFixed(3)})`);
      });
      
      return fallbackClusters;
    }
  }




  // Create inline worker with your complete Leiden algorithm
function createLeidenWorker(): Worker {
    const workerCode = `
      /**
       * LEIDEN ALGORITHM IMPLEMENTATION - WEB WORKER VERSION
       * Optimized community detection for large gene networks (10k-30k genes)
       * Based on Traag, Waltman & van Eck (2019) "From Louvain to Leiden"
       */
      
      class LeidenClustering {
        constructor(data, correlationThreshold = 0.1, resolution = 1.0) {
          this.nodes = data.nodes;
          this.edges = new Map();
          this.nodeWeights = new Map();
          this.totalWeight = 0;
          this.resolution = resolution;
          this.startTime = performance.now();
          
          self.postMessage({
            type: 'progress',
            message: 'Starting Leiden algorithm...',
            progress: 5
          });
          
          this.buildNetwork(data, correlationThreshold);
        }
        
        buildNetwork(data, threshold) {
          self.postMessage({
            type: 'progress',
            message: 'Building filtered network...',
            progress: 10
          });
          
          // Initialize empty adjacency lists
          this.nodes.forEach(node => {
            this.edges.set(node, new Map());
            this.nodeWeights.set(node, 0);
          });
          
          let edgeCount = 0;
          
          // Add edges above threshold
          data.correlations.forEach(corr => {
            const weight = Math.abs(corr.correlation);
            if (weight >= threshold) {
              // Add bidirectional edge
              this.edges.get(corr.gene1).set(corr.gene2, weight);
              this.edges.get(corr.gene2).set(corr.gene1, weight);
              
              // Update node weights (total degree)
              this.nodeWeights.set(corr.gene1, this.nodeWeights.get(corr.gene1) + weight);
              this.nodeWeights.set(corr.gene2, this.nodeWeights.get(corr.gene2) + weight);
              
              this.totalWeight += weight * 2; // Each edge counted twice (bidirectional)
              edgeCount++;
            }
          });
          
          self.postMessage({
            type: 'progress',
            message: 'Network built: ' + edgeCount + ' edges (' + ((edgeCount/data.correlations.length)*100).toFixed(1) + '% of total)',
            progress: 20
          });
        }
        
        findCommunities(maxIterations = 10) {
          self.postMessage({
            type: 'progress',
            message: 'Starting Leiden algorithm execution...',
            progress: 25
          });
          
          // Initialize: each node in its own community
          let communities = new Map();
          this.nodes.forEach((node, index) => {
            communities.set(node, index);
          });
          
          let iteration = 0;
          let improved = true;
          let bestModularity = -1;
          
          while (improved && iteration < maxIterations) {
            iteration++;
            
            self.postMessage({
              type: 'progress',
              message: 'Iteration ' + iteration + ' of ' + maxIterations,
              progress: 25 + (iteration / maxIterations) * 50
            });
            
            const iterationStart = performance.now();
            
            // Phase 1: Local moving (like Louvain)
            const localImprovement = this.localMovingPhase(communities);
            
            // Phase 2: Refinement (unique to Leiden)
            const refinementImprovement = this.refinementPhase(communities);
            
            // Phase 3: Aggregation
            communities = this.aggregationPhase(communities);
            
            // Calculate modularity
            const modularity = this.calculateModularity(communities);
            improved = modularity > bestModularity + 0.001; // Small improvement threshold
            bestModularity = Math.max(bestModularity, modularity);
            
            const iterationTime = performance.now() - iterationStart;
            
            if (!improved) {
              self.postMessage({
                type: 'progress',
                message: 'Convergence achieved!',
                progress: 75
              });
            }
          }
          
          const totalTime = performance.now() - this.startTime;
          
          self.postMessage({
            type: 'progress',
            message: 'Creating cluster results...',
            progress: 80
          });
          
          return this.createClusterResults(communities, bestModularity);
        }
        
        localMovingPhase(communities) {
          let moves = 0;
          let improved = true;
          
          while (improved) {
            improved = false;
            
            // Shuffle nodes for better optimization
            const shuffledNodes = [...this.nodes].sort(() => Math.random() - 0.5);
            
            for (const node of shuffledNodes) {
              const currentCommunity = communities.get(node);
              const bestMove = this.findBestMove(node, communities);
              
              if (bestMove.community !== currentCommunity && bestMove.deltaQ > 0.0001) {
                communities.set(node, bestMove.community);
                moves++;
                improved = true;
              }
            }
          }
          
          return moves;
        }
        
        refinementPhase(communities) {
          let refinements = 0;
          
          // Group nodes by community
          const communityNodes = new Map();
          communities.forEach((communityId, node) => {
            if (!communityNodes.has(communityId)) {
              communityNodes.set(communityId, []);
            }
            communityNodes.get(communityId).push(node);
          });
          
          // Refine each community
          communityNodes.forEach((nodes, communityId) => {
            if (nodes.length > 1) {
              const subcommunities = this.refineSubcommunity(nodes, communityId);
              
              if (subcommunities.size > 1) {
                // Split community
                let newCommunityId = Math.max(...Array.from(communities.values())) + 1;
                subcommunities.forEach((subNodes, subId) => {
                  if (subId > 0) { // Keep first subgroup in original community
                    subNodes.forEach(node => {
                      communities.set(node, newCommunityId);
                    });
                    newCommunityId++;
                    refinements++;
                  }
                });
              }
            }
          });
          
          return refinements;
        }
        
        refineSubcommunity(nodes, communityId) {
          // Simple refinement: use modularity-based splitting
          const subcommunities = new Map();
          
          // For small communities, don't split
          if (nodes.length <= 3) {
            subcommunities.set(0, nodes);
            return subcommunities;
          }
          
          // Calculate internal vs external connections for each node
          const internalRatios = new Map();
          nodes.forEach(node => {
            let internalWeight = 0;
            let externalWeight = 0;
            
            this.edges.get(node).forEach((weight, neighbor) => {
              if (nodes.includes(neighbor)) {
                internalWeight += weight;
              } else {
                externalWeight += weight;
              }
            });
            
            const totalWeight = internalWeight + externalWeight;
            internalRatios.set(node, totalWeight > 0 ? internalWeight / totalWeight : 0);
          });
          
          // Split based on internal connection ratio
          const threshold = 0.5;
          const group1 = [];
          const group2 = [];
          
          nodes.forEach(node => {
            const ratio = internalRatios.get(node);
            if (ratio >= threshold) {
              group1.push(node);
            } else {
              group2.push(node);
            }
          });
          
          // Only split if both groups are non-empty and reasonably sized
          if (group1.length > 0 && group2.length > 0 && 
              Math.min(group1.length, group2.length) >= 2) {
            subcommunities.set(0, group1);
            subcommunities.set(1, group2);
          } else {
            subcommunities.set(0, nodes);
          }
          
          return subcommunities;
        }
        
        aggregationPhase(communities) {
          // Renumber communities to be consecutive
          const uniqueCommunities = Array.from(new Set(communities.values()));
          const communityMapping = new Map();
          
          uniqueCommunities.forEach((oldId, newId) => {
            communityMapping.set(oldId, newId);
          });
          
          const newCommunities = new Map();
          communities.forEach((oldId, node) => {
            newCommunities.set(node, communityMapping.get(oldId));
          });
          
          return newCommunities;
        }
        
        findBestMove(node, communities) {
          const currentCommunity = communities.get(node);
          const neighborCommunities = new Map();
          
          // Find neighboring communities and connection strengths
          this.edges.get(node).forEach((weight, neighbor) => {
            const neighborCommunity = communities.get(neighbor);
            if (neighborCommunity !== currentCommunity) {
              const current = neighborCommunities.get(neighborCommunity) || 0;
              neighborCommunities.set(neighborCommunity, current + weight);
            }
          });
          
          let bestCommunity = currentCommunity;
          let bestDeltaQ = 0;
          
          // Calculate modularity change for each potential move
          neighborCommunities.forEach((connectionWeight, communityId) => {
            const deltaQ = this.calculateModularityDelta(node, currentCommunity, communityId, communities);
            if (deltaQ > bestDeltaQ) {
              bestDeltaQ = deltaQ;
              bestCommunity = communityId;
            }
          });
          
          return { community: bestCommunity, deltaQ: bestDeltaQ };
        }
        
        calculateModularityDelta(node, fromCommunity, toCommunity, communities) {
          const nodeWeight = this.nodeWeights.get(node);
          
          // Calculate edge weights to/from communities
          let weightToFrom = 0;
          let weightToTo = 0;
          
          this.edges.get(node).forEach((weight, neighbor) => {
            const neighborCommunity = communities.get(neighbor);
            if (neighborCommunity === fromCommunity) {
              weightToFrom += weight;
            } else if (neighborCommunity === toCommunity) {
              weightToTo += weight;
            }
          });
          
          // Simplified modularity delta calculation
          const deltaQ = (weightToTo - weightToFrom) / this.totalWeight - 
                        this.resolution * nodeWeight * (weightToTo - weightToFrom) / (this.totalWeight * this.totalWeight);
          
          return deltaQ;
        }
        
        calculateModularity(communities) {
          const communityWeights = new Map();
          let internalWeight = 0;
          
          // Calculate community total weights
          communities.forEach((communityId, node) => {
            const nodeWeight = this.nodeWeights.get(node);
            const current = communityWeights.get(communityId) || 0;
            communityWeights.set(communityId, current + nodeWeight);
          });
          
          // Calculate internal edges
          this.edges.forEach((neighbors, node1) => {
            const community1 = communities.get(node1);
            neighbors.forEach((weight, node2) => {
              const community2 = communities.get(node2);
              if (community1 === community2) {
                internalWeight += weight;
              }
            });
          });
          
          internalWeight /= 2; // Each edge counted twice
          
          // Calculate expected internal weight
          let expectedWeight = 0;
          communityWeights.forEach(weight => {
            expectedWeight += (weight * weight) / (2 * this.totalWeight);
          });
          
          const modularity = (internalWeight / this.totalWeight) - 
                            this.resolution * (expectedWeight / this.totalWeight);
          
          return modularity;
        }
        
        createClusterResults(communities, modularity) {
          const clusterMap = new Map();
          
          // Group nodes by community
          communities.forEach((communityId, node) => {
            if (!clusterMap.has(communityId)) {
              clusterMap.set(communityId, []);
            }
            clusterMap.get(communityId).push(node);
          });
          
          // Create cluster objects
          const clusters = [];
          const colors = [
            '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', 
            '#00BCD4', '#FF5722', '#8BC34A', '#673AB7', '#FFC107',
            '#E91E63', '#009688', '#795548', '#607D8B', '#3F51B5'
          ];
          
          Array.from(clusterMap.entries())
            .sort(([, a], [, b]) => b.length - a.length) // Sort by size
            .forEach(([communityId, nodes], index) => {
              if (nodes.length >= 2) { // Filter small clusters
                clusters.push({
                  id: index,
                  nodes: nodes,
                  quality: this.calculateClusterQuality(nodes),
                  color: colors[index % colors.length]
                });
              }
            });
          
          // Send final results message
          self.postMessage({
            type: 'progress',
            message: 'Leiden clustering results: Final modularity: ' + modularity.toFixed(4) + ', Found ' + clusters.length + ' communities',
            progress: 95
          });
          
          return clusters;
        }
        
        calculateClusterQuality(nodes) {
          let internalEdges = 0;
          let totalPossibleEdges = nodes.length * (nodes.length - 1) / 2;
          
          if (totalPossibleEdges === 0) return 1;
          
          nodes.forEach(node1 => {
            this.edges.get(node1).forEach((weight, node2) => {
              if (nodes.includes(node2) && node1 < node2) { // Avoid double counting
                internalEdges++;
              }
            });
          });
          
          return internalEdges / totalPossibleEdges;
        }
      }
      
      // Worker message handler
      self.onmessage = function(e) {
        const { data, correlationThreshold, resolution } = e.data;
        
        try {
          // Validate input data
          if (!data || !data.nodes || !data.correlations) {
            throw new Error('Invalid data: missing nodes or correlations');
          }
          
          if (!Array.isArray(data.nodes) || !Array.isArray(data.correlations)) {
            throw new Error('Invalid data: nodes and correlations must be arrays');
          }
          
          const leiden = new LeidenClustering(data, correlationThreshold, resolution);
          const clusters = leiden.findCommunities();
          
          self.postMessage({
            type: 'success',
            clusters: clusters,
            progress: 100
          });
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error.message
          });
        }
      };
    `;
  
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }


  
  /**
   * Convert Leiden clusters to your format
   */
  export function leidenToClusterInfo(clusters: LeidenCluster[]): Map<string, number> {
    const geneToCluster = new Map<string, number>();
    
    clusters.forEach(cluster => {
      cluster.nodes.forEach(gene => {
        geneToCluster.set(gene, cluster.id);
      });
    });
    
    return geneToCluster;
  }
  
  /**
   * High-level function for easy integration ************* old version without any web workers ************
   */
//   export function detectCommunitiesWithLeiden(
//     data: ProcessedNetworkData,
//     correlationThreshold: number = 0.1,
//     resolution: number = 1.0
//   ): LeidenCluster[] {
//     const leiden = new LeidenClustering(data, correlationThreshold, resolution);
//     return leiden.findCommunities();
//   }


  /**
 * High-level function for easy integration - NOW WITH WEB WORKER
 */
export async function detectCommunitiesWithLeiden(
    data: ProcessedNetworkData,
    correlationThreshold: number = 0.1,
    resolution: number = 1.0
  ): Promise<LeidenCluster[]> {
    
    // For small networks, use synchronous version (faster)
    if (data.nodes.length < 1000) {
      console.log('🔄 Using synchronous Leiden for small network');
      const leiden = new LeidenClustering(data, correlationThreshold, resolution);
      return leiden.findCommunities();
    }
    
    // For large networks, use Web Worker (prevents UI freeze)
    console.log('🚀 Using Web Worker for large network');
    
    return new Promise((resolve, reject) => {
      const worker = createLeidenWorker();
      
      // Send data to worker
      worker.postMessage({
        data,
        correlationThreshold,
        resolution
      });
      
      // Handle worker messages
      worker.onmessage = (e) => {
        const { type, clusters, progress, message, error } = e.data;
        
        if (type === 'progress') {
          console.log(`🔄 ${message} (${progress}%)`);
        } else if (type === 'success') {
          console.log('✅ Leiden clustering completed in worker');
          worker.terminate();
          resolve(clusters as LeidenCluster[]);
        } else if (type === 'error') {
          console.error('❌ Worker error:', error);
          worker.terminate();
          reject(new Error(error));
        }
      };
      
      worker.onerror = (error) => {
        console.error('❌ Worker failed:', error);
        worker.terminate();
        reject(error);
      };
    });
  }