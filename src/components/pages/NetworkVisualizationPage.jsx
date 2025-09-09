/**
 * NETWORK VISUALIZATION WITH TWO DATA SOURCES:
 * 
 * 1. GLOBAL 3D VIEW: Uses processedNetworkData.global3DPositions.correlation_edges
 *    - Backend-generated with strict filtering (may have 0 edges for large networks)
 *    - Used by create3DNetworkOptimized() and createFilteredEdges()
 * 
 * 2. CLUSTER DETAIL VIEW: Uses processedNetworkData.correlations  
 *    - Same data as 2D network (unfiltered, good correlation data)
 *    - Used by updateEdgePositions() and Leiden clustering
 *    - Gets filtered by Leiden to only cluster-specific edges
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, ControlsContainer, FullScreenControl, ZoomControl, useSigma } from "@react-sigma/core";
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import { GraphSearch } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';
import "@react-sigma/core/lib/style.css";
import { getCorrelationNetwork } from '../../backendApi/heatmapData';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { MiniMap } from '@react-sigma/minimap';
import * as THREE from 'three';
// ✅ ADD THESE THREE IMPORTS
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Paper, Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree'; // A fitting icon for nodes
import CircularProgress from '@mui/material/CircularProgress';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceZ } from 'd3-force-3d';
// ✅ NEW: Import WebGL context manager
import { SigmaContainerWithCleanup, ThreeJSContainerWithCleanup, WebGLContextInterceptor } from '../WebGLContextManager';
import SlowLayoutControl from '../SlowLayoutControl';
import { 
  applyClusteredSphereLayout,
  addClusterVisualization,
  createClusteredSphereLayout
} from './networkHemisphereLayout';

import { 
  applyLeidenClusterLayout,
  applyLeidenClusterLayoutOptimized,
  applyLeidenClusterLayoutWithForces,
  toggleLeidenVisualization,
  removeLeidenVisualization
} from './leidenThreeJSIntegration';


const sigmaStyle = { height: "700px", width: "100%", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor:'white'};
const MIN_EDGE_SIZE = 0.2; // Decreased from 0.5
const MAX_EDGE_SIZE = 1;   // Decreased from 2

// ✅ NEW: Network Legend Component for better interpretation
const NetworkLegend = ({ processedNetworkData }) => {
  if (!processedNetworkData) return null;
  
  const { nodeCount, edgeCount, clusterName } = processedNetworkData;
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
        🔗 Network Overview
      </h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Cluster:</strong> {clusterName}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Genes:</strong> {nodeCount}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Correlations:</strong> {edgeCount}
      </div>
      
      <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#555' }}>Node Colors:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#1976D2', borderRadius: '50%' }}></div>
            <span>High connectivity (&gt;10)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#42A5F5', borderRadius: '50%' }}></div>
            <span>Medium connectivity (5-10)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#90CAF9', borderRadius: '50%' }}></div>
            <span>Low connectivity (&lt;5)</span>
          </div>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#555' }}>Edge Colors:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#2E7D32' }}></div>
            <span>Strong positive (&gt;0.7)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#66BB6A' }}></div>
            <span>Positive (0.3-0.7)</span>
          </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#808080' }}></div>
              <span>Weak (-0.3 to 0.3)</span>
            </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#EF5350' }}></div>
            <span>Negative (-0.7 to -0.3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#C62828' }}></div>
            <span>Strong negative (&lt;-0.7)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ NEW: Network Legend Component for 2D view positioned below controls
const NetworkLegend2D = ({ processedNetworkData }) => {
  if (!processedNetworkData) return null;
  
  const { nodeCount, edgeCount, clusterName } = processedNetworkData;
  
  return (
    <div style={{
      position: 'absolute',
      top: '200px', // Position below the network control panel
      left: '15px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
        🔗 Network Overview
      </h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Cluster:</strong> {clusterName}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Genes:</strong> {nodeCount}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Correlations:</strong> {edgeCount}
      </div>
      
      <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#555' }}>Node Colors:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#1976D2', borderRadius: '50%' }}></div>
            <span>High connectivity (&gt;10)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#42A5F5', borderRadius: '50%' }}></div>
            <span>Medium connectivity (5-10)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#90CAF9', borderRadius: '50%' }}></div>
            <span>Low connectivity (&lt;5)</span>
          </div>
        </div>
      </div>
      
      {/* <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#555' }}>Edge Colors:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#2E7D32' }}></div>
            <span>Strong positive (&gt;0.7)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#66BB6A' }}></div>
            <span>Positive (0.3-0.7)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#808080' }}></div>
            <span>Weak (-0.3 to 0.3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#EF5350' }}></div>
            <span>Negative (-0.7 to -0.3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '2px', backgroundColor: '#C62828' }}></div>
            <span>Strong negative (&lt;-0.7)</span>
          </div>
        </div>
      </div> */}
    </div>
  );
};

// const ThreeJSNetwork = ({ networkData, onNetworkSuccess, onNetworkError, onDataFetchError, showLabels, onLayoutChange, is3DLayout, selectedNode, focusNode }) 
const ThreeJSNetwork = ({ processedNetworkData, showLabels, onLayoutChange, is3DLayout, selectedNode, focusNode, onApplyLeidenClustering, triggerLeidenClustering}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const nodesRef = useRef(new Map());
  const edgesRef = useRef([]);
  const instancedMeshRef = useRef(null);
  const labelsRef = useRef([]);
  const animationIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ NEW: View state management
  const [currentView, setCurrentView] = useState('global'); // 'global' or 'cluster'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [show3DLabels, setShow3DLabels] = useState(true);

  // ✅ Search state for autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Add ref for cluster view meshes
  const clusterMeshesRef = useRef([]);
  
  // ✅ Flag to trigger Leiden clustering after scene initialization
  const [triggerLeidenAfterInit, setTriggerLeidenAfterInit] = useState(false);

  // ✅ Expose applyLeidenClustering function to parent component
  useEffect(() => {
    if (onApplyLeidenClustering) {
      onApplyLeidenClustering(applyLeidenClustering);
    }
  }, [onApplyLeidenClustering]);
  
  // ✅ Watch for trigger to set flag for Leiden clustering after scene init
  useEffect(() => {
    console.log('🔍 DEBUG: triggerLeidenClustering changed to:', triggerLeidenClustering);
    if (triggerLeidenClustering > 0) {
      console.log('🔥 Setting triggerLeidenAfterInit = true');
      setTriggerLeidenAfterInit(true);
    } else if (triggerLeidenClustering === 0) {
      console.log('🔄 Resetting triggerLeidenAfterInit to false');
      setTriggerLeidenAfterInit(false);
    }
  }, [triggerLeidenClustering]);

  // ✅ Handle search and autocomplete
const handleSearch = (value) => {
  setSearchTerm(value);
  
  if (value.length > 0) {
    // Find matching nodes
    const matchingNodes = Array.from(nodesRef.current.keys())
      .filter(nodeId => nodeId.toLowerCase().includes(value.toLowerCase()))
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 results
    
    setSearchResults(matchingNodes);
    setShowDropdown(matchingNodes.length > 0);
    
    // Auto-focus on first match if only typing (not selecting)
    if (matchingNodes.length > 0) {
      focusOnNode(matchingNodes[0]);
    }
  } else {
    setSearchResults([]);
    setShowDropdown(false);
  }
};

async function layout3D(nodeArray, correlations) {
  // Initialize nodes with random 3D positions
  const nodes = nodeArray.map(id => ({
    id,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
    z: (Math.random() - 0.5) * 200
  }));

  // Build link objects for D3, filtered by threshold
  const links = correlations
    .filter(c => Math.abs(c.correlation) > 0.8)
    .map(c => ({ source: c.gene1, target: c.gene2 }));

  // Create the simulation with 3D forces
  const sim = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-30))
    .force('link', forceLink(links).id(d => d.id).distance(50))
    .force('center', forceCenter(0, 0, 0))
    .force('z', forceZ().strength(0.1))
    .stop();

  // Warm up the simulation (ticks)
  for (let i = 0; i < 300; ++i) sim.tick();

  // Build map of positions
  const positionMap = new Map();
  nodes.forEach(d => {
    positionMap.set(d.id, new THREE.Vector3(d.x, d.y, d.z));
  });
  return positionMap;
}

const focusOnNode = (nodeId) => {
  const nodeData = nodesRef.current.get(nodeId);
  if (nodeData && nodeData.mesh) {
    const nodePosition = nodeData.mesh.position;
    const distance = 20;
    const offset = new THREE.Vector3(distance, distance, distance);
    const cameraTarget = nodePosition.clone().add(offset);
    animateCamera3D(cameraTarget, nodePosition);
    highlightNode3D(nodeId);
  }
};

const selectNode = (nodeId) => {
  setSearchTerm(nodeId);
  setShowDropdown(false);
  focusOnNode(nodeId);
  console.log('🎯 Selected node from dropdown:', nodeId);
};

