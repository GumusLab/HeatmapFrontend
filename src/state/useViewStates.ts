

// import type { InteractionState } from '@deck.gl/core/typed/controllers/controller';
// import { clamp, isNil, merge } from 'lodash';
// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { BASE_ZOOM, IDS, MAX_ZOOM,HEATMAP_WIDTH,HEATMAP_HEIGHT } from '../const';
// import type {
//   DataStateShape,
//   HeatmapStateShape,
//   ViewState,
//   ViewStates,
// } from '../types';

// export type ViewStateChangeProps = {
//   viewId: string;
//   viewState: Required<ViewState> & { zoom: number };
//   interactionState: InteractionState;
//   oldInteractionState?: Record<string, any>;
// };

// const X = 0;
// const Y = 1;

// export const useViewStates = (
//   container: HTMLDivElement | null,
//   dimensions: [number, number] | null,
//   heatmapState: HeatmapStateShape | null,
//   dataState: DataStateShape | null ,
//   panelWidth:number,
//   // rowIndex: number | null | undefined ,// add new prop for rowIndex
//   // labels:any,
// ) => {

//   const [visibleIndices, setVisibleIndices] = useState<number[] | null>(null);

//   const initialViewState = useMemo(
//     () => {
//       // Create a default state that always returns a valid object
//       const defaultState = {
//         target: [0, 0],
//         zoom: BASE_ZOOM,
//         minZoom: BASE_ZOOM-2,
//         maxZoom: MAX_ZOOM,
//         width: 0,  // Default width
//         height: 0, // Default height
//       };
      
//       // If dimensions are null, return the default state
//       if (!dimensions) return defaultState;
      
//       // Calculate actual heatmap dimensions
//       const availableWidth = dimensions[0] - panelWidth;
//       const heatmapWidth = availableWidth * HEATMAP_WIDTH/100; 
//       const heatmapHeight = dimensions[1] * HEATMAP_HEIGHT/100;
      
//       return {
//         target: [0, 0],
//         zoom: BASE_ZOOM,
//         minZoom: BASE_ZOOM-2,
//         maxZoom: MAX_ZOOM,
//         width: heatmapWidth,
//         height: heatmapHeight,
//       };
//     },
//     [dimensions, panelWidth]
//   );


//   const [viewStates, setViewStates] = useState<ViewStates>({
//             [IDS.VIEWS.COL_LABELS]: initialViewState,
//             [IDS.VIEWS.ROW_LABELS]: initialViewState,
//             [IDS.VIEWS.HEATMAP_GRID]: initialViewState,
//           });

//   useEffect(()=>{
//     if(
//       container &&
//       isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].width) &&
//       isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].height)
//     ) {

//       setViewStates((oldViewStates) => ({
//         [IDS.VIEWS.COL_LABELS]: merge(
//           initialViewState,
//           oldViewStates[IDS.VIEWS.COL_LABELS]
//         ),
//         [IDS.VIEWS.ROW_LABELS]: merge(
//           initialViewState,
//           oldViewStates[IDS.VIEWS.ROW_LABELS]
//         ),
//         [IDS.VIEWS.HEATMAP_GRID]: merge(
//           initialViewState,
//           oldViewStates[IDS.VIEWS.HEATMAP_GRID]
//         ),
//       }));

//     }
//   },[container, initialViewState, viewStates]);

//   // Add this useEffect to calculate initial visible indices
// useEffect(() => {
//   if (heatmapState?.contourData && dataState && dimensions) {
//     // Get initial viewport dimensions based on initial view state
//     const viewportWidth = heatmapState.width;// At BASE_ZOOM, no scaling needed
//     const viewportHeight = heatmapState.height;
    
//     // Initial visible area (centered at origin by default)
//     const visibleArea = {
//       minX: -viewportWidth / 4,
//       minY: -viewportHeight / 4,
//       maxX: viewportWidth / 4,
//       maxY: viewportHeight / 4
//     };
    
