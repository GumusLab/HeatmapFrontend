import DeckGL from '@deck.gl/react/typed';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import {queryOllama} from './backendApi/ollama'
import { DataStateShape, HeatmapStateShape } from './types';
import { CATEGORY_LAYER_HEIGHT, CLUSTER_LAYER_HEIGHT, CLUSTER_LAYER_GAP } from "./const";
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
  pvalData,
  onStatsUpdate
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
  const [order, setOrder] = useState({row:"alphabetically",col:"alphabetically",rowCat: [] as string[],sortByRowCat:"",colCat: [] as string[],sortByColCat:"",sortColsByRowName: null as string | null});
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
  // Cropped indices (original data indices from visual selection)
  const [croppedRowIndices, setCroppedRowIndices] = useState<number[] | null>(null);
  const [croppedColIndices, setCroppedColIndices] = useState<number[] | null>(null);

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
      // Check if clicking on a cluster (either row or col)
      if (info?.object?.id === "row-cluster" || info?.object?.id === "col-cluster") {
          console.log('Cluster clicked:', info.object);
          setClickedClusterData({ 
              Nodes: info.object.nodes, 
              Group: info.object.text,
              filters: filters // Include current filters
          });
          setIsTableVisible(true);
      }
      // Then, call the handler passed from the parent if it exists
      onClick?.heatmapCell?.(info, event);
  },
  rowLabel: (info: any, event: any) => {
      // Sort columns by this row's values
      console.log('🖱️ Row label clicked:', info);
      if (info?.index !== undefined && dataStateRef.current?.rowLabels) {
          const rowName = dataStateRef.current.rowLabels[info.index]?.text;
          console.log('📍 Row name extracted:', rowName);
          if (rowName) {
              console.log('✅ Setting order with sortColsByRowName:', rowName);
              setOrder((prev) => {
                  const newOrder = {
                      ...prev,
                      col: "", // Clear standard column sorting
                      sortByColCat: "", // Clear category-based column sorting
                      sortColsByRowName: rowName // Store row name for column sorting
                  };
                  console.log('📝 New order state:', newOrder);
                  return newOrder;
              });
          }
      }
      // Then, call the handler passed from the parent if it exists
      onClick?.rowLabel?.(info, event);
  },
  columnLabel: onClick?.columnLabel,
}), [onClick, filters]); // This now correctly depends on the prop from the parent and filters.



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
        duration: 5000
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
      duration: 5000
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
        const suggestions = (res as any).suggestions as string[] | undefined;
        let errorMessage = res.error || "Sorry, I couldn't process that command.";
        let chatMessage = errorMessage; // Short version for chat history
        if (suggestions && suggestions.length > 0) {
            errorMessage += '\n' + suggestions.map(s => `• ${s}`).join('\n');
        }
        addNotification({
            type: suggestions ? 'info' : 'error',
            title: suggestions ? 'Try These Commands' : 'Command Error',
            message: errorMessage,
            duration: 10000
        });
        return { success: false, message: chatMessage };
    }
    if (!("action" in res)) {
        const errorMessage = "I couldn't determine an action from your command. Try: \"Cluster rows\", \"Sort by variance\", or \"Search for BRCA1\".";
        addNotification({ type: 'error', title: 'Command Unclear', message: errorMessage, duration: 8000 });
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
        
        // ✅ Auto-switch to cluster order when linkage or distance is changed
        // This ensures the user sees the effect of clustering parameter changes
        if (action === "set_linkage" || action === "set_distance" || action === "set_clustering") {
            setOrder((prev) => ({
                ...prev,
                row: 'cluster',
                col: 'cluster',
                sortByRowCat: "",
                sortByColCat: "",
                sortColsByRowName: null
            }));

            // Build notification message based on action type
            let notificationTitle = 'Clustering Updated';
            let notificationMessage = '';

            if (action === "set_clustering") {
                const distance = res.distance || 'correlation';
                const linkage = res.linkage || 'average';
                notificationTitle = 'Clustering Parameters Updated';
                notificationMessage = `Distance: "${distance}", Linkage: "${linkage}". Rows and columns now sorted by cluster order.`;
            } else if (action === "set_linkage") {
                notificationTitle = 'Linkage Updated';
                notificationMessage = `Linkage method set to "${value}". Rows and columns now sorted by cluster order.`;
            } else {
                notificationTitle = 'Distance Updated';
                notificationMessage = `Distance metric set to "${value}". Rows and columns now sorted by cluster order.`;
            }

            addNotification({
                type: 'success',
                title: notificationTitle,
                message: notificationMessage,
                duration: 5000,
            });
        }
        
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
                setOrder((prev) => ({
                    ...prev,
                    row: value || 'cluster',
                    sortByRowCat: "",
                    sortColsByRowName: null  // Clear gene-based column sorting
                }));
            } else if (target === "columns" || target === "cols") {
                setOrder((prev) => ({ ...prev, col: value || 'cluster', sortByColCat: "", sortColsByRowName: null }));
            } else if (target === "both") {
                // Handle compound command - cluster both rows and columns
                setOrder((prev) => ({
                    ...prev,
                    row: value || 'cluster',
                    col: value || 'cluster',
                    sortByRowCat: "",
                    sortByColCat: "",
                    sortColsByRowName: null
                }));
            }
        } else if (action === "sort_by_meta") {
            if (target === "rows") {
                setOrder((prev) => ({
                    ...prev,
                    row: "",
                    sortByRowCat: value,
                    sortColsByRowName: null  // Clear gene-based column sorting
                }));
            } else if (target === "columns" || target === "cols") {
                setOrder((prev) => ({ ...prev, col: "", sortByColCat: value, sortColsByRowName: null }));
            }
        } else if (action === "sort_by_expression") {
            // Sort columns by a specific gene's expression values
            setOrder((prev) => ({
                ...prev,
                col: "",              // Clear standard column sorting
                sortByColCat: "",     // Clear category-based column sorting
                sortColsByRowName: value  // value is the gene name (e.g., "FASLG")
            }));
            addNotification({
                type: 'info',
                title: 'Sorting by Expression',
                message: `Sorting columns by ${value} expression values`,
                duration: 3000,
            });
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
        duration: 5000
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
  // Only process if cropping mode is enabled
  if (!isCropping) return; // Let DeckGL handle panning

  event.preventDefault();
  event.stopPropagation();

  const element = heatmapRef.current;
  if (!element) return;

  const { x, y } = getRelativePosition(event, element);

  // Only start cropping if click is within the heatmap area (not in label regions)
  if (x >= rowLabelsWidth && y >= colLabelsWidth) {
    setIsDrawing(true);
    setCropBox({ startX: x, startY: y, endX: x, endY: y });
  }
};

