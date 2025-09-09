import DeckGL from '@deck.gl/react/typed';
import jsPDF from 'jspdf';
import { merge } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeckGLHeatmapProps } from './DeckGLHeatmap.types';
import { generateTooltipContent } from './GenerateTooltip';
import ClusterInfoBox from './components/HoverTable';
import Legend2 from './components/Legend2';
import PersistentDrawerLeft from './components/Panel';
import CustomSlider from './components/Slider';
import { DEFAULT_LABEL_OFFSET, MAX_CATEGORIES, OPACITY,HEATMAP_PARENT_HEIGHT_RATIO, HEATMAP_PARENT_WIDTH_RATIO, HEATMAP_WIDTH, HEATMAP_HEIGHT, IDS, BASE_ZOOM, INITIAL_GAP, LAYER_GAP } from './const';
import { layerFilter } from './layerFilter';
import { getLayers } from './layers/getLayers';
import { useDimensions } from './state/useDimensions';
import { useLabelState } from './state/useLabelState';
import { useViewStates } from './state/useViewStates';
import { useViews } from './state/useViews';
import getTextWidth from './utils/getTextWidth';
import {callChatGPT} from './backendApi/openAi'
import {queryOllama} from './backendApi/ollama'
import { DataStateShape, HeatmapStateShape } from './types';
import { CATEGORY_LAYER_HEIGHT } from "./const";
import { createDataWorker } from './utils/workerFactory';
import { dataWorkerCode } from './workers/data-worker-string';
import HeatmapMinimap from './Heatmapminimap';
import {getRefreshHeatmap} from './backendApi/heatmapData'
import ChatBox from './components/ChatBox';
import ToastNotification from './components/ToastNotification';
import { OperatorNodeDependencies } from 'mathjs';
import { usePrevious } from './hooks/usePrevious';
import PathwaySelector from './components/PathwaySelector';


// NOTE: center of the screen is 0, 0,
//       to center a cell you would place it at [-CELL_SIZE / 2, -CELL_SIZE / 2]

// NOTE: z is cut in half for each zoom level

/**
 * DeckGLHeatmap -- for all your squares and labels needs
 */
function capitalizeFirstLetter(str: string): string {
  const lowerCaseString = str.toLowerCase();
  return lowerCaseString.charAt(0).toUpperCase() + lowerCaseString.slice(1);
}


interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// interface BorderRect {
//   left: number;
//   top: number;
//   width: number;
//   height: number;
// }

let workerCount = 0;


