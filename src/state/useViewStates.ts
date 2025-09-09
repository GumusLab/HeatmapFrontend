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
import { WebMercatorViewport } from '@deck.gl/core/typed';

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
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  const animationRef = useRef<number | null>(null);
  const viewStateRef = useRef<any|null>(null);


  const initialViewState = useMemo(
    () => {
      // Create a default state that always returns a valid object
      const defaultState = {
        target: [0, 0],
        zoom: BASE_ZOOM,
        minZoom: BASE_ZOOM - 10,
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
        minZoom: BASE_ZOOM - 10,
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

  useEffect(() => {
    viewStateRef.current = viewStates;
  }, [viewStates]);
  

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
    const currentState = viewStateRef.current;

    // const startState = {
    //   target: [...viewStates[IDS.VIEWS.HEATMAP_GRID].target],
    //   zoom: viewStates[IDS.VIEWS.HEATMAP_GRID].zoom as number
    // };

    console.log("********* Hola I am in the animate ViewState function *********")

    const startState = {
      target: [...currentState[IDS.VIEWS.HEATMAP_GRID].target],
      zoom: currentState[IDS.VIEWS.HEATMAP_GRID].zoom as number
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

      console.log("********* newTargetX is as follows *********",newTargetX)
      console.log("********* newTargetY is as follows *********",newTargetY)


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
    // if (animationRef.current !== null) {
    //   cancelAnimationFrame(animationRef.current);
    // }
  }, []);

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
    
    // Get the row labels from dataState
    const rowLabels = dataState.rowLabels || [];
    
    // Find indices of matching row labels (case insensitive search)
    const matchingIndices = rowLabels
      .map((label, index) => (
        label.text.toLowerCase().includes(searchTerm.toLowerCase()) ? index : -1
      ))
      .filter(index => index !== -1);

    
    if (matchingIndices.length > 0) {
      
      // Calculate the bounds of the matching cells
      const cellDimensions = heatmapState.cellDimensions;
      const firstMatchIdx = Math.min(...matchingIndices);
      const lastMatchIdx = Math.max(...matchingIndices);

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
      
    } else {
      console.log(`No matches found for search term: ${searchTerm}`);
    }
  }
}, [searchTerm, colLabelsWidth, animateViewState, dataState, dimensions, heatmapState]);


  useEffect(() => {
    console.log('🔥 FIRST useEffect TRIGGERED - Initial visibleIndices calculation');
    console.log('🔥 Dependencies:', {
      heatmapState: !!heatmapState,
      dataState: !!dataState,
      dimensions: !!dimensions,
      heatmapStateWidth: heatmapState?.width || 0,
      heatmapStateHeight: heatmapState?.height || 0,
      dataStateTimestamp: Date.now()
    });
    
    if (heatmapState && dataState && dimensions) {

      console.log('********* heatmapState?.cellDimensions is as follows *********',heatmapState?.cellDimensions)
        console.log('🔥 CALCULATING INITIAL VISIBLE INDICES (BASE ZOOM)');
        
        // --- This part remains the same ---
        const { width: cellWidth, height: cellHeight } = heatmapState.cellDimensions;
        const { numColumns, numRows } = dataState;
        const offsetX = heatmapState.width / 4;
        const offsetY = heatmapState.height / 4;
        const visibleArea = {
            minX: -heatmapState.width / 4,
            minY: -heatmapState.height / 4,
            maxX: heatmapState.width / 4,
            maxY: heatmapState.height / 4
        };

        console.log('🔥 Initial calculation params:', {
          cellWidth, cellHeight, numColumns, numRows,
          offsetX, offsetY, visibleArea
        });

        // --- START: OPTIMIZATION ---

        // 1. Calculate the visible range of row and column INDICES from the visibleArea coordinates.
        // We use Math.floor for the start and Math.ceil for the end to ensure we cover partial cells.
        const startCol = Math.max(0, Math.floor((visibleArea.minX + offsetX) / cellWidth));
        const endCol = Math.min(numColumns - 1, Math.ceil((visibleArea.maxX + offsetX) / cellWidth));
        
        const startRow = Math.max(0, Math.floor((visibleArea.minY + offsetY) / cellHeight));
        const endRow = Math.min(numRows - 1, Math.ceil((visibleArea.maxY + offsetY) / cellHeight));
        
        console.log('🔥 Calculated ranges:', {
          startCol, endCol, startRow, endRow
        });
        
        // 2. Build the array of visible indices directly from the calculated range.
        //    This avoids iterating through millions of cells.
        const newVisibleIndices = [];
        // This assumes the flat `cellData` array is sorted by row, then by column (row-major).
        for (let r = startRow; r <= endRow; r++) {
            // The starting index in the flat array for the current row `r`.
            const rowStartIndex = r * numColumns;
            for (let c = startCol; c <= endCol; c++) {
                // The index for the cell at (r, c) is simply its position in the sorted grid.
                const cellIndex = rowStartIndex + c;
                newVisibleIndices.push(cellIndex);
            }
        }
        
        console.log('🔥 NEW VISIBLE INDICES FROM FIRST useEffect:', {
          count: newVisibleIndices.length,
          first10: newVisibleIndices.slice(0, 10),
          last10: newVisibleIndices.slice(-10)
        });
        
        setVisibleIndices(newVisibleIndices);
        console.log('🔥 FIRST useEffect COMPLETED - visibleIndices set');

        // --- END: OPTIMIZATION ---
    } else {
        console.log('🔥 FIRST useEffect SKIPPED - missing dependencies');
    }
}, [heatmapState?.cellDimensions?.width, heatmapState?.cellDimensions?.height]);









