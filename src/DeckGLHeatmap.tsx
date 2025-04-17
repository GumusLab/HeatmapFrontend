import DeckGL from '@deck.gl/react/typed';
import jsPDF from 'jspdf';
import { merge } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeckGLHeatmapProps } from './DeckGLHeatmap.types';
import { generateTooltipContent } from './GenerateTooltip';
import MySnackbar from './components/HoverTable';
import Legend2 from './components/Legend2';
import PersistentDrawerLeft from './components/Panel';
import CustomSlider from './components/Slider';
import { DEFAULT_LABEL_OFFSET, MAX_CATEGORIES, OPACITY,HEATMAP_PARENT_HEIGHT_RATIO, HEATMAP_PARENT_WIDTH_RATIO, HEATMAP_WIDTH, HEATMAP_HEIGHT } from './const';
import { layerFilter } from './layerFilter';
import { getLayers } from './layers/getLayers';
import { getHeatmapState } from './state/getHeatmapState';
import { useDataState } from './state/useDataState';
import { useDimensions } from './state/useDimensions';
import { useLabelState } from './state/useLabelState';
import { useViewStates } from './state/useViewStates';
import { useViews } from './state/useViews';
import getTextWidth from './utils/getTextWidth';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import {callChatGPT} from './backendApi/openAi'
import {queryOllama} from './backendApi/ollama'
import generateRange from './utils/generateRange';
import { CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { DataStateShape, HeatmapStateShape } from './types';
import { CATEGORY_LAYER_HEIGHT } from "./const";
import {computeDataState} from './computeDatastate';
import { createDataWorker } from './utils/workerFactory';
import { dataWorkerCode } from './workers/data-worker-string';
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

let workerCount = 0;


export const DeckGLHeatmap = ({
  key,
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
  const [inputValue, setInputValue] = useState(''); // State to hold the text field value
  const [hoveredLabelRow,setHoveredLabelRow] = useState<number|null>(null);
  const [hoveredLabelCol,setHoveredLabelCol] = useState<number|null>(null);



  const dataStateRef = useRef<DataStateShape | null>(null);
  const heatmapStateRef = useRef<HeatmapStateShape | null>(null);
  const workerRef = useRef<Worker | null>(null);
    // Two separate lightweight version counters
  const [datastateVersion, setDataStateVersion] = useState(0);
  const [heatmapstateVersion, setHeatmapStateVersion] = useState(0);
  // Store large data in a ref to avoid unnecessary re-renders
  // const [isOrderValid, setIsOrderValid] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);

  // const [hoveredLabel, setHoveredLabel] = useState({ row: null, column: null });

  tooltipFunction = generateTooltipContent
  // Handle the click of the Send button
  const handleSendClick = () => {
    if (inputValue.trim()) {
      callChatGPT(inputValue).then((res)=>{
        if(res){
          if(res["action"] === 'search'){
            setSearchTerm(res["value"])
          }
          else if(res["action"] === "sort"){
            if(res["target"] === "rows"){
              setOrder((prevOrder:any) => ({ ...prevOrder, row: res["value"], sortByRowCat:""}));
            }
            else{
              setOrder((prevOrder:any) => ({ ...prevOrder, col: res["value"], sortByColCat:""}));
            }
          }
          else if(res["action"] === "cluster"){
            if(res["target"] === "rows"){
              setOrder((prevOrder:any) => ({ ...prevOrder, row: "cluster", sortByRowCat:""}));
            }
            else{
              setOrder((prevOrder:any) => ({ ...prevOrder, col: "cluster", sortByColCat:""}));
            }
          }

        }
      }); // Call the function with the input value
      setInputValue('');  // Clear the text field after sending
    }
  };
  

  const handleOllamaSendClick = () => {
    if (inputValue.trim()) {
        queryOllama(inputValue).then((res) => {
            // Type Guard: Ensure res is a valid HeatmapResponse
            if ("action" in res && "target" in res && "context" in res) {
                const action = res.action;
                const target = res.target;
                const value = res.value || ""; // Ensure value is defined

                if (action === "search") {
                    setSearchTerm(value);
                } 
                else if (action === "sort") {
                    if (target === "rows") {
                        setOrder((prevOrder: any) => ({
                            ...prevOrder,
                            row: value,
                            sortByRowCat: ""
                        }));
                    } else if (target === "columns") {
                        setOrder((prevOrder: any) => ({
                            ...prevOrder,
                            col: value,
                            sortByColCat: ""
                        }));
                    }
                } 
                else if (action === "cluster") {
                    if (target === "rows") {
                        setOrder((prevOrder: any) => ({
                            ...prevOrder,
                            row: "cluster",
                            sortByRowCat: ""
                        }));
                    } else if (target === "columns") {
                        setOrder((prevOrder: any) => ({
                            ...prevOrder,
                            col: "cluster",
                            sortByColCat: ""
                        }));
                    }
                }
            } else {
                console.error("Invalid response from Ollama:", res);
            }
        }).catch((err) => {
            console.error("Error querying Ollama:", err);
        });

        setInputValue(""); // Clear input field after sending
    }
};




  const rotatingGifUrl = 'https://i.pinimg.com/originals/39/b9/8f/39b98fd9cfae359c9d1fbee154bd279a.gif';




  // ✅ Reset `isOrderValid` whenever `dataId` changes (new data uploaded)
  

  let catTemporary = { "row": {}, "col": {}}
  let rowCats: Record<string, string> = {};
  let colCats: Record<string, string> = {};
  
  // Extract row and column categories if they exist
  if (data.cat_colors) {
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
  }, [dataId]); // ✅ Runs only when `dataId` changes
  
  // useEffect(() => {
  //   if (!isOrderValid) {
  //     console.log("⏳ Waiting for order validation...");
  //     setIsLoading(true);
  //   } else {
  //     setIsLoading(false);
  //   }
  // }, [isOrderValid]); // Ensure `useEffect` runs when `isOrderValid` changes
  
 // Function to enable cropping mode
 const enableCropping = () => {
  setIsCropping(true);
};

const resetFilteredDict = () => {
  setFilteredIdxDict(null);
  setCropBox(null);
}

 // Function to get relative position of the mouse event to the heatmap element
 const getRelativePosition = (event:any, element:any) => {
  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left).toFixed(2);  // Force two decimal points
  const y = (event.clientY - rect.top).toFixed(2);   // Force two decimal points
  return { x: parseFloat(x), y: parseFloat(y) };
};

// Mouse down event to start drawing if cropping mode is enabled
const handleMouseDown = (event:any) => {
  if (!isCropping) return; // Only start drawing if cropping mode is active
  const element = heatmapRef.current;  // Reference to heatmap container
  const { x, y } = getRelativePosition(event, element);  // Get relative coordinates
  setIsDrawing(true);  // Start drawing the box
  setCropBox({ startX: x, startY: y, endX: x, endY: y});
};

// Mouse move event to update the cropping box dynamically
const handleMouseMove = (event: MouseEvent) => {
  if (!isDrawing) return; // Only update the box while drawing
  const element = heatmapRef.current;
  const { x, y } = getRelativePosition(event, element);
  setCropBox((prevBox) => {
    if (!prevBox) return null; // Ensure prevBox exists before updating
    return { ...prevBox, endX: x, endY: y};
  });
};


// Mouse up event to finish the drawing
const handleMouseUp = (event:any) => {
  if (!isDrawing) return;
  setIsDrawing(false);  // Stop drawing
  setIsCropping(false);  // Disable cropping mode after drawing is finished
  // Apply any logic you want after cropping is finished (e.g., filtering heatmap data)
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

//   useEffect(() => {
//     console.log("Starting worker initialization");
    
//     try {
//       // Try to create the worker
//       console.log("Attempting to create worker with path:", 'data-worker.ts');
//       workerRef.current = new Worker('data-worker.ts');
//       console.log("Worker created successfully");
      
//       // Set up message handler
//       workerRef.current.onmessage = (event) => {
//         console.log("Message received from worker:", event.data);
//         if (event.data.dataState) {
//           dataStateRef.current = event.data.dataState;
//           setDataStateVersion(prev => prev + 1);
//           console.log("Updated dataState");
//         }
//         if (event.data.heatmapState) {
//           heatmapStateRef.current = event.data.heatmapState;
//           setHeatmapStateVersion(prev => prev + 1);
//           console.log("Updated heatmapState");
//         }
//       };
      
//       // Add error handler for worker
//       workerRef.current.onerror = (error) => {
//         console.error("Worker error:", error);
//       };
      
//     } catch (error) {
//       console.error("Worker initialization failed:", error);
//       // Here you would implement fallback processing
//     }
    
//     return () => {
//       if (workerRef.current) {
//         console.log("Terminating worker");
//         workerRef.current.terminate();
//       }
//     };
//   }, []);
  
//   // Also add logging to the message sending
//   useEffect(() => {
//     if (workerRef.current && data) {
//       try {
//         console.log("Sending data to worker");
//         workerRef.current.postMessage({
//           data,
//           order,
//           catTemporary,
//           filteredIdxDict,
//           messageType: 'dataState',
//         });
//         console.log("Data sent to worker successfully");
//       } catch (error) {
//         console.error("Failed to send data to worker:", error);
//       }
//     } else {
//       console.log("Cannot send data to worker:", {
//         workerExists: !!workerRef.current,
//         dataExists: !!data
//       });
//     }
//   }, [data, order, catTemporary,filteredIdxDict]);


//  // heatmapState updates
//  useEffect(() => {
//   if (workerRef.current && dimensions) {
//     workerRef.current.postMessage({
//       dimensions,
//       colLabelsWidth,
//       rowLabelsWidth,
//       ID,
//       messageType: 'heatmapState',
//     });
//   }
// }, [dimensions, colLabelsWidth, rowLabelsWidth, datastateVersion]);

useEffect(() => {
  console.log("Starting worker initialization");
  
  try {
    // Try to create the worker
    console.log("Attempting to create worker with path:", 'data-worker.ts');
    workerCount++;
    console.log(`Creating worker #${workerCount}`);
    workerRef.current = createDataWorker(dataWorkerCode);
    console.log("Worker created successfully");
    // Set up message handler
    workerRef.current.onmessage = (event) => {
      console.log("Message received from worker:", event.data);
      if (event.data.dataState) {
        dataStateRef.current = event.data.dataState;
        setDataStateVersion(prev => prev + 1);
        console.log("Updated dataState");
      }
      if (event.data.heatmapState) {
        heatmapStateRef.current = event.data.heatmapState;
        setHeatmapStateVersion(prev => prev + 1);
        console.log("Updated heatmapState");
      }
    };
    
    // Add error handler for worker
    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
    };
    
  } catch (error) {
    console.error("Worker initialization failed:", error);
    // Here you would implement fallback processing
  }
  
  return () => {
    if (workerRef.current) {
      console.log("Terminating worker");
      workerRef.current.terminate();
    }
  };
}, []);

  // Also add logging to the message sending
  useEffect(() => {
    if (workerRef.current && data) {
      try {
        console.log("Sending data to worker");
        workerRef.current.postMessage({
          data,
          order,
          catTemporary,
          filteredIdxDict,
          messageType: 'dataState',
        });
        console.log("Data sent to worker successfully");
      } catch (error) {
        console.error("Failed to send data to worker:", error);
      }
    } else {
      console.log("Cannot send data to worker:", {
        workerExists: !!workerRef.current,
        dataExists: !!data
      });
    }
  }, [data, order, filteredIdxDict]);

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
  }, [dimensions, colLabelsWidth, rowLabelsWidth, panelWidth,datastateVersion]);