export const DeckGLHeatmap = ({
  data,
  dataId,
  container,
  debug = false,
  labels,
  onClick,
  tooltipFunction,
  legend,
  position,
  deckglProps,
  rowLabelsTitle,
  columnLabelsTitle,
  categories,
  // ord,
  resultCategories,
  setResultCategory,
  setValueScale,
  valueScale,
  valueType,
  panelWidth,
  sessionID,
  onShowNetwork,
  onShowPathwayNetwork,
  notifyClusteringStarted,
  notifyClusteringSuccess,
  notifySortStarted,
  notifySortSuccess,
  showLoading,
  hideLoading,
  addNotification,
  pvalData
}: DeckGLHeatmapProps) => {


  interface Coords{
    x: number,
    y: number
  }
  interface Area{
    start: undefined | Coords;
    end: undefined | Coords;
  }

  const [{ colLabelsWidth, rowLabelsWidth }, setLabelsState] = useState({
    colLabelsWidth: 0,
    rowLabelsWidth: 0,
  });
  const [colClustGroup,setColClusterValue] = useState(5);
  const [rowClustGroup,setRowClusterValue] = useState(5);
  const [OpacityValue,setOpacityValue] = useState(OPACITY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [order, setOrder] = useState({row:"alphabetically",col:"alphabetically",rowCat: [] as string[],sortByRowCat:"",colCat: [] as string[],sortByColCat:""});
  // const [order, setOrder] = useState();
  // const [catTemp, setCatTemp] = useState(categories);
  const [searchTerm,setSearchTerm] = useState("");
  const [pvalThreshold,setPvalThreshold] = useState(0.05);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [clickedClusterData, setClickedClusterData] = useState<any|null>(null);
  const [isHovering, setHovering] = useState(true)
  const containerRefDeckgl = useRef<any>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox|null>(null);
  const [isCropping, setIsCropping] = useState(false); // For enabling cropping mode
  const heatmapRef = useRef(null);  // Reference to the heatmap container
  const [filteredIdxDict,setFilteredIdxDict] = useState<CropBox|null>(null);

  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);


  const dataStateRef = useRef<DataStateShape | null>(null);
  const heatmapStateRef = useRef<HeatmapStateShape | null>(null);
  const workerRef = useRef<Worker | null>(null);
    // Two separate lightweight version counters
  const [datastateVersion, setDataStateVersion] = useState(0);
  const [heatmapstateVersion, setHeatmapStateVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0)
  const filteredData = useRef<any>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [showPathwaySelector, setShowPathwaySelector] = useState(false);
  const [pathwayResults, setPathwayResults] = useState([]);
  const [lastSearchQuery, setLastSearchQuery] = useState("");


  const [filters, setFilters] = useState<any>({
    row: [],   
    col: []    
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const previousOrder = usePrevious(order);




  tooltipFunction = generateTooltipContent

  


const stableOnClick = useMemo(() => ({
  heatmapCell: (info: any, event: any) => {
      // Handle internal logic first
      if (info?.id === "row-cluster") {
          setClickedClusterData({ Nodes: info.nodes, Group: info.text });
          setIsTableVisible(true);
      }
      // Then, call the handler passed from the parent if it exists
      onClick?.heatmapCell?.(info, event);
  },
  rowLabel: onClick?.rowLabel,
  columnLabel: onClick?.columnLabel,
}), [onClick]); // This now correctly depends on the prop from the parent.



// 3. Add these functions after your existing functions
const handlePathwaySelect = async (selectedPathway) => {
  setShowPathwaySelector(false);
  
  // Show loading while processing pathway selection
  showLoading(`Filtering heatmap to show genes from ${selectedPathway.name}...`);
  
  try {
    // Send the selected pathway back to the backend to get filtered data
    const filterMessage = `show genes from pathway: ${selectedPathway.name}`;
    const res = await queryOllama(filterMessage, sessionID, filters, commandHistory);
    
    hideLoading();
    
    if ("error" in res) {
      addNotification({ 
        type: 'error', 
        title: 'Pathway Filter Error', 
        message: `Could not filter by pathway: ${res.error}`, 
        autoHide: false 
      });
      return;
    }
    
    // Handle the filtered data response
    if (res.clustering_result) {
      addNotification({
        type: 'success',
        title: 'Pathway Applied',
        message: `Heatmap filtered to show ${selectedPathway.gene_count} genes from "${selectedPathway.description}"`,
        duration: 5000,
      });
      
      const parsedResult = typeof res.clustering_result === 'string' 
        ? JSON.parse(res.clustering_result) 
        : res.clustering_result;
      
      filteredData.current = parsedResult;
      setDataVersion(prev => prev + 1);
    }
    
    // Update command history
    setCommandHistory((prev) => [...prev, filterMessage]);
    
  } catch (error) {
    hideLoading();
    addNotification({
      type: 'error',
      title: 'Pathway Selection Error',
      message: error.message || 'Could not apply pathway filter',
      autoHide: false
    });
  }
};

const handlePathwaySelectorClose = () => {
  setShowPathwaySelector(false);
  setPathwayResults([]);
  setLastSearchQuery("");
};

// 4. Update your existing handleOllamaSendClick function
// Replace your existing handleOllamaSendClick function with this updated version:
const handleOllamaSendClick = async (message: string): Promise<{ success: boolean; message: string }> => {
  if (!message.trim()) {
    throw new Error("Please enter a command");
  }

  // ✅ STEP 1: Show a loading bar for the AI interaction
  showLoading(`Sending command to AI Assistant...`);

  try {
    const res = await queryOllama(message, sessionID, filters, commandHistory);
    hideLoading(); // Hide loading bar as soon as AI responds

    console.log('***** res is as follows *******',res)

    // --- Handle Errors from AI/Backend ---
    if ("error" in res) {
        const errorMessage = `Sorry, I couldn't process that. ${res.error}`;
        addNotification({ type: 'error', title: 'Command Error', message: errorMessage, autoHide: false });
        return { success: false, message: errorMessage };
    }
    if (!("action" in res)) {
        const errorMessage = "I couldn't determine an action from your command. Please try rephrasing.";
        addNotification({ type: 'error', title: 'Command Unclear', message: errorMessage, autoHide: false });
        throw new Error(errorMessage);
    }
    
    const { action, target, value = "", updated_filters, clustering_result, pathway_results } = res;
    
    // ✅ NEW: Handle pathway search results
    if (action === "pathway_search" && pathway_results) {
        setPathwayResults(pathway_results);
        setLastSearchQuery(value || message.replace(/show me |list |find /gi, '')); // Clean up the query for display
        setShowPathwaySelector(true);
        addNotification({
            type: 'success',
            title: 'Pathways Found',
            message: `Found ${pathway_results.length} pathways. Please select one to filter your heatmap.`,
            duration: 3000,
        });
        setCommandHistory((prev) => [...prev, message]);
        return { success: true, message: "Pathway search completed" };
    }
    
    // ✅ STEP 2: Check if the backend sent a new data payload
    if (clustering_result) {
        // --- This was a "Data Subsetting" Command (e.g., filter, variance) ---
        addNotification({
            type: 'info',
            title: 'Applying New Data',
            message: 'Backend processing complete. Applying new data and re-rendering the heatmap...',
            duration: 4000,
        });

        const parsedResult = typeof clustering_result === 'string' 
            ? JSON.parse(clustering_result) 
            : clustering_result;
        
        filteredData.current = parsedResult;
        setDataVersion(prev => prev + 1); // This will trigger the worker and its own notifications

    } else {
        // --- This was a "View State" Command (e.g., sort, cluster, search) ---
        // We just update the local state. The regular notification system will take over.
        if (action === "search") {
            setSearchTerm(value);
        } else if (action === "sort" || action === "cluster") {
            // The existing notifySortStarted/notifyClusteringStarted will be called
            // automatically when the setOrder state change is detected.
            if (target === "rows") {
                setOrder((prev) => ({ ...prev, row: value || 'cluster', sortByRowCat: "" }));
            } else if (target === "columns" || target === "cols") {
                setOrder((prev) => ({ ...prev, col: value || 'cluster', sortByColCat: "" }));
            }
        } else if (action === "sort_by_meta") {
            if (target === "rows") {
                setOrder((prev) => ({ ...prev, row: "", sortByRowCat: value }));
            } else if (target === "columns" || target === "cols") {
                setOrder((prev) => ({ ...prev, col: "", sortByColCat: value }));
            }
        } else if (action === "set_opacity") {
            // Parse the opacity value from the command
            let newOpacityValue = OpacityValue; // Start with current value
            
            // Define opacity range (from Panel.tsx slider configuration)
            const MIN_OPACITY = 0.5;
            const MAX_OPACITY = 3.0;
            const OPACITY_STEP = 0.5;
            
            if (value) {
                // Handle relative descriptive values
                if (value.toLowerCase() === "dark") {
                    // Increase opacity by one step, but don't exceed maximum
                    newOpacityValue = Math.min(MAX_OPACITY, OpacityValue + OPACITY_STEP);
                } else if (value.toLowerCase() === "light") {
                    // Decrease opacity by one step, but don't go below minimum
                    newOpacityValue = Math.max(MIN_OPACITY, OpacityValue - OPACITY_STEP);
                } else if (value.toLowerCase() === "medium" || value.toLowerCase() === "normal") {
                    newOpacityValue = 1.0; // Reset to default
                } else if (value.toLowerCase() === "transparent") {
                    newOpacityValue = MIN_OPACITY; // Set to minimum
                } else if (value.toLowerCase() === "maximum" || value.toLowerCase() === "max") {
                    newOpacityValue = MAX_OPACITY; // Set to maximum
                } else {
                    // Handle numeric values
                    const numericValue = parseFloat(value.replace('%', ''));
                    if (!isNaN(numericValue)) {
                        if (value.includes('%')) {
                            // Percentage: convert to decimal (50% -> 0.5)
                            newOpacityValue = numericValue / 100;
                        } else {
                            // Direct numeric value
                            newOpacityValue = numericValue;
                        }
                        // Clamp to valid range
                        newOpacityValue = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, newOpacityValue));
                    }
                }
            }
            
            // Create informative message
            let changeDescription = "";
            if (value.toLowerCase() === "dark") {
                changeDescription = newOpacityValue === MAX_OPACITY ? " (maximum reached)" : " (darker)";
            } else if (value.toLowerCase() === "light") {
                changeDescription = newOpacityValue === MIN_OPACITY ? " (minimum reached)" : " (lighter)";
            } else {
                changeDescription = ` (${value})`;
            }
            
            setOpacityValue(newOpacityValue);
            addNotification({
                type: 'info', 
                title: 'Visuals Updated', 
                message: `Opacity: ${OpacityValue.toFixed(1)} → ${newOpacityValue.toFixed(1)}${changeDescription}`
            });
        }
    }

    // Update filters and command history for non-pathway commands
    if (updated_filters) {
        setFilters(updated_filters);
    }
    if (action !== "pathway_search") { // Don't duplicate command history for pathway searches
        setCommandHistory((prev) => [...prev, message]);
    }

    return { success: true, message: "Command processed" };

  } catch (error: any) {
    hideLoading(); // Ensure loading is hidden on error
    addNotification({
        type: 'error',
        title: 'An Unexpected Error Occurred',
        message: error.message || 'Could not complete the request.',
        autoHide: false
    });
    throw error;
  }
};

// const handleOllamaSendClick = async (message: string): Promise<{ success: boolean; message: string }> => {
//   if (!message.trim()) {
//     throw new Error("Please enter a command");
//   }

//   // ✅ STEP 1: Show a loading bar for the AI interaction
//   showLoading(`Sending command to AI Assistant...`);

//   try {
//     const res = await queryOllama(message, sessionID, filters, commandHistory);
//     hideLoading(); // Hide loading bar as soon as AI responds

//     console.log('***** res is as follows *******',res)

//     // --- Handle Errors from AI/Backend ---
//     if ("error" in res) {
//         // ... (your existing, excellent error parsing logic) ...
//         const errorMessage = `Sorry, I couldn't process that. ${res.error}`;
//         addNotification({ type: 'error', title: 'Command Error', message: errorMessage, autoHide: false });
//         return
//         // throw new Error(errorMessage);
//     }
//     if (!("action" in res)) {
//         const errorMessage = "I couldn't determine an action from your command. Please try rephrasing.";
//         addNotification({ type: 'error', title: 'Command Unclear', message: errorMessage, autoHide: false });
//         throw new Error(errorMessage);
//     }
    
//     const { action, target, value = "", updated_filters, clustering_result } = res;
    
//     // ✅ STEP 2: Check if the backend sent a new data payload
//     if (clustering_result) {
//         // --- This was a "Data Subsetting" Command (e.g., filter, variance) ---
//         addNotification({
//             type: 'info',
//             title: 'Applying New Data',
//             message: 'Backend processing complete. Applying new data and re-rendering the heatmap...',
//             duration: 4000,
//         });

//         const parsedResult = typeof clustering_result === 'string' 
//             ? JSON.parse(clustering_result) 
//             : clustering_result;
        
//         filteredData.current = parsedResult;
//         setDataVersion(prev => prev + 1); // This will trigger the worker and its own notifications

//     } else {
//         // --- This was a "View State" Command (e.g., sort, cluster, search) ---
//         // We just update the local state. The regular notification system will take over.
//         if (action === "search") {
//             setSearchTerm(value);
//         } else if (action === "sort" || action === "cluster") {
//             // The existing notifySortStarted/notifyClusteringStarted will be called
//             // automatically when the setOrder state change is detected.
//             if (target === "rows") {
//                 setOrder((prev) => ({ ...prev, row: value || 'cluster', sortByRowCat: "" }));
//             } else if (target === "columns" || target === "cols") {
//                 setOrder((prev) => ({ ...prev, col: value || 'cluster', sortByColCat: "" }));
//             }
//         } else if (action === "sort_by_meta") {
//             if (target === "rows") {
//                 setOrder((prev) => ({ ...prev, row: "", sortByRowCat: value }));
//             } else if (target === "columns" || target === "cols") {
//                 setOrder((prev) => ({ ...prev, col: "", sortByColCat: value }));
//             }
//         } else if (action === "set_opacity") {
//             // Your existing opacity logic...
//             let newOpacityValue = 1.0; // Placeholder
//             setOpacityValue(newOpacityValue);
//             addNotification({type: 'info', title: 'Visuals Updated', message: `Opacity set to ${newOpacityValue.toFixed(1)}`});
//         }
//     }

//     // Update filters and command history regardless of the command type
//     if (updated_filters) {
//         setFilters(updated_filters);
//     }
//     setCommandHistory((prev) => [...prev, message]);

//     return { success: true, message: "Command processed" };

//   } catch (error: any) {
//     hideLoading(); // Ensure loading is hidden on error
//     // The error notification is now handled by the logic above, 
//     // but we keep this as a final fallback.
//     addNotification({
//         type: 'error',
//         title: 'An Unexpected Error Occurred',
//         message: error.message || 'Could not complete the request.',
//         autoHide: false
//     });
//     throw error;
//   }
// };

const rotatingGifUrl = 'https://i.pinimg.com/originals/39/b9/8f/39b98fd9cfae359c9d1fbee154bd279a.gif';




  // ✅ Reset `isOrderValid` whenever `dataId` changes (new data uploaded)
  

  let catTemporary = { "row": {}, "col": {}}
  let rowCats: Record<string, string> = {};
  let colCats: Record<string, string> = {};

  if (filteredData.current) { 
    
    if(filteredData.current.cat_colors)
      {
    rowCats = Object.keys(filteredData.current.cat_colors.row || {}).reduce((acc, key) => {
      const catName = Object.keys(filteredData.current.cat_colors.row[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);
  
    colCats = Object.keys(filteredData.current.cat_colors.col || {}).reduce((acc, key) => {
      const catName = Object.keys(filteredData.current.cat_colors.col[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);

  }
  }
  
  // Extract row and column categories if they exist
  else if (data.cat_colors) {
    rowCats = Object.keys(data.cat_colors.row || {}).reduce((acc, key) => {
      const catName = Object.keys(data.cat_colors.row[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);
  
    colCats = Object.keys(data.cat_colors.col || {}).reduce((acc, key) => {
      const catName = Object.keys(data.cat_colors.col[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);
  }
  
  catTemporary = { "row": rowCats, "col": colCats };

 
  
  // ✅ Validate and update `order` (only when `dataId` changes)
  useEffect(() => {
    // setIsOrderValid(false);

  
    const hasRowCats = Object.keys(rowCats).length > 0;
    const hasColCats = Object.keys(colCats).length > 0;
  
    const isRowCatValid =
  (!hasRowCats && order.rowCat.length === 0) || // If no row categories exist and order.rowCat is empty, it's valid
  (hasRowCats && order.rowCat.length > 0 && order.rowCat.every((cat: string) => rowCats.hasOwnProperty(cat)));

const isColCatValid =
  (!hasColCats && order.colCat.length === 0) || // If no column categories exist and order.colCat is empty, it's valid
  (hasColCats && order.colCat.length > 0 && order.colCat.every((cat: string) => colCats.hasOwnProperty(cat)));
    if (!isRowCatValid || !isColCatValid) {
      console.log('⚠️ Invalid order detected. Resetting categories.');
  
      setOrder((prev) => ({
        ...prev,
        rowCat: hasRowCats ? Object.keys(rowCats).slice(0, MAX_CATEGORIES) : [],
        colCat: hasColCats ? Object.keys(colCats).slice(0, MAX_CATEGORIES) : [],
      }));
    }
    // setIsOrderValid(true);
  }, [dataId,dataVersion]); // ✅ Runs only when `dataId` changes
  
  
 // Function to enable cropping mode
//  const enableCropping = () => {
//   setIsCropping(true);
// };

// const resetFilteredDict = () => {
//   setFilteredIdxDict(null);
//   setCropBox(null);
// }

 // Function to get relative position of the mouse event to the heatmap element
 const getRelativePosition = (event:any, element:any) => {
  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left).toFixed(2);  // Force two decimal points
  const y = (event.clientY - rect.top).toFixed(2);   // Force two decimal points

  // setBorderRect({
  //   left: rect.left,
  //   top: rect.top,
  //   width: rect.width,
  //   height: rect.height
  // });
  return { x: parseFloat(x), y: parseFloat(y) };
};



// Enhanced mouse down handler 
// const handleMouseDown = (event: any) => {

//   console.log('******* again coming in the handle mouse down and is cropping is *********', isCropping)
//   // Only handle mouse down for cropping, not for panning
//   if (!isCropping) {
//     return; // Let DeckGL handle panning
//   }
  
//   console.log('🔍 CROP - Starting crop selection');
  
//   const element = heatmapRef.current;
//   if (!element) return;
  
//   const { x, y } = getRelativePosition(event, element);
//   setIsDrawing(true);
//   setCropBox({ startX: x, startY: y, endX: x, endY: y });
  
//   // Prevent event from interfering with DeckGL
//   event.preventDefault();
//   event.stopPropagation();
// };

const handleMouseDown = (event: any) => {
  console.log('******* again coming in the handle mouse down and is cropping is *********', isCropping)
  
  // MOVE THESE LINES TO THE TOP - prevent event FIRST when cropping
  if (isCropping) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔍 CROP - Starting crop selection');
    
    const element = heatmapRef.current;
    if (!element) return;
    
    const { x, y } = getRelativePosition(event, element);
    setIsDrawing(true);
    setCropBox({ startX: x, startY: y, endX: x, endY: y });
  }
  // If not cropping, let DeckGL handle panning (do nothing)
};

// Enhanced mouse up handler 
const handleMouseUp = (event: any) => {
  if (!isDrawing) return;
  
  console.log('🔍 CROP - Crop selection completed');
  setIsDrawing(false);
  setIsCropping(false)
  
  // Show success message
  setToastMessage("✅ Crop area selected! Processing data...");
  setToastSeverity('info');
  setToastOpen(true);
};

// Enhanced mouse move handler 
const handleMouseMove = (event: MouseEvent) => {
  if (!isDrawing || !isCropping) return;
  
  console.log('🔍 CROP - CropPING IT IN mouse move');

  const element = heatmapRef.current;
  if (!element) return;
  
  const { x, y } = getRelativePosition(event, element);
  setCropBox((prevBox) => {
    if (!prevBox) return null;
    return { ...prevBox, endX: x, endY: y };
  });
};

// Enhanced enable cropping 
const enableCropping = () => {
  console.log('🔍 CROP - Enabling cropping mode');
  setIsCropping(true);
  setCropBox(null);
  setIsDrawing(false);
  
  // Show user instruction
  setToastMessage("🎯 Cropping mode activated! Click and drag to select an area. Press ESC to cancel.");
  setToastSeverity('info');
  setToastOpen(true);
};

// Enhanced reset function 
const resetFilteredDict = () => {
  setFilteredIdxDict(null);
  setCropBox(null);
  setIsCropping(false);
  setIsDrawing(false);
  
  // Show reset message
  setToastMessage("🔄 Crop filter cleared! Showing full heatmap.");
  setToastSeverity('success');
  setToastOpen(true);
};

// NEW function - Add this function
const cancelCropping = () => {
  console.log('🔍 CROP - Canceling cropping mode');
  setIsCropping(false);
  setIsDrawing(false);
  setCropBox(null);
  
  // Show cancel message
  setToastMessage("❌ Cropping canceled");
  setToastSeverity('info');
  setToastOpen(true);
};

// ADD this new useEffect after your existing useEffects
useEffect(() => {
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isCropping) {
      cancelCropping();
    }
  };

  document.addEventListener('keydown', handleEscapeKey);
  
  return () => {
    document.removeEventListener('keydown', handleEscapeKey);
  };
}, [isCropping]);

// ✅ Update the handleRenderHeatmap function to accept current filters
const handleRenderHeatmap = (currentFilters: any) => {
  console.log('Rendering heatmap with filters:', currentFilters);
  
  getRefreshHeatmap(sessionID, currentFilters).then((res) => {
    if ("error" in res) {
        console.error("Heatmap Error:", res.error);
        return;
    }

    const { clustering_result } = res;

    if (clustering_result) {
        try {
            const parsedResult = typeof clustering_result === 'string' 
                ? JSON.parse(clustering_result) 
                : clustering_result;
                                    
            filteredData.current = parsedResult;
            setDataVersion(prev => prev + 1);
        } catch (err) {
            console.error("❌ Error processing clustering result:", err);
        }
    }
  });
};



// Add event listeners for mouse move and mouse up when drawing starts
useEffect(() => {
  if (isDrawing) {
    // Attach listeners to the document for mouse movement and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  } else {
    // Remove the listeners when drawing stops
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  // Cleanup event listeners when component unmounts
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDrawing]);


  const ID: string = container.id
  let unit="";
  if(ID?.includes('cytof')){

    if(ID === 'cytofHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'Freq'
    }
  }
  else if(ID?.includes('olink')){

    if(ID === 'olinkHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = `NPX-${valueScale}`
    }
  }
  else if(ID?.includes('serology')){
    if(ID === 'serologyHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'Titers'
    }
  }
  else if(ID?.includes('rnaseq')){
    if(ID === 'rnaseqHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'FPKM'
    }
  }

const dimensions = useDimensions(container);

// useEffect(() => {  
//   try {
//     // Try to create the worker
//     workerCount++;
//     workerRef.current = createDataWorker(dataWorkerCode);
//     // Set up message handler
//     workerRef.current.onmessage = (event) => {
//       if (event.data.dataState) {
//         dataStateRef.current = event.data.dataState;
//         setDataStateVersion(prev => prev + 1);
//       }
//       if (event.data.heatmapState) {
//         heatmapStateRef.current = event.data.heatmapState;
//         setHeatmapStateVersion(prev => prev + 1);
//       }
//     };
    
//     // Add error handler for worker
//     workerRef.current.onerror = (error) => {
//       console.error("Worker error:", error);
//     };
    
//   } catch (error) {
//     console.error("Worker initialization failed:", error);
//     // Here you would implement fallback processing
//   }
  
//   return () => {
//     if (workerRef.current) {
//       console.log("Terminating worker");
//       workerRef.current.terminate();
//     }
//   };
// }, []);

// useEffect(() => {
//   // Determine which data to use
//   const dataToUse = filteredData.current || data;
  
//   // Log which data source we're using
//   console.log("Data source for worker:", filteredData.current ? "Using filtered data" : "Using original data");
  
//   if (workerRef.current && dataToUse) {
//     try {
//       console.log("Sending data to worker");
//       workerRef.current.postMessage({
//         data: dataToUse,
//         order,
//         catTemporary,
//         // filteredIdxDict,
//         messageType: 'dataState',
//       });
//     } catch (error) {
//       console.error("Failed to send data to worker:", error);
//     }
//   } else {
//     console.log("Cannot send data to worker:", {
//       workerExists: !!workerRef.current,
//       dataExists: !!dataToUse
//     });
//   }
// }, [data, order, dataVersion]); // Added catTemporary to dependencies

//   useEffect(() => {
//     if (workerRef.current && dimensions) {
//       workerRef.current.postMessage({
//         dimensions,
//         colLabelsWidth,
//         rowLabelsWidth,
//         ID,
//         panelWidth,
//         messageType: 'heatmapState',
//       });
//     }
//   }, [dimensions, colLabelsWidth, rowLabelsWidth, panelWidth,datastateVersion]);

// ====================================================================
  // ✅ START: This is the complete and final worker management code.
  // ====================================================================

  // HOOK 1: Manages Worker Lifecycle (Create/Destroy). Runs only ONCE.
  useEffect(() => {
    try {
      console.log("Initializing Web Worker...");
      workerRef.current = createDataWorker(dataWorkerCode);
    } catch (error) {
      console.error("Worker initialization failed:", error);
      // You could add a critical error notification here
    }

    // This cleanup function runs when the component unmounts
    return () => {
      if (workerRef.current) {
        console.log("Terminating worker");
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once.


  // HOOK 2: Manages Worker Event Handlers. Updates when state/props change.
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return; // Do nothing if the worker isn't ready yet.

    // This function will handle all messages coming FROM the worker
    const handleMessage = (event: MessageEvent) => {
      let wasDataUpdated = false;

      // Check if the worker sent back a new data state (from a sort/cluster)
      if (event.data.dataState) {
        dataStateRef.current = event.data.dataState;
        setDataStateVersion(prev => prev + 1);
        wasDataUpdated = true;
      }
      
      // Check if the worker sent back a new heatmap state (from a resize)
      if (event.data.heatmapState) {
        heatmapStateRef.current = event.data.heatmapState;
        setHeatmapStateVersion(prev => prev + 1);
      }
      
      // NOTIFICATION LOGIC:
      // If the data was recomputed, fire the appropriate success notification.
      // Because this effect depends on 'order', the 'order' variable here is always up-to-date.
      if (wasDataUpdated && previousOrder) {
        // Check if the ROW order was the thing that just changed
        if (order.row !== previousOrder.row) {
          if (order.row === 'cluster') {
            notifyClusteringSuccess();
          } else {
            notifySortSuccess(order.row, 'rows');
          }
        } 
        // Check if the COLUMN order was the thing that just changed
        else if (order.col !== previousOrder.col) {
          if (order.col === 'cluster') {
            notifyClusteringSuccess();
          } else {
            notifySortSuccess(order.col, 'columns');
          }
        }
      }
    };

    const handleError = (error: ErrorEvent) => {
      console.error("Worker error:", error);
      // You could call a generic error notification function here if you created one
    };

    // Attach the fresh, up-to-date handlers to the worker
    worker.onmessage = handleMessage;
    worker.onerror = handleError;

    // This cleanup function detaches the handlers before the effect runs again
    return () => {
      worker.onmessage = null;
      worker.onerror = null;
    };

  // This effect re-runs whenever these values change, keeping the handlers up-to-date.
  }, [order, notifyClusteringSuccess, notifySortSuccess]);


  // HOOK 3: Sends Data/Order updates TO the worker. (This is your original code, it's correct)
  useEffect(() => {
    const dataToUse = filteredData.current || data;
    if (workerRef.current && dataToUse) {
      try {
        workerRef.current.postMessage({
          data: dataToUse,
          order,
          catTemporary,
          messageType: 'dataState',
        });
      } catch (error) {
        console.error("Failed to send data to worker:", error);
      }
    }
  }, [data, order, dataVersion]); // Assuming these are your correct dependencies


  // HOOK 4: Sends UI Dimension updates TO the worker. (This is your original code, it's correct)
  useEffect(() => {
    if (workerRef.current && dimensions) {
      workerRef.current.postMessage({
        dimensions,
        colLabelsWidth,
        rowLabelsWidth,
        ID,
        panelWidth,
        messageType: 'heatmapState',
      });
    }
  }, [dimensions, colLabelsWidth, rowLabelsWidth, panelWidth, datastateVersion]);

  // ====================================================================
  // ✅ END: of the worker management block.
  // ====================================================================


useLabelState(
  dataStateRef.current,
  heatmapStateRef.current,
  labels,
  container,
  order,
  ID,
  datastateVersion,
  heatmapstateVersion,
  setLabelsState
);
  
      

  if(order.colCat.length >= 0 && rowLabelsWidth > 0 && colLabelsWidth > 0) {
  const containerElement: HTMLDivElement = container;
  
  // First remove ALL previous column category labels using the specific class
  const oldLabels = containerElement.querySelectorAll('.col-category-label');
  oldLabels.forEach(label => {
    containerElement.removeChild(label);
  });
  
  // Then create new labels
  for(let i = 0; i < order.colCat.length; i++) {
    const label = document.createElement('label');
    
    // Create clean IDs with consistent handling of spaces for all labels
    let labelId = order.colCat[i];
    labelId = labelId.split(' ').join('_');
    if(labelId.includes('#')) {
      labelId = labelId.replace('#', 'no');
    }
    
    label.id = labelId;
    label.className = 'col-category-label'; // Added the specific class name
    
    label.style.position = 'absolute';
    const initialGap = 1;
    const gap = 1;
    const yPosition = colLabelsWidth - initialGap - ((i+1) * (CATEGORY_LAYER_HEIGHT*2 +gap )) - (i+1+1)*2;
    label.style.top = `${yPosition}px`;
    label.textContent = `${capitalizeFirstLetter(order.colCat[i])}`;
    
    if(order.row !== 'cluster') {
      label.addEventListener('click', () => {
        setOrder((prevOrder:any) => ({ ...prevOrder, sortByColCat:order.colCat[i]}));
      });
    }
    
    const offset = labels?.row?.offset ? labels.row.offset : DEFAULT_LABEL_OFFSET + 2;
    label.style.fontSize = `${CATEGORY_LAYER_HEIGHT*2}px`;
    label.style.fontFamily = 'Arial, sans-serif';
    label.style.fontWeight = '525';
    const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
    const width = getTextWidth(label.textContent, labelFont);
    label.style.width = `${width}px`;
    label.style.color = '#333333';
    label.style.textAlign = 'right';
    label.style.left = isDrawerOpen ? `${panelWidth + rowLabelsWidth - width - offset}px`:`${rowLabelsWidth - width - offset}px`;
    
    containerElement.appendChild(label);
  }
}

  // if(order.rowCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0 && container && dimensions && heatmapStateRef.current?.height){
  //   const containerElement = container;
  //   const rowCategoryNames = Object.keys(categories.row);
  //   for(let i = 0;i<rowCategoryNames.length;i++){

  //     const labelToRemove = rowCategoryNames[i].includes('#') ?containerElement.querySelector(`#${rowCategoryNames[i].replace('#','no').split(' ').join('_')}`): containerElement.querySelector(`#${rowCategoryNames[i]}`);
  //     if(labelToRemove && containerElement.contains(labelToRemove)){
  //       containerElement.removeChild(labelToRemove);
  //     }
  //   }
   
  //  for(let i = 0;i<order.rowCat.length;i++){
  //   const label = document.createElement('label');
  //   label.id = order.rowCat[i].includes('#')?`${order.rowCat[i].replace('#','no').split(' ').join('_')}` :`${order.rowCat[i]}`;
  //   label.style.position = 'absolute';
  //   // label.style.top = `${dimensions[1]-0.1*dimensions[1]+ 5}px`
  //   label.style.top = `${heatmapStateRef.current?.height}px`

  
  //   label.textContent = `${capitalizeFirstLetter(order.rowCat[i])}`;
  //   if(order.row !== 'cluster'){
  //   label.addEventListener('click',()=>{
  //     setOrder((prevOrder:any) => ({ ...prevOrder, sortByRowCat:order.rowCat[i]}))
  //   });}
  //   const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
  //   label.style.fontSize = '14px';
  //   label.style.fontFamily = 'Arial, sans-serif';
  //   label.style.fontWeight = '525';
  //   const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
  //   const width = getTextWidth(label.textContent,labelFont)
  //   label.style.width = `${width}px`;
  //   label.style.color = '#333333';
  //   label.style.textAlign= 'right';
  //   /*We added 10 pixel because the panel icon has 10 pixel width */
  //    // Rotate the label to be vertical
  //    label.style.transform = 'rotate(90deg)';
  //    label.style.transformOrigin = 'top left';
  //    const initialGap = INITIAL_GAP;
  //    const gap = LAYER_GAP;
  //    const halfViewWidth = rowLabelsWidth;
  //    const categoryHeight = CATEGORY_LAYER_HEIGHT;

  //    const xPosition = panelWidth + halfViewWidth - 2*i*(categoryHeight + gap); 

  //   label.style.left = `${xPosition}px` //isDrawerOpen?`${190+rowLabelsWidth-width-offset}px`:`${30+rowLabelsWidth-width-offset}px`;
  //   // label.style.border = '1px solid black';
  //   containerElement.appendChild(label);

  // }

  // }

  if (order.rowCat.length > 0 && rowLabelsWidth > 0 && colLabelsWidth > 0 && container) {
    const containerElement = container as HTMLDivElement;
  
    // 1) Remove all existing row‑category labels by class
    const oldRowLabels = containerElement.querySelectorAll('.row-category-label');
    oldRowLabels.forEach(label => containerElement.removeChild(label));
  
    // 2) Create new ones
    order.rowCat.forEach((cat, i) => {
      // sanitize an ID just like you do for columns
      let labelId = cat.split(' ').join('_');
      if (labelId.includes('#')) {
        labelId = labelId.replace('#', 'no');
      }
  
      const label = document.createElement('label');
      label.id = labelId;
      label.className = 'row-category-label';
      label.style.position = 'absolute';
  
      // place it at the bottom of the heatmap
      label.style.top = `${heatmapStateRef.current!.height + colLabelsWidth/2}px`;
  
      label.textContent = capitalizeFirstLetter(cat);
  
      if (order.row !== 'cluster') {
        label.addEventListener('click', () => {
          setOrder(prev => ({ ...prev, sortByRowCat: cat }));
        });
      }
  
      // styling
      const offset = labels?.row?.offset ?? DEFAULT_LABEL_OFFSET + 2;
      label.style.fontSize = '14px';
      label.style.fontFamily = 'Arial, sans-serif';
      label.style.fontWeight = '525';
      const font = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
      const width = getTextWidth(label.textContent, font);
      label.style.width = `${width}px`;
      label.style.color = '#333333';
      label.style.textAlign = 'right';
  
      // rotate it vertical
      label.style.transform = 'rotate(90deg)';
      label.style.transformOrigin = 'top left';
  
      // compute its X position (mirror your column logic)
      const gap = LAYER_GAP;                      // e.g. 1
      const catH = CATEGORY_LAYER_HEIGHT;         // same as for columns
      const xPos = panelWidth + rowLabelsWidth - 2*i * (catH + gap);
  
      label.style.left = `${xPos}px`;
  
      containerElement.appendChild(label);
    });
  }
  


  const { viewStates, onViewStateChange, visibleIndices,isZoomedOut } = useViewStates(
    container,
    dimensions,
    heatmapStateRef.current,
    dataStateRef.current,
    panelWidth,
    searchTerm, // Add the search term parameter
    colLabelsWidth // Add the column labels width parameter
  );
  

  const views = useViews({
    colLabelsWidth,
    rowLabelsWidth,
    dimensions,
    debug,
    panelWidth
  });

  // const layers = useMemo(
  //   () =>
  //     getLayers({
  //       dataState: dataStateRef.current,
  //       heatmapState: heatmapStateRef.current,
  //       visibleIndices,
  //       viewStates,
  //       onClick,
  //       labels,
  //       debug,
  //       colLabelsWidth,
  //       rowLabelsWidth,
  //       rowLabelsTitle,
  //       columnLabelsTitle,
  //       searchTerm,
  //       order,
  //       categories:catTemporary,
  //       rowSliderVal:rowClustGroup,
  //       colSliderVal:colClustGroup,
  //       opacityVal:OpacityValue,
  //       pvalThreshold,
  //       pvalData,
  //       isZoomedOut,
  //       filteredIdxDict
  //     }),
    // [
    //   colLabelsWidth,
    //   // columnLabelsTitle,
    //   labels,
    //   onClick,
    //   visibleIndices,
    //   // rowLabelsTitle,
    //   rowLabelsWidth,
    //   viewStates,
    //   searchTerm,
    //   order,
    //   colClustGroup,
    //   rowClustGroup,
    //   // pvalData,
    //   datastateVersion,
    //   heatmapstateVersion,
    //   OpacityValue,
    //   isZoomedOut,
    //   filteredIdxDict
    // ]
  // );

  const layers = useMemo(() => {
    // Return null if the data isn't ready, preventing errors.
    if (!dataStateRef.current || !heatmapStateRef.current) {
        return [];
    }

    return getLayers({
        dataState: dataStateRef.current,
        heatmapState: heatmapStateRef.current,
        visibleIndices,
        viewStates,
        onClick: stableOnClick, // Use the new stable onClick object
        labels,
        debug,
        colLabelsWidth,
        rowLabelsWidth,
        rowLabelsTitle,
        columnLabelsTitle,
        searchTerm,
        order,
        categories: categories, // Assuming `categories` is stable or correctly memoized
        rowSliderVal: rowClustGroup,
        colSliderVal: colClustGroup,
        opacityVal: OpacityValue,
        pvalThreshold: 0.05, // Example pvalThreshold
        pvalData,
        isZoomedOut,
        filteredIdxDict
    });
}, [
    // List only the primitive values or STABLE objects/arrays that cause a visual change.
    datastateVersion,
    heatmapstateVersion,
    visibleIndices,
    viewStates,
    stableOnClick, // Dependency is now stable
    labels,
    // debug,
    colLabelsWidth,
    rowLabelsWidth,
    // rowLabelsTitle,
    // columnLabelsTitle,
    searchTerm,
    order,
    // categories,
    rowClustGroup,
    colClustGroup,
    OpacityValue,
    pvalData,
    isZoomedOut,
    filteredIdxDict
]);



  const legendComponent = <Legend2 
                            min={dataStateRef.current?.min || 0}
                            max={dataStateRef.current?.max || 0}
                            maxColor="#FF0000"
                            minColor="#0000FF"
                            legendWidth={legend?.width}
                            legendHeight={legend?.height}
                            fontSize={legend?.fontSize}
                            unit={unit}
                            />

  // onClick handler to download matrix as csv file
  const downloadMatrix = () => {

    const rowLabelArr: any[] = []
    for (let i=0; i<(data.row_nodes).length; i++){
      rowLabelArr.push(data.row_nodes[i].name)

    }

    const colLabelArr: any[] = ['']
    for (let i=0; i<data.col_nodes.length; i++){
      colLabelArr.push(data.col_nodes[i].name)
    }
    // console.log(colLabelArr)

    const matrixArray: any[] = data.mat

    matrixArray.map((ele, index) => {ele.unshift(rowLabelArr[index]); return ele; })
    matrixArray.splice(0, 0, colLabelArr)

    let csvRows:any[] = [];
    for (let i = 0; i < matrixArray.length; ++i) {
        for (let j = 0; j < matrixArray[i].length; ++j) {
          matrixArray[i][j] = '\"' + matrixArray[i][j] + '\"';  // Handle elements that contain commas
        }
        csvRows.push(matrixArray[i].join(','));
    }



    var csvString = csvRows.join('\r\n');
    var a         = document.createElement('a');
    a.href        = 'data:attachment/csv,' + csvString;
    a.target      = '_blank';
    a.download    = 'myFile.csv';

    document.body.appendChild(a);
    a.click();
    
  }

  const downloadPdf = () => {
    // const deckglCanvas = cotainerRefDeckgl.current.deck.canvas;
    containerRefDeckgl.current.deck.redraw(true)
    const deckglCanvas = containerRefDeckgl.current.deck.canvas;

    if (deckglCanvas) {

              // Set canvas background to transparent
              // deckglCanvas.style.backgroundColor = 'transparent';

              // Convert the canvas to a data URL with JPEG format and quality 0.9 (90%)
              const dataUrl = deckglCanvas.toDataURL('image/png');
              // Create a new jsPDF instance
              const pdf = new jsPDF('p', 'mm', 'a4'); // Specify page size as A4

              // Calculate the width and height of the image in the PDF
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (deckglCanvas.height * pdfWidth) / deckglCanvas.width;
        
              // Specify a white background color for the image

              pdf.setFillColor(255, 255, 255); // White color
              pdf.rect(0, 0, pdfWidth, pdfHeight, 'F'); // Fill rectangle with white color
              pdf.addImage(dataUrl, 'png', 0, 0, pdfWidth, pdfHeight);
        
              // Save the PDF with a specified file name
              pdf.save('HeatmapImg.pdf');
            }

  };
 
// // REPLACE your existing crop calculation useEffect with this:
// useEffect(() => {
//   if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current) {
//     try {
//       console.log('🔍 CROP - Processing crop area...');

      
//       // Your existing calculation logic here (keep it the same)
//       const startX = Math.max(0, cropBox.startX - rowLabelsWidth);
//       const endX = Math.max(0, cropBox.endX - rowLabelsWidth);
//       const startY = Math.max(0, cropBox.startY - colLabelsWidth);
//       const endY = Math.max(0, cropBox.endY - colLabelsWidth);

      
//       const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
//       const baseCellHeight = heatmapStateRef.current.cellDimensions.height;
      
//       const minX = Math.min(startX, endX);
//       const maxX = Math.max(startX, endX);
//       const minY = Math.min(startY, endY);
//       const maxY = Math.max(startY, endY);
      
//       const colStartIdx = Math.floor(minX / (2*baseCellWidth));
//       const colEndIdx = Math.floor(maxX / (2*baseCellWidth));
//       const rowStartIdx = Math.floor(minY / (2*baseCellHeight));
//       const rowEndIdx = Math.floor(maxY / (2*baseCellHeight));
      
//       const finalColStartIdx = Math.max(0, colStartIdx);
//       const finalColEndIdx = Math.min(dataStateRef.current.numColumns - 1, colEndIdx);
//       const finalRowStartIdx = Math.max(0, rowStartIdx);
//       const finalRowEndIdx = Math.min(dataStateRef.current.numRows - 1, rowEndIdx);
      
//       const filteredDict = {
//         startX: finalColStartIdx,
//         startY: finalRowStartIdx,
//         endX: finalColEndIdx,
//         endY: finalRowEndIdx,
//       };
      
//       // Calculate selected area info
//       const selectedCols = finalColEndIdx - finalColStartIdx + 1;
//       const selectedRows = finalRowEndIdx - finalRowStartIdx + 1;
//       const totalCells = selectedCols * selectedRows;
      
//       console.log(`🔍 CROP FINAL - Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);
      
//       setFilteredIdxDict(filteredDict);
      
//       // Auto-disable cropping after processing
//       setTimeout(() => {
//         setIsCropping(false);
        
//         // Show success message with details
//         setToastMessage(`✅ Crop applied! Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);
//         setToastSeverity('success');
//         setToastOpen(true);
//       }, 500);
      
//     } catch (error) {
//       console.error('❌ Error in crop box calculation:', error);
//       setCropBox(null);
//       setIsCropping(false);
      
//       // Show error message
//       setToastMessage("❌ Error processing crop area. Please try again.");
//       setToastSeverity('error');
//       setToastOpen(true);
//     }
//   }
// }, [isDrawing, cropBox]);

// REPLACE your existing crop calculation useEffect with this:
// REPLACE your existing crop calculation useEffect with this:
// Your original working code with just zoom awareness added


const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
const zoomValue = currentViewState?.zoom;
const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);

// 🎯 VIEWPORT DEBUG - Log current zoom and target values
console.log('🎯 VIEWPORT DEBUG - In crop useEffect:', {
  zoom: currentZoom,
  target: currentViewState?.target,
  timestamp: new Date().toISOString()
});

// useEffect(() => {
//   if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current) {
//     try {
//       console.log('🔍 CROP - Processing crop area...');

//       // Get current zoom level and pan position
//       const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
//       const zoomValue = currentViewState?.zoom;
//       const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);
      
//       // GET CURRENT PAN POSITION
//       const targetArray = currentViewState?.target;
//       const targetX = Array.isArray(targetArray) && targetArray.length > 0 ? targetArray[0] : 0;
//       const targetY = Array.isArray(targetArray) && targetArray.length > 1 ? targetArray[1] : 0;
      
//       console.log(`🔍 CROP - Current zoom: ${currentZoom}, Pan position: [${targetX}, ${targetY}]`);
      
//       // Your existing calculation logic here (keep it the same)
//       const startX = Math.max(0, cropBox.startX - rowLabelsWidth);
//       const endX = Math.max(0, cropBox.endX - rowLabelsWidth);
//       const startY = Math.max(0, cropBox.startY - colLabelsWidth);
//       const endY = Math.max(0, cropBox.endY - colLabelsWidth);

//       const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
//       const baseCellHeight = heatmapStateRef.current.cellDimensions.height;
      
//       const minX = Math.min(startX, endX);
//       const maxX = Math.max(startX, endX);
//       const minY = Math.min(startY, endY);
//       const maxY = Math.max(startY, endY);
      
//       // CONVERT SCREEN COORDINATES TO WORLD COORDINATES (ACCOUNTING FOR PAN)
//       const zoomFactor = Math.pow(2, currentZoom);
      
//       console.log('********* zoomFactor is as follows *********',zoomFactor)
//       // Convert from screen space to world space
//       const worldMinX = (minX / zoomFactor) + targetX;
//       const worldMaxX = (maxX / zoomFactor) + targetX;
//       const worldMinY = (minY / zoomFactor) + targetY;
//       const worldMaxY = (maxY / zoomFactor) + targetY;

//       console.log('********* targetX is as follows *********',targetX)
//       console.log('********* targetY is as follows *********',targetY)
      
//       // 🔍 DEBUG: Check if target values are changing unexpectedly
//       console.log('🔍 VIEWPORT DEBUG - Current zoom:', currentZoom);
//       console.log('🔍 VIEWPORT DEBUG - Target should only change on PAN, not ZOOM');
//       console.log('🔍 VIEWPORT DEBUG - Are target values stable across zoom levels?');
//       console.log('********* worldMinX is as follows *********',worldMinX)
//       console.log('********* worldMaxX is as follows *********',worldMaxX)
//       console.log('********* worldMinY is as follows *********',worldMinY)
//       console.log('********* worldMaxY is as follows *********',worldMaxY)
    
      
//       // Account for heatmap centering offset (same as in your getHeatmapState)
//       const heatmapWidth = heatmapStateRef.current.width;
//       const heatmapHeight = heatmapStateRef.current.height;
//       // const offsetX = heatmapWidth / 4;
//       // const offsetY = heatmapHeight / 4;
//       const offsetX = 0;
//       const offsetY = 0;
      
//       const adjustedWorldMinX = worldMinX + offsetX;
//       const adjustedWorldMaxX = worldMaxX + offsetX;
//       const adjustedWorldMinY = worldMinY + offsetY;
//       const adjustedWorldMaxY = worldMaxY + offsetY;
      
//       console.log(`🔍 CROP - World coordinates: (${worldMinX}, ${worldMinY}) to (${worldMaxX}, ${worldMaxY})`);
//       console.log(`🔍 CROP - Adjusted coordinates: (${adjustedWorldMinX}, ${adjustedWorldMinY}) to (${adjustedWorldMaxX}, ${adjustedWorldMaxY})`);
      
//       // Calculate cell indices using base cell size
//       const colStartIdx = Math.floor(adjustedWorldMinX / baseCellWidth);
//       const colEndIdx = Math.floor(adjustedWorldMaxX / baseCellWidth);
//       const rowStartIdx = Math.floor(adjustedWorldMinY / baseCellHeight);
//       const rowEndIdx = Math.floor(adjustedWorldMaxY / baseCellHeight);
      
//       const finalColStartIdx = Math.max(0, colStartIdx);
//       const finalColEndIdx = Math.min(dataStateRef.current.numColumns - 1, colEndIdx);
//       const finalRowStartIdx = Math.max(0, rowStartIdx);
//       const finalRowEndIdx = Math.min(dataStateRef.current.numRows - 1, rowEndIdx);
      
//       const filteredDict = {
//         startX: finalColStartIdx,
//         startY: finalRowStartIdx,
//         endX: finalColEndIdx,
//         endY: finalRowEndIdx,
//       };
      
//       // Calculate selected area info
//       const selectedCols = finalColEndIdx - finalColStartIdx + 1;
//       const selectedRows = finalRowEndIdx - finalRowStartIdx + 1;
//       const totalCells = selectedCols * selectedRows;
      
//       console.log(`🔍 CROP FINAL - Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells) at zoom ${currentZoom}`);
//       console.log('******** filtered dict is as follows ********', filteredDict);
      
//       // 🚀 ENHANCED DEBUG: Print startX, startY, endX, endY at current zoom resolution
//       console.log('🎯 CROP DEBUG - Zoom Resolution:', currentZoom);
//       console.log('🎯 CROP DEBUG - startX:', filteredDict.startX);
//       console.log('🎯 CROP DEBUG - startY:', filteredDict.startY); 
//       console.log('🎯 CROP DEBUG - endX:', filteredDict.endX);
//       console.log('🎯 CROP DEBUG - endY:', filteredDict.endY);
//       console.log('🎯 CROP DEBUG - Box dimensions:', `${filteredDict.endX - filteredDict.startX + 1} x ${filteredDict.endY - filteredDict.startY + 1}`);
      
//       setFilteredIdxDict(filteredDict);
      
//       const currentZoomNumber = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);

//       const resetViewState = {
//         target: [0, 0], // Reset to center
//         zoom: currentZoomNumber, // Use the extracted number value
//         minZoom: currentViewState?.minZoom || 0,
//         maxZoom: currentViewState?.maxZoom || 10,
//         height: currentViewState?.height || 600, // Provide default height
//         width: currentViewState?.width || 800,   // Provide default width
//         rotationOrbit: currentViewState?.rotationOrbit || 0,
//         rotationX: currentViewState?.rotationX || 0,
//         minRotationX: currentViewState?.minRotationX || -90,
//         maxRotationX: currentViewState?.maxRotationX || 90,
//       };
      
//       onViewStateChange({
//         viewId: IDS.VIEWS.HEATMAP_GRID,
//         viewState: resetViewState,
//         interactionState: {}, // Add this required property
//       });
      
      
//       // Auto-disable cropping after processing
//       setTimeout(() => {
//         setIsCropping(false);
        
//         // Show success message with details
//         setToastMessage(`✅ Crop applied! Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);
//         setToastSeverity('success');
//         setToastOpen(true);
//       }, 500);
      
//     } catch (error) {
//       console.error('❌ Error in crop box calculation:', error);
//       setCropBox(null);
//       setIsCropping(false);
      
//       // Show error message
//       setToastMessage("❌ Error processing crop area. Please try again.");
//       setToastSeverity('error');
//       setToastOpen(true);
//     }
//   }
// }, [isDrawing, cropBox]);


useEffect(() => {
  if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current) {
    try {
      // 1) Compute screen coords relative to the heatmap grid
      const sx = Math.max(0, cropBox.startX - rowLabelsWidth);
      const ex = Math.max(0, cropBox.endX   - rowLabelsWidth);
      const sy = Math.max(0, cropBox.startY - colLabelsWidth);
      const ey = Math.max(0, cropBox.endY   - colLabelsWidth);

      // 2) Grab the DeckGL viewport for your heatmap view
      const deck = containerRefDeckgl.current;
      if (!deck) throw new Error('DeckGL instance not ready');
      // find the viewport matching your grid viewId, or fallback to first
      const viewport = deck.viewports.find(v => v.id === IDS.VIEWS.HEATMAP_GRID) 
                        || deck.viewports[0];

      // 3) Unproject both corners (minX,minY) & (maxX,maxY)
      const [wx1, wy1] = viewport.unproject([ Math.min(sx, ex), Math.min(sy, ey) ]);
      const [wx2, wy2] = viewport.unproject([ Math.max(sx, ex), Math.max(sy, ey) ]);

      // 4) Convert world coords into integer row/col indices
      const { width: cellW, height: cellH } = heatmapStateRef.current.cellDimensions;
      const colStart = Math.floor(wx1 / cellW);
      const colEnd   = Math.floor(wx2 / cellW);
      const rowStart = Math.floor(wy1 / cellH);
      const rowEnd   = Math.floor(wy2 / cellH);

      console.log('********* colStart is as follows *********',colStart)
      console.log('********* colEnd is as follows *********',colEnd)
      console.log('********* rowStart is as follows *********',rowStart)
      console.log('********* rowEnd is as follows *********',rowEnd)

      // 5) Clamp to valid ranges
      const maxCols = dataStateRef.current.numColumns - 1;
      const maxRows = dataStateRef.current.numRows    - 1;
      const filtered = {
        startX: Math.max(0, Math.min(colStart, maxCols)),
        endX:   Math.max(0, Math.min(colEnd,   maxCols)),
        startY: Math.max(0, Math.min(rowStart, maxRows)),
        endY:   Math.max(0, Math.min(rowEnd,   maxRows))
      };

      // 6) Update state
      setFilteredIdxDict(filtered);
      setToastMessage(`✅ Crop applied! cols ${filtered.startX}–${filtered.endX}, rows ${filtered.startY}–${filtered.endY}`);
      setToastSeverity('success');
      setToastOpen(true);

      // Auto‑disable cropping mode
      setIsCropping(false);
    } catch (error) {
      console.error('❌ Crop error:', error);
      setCropBox(null);
      setIsCropping(false);
      setToastMessage("❌ Error processing crop area. Please try again.");
      setToastSeverity('error');
      setToastOpen(true);
    }
  }
}, [
  isDrawing,
  cropBox,
  rowLabelsWidth,
  colLabelsWidth,
  heatmapStateRef.current?.cellDimensions.height,
  heatmapStateRef.current?.cellDimensions.width,
  dataStateRef.current?.numColumns,
  dataStateRef.current?.numRows
]);

// Also add this helper function for debugging crop coordinates
const debugCropCoordinates = (event: React.MouseEvent<HTMLDivElement>) => {
  if (!heatmapRef.current || !heatmapStateRef.current) return;
  
  const rect = (heatmapRef.current as HTMLDivElement).getBoundingClientRect();
  const screenX = event.clientX - rect.left - rowLabelsWidth;
  const screenY = event.clientY - rect.top - colLabelsWidth;
  
  const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
  const zoomValue = currentViewState?.zoom;
  const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);
  const zoomFactor = Math.pow(2, currentZoom);
  const targetX = currentViewState?.target?.[0] || 0;
  const targetY = currentViewState?.target?.[1] || 0;
  
  const worldX = (screenX / zoomFactor) + targetX;
  const worldY = (screenY / zoomFactor) + targetY;
  
  const offsetX = heatmapStateRef.current.width / 4;
  const offsetY = heatmapStateRef.current.height / 4;
  
  const adjustedWorldX = worldX + offsetX;
  const adjustedWorldY = worldY + offsetY;
  
  const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
  const baseCellHeight = heatmapStateRef.current.cellDimensions.height;
  
  const colIdx = Math.floor(adjustedWorldX / baseCellWidth);
  const rowIdx = Math.floor(adjustedWorldY / baseCellHeight);
  
  console.log(`🐛 DEBUG - Mouse at screen(${screenX}, ${screenY}) -> world(${worldX}, ${worldY}) -> cell(${colIdx}, ${rowIdx}) at zoom ${currentZoom}`);
  
  return { colIdx, rowIdx };
};

// Optional: Add this to your mouse move handler for real-time debugging
const handleMouseMoveWithDebug = (event: React.MouseEvent<HTMLDivElement>) => {
  // Your existing mouse move logic
  
  // Add debug info (remove in production)
  if (process.env.NODE_ENV === 'development') {
    debugCropCoordinates(event);
  }
};

useEffect(()=>{
  if(containerRefDeckgl.current){
    const deckInstance = containerRefDeckgl.current.deck;
  }
  
},[containerRefDeckgl.current])


let deckGlInstance;
if(heatmapStateRef.current?.cellData && container && layers ){
  deckGlInstance = 
  <DeckGL
          ref={containerRefDeckgl}
          getCursor={(cursorState) => cursorState.isDragging ? 'grab' : 'crosshair'}
          {...deckglProps}
          width="100%"
          height="100%"
          // useDevicePixels={false}
          // parent={container}
          style={merge({ position: "relative" }, deckglProps?.style || {})} // ✅ Changed to relative
          views={views}
          layerFilter={layerFilter}
          // @ts-ignore
          onViewStateChange={onViewStateChange}
          viewState={viewStates}
          layers={layers}
          getTooltip={tooltipFunction && isHovering ? tooltipFunction : null}
          controller={!isCropping} // <-- ADD ONLY THIS LINE
          onClick={(event) => {
            const obj = event.object;
            console.log(obj)
            if (obj?.id === "row-cluster") {
              setClickedClusterData({ Nodes: obj.nodes, Group: obj.text });
              setIsTableVisible(true);
            }
          }}
        >
  
          {isTableVisible && clickedClusterData && (
            <div>
              <ClusterInfoBox 
                setVisibilty={setIsTableVisible} 
                setHovering={setHovering} 
                data={clickedClusterData}
                dataType={ID} 
                onShowNetwork={onShowNetwork}
                onShowPathwayNetwork={onShowPathwayNetwork}
              />
            </div>
          )}
        </DeckGL>

}


return heatmapStateRef.current?.cellData && container && layers ? (
  <div style={{height:'100%',width:'100%'}}>
    {/* Pathway Selector Modal */}
{showPathwaySelector && (
  <PathwaySelector
    pathwayResults={pathwayResults}
    searchQuery={lastSearchQuery}
    onPathwaySelect={handlePathwaySelect}
    onClose={handlePathwaySelectorClose}
  />
)}
  <div 
    style={{
      height:`${HEATMAP_PARENT_HEIGHT_RATIO}%`,
      width:`${HEATMAP_PARENT_WIDTH_RATIO}%`,
      display:'flex',  
      gap: '0px',
    }}>
    <PersistentDrawerLeft 
        parentContainerRef={container}
        setIsDrawerOpen={setIsDrawerOpen}
        setOpacityValue={setOpacityValue}
        setOrder = {setOrder}
        categories = {catTemporary}
        order = {order}
        Legend={legendComponent}
        panelWidth={panelWidth}
        ID={ID}
        dataState={dataStateRef.current}
        setState={setValueScale}
        resultCategories={resultCategories}
        setResultCategory={setResultCategory}
        setSearchTerm={setSearchTerm}
        setPvalThreshold={setPvalThreshold}
        downloadHeatmap={downloadPdf}
        downloadMatrix={downloadMatrix}
        setCropping={enableCropping}
        setFilteredIdxDict={resetFilteredDict}
        cropBox={cropBox}
        isMinimapEnabled={isMinimapEnabled}
        setIsMinimapEnabled={setIsMinimapEnabled}
        filters={filters}
        setFilters={setFilters}
        onRenderHeatmap={handleRenderHeatmap}
        notifyClusteringStarted={notifyClusteringStarted}
        notifySortStarted={notifySortStarted}
      />
    <div style={{ flex: "1 1 0" }}>  {/* This will be a container for the heatmap and whitespace */}
    <div id="heatmapDiv" style={{
      height:`${HEATMAP_HEIGHT}%`,
      width: `${HEATMAP_WIDTH}%`,  // Take 95% of the parent container's width
      overflow:'visible',
      transform: `translateX(${isDrawerOpen ? `${0}px` : `${-panelWidth}px`})`,
      transition: 'transform 0.3s ease',
    }}
    ref={heatmapRef}
    onMouseDown={handleMouseDown}
    >
      {deckGlInstance}

      {/* ADD THIS OVERLAY - it sits on top of DeckGL and captures events first */}
  {isCropping && (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, // High z-index to be above DeckGL
        cursor: isDrawing ? 'grabbing' : 'crosshair',
        backgroundColor: 'transparent',
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🔍 CROP - Starting crop selection from overlay');
        
        const element = heatmapRef.current;
        if (!element) return;
        
        const { x, y } = getRelativePosition(event, element);
        setIsDrawing(true);
        setCropBox({ startX: x, startY: y, endX: x, endY: y });
      }}
      onMouseMove={(event) => {
        if (!isDrawing) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const element = heatmapRef.current;
        if (!element) return;
        
        const { x, y } = getRelativePosition(event, element);
        setCropBox((prevBox) => {
          if (!prevBox) return null;
          return { ...prevBox, endX: x, endY: y };
        });
      }}
      onMouseUp={(event) => {
        if (!isDrawing) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        console.log('🔍 CROP - Crop selection completed from overlay');
        setIsDrawing(false);
      }}
    />
  )}

    {isCropping && (
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 193, 7, 0.95)',
        color: 'black',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1002,
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        border: '2px solid #ffc107'
      }}>
        🎯 CROP MODE: Click and drag to select area • Press ESC to cancel
      </div>
    )}

{/* Enhanced crop box visualization */}
{cropBox && isDrawing && (
  <>
    <div style={{
      position: 'absolute',
      left: Math.min(cropBox.startX, cropBox.endX),
      top: Math.min(cropBox.startY, cropBox.endY),
      width: Math.abs(cropBox.endX - cropBox.startX),
      height: Math.abs(cropBox.endY - cropBox.startY),
      backgroundColor: 'rgba(0, 123, 255, 0.15)',
      border: '3px dashed rgba(0, 123, 255, 0.8)',
      pointerEvents: 'none',
      zIndex: 1000,
      boxShadow: '0 0 10px rgba(0, 123, 255, 0.3)'
    }}/>
    
    {/* Enhanced size indicator */}
    <div style={{
      position: 'absolute',
      left: Math.max(cropBox.endX, cropBox.startX) + 15,
      top: Math.min(cropBox.startY, cropBox.endY) - 5,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '6px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'none',
      zIndex: 1001,
      fontFamily: 'monospace',
      border: '1px solid rgba(255,255,255,0.3)'
    }}>
      📐 {Math.abs(cropBox.endX - cropBox.startX).toFixed(0)} × {Math.abs(cropBox.endY - cropBox.startY).toFixed(0)}px
    </div>
  </>
)}
      {isMinimapEnabled && heatmapStateRef.current && dataStateRef.current && (
  <div
    style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '150px',
      height: '150px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✨ shadowed background
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      // padding: '6px',
      zIndex: 10,
    }}
  >
    <HeatmapMinimap
      viewState={viewStates.main || viewStates[IDS.VIEWS.HEATMAP_GRID]}
      onViewStateChange={onViewStateChange}
      dataState={dataStateRef.current}
      heatmapState={heatmapStateRef.current}
      width={150} // Give padding room
      height={150}
      colLabelsWidth={colLabelsWidth}
      rowLabelsWidth={rowLabelsWidth}
      opacity={OpacityValue}
    />
  </div>
)}
{/* Pathway Selector Modal
{showPathwaySelector && (
  <PathwaySelector
    pathwayResults={pathwayResults}
    searchQuery={lastSearchQuery}
    onPathwaySelect={handlePathwaySelect}
    onClose={handlePathwaySelectorClose}
  />
)} */}
    </div>
    {order.col === "cluster" && (
            <CustomSlider
              direction="vertical"
              setClusterValue={setColClusterValue}
              width={order.colCat.length > 0 ? colLabelsWidth : 8}
            />
      )}
  
    {order.row === "cluster" && (
      <CustomSlider
        direction="horizontal"
        setClusterValue={setRowClusterValue}
        width={rowLabelsWidth+panelWidth}
      />
    )}
  </div>
    </div>

    {/* Bottom bar with Chat and Minimap */}
<div style={{
  width: "100%",
  height: "10%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px" // Space between chat and minimap
}}>
   <div style={{
    width: "30%",
    display: "flex",
    position: "relative"
  }}>
    <ChatBox
      onSendMessage={(message: string) => handleOllamaSendClick(message)}
      rotatingGifUrl={rotatingGifUrl}
      placeholder="Chat with AI"
      showSuggestions={true}
      disabled={false} // You can control this based on your app state
      width="100%"
    />
  </div>
</div>
 {/* Toast Notifications - ADD THIS */}
 <ToastNotification
  open={toastOpen}
  message={toastMessage}
  severity={toastSeverity}
  onClose={() => setToastOpen(false)}
  duration={3000}
/>
  </div>
):null;
}; 