// --- Cleanup function for React useEffect return (no instanceMatrix.dispose calls) ---
const cleanupThree = ({ scene, renderer, mountEl, handleResize, animationId }) => {
  console.log('Cleaning up Three.js resources.');
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', handleResize);
  if (mountEl && renderer.domElement) mountEl.removeChild(renderer.domElement);

  scene.traverse(obj => {
    if (obj.isMesh || obj.isLineSegments) {
      obj.geometry?.dispose();
      Array.isArray(obj.material)
        ? obj.material.forEach(m => m.dispose())
        : obj.material?.dispose();
    }
  });
  renderer.dispose();
  console.log('Three.js disposed.');
};


  useEffect(() => {

    if (!processedNetworkData || !mountRef.current) return;

    // If 3D positions are still loading or there was an error, show loading/error

    // Check if 3D is disabled vs still loading - but don't return early if disabled
    if (is3DLayout && !processedNetworkData.global3DPositions) {
      const isDisabled = processedNetworkData?.global3DError?.includes('disabled');
      
      if (isDisabled) {
        console.log("ℹ️ 3D layout requested but global 3D coordinates are disabled on server. Will initialize scene for Leiden clustering.");
        // Continue with scene initialization for Leiden clustering
      } else {
        console.log("ℹ️ 3D layout requested but global 3D positions not available. Waiting for 3D coordinate generation...");
        setIsLoading(false);
        return; // Only return early if actually waiting for 3D data
      }
    }



    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('white'); 
    sceneRef.current = scene;
    
    // ✅ Check if we need to trigger Leiden clustering after scene initialization
    console.log('🔍 DEBUG: triggerLeidenAfterInit =', triggerLeidenAfterInit);
    if (triggerLeidenAfterInit) {
      setTriggerLeidenAfterInit(false); // Reset flag
      console.log('🎯 Scene ready! Triggering Leiden clustering...');
      setTimeout(async () => {
        console.log('🚀 About to call applyLeidenClustering...');
        await applyLeidenClustering();
      }, 100);
    }

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    console.log("Renderer initialized. Renderer DOM element:", renderer.domElement); // ADD THIS LINE
    console.log("Is renderer.domElement appended to mountRef?", mountRef.current.contains(renderer.domElement)); // ADD THIS LINE

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased ambient light intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased directional light intensity
    directionalLight.position.set(0, 0, 50); // Light from front
    scene.add(directionalLight);
    
    // --- ADDITION: Add a second directional light for better overall illumination ---
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0); // Slightly less intense
    directionalLight2.position.set(50, 50, -50); // Light from top-right-back
    scene.add(directionalLight2);
    // --- END ADDITION ---

    // Add orbit controls for mouse interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;


    const initializeNetwork = async () => {
      if (processedNetworkData) {
        // Check if global 3D positions are available
        if (processedNetworkData.global3DPositions) {
          try {
            console.log("🔍 Global3DPositions structure:", processedNetworkData.global3DPositions);
            await create3DNetworkOptimized(
              processedNetworkData,
              processedNetworkData.global3DPositions.coordinates, // Extract coordinates
              processedNetworkData.geneIds,
              sceneRef.current // Pass the scene
            );
            console.log('✅ 3D Network initialization complete');
          } catch (error) {
            console.error('❌ Failed to create 3D network:', error);
          }
        } else {
          // When 3D coordinates are disabled, just initialize empty scene for Leiden clustering
          console.log("ℹ️ 3D coordinates disabled - scene ready for Leiden clustering");
          // Directly trigger Leiden clustering after scene is ready
          console.log("🚀 Directly triggering Leiden clustering...");
          setTimeout(async () => {
            console.log("🎯 Calling applyLeidenClustering directly...");
            await applyLeidenClustering();
          }, 200);
        }
      }
    };
  
    // Call the async function
    initializeNetwork();
    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();


    // Handle resize
    const handleResize = () => {
      if (mountRef.current && camera && renderer) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

     return () => {
         cleanupThree({
          scene:   sceneRef.current,
          renderer: rendererRef.current,
         mountEl:  mountRef.current,
         handleResize,
         animationId: animationIdRef.current
        });
       };
  }, [processedNetworkData]);
  

  // Handle label visibility changes
  useEffect(() => {
    labelsRef.current.forEach(sprite => {
      sprite.visible = show3DLabels; // Uses local state
    });
  }, [show3DLabels]);

  // Handle 3D node focus/search
  useEffect(() => {
    const nodeToFocus = focusNode || selectedNode;
    if (nodeToFocus && nodesRef.current.has(nodeToFocus) && cameraRef.current && controlsRef.current) {
      const nodeData = nodesRef.current.get(nodeToFocus);
      if (nodeData && nodeData.mesh) {
        const nodePosition = nodeData.mesh.position;
        
        // Calculate camera position for good viewing angle
        const distance = 20; // Distance from the node
        const offset = new THREE.Vector3(distance, distance, distance);
        const cameraTarget = nodePosition.clone().add(offset);
        
        // Animate camera to focus on the node
        animateCamera3D(cameraTarget, nodePosition);
        
        // Temporarily highlight the node
        highlightNode3D(nodeToFocus);
        
        console.log('🎯 3D Focused on node:', nodeToFocus, 'at position:', nodePosition);
      }
    }
  }, [focusNode, selectedNode]);

  const animateCamera3D = (targetPosition, lookAtPosition) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    if (!camera || !controls) return;
    
    // Animate camera position
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    let startTime = null;
    const duration = 1000; // 1 second
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      
      // Interpolate look-at target
      controls.target.lerpVectors(startTarget, lookAtPosition, easeProgress);
      controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const highlightNode3D = (nodeId) => {
    const nodeData = nodesRef.current.get(nodeId);
    const instancedMesh = instancedMeshRef.current; // Get the InstancedMesh from the ref
  
    // --- CRITICAL: Check if nodeData and instancedMesh exist ---
    if (!nodeData || !instancedMesh || nodeData.instanceIndex === undefined) {
      console.warn(`Attempted to highlight non-existent node or missing instance data for: ${nodeId}`);
      return;
    }
  
    const instanceIndex = nodeData.instanceIndex;
  
    // Store original color and scale
    const originalColor = new THREE.Color();
    instancedMesh.getColorAt(instanceIndex, originalColor); // Get current instance color
  
    const tempMatrix = new THREE.Matrix4();
    instancedMesh.getMatrixAt(instanceIndex, tempMatrix); // Get current instance matrix
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const originalScale = new THREE.Vector3();
    tempMatrix.decompose(position, quaternion, originalScale); // Decompose to get original scale
  
    // Apply highlight color
    const highlightColor = new THREE.Color(0xFF5722); // Orange highlight
    instancedMesh.setColorAt(instanceIndex, highlightColor);
    instancedMesh.instanceColor.needsUpdate = true; // Tell Three.js to update colors on GPU
  
    // Apply highlight scale
    const scaledMatrix = new THREE.Matrix4();
    const newScale = originalScale.clone().multiplyScalar(1.5); // Increase size by 1.5
    scaledMatrix.compose(position, quaternion, newScale); // Recompose with new scale
    instancedMesh.setMatrixAt(instanceIndex, scaledMatrix);
    instancedMesh.instanceMatrix.needsUpdate = true; // Tell Three.js to update matrices on GPU
  
    // Reset after 2 seconds
    setTimeout(() => {
      if (instancedMesh && nodeData.instanceIndex !== undefined) { // Check again in case component unmounted
        // Revert color
        instancedMesh.setColorAt(instanceIndex, originalColor);
        instancedMesh.instanceColor.needsUpdate = true;
  
        // Revert scale
        const originalMatrix = new THREE.Matrix4();
        originalMatrix.compose(position, quaternion, originalScale);
        instancedMesh.setMatrixAt(instanceIndex, originalMatrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }, 2000);
    console.log(`Node ${nodeId} highlighted.`);
  };


   // Add these functions after highlightNode3D function (around line 180)

// const applyLeidenClustering = () => {
//   if (!processedNetworkData) return;
  
//   console.log('🧠 Applying Leiden clustering algorithm...');
  
//   // Remove any existing cluster visualization
//   const existingViz = sceneRef.current?.getObjectByName('leidenClusterVisualization');
//   if (existingViz) {
//     sceneRef.current?.remove(existingViz);
//   }
  
//   const clusters = applyLeidenClusterLayoutOptimized(
//     processedNetworkData,
//     nodesRef,
//     sceneRef,
//     {
//       correlationThreshold: 0.1,
//       resolution: 1.0,
//       radius: 35,
//       maxGenes: 5000,
//       updateEdgesCallback: updateEdgePositions  // ADD THIS
//     }
//   );
  
//   console.log(`✅ Leiden clustering complete: ${clusters.length} clusters created`);
// };

const applyLeidenClustering = async () => {  // Add async here
  if (!processedNetworkData) return;
  
  // Wait for scene to be available
  if (!sceneRef.current) {
    console.log('⏳ Scene not ready yet, waiting for initialization...');
    // Wait and retry
    setTimeout(async () => {
      await applyLeidenClustering();
    }, 500);
    return;
  }
  
  console.log('🧠 Applying Leiden clustering algorithm...');
  
  // Remove any existing cluster visualization
  const existingViz = sceneRef.current?.getObjectByName('leidenClusterVisualization');
  if (existingViz) {
    sceneRef.current?.remove(existingViz);
  }
  
  try {
    const clusters = await applyLeidenClusterLayoutWithForces(  // Using force version
      processedNetworkData,
      nodesRef,
      sceneRef,
      {
        correlationThreshold: 0.7,
        resolution: 1.0,
        radius: 35,
        maxGenes: 5000,
        updateEdgesCallback: updateEdgePositions
      },
      clusterMeshesRef,
      labelsRef
    );
    
    console.log(`✅ Leiden clustering complete: ${clusters.length} clusters created`);
  } catch (error) {
    console.error('❌ Clustering failed:', error);
  }
};

// ✅ NEW: View switching functions
const switchToClusterView = async () => {
  if (isTransitioning) return;
  
  setIsTransitioning(true);
  console.log('🔄 Switching to cluster detail view...');
  
  try {
    // ✅ STEP 1: Clear global view elements
    const scene = sceneRef.current;
    if (!scene) return;
    
    console.log('🧹 Clearing global view elements...');
    
    // Remove global instanced mesh
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      instancedMeshRef.current.material.dispose();
      instancedMeshRef.current = null;
      console.log('✅ Removed global instanced mesh');
    }
    
    // Remove global edges
    edgesRef.current.forEach(edge => {
      scene.remove(edge);
      if (edge.geometry) edge.geometry.dispose();
      if (edge.material) edge.material.dispose();
    });
    edgesRef.current = [];
    console.log('✅ Removed global edges');
    
    // Remove global labels
    labelsRef.current.forEach(label => {
      scene.remove(label);
      if (label.material && label.material.map) {
        label.material.map.dispose();
      }
      if (label.material) label.material.dispose();
    });
    labelsRef.current = [];
    console.log('✅ Removed global labels');
    
    // ✅ NEW: Additional cleanup - remove any remaining global-related objects
    const objectsToRemove = [];
    scene.traverse((child) => {
      // Remove any objects that might be global-related (but keep lights)
      if (child.name && (child.name.includes('MainNetwork') || child.name.includes('global'))) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    if (objectsToRemove.length > 0) {
      console.log(`✅ Removed ${objectsToRemove.length} additional global-related objects`);
    }
    
    // Clear node references (they'll be recreated by Leiden)
    nodesRef.current.clear();
    console.log('✅ Cleared node references');
    
    // ✅ STEP 2: Apply Leiden clustering for detailed view
    console.log('🔬 Applying Leiden clustering...');
    
    // ✅ IMPORTANT: Set view to cluster BEFORE calling Leiden (so updateEdgePositions works correctly)
    setCurrentView('cluster');
    
    const clusters = await applyLeidenClusterLayoutWithForces(
      processedNetworkData,
      nodesRef,
      sceneRef,
      {
        correlationThreshold: 0.1, // ✅ Reduced from 0.7 to be more permissive
        resolution: 1.0,
        radius: 35,
        maxGenes: 5000,
        updateEdgesCallback: () => updateEdgePositions('cluster'), // ✅ Pass explicit view
        instancedMeshRef: instancedMeshRef, // This will be null, Leiden will create individual meshes
        clusterMeshesRef: clusterMeshesRef // ✅ Pass cluster meshes ref for cleanup
      }
    );
    
    console.log('✅ Switched to cluster view');
  } catch (error) {
    console.error('❌ Failed to switch to cluster view:', error);
  } finally {
    setIsTransitioning(false);
  }
};

const switchToGlobalView = async () => {
  if (isTransitioning) return;
  
  setIsTransitioning(true);
  console.log('🔄 Switching back to global view...');
  
  try {
    // ✅ STEP 1: Clear cluster view elements
    const scene = sceneRef.current;
    if (!scene) return;
    
    console.log('🧹 Clearing cluster view elements...');
    
    // Remove cluster individual meshes
    clusterMeshesRef.current.forEach(mesh => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    clusterMeshesRef.current = [];
    console.log('✅ Removed cluster individual meshes');
    
    // Remove cluster edges
    edgesRef.current.forEach(edge => {
      scene.remove(edge);
      if (edge.geometry) edge.geometry.dispose();
      if (edge.material) edge.material.dispose();
    });
    edgesRef.current = [];
    console.log('✅ Removed cluster edges');
    
    // ✅ NEW: Remove cluster visualization (boundary spheres, labels, etc.)
    removeLeidenVisualization(scene);
    console.log('✅ Removed cluster visualization elements');
    
    // ✅ NEW: Additional cleanup - remove any remaining cluster-related objects
    const objectsToRemove = [];
    scene.traverse((child) => {
      // Remove any objects that might be cluster-related
      if (child.name && (child.name.includes('cluster') || child.name.includes('leiden'))) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(obj => {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    if (objectsToRemove.length > 0) {
      console.log(`✅ Removed ${objectsToRemove.length} additional cluster-related objects`);
    }
    
    // ✅ NEW: Clear node references to prevent stale data
    nodesRef.current.clear();
    console.log('✅ Cleared node references');
    
    // ✅ STEP 2: Recreate global view
    console.log('🌍 Recreating global view...');
    
    // ✅ IMPORTANT: Restore original correlations for global view
    if (processedNetworkData.originalCorrelations) {
      console.log('🔄 Restoring original correlations for global view...');
      processedNetworkData.correlations = processedNetworkData.originalCorrelations;
      console.log(`   📊 Restored ${processedNetworkData.correlations.length} original correlations`);
    }
    
    // Recreate the global instanced mesh and edges
    const global3DCoordinates = processedNetworkData.global3DPositions?.coordinates;
    const selectedClusterGeneIds = processedNetworkData.geneIds || [];
    
    if (!global3DCoordinates) {
      console.error('❌ No global 3D coordinates available for recreating global view');
      return;
    }
    
    await create3DNetworkOptimized(
      processedNetworkData,
      global3DCoordinates,
      selectedClusterGeneIds,
      scene
    );
    
    setCurrentView('global');
    console.log('✅ Switched back to global view');
  } catch (error) {
    console.error('❌ Failed to switch to global view:', error);
  } finally {
    setIsTransitioning(false);
  }
};

const updateEdgePositions = (explicitView = null) => {
  if (!processedNetworkData || !sceneRef.current) {
    console.log('❌ Missing data for edge update:', {
      hasProcessedNetworkData: !!processedNetworkData,
      hasScene: !!sceneRef.current
    });
    return;
  }
  
  const activeView = explicitView || currentView; // ✅ Use explicit view if provided
  
  console.log('🔄 Updating edge positions to match current node positions...');
  console.log('🔍 Current view:', currentView);
  console.log('🔍 Active view (for logic):', activeView);
  
  // Clear existing edges
  edgesRef.current.forEach(edge => {
    sceneRef.current.remove(edge);
    if (edge.geometry) edge.geometry.dispose();
    if (edge.material) edge.material.dispose();
  });
  edgesRef.current = [];
  console.log('✅ Cleared existing edges');
  
  // Recreate edges with current node positions
  const correlations = processedNetworkData.correlations || [];
  let edgesCreated = 0;
  
  console.log('🔍 Edge creation data check:');
  console.log('   - correlations array:', correlations.length);
  console.log('   - nodesRef size:', nodesRef.current.size);
  console.log('   - currentView:', currentView);
  console.log('   - activeView:', activeView);
  console.log('   - Data source:', processedNetworkData.originalCorrelations ? 
    (activeView === 'cluster' ? 'Cluster-filtered correlations' : 'Original correlations') : 
    'Direct correlations');
  
  if (correlations.length > 0) {
    console.log('   - Sample correlation:', correlations[0]);
  }
  
  // Check if we're in global view (instanced mesh) or cluster view (individual meshes)
  const instancedMesh = instancedMeshRef.current;
  
  if (instancedMesh && activeView === 'global') {
    console.log('🔄 Creating edges for global view (instanced mesh)...');
    console.log('   - instancedMesh exists:', !!instancedMesh);
    console.log('   - activeView is global:', activeView === 'global');
    // Global view: extract positions from instanced mesh
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    
    correlations.forEach(corr => {
      const node1Data = nodesRef.current.get(corr.gene1);
      const node2Data = nodesRef.current.get(corr.gene2);
      
      if (!node1Data || !node2Data || 
          typeof node1Data.instanceIndex !== 'number' || 
          typeof node2Data.instanceIndex !== 'number') return;

      // Get CURRENT positions from the instanced mesh
      instancedMesh.getMatrixAt(node1Data.instanceIndex, tempMatrix);
      tempMatrix.decompose(tempPosition, new THREE.Quaternion(), new THREE.Vector3());
      const pos1Center = tempPosition.clone();
      
      instancedMesh.getMatrixAt(node2Data.instanceIndex, tempMatrix);
      tempMatrix.decompose(tempPosition, new THREE.Quaternion(), new THREE.Vector3());
      const pos2Center = tempPosition.clone();
      
      // Get sphere radius (default radius)
      const sphere1Radius = 0.4;
      const sphere2Radius = 0.4;
      
      // Create edge
      createEdge(corr, pos1Center, pos2Center, sphere1Radius, sphere2Radius);
      edgesCreated++;
    });
    
  } else if (activeView === 'cluster') {
    console.log('🔄 Creating edges for cluster view (individual meshes)...');
    console.log('   - instancedMesh exists:', !!instancedMesh);
    console.log('   - activeView is cluster:', activeView === 'cluster');
    console.log('🔍 Debug cluster view edge creation:');
    console.log('   - Total correlations:', correlations.length);
    console.log('   - Nodes in nodesRef:', nodesRef.current.size);
    console.log('   - Sample node keys:', Array.from(nodesRef.current.keys()).slice(0, 5));
    
    if (correlations.length > 0) {
      console.log('   - Sample correlation:', correlations[0]);
    }
    
    // ✅ DEBUGGING: Track edge creation steps
    let totalProcessed = 0;
    let missingNode1 = 0;
    let missingNode2 = 0;
    let missingMesh1 = 0;
    let missingMesh2 = 0;
    let edgeCreateAttempts = 0;
    let edgeCreateSuccesses = 0;
    let edgeCreateFailures = 0;
    
    // Cluster view: get positions from individual meshes
    correlations.forEach((corr, index) => {
      totalProcessed++;
      
      const node1Data = nodesRef.current.get(corr.gene1);
      const node2Data = nodesRef.current.get(corr.gene2);
      
      if (index < 3) { // Debug first few correlations
        console.log(`   - Correlation ${index}: ${corr.gene1} <-> ${corr.gene2} (${corr.correlation})`);
        console.log(`     Node1 data:`, node1Data ? 'exists' : 'missing');
        console.log(`     Node2 data:`, node2Data ? 'exists' : 'missing');
        if (node1Data) console.log(`     Node1 has mesh:`, !!node1Data.mesh);
        if (node2Data) console.log(`     Node2 has mesh:`, !!node2Data.mesh);
      }
      
      // Track missing data
      if (!node1Data) { missingNode1++; return; }
      if (!node2Data) { missingNode2++; return; }
      if (!node1Data.mesh) { missingMesh1++; return; }
      if (!node2Data.mesh) { missingMesh2++; return; }

      // Get CURRENT positions from individual meshes
      const pos1Center = node1Data.mesh.position.clone();
      const pos2Center = node2Data.mesh.position.clone();
      
      // Get sphere radius from mesh scale
      const sphere1Radius = 0.4 * node1Data.mesh.scale.x;
      const sphere2Radius = 0.4 * node2Data.mesh.scale.x;
      
      // Track edge creation attempts
      edgeCreateAttempts++;
      
      // Create edge and track success/failure
      try {
        createEdge(corr, pos1Center, pos2Center, sphere1Radius, sphere2Radius);
        edgeCreateSuccesses++;
        edgesCreated++;
      } catch (error) {
        edgeCreateFailures++;
        console.error(`❌ Edge creation failed for ${corr.gene1} <-> ${corr.gene2}:`, error);
      }
    });
    
    // ✅ COMPREHENSIVE DEBUGGING SUMMARY
    console.log('📊 EDGE CREATION SUMMARY:');
    console.log(`   Total correlations processed: ${totalProcessed}`);
    console.log(`   Missing node1 data: ${missingNode1}`);
    console.log(`   Missing node2 data: ${missingNode2}`);
    console.log(`   Missing mesh1: ${missingMesh1}`);
    console.log(`   Missing mesh2: ${missingMesh2}`);
    console.log(`   Edge creation attempts: ${edgeCreateAttempts}`);
    console.log(`   Edge creation successes: ${edgeCreateSuccesses}`);
    console.log(`   Edge creation failures: ${edgeCreateFailures}`);
    console.log(`   Edges actually created: ${edgesCreated}`);
    console.log(`   Edges in scene (edgesRef): ${edgesRef.current.length}`);
  } else {
    console.log('❌ No edge creation path taken!');
    console.log('   - instancedMesh exists:', !!instancedMesh);
    console.log('   - activeView:', activeView);
    console.log('   - currentView:', currentView);
    console.log('   - instancedMesh && activeView === global:', instancedMesh && activeView === 'global');
    console.log('   - activeView === cluster:', activeView === 'cluster');
  }
  
  console.log(`✅ Updated ${edgesCreated} edges for ${activeView} view (filtered from ${correlations.length} total correlations)`);
  console.log(`🎯 FINAL EDGE COUNT: ${edgesRef.current.length} edges actually in the scene`);
  
  // ✅ VISIBILITY CHECK: Are edges actually visible?
  if (edgesRef.current.length > 0) {
    const sampleEdge = edgesRef.current[0];
    console.log(`🔍 Sample edge visibility check:`, {
      visible: sampleEdge.visible,
      opacity: sampleEdge.material?.opacity,
      color: sampleEdge.material?.color?.getHexString(),
      position: sampleEdge.position,
      inScene: sceneRef.current.children.includes(sampleEdge)
    });
  }
};

// Helper function to create an edge
const createEdge = (corr, pos1Center, pos2Center, sphere1Radius, sphere2Radius) => {
  console.log(`🔗 Creating edge: ${corr.gene1} <-> ${corr.gene2}`);
  console.log(`   - Correlation: ${corr.correlation}`);
  console.log(`   - Pos1: (${pos1Center.x.toFixed(2)}, ${pos1Center.y.toFixed(2)}, ${pos1Center.z.toFixed(2)})`);
  console.log(`   - Pos2: (${pos2Center.x.toFixed(2)}, ${pos2Center.y.toFixed(2)}, ${pos2Center.z.toFixed(2)})`);
  
  // Calculate direction vector from sphere1 to sphere2
  const direction = new THREE.Vector3()
    .subVectors(pos2Center, pos1Center)
    .normalize();
  
  // Calculate surface points (edges start/end at sphere surface, not center)
  const surfacePoint1 = pos1Center.clone().add(
    direction.clone().multiplyScalar(sphere1Radius)
  );
  
  const surfacePoint2 = pos2Center.clone().add(
    direction.clone().multiplyScalar(-sphere2Radius)
  );
  
  // Filter weak correlations to reduce visual clutter
  const absoluteCorrelation = Math.abs(corr.correlation);
  console.log(`   - Absolute correlation: ${absoluteCorrelation}`);
  
  if (absoluteCorrelation < 0.05) { // ✅ DEBUGGING: Reduced to 0.05 to show even more edges
    console.log(`   - ❌ SKIPPED: Weak correlation ${absoluteCorrelation} < 0.05`);
    throw new Error(`Correlation too weak: ${absoluteCorrelation}`);
  }
  
  // Calculate edge thickness based on correlation strength
  const scaledWidth = 0.2 + (absoluteCorrelation * 0.8);
  console.log(`   - Edge width: ${scaledWidth}`);

  try {
    // Create the edge geometry
    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions([
      surfacePoint1.x, surfacePoint1.y, surfacePoint1.z, 
      surfacePoint2.x, surfacePoint2.y, surfacePoint2.z
    ]);

    // Create edge material with transparency
    const lineMaterial = new LineMaterial({
      color: corr.correlation > 0 ? 0x4CAF50 : 0xF44336,
      linewidth: Math.max(scaledWidth, 0.5), // ✅ Thinner edges - minimum width of 0.5
      transparent: true,
      opacity: 0.6 // ✅ Slightly reduced opacity for better visual balance
    });

    // Set renderer resolution for proper line width calculation
    lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

    // Create the line and add to scene
    const line = new Line2(lineGeometry, lineMaterial);
    line.computeLineDistances();
    
    sceneRef.current.add(line);
    edgesRef.current.push(line);
    
    console.log(`   ✅ Edge created successfully (total edges in scene: ${edgesRef.current.length})`);
  } catch (error) {
    console.error(`   ❌ Error creating edge:`, error);
  }
};


/*********************************************** leiden clustering ************************************************************ */

// const create3DNetwork = async (processedNetworkData) => {  // Add async here
//   const scene = sceneRef.current;
//   if (!scene) return;
  
//   const correlations = processedNetworkData.correlations || [];
//   const nodeArray = processedNetworkData.nodes || [];
  
//   console.log(`🎲 Creating 3D network with ${nodeArray.length} genes...`);
  
//   // Create 3D nodes with initial positioning (will be repositioned by Leiden)
//   const nodeGeometry = nodeArray.length > 2000
//     ? new THREE.SphereGeometry(0.3, 6, 6)    // Simple for large networks
//     : new THREE.SphereGeometry(0.4, 8, 8);   // Detailed for small networks
//   const defaultMaterial = new THREE.MeshBasicMaterial({ color: 0x2196F3 });
  
//   nodeArray.forEach(nodeId => {
//     const nodeMesh = new THREE.Mesh(nodeGeometry, defaultMaterial.clone());
    
//     // Temporary positioning (Leiden will reposition)
//     const tempPos = new THREE.Vector3(
//       (Math.random() - 0.5) * 60,
//       (Math.random() - 0.5) * 60,
//       (Math.random() - 0.5) * 60
//     );
//     nodeMesh.position.copy(tempPos);
    
//     // Add text label
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     canvas.width = 256;
//     canvas.height = 64;
//     context.fillStyle = 'black';
//     context.font = '30px Arial';
//     context.textAlign = 'center';
//     context.fillText(nodeId, 128, 32);
    
//     const texture = new THREE.CanvasTexture(canvas);
//     const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
//     const sprite = new THREE.Sprite(spriteMaterial);
//     sprite.position.set(tempPos.x, tempPos.y + 2, tempPos.z);
//     sprite.scale.set(4, 1, 1);
//     sprite.visible = show3DLabels;
    
//     scene.add(nodeMesh);
//     scene.add(sprite);
//     nodesRef.current.set(nodeId, { mesh: nodeMesh, sprite: sprite });
//     labelsRef.current.push(sprite);
//   });
  
//   // Create edges
//   correlations.forEach(corr => {
//     const node1Data = nodesRef.current.get(corr.gene1);
//     const node2Data = nodesRef.current.get(corr.gene2);
    
//     if (!node1Data || !node2Data) return;
    
//     const pos1 = node1Data.mesh.position;
//     const pos2 = node2Data.mesh.position;
    
//     const absoluteCorrelation = Math.abs(corr.correlation);
//     const scaledWidth = MIN_EDGE_SIZE + (absoluteCorrelation * (MAX_EDGE_SIZE - MIN_EDGE_SIZE));
    
//     const lineGeometry = new LineGeometry();
//     lineGeometry.setPositions([pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z]);
    
//     const lineMaterial = new LineMaterial({
//       color: corr.correlation > 0 ? 0x4CAF50 : 0xF44336,
//       linewidth: scaledWidth,
//       transparent: true,
//       opacity: 0.75
//     });
    
//     lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
    
//     const line = new Line2(lineGeometry, lineMaterial);
//     line.computeLineDistances();
    
//     scene.add(line);
//     edgesRef.current.push(line);
//   });
  
//   console.log(`✅ Created 3D network: ${nodeArray.length} nodes, ${correlations.length} edges`);
  
//   // Automatically apply Leiden clustering after network creation
//   setTimeout(async () => {  // Add async here too
//     console.log('🚀 Auto-applying Leiden clustering...');
//     await applyLeidenClustering();  // Now this works
//   }, 100);
// };




// *************************** with mesh property and force layout ********************
// const create3DNetworkOptimized = async (processedNetworkData) => {
//   const scene = sceneRef.current;
//   if (!scene) return;


//   const { nodes: nodeArray = [], correlations = [] } = processedNetworkData;

  
//   console.log(`🎲 Creating optimized 3D network with ${nodeArray.length} genes...`);
  
//   // Show loading state
//   setIsLoading(true);
//   // setLoadingMessage(`Initializing network...`);

//   try {

//     const positionMap = await layout3D(nodeArray, correlations);

//     console.log('****** position map is as follows ******',positionMap)

//     // Step 1: Create instanced nodes (single draw call for all nodes)
//     await createInstancedNodes(nodeArray, scene, positionMap);
    
//     // Step 2: Create filtered edges in batches
//     await createFilteredEdges(correlations, scene);
    
//     console.log(`✅ Created optimized 3D network: ${nodeArray.length} nodes, ${correlations.filter(c => Math.abs(c.correlation) > 0.8).length} edges`);
    
//     // Step 3: Auto-apply Leiden clustering
//     // setTimeout(async () => {
//     //   console.log('🚀 Auto-applying Leiden clustering...');
//     //   await applyLeidenClustering();
//     // }, 100);
    
//   } catch (error) {
//     console.error('Error creating 3D network:', error);
//   } finally {
//     setIsLoading(false);
//   }
// };

const create3DNetworkOptimized = async (
  processedNetworkData, // Data for the selected cluster (genes, correlations)
  global3DCoordinates, // Just the coordinates part
  selectedClusterGeneIds, // Genes in the currently selected heatmap cluster for highlighting
  scene // The Three.js scene instance
) => {
  console.log(`🎲 Creating optimized 3D network (Global View).`);
  
  try {
    if (!global3DCoordinates) {
      console.error("❌ Global 3D coordinates are required for global view but are missing.");
      throw new Error("Global 3D coordinates data missing.");
    }

    // Use ALL gene IDs from the global3DCoordinates for the global view
    const allGlobalGeneIds = Object.keys(global3DCoordinates);

    // Step 1: Create instanced nodes using the global sphere layout positions
    const clusterInfo = processedNetworkData.global3DPositions?.cluster_info || null;
    await createInstancedNodes(allGlobalGeneIds, scene, global3DCoordinates, selectedClusterGeneIds, clusterInfo);
    
    // Step 2: Create filtered edges using correlation edges from the backend
    const correlationEdges = processedNetworkData.global3DPositions?.correlation_edges || processedNetworkData.correlations || [];
    await createFilteredEdges(correlationEdges, scene, global3DCoordinates); 

    console.log(`✅ Global 3D network created: ${allGlobalGeneIds.length} nodes.`);
    
  } catch (error) {
    console.error('Error creating 3D network:', error);
    throw error;
  }
};


// ************************************ create instance node without force grid layout**********************************************
// const createInstancedNodes = async (nodeArray, scene) => {
//   console.log("createInstancedNodes: Starting simplified node creation.");

//   // Clear previous mesh
//   if (instancedMeshRef.current) {
//     scene.remove(instancedMeshRef.current);
//     instancedMeshRef.current.geometry.dispose();
//     instancedMeshRef.current.material.dispose();
//     instancedMeshRef.current = null;
//   }
//   // Clear labels and node refs
//   labelsRef.current.forEach(label => scene.remove(label));
//   labelsRef.current = [];
//   nodesRef.current.clear();

//   if (nodeArray.length === 0) {
//     console.warn("nodeArray is empty, no nodes to create.");
//     return;
//   }

//   // --- Setup geometry and material ---
//   const geometry = new THREE.SphereGeometry(0.2, 16, 16);
//   const material = new THREE.MeshBasicMaterial({
//     color: 0xFF5722,   // Default orange color
//     vertexColors: true
//   });
//   material.needsUpdate = true; // ensure shader picks up vertexColors

//   // Create instanced mesh
//   const mesh = new THREE.InstancedMesh(geometry, material, nodeArray.length);
//   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
//   mesh.frustumCulled = false;
//   mesh.name = "MainNetworkInstancedNodes";

//   // --- Instance color buffer bound as 'color' attribute ---
//   const count = nodeArray.length;
//   const colorArray = new Float32Array(count * 3);
//   const colorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
//   colorAttr.setUsage(THREE.DynamicDrawUsage);
//   geometry.setAttribute('color', colorAttr);
//   mesh.instanceColor = geometry.attributes.color;

//   // Temporary objects for matrix and per-instance color
//   const matrix = new THREE.Matrix4();
//   const tmpColor = new THREE.Color();

//   // Populate instance matrices and per-instance colors
//   nodeArray.forEach((nodeId, i) => {
//     // Random position within a cube
//     const x = (Math.random() - 0.5) * 60;
//     const y = (Math.random() - 0.5) * 60;
//     const z = (Math.random() - 0.5) * 60;
//     matrix.setPosition(x, y, z);
//     mesh.setMatrixAt(i, matrix);

//     // Assign per-instance green color
//     tmpColor.setHex(0x00FF00);
//     mesh.setColorAt(i, tmpColor);

//     // Optional debug for first few
//     if (i < 5) console.log(`Node ${nodeId} color set to #${tmpColor.getHexString()}`);

//     // Save for future interactions
//     nodesRef.current.set(nodeId, {
//       instanceIndex: i,
//       initialPosition: new THREE.Vector3(x, y, z)
//     });
//   });

//   // Flag attributes for GPU upload
//   mesh.instanceMatrix.needsUpdate = true;
//   mesh.instanceColor.needsUpdate = true;

//   // Add to scene and store ref
//   scene.add(mesh);
//   instancedMeshRef.current = mesh;
//   console.log(`InstancedMesh added: ${mesh.count} instances`);
// };



// const createInstancedNodes = async (nodeArray, scene, positionMap) => {
//   console.log("createInstancedNodes: Using force layout positions.");

//   // Clear previous
//   if (instancedMeshRef.current) {
//     scene.remove(instancedMeshRef.current);
//     instancedMeshRef.current.geometry.dispose();
//     instancedMeshRef.current.material.dispose();
//     instancedMeshRef.current = null;
//   }
//   labelsRef.current.forEach(l => scene.remove(l)); labelsRef.current = [];
//   nodesRef.current.clear();

//   if (!nodeArray.length) return;

//   // Sphere geometry + material
//   const geometry = new THREE.SphereGeometry(0.2, 16, 16);
//   const material = new THREE.MeshBasicMaterial({ color: 0xFF5722, vertexColors: true });
//   material.needsUpdate = true;

//   const mesh = new THREE.InstancedMesh(geometry, material, nodeArray.length);
//   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
//   mesh.frustumCulled = false;
//   mesh.name = "MainNetworkInstancedNodes";

//   // Per-instance color attr
//   const count = nodeArray.length;
//   const colorArray = new Float32Array(count * 3);
//   const colorAttr = new THREE.InstancedBufferAttribute(colorArray, 3);
//   colorAttr.setUsage(THREE.DynamicDrawUsage);
//   geometry.setAttribute('color', colorAttr);
//   mesh.instanceColor = colorAttr;

//   // Temp vars
//   const matrix = new THREE.Matrix4();
//   const tmpColor = new THREE.Color();

//   nodeArray.forEach((id, i) => {
//     // Use force layout position or fallback to random
//     const pos = positionMap.get(id) || new THREE.Vector3(
//       (Math.random() - 0.5) * 60,
//       (Math.random() - 0.5) * 60,
//       (Math.random() - 0.5) * 60
//     );
//     matrix.setPosition(pos.x, pos.y, pos.z);
//     mesh.setMatrixAt(i, matrix);

//     // Keep nodes orange
//     tmpColor.setHex(0xFF5722);
//     mesh.setColorAt(i, tmpColor);

//     nodesRef.current.set(id, { instanceIndex: i, initialPosition: pos.clone() });
//   });

//   mesh.instanceMatrix.needsUpdate = true;
//   mesh.instanceColor.needsUpdate = true;

//   scene.add(mesh);
//   instancedMeshRef.current = mesh;
//   console.log(`InstancedMesh added: ${mesh.count} instances`);
// };


const createInstancedNodes = async (
  allGlobalGeneIds,
  scene,
  global3DCoordinates, // Now expects just the coordinates object
  selectedClusterGeneIds,
  clusterInfo // NEW: cluster information from backend
) => {
  console.log("createInstancedNodes: Using global 3D coordinates from backend with cluster-based coloring.");
  console.log("📊 Cluster info:", clusterInfo);

  // Clear previous mesh and labels
  if (instancedMeshRef.current) {
    scene.remove(instancedMeshRef.current);
    instancedMeshRef.current.geometry.dispose();
    instancedMeshRef.current.material.dispose();
    instancedMeshRef.current = null;
  }
  labelsRef.current.forEach(l => scene.remove(l));
  labelsRef.current = [];
  nodesRef.current.clear();

  if (!allGlobalGeneIds.length || !global3DCoordinates) {
    console.warn("allGlobalGeneIds is empty or global3DCoordinates is null, no nodes to create.");
    return;
  }

  // Choose geometry resolution based on size
  const geometry = new THREE.SphereGeometry(
    allGlobalGeneIds.length > 10000 ? 0.2 : 0.4,
    allGlobalGeneIds.length > 10000 ? 8 : 16,
    allGlobalGeneIds.length > 10000 ? 8 : 16
  );

  // Material - use a simple base color, instance colors will override
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF // White base color
  });

  const mesh = new THREE.InstancedMesh(geometry, material, allGlobalGeneIds.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.name = "MainNetworkInstancedNodes";

  // Enable per-instance coloring - Three.js will automatically create the instanceColor attribute
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(allGlobalGeneIds.length * 3), 3);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  // Build gene-to-cluster mapping from backend cluster info
  const geneToCluster = new Map();
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
    new THREE.Color(0xE91E63), // Pink
    new THREE.Color(0x009688), // Teal
  ];

  if (clusterInfo && clusterInfo.clusters) {
    clusterInfo.clusters.forEach((cluster, index) => {
      const clusterColor = clusterColors[index % clusterColors.length];
      cluster.nodes.forEach(geneId => {
        geneToCluster.set(geneId, {
          id: cluster.id,
          color: clusterColor,
          size: cluster.nodes.length
        });
      });
    });
    console.log(`📊 Built gene-to-cluster mapping for ${geneToCluster.size} clustered genes across ${clusterInfo.clusters.length} clusters`);
  }

  // Colors for different node types
  const greyNodeColor = new THREE.Color(0xAAAAAA); // Light grey for non-selected nodes (brighter than before)
  const selectedClusterColor = new THREE.Color(0xFF5722); // Orange for selected cluster
  const selectedSet = new Set(selectedClusterGeneIds);

  const matrix = new THREE.Matrix4();
  const tmpColor = new THREE.Color();

  let selectedClusterCount = 0;
  let otherNodesCount = 0;

  allGlobalGeneIds.forEach((id, i) => {
    // Get position from coordinates
    const raw = global3DCoordinates[id];
    if (!raw || typeof raw.x !== 'number' || typeof raw.y !== 'number' || typeof raw.z !== 'number') {
      console.warn(`Invalid or missing coordinates for gene ${id}:`, raw);
      return;
    }

    // wrap them in THREE.Vector3
    const pos = raw
      ? new THREE.Vector3(raw.x, raw.y, raw.z)
      : new THREE.Vector3(0, 0, 0);
    // Lookup from Map
    matrix.setPosition(pos.x, pos.y, pos.z);
    mesh.setMatrixAt(i, matrix);

    // Color based on whether node is in the selected cluster
    const clusterData = geneToCluster.get(id);
    const isInSelectedCluster = selectedSet.has(id);
    
    if (isInSelectedCluster) {
      // Node is in the selected cluster - use bright color
      tmpColor.copy(selectedClusterColor);
      selectedClusterCount++;
      if (selectedClusterCount <= 3) {
        console.log(`🎨 Selected cluster node ${id} colored orange:`, tmpColor);
      }
    } else {
      // All other nodes (other clusters + isolated) - use grey
      tmpColor.copy(greyNodeColor);
      otherNodesCount++;
      if (otherNodesCount <= 3) {
        console.log(`🎨 Other node ${id} colored grey:`, tmpColor);
      }
    }
    
    mesh.setColorAt(i, tmpColor);

    // Store with cluster information for edge processing
    nodesRef.current.set(id, { 
      instanceIndex: i, 
      initialPosition: pos.clone(),
      cluster: clusterData || null,
      isInSelectedCluster: isInSelectedCluster,
      isIsolated: !clusterData
    });
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;

  scene.add(mesh);
  instancedMeshRef.current = mesh;

  console.log(`✅ InstancedMesh added: ${mesh.count} instances`);
  console.log(`📊 Node coloring: ${selectedClusterCount} selected cluster nodes, ${otherNodesCount} other nodes`);

  // Optional: labels for small clusters
  if (selectedSet.size < 5 && show3DLabels) {
    await createLabelsInBatches(Array.from(selectedSet));
  } else if (show3DLabels) {
    console.log(`Skipping labels: ${allGlobalGeneIds.length} nodes too many.`);
  }
};


const createLabelsInBatches = async (nodeArray) => {
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < nodeArray.length; i += BATCH_SIZE) {
    const batch = nodeArray.slice(i, i + BATCH_SIZE);
    
    batch.forEach(nodeId => {
      const nodeData = nodesRef.current.get(nodeId);
      if (!nodeData) return;
      
      // Create text label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'white';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(nodeId, 128, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      
      sprite.position.set(
        nodeData.position.x, 
        nodeData.position.y + 2, 
        nodeData.position.z
      );
      sprite.scale.set(3, 0.75, 1);
      sprite.visible = show3DLabels;
      
      sceneRef.current.add(sprite);
      labelsRef.current.push(sprite);
    });
    
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
};


/**
 * Create and add edges based on correlations with enhanced visibility.
 */
const createFilteredEdges = async (
  correlationEdges, // Now using correlation_edges from backend
  scene,
  global3DCoordinates // Just the coordinates object
) => {
  console.log("createFilteredEdges: Creating edges from correlation data.");
  console.log("📊 Correlation edges received:", correlationEdges?.length || 0);
  console.log("📊 Sample edges:", correlationEdges?.slice(0, 3));
  console.log("📊 Available coordinates for genes:", Object.keys(global3DCoordinates).slice(0, 10));
  console.log("📊 Total genes in coordinates:", Object.keys(global3DCoordinates).length);
  
  // Clear previous edges
  if (edgesRef.current) {
    edgesRef.current.forEach(edge => {
      scene.remove(edge);
      edge.geometry?.dispose();
      edge.material?.dispose();
    });
    edgesRef.current = [];
  }

  if (!correlationEdges || !correlationEdges.length) {
    console.warn("No correlation edges to create.");
    return;
  }

  // Process correlation edges and create thick visible lines
  let validEdges = 0;
  let missingGenes = new Set();
  let edgeStats = { positive: 0, negative: 0, strong: 0, weak: 0 };
  
  correlationEdges.forEach((edge, index) => {
    const gene1 = edge.gene1 || edge.source;
    const gene2 = edge.gene2 || edge.target;
    const correlation = edge.correlation || edge.weight;

    if (!gene1 || !gene2) {
      console.warn(`Edge ${index}: Missing gene names`, edge);
      return;
    }
    
    if (!global3DCoordinates[gene1]) {
      missingGenes.add(gene1);
    }
    if (!global3DCoordinates[gene2]) {
      missingGenes.add(gene2);
    }
    
    if (!global3DCoordinates[gene1] || !global3DCoordinates[gene2]) {
      return;
    }
    
    // Filter edges by correlation strength for better visibility
    const absCorr = Math.abs(correlation);
    if (absCorr < 0.8) {  // Only show correlations > 0.2
      return;
    }
    
    validEdges++;
    if (validEdges <= 3) {
      console.log(`✅ Valid edge ${validEdges}:`, gene1, "↔", gene2, "correlation:", correlation);
    }

    // Update statistics
    if (correlation > 0) edgeStats.positive++;
    else edgeStats.negative++;
    if (absCorr > 0.5) edgeStats.strong++;
    else edgeStats.weak++;

    const pos1 = global3DCoordinates[gene1];
    const pos2 = global3DCoordinates[gene2];

    // Check if nodes are in the selected cluster
    const node1Data = nodesRef.current.get(gene1);
    const node2Data = nodesRef.current.get(gene2);
    const isNode1InSelectedCluster = node1Data?.isInSelectedCluster || false;
    const isNode2InSelectedCluster = node2Data?.isInSelectedCluster || false;
    
    // All edges are grey - simple uniform appearance

    let color = new THREE.Color(0x808080); // Grey for all edges

    const isClusterEdge = isNode1InSelectedCluster && isNode2InSelectedCluster;

    if(isClusterEdge){
      if (correlation > 0) {
      color = new THREE.Color(0x2E7D32); // Dark green
    } else {
      color = new THREE.Color(0xC62828); // Dark red
    }
  }

    
    let edgeOpacity = 0.3; // Uniform opacity for all edges

    // Try Line2 approach first (for thick lines)
    try {
      // Create thick line using Line2 and LineGeometry for proper visibility
      const lineGeometry = new LineGeometry();
      lineGeometry.setPositions([
        pos1.x, pos1.y, pos1.z,
        pos2.x, pos2.y, pos2.z
      ]);

      // Calculate line width based on correlation strength (extra thin lines)
      // const lineWidth = 0.1 + (absCorr * 0.3); // 0.1-0.4 pixel width based on correlation
      const lineWidth = 0.2;

      // Create line material with dynamic opacity based on cluster involvement
      const lineMaterial = new LineMaterial({
        color: color.getHex(),
        linewidth: lineWidth,
        transparent: true,
        opacity: edgeOpacity, // Use dynamic opacity based on selected cluster involvement
        dashed: false,
        dashScale: 1,
        dashSize: 1,
        gapSize: 0.5
      });

      // Set resolution for proper line width calculation
      lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

      // Create the thick line
      const line = new Line2(lineGeometry, lineMaterial);
      line.computeLineDistances();
      
      // Add debugging info for first few lines
      if (validEdges <= 3) {
        console.log(`🎨 Line2 ${validEdges} created with width: ${lineWidth}px, opacity: ${edgeOpacity} (grey)`);
        console.log(`🎨 Line material:`, lineMaterial);
      }
      
      scene.add(line);
      edgesRef.current.push(line);
      
    } catch (error) {
      console.warn(`⚠️ Line2 failed for edge ${validEdges}, falling back to cylinder:`, error);
      
             // Fallback: Create a cylinder between the two points
       const distance = pos1.distanceTo(pos2);
       const cylinderRadius = 0.0005 + (absCorr * 0.0015); // 0.0005-0.002 world units (thinner)
      
      const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, distance, 8);
             const cylinderMaterial = new THREE.MeshBasicMaterial({ 
         color: color.getHex(),
         transparent: true,
         opacity: edgeOpacity // Use dynamic opacity based on selected cluster involvement
       });
      
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      
      // Position cylinder between the two points
      const midpoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
      cylinder.position.copy(midpoint);
      
      // Orient cylinder to point from pos1 to pos2
      const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();
      cylinder.lookAt(pos1.clone().add(direction));
      cylinder.rotateX(Math.PI / 2);
      
      scene.add(cylinder);
      edgesRef.current.push(cylinder);
      
      if (validEdges <= 3) {
        console.log(`🎨 Cylinder ${validEdges} created with radius: ${cylinderRadius}, distance: ${distance}`);
      }
    }
  });

  console.log(`📊 Enhanced edge processing summary:`);
  console.log(`   Valid edges: ${validEdges} (filtered from ${correlationEdges.length})`);
  console.log(`   Edge statistics:`, edgeStats);
  console.log(`   Missing genes: ${missingGenes.size}`);
  console.log(`   Sample missing genes:`, Array.from(missingGenes).slice(0, 10));

  if (validEdges === 0) {
    console.warn("No valid edge positions to create.");
    return;
  }

  console.log(`✅ Created ${validEdges} correlation edges with uniform grey coloring.`);
  console.log(`📈 Correlation distribution: ${edgeStats.positive} positive, ${edgeStats.negative} negative`);
  console.log(`💪 Strength distribution: ${edgeStats.strong} strong (>0.5), ${edgeStats.weak} moderate (0.2-0.5)`);
  console.log(`🎯 All edges are grey - only selected cluster nodes will be colored`);
};


  return isLoading?<CircularProgress/> : (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '800px', 
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* ✅ 3D Network Controls - Complete UI */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {/* Network Controls Header */}
        <div 
          style={{
            background: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            margin: '2px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            fontSize: '11px',
            fontWeight: '600',
            color: '#2c3e50',
            textAlign: 'center',
            letterSpacing: '0.5px',
            userSelect: 'none'
          }}
        >
          🎛️ NETWORK CONTROLS
        </div>
        
        {/* ✅ Search Box */}
        {/* ✅ Enhanced Search Box with Autocomplete */}
<div 
  style={{
    background: 'white',
    borderRadius: '4px',
    padding: '4px 6px',
    margin: '2px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    minWidth: '180px',
    position: 'relative',
    zIndex: 1000
  }}
>
  <div style={{ 
    position: 'relative',
    isolation: 'isolate'
  }}>
    <input
      type="text"
      placeholder="🔍 Search nodes..."
      value={searchTerm}
      style={{
        border: 'none',
        outline: 'none',
        background: 'transparent',
        padding: '2px 4px',
        fontSize: '12px',
        width: '100%',
        minWidth: '160px'
      }}
      onChange={(e) => handleSearch(e.target.value)}
      onFocus={() => {
        if (searchResults.length > 0) {
          setShowDropdown(true);
        }
      }}
      onBlur={() => {
        // Delay hiding dropdown to allow clicks
        setTimeout(() => setShowDropdown(false), 150);
      }}
    />
    
    {/* ✅ Autocomplete Dropdown */}
    {showDropdown && searchResults.length > 0 && (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 2000
      }}>
        {searchResults.map((nodeId, index) => (
          <div
            key={nodeId}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              borderBottom: index < searchResults.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
              background: 'white',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
            }}
            onClick={() => selectNode(nodeId)}
          >
            <span style={{ color: '#2196F3', marginRight: '8px' }}>●</span>
            {nodeId}
          </div>
        ))}
        
        {/* Show count if there are more results */}
        {Array.from(nodesRef.current.keys()).filter(nodeId => 
          nodeId.toLowerCase().includes(searchTerm.toLowerCase())
        ).length > 10 && (
          <div style={{
            padding: '6px 12px',
            fontSize: '10px',
            color: '#666',
            fontStyle: 'italic',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            background: 'rgba(0, 0, 0, 0.02)'
          }}>
            +{Array.from(nodesRef.current.keys()).filter(nodeId => 
              nodeId.toLowerCase().includes(searchTerm.toLowerCase())
            ).length - 10} more results...
          </div>
        )}
      </div>
    )}
  </div>
</div>
        
        {/* Show Labels Toggle for 3D */}
        <div 
          style={{
            background: 'white',
            borderRadius: '4px',
            padding: '6px 8px',
            margin: '2px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            userSelect: 'none',
            minWidth: '120px'
          }}
          onClick={() => {
            const newLabelState = !show3DLabels;
            setShow3DLabels(newLabelState);    // Update local state
            labelsRef.current.forEach(sprite => {
              sprite.visible = newLabelState;   // Update actual sprites
            });
          }}
          title={`${show3DLabels ? 'Hide' : 'Show'} node labels`}

        >
          <span style={{ fontSize: '14px' }}>🏷️</span>
          
          <span style={{
            fontSize: '11px',
            fontWeight: '500',
            color: '#34495e',
            flex: 1
          }}>
            Show Labels
          </span>
          
          {/* Compact Toggle Switch */}
          <div style={{
            position: 'relative',
            width: '28px',
            height: '14px',
            background: show3DLabels ? '#4CAF50' : '#ccc',
            borderRadius: '10px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: show3DLabels ? '16px' : '2px',
              width: '10px',
              height: '10px',
              background: 'white',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}></div>
          </div>
        </div>

        {/* <LeidenControls /> */}

        {/* ✅ NEW: Explore Cluster Button */}
        <div 
          style={{
            background: currentView === 'cluster' 
              ? 'linear-gradient(45deg, #FF6B35, #F7931E)'
              : 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            borderRadius: '4px',
            padding: '6px 8px',
            margin: '2px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            minWidth: '140px',
            opacity: isTransitioning ? 0.6 : 1
          }}
          onClick={currentView === 'global' ? switchToClusterView : switchToGlobalView}
          title={currentView === 'global' ? 'Switch to cluster detail view' : 'Switch back to global view'}
        >
          <span style={{ fontSize: '14px' }}>
            {isTransitioning ? '⏳' : (currentView === 'global' ? '🔬' : '🌐')}
          </span>
          
          <span style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'white',
            flex: 1
          }}>
            {isTransitioning ? 'Switching...' : (currentView === 'global' ? 'Explore Cluster' : 'Global View')}
          </span>
          
          {/* Status indicator */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: currentView === 'cluster' ? '#FF9800' : '#4CAF50',
            boxShadow: `0 0 6px ${currentView === 'cluster' ? '#FF9800' : '#4CAF50'}`
          }}></div>
        </div>

        {/* Switch to 2D Button */}
        <div 
          style={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            borderRadius: '4px',
            padding: '6px 8px',
            margin: '2px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            minWidth: '120px'
          }}
          onClick={() => onLayoutChange(false)}
          title="Switch to 2D layout"
        >
          <span style={{ fontSize: '14px' }}>🎯</span>
          
          <span style={{
            fontSize: '11px',
            fontWeight: '500',
            color: 'white',
            flex: 1
          }}>
            Switch to 2D
          </span>
          
          {/* Status indicator */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#4CAF50',
            boxShadow: '0 0 6px #4CAF50'
          }}></div>
        </div>
      </div>

      {/* 3D Controls Instructions */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>🎲 3D Network View</div>
        <div>Mouse: Rotate • Scroll: Zoom</div>
        <div>Right-click: Pan</div>
        <div style={{ marginTop: '5px', fontSize: '11px', color: '#FFD700' }}>
          🔬 Click "Explore Cluster" for detailed view
        </div>
      </div>
    </div>
  );
};