//     // Add buffer
//     const { width, height } = heatmapState.cellDimensions;
//     const bufferX = width;
//     const bufferY = height;
//     const expandedArea = {
//       minX: visibleArea.minX - bufferX + bufferX,
//       minY: visibleArea.minY - bufferY + bufferY,
//       maxX: visibleArea.maxX + bufferX - bufferX,
//       maxY: visibleArea.maxY + bufferY - bufferY
//     };
    
//     // Filter to only cells in the initial visible area
//     const initialVisibleIndices = [];
//     const totalCells = heatmapState.cellData.rowIndices.length;
    
//     for (let i = 0; i < totalCells; i++) {
//       const x = heatmapState.contourData[i * 2];
//       const y = heatmapState.contourData[i * 2 + 1];
      
//       if (
//         x + width >= expandedArea.minX && 
//         x <= expandedArea.maxX &&
//         y + height >= expandedArea.minY && 
//         y <= expandedArea.maxY
//       ) {
//         initialVisibleIndices.push(i);
//       }
//     }
    
//     // Set initial visible indices
//     setVisibleIndices(initialVisibleIndices);
//   }
// }, [heatmapState, dataState, dimensions]);

//   const onViewStateChange = useCallback(
//     (params: ViewStateChangeProps) => {
//       const { viewId, viewState } = params;
//       const { zoom } = viewState;
  
//       const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);
  
 

//       // Uncomment this section and modify
// if (heatmapState && dataState && dimensions) {
//   const cellWidth = heatmapState.cellDimensions.width;
//   const cellHeight = heatmapState.cellDimensions.height;
//   const dataWidth = dataState.numColumns * cellWidth;
//   const dataHeight = dataState.numRows * cellHeight;

  
// const visibleWidth = heatmapState.width / nextScaleFactor;
// const visibleHeight = heatmapState.height / nextScaleFactor;
//   // Calculate offset used in getHeatmapState
//   const heatmapWidth = heatmapState.width;
//   const heatmapHeight = heatmapState.height;
//   const offsetX = heatmapWidth/4 ;
//   const offsetY = heatmapHeight/4;
  
//     // Calculate half-dimensions of the visible viewport in world coordinates
//     const halfVisibleWidth = visibleWidth / 4;
//     const halfVisibleHeight = visibleHeight / 4;
    
//     // Minimum target constraints (to prevent white space at left/top)
//     // The minimum target should be: data's top-left corner plus half the visible area
//     const minTargetX = -offsetX + halfVisibleWidth;
//     const minTargetY = -offsetY + halfVisibleHeight;
    
//     // Maximum target constraints (to prevent white space at right/bottom)
//     const maxTargetX = dataWidth - offsetX - halfVisibleWidth;
//     const maxTargetY = dataHeight - offsetY - halfVisibleHeight;
    
//     // Apply constraints
//     viewState.target = [
//       clamp(viewState.target[X], minTargetX, maxTargetX),
//       clamp(viewState.target[Y], minTargetY, maxTargetY),
//     ];
  
//   // Rest of your zoom code...
// }

//      // In your viewport culling logic
// if (viewId === IDS.VIEWS.HEATMAP_GRID && heatmapState && heatmapState.contourData && dimensions) {
//   const { contourData, cellDimensions } = heatmapState;
//   const { width, height } = cellDimensions;
//   const totalCells = heatmapState.cellData.rowIndices.length;
  
  
//   // Get the actual view dimensions (not the viewState dimensions)
//   const actualViewWidth = heatmapState.width;
//   const actualViewHeight = heatmapState.height
  
  
//   // Calculate the visible area in world coordinates
//  // Calculate the visible area in world coordinates
// const visibleArea = {
//   minX: viewState.target[0] - (actualViewWidth / 4) / nextScaleFactor,
//   minY: viewState.target[1] - (actualViewHeight / 4 ) / nextScaleFactor,
//   maxX: viewState.target[0] + (actualViewWidth / 4 ) / nextScaleFactor,
//   maxY: viewState.target[1] + (actualViewHeight / 4) / nextScaleFactor
// };