// Replace with direct data processing on main thread
// useEffect(() => {
//   if (data) {
//     console.log("Processing data on main thread");
//     try {
//       // Directly compute data state on main thread
//       const processedData = computeDataState(data, order, catTemporary, filteredIdxDict);
      
//       // Store it in ref
//       dataStateRef.current = processedData;
//       setDataStateVersion(prev => prev + 1);
//       console.log("Updated dataState on main thread");
//     } catch (error) {
//       console.error("Error processing data on main thread:", error);
//     }
//   }
// }, [data,order,filteredIdxDict]);

// Direct heatmap state processing
// useEffect(() => {
//   if (dataStateRef.current && dimensions) {
//     console.log("Processing heatmap state on main thread");
//     try {
//       // Compute heatmap state directly
//       const processedHeatmap = getHeatmapState(
//         dataStateRef.current,
//         colLabelsWidth,
//         rowLabelsWidth,
//         dimensions,
//         ID
//       );
      
//       // Store in ref
//       heatmapStateRef.current = processedHeatmap;
//       setHeatmapStateVersion(prev => prev + 1);
//       console.log("Updated heatmapState on main thread");
//     } catch (error) {
//       console.error("Error processing heatmap state on main thread:", error);
//     }
//   }
// }, [dimensions, colLabelsWidth, rowLabelsWidth, datastateVersion]);



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



  // const dataState = useDataState(data,order,catTemporary,filteredIdxDict);

  // const dimensions = useDimensions(container);

  // const heatmapState = useMemo(
  //   () =>
  //     getHeatmapState(dataState, colLabelsWidth, rowLabelsWidth, dimensions, ID),
  //   [dataState, dimensions, colLabelsWidth, rowLabelsWidth,searchTerm,order]
  // );

  // useLabelState(
  //   dataState,
  //   heatmapState,
  //   labels,
  //   container,
  //   order,
  //   ID,
  //   setLabelsState
  // );
  
  // if(order.colCat.length >= 0 && rowLabelsWidth > 0 && colLabelsWidth > 0) {
  //   const containerElement: HTMLDivElement = container;
    
  //   // First remove all existing labels by their actual IDs
  //   for(let i = 0; i < order.colCat.length; i++) {
  //     let labelId = order.colCat[i];
      
  //     // Replace spaces with underscores for all IDs, not just those with '#'
  //     labelId = labelId.split(' ').join('_');
      
  //     // Also handle the '#' replacement if necessary
  //     if(labelId.includes('#')) {
  //       labelId = labelId.replace('#', 'no');
  //     }
        
  //     const labelToRemove = containerElement.querySelector(`#${labelId}`);
  //     if(labelToRemove && containerElement.contains(labelToRemove)) {
  //       containerElement.removeChild(labelToRemove);
  //     }
  //   }
    
  //   // Then create new labels
  //   for(let i = 0; i < order.colCat.length; i++) {
  //     const label = document.createElement('label');
      
  //     // Create clean IDs with consistent handling of spaces for all labels
  //     let labelId = order.colCat[i];
  //     labelId = labelId.split(' ').join('_');
  //     if(labelId.includes('#')) {
  //       labelId = labelId.replace('#', 'no');
  //     }
      
  //     label.id = labelId;
      
  //     label.style.position = 'absolute';
  //     const initialGap = 1;
  //     const gap = 1;
  //     const yPosition = colLabelsWidth - initialGap - ((i+1) * (CATEGORY_LAYER_HEIGHT*2 +gap ));
  //     label.style.top = `${yPosition}px`;
  //     label.textContent = `${capitalizeFirstLetter(order.colCat[i])}`;
      
  //     if(order.row !== 'cluster') {
  //       label.addEventListener('click', () => {
  //         setOrder((prevOrder:any) => ({ ...prevOrder, sortByColCat:order.colCat[i]}));
  //       });
  //     }
      
  //     const offset = labels?.row?.offset ? labels.row.offset : DEFAULT_LABEL_OFFSET + 2;
  //     label.style.fontSize = `${CATEGORY_LAYER_HEIGHT*2}px`;
  //     label.style.fontFamily = 'Arial, sans-serif';
  //     label.style.fontWeight = '525';
  //     const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
  //     const width = getTextWidth(label.textContent, labelFont);
  //     label.style.width = `${width}px`;
  //     label.style.color = '#333333';
  //     label.style.textAlign = 'right';
  //     label.style.left = isDrawerOpen ? `${panelWidth + rowLabelsWidth - width - offset}px`:`${rowLabelsWidth - width - offset}px`;
      
  //     containerElement.appendChild(label);
  //   }
  // }

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

  // if(order.colCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0){
  //   const containerElement: HTMLDivElement = container;
  //   const colCategoryNames = Object.keys(categories.col);
  //   for(let i = 0;i<colCategoryNames.length;i++){

  //     const labelToRemove = colCategoryNames[i].includes('#') ?containerElement.querySelector(`#${colCategoryNames[i].replace('#','no').split(' ').join('_')}`): containerElement.querySelector(`#${colCategoryNames[i]}`);
  //     if(labelToRemove && containerElement.contains(labelToRemove)){
  //       containerElement.removeChild(labelToRemove);
  //     }
  //   }
  //   // if(order.col !== 'cluster'){
  //   for(let i = 0;i<order.colCat.length;i++){
  //     const label = document.createElement('label');
  //     label.id = order.colCat[i].includes('#')?`${order.colCat[i].replace('#','no').split(' ').join('_')}` :`${order.colCat[i]}`;
  //     label.style.position = 'absolute';
  //     // const topMargin = deckglProps?.style?.top;
  //     // if(topMargin){
  //       // 17px
  //       // (order.colCat.length-i)*17
      
  //     // label.style.top = `${25+colLabelsWidth/2-(i+1)*8}px`;
  //     /* So height of each layer is 8 but it is pixel to convert to common unit we multiply it by 2 */
  //     label.style.top = `${(colLabelsWidth-(i+1)*18)}px`
  //     //`${35+(colLabelsWidth-(i+1)*16)}px`;

  //     // + colLabelsWidth-(i+1)*15+20
  //     // }
    
  //     label.textContent = `${capitalizeFirstLetter(order.colCat[i])}`;
  //     if(order.row !== 'cluster'){
  //     label.addEventListener('click',()=>{
  //       setOrder((prevOrder:any) => ({ ...prevOrder, sortByColCat:order.colCat[i]}))
  //     });}
  //     const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
  //     label.style.fontSize = '14px';
  //     label.style.fontFamily = 'Arial, sans-serif';
  //     label.style.fontWeight = '525';
  //     const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
  //     const width = getTextWidth(label.textContent,labelFont)
  //     label.style.width = `${width}px`;
  //     label.style.color = '#333333';
  //     label.style.textAlign= 'right';
  //     /*We added 10 pixel because the panel icon has 10 pixel width */
  //     label.style.left = `${175 + rowLabelsWidth-width-offset}px` //isDrawerOpen?`${200+rowLabelsWidth-width-offset}px`:`${50+rowLabelsWidth-width-offset}px`;
  //     // label.style.border = '1px solid black';
  //     containerElement.appendChild(label);
  
  //   }
  //   // }
  // }




  if(order.rowCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0 && container && dimensions){
    const containerElement = container;
    const rowCategoryNames = Object.keys(categories.row);
    for(let i = 0;i<rowCategoryNames.length;i++){

      const labelToRemove = rowCategoryNames[i].includes('#') ?containerElement.querySelector(`#${rowCategoryNames[i].replace('#','no').split(' ').join('_')}`): containerElement.querySelector(`#${rowCategoryNames[i]}`);
      if(labelToRemove && containerElement.contains(labelToRemove)){
        containerElement.removeChild(labelToRemove);
      }
    }
   
   for(let i = 0;i<order.rowCat.length;i++){
    const label = document.createElement('label');
    label.id = order.rowCat[i].includes('#')?`${order.rowCat[i].replace('#','no').split(' ').join('_')}` :`${order.rowCat[i]}`;
    label.style.position = 'absolute';
    // const topMargin = deckglProps?.style?.top;
    // if(topMargin){
      // 17px
      // (order.colCat.length-i)*17
    
    // label.style.top = `${25+colLabelsWidth/2-(i+1)*8}px`;
    /* So height of each layer is 8 but it is pixel to convert to common unit we multiply it by 2 */
    // label.style.top = dimensions? `${dimensions[1]-40+(colLabelsWidth-(i+1)*16)}px` : `${325+(colLabelsWidth-(i+1)*16)}px`




    // label.style.top = `${dimensions[1]-0.1*dimensions[1]+ 5}px`
    label.style.top = `${dimensions[1]}px`

  
    label.textContent = `${capitalizeFirstLetter(order.rowCat[i])}`;
    if(order.row !== 'cluster'){
    label.addEventListener('click',()=>{
      setOrder((prevOrder:any) => ({ ...prevOrder, sortByRowCat:order.rowCat[i]}))
    });}
    const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
    label.style.fontSize = '14px';
    label.style.fontFamily = 'Arial, sans-serif';
    label.style.fontWeight = '525';
    const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
    const width = getTextWidth(label.textContent,labelFont)
    label.style.width = `${width}px`;
    label.style.color = '#333333';
    label.style.textAlign= 'right';
    /*We added 10 pixel because the panel icon has 10 pixel width */
     // Rotate the label to be vertical
     label.style.transform = 'rotate(90deg)';
     label.style.transformOrigin = 'top left';
    label.style.left = `${175 + rowLabelsWidth}px` //isDrawerOpen?`${190+rowLabelsWidth-width-offset}px`:`${30+rowLabelsWidth-width-offset}px`;
    // label.style.border = '1px solid black';
    containerElement.appendChild(label);

  }

  }


  // const { viewStates, onViewStateChange, visibleIndices } = useViewStates(
  //   container,
  //   dimensions,
  //   heatmapStateRef.current,
  //   dataStateRef.current,
  //   panelWidth
  // // Add this parameter
  // );

  const { viewStates, onViewStateChange, visibleIndices } = useViewStates(
    container,
    dimensions,
    heatmapStateRef.current,
    dataStateRef.current,
    panelWidth,
    searchTerm, // Add the search term parameter
    colLabelsWidth // Add the column labels width parameter
  );
  


  console.log('****** visible indices are as follows *****',visibleIndices?.length)
  if(dataStateRef.current){
    console.log('****** total cells are as follows ******',dataStateRef.current?.numColumns *dataStateRef.current?.numRows )

  }

  // const { viewStates, onViewStateChange } = useViewStates(
  //   container,
  //   dimensions,
  //   heatmapState,
  //   dataState,
  //   // rowLabelIndex,
  //   // labels
  // );

  const views = useViews({
    colLabelsWidth,
    rowLabelsWidth,
    dimensions,
    debug,
    panelWidth
  });


  // LAYERS
  // const layers = useMemo(
  //   () =>
  //     getLayers({
  //       dataState,
  //       heatmapState,
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
  //       setOrder,
  //       setHoveredLabelRow,
  //       hoveredLabelRow,
  //       setHoveredLabelCol,
  //       hoveredLabelCol,
  //     }),
  //   [
  //     colLabelsWidth,
  //     columnLabelsTitle,
  //     dataState,
  //     debug,
  //     heatmapState,
  //     labels,
  //     onClick,
  //     rowLabelsTitle,
  //     rowLabelsWidth,
  //     viewStates,
  //     searchTerm,
  //     order,
  //     colClustGroup,
  //     rowClustGroup,
  //     OpacityValue,
  //     pvalThreshold,
  //     pvalData,
  //     setHoveredLabelRow,
  //     hoveredLabelRow,
  //     setHoveredLabelCol,
  //     hoveredLabelCol,
  //   ]
  // );


  const layers = useMemo(
    () =>
      getLayers({
        dataState: dataStateRef.current,
        heatmapState: heatmapStateRef.current,
        visibleIndices,
        viewStates,
        onClick,
        labels,
        debug,
        colLabelsWidth,
        rowLabelsWidth,
        rowLabelsTitle,
        columnLabelsTitle,
        searchTerm,
        order,
        categories:catTemporary,
        rowSliderVal:rowClustGroup,
        colSliderVal:colClustGroup,
        opacityVal:OpacityValue,
        pvalThreshold,
        pvalData,
      }),
    [
      colLabelsWidth,
      // columnLabelsTitle,
      labels,
      onClick,
      visibleIndices,
      // rowLabelsTitle,
      rowLabelsWidth,
      viewStates,
      searchTerm,
      order,
      colClustGroup,
      rowClustGroup,
      // pvalData,
      datastateVersion,
      heatmapstateVersion,
      OpacityValue
    ]
  );





  
  // const legendComponent = <Legend2 
  //                       min={dataState?.min || 0}
  //                       max={dataState?.max || 0}
  //                       maxColor="#FF0000"
  //                       minColor="#0000FF"
  //                       legendWidth={legend?.width}
  //                       legendHeight={legend?.height}
  //                       fontSize={legend?.fontSize}
  //                       unit={unit}
  //                       />


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
 
  