// Enhanced mouse up handler
const handleMouseUp = (event: any) => {
  if (!isDrawing) return;

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
  setIsCropping(true);
  setCropBox(null);
  setIsDrawing(false);

  // Show user instruction
  setToastMessage("🎯 Cropping mode activated! Click and drag to select an area. Press ESC to cancel.");
  setToastSeverity('info');
  setToastOpen(true);
};

// Note: resetFilteredDict is defined after useViewStates call to access resetViewToOrigin

const cancelCropping = () => {
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
  // If there's an active crop, include the cropped row/column names in the filters
  let filtersWithCrop = { ...currentFilters };

  if (filteredIdxDict && dataStateRef.current) {
    const { rowLabels, colLabels } = dataStateRef.current;

    // Extract the cropped row and column names
    const croppedRows = rowLabels
      .slice(filteredIdxDict.startY, filteredIdxDict.endY + 1)
      .map((label: any) => label.text);
    const croppedCols = colLabels
      .slice(filteredIdxDict.startX, filteredIdxDict.endX + 1)
      .map((label: any) => label.text);

    filtersWithCrop = {
      ...currentFilters,
      cropFilter: {
        rows: croppedRows,
        cols: croppedCols,
        rowIndices: { start: filteredIdxDict.startY, end: filteredIdxDict.endY },
        colIndices: { start: filteredIdxDict.startX, end: filteredIdxDict.endX }
      }
    };
  }

  getRefreshHeatmap(sessionID, filtersWithCrop).then((res) => {
    if ("error" in res) {
        console.error("Heatmap Error:", res.error);
        addNotification({
          type: 'error',
          title: 'Heatmap Error',
          message: typeof res.error === 'string' ? res.error : 'Failed to refresh heatmap data.',
        });
        hideLoading();
        return;
    }

    const { clustering_result } = res;

    if (clustering_result) {
        try {
            const parsedResult = typeof clustering_result === 'string'
                ? JSON.parse(clustering_result)
                : clustering_result;

            filteredData.current = parsedResult;

            // If we applied a crop filter, clear it since the new data is already cropped
            if (filteredIdxDict) {
              setFilteredIdxDict(null);
              setCropBox(null);
              resetViewToOrigin();
            }

            setDataVersion(prev => prev + 1);
        } catch (err) {
            console.error("❌ Error processing clustering result:", err);
            addNotification({
              type: 'error',
              title: 'Processing Error',
              message: 'Failed to parse clustering result from server.',
            });
        }
    }
  }).catch((err) => {
    console.error("❌ Network error refreshing heatmap:", err);
    addNotification({
      type: 'error',
      title: 'Connection Error',
      message: 'Failed to connect to the server. Please check that the backend is running.',
    });
    hideLoading();
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
      console.log('📥 Received message from worker:', event.data);
      let wasDataUpdated = false;

      // Check if the worker sent back a new data state (from a sort/cluster)
      if (event.data.dataState) {
        console.log('✅ DataState received from worker, updating...');
        dataStateRef.current = event.data.dataState;
        setDataStateVersion(prev => prev + 1);
        wasDataUpdated = true;

        // Calculate and report stats
        if (onStatsUpdate && event.data.dataState) {
          const sampleSize = event.data.dataState.rowLabels?.length || 0;
          const numColumns = event.data.dataState.colLabels?.length || 0;
          const dataPoints = sampleSize * numColumns;
          console.log('📊 DeckGL stats calculated:', { sampleSize, numColumns, dataPoints });
          if (sampleSize > 0 && numColumns > 0) {
            onStatsUpdate({ sampleSize, dataPoints });
          }
        }
      }

      // Check if the worker sent back a new heatmap state (from a resize)
      if (event.data.heatmapState) {
        console.log('✅ HeatmapState received from worker:', {
          width: event.data.heatmapState.width,
          height: event.data.heatmapState.height,
          cellDimensions: event.data.heatmapState.cellDimensions
        });
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
      addNotification({
        type: 'error',
        title: 'Processing Error',
        message: 'An error occurred while processing heatmap data. Please try reloading.',
      });
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
          // Send cropped indices (original data indices from visual selection)
          croppedRowIndices,
          croppedColIndices,
          messageType: 'dataState',
        });
      } catch (error) {
        console.error("Failed to send data to worker:", error);
      }
    }
  }, [data, order, dataVersion, croppedRowIndices, croppedColIndices]);


  // HOOK 4: Sends UI Dimension updates TO the worker.
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
  
      

  // Category label DOM — only rebuild when order/layout actually changes, not on every zoom frame
  useEffect(() => {
    if (!container) return;
    const containerElement = container as HTMLDivElement;

    // --- Column category labels ---
    if (order.colCat.length >= 0 && rowLabelsWidth > 0 && colLabelsWidth > 0) {
      const oldLabels = containerElement.querySelectorAll('.col-category-label');
      oldLabels.forEach(label => containerElement.removeChild(label));

      for (let i = 0; i < order.colCat.length; i++) {
        const label = document.createElement('label');
        let labelId = order.colCat[i].split(' ').join('_');
        if (labelId.includes('#')) labelId = labelId.replace('#', 'no');
        label.id = labelId;
        label.className = 'col-category-label';
        label.style.position = 'absolute';
        const initialGap = INITIAL_GAP;
        const gap = LAYER_GAP;
        const clusterOffset = order.col === 'cluster' ? (CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP) : 0;
        const yPosition = colLabelsWidth - initialGap - clusterOffset - ((i + 1) * (CATEGORY_LAYER_HEIGHT + gap));
        label.style.top = `${yPosition}px`;
        label.textContent = `${capitalizeFirstLetter(order.colCat[i])}`;
        if (order.col !== 'cluster') {
          const catName = order.colCat[i];
          label.addEventListener('click', () => {
            setOrder((prevOrder: any) => ({ ...prevOrder, sortByColCat: catName }));
          });
        }
        const offset = labels?.row?.offset ? labels.row.offset : DEFAULT_LABEL_OFFSET + 2;
        label.style.fontSize = `${CATEGORY_LAYER_HEIGHT}px`;
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = 'bold';
        const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
        const width = getTextWidth(label.textContent, labelFont);
        label.style.width = `${width}px`;
        label.style.color = '#333333';
        label.style.textAlign = 'right';
        label.style.left = isDrawerOpen ? `${panelWidth + rowLabelsWidth - width - offset}px` : `${rowLabelsWidth - width - offset}px`;
        containerElement.appendChild(label);
      }
    }

    // --- Row category labels ---
    if (order.rowCat.length > 0 && rowLabelsWidth > 0 && colLabelsWidth > 0) {
      const oldRowLabels = containerElement.querySelectorAll('.row-category-label');
      oldRowLabels.forEach(label => containerElement.removeChild(label));

      order.rowCat.forEach((cat, i) => {
        let labelId = cat.split(' ').join('_');
        if (labelId.includes('#')) labelId = labelId.replace('#', 'no');
        const label = document.createElement('label');
        label.id = labelId;
        label.className = 'row-category-label';
        label.style.position = 'absolute';
        label.textContent = capitalizeFirstLetter(cat);
        if (order.row !== 'cluster') {
          label.addEventListener('click', () => {
            setOrder(prev => ({ ...prev, sortByRowCat: cat, sortColsByRowName: null }));
          });
        }
        label.style.fontSize = `${CATEGORY_LAYER_HEIGHT}px`;
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = 'bold';
        const font = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
        const width = getTextWidth(label.textContent, font);
        label.style.width = `${width}px`;
        label.style.color = '#333333';
        label.style.textAlign = 'right';
        label.style.cursor = order.row !== 'cluster' ? 'pointer' : 'default';
        const gap = LAYER_GAP;
        const catH = CATEGORY_LAYER_HEIGHT;
        const initialGap = INITIAL_GAP;
        const clusterOffset = order.row === 'cluster' ? (CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP) : 0;
        const xPos = panelWidth + rowLabelsWidth - initialGap - clusterOffset - ((i + 1) * (catH + gap)) + catH;
        const yPos = (heatmapStateRef.current?.height || 0) + colLabelsWidth + 5;
        label.style.left = `${xPos}px`;
        label.style.top = `${yPos}px`;
        label.style.transform = 'rotate(90deg)';
        label.style.transformOrigin = 'top left';
        containerElement.appendChild(label);
      });
    }
  }, [order.colCat, order.rowCat, order.col, order.row, rowLabelsWidth, colLabelsWidth, panelWidth, isDrawerOpen, labels?.row?.offset, container]);
  


  const { viewStates, onViewStateChange, visibleBounds, isZoomedOut, resetViewToOrigin } = useViewStates(
    container,
    dimensions,
    heatmapStateRef.current,
    dataStateRef.current,
    panelWidth,
    searchTerm, // Add the search term parameter
    colLabelsWidth, // Add the column labels width parameter
    null // Data is already cropped by computeDataState, pan constraints use dataState dimensions
  );

  // Reset function - clears crop and resets view to show full heatmap
  const resetFilteredDict = () => {
    setFilteredIdxDict(null);
    setCropBox(null);
    setIsCropping(false);
    setIsDrawing(false);
    // Clear cropped indices to trigger worker to load full data
    setCroppedRowIndices(null);
    setCroppedColIndices(null);

    // Reset view to origin for the full heatmap
    resetViewToOrigin();

    // Show reset message
    setToastMessage("🔄 Crop filter cleared! Showing full heatmap.");
    setToastSeverity('success');
    setToastOpen(true);
  };

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

    // Note: When filteredIdxDict is active, computeDataState already produces cropped data.
    // So we pass null to layers - they don't need to filter again since data is already cropped.
    // The layers will use dataState.numRows/numColumns which reflect the cropped dimensions.
    return getLayers({
        dataState: dataStateRef.current,
        heatmapState: heatmapStateRef.current,
        visibleBounds,
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
        filteredIdxDict: null // Data is already cropped by computeDataState, no need to filter in layers
    });
}, [
    // ZOOM OPTIMIZATION (2026-01-04):
    // - viewStates REMOVED: Changes every zoom frame, causing expensive layer recreation.
    //   DeckGL handles viewState internally via its viewState prop.
    // - visibleIndices REPLACED with visibleBounds: Bounds is more stable and sufficient
    //   for layer rendering. visibleIndices changed too frequently during zoom.
    // See ZOOM_OPTIMIZATION_NOTES.md for full details.
    datastateVersion,
    heatmapstateVersion,
    visibleBounds, // OPTIMIZATION: Use bounds instead of visibleIndices
    // visibleIndices, // REMOVED - changes too frequently during zoom
    // viewStates, // REMOVED - changes every zoom frame
    stableOnClick,
    labels,
    colLabelsWidth,
    rowLabelsWidth,
    searchTerm,
    order,
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

  // onClick handler to download matrix as TSV file (using current dataState - what user sees)
  const downloadMatrix = () => {
    const currentDataState = dataStateRef.current;

    if (!currentDataState) {
      console.warn('No data available for download');
      return;
    }

    const { values, numRows, numColumns, rowLabels, colLabels } = currentDataState;

    // Get unique category keys for rows and columns
    const rowCategoryKeys: string[] = [];
    const colCategoryKeys: string[] = [];

    const rowCatSet = new Set<string>();
    rowLabels.forEach(row => {
      if (row.category) {
        Object.keys(row.category).forEach(key => rowCatSet.add(key));
      }
    });
    rowCategoryKeys.push(...Array.from(rowCatSet));

    const colCatSet = new Set<string>();
    colLabels.forEach(col => {
      if (col.category) {
        Object.keys(col.category).forEach(key => colCatSet.add(key));
      }
    });
    colCategoryKeys.push(...Array.from(colCatSet));

    // Number of empty prefix cells = 1 (row name) + number of row categories
    const numPrefixCells = 1 + rowCategoryKeys.length;

    const tsvRows: string[] = [];

    // Row 1: Empty cells + Column names
    const headerRow: string[] = Array(numPrefixCells).fill('');
    headerRow.push(...colLabels.map(col => col.text));
    tsvRows.push(headerRow.join('\t'));

    // Column metadata rows (one row per column category key)
    for (const categoryKey of colCategoryKeys) {
      const metadataRow: string[] = Array(numPrefixCells).fill('');
      for (const col of colLabels) {
        const value = col.category?.[categoryKey] || '';
        // Check if value already contains the key prefix to avoid duplication
        const formattedValue = value.startsWith(`${categoryKey}:`) ? value : `${categoryKey}:${value}`;
        metadataRow.push(formattedValue);
      }
      tsvRows.push(metadataRow.join('\t'));
    }

    // Data rows: Row name + Row categories + values
    for (let row = 0; row < numRows; row++) {
      const rowLabel = rowLabels[row];
      const rowData: (string | number)[] = [rowLabel.text];

      // Add each row category value
      for (const categoryKey of rowCategoryKeys) {
        const value = rowLabel.category?.[categoryKey] || '';
        // Check if value already contains the key prefix to avoid duplication
        const formattedValue = value.startsWith(`${categoryKey}:`) ? value : `${categoryKey}:${value}`;
        rowData.push(formattedValue);
      }

      // Add values
      for (let col = 0; col < numColumns; col++) {
        const value = values[row * numColumns + col];
        rowData.push(isNaN(value) ? '' : value);
      }

      tsvRows.push(rowData.join('\t'));
    }

    const tsvString = tsvRows.join('\r\n');
    const blob = new Blob([tsvString], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    // Use different filename if data is cropped
    const isCropped = croppedRowIndices !== null || croppedColIndices !== null;
    a.download = isCropped ? 'heatmap_cropped.tsv' : 'heatmap.tsv';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const downloadPdf = async () => {
    // Use the container element which includes both DeckGL canvas and category labels
    const containerElement = container as HTMLElement;

    if (!containerElement) {
      console.warn('Container element not found for snapshot');
      return;
    }

    try {
      // Force DeckGL to redraw before capture
      if (containerRefDeckgl.current?.deck) {
        containerRefDeckgl.current.deck.redraw(true);
      }

      // Use html2canvas to capture the entire container including HTML overlays (category labels)
      const canvas = await html2canvas(containerElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        // Ensure WebGL canvas is captured
        onclone: (clonedDoc) => {
          // Copy WebGL canvas content to the cloned document
          const originalCanvas = containerElement.querySelector('canvas');
          const clonedCanvas = clonedDoc.querySelector('canvas');
          if (originalCanvas && clonedCanvas) {
            const ctx = clonedCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(originalCanvas, 0, 0);
            }
          }
        }
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.addImage(dataUrl, 'png', 0, 0, pdfWidth, pdfHeight);

      pdf.save('HeatmapImg.pdf');
    } catch (error) {
      console.error('Error generating PDF snapshot:', error);
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate PDF snapshot. Please try again.',
      });
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
const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);

// Determine if aggregation is happening (same logic as getHeatmapGridLayerScatter.ts)
// Aggregation starts when zoom < BASE_ZOOM (i.e., zoom < 0)
const isAggregated = currentZoom < BASE_ZOOM;

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
  if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current && dimensions) {
    try {
      // Compute screen coords relative to the heatmap grid view
      // cropBox coords are relative to the heatmap container (which starts after the panel)
      // We need to subtract rowLabelsWidth to get coords relative to the heatmap grid
      const sx = Math.max(0, cropBox.startX - rowLabelsWidth);
      const ex = Math.max(0, cropBox.endX   - rowLabelsWidth);
      const sy = Math.max(0, cropBox.startY - colLabelsWidth);
      const ey = Math.max(0, cropBox.endY   - colLabelsWidth);

      // Get cell dimensions
      const { width: cellW, height: cellH } = heatmapStateRef.current.cellDimensions;

      // IMPORTANT: Use heatmapState dimensions for offset calculation (matches scatter layer)
      // These are the dimensions used for centering cells in the scatter layer
      const heatmapStateWidth = heatmapStateRef.current.width;
      const heatmapStateHeight = heatmapStateRef.current.height;

      // Calculate actual deck.gl view dimensions (matches useViews.ts)
      // The view is larger than heatmapState dimensions by rowLabelsWidth/colLabelsWidth
      const availableWidth = (dimensions[0] - panelWidth) * HEATMAP_WIDTH / 100;
      const availableHeight = dimensions[1] * HEATMAP_PARENT_HEIGHT_RATIO / 100 * HEATMAP_HEIGHT / 100;
      const viewWidth = availableWidth - rowLabelsWidth;
      const viewHeight = availableHeight - colLabelsWidth;

      // Get current view state for zoom
      const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
      const zoomValue = currentViewState?.zoom;
      const zoom: number = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);
      const target = currentViewState?.target || [0, 0];

      // Calculate scale factor based on zoom
      const scale = Math.pow(2, zoom - BASE_ZOOM);
      const baseScaleFactor = Math.pow(2, BASE_ZOOM);

      // Offset uses heatmapState dimensions (same as scatter layer centering)
      const offsetX = heatmapStateWidth / 2 / baseScaleFactor;
      const offsetY = heatmapStateHeight / 2 / baseScaleFactor;

      // Convert screen coords to world coords
      const minScreenX = Math.min(sx, ex);
      const maxScreenX = Math.max(sx, ex);
      const minScreenY = Math.min(sy, ey);
      const maxScreenY = Math.max(sy, ey);

      // The viewport center is at the center of the actual deck.gl view
      // This is where world coordinate [0,0] appears on screen when target=[0,0]
      const viewportCenterX = viewWidth / 2;
      const viewportCenterY = viewHeight / 2;

      // Convert screen to world coordinates using deck.gl OrthographicView formula
      const wx1 = ((minScreenX - viewportCenterX) / scale) + target[0];
      const wy1 = ((minScreenY - viewportCenterY) / scale) + target[1];
      const wx2 = ((maxScreenX - viewportCenterX) / scale) + target[0];
      const wy2 = ((maxScreenY - viewportCenterY) / scale) + target[1];

      // Convert world coords to cell indices
      // Cell position formula in scatter layer: x = col * cellW + cellW/2 - offsetX
      // Inverse: col = (x + offsetX - cellW/2) / cellW
      // For left edge of selection, use floor to get first cell that overlaps
      // For right edge, use floor to get last cell that overlaps
      const colStart = Math.floor((wx1 + offsetX) / cellW);
      const colEnd   = Math.floor((wx2 + offsetX) / cellW);
      const rowStart = Math.floor((wy1 + offsetY) / cellH);
      const rowEnd   = Math.floor((wy2 + offsetY) / cellH);

      // Clamp visual indices to valid ranges
      const maxCols = dataStateRef.current.numColumns - 1;
      const maxRows = dataStateRef.current.numRows    - 1;
      const visualColStart = Math.max(0, Math.min(colStart, maxCols));
      const visualColEnd   = Math.max(0, Math.min(colEnd,   maxCols));
      const visualRowStart = Math.max(0, Math.min(rowStart, maxRows));
      const visualRowEnd   = Math.max(0, Math.min(rowEnd,   maxRows));

      // Get the index mappings from dataState
      // These map: visualPosition -> originalIndex
      const { sortedRowIndices, sortedColIndices } = dataStateRef.current;

      if (!sortedRowIndices || !sortedColIndices) {
        throw new Error('sortedRowIndices or sortedColIndices not available');
      }

      // Convert visual indices to ORIGINAL indices using the mapping
      // This ensures we select the same data the user sees on screen
      const originalRowIndices: number[] = [];
      for (let v = visualRowStart; v <= visualRowEnd; v++) {
        originalRowIndices.push(sortedRowIndices[v]);
      }

      const originalColIndices: number[] = [];
      for (let v = visualColStart; v <= visualColEnd; v++) {
        originalColIndices.push(sortedColIndices[v]);
      }

      // Store visual bounds for pan constraints (still needed for view management)
      const filtered = {
        startX: visualColStart,
        endX:   visualColEnd,
        startY: visualRowStart,
        endY:   visualRowEnd
      };

      // Clear cropBox FIRST to prevent re-triggering this useEffect
      setCropBox(null);

      // Update states
      setFilteredIdxDict(filtered);  // Visual bounds for pan constraints
      setCroppedRowIndices(originalRowIndices);  // Original indices for worker
      setCroppedColIndices(originalColIndices);  // Original indices for worker

      // Reset view to origin so cropped data starts at top-left
      resetViewToOrigin();

      setToastMessage(`✅ Crop applied! ${originalRowIndices.length} rows × ${originalColIndices.length} cols`);
      setToastSeverity('success');
      setToastOpen(true);

      // Auto-disable cropping mode
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
  dimensions,
  panelWidth,
  // Note: viewStates is intentionally NOT in deps - we read it at crop time but don't want to re-run on viewState changes
  heatmapStateRef.current?.cellDimensions?.height,
  heatmapStateRef.current?.cellDimensions?.width,
  dataStateRef.current?.numColumns,
  dataStateRef.current?.numRows,
  resetViewToOrigin
]);