//   // Filter to only cells in the visible area
//   const newVisibleIndices = [];
//   for (let i = 0; i < totalCells; i++) {
//     const x = contourData[i * 2];
//     const y = contourData[i * 2 + 1];
    
//     if (
//       x + width > visibleArea.minX && 
//       x < visibleArea.maxX &&
//       y + height > visibleArea.minY && 
//       y < visibleArea.maxY
//     ) {
//       newVisibleIndices.push(i);
//     }
//   }
  
//   setVisibleIndices(newVisibleIndices);
// }
//       if (viewId === IDS.VIEWS.HEATMAP_GRID) {
//         setViewStates((currentViewStates: ViewStates) => ({
//           [IDS.VIEWS.COL_LABELS]: {
//             ...currentViewStates[IDS.VIEWS.ROW_LABELS],
//             zoom: [viewState.zoom, BASE_ZOOM],
//             target: [viewState.target[X], 0],
//           },
//           [IDS.VIEWS.ROW_LABELS]: {
//             ...currentViewStates[IDS.VIEWS.ROW_LABELS],
//             zoom: [BASE_ZOOM, viewState.zoom],
//             target: [0, viewState.target[Y]],
//           },
//           [IDS.VIEWS.HEATMAP_GRID]: {
//             ...viewState,
//           },
//         }));
//       }
//     },
//     [dataState, heatmapState]
//   );
  

//   return { viewStates, onViewStateChange, visibleIndices };
// };


import type { InteractionState } from '@deck.gl/core/typed/controllers/controller';
import { clamp, isNil, merge } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASE_ZOOM, IDS, MAX_ZOOM, HEATMAP_WIDTH, HEATMAP_HEIGHT } from '../const';
import type {
  DataStateShape,
  HeatmapStateShape,
  ViewState,
  ViewStates,
} from '../types';

export type ViewStateChangeProps = {
  viewId: string;
  viewState: Required<ViewState> & { zoom: number };
  interactionState: InteractionState;
  oldInteractionState?: Record<string, any>;
};

const X = 0;
const Y = 1;