const onViewStateChange = useCallback(
  (params: ViewStateChangeProps) => {
    const { viewId, viewState } = params;

    // 1) Skip if search‑animation is controlling the camera
    if (isSearchZooming) {
      return;
    }

    // 2) Grab the previous heatmap viewState from the ref
    const prevVS = viewStateRef.current[IDS.VIEWS.HEATMAP_GRID];

    // 3) If we’re in the HEATMAP_GRID and zoom actually changed, snap target back
    if (
      viewId === IDS.VIEWS.HEATMAP_GRID &&
      viewState.zoom !== prevVS.zoom
    ) {
      viewState.target = [...prevVS.target];
    }

    // 4) Your existing constraints: keep target within data bounds
    if (heatmapState && dataState && dimensions) {
      const cellW = heatmapState.cellDimensions.width;
      const cellH = heatmapState.cellDimensions.height;
      const dataW = dataState.numColumns * cellW;
      const dataH = dataState.numRows    * cellH;

      // Calculate how big the viewport is in world‐space
      const scale = 2 ** (viewState.zoom - BASE_ZOOM);
      const viewW = heatmapState.width  / scale;
      const viewH = heatmapState.height / scale;
      const halfW = viewW / 4;  // because your offset logic divides by 4
      const halfH = viewH / 4;

      const offsetX = heatmapState.width  / 4;
      const offsetY = heatmapState.height / 4;

      const minX = -offsetX + halfW;
      const minY = -offsetY + halfH;
      const maxX =  dataW    - offsetX - halfW;
      const maxY =  dataH    - offsetY - halfH + 17; // your +17 hack

      viewState.target = [
        clamp(viewState.target[0], minX, maxX),
        clamp(viewState.target[1], minY, maxY)
      ];
    }

    // 5) Recompute visibleIndices for the new viewState
    if (viewId === IDS.VIEWS.HEATMAP_GRID && heatmapState && dataState && dimensions) {
      const { width: cellW, height: cellH } = heatmapState.cellDimensions;
      const { numColumns, numRows } = dataState;
      const scale = 2 ** (viewState.zoom - BASE_ZOOM);
      const viewW = heatmapState.width  / scale;
      const viewH = heatmapState.height / scale;
      const halfW = viewW / 4;
      const halfH = viewH / 4;
      const offsetX = heatmapState.width  / 4;
      const offsetY = heatmapState.height / 4;

      const area = {
        minX: viewState.target[0] - halfW,
        maxX: viewState.target[0] + halfW,
        minY: viewState.target[1] - halfH,
        maxY: viewState.target[1] + halfH,
      };

      const startCol = clamp(Math.floor((area.minX + offsetX) / cellW), 0, numColumns - 1);
      const endCol   = clamp(Math.ceil ((area.maxX + offsetX) / cellW), 0, numColumns - 1);
      const startRow = clamp(Math.floor((area.minY + offsetY) / cellH), 0, numRows    - 1);
      const endRow   = clamp(Math.ceil ((area.maxY + offsetY) / cellH), 0, numRows    - 1);

      const newVisible: number[] = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          newVisible.push(r * numColumns + c);
        }
      }
      setVisibleIndices(newVisible);
    }

    // 6) Finally, push all three viewStates back into React state
    if (viewId === IDS.VIEWS.HEATMAP_GRID) {
      setViewStates((cur) => ({
        [IDS.VIEWS.COL_LABELS]: {
          ...cur[IDS.VIEWS.COL_LABELS],
          zoom:   [viewState.zoom, BASE_ZOOM],
          target: [viewState.target[0], 0]
        },
        [IDS.VIEWS.ROW_LABELS]: {
          ...cur[IDS.VIEWS.ROW_LABELS],
          zoom:   [BASE_ZOOM, viewState.zoom],
          target: [0, viewState.target[1]]
        },
        [IDS.VIEWS.HEATMAP_GRID]: {
          ...viewState
        }
      }));
    }
  },
  [
    heatmapState,
    dataState,
    dimensions,
    isSearchZooming
  ]
);