// Also add this helper function for debugging crop coordinates
const debugCropCoordinates = (event: React.MouseEvent<HTMLDivElement>) => {
  if (!heatmapRef.current || !heatmapStateRef.current) return;
  
  const rect = (heatmapRef.current as HTMLDivElement).getBoundingClientRect();
  const screenX = event.clientX - rect.left - rowLabelsWidth;
  const screenY = event.clientY - rect.top - colLabelsWidth;
  
  const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
  const zoomValue = currentViewState?.zoom;
  const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);
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
          controller={!isCropping ? {
            scrollZoom: {
              speed: 0.03,  // Increased from 0.01 for faster zoom
              smooth: true  // Enable smooth zoom transitions
            },
            inertia: 300,  // Momentum after gestures (ms)
            dragPan: true,
            doubleClickZoom: true,  // Double click = zoom in
            keyboard: true  // Shift + Double click = zoom out
          } : false}
          onClick={(event) => {
            const obj = event.object;
            console.log('DeckGL onClick:', obj);
            if (obj?.id === "row-cluster" || obj?.id === "col-cluster") {
              setClickedClusterData({ 
                  Nodes: obj.nodes, 
                  Group: obj.text,
                  filters: filters // Include current filters
              });
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
        cropBox={filteredIdxDict}
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

      {/* Aggregation indicator badge - shown when cells are being averaged, positioned at bottom right */}
      {isAggregated && (
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Aggregated view - Zoom in for gene-level detail
        </div>
      )}

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

    {/* Zoom controls hint */}
    <div style={{
      width: '100%',
      textAlign: 'center',
      padding: '4px 0',
      fontSize: '13px',
      color: '#888',
      fontFamily: 'Arial, sans-serif'
    }}>
      Scroll to zoom • Double-click to zoom in • Shift/Cmd + double-click to zoom out • Drag to pan
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
