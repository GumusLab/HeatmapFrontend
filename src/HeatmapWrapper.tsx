import * as React from 'react';
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import 'react-app-polyfill/ie11';
import { DeckGLHeatmap } from './DeckGLHeatmap';
import './wrapper.css';
import { CircularProgress, Typography } from '@mui/material';
import { getEnrichmentData, processHeatmapData, processWithStrategy,get3DCoords } from "./backendApi/heatmapData";
import NetworkVisualizationComponent from './components/pages/NetworkVisualizationPage';
import { useAppNotifications, AppNotificationSystem } from './hooks/useAppNotifications';
import { useHeatmapEvents } from './hooks/useHeatmapEvents'
import { useWebGLContextManager } from './components/WebGLContextManager';

import PathwayAnalysisView from './components/pages/PathwayAnalysisView';
import ImputationStrategySelector from './components/pages/ImputationStrategySelector';


type CategoryType = {
  row: Record<string, any>;
  col: Record<string, any>;
};

interface HeatmapWrapperProps {
  data: any;
  id: string;
  fileSelectedFlag: boolean;
  homepage: boolean;
  cat?: CategoryType;
  onSessionReady?: (sessionId: string) => void;
  onStatsUpdate?: (stats: { sampleSize: number; dataPoints: number }) => void;
}