useEffect(()=>{
  if(!isDrawing){
    if(cropBox && heatmapStateRef.current?.cellDimensions){

      const startX  = cropBox.startX - rowLabelsWidth;
      const endX = cropBox.endX - rowLabelsWidth;
      const startY = cropBox.startY - colLabelsWidth;
      const endY = cropBox.endY - colLabelsWidth;
    
    
      const width = endX - startX
    
      const wd = heatmapStateRef.current?.cellDimensions.width*2
      const ht = heatmapStateRef.current?.cellDimensions.height*2
      const colStartIdx =  Math.floor(startX/wd)
      const colEndIdx = Math.floor(endX/wd)
      const rowStartIdx = Math.floor(startY/ht)
      const rowEndIdx = Math.floor(endY/ht)
  
      const filterdeDict = {
        startX:colStartIdx,
        startY: rowStartIdx,
        endX: colEndIdx,
        endY: rowEndIdx,
      }
      setFilteredIdxDict(filterdeDict)
    
       
    }
  }
  
},[isDrawing])


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
          parent={container}
          style={merge({ position: "relative" }, deckglProps?.style || {})} // ✅ Changed to relative
          views={views}
          layerFilter={layerFilter}
          // @ts-ignore
          onViewStateChange={onViewStateChange}
          viewState={viewStates}
          layers={layers}
          getTooltip={tooltipFunction && isHovering ? tooltipFunction : null}
          onClick={(event) => {
            const obj = event.object;
            if (obj?.id === "row-cluster") {
              setClickedClusterData({ Nodes: obj.nodes, Group: obj.text });
              setIsTableVisible(true);
            }
          }}
        >
          {/* {order.col === "cluster" && (
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
              width={8}
            />
          )} */}
  
          {isTableVisible && clickedClusterData && (ID.includes("olink") || ID.includes("nanostring") || ID.includes("rna")) && (
            <div>
              <MySnackbar 
                setVisibilty={setIsTableVisible} 
                setHovering={setHovering} 
                data={clickedClusterData} 
                id={ID} 
                corr_matrix={data["corr_matrix"]}
              />
            </div>
          )}
        </DeckGL>