const FocusOnNode = ({ node }) => {
  const sigma = useSigma();

  useEffect(() => {
    if (node && sigma) {
      const graph = sigma.getGraph();
      if (graph.hasNode(node)) {
        const nodeData = sigma.getNodeDisplayData(node);
        const camera = sigma.getCamera(); // Get the camera instance

        if (typeof nodeData?.x === 'number' && typeof nodeData?.y === 'number' && camera) {
          // Stop layout if it's running to prevent conflicts
          if (sigma.getSetting('layout') && typeof sigma.killForceAtlas2 === 'function') {
            sigma.killForceAtlas2();
          }

          // ✅ Call the animate method directly on the camera object
          camera.animate(
            {
              x: nodeData.x,
              y: nodeData.y,
              ratio: 0.2, // Zoom level
            },
            {
              duration: 600, // Animation duration in ms
            }
          );
        }
      }
    }
  }, [node, sigma]);

  return null;
};


// Custom Network Controls as Sigma Control Components
const LabelToggleControl = ({ onToggle, showLabels }) => {
  return (
    <div 
      className="sigma-control"
      style={{
        background: 'white',
        borderRadius: '4px',
        padding: '6px 8px',
        margin: '2px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        userSelect: 'none',
        minWidth: '120px'
      }}
      onClick={() => onToggle(!showLabels)}
      title={`${showLabels ? 'Hide' : 'Show'} node labels`}
    >
      <span style={{ fontSize: '14px' }}>🏷️</span>
      
      <span style={{
        fontSize: '11px',
        fontWeight: '500',
        color: '#34495e',
        flex: 1
      }}>
        Show Labels
      </span>
      
      {/* Compact Toggle Switch */}
      <div style={{
        position: 'relative',
        width: '28px',
        height: '14px',
        background: showLabels ? '#4CAF50' : '#ccc',
        borderRadius: '10px',
        transition: 'all 0.2s ease'
      }}>
        <div style={{
          position: 'absolute',
          top: '2px',
          left: showLabels ? '16px' : '2px',
          width: '10px',
          height: '10px',
          background: 'white',
          borderRadius: '50%',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
        }}></div>
      </div>
    </div>
  );
};