const HeatmapWrapper: React.FC<HeatmapWrapperProps> = ({
  data,
  id,
  fileSelectedFlag,
  homepage,
  cat = { row: {}, col: {} },
  onSessionReady,
  onStatsUpdate
}) => {
 
  // --- Hooks and State Management ---
 const appNotifications = useAppNotifications();
 const { registerExternalContext, unregisterContext } = useWebGLContextManager();
 const deckglContextId = useRef<string | null>(null);
 const {
   notifyDataLoading,
   notifyDataSuccess,
   notifyDataError,
   notifyClusteringStarted,
    notifyClusteringSuccess,
    notifySortStarted,
    notifySortSuccess
 } = useHeatmapEvents(appNotifications);

 const {
  notifications,
  isLoading,
  loadingMessage,
  addNotification,
  removeNotification,
  showLoading,
  hideLoading,
 } = appNotifications;

  const containerRef = useRef<HTMLDivElement>(null); // Ref for the main container
  const heatmapDataRef = useRef<any>(null); // Stores large data without causing re-renders
  const [heatmapVersion, setHeatmapVersion] = useState(0); // Triggers re-render when data updates
  const [categories, setCategories] = useState(cat);
  const [resultValueType, setResultValueType] = useState("logFC");
  const [resultCat, setResultCat] = useState("Timepoints");
  const [valScale, setValScale] = useState(
    ['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap'].includes(id) ? 'Zscore' : 'None'
  );
  
  const hasProcessedRef = useRef(false);
  const sessionId = useRef("");

  const [showNetwork, setShowNetwork] = useState(false);
  const [networkData, setnetworkData] = useState<any>({});
  const [showPathwayView, setShowPathwayView] = useState(false);
  const [pathwayAnalysisData, setPathwayAnalysisData] = useState<any>(null);
  const [showStrategySelection, setShowStrategySelection] = useState(false);
  const [missingValueSummary, setMissingValueSummary] = useState(null);


  // Useref to store the large coordinate data
  const global3DPositionsRef = useRef<Record<string, { x: number; y: number; z: number }> | null>(null);
  // Use state to signal when the data in the ref is ready (lightweight re-render trigger)
  const [isGlobal3DPositionsReady, setIsGlobal3DPositionsReady] = useState(false);
  const [global3DLoadingStatus, setGlobal3DLoadingStatus] = useState<'idle' | 'pending' | 'computing' | 'ready' | 'failed' | 'disabled'>('idle');
  const global3DTaskPollingId = useRef<NodeJS.Timeout | null>(null); // For polling cleanup
  const global3DLoadingNotificationId = useRef<number | null>(null); 




  // --- Handlers for Events from DeckGLHeatmap ---

  const handleScrollToAction = (targetSelector: string): void => {
    const element = document.querySelector(targetSelector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // const handleShowNetwork = (clusterData: any) => {
  //   const clusterName = `Cluster ${clusterData.metadata.clusterId || ''}`.trim();
  //   addNotification({ type: 'info', title: `Preparing Network`, message: `Opening the gene correlation network view for ${clusterName}.`, duration: 3000 });
  //   const formattedNetworkData = { ...clusterData, clusterName, sessionId: sessionId.current, geneIds: clusterData.geneIds || clusterData.genes || [], filters: clusterData.filters || {} };
  //   setnetworkData(formattedNetworkData);
  //   setShowNetwork(true);
  // };

  const handleShowNetwork = (clusterData: any) => {
    const clusterName = `Cluster ${clusterData.metadata.clusterId || ''}`.trim();
    addNotification({ type: 'info', title: `Preparing Network`, message: `Opening the gene correlation network view for ${clusterName}.`, duration: 3000 });
    
    // ✅ Add small delay to prevent rapid re-renders
    setTimeout(() => {
      const formattedNetworkData = { 
        ...clusterData, 
        clusterName, 
        sessionId: sessionId.current, 
        geneIds: clusterData.geneIds || clusterData.genes || [], 
        filters: clusterData.filters || {},
        global3DPositions: global3DPositionsRef.current,
        isGlobal3DLoading: (global3DLoadingStatus === 'pending' || global3DLoadingStatus === 'computing'),
        global3DError: global3DLoadingStatus === 'failed' ? "Failed to load 3D layout." : 
                        global3DLoadingStatus === 'disabled' ? "3D layout generation is disabled on the server." : null
      };
      setnetworkData(formattedNetworkData);
      setShowNetwork(true);
    }, 100); // Small delay to prevent rapid updates
  };

  const handleNetworkSuccess = (clusterName: string, nodeCount: number, originalCount?: number) => {
    hideLoading();
    let message = `Network with ${nodeCount} nodes created for ${clusterName}.`;
    if (originalCount && originalCount > nodeCount) {
      message = `Network created for ${clusterName}. Displaying ${nodeCount} of ${originalCount} genes after filtering.`;
    }
    addNotification({ type: 'success', title: 'Network Ready! 🎉', message, duration: 3000 });
    // Auto-scroll to network section
    setTimeout(() => {
      const networkSection = document.querySelector('[data-network-section]');
      if (networkSection) {
        networkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleNetworkError = (clusterName: string, errorMsg: string) => {
    hideLoading();
    addNotification({ type: 'error', title: 'Network Failed ❌', message: `Could not create network for ${clusterName}: ${errorMsg}` });
  };

  const handleHideNetwork = () => {
    setShowNetwork(false);
    setnetworkData({});
    
    // ✅ NEW: Force cleanup of WebGL contexts
    setTimeout(() => {
      // Force garbage collection of WebGL contexts
      if (window.gc) {
        window.gc();
      }
      
      // Clear any remaining WebGL contexts
      const canvas = document.querySelector('canvas[data-sigma-container]') as HTMLCanvasElement;
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      }
    }, 100);
  };

  const handleShowPathwayAnalysis = async (clusterData: any) => {
    const clusterName = `Cluster ${clusterData.metadata.clusterId || ''}`.trim();
    const genes = clusterData.genes || clusterData.nodes;
    showLoading(`Running enrichment analysis for ${clusterName}...`);
    setShowPathwayView(true);

    try {
      const results = await getEnrichmentData(genes, sessionId.current);
      setPathwayAnalysisData({ clusterName, enrichmentResults: results });
      addNotification({ type: 'success', title: 'Analysis Complete!', message: `Enrichment results for ${clusterName} are ready to view.`, duration: 3000 });
      // Auto-scroll to pathway section
      setTimeout(() => {
        const pathwaySection = document.querySelector('[data-pathway-section]');
        if (pathwaySection) {
          pathwaySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Analysis Failed', message: error.message || `Could not fetch results for ${clusterName}.` });
      setShowPathwayView(false);
    } finally {
      hideLoading();
    }
  };

  const handleHidePathwayAnalysis = () => {
    setShowPathwayView(false);
    setPathwayAnalysisData(null);
  };

  const handleStrategySelection = async (strategy: string, parameters: any) => {
    try {
      setShowStrategySelection(false);
      notifyDataLoading();
      const response = await processWithStrategy(sessionId.current, strategy, parameters);
      console.log('******** response is as follows ********',response)
      heatmapDataRef.current = { ...response.heatmap_data, file_name: id };
      setHeatmapVersion((v) => v + 1);
      notifyDataSuccess(id);
    } catch (error: any) {
      notifyDataError(error.message || 'An unknown error occurred.');
    }
  };

  // --- Main Data Processing Effect ---
  useEffect(() => {
    if (fileSelectedFlag && data && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      notifyDataLoading();
      processHeatmapData(data)
        .then((response) => {
          const { session_id, has_missing_values,global_3d_positions_status } = response;
          if (session_id && onSessionReady) {
            sessionId.current = session_id;
            onSessionReady(session_id);
          }
          if (has_missing_values) {
            setMissingValueSummary(response.missing_value_summary);
            setShowStrategySelection(true);
            notifyDataError('Missing values found');
          } else {
            heatmapDataRef.current = { ...response.heatmap_data, file_name: id };
            setHeatmapVersion((v) => v + 1);
            notifyDataSuccess(id);

             // --- NEW: Handle 3D global positions async status ---
             setGlobal3DLoadingStatus(global_3d_positions_status); // Update status state
             if (global_3d_positions_status === 'pending' || global_3d_positions_status === 'computing') {
              // const notificationId = addNotification({ type: 'info', title: '3D Layout', message: 'Generating 3D network layout in the background...', autoHide: false });
              // global3DLoadingNotificationId.current = notificationId; // Store ID in ref
              startPolling3DCoords(session_id);
             } else if (global_3d_positions_status === 'ready') {
               fetch3DCoords(session_id); // Fetch immediately if already ready
             } else if (global_3d_positions_status === 'failed') {
              //  addNotification({ type: 'error', title: '3D Layout Failed', message: 'Could not generate global 3D network layout.', duration: 5000 });
             } else if (global_3d_positions_status === 'disabled') {
               console.log('ℹ️ 3D coordinate generation is disabled on the server');
               // No polling or fetching needed - 3D features will be unavailable
             }
          }
        })
        .catch((error) => {
          // Handle duplicate upload errors gracefully
          if (error.message === 'DUPLICATE_UPLOAD_DETECTED') {
            console.log('🔄 Duplicate upload detected - this is expected behavior');
            console.log('   The server prevented duplicate processing after browser auto-retry');
            
            // Show a user-friendly message instead of an error
            addNotification({ 
              type: 'info', 
              title: 'Upload In Progress', 
              message: 'Your file upload is being processed. Please wait for the results to appear.',
              duration: 5000
            });
            return;
          }
          notifyDataError(error.message || 'An unknown error occurred.');
        });
    } else if (!fileSelectedFlag && homepage && data) {
        heatmapDataRef.current = data;
        sessionId.current = id;
        setHeatmapVersion((v) => v + 1);
    }
  }, [fileSelectedFlag, data, homepage, id]);

  // ✅ NEW: Register DeckGL context once when component mounts
  useEffect(() => {
    // Only register if we don't already have a context ID and we have a session ID
    if (!deckglContextId.current && sessionId.current) {
      deckglContextId.current = registerExternalContext('heatmap', sessionId.current);
      console.log('🎮 DeckGL context registered:', deckglContextId.current);
    }
    
    // Cleanup function runs when component unmounts
    return () => {
      if (deckglContextId.current) {
        console.log('🗑️ DeckGL context unregistering:', deckglContextId.current);
        unregisterContext(deckglContextId.current);
        deckglContextId.current = null;
      }
    };
  }, [sessionId.current]); // Re-run when sessionId changes


    // --- NEW: Polling and Fetching Functions for 3D Coords ---
    const fetch3DCoords = useCallback(async (currentSessionId: string) => {
      setGlobal3DLoadingStatus('computing'); // Set status to computing while fetching
      try {
        const response = await get3DCoords(currentSessionId); // Use the imported get3DCoords function
  
        if (response.status === 'ready') {
          global3DPositionsRef.current = response.global_3d_positions; // Store in ref
          setIsGlobal3DPositionsReady(true); // Signal readiness via state
          setGlobal3DLoadingStatus('ready'); // Update status state
          // addNotification({ type: 'success', title: '3D Layout Ready! 🎉', message: 'Global 3D network layout is now available.', duration: 3000 });
          if (global3DTaskPollingId.current) {
            clearInterval(global3DTaskPollingId.current);
            global3DTaskPollingId.current = null;
          }
          // if (global3DLoadingNotificationId.current !== null) { // Check if it holds an ID
          //   removeNotification(global3DLoadingNotificationId.current); // Use removeNotification
          //   global3DLoadingNotificationId.current = null;
          // }
  
        } else if (response.status === 'computing' || response.status === 'pending') {
          // Still computing, keep polling (no direct action here, polling interval handles it)
          setGlobal3DLoadingStatus(response.status); // Keep status updated
          console.log(`3D layout for session ${currentSessionId} is still ${response.status}.`);
        } else {
          // Failed or other unexpected status
          setGlobal3DLoadingStatus('failed'); // Update status state
          // addNotification({ type: 'error', title: '3D Layout Failed', message: response.message || 'Failed to generate global 3D network layout.', duration: 5000 });
          // Clear polling interval on failure
          if (global3DTaskPollingId.current) {
            clearInterval(global3DTaskPollingId.current);
            global3DTaskPollingId.current = null;
          }
          if (global3DLoadingNotificationId.current !== null) { // Check if it holds an ID
            removeNotification(global3DLoadingNotificationId.current); // Use removeNotification
            global3DLoadingNotificationId.current = null;
          }
        }
      } catch (error: any) {
        setGlobal3DLoadingStatus('failed'); // Update status state
        // addNotification({ type: 'error', title: '3D Layout Error', message: `Network error fetching 3D layout: ${error.message}`, duration: 5000 });
        // Clear polling interval on network error
        if (global3DTaskPollingId.current) {
          clearInterval(global3DTaskPollingId.current);
          global3DTaskPollingId.current = null;
        }

        if (global3DLoadingNotificationId.current !== null) { // Check if it holds an ID
          removeNotification(global3DLoadingNotificationId.current); // Use removeNotification
          global3DLoadingNotificationId.current = null;
        }
      }
    }, [addNotification,removeNotification]); 

  const startPolling3DCoords = useCallback((currentSessionId: string) => {
    // Clear any existing polling to prevent duplicates
    if (global3DTaskPollingId.current) {
      clearInterval(global3DTaskPollingId.current);
    }
    // Poll every 3 seconds (adjust as needed)
    global3DTaskPollingId.current = setInterval(() => {
      fetch3DCoords(currentSessionId);
    }, 3000); // Poll every 3 seconds
  }, [fetch3DCoords]); // Add fetch3DCoords to useCallback dependencies

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (global3DTaskPollingId.current) {
        clearInterval(global3DTaskPollingId.current);
        global3DTaskPollingId.current = null;
      }
    };
  }, []); // Empty dependency array means this runs on mount and unmount




  // Determine if the heatmap can be shown
  const canShowHeatmap = !showStrategySelection && heatmapDataRef.current && containerRef.current;

  // ✅ Memoize network data to prevent unnecessary re-renders
  const memoizedNetworkData = useMemo(() => {
    if (!networkData || Object.keys(networkData).length === 0) {
      console.log('🔄 Network data is empty, returning null');
      return null;
    }
    
    const memoized = {
      sessionId: networkData.sessionId,
      geneIds: networkData.geneIds,
      clusterName: networkData.clusterName,
      filters: networkData.filters,
      global3DPositions: networkData.global3DPositions,
      isGlobal3DLoading: networkData.isGlobal3DLoading,
      global3DError: networkData.global3DError,
      metadata: networkData.metadata
    };
    
    console.log('🔄 Memoized network data created:', {
      sessionId: memoized.sessionId,
      clusterName: memoized.clusterName,
      geneCount: memoized.geneIds?.length
    });
    
    return memoized;
  }, [
    networkData?.sessionId,
    networkData?.clusterName,
    JSON.stringify(networkData?.geneIds),
    JSON.stringify(networkData?.filters),
    networkData?.global3DPositions,
    networkData?.isGlobal3DLoading,
    networkData?.global3DError,
    networkData?.metadata
  ]);

return (
  <>
    {showStrategySelection && missingValueSummary && (
      <div className="modal-overlay">
        <div className="modal-content">
          <ImputationStrategySelector 
            missingValueSummary={missingValueSummary}
            onStrategySelect={handleStrategySelection}
            isProcessing={isLoading}
          />
        </div>
      </div>
    )}

    {/* MAIN CONTAINER - This is what gets the ref and contains everything */}
    <div
      id={id}
      ref={containerRef}
      style={{
        width: "100%",
        // ❌ Remove height: "100%" - this was constraining it
        // ✅ Let it grow naturally with content
        minHeight: "100%", // Start with full height but allow growth
        position: "relative",
        display: "flex",
        flexDirection: "column", // ✅ Stack content vertically
      }}
    >
      {/* HEATMAP SECTION - Always visible */}
      <div
        style={{
          width: "100%",
          minHeight: "95%", // Heatmap takes at least full viewport
          flex: "0 0 auto", // Don't shrink
          position: "relative",
          marginBottom: showNetwork || showPathwayView ? "20px" : "50px" // Less margin when network is shown
        }}
      >
                {canShowHeatmap ? (
          <DeckGLHeatmap
            key={heatmapVersion}
            data={heatmapDataRef.current}
            dataId={id}
            container={containerRef.current!}
            position="relative"
            categories={categories}
            setValueScale={['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap'].includes(id) ? setValScale : setResultValueType}
            setResultCategory={setResultCat}
            resultCategories={['Timepoints', 'ARMs', 'Response']}
            valueScale={valScale}
            legend={{ width: 175 - 20, height: 30 }}
            labels={{ row: { maxSize: 15, titleSize: 8, maxChars: 10 }, column: { maxSize: 5, titleSize: 8, maxChars: 10, angle: 45 }}}
            valueType={resultValueType}
            panelWidth={200}
            sessionID={sessionId.current}
            onShowNetwork={handleShowNetwork}
            onShowPathwayNetwork={handleShowPathwayAnalysis}
            notifyClusteringStarted={notifyClusteringStarted}
            notifyClusteringSuccess={notifyClusteringSuccess}
            notifySortStarted={notifySortStarted}
            notifySortSuccess={notifySortSuccess}
            showLoading={showLoading}
            hideLoading={hideLoading}
            addNotification={addNotification}
            onStatsUpdate={onStatsUpdate}
          />
        ) : (
          !showStrategySelection && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </div>
          )
        )}
      </div>

      {/* NETWORK SECTION - Shows below heatmap when open */}
      {!showStrategySelection && showNetwork && networkData && (
        <div 
          data-network-section 
          style={{
            width: "100%",
            minHeight: "100vh", // Network takes full viewport when shown
            flex: "0 0 auto", 
            borderTop: "2px solid #e9ecef", // Optional: separator
            position: "relative",
            marginTop: "20px"
          }}
        >

          
          <NetworkVisualizationComponent 
            key={`network-${memoizedNetworkData?.sessionId}-${memoizedNetworkData?.clusterName}`}
            networkData={memoizedNetworkData}
            onClose={handleHideNetwork}
            onSuccess={handleNetworkSuccess}
            onError={handleNetworkError}
          />
        </div>
      )}

      {/* PATHWAY SECTION - Shows below heatmap when open */}
      {!showStrategySelection && showPathwayView && (
        <div
          data-pathway-section
          style={{
            width: "100%",
            minHeight: "100vh", // Pathway takes full viewport when shown
            flex: "0 0 auto",
            backgroundColor: "#f1f3f4",
            borderTop: "2px solid #e9ecef",
            paddingTop: "20px", // Space between heatmap and pathway
            position: "relative"
          }}
        >
          {pathwayAnalysisData && (
            <PathwayAnalysisView
              analysisData={pathwayAnalysisData}
              onClose={handleHidePathwayAnalysis}
            />
          )}
        </div>
      )}
    </div>



    <AppNotificationSystem
      notifications={notifications}
      isLoading={isLoading}
      loadingMessage={loadingMessage}
      onRemove={removeNotification}
      onActionClick={handleScrollToAction}
    />
  </>
);
};

export default HeatmapWrapper;