//   <DeckGL

//   ref={containerRefDeckgl}
//   getCursor={(cursorState: any) => {
//     if (cursorState.isDragging) {
//       return 'grab';
//     }
//     // return 'crosshair';
//     return 'pointer';

//   }}
//   {...deckglProps}
//   width="100%"
//   height="100%"
//   parent={container}
//   style={merge(
//     { position: position ?? 'absolute' },
//     deckglProps?.style || {},
//   )}
//   views={views}
//   layerFilter={layerFilter}
//   // @ts-ignore
//   onViewStateChange={onViewStateChange}
//   viewState={viewStates}
//   layers={layers}
//   onClick={(event: any)=>{
//     const obj = event.object
//     if(obj.id === 'row-cluster'){
//       const clusterData = {'Nodes':obj.nodes,'Group':obj.text}
//       setClickedClusterData(clusterData)
//       setIsTableVisible(true)
//     }

//   }}

//   getTooltip={
//     tooltipFunction && isHovering
//       ? tooltipFunction
//       : null
//   }
// >
// {order.col === 'cluster' && (<CustomSlider
//   direction='vertical' 
//   setClusterValue={setColClusterValue}
//   width={order.colCat.length > 0?colLabelsWidth:8}
// />)}

// {/* The height of row cluster layer is 5 so thats why width is 5 provided */}
// {order.row === 'cluster' && (<CustomSlider
//   direction='horizontal' 
//   setClusterValue={setRowClusterValue}
//   width={8}
// />)}