const LayoutToggleControl = ({ onToggle, is3DLayout, isGlobal3DDisabled }) => {
  const getButtonText = () => {
    if (is3DLayout) {
      return 'Switch to 2D';
    } else if (isGlobal3DDisabled) {
      return 'Leiden Clustering';
    } else {
      return 'Switch to 3D';
    }
  };

  const getButtonTitle = () => {
    if (is3DLayout) {
      return 'Switch to 2D network layout';
    } else if (isGlobal3DDisabled) {
      return 'Global 3D coordinates disabled - will show Leiden clustering network';
    } else {
      return 'Switch to 3D global network layout';
    }
  };

  return (
    <div 
      className="sigma-control"
      style={{
        background: is3DLayout 
          ? 'linear-gradient(45deg, #667eea, #764ba2)'
          : isGlobal3DDisabled
          ? 'linear-gradient(45deg, #f093fb, #f5576c)' // Different color for Leiden clustering
          : 'white',
        borderRadius: '4px',
        padding: '6px 8px',
        margin: '2px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        minWidth: '120px'
      }}
      onClick={() => onToggle(!is3DLayout)}
      title={getButtonTitle()}
    >
      <span style={{ fontSize: '14px' }}>
        {is3DLayout ? '🎯' : isGlobal3DDisabled ? '🧠' : '🎲'}
      </span>
      
      <span style={{
        fontSize: '11px',
        fontWeight: '500',
        color: (is3DLayout || isGlobal3DDisabled) ? 'white' : '#34495e',
        flex: 1
      }}>
        {getButtonText()}
      </span>
      
      {/* Status indicator */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: is3DLayout ? '#4CAF50' : '#f39c12',
        boxShadow: `0 0 6px ${is3DLayout ? '#4CAF50' : '#f39c12'}`
      }}></div>
    </div>
  );
};