//   const onViewStateChange = useCallback(
//     (params: ViewStateChangeProps) => {
//       // Skip external view state changes if a search zoom is in progress
//       if (isSearchZooming) {
//         return;
//       }
      
//       // const { viewId, viewState } = params;
//       // 1) Pull out the interactionState
//     const { viewId, viewState, interactionState } = params;

//     // 2) If this is a heatmap-grid zoom, freeze the target
//     if (
//       viewId === IDS.VIEWS.HEATMAP_GRID &&
//       interactionState.isZooming
//     ) {
//       // grab last-known target from the ref
//       const prevTarget = viewStateRef.current[IDS.VIEWS.HEATMAP_GRID].target;
//       viewState.target = [prevTarget[0], prevTarget[1]];
//     }

//       const { zoom } = viewState;

//       console.log('***** checkpoint 1 for target *********',viewState.target)

//       // Add zoom threshold detection
//       if (viewId === IDS.VIEWS.HEATMAP_GRID) {
//         // Define zoom threshold (adjust this value based on testing)
//         const ZOOM_OUT_THRESHOLD = BASE_ZOOM - 1.5;
        
//         // Check if we've crossed the threshold
//         if (zoom < ZOOM_OUT_THRESHOLD && !isZoomedOut) {
//           setIsZoomedOut(true);
//         } else if (zoom >= ZOOM_OUT_THRESHOLD && isZoomedOut) {
//           setIsZoomedOut(false);
//         }
//       }
  
//       console.log('***** checkpoint 2 for target *********',viewState.target)


//       const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);
  
//       // Constraint logic
//       if (heatmapState && dataState && dimensions) {
//         const cellWidth = heatmapState.cellDimensions.width;
//         const cellHeight = heatmapState.cellDimensions.height;
//         const dataWidth = dataState.numColumns * cellWidth;
//         const dataHeight = dataState.numRows * cellHeight;

//         const visibleWidth = heatmapState.width / nextScaleFactor;
//         const visibleHeight = heatmapState.height / nextScaleFactor;
        
//         // Calculate offset used in getHeatmapState
//         const heatmapWidth = heatmapState.width;
//         const heatmapHeight = heatmapState.height;
//         const offsetX = heatmapWidth / 4;
//         const offsetY = heatmapHeight / 4;
        
//         // Calculate half-dimensions of the visible viewport in world coordinates
//         const halfVisibleWidth = visibleWidth / 4;
//         const halfVisibleHeight = visibleHeight / 4;
//         // const halfVisibleWidth = 0
//         // const halfVisibleHeight = 0
        