// {isTableVisible && clickedClusterData && ID.includes('olink') && (
//         <div>
//           <MySnackbar setVisibilty={setIsTableVisible} setHovering = {setHovering} data={clickedClusterData}/> 
//         </div>
//       )}
// </DeckGL>

}

const height = container.offsetHeight;
console.log('******** container height is as follows ********', height)

const heatmapHeight = heatmapStateRef.current?.height
console.log('******** heatmap state height is as follows ******', heatmapHeight)

console.log('******** calculated heatmap height is *********',0.9*height - colLabelsWidth)

console.log('############### datastate ref current is as follows #############',dataStateRef.current)


// const SearchIndicator = ({ searchTerm, onClear }: { searchTerm: string, onClear: () => void }) => {
//   if (!searchTerm) return null;
  
//   return (
//     <div style={{
//       position: 'absolute',
//       top: '10px',
//       right: '20px',
//       backgroundColor: 'rgba(0, 0, 0, 0.7)',
//       color: 'white',
//       padding: '6px 12px',
//       borderRadius: '4px',
//       display: 'flex',
//       alignItems: 'center',
//       gap: '8px',
//       zIndex: 1000,
//       fontSize: '14px'
//     }}>
//       <span>Searching: <b>{searchTerm}</b></span>
//       <button
//         onClick={onClear}
//         style={{
//           background: 'none',
//           border: 'none',
//           color: 'white',
//           cursor: 'pointer',
//           fontSize: '16px',
//           padding: '0',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center'
//         }}
//       >
//         ✕
//       </button>
//     </div>
//   );
// };