// Component that controls Sigma settings dynamically - OPTIMIZED APPROACH
const SigmaSettingsController = ({ showLabels }) => {
  const sigma = useSigma();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (sigma && !isInitialized) {
      // Wait for sigma to be fully initialized
      setTimeout(() => {
        setIsInitialized(true);
      }, 100);
      return;
    }
    
    if (!sigma || !isInitialized) return;
    
    console.log('🔧 Updating label visibility to:', showLabels);
    
    try {
      // Update settings individually and safely
      sigma.setSetting('renderLabels', showLabels);
      sigma.setSetting('labelThreshold', showLabels ? 0 : Infinity);
      sigma.setSetting('labelRenderedSizeThreshold', showLabels ? 0 : Infinity);
      
      // Force a gentle refresh without full re-render
      sigma.scheduleRender();
      
      console.log('✅ Label settings updated successfully');
      
    } catch (error) {
      console.error('❌ Setting update failed:', error);
      
      // Fallback approach
      try {
        console.log('🔄 Trying manual approach...');
        
        if (showLabels) {
          sigma.setSetting('labelThreshold', 0);
          sigma.setSetting('renderLabels', true);
        } else {
          sigma.setSetting('labelThreshold', Infinity);
          sigma.setSetting('renderLabels', false);
        }
        
        sigma.scheduleRender();
        console.log('✅ Manual approach successful');
        
      } catch (fallbackError) {
        console.error('❌ All methods failed:', fallbackError);
      }
    }
  }, [sigma, showLabels, isInitialized]);

  return null;
};