// Custom easing function for smooth animation
const easeInOutCubic = (t: number): number => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const useViewStates = (
  container: HTMLDivElement | null,
  dimensions: [number, number] | null,
  heatmapState: HeatmapStateShape | null,
  dataState: DataStateShape | null,
  panelWidth: number,
  searchTerm?: string,
  colLabelsWidth?: number
) => {
  const [visibleIndices, setVisibleIndices] = useState<number[] | null>(null);
  const [isSearchZooming, setIsSearchZooming] = useState(false);
  const animationRef = useRef<number | null>(null);

  const initialViewState = useMemo(
    () => {
      // Create a default state that always returns a valid object
      const defaultState = {
        target: [0, 0],
        zoom: BASE_ZOOM,
        minZoom: BASE_ZOOM - 2,
        maxZoom: MAX_ZOOM,
        width: 0,
        height: 0,
      };
      
      // If dimensions are null, return the default state
      if (!dimensions) return defaultState;
      
      // Calculate actual heatmap dimensions
      const availableWidth = dimensions[0] - panelWidth;
      const heatmapWidth = availableWidth * HEATMAP_WIDTH / 100; 
      const heatmapHeight = dimensions[1] * HEATMAP_HEIGHT / 100;
      
      return {
        target: [0, 0],
        zoom: BASE_ZOOM,
        minZoom: BASE_ZOOM - 2,
        maxZoom: MAX_ZOOM,
        width: heatmapWidth,
        height: heatmapHeight,
      };
    },
    [dimensions, panelWidth]
  );

  const [viewStates, setViewStates] = useState<ViewStates>({
    [IDS.VIEWS.COL_LABELS]: initialViewState,
    [IDS.VIEWS.ROW_LABELS]: initialViewState,
    [IDS.VIEWS.HEATMAP_GRID]: initialViewState,
  });

  // Custom animation function that doesn't rely on FlyToInterpolator
  const animateViewState = useCallback((
    targetX: number, 
    targetY: number, 
    targetZoom: number, 
    duration: number = 50
  ) => {
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = Date.now();
    const startState = {
      target: [...viewStates[IDS.VIEWS.HEATMAP_GRID].target],
      zoom: viewStates[IDS.VIEWS.HEATMAP_GRID].zoom as number
    };

    // Ensure startState.target is properly typed
    const startX = Array.isArray(startState.target) ? startState.target[0] : 0;
    const startY = Array.isArray(startState.target) ? startState.target[1] : 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const easedT = easeInOutCubic(t);
      
      // Interpolate between start and end values
      const zoom = startState.zoom + (targetZoom - startState.zoom) * easedT;
      const newTargetX = startX + (targetX - startX) * easedT;
      const newTargetY = startY + (targetY - startY) * easedT;
      
      setViewStates((current) => ({
        [IDS.VIEWS.COL_LABELS]: {
          ...current[IDS.VIEWS.COL_LABELS],
          zoom: [zoom, BASE_ZOOM],
          target: [newTargetX, 0],
        },
        [IDS.VIEWS.ROW_LABELS]: {
          ...current[IDS.VIEWS.ROW_LABELS],
          zoom: [BASE_ZOOM, zoom],
          target: [0, newTargetY],
        },
        [IDS.VIEWS.HEATMAP_GRID]: {
          ...current[IDS.VIEWS.HEATMAP_GRID],
          zoom,
          target: [newTargetX, newTargetY],
        },
      }));
      
      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSearchZooming(false);
        animationRef.current = null;
      }
    };
    
    setIsSearchZooming(true);
    animationRef.current = requestAnimationFrame(animate);
  }, [viewStates]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      container &&
      isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].width) &&
      isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].height)
    ) {
      setViewStates((oldViewStates) => ({
        [IDS.VIEWS.COL_LABELS]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.COL_LABELS]
        ),
        [IDS.VIEWS.ROW_LABELS]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.ROW_LABELS]
        ),
        [IDS.VIEWS.HEATMAP_GRID]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.HEATMAP_GRID]
        ),
      }));
    }
  }, [container, initialViewState, viewStates]);

  // Effect to handle search term changes