return heatmapStateRef.current?.cellData && container && layers ? (
  <div style={{height:'100%',width:'100%'}}>
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
      />
    <div style={{ flex: "1 1 0" }}>  {/* This will be a container for the heatmap and whitespace */}
    <div id="heatmapDiv" style={{
      height:`${HEATMAP_HEIGHT}%`,
      width: `${HEATMAP_WIDTH}%`,  // Take 95% of the parent container's width
      overflow:'visible',
      transform: `translateX(${isDrawerOpen ? `${0}px` : `${-panelWidth}px`})`,
      transition: 'transform 0.3s ease'
    }}
    ref={heatmapRef}
    onMouseDown={handleMouseDown}
    >
      {/* {searchTerm && (
  <SearchIndicator 
    searchTerm={searchTerm} 
    onClear={() => setSearchTerm("")} 
  />
)} */}
      {deckGlInstance}
      {cropBox && isDrawing && (
        <div style={{
          position: 'absolute',
          left: cropBox.startX,
          top: cropBox.startY,
          width: cropBox.endX - cropBox.startX,
          height: cropBox.endY - cropBox.startY,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
        }}/>
      )}
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
    <div id="chatGptDivison" style={{
      width: "30%",  // Adjust width as needed
      height: "10%",  // Height of the division
      display: "flex",  // Flexbox to ensure full-size TextField
      marginLeft:"45.5%",
      // marginTop:"2%",
      alignItems: "center",  // Align items vertically
      justifyContent: "center",  // Align items horizontally
    }}>
      <TextField
        id="outlined-basic"
        label="Chat with AI"
        variant="outlined"
        multiline={true}
        rows={1}
        value={inputValue}  // Bind the state to the TextField value
        onChange={(e) => setInputValue(e.target.value)}  // Update state on input change
        fullWidth={true}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                style={{ cursor: "pointer" }}
                aria-label="send message"
                onClick={handleSendClick}  // Handle the send button click
                // onClick={handleOllamaSendClick}
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        style={{
          backgroundImage: `url(${rotatingGifUrl})`,  // Set GIF as background
          backgroundSize: "cover",  // Full width and height for the background
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  </div>
) : null;
};