//         // Minimum target constraints (to prevent white space at left/top)
//         // The minimum target should be: data's top-left corner plus half the visible area
//         const minTargetX = -offsetX + halfVisibleWidth;
//         const minTargetY = -offsetY + halfVisibleHeight;
        
//         // Maximum target constraints (to prevent white space at right/bottom)
//         const maxTargetX = dataWidth - offsetX - halfVisibleWidth;

//         // ********** 17 is added because last two rows are not visible, dont know why ********** //
//         const maxTargetY = dataHeight - offsetY - halfVisibleHeight+17;
        
//         // Apply constraints
//         viewState.target = [
//           clamp(viewState.target[X], minTargetX, maxTargetX),
//           clamp(viewState.target[Y], minTargetY, maxTargetY),
//         ];
//       }

//       console.log('***** checkpoint 3 for target *********',viewState.target)


// // This is the optimized replacement for the block inside your onViewStateChange handler

// if (viewId === IDS.VIEWS.HEATMAP_GRID && heatmapState && dataState && dimensions) {
//   // --- Your original, trusted logic for calculating visible area ---
//   // This part is kept exactly as you wrote it.
//   const { cellDimensions } = heatmapState;
//   const { width: cellWidth, height: cellHeight } = cellDimensions;
//   const { numColumns, numRows } = dataState;
//   const offsetX = heatmapState.width / 4;
//   const offsetY = heatmapState.height / 4;
  
//   // The `zoom` and `BASE_ZOOM` are needed for your scale factor calculation
//   const { zoom } = viewState;
//   const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);

//   const actualViewWidth = heatmapState.width / nextScaleFactor;
//   const actualViewHeight = heatmapState.height / nextScaleFactor;
  
//   const visibleArea = {
//       minX: viewState.target[0] - (actualViewWidth / 4),
//       minY: viewState.target[1] - (actualViewHeight / 4),
//       maxX: viewState.target[0] + (actualViewWidth / 4),
//       maxY: viewState.target[1] + (actualViewHeight / 4)
//   };

//   console.log('********* visibleArea is as follows *********',visibleArea)
  
//   // --- START: OPTIMIZED REPLACEMENT FOR THE for-loop ---

//   // 1. Calculate the visible range of row and column INDICES.
//   //    This converts the world coordinates from your visibleArea into grid indices.
//   const startCol = clamp(Math.floor((visibleArea.minX + offsetX) / cellWidth), 0, numColumns - 1);
//   const endCol = clamp(Math.ceil((visibleArea.maxX + offsetX) / cellWidth), 0, numColumns - 1);
//   const startRow = clamp(Math.floor((visibleArea.minY + offsetY) / cellHeight), 0, numRows - 1);
//   const endRow = clamp(Math.ceil((visibleArea.maxY + offsetY) / cellHeight), 0, numRows - 1);

//   // 2. Build the array of visible indices directly from this much smaller range.
//   //    This is extremely fast and avoids checking millions of cells.
//   const newVisibleIndices = [];
//   // This assumes your data is in row-major order, which it is.
//   for (let r = startRow; r <= endRow; r++) {
//       for (let c = startCol; c <= endCol; c++) {
//           // The formula for finding a cell's index in a row-major grid.
//           const cellIndex = r * numColumns + c;
//           newVisibleIndices.push(cellIndex);
//       }
//   }

//   console.log('🚀 NEW VISIBLE INDICES FROM onViewStateChange:', {
//     count: newVisibleIndices.length,
//     first10: newVisibleIndices.slice(0, 10),
//     last10: newVisibleIndices.slice(-10),
//     viewStateTarget: viewState.target,
//     zoom: viewState.zoom
//   });

//   setVisibleIndices(newVisibleIndices);

//   // --- END: OPTIMIZED REPLACEMENT ---
// }
// console.log('***** checkpoint 4 for target *********',viewState.target)

//       // Update all view states
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
//       console.log('***** checkpoint 5 for target *********',viewState.target)
//     },
//     [dataState, heatmapState, dimensions, isSearchZooming]
//   );

  return { viewStates, onViewStateChange, visibleIndices, isZoomedOut };
};