// ✅ TESTING: Raw ForceAtlas2 for guaranteed tight clustering
const AutoForceAtlas2 = () => {
  // DISABLED - user prefers manual control via existing play button in bottom-right
  return null;
};

const LoadNetworkGraph = ({ 
  processedNetworkData
}) => {
  const loadGraph = useLoadGraph();
  const [processedData, setProcessedData] = useState(null);
  const sigma = useSigma();


  useEffect(() => {
    if (processedNetworkData) {
      const sigmaData = transform2DData(processedNetworkData);
      setProcessedData(sigmaData);
    }
  }, [processedNetworkData]);
  
  const transform2DData = (processedNetworkData) => {
    const nodes = [];
    const edges = [];

    if (processedNetworkData.correlations) {
      const correlations = processedNetworkData.correlations;

      // ✅ IMPROVED: Create edges with better visual styling
      correlations.forEach((corr, index) => {
         const absoluteCorrelation = Math.abs(corr.correlation);
         // const scaledSize = MIN_EDGE_SIZE + (absoluteCorrelation * (MAX_EDGE_SIZE - MIN_EDGE_SIZE));
         const scaledSize = 0.01;


        edges.push({
          id: `edge_${index}`,
          source: corr.gene1,
          target: corr.gene2,
          correlation: corr.correlation,
          size: scaledSize,
          // ✅ FIXED: Edge colors with grey for weak correlations (-0.3 to 0.3)
          // color: absoluteCorrelation > 0.7 ? (corr.correlation > 0 ? '#2E7D32' : '#C62828') :  // Strong: Dark green/red
          //        absoluteCorrelation > 0.3 ? (corr.correlation > 0 ? '#66BB6A' : '#EF5350') :  // Medium: Light green/red
          //        '#808080',                                                                      // Weak (-0.3 to 0.3): Grey
          // color:'#d2d2d2',
          color: '#ebebeb',          // ✅ IMPROVED: Variable transparency based on strength
          // alpha: Math.max(0.3, absoluteCorrelation * 0.8),
          alpha: 0.3,

          type: 'line' // Clean straight lines instead of curves
        });
        
        // ✅ DEBUG: Log first few edges to see colors
        if (index < 5) {
          const edgeColor = corr.correlation > 0.7 ? '#2E7D32' :      
                           corr.correlation > 0.3 ? '#66BB6A' :      
                           corr.correlation > -0.3 ? '#FFA726' :     
                           corr.correlation > -0.7 ? '#EF5350' :     
                           '#C62828';
          console.log(`🎨 Edge ${index}: correlation=${corr.correlation}, color=${edgeColor}, size=${scaledSize}`);
        }
      });
      
      // ✅ IMPROVED: Calculate node importance and clustering for better styling
      const nodeConnections = new Map();
      const nodeCorrelationSum = new Map();
      
      // Calculate node metrics
      processedNetworkData.nodes.forEach(nodeId => {
        nodeConnections.set(nodeId, 0);
        nodeCorrelationSum.set(nodeId, 0);
      });
      
      correlations.forEach(corr => {
        const absCorr = Math.abs(corr.correlation);
        nodeConnections.set(corr.gene1, (nodeConnections.get(corr.gene1) || 0) + 1);
        nodeConnections.set(corr.gene2, (nodeConnections.get(corr.gene2) || 0) + 1);
        nodeCorrelationSum.set(corr.gene1, (nodeCorrelationSum.get(corr.gene1) || 0) + absCorr);
        nodeCorrelationSum.set(corr.gene2, (nodeCorrelationSum.get(corr.gene2) || 0) + absCorr);
      });
      
      // ✅ IMPROVED: Better initial positioning with cluster-aware layout
      const nodeCount = processedNetworkData.nodes.length;
      const spreadRadius = Math.sqrt(nodeCount) * 150; // DRAMATICALLY INCREASED from 25 to 150
      
      processedNetworkData.nodes.forEach((nodeId, index) => {
        // Calculate node importance
        const connections = nodeConnections.get(nodeId) || 0;
        const avgCorrelation = connections > 0 ? (nodeCorrelationSum.get(nodeId) || 0) / connections : 0;
        
        // Use improved spiral distribution with much wider spacing
        // const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        // const r = spreadRadius * Math.sqrt(index / nodeCount);
        // const theta = goldenAngle * index;
        
        // const x = r * Math.cos(theta);
        // const y = r * Math.sin(theta);

        const x = Math.random() * 20 - 10;
        const y = Math.random() * 20 - 10;

        
        // ✅ IMPROVED: Larger node sizes for adjustSizes to work with
        // const nodeSize = Math.max(8, Math.min(20, 8 + connections * 1.0)); // Increased from 4-12 to 8-20
        const nodeSize = 1;

        const nodeColor = connections > 10 ? '#1565C0' :  // High connectivity: Dark blue
                         connections > 5 ? '#1976D2' :   // Medium connectivity: Blue
                         connections > 2 ? '#42A5F5' :   // Low connectivity: Light blue
                         '#90CAF9';                      // Very low: Very light blue
        
        nodes.push({
          id: nodeId,
          label: nodeId,
          size: nodeSize,
          color: nodeColor,
          borderColor: '#0D47A1',
          borderSize: 1,
          x: x,
          y: y,
          // ✅ NEW: Additional properties for better rendering
          connections: connections,
          avgCorrelation: avgCorrelation,
          importance: connections * avgCorrelation // Combined metric
        });
        
        // ✅ DEBUG: Log first few nodes to see sizes and colors
        if (index < 5) {
          console.log(`🎨 Node ${index} (${nodeId}): connections=${connections}, size=${nodeSize}, color=${nodeColor}, x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
        }
      });
    }

    console.log('✨ Enhanced network data created with improved styling');
    
    return { nodes, edges };
  };

  useEffect(() => {
    if (processedData) {
      console.log('🎨 Loading graph with processed data...');
      
      const graph = new Graph();
      
      // Add nodes with all required properties
      processedData.nodes.forEach(node => {
        graph.addNode(node.id, {
          x: node.x || 0, // ✅ Fallback to 0 if undefined
          y: node.y || 0, // ✅ Fallback to 0 if undefined
          size: node.size || 8, // ✅ FIXED: Ensure size is always defined
          label: node.label || node.id, // ✅ Fallback to id if undefined
          color: node.color || '#2196F3', // ✅ Fallback color
          borderColor: node.borderColor || '#1976D2',
          borderSize: node.borderSize || 2,
          // ✅ FIXED: Add additional required properties
          connections: node.connections || 0,
          avgCorrelation: node.avgCorrelation || 0,
          importance: node.importance || 0
        });
      });
      
      // Add edges with weights
      processedData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target, {
          // size: edge.size || 0.1, // ✅ FIXED: Ensure size is always defined
          size: 1, // ✅ FIXED: Ensure size is always defined

          color: edge.color || '#ccc', // ✅ FIXED: Ensure color is always defined

          // alpha: edge.alpha || 0.5,
          alpha: 0.05,

          correlation: edge.correlation || 0,
          weight: Math.abs(edge.correlation || 0)
        });
      });
      
      console.log(`📊 Graph created: ${graph.nodes().length} nodes, ${graph.edges().length} edges`);
      
      // ✅ DEBUG: Log sample node and edge data
      const sampleNode = graph.nodes()[0];
      const sampleNodeAttrs = graph.getNodeAttributes(sampleNode);
      console.log('🔍 Sample node attributes:', sampleNodeAttrs);
      
      if (graph.edges().length > 0) {
        const sampleEdge = graph.edges()[0];
        const sampleEdgeAttrs = graph.getEdgeAttributes(sampleEdge);
        console.log('🔍 Sample edge attributes:', sampleEdgeAttrs);
      }
      
      // ✅ NEW: Load graph FIRST, then let AutoForceAtlas2 worker create tight clusters
      console.log('📊 Loading graph for tight clustering with worker...');
      
      // Apply connectivity-based blue coloring before loading
      console.log('🎨 Applying connectivity-based blue coloring for 2D view...');
      
      const nodes = graph.nodes();
      
      // Apply connectivity-based blue coloring
      nodes.forEach(nodeId => {
        const nodeAttrs = graph.getNodeAttributes(nodeId);
        const connections = nodeAttrs.connections || 0;
        
        // Size based on connectivity 
        // const baseSize = Math.max(4, Math.min(10, 4 + connections * 0.4));
        const baseSize = 5;

        
        // ✅ FIXED: Blue-based coloring based on connectivity levels
        let nodeColor;
        if (connections > 10) {
          nodeColor = '#1976D2'; // Dark blue for high connectivity (>10)
        } else if (connections > 5) {
          nodeColor = '#42A5F5'; // Medium blue for medium connectivity (5-10)
        } else {
          nodeColor = '#90CAF9'; // Light blue for low connectivity (<5)
        }
        
        graph.setNodeAttribute(nodeId, 'color', nodeColor);
        graph.setNodeAttribute(nodeId, 'size', baseSize);
        graph.setNodeAttribute(nodeId, 'opacity', 1.0);
      });
      
      console.log(`✅ Applied connectivity-based blue coloring for 2D view`);
      
      // ✅ NEW: Add intelligent node labeling for better interpretation
      console.log('🏷️ Adding intelligent node labeling...');
      
      // Only show labels for important nodes to avoid clutter
      nodes.forEach(nodeId => {
        const nodeAttrs = graph.getNodeAttributes(nodeId);
        const connections = nodeAttrs.connections || 0;
        const importance = nodeAttrs.importance || 0;
        
        // Show labels for highly connected or important nodes
        if (connections > 5 || importance > 2) {
          graph.setNodeAttribute(nodeId, 'label', nodeId);
          graph.setNodeAttribute(nodeId, 'labelSize', Math.min(14, 10 + connections * 0.3));
          graph.setNodeAttribute(nodeId, 'labelColor', '#000000');
        } else {
          graph.setNodeAttribute(nodeId, 'label', ''); // Hide label for less important nodes
        }
      });
      
      console.log('✅ Intelligent labeling applied - only showing important nodes');
      
      // Load the graph with the initial positions
      loadGraph(graph);

      // 3) Run ForceAtlas2 **once**, with your exact settings:
      const settings = {
        scalingRatio: 0.05,
        gravity: 0.00001,
        slowDown: 10,
        edgeWeightInfluence: 0.001,
        barnesHutOptimize: false,
        strongGravityMode: false,
        linLogMode: false,
        outboundAttractionDistribution: false,
        adjustSizes: false,
      };

      // “iterations” = how many simulation ticks to run.
      // 200–300 is often enough for a nice spread.
      forceAtlas2.assign(graph, { settings, iterations: 15 });

      // 4) Tell Sigma to re‑render at the new positions
      sigma.refresh();
      console.log('✅ Graph loaded - ready for ForceAtlas2 worker clustering');
    }
  }, [processedData, loadGraph]);

  return null;
};

// Main component that displays the network with notification support
// const NetworkVisualizationComponent = ({ 
//   networkData, 
//   onNetworkSuccess, 
//   onNetworkError, 
//   onDataFetchError, 
//   showLabels, 
//   onLayoutChange, 
//   is3DLayout, 
//   selectedNode, 
//   focusNode 
// }) 
const NetworkVisualizationComponent = ({ 
  networkData, 
  onClose, 
  onSuccess, // ✅ NEW: Generic success callback
  onError    // ✅ NEW: Generic error callback
}) => {
  // ✅ REMOVED: WebGL context management - was causing race conditions
  
  // ✅ REMOVED: Manual network context registration - SigmaContainerWithCleanup handles it automatically
  console.log('🔗 NetworkVisualizationComponent received:', networkData);
  
  // ✅ REMOVED: Periodic cleanup - was causing race conditions with scene initialization
  
  // State for controls
  const [showLabels, setShowLabels] = useState(true);
  const [is3DLayout, setIs3DLayout] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusNode, setFocusNode] = useState(null);
  const [processedNetworkData, setProcessedNetworkData] = useState(null);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  
  // ✅ Ref to store the Leiden clustering function from ThreeJSNetwork
  const applyLeidenClusteringRef = useRef(null);
  
  // ✅ State to trigger Leiden clustering after scene initialization
  const [triggerLeidenClustering, setTriggerLeidenClustering] = useState(0);

  
  const handleShowLabelsChange = (newValue) => {
    setShowLabels(newValue);
    console.log('🏷️ Labels display:', newValue ? 'ON' : 'OFF');
  };

  const handleLayoutChange = (newValue) => {
    setIs3DLayout(newValue);
    console.log('🎲 Layout mode:', newValue ? '3D' : '2D');
    
    // ✅ REMOVED: Aggressive WebGL cleanup - was causing scene initialization issues
    
    if (newValue) {
      console.log('🎯 Switching to 3D layout...');
      
      // ✅ NEW: Check if global 3D positions are disabled
      if (!processedNetworkData?.global3DPositions) {
        console.log('🚀 Global 3D coordinates disabled - will trigger Leiden clustering after scene initialization...');
        // Skip global 3D network, trigger Leiden clustering after scene is ready
        console.log('🔍 DEBUG: Current triggerLeidenClustering value:', triggerLeidenClustering);
        setTriggerLeidenClustering(prev => {
          console.log('🔍 DEBUG: Setting triggerLeidenClustering from', prev, 'to', prev + 1);
          return prev + 1;
        });
      }
    } else {
      console.log('📊 Switching to 2D layout...');
      // Reset trigger state when switching to 2D
      console.log('🔄 Resetting Leiden trigger state for fresh 3D switch');
      setTriggerLeidenClustering(0);
    }
  };

  // Official GraphSearch callbacks with better error handling
  const onFocus = useCallback((value) => {
    try {
      if (value === null) {
        setFocusNode(null);
      } else if (value && value.type === 'nodes') {
        setFocusNode(value.id);
        console.log('🎯 Focus set to node:', value.id);
      }
    } catch (error) {
      console.error('❌ onFocus error:', error);
    }
  }, []);

  const onChange = useCallback((value) => {
    try {
      if (value === null) {
        setSelectedNode(null);
      } else if (value && value.type === 'nodes') {
        setSelectedNode(value.id);
        console.log('🔍 Selected node:', value.id);
      }
    } catch (error) {
      console.error('❌ onChange error:', error);
    }
  }, []);

  const postSearchResult = useCallback((options) => {
    try {
      return options && options.length <= 10
        ? options
        : [
            ...(options ? options.slice(0, 10) : []),
            {
              type: 'message',
              message: <span style={{ textAlign: 'center', color: '#666' }}>And {(options?.length || 0) - 10} others</span>,
            },
          ];
    } catch (error) {
      console.error('❌ postSearchResult error:', error);
      return options || [];
    }
  }, []);

  /// ✅ Clean, optimized useEffect for data fetching
useEffect(() => {
  const fetchData = async () => {
    // Early returns for invalid states
    if (!networkData || processedNetworkData || isLoadingNetwork) return;
    
    try {
      setIsLoadingNetwork(true);
      console.log('🎯 Fetching network data once...');
      
      const networkResponse = await getCorrelationNetwork(
        networkData.sessionId,
        networkData.geneIds,
        networkData.filters
      );
      
      if (!networkResponse || !networkResponse.correlationMatrix) {
        throw new Error('Invalid network response from server');
      }
      
      // ✅ Process data in format both 2D and 3D can use
      const correlations = networkResponse.correlationMatrix.correlations || [];
      const nodeSet = new Set();
      
      correlations.forEach(corr => {
        nodeSet.add(corr.gene1);
        nodeSet.add(corr.gene2);
      });
      
      const processedData = {
        correlations,
        nodes: Array.from(nodeSet),
        nodeCount: nodeSet.size,
        edgeCount: correlations.length,
        clusterName: networkData.clusterName || 'Selected Cluster',
        rawResponse: networkResponse // Keep for any edge cases
      };

      const finalNodeCount = processedData.nodes.length;
      const originalNodeCount = networkData.geneIds?.length || finalNodeCount;
      
      // setProcessedNetworkData(processedData);
      setProcessedNetworkData({
        ...processedData,
        geneIds:       networkData.geneIds,            
        global3DPositions: networkData.global3DPositions,
        global3DPositionsStatus: networkData.isGlobal3DLoading,
        global3DError: networkData.global3DError
      });
      console.log('✅ Network data processed once:', processedData);
      
      // Trigger success notification
      if (onSuccess) {
        // onNetworkSuccess(
        //   processedData.clusterName, 
        //   processedData.nodeCount, 
        //   networkData.geneIds?.length || processedData.nodeCount
        // );
        onSuccess(networkData.clusterName, finalNodeCount, originalNodeCount);

      }
      
    } catch (error) {
      console.error('❌ Network fetch error:', error);
      const clusterName = networkData.clusterName || 'Selected Cluster';
      
      // Handle different error types
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        if (onError) {
          // onDataFetchError(clusterName);
          onError(networkData.clusterName, error.message);
        }
      } else {
        if (onError) {
          // onNetworkError(error.message, clusterName);
          onError(networkData.clusterName, error.message);
        }
      }
    } finally {
      setIsLoadingNetwork(false);
    }
  };
  
  fetchData();
}, [networkData]); // ✅ Only re-run when networkData changes



  if (!networkData) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        color: '#666'
      }}>
        <h3>No network data provided</h3>
        <p>Please select a cluster from the heatmap to visualize the network.</p>
      </div>
    );
  }

  // ✅ Add loading state
if (isLoadingNetwork || !processedNetworkData) {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      color: '#666'
    }}>
      <h3>🔄 Loading Network...</h3>
      <p>Processing correlation data...</p>
    </div>
  );
}

  return (
    <div style={{
      width: '100%',
      // height: '800px',
      // background: 'linear-gradient(135deg, #667eea 0%, #1E90FF 100%)',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      position: 'relative',
      padding: '10px',
      borderRadius: '12px',
      // boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      {/* ✅ NEW: WebGL Context Interceptor - catches ALL WebGL contexts */}
      <WebGLContextInterceptor />
      {/* ✅ NEW: WebGL Context Monitor */}
      {/* WebGL context debug display removed */}

<Paper 
  elevation={0} 
  sx={{ 
    p: '0px 8px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: 2,
    // backdropFilter: 'blur(10px)',
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: '#f8fafc', // A clean, light background

    marginBottom:'10px',
    border:'0px'
  }}
>
  {/* Left Side: Title and Info (No Changes Here) */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
      Gene Correlation Network
    </Typography>
     <Chip 
      label={networkData.clusterName} 
      size="small"
      sx={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} 
    />
    {networkData.geneIds && (
      <Chip
        icon={<AccountTreeIcon />}
        label={`${networkData.geneIds.length} genes`}
        size="small"
        variant="outlined"
      />
    )}
  </Box>

  {/* Right Side: Legend and Close Button */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    
    {/* ✅ NEW: Legend with visible text labels */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Item 1: Positive Correlation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 18, height: 4, bgcolor: '#4CAF50', borderRadius: '2px' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
          Positive
        </Typography>
      </Box>
      {/* Item 2: Negative Correlation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 18, height: 4, bgcolor: '#F44336', borderRadius: '2px' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
          Negative
        </Typography>
      </Box>
      {/* Item 3: Gene/Node */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 14, height: 14, bgcolor: '#2196F3', borderRadius: '50%', border: '1.5px solid #1976D2' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
          Node
        </Typography>
      </Box>
    </Box>

    {/* Close Button */}
    <Tooltip title="Close Network">
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    </Tooltip>
  </Box>
</Paper>
              {/* Sigma Network Container - STABLE VERSION */}
        {is3DLayout ? (
          <ThreeJSContainerWithCleanup
            sessionId={networkData.sessionId}
            contextType="network3d"
            onContextCreate={(id) => console.log('🎮 ThreeJS WebGL context created:', id)}
            onContextDestroy={(id) => console.log('🗑️ ThreeJS WebGL context destroyed:', id)}
          >
            <ThreeJSNetwork
              processedNetworkData={processedNetworkData}
              showLabels={showLabels}
              onLayoutChange={handleLayoutChange}
              is3DLayout={is3DLayout}
              selectedNode={selectedNode}
              focusNode={focusNode}
              onApplyLeidenClustering={(fn) => { applyLeidenClusteringRef.current = fn; }}
              triggerLeidenClustering={triggerLeidenClustering}
            />
          </ThreeJSContainerWithCleanup>
      ):(
      <SigmaContainerWithCleanup
        sessionId={networkData.sessionId}
        contextType={is3DLayout ? 'network3d' : 'network2d'}
        onContextCreate={(id) => console.log('🎮 Sigma WebGL context created:', id)}
        onContextDestroy={(id) => console.log('🗑️ Sigma WebGL context destroyed:', id)}
      >
        <SigmaContainer 
          style={sigmaStyle} 
          settings={{
          renderLabels: true,
          // defaultNodeSize: 8, // This will be overridden by individual node sizes
          // defaultEdgeSize: 0.5, // This will be overridden by individual edge sizes
          defaultNodeSize: 1,    // fallback → 1 px
          defaultEdgeSize: 0.1,  // fallback → 0.1 px
          labelSize: 12, // Slightly smaller
          labelColor: { color: '#000000' },
          labelWeight: 'bold',
          nodeHoverColor: '#FF5722',
          edgeHoverColor: '#9C27B0',
          labelThreshold: 0,
          labelRenderedSizeThreshold: 0,
          enableEdgeHoverEvents: true,
          enableNodeHoverEvents: true,
          labelFont: 'Arial, sans-serif',
          hideEdgesOnMove: true,
          hideLabelsOnMove: false,
          enableEdgeClickEvents: false,
          enableEdgeWheelEvents: false,
          allowInvalidContainer: true, // ✅ FIXED: Allow invalid container to prevent width errors
          renderEdgeLabels: false,
          // ✅ FIXED: Use attribute-based rendering instead of 'edge'/'node' strings
          defaultEdgeColor: '#ccc', // Fallback color only
          edgeColor: { attribute: 'color', defaultValue: '#ccc' }, // Use color attribute from edge data
          nodeColor: { attribute: 'color', defaultValue: '#2196F3' }, // Use color attribute from node data
          nodeSize: { attribute: 'size', defaultValue: 8 }, // Use size attribute from node data
          edgeSize: { attribute: 'size', defaultValue: 0.1 },
          edgeAlpha: { attribute: 'alpha', defaultValue: 0.3 }


        }}
        key="stable-sigma-container"
      >
        <LoadNetworkGraph 
          processedNetworkData={processedNetworkData}
        />
        
        {/* ✅ NEW: Auto-running ForceAtlas2 for tight clustering */}
        {/* <AutoForceAtlas2 /> */}
        
        {/* ✅ NEW: Network Legend for 2D view positioned below controls */}
        <NetworkLegend2D processedNetworkData={processedNetworkData} />
        
        {/* ✅ Focus on selected/searched node */}
        <FocusOnNode node={focusNode ?? selectedNode} />
        
        {/* ✅ Re-enable the optimized settings controller */}
        <SigmaSettingsController showLabels={showLabels} />
        
        {/* ✅ Custom Controls integrated with Sigma's control system */}
        <ControlsContainer position={'top-left'}>
          {/* Network Controls Header */}
          <div 
            className="sigma-control"
            style={{
              background: 'white',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              fontSize: '11px',
              fontWeight: '600',
              color: '#2c3e50',
              textAlign: 'center',
              letterSpacing: '0.5px',
              userSelect: 'none'
            }}
          >
            🎛️ NETWORK CONTROLS
          </div>
          
          {/* ✅ Integrated GraphSearch with proper isolation */}
          <div 
            className="sigma-control"
            style={{
              background: 'white',
              borderRadius: '4px',
              padding: '4px 6px',
              margin: '2px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              minWidth: '180px',
              position: 'relative',
              zIndex: 1000
            }}
          >
            <div style={{ 
              position: 'relative',
              isolation: 'isolate' // Prevent interference with parent containers
            }}>
              <GraphSearch
                type="nodes"
                value={selectedNode ? { type: 'nodes', id: selectedNode } : null}
                onFocus={onFocus}
                onChange={onChange}
                postSearchResult={postSearchResult}
                placeholder="🔍 Search nodes..."
                style={{
                  border: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                  padding: '2px 4px',
                  fontSize: '12px',
                  width: '100%',
                  minWidth: '160px'
                }}
              />
            </div>
          </div>
          
          <LabelToggleControl 
            onToggle={handleShowLabelsChange}
            showLabels={showLabels}
          />
          <LayoutToggleControl 
            onToggle={handleLayoutChange}
            is3DLayout={is3DLayout}
            isGlobal3DDisabled={networkData?.global3DError?.includes('disabled')}
          />
        </ControlsContainer>

        {/* Standard Controls */}
        <ControlsContainer position={'bottom-right'}>
          <ZoomControl />
          <FullScreenControl />
          {/* <LayoutForceAtlas2Control
                // ── Tell it to start immediately and never auto-stop:

                // ── FA2 parameters, tuned for micro-movements:
                settings={{
                  // almost no repulsion, so nodes only inch apart:
                  scalingRatio: 0.05,
                  // essentially zero pull to center:
                  gravity: 0.00001,
                  // enormous damping → each step is minuscule:
                  slowDown: 1000,
                  // ignore edge weights nearly completely:
                  edgeWeightInfluence: 0.001,

                  // keep the pure O(n²) solver so forces don’t shortcut:
                  barnesHutOptimize: false,
                  // stay in the classic force-directed model:
                  strongGravityMode: false,
                  linLogMode: false,
                  outboundAttractionDistribution: false,
                  // don’t auto-resize nodes:
                  adjustSizes: false,
                }}
              /> */}

              <SlowLayoutControl />

        </ControlsContainer>
        
        {/* MiniMap moved to top-right */}
        <ControlsContainer position={'top-right'}>
          <MiniMap width="100px" height="100px" />
        </ControlsContainer>
        
      </SigmaContainer>
      </SigmaContainerWithCleanup>)
      }
    </div>
  );
};

export default NetworkVisualizationComponent;