useEffect(() => {
  if (
    searchTerm && 
    dataState && 
    heatmapState && 
    dimensions
  ) {
    console.log("Search term changed, attempting to find matches:", searchTerm);
    
    // Get the row labels from dataState
    const rowLabels = dataState.rowLabels || [];
    
    // Find indices of matching row labels (case insensitive search)
    const matchingIndices = rowLabels
      .map((label, index) => (
        label.text.toLowerCase().includes(searchTerm.toLowerCase()) ? index : -1
      ))
      .filter(index => index !== -1);


    console.log('****** MATCHING indices is as follows *******',matchingIndices)
    
    if (matchingIndices.length > 0) {
      console.log(`Found ${matchingIndices.length} matches for search term: ${searchTerm}`, matchingIndices);
      
      // Calculate the bounds of the matching cells
      const cellDimensions = heatmapState.cellDimensions;
      const firstMatchIdx = Math.min(...matchingIndices);
      const lastMatchIdx = Math.max(...matchingIndices);

      console.log('****** first index is as follows ******',firstMatchIdx)
      console.log('******* second match index is as follows *****',lastMatchIdx)
      
      // Use colLabelsWidth as the offset for the Y coordinate
      const colLabelsHeight = colLabelsWidth || 0;
      
      // Get heatmap dimensions for offset calculation
      const heatmapWidth = heatmapState.width;
      const heatmapHeight = heatmapState.height;
      
      // Calculate the offset used in the viewport coordinates
      const offsetX = heatmapWidth / 4;
      const offsetY = heatmapHeight / 4;
      
      // Calculate centerY based on cell positions in the grid
      // Remove the factor of 2 and properly account for the viewport offset
      const centerY = 
                      (firstMatchIdx + 1) * 
                      cellDimensions.height - 
                      offsetY;
                      // -colLabelsHeight/4 + 
      // Calculate appropriate zoom level
    
      


            // Calculate appropriate zoom level
      const matchSpan = (lastMatchIdx - firstMatchIdx + 1) * cellDimensions.height;
      const viewportHeight = dimensions[1] - colLabelsHeight;

      // Calculate zoom to fit all matches with padding
      const padding = 3.0; // Increase padding for less extreme zoom
      let targetZoom = Math.log2(viewportHeight / (matchSpan * padding));

      // Apply a dampening factor to reduce zoom intensity
      const zoomDampeningFactor = 0.7;
      targetZoom = targetZoom * zoomDampeningFactor;

      // Set a reasonable maximum zoom
      const reasonableMaxZoom = Math.min(MAX_ZOOM, BASE_ZOOM + 4); // Limit how far we can zoom in

      // Ensure zoom is within bounds
      targetZoom = Math.min(Math.max(targetZoom, viewStates[IDS.VIEWS.HEATMAP_GRID].minZoom), reasonableMaxZoom);
            
      // Get current X position (maintain horizontal position)
      const currentX = Array.isArray(viewStates[IDS.VIEWS.HEATMAP_GRID].target) 
        ? viewStates[IDS.VIEWS.HEATMAP_GRID].target[X] 
        : 0;
      
      // Use custom animation function
      animateViewState(currentX, centerY, targetZoom);
      
      console.log('Zooming to search matches:', {
        matchIndices: matchingIndices,
        centerY,
        offsetY,
        targetZoom
      });
    } else {
      console.log(`No matches found for search term: ${searchTerm}`);
    }
  }
}, [searchTerm, colLabelsWidth, animateViewState, dataState, dimensions, heatmapState, viewStates]);

  // Calculate initial visible indices
  useEffect(() => {
    if (heatmapState?.contourData && dataState && dimensions) {
      // Get initial viewport dimensions based on initial view state
      const viewportWidth = heatmapState.width;
      const viewportHeight = heatmapState.height;
      
      // Initial visible area (centered at origin by default)
      const visibleArea = {
        minX: -viewportWidth / 4,
        minY: -viewportHeight / 4,
        maxX: viewportWidth / 4,
        maxY: viewportHeight / 4
      };
      
      // Add buffer
      const { width, height } = heatmapState.cellDimensions;
      const bufferX = width;
      const bufferY = height;
      const expandedArea = {
        minX: visibleArea.minX - bufferX + bufferX,
        minY: visibleArea.minY - bufferY + bufferY,
        maxX: visibleArea.maxX + bufferX - bufferX,
        maxY: visibleArea.maxY + bufferY - bufferY
      };
      
      // Filter to only cells in the initial visible area
      const initialVisibleIndices = [];
      const totalCells = heatmapState.cellData.rowIndices.length;
      
      for (let i = 0; i < totalCells; i++) {
        const x = heatmapState.contourData[i * 2];
        const y = heatmapState.contourData[i * 2 + 1];
        
        if (
          x + width >= expandedArea.minX && 
          x <= expandedArea.maxX &&
          y + height >= expandedArea.minY && 
          y <= expandedArea.maxY
        ) {
          initialVisibleIndices.push(i);
        }
      }
      
      // Set initial visible indices
      setVisibleIndices(initialVisibleIndices);
    }
  }, [heatmapState, dataState, dimensions]);

  const onViewStateChange = useCallback(
    (params: ViewStateChangeProps) => {
      // Skip external view state changes if a search zoom is in progress
      if (isSearchZooming) {
        return;
      }
      
      const { viewId, viewState } = params;
      const { zoom } = viewState;
  
      const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);
  
      // Constraint logic
      if (heatmapState && dataState && dimensions) {
        const cellWidth = heatmapState.cellDimensions.width;
        const cellHeight = heatmapState.cellDimensions.height;
        const dataWidth = dataState.numColumns * cellWidth;
        const dataHeight = dataState.numRows * cellHeight;

        const visibleWidth = heatmapState.width / nextScaleFactor;
        const visibleHeight = heatmapState.height / nextScaleFactor;
        
        // Calculate offset used in getHeatmapState
        const heatmapWidth = heatmapState.width;
        const heatmapHeight = heatmapState.height;
        const offsetX = heatmapWidth / 4;
        const offsetY = heatmapHeight / 4;
        
        // Calculate half-dimensions of the visible viewport in world coordinates
        const halfVisibleWidth = visibleWidth / 4;
        const halfVisibleHeight = visibleHeight / 4;
        
        // Minimum target constraints (to prevent white space at left/top)
        // The minimum target should be: data's top-left corner plus half the visible area
        const minTargetX = -offsetX + halfVisibleWidth;
        const minTargetY = -offsetY + halfVisibleHeight;
        
        // Maximum target constraints (to prevent white space at right/bottom)
        const maxTargetX = dataWidth - offsetX - halfVisibleWidth;
        const maxTargetY = dataHeight - offsetY - halfVisibleHeight;
        
        // Apply constraints
        viewState.target = [
          clamp(viewState.target[X], minTargetX, maxTargetX),
          clamp(viewState.target[Y], minTargetY, maxTargetY),
        ];
      }

      // Viewport culling logic
      if (viewId === IDS.VIEWS.HEATMAP_GRID && heatmapState && heatmapState.contourData && dimensions) {
        const { contourData, cellDimensions } = heatmapState;
        const { width, height } = cellDimensions;
        const totalCells = heatmapState.cellData.rowIndices.length;
        
        // Get the actual view dimensions
        const actualViewWidth = heatmapState.width;
        const actualViewHeight = heatmapState.height;
        
        // Calculate the visible area in world coordinates
        const visibleArea = {
          minX: viewState.target[0] - (actualViewWidth / 4) / nextScaleFactor,
          minY: viewState.target[1] - (actualViewHeight / 4) / nextScaleFactor,
          maxX: viewState.target[0] + (actualViewWidth / 4) / nextScaleFactor,
          maxY: viewState.target[1] + (actualViewHeight / 4) / nextScaleFactor
        };

        // Filter to only cells in the visible area
        const newVisibleIndices = [];
        for (let i = 0; i < totalCells; i++) {
          const x = contourData[i * 2];
          const y = contourData[i * 2 + 1];
          
          if (
            x + width > visibleArea.minX && 
            x < visibleArea.maxX &&
            y + height > visibleArea.minY && 
            y < visibleArea.maxY
          ) {
            newVisibleIndices.push(i);
          }
        }
        
        setVisibleIndices(newVisibleIndices);
      }

      // Update all view states
      if (viewId === IDS.VIEWS.HEATMAP_GRID) {
        setViewStates((currentViewStates: ViewStates) => ({
          [IDS.VIEWS.COL_LABELS]: {
            ...currentViewStates[IDS.VIEWS.ROW_LABELS],
            zoom: [viewState.zoom, BASE_ZOOM],
            target: [viewState.target[X], 0],
          },
          [IDS.VIEWS.ROW_LABELS]: {
            ...currentViewStates[IDS.VIEWS.ROW_LABELS],
            zoom: [BASE_ZOOM, viewState.zoom],
            target: [0, viewState.target[Y]],
          },
          [IDS.VIEWS.HEATMAP_GRID]: {
            ...viewState,
          },
        }));
      }
    },
    [dataState, heatmapState, dimensions, isSearchZooming]
  );

  return { viewStates, onViewStateChange, visibleIndices };
};