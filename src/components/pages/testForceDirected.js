/**
 * 🆕 TEST FILE: How to use the new force-directed approach
 * 
 * This shows how to switch between the old and new clustering approaches
 * Copy this code into your existing functions when ready to test!
 */

import { 
  applyLeidenClusterLayoutOptimized,     // 🔰 OLD: Golden spiral approach
  applyLeidenClusterLayoutWithForces    // 🆕 NEW: Force-directed with spherical caps
} from './leidenThreeJSIntegration';

/**
 * Example of how to switch between approaches
 */
export const testBothApproaches = async (processedNetworkData, nodesRef, sceneRef) => {
  
  // 🔰 OLD APPROACH: Golden spiral positioning
  console.log("🔰 Testing OLD approach (golden spiral)...");
  const oldClusters = await applyLeidenClusterLayoutOptimized(
    processedNetworkData,
    nodesRef,
    sceneRef,
    0.1,    // correlationThreshold
    1.0,    // resolution
    35,     // radius
    null,   // updateEdgesCallback
    null,   // instancedMeshRef
    null    // clusterMeshesRef
  );
  
  console.log(`🔰 OLD: Created ${oldClusters.length} clusters`);
  
  // Wait a moment, then clear scene
  setTimeout(async () => {
    // Clear existing visualization
    if (sceneRef.current) {
      const existing = sceneRef.current.getObjectByName('leidenClusterVisualization');
      if (existing) {
        sceneRef.current.remove(existing);
      }
    }
    
    // 🆕 NEW APPROACH: Force-directed with spherical caps
    console.log("🆕 Testing NEW approach (force-directed + spherical caps)...");
    const newClusters = await applyLeidenClusterLayoutWithForces(
      processedNetworkData,
      nodesRef,
      sceneRef,
      0.1,    // correlationThreshold
      1.0,    // resolution
      35,     // radius
      null,   // updateEdgesCallback
      null,   // instancedMeshRef
      null    // clusterMeshesRef
    );
    
    console.log(`🆕 NEW: Created ${newClusters.length} clusters`);
    
    // Compare results
    console.log("\n📊 COMPARISON:");
    console.log(`   🔰 Old clusters: ${oldClusters.length}`);
    console.log(`   🆕 New clusters: ${newClusters.length}`);
    console.log(`   🔄 Same clustering: ${oldClusters.length === newClusters.length ? '✅ Yes' : '❌ No'}`);
    
  }, 3000); // 3 second delay to see the difference
};

/**
 * Simple function to use ONLY the new approach
 */
export const useNewApproachOnly = async (processedNetworkData, nodesRef, sceneRef) => {
  console.log("🚀 Using NEW force-directed approach...");
  
  const clusters = await applyLeidenClusterLayoutWithForces(
    processedNetworkData,
    nodesRef,
    sceneRef,
    0.1,    // correlationThreshold
    1.0,    // resolution
    35,     // radius
    null,   // updateEdgesCallback
    null,   // instancedMeshRef
    null    // clusterMeshesRef
  );
  
  console.log(`✅ NEW approach complete: ${clusters.length} clusters`);
  return clusters;
};

/**
 * How to add this to your existing code:
 * 
 * 1. In NetworkVisualizationPage.jsx, add this import:
 *    import { applyLeidenClusterLayoutWithForces } from './leidenThreeJSIntegration';
 * 
 * 2. Replace any call to applyLeidenClusterLayoutOptimized with:
 *    const clusters = await applyLeidenClusterLayoutWithForces(
 *      processedNetworkData,
 *      nodesRef,
 *      sceneRef,
 *      correlationThreshold,
 *      resolution,
 *      radius,
 *      updateEdgesCallback,
 *      instancedMeshRef,
 *      clusterMeshesRef
 *    );
 * 
 * 3. To test both approaches, add a button:
 *    <button onClick={() => testBothApproaches(processedNetworkData, nodesRef, sceneRef)}>
 *      🆚 Compare Old vs New
 *    </button>
 